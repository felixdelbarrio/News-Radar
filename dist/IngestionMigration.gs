function ingestionMigrationJob_(){return JSON.parse(properties_().getProperty('INGESTION_MIGRATION')||'null');}
function writeIngestionMigrationJob_(job){job.updated=new Date().toISOString();properties_().setProperty('INGESTION_MIGRATION',JSON.stringify(job));}
function ingestionMigrationPending_(){const job=ingestionMigrationJob_();return Boolean(job&&job.state!=='Completada'&&job.state!=='Prueba completada'&&job.state!=='Cancelada');}
function migrationSheet_(name,headers){let sheet=book_().getSheetByName(name);if(!sheet){sheet=book_().insertSheet(name);sheet.getRange(1,1,1,headers.length).setValues([headers]);}return sheet;}
function startIngestionMigration(dryRun=true){
  authorize_(true);return withForegroundWrite_(()=>{
    const previous=ingestionMigrationJob_();if(ingestionMigrationPending_())return previous;
    if(!dryRun&&previous?.invalid>0)throw Error('Revisa los registros con metadatos inválidos antes de publicar.');
    if(!dryRun&&(!previous||previous.state!=='Prueba completada'||previous.revision!==classificationRulesRevision_()||previous.taxonomy!==taxonomyRulesRevision_()||previous.candidateRevision!==(properties_().getProperty('CANDIDATES_REVISION')||'0')||previous.source!==newsStorageKey_()||previous.newsletterVersion!==newsletterArchiveVersion_()||previous.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')))throw Error('Ejecuta primero una prueba completa con las mismas reglas y corpus.');
    pruneNewsGenerations_();
    if(book_().getSheets().filter(sheet=>/^Noticias_backup_/.test(sheet.getName())).length>=4)throw Error('Archiva los backups verificados antes de crear otra migración.');
    const id=Utilities.getUuid().replace(/[^a-z0-9-]/gi,'').slice(0,36),source=newsStorageKey_(),candidates=candidateSheet_();
    const job={id,dryRun:dryRun!==false,state:'Pendiente',phase:'news',source,target:'Noticias_gen_'+id,backup:'Noticias_backup_'+id,candidateBackup:'Candidatos_backup_'+id,next:2,candidateNext:2,total:Math.max(0,newsSheet_().getLastRow()-1),candidateTotal:Math.max(0,candidates.getLastRow()-1),revision:classificationRulesRevision_(),taxonomy:taxonomyRulesRevision_(),candidateRevision:properties_().getProperty('CANDIDATES_REVISION')||'0',corpus:properties_().getProperty('NEWS_CONTENT_REVISION')||'0',digest:'',classified:0,invalid:0,recovered:0,started:new Date().toISOString(),pausedUntil:0};
    migrationSheet_(job.target,RADAR.sheets.Noticias);migrationSheet_(job.backup,RADAR.sheets.Noticias);migrationSheet_(job.candidateBackup,RADAR.sheets.Candidatos);
    writeIngestionMigrationJob_(job);ensureBackgroundWorker_();return job;
  });
}
function getIngestionMigrationStatus(){authorize_(true);return ingestionMigrationJob_();}
function verifiedMigrationWrite_(sheet,first,rows){
  if(!rows.length)return;const needed=first+rows.length-1;if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
  sheet.getRange(first,1,rows.length,rows[0].length).setNumberFormat('@').setValues(rows);SpreadsheetApp.flush();
  if(sha256_(JSON.stringify(rows))!==sha256_(JSON.stringify(sheet.getRange(first,1,rows.length,rows[0].length).getDisplayValues())))throw Error('La verificación del backup o de la generación ha fallado.');
}
function migrationNewsRow_(values){
  const row=Object.fromEntries(RADAR.sheets.Noticias.map((key,index)=>[key,values[index]])),labels=classification_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).labels,previous=savedNewsLabels_(row.clasificacion);
  row.clasificacion=JSON.stringify({...labels,...(previous.canonicalId?{canonicalId:previous.canonicalId}:{}),procedencia:previous.procedencia||{fuente:row.fuente,url:row.url,extracto:row.extracto?'historico:extracto':'historico:titular'}});
  row.taxonomia=JSON.stringify(taxonomyRecord_(row.titular,row.extracto));row.pais=newsCountry_(row);
  return RADAR.sheets.Noticias.map(key=>row[key]||'');
}
function ingestionMigrationBatch_(){
  const job=ingestionMigrationJob_();if(!ingestionMigrationPending_()||Number(job.pausedUntil)>Date.now())return;
  const started=Date.now();
  try{
    if(newsStorageKey_()===job.target&&dataGeneration_().snapshots){job.state='Completada';job.phase='complete';writeIngestionMigrationJob_(job);completeSnapshotJobs_();clearDashboardSnapshotRequest_();return;}
    if(job.newsletterVersion!==undefined&&job.newsletterVersion!==newsletterArchiveVersion_())throw Error('El archivo de newsletters ha cambiado; repite la prueba.');
    if(job.revision!==classificationRulesRevision_()||job.taxonomy!==taxonomyRulesRevision_()||job.candidateRevision!==(properties_().getProperty('CANDIDATES_REVISION')||'0')||job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')||newsStorageKey_()!==job.source)throw Error('El corpus o las reglas han cambiado; se bloquea la promoción.');
    if(job.phase==='news'){
      const size=Math.min(CLASSIFICATION_WORK.batchRows,job.total-job.next+2);
      if(size>0){
        const rows=book_().getSheetByName(job.source).getRange(job.next,1,size,RADAR.sheets.Noticias.length).getDisplayValues(),classified=rows.map(migrationNewsRow_);
        verifiedMigrationWrite_(book_().getSheetByName(job.backup),job.next,rows);verifiedMigrationWrite_(book_().getSheetByName(job.target),job.next,classified);
        job.digest=sha256_(job.digest+JSON.stringify(rows));job.invalid+=rows.filter(row=>!row[0]||!row[5]||!canonicalUrl_(row[7])||!Number.isFinite(Date.parse(row[1]))).length;job.classified+=size;job.next+=size;
      }
      if(job.next>job.total+1)job.phase='candidates';
    }else if(job.phase==='candidates'){
      const size=Math.min(CLASSIFICATION_WORK.batchRows,job.candidateTotal-job.candidateNext+2);
      if(size>0){
        const rows=candidateSheet_().getRange(job.candidateNext,1,size,RADAR.sheets.Candidatos.length).getDisplayValues(),target=book_().getSheetByName(job.target),count=job.total+job.recovered,known=new Set(count?target.getRange(2,8,count,1).getDisplayValues().flat().map(newsUrlIdentity_):[]),added=[];
        verifiedMigrationWrite_(book_().getSheetByName(job.candidateBackup),job.candidateNext,rows);
        for(const values of rows){
          const row=Object.fromEntries(RADAR.sheets.Candidatos.map((key,index)=>[key,values[index]])),provenance=JSON.parse(row.procedencia||'{}'),feed={name:row.fuente,kind:provenance.tipo||(domainMatches_(row.url,'news.google.com')?'profile':'rss'),capabilitySearch:provenance.capacidad===true,domain:provenance.dominio||(row.url.match(/^https:\/\/([^/]+)/)||[])[1],url:provenance.fuente||row.url,entity:row.entidad,country:row.pais,language:row.idioma,range:{from:row.fecha,to:row.fecha}},decision=evaluate_({title:row.titular,excerpt:row.extracto,url:row.url,date:row.fecha,source:provenance.medio||'',language:row.idioma,excerptSource:provenance.extracto},feed,new Date());
          if(!decision.item||known.has(newsUrlIdentity_(row.url)))continue;
          known.add(newsUrlIdentity_(row.url));const record=newsRecord_(decision.item,feed,new Date(row.capturada));record[0]=row.id;added.push(record);
        }
        verifiedMigrationWrite_(target,job.total+job.recovered+2,added);job.recovered+=added.length;job.candidateNext+=size;
      }
      if(job.candidateNext>job.candidateTotal+1){
        if(job.classified!==job.total)throw Error('Reconciliación incompleta.');
        job.phase='archives';job.archiveIndex=0;job.archiveNext=2;job.archiveChanged=0;job.newsletterVersion=newsletterArchiveVersion_();job.newsletterTargets={};job.newsletterSources={};
      }
    }else if(job.phase==='archives'){
      migrateNewsletterArchiveBatch_(job);
    }else if(job.phase==='snapshots'){dashboardSnapshotBatch_();return;}
    if(!['Prueba completada','Publicando'].includes(job.state))job.state='En curso';job.error='';job.pausedUntil=0;writeIngestionMigrationJob_(job);
    telemetry_('migracion_ingesta',Date.now()-started,'OK',JSON.stringify({phase:job.phase,classified:job.classified,total:job.total,invalid:job.invalid,recovered:job.recovered,dryRun:job.dryRun}));
  }catch(error){job.state='En pausa';job.error=String(error.message).slice(0,180);job.pausedUntil=Date.now()+settings_().retryMinutes*60000;writeIngestionMigrationJob_(job);telemetry_('migracion_ingesta',Date.now()-started,'Error',job.error);}
}

function writeStagedNewsRows_(sheet,records){
  const ordered=records.slice().sort((a,b)=>a.row-b.row);let start=0;
  for(let end=1;end<=ordered.length;end++){
    if(end<ordered.length&&ordered[end].row===ordered[end-1].row+1)continue;
    if(end>start)verifiedMigrationWrite_(sheet,ordered[start].row,ordered.slice(start,end).map(record=>record.values));start=end;
  }
}

function pruneNewsGenerations_(){
  const previous=JSON.parse(properties_().getProperty('PREVIOUS_DATA_GENERATION')||'{}'),migration=ingestionMigrationJob_(),classification=classificationJob_(),taxonomy=taxonomyJob_(),maintenance=maintenanceJob_(),keep=new Set(['Noticias',newsStorageKey_(),previous.newsSheet,migration?.source,migration?.target,classification?.source,classification?.target,maintenance?.source,maintenance?.target,taxonomy?.source,taxonomy?.target,taxonomy?.modelTarget,previous.taxonomySheet,taxonomyStorageKey_()]);
  for(const name of [...Object.values(dataGeneration_().newsletterTables||{}),...Object.values(previous.newsletterTables||{}),...Object.values(migration?.newsletterSources||{}),...Object.values(migration?.newsletterTargets||{})])keep.add(name);
  for(const sheet of book_().getSheets())if(/^(?:Newsletter(?:Contenido|Ediciones)_gen_|Noticias_(?:class_|gen_|tax_|maintenance_)|Taxonomia_gen_)/.test(sheet.getName())&&!keep.has(sheet.getName()))book_().deleteSheet(sheet);
}

function cancelIngestionMigration(){authorize_(true);return withForegroundWrite_(()=>{const job=ingestionMigrationJob_();if(job&&ingestionMigrationPending_()){job.state='Cancelada';writeIngestionMigrationJob_(job);}return job;});}

function migrateNewsletterArchiveBatch_(job){
  const name=NEWSLETTER_ARCHIVE_TABLES[job.archiveIndex],source=newsletterSheet_(name),targetName=name+'_gen_'+job.id;
  if(!book_().getSheetByName(targetName))source.copyTo(book_()).setName(targetName);
  job.newsletterTargets[name]=targetName;job.newsletterSources[name]=source.getName();
  const size=Math.min(CLASSIFICATION_WORK.batchRows,source.getLastRow()-job.archiveNext+1);
  if(size>0){
    const values=source.getRange(job.archiveNext,1,size,RADAR.sheets[name].length).getDisplayValues();
    for(const row of values)try{
      if(name==='NewsletterContenido'){
        const packed=JSON.parse(row[1]);if(!Array.isArray(packed)||!packed[0]||typeof packed[0]!=='object')throw Error('Snapshot inválido');
        if(Array.isArray(packed[0].senales)&&packed[0].senales.includes('Indisponibilidad de servicio')){packed[0].senales=[...new Set(packed[0].senales.map(signal=>signal==='Indisponibilidad de servicio'?INCIDENT_SIGNAL:signal))];row[1]=JSON.stringify(packed);job.archiveChanged++;}
      }else{
        const filters=JSON.parse(row[4]);if(filters?.signal==='Indisponibilidad de servicio'){filters.signal=INCIDENT_SIGNAL;row[4]=JSON.stringify(filters);job.archiveChanged++;}
      }
    }catch(_){job.invalid++;}
    verifiedMigrationWrite_(book_().getSheetByName(targetName),job.archiveNext,values);job.archiveNext+=size;
  }
  if(job.archiveNext>source.getLastRow()){job.archiveIndex++;job.archiveNext=2;}
  if(job.archiveIndex===NEWSLETTER_ARCHIVE_TABLES.length){
    if(job.invalid&&!job.dryRun)throw Error('Revisa los registros con metadatos inválidos antes de publicar.');
    job.phase=job.dryRun?'complete':'snapshots';job.state=job.dryRun?'Prueba completada':'Publicando';
    if(!job.dryRun){properties_().deleteProperty('DASHBOARD_SNAPSHOT_BUILD');requestDashboardSnapshots_(true);}
  }
}
