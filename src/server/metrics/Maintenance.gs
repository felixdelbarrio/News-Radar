const MAINTENANCE_POLICY=Object.freeze({batchRows:100,maxMs:8000});
function maintenanceJob_(){const raw=properties_().getProperty('MAINTENANCE_JOB');return raw?JSON.parse(raw):null;}
function saveMaintenanceJob_(job){job.updated=new Date().toISOString();properties_().setProperty('MAINTENANCE_JOB',JSON.stringify(snapshotJob_('MAINTENANCE_JOB',job)));}
function maintenanceCheckpoint_(job){job.state='Pendiente';job.error='';job.attempts=0;job.pausedUntil=0;saveMaintenanceJob_(job);}
function maintenance_(force=false){
 const previous=maintenanceJob_();if(!force&&previous&&previous.version===RADAR.version&&previous.state!=='Completada')return;
 const newsTotal=Math.max(0,newsSheet_().getLastRow()-1),candidateTotal=Math.max(0,candidateSheet_().getLastRow()-1);
 saveMaintenanceJob_({version:RADAR.version,newsTotal,candidateTotal,total:newsTotal+candidateTotal,next:2,firstRow:2,state:'Pendiente',phase:'logs',reviewed:0,corrected:0,consolidated:0,removed:0,started:new Date().toISOString()});ensureBackgroundWorker_();
}
function maintenanceTransientTimeout_(error){return /(?:tiempo de espera|timed out|timeout).*(?:hojas de c[aá]lculo|spreadsheet)|(?:hojas de c[aá]lculo|spreadsheet).*(?:tiempo de espera|timed out|timeout)/i.test(String(error?.message||error));}
function maintenanceRetryDelay_(attempts){return Math.min(30,Math.max(1,2**Math.min(5,Math.max(0,attempts-1))))*60000;}
function maintenanceReadyAt_(){const job=maintenanceJob_();return job&&!['Completada','Publicando'].includes(job.state)&&(job.state!=='Revisar'||maintenanceTransientTimeout_(job.error))?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function compactOperationalLogs_(){
 let done=0,complete=true;const conflicts=[];
 for(const name of LOG_TABLES){
  try{if(book_().getSheetByName(name)&&!archiveLogBatch_(name)){properties_().setProperty('LOG_ARCHIVE_DONE',String(done));complete=false;break;}done++;}
  catch(error){conflicts.push(String(error.message));}
 }
 properties_().setProperty('LOG_ARCHIVE_DONE',String(done));if(conflicts.length)throw Error(conflicts.join('; '));
 if(complete)properties_().deleteProperty('LOG_ARCHIVE_PENDING');return complete;
}

function deleteSheetRows_(sheet,positions){
 const rows=[...new Set(positions)].sort((a,b)=>b-a);for(let i=0;i<rows.length;){let end=i+1;while(end<rows.length&&rows[end]===rows[end-1]-1)end++;sheet.deleteRows(rows[end-1],end-i);i=end;}
}
function deduplicateNews_(){
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,count=Math.max(0,sheet.getLastRow()-1);if(!count)return 0;
 const revision=newsClassificationRevision_(),remove=[],rows=[],protectedIds=new Set(llmIndex_().keys());
 const metadata=sheet.getRange(2,1,count,8).getDisplayValues(),classifications=sheet.getRange(2,keys.indexOf('clasificacion')+1,count,1).getDisplayValues();
 for(const [index,values] of metadata.entries()){
  const row={...Object.fromEntries(keys.slice(0,8).map((key,i)=>[key,values[i]])),clasificacion:classifications[index][0],_sheetRow:index+2},labels=savedNewsLabels_(row.clasificacion),title=searchText_(row.titular),text=searchText_(row.titular+' '+row.extracto);
  const current=labels.schema===1&&labels.version===CLASSIFICATION_WORK.rulesVersion&&labels.revision===revision&&labels.contentHash===sha256_(JSON.stringify([title,text]));
  if(!protectedIds.has(row.id)&&current&&(!labels.digital||entityKey_(row.entidad)==='Santander'&&santanderExcluded_(text)))remove.push(row._sheetRow);else rows.push(row);
 }
 const aliases=[];uniqueNews_(translationIdentityRows_(rows),aliases);remove.push(...aliases.filter(alias=>!protectedIds.has(rows[alias.index].id)).map(alias=>rows[alias.index]._sheetRow));if(!remove.length)return 0;
 // Archived editions already contain complete frozen articles, so their IDs and content remain intact.
 const archives=[];for(let start=0;start<remove.length;start+=ARCHIVE_WORK.rows){const positions=remove.slice(start,start+ARCHIVE_WORK.rows),records=new Map(newsRowsAt_(positions.slice().sort((a,b)=>a-b)).map(row=>[row._sheetRow,keys.map(key=>row[key]||'')])),values=positions.map(position=>records.get(position));archives.push(archiveSpreadsheet_('Noticias',keys,values,configuration_().storage.primaryFolderId,'news:'+sha256_(JSON.stringify(values))));}
 deleteSheetRows_(sheet,remove);SpreadsheetApp.flush();for(const archive of archives)properties_().deleteProperty(archive.property);invalidateNews_();return remove.length;
}
function cleanDuplicateNews(){authorize_(true);return withForegroundWrite_(()=>({removed:deduplicateNews_()}));}
function maintenanceBatch_(maxMs=MAINTENANCE_POLICY.maxMs){
 const job=maintenanceJob_();if(!job||['Completada','Publicando'].includes(job.state)||job.state==='Revisar'&&!maintenanceTransientTimeout_(job.error)||backgroundPaused_())return;
 const started=Date.now();try{
  if(job.phase==='logs'){compactCollectionTasks_();persistCandidates_([]);pruneNewsGenerations_();if(compactOperationalLogs_()===false){maintenanceCheckpoint_(job);return;}job.phase='newsletters';maintenanceCheckpoint_(job);}
  if(job.phase==='newsletters'){
   if(!job.newslettersArchived){if(!archiveNewsletterBatch_()){const cursor=JSON.parse(properties_().getProperty('NEWSLETTER_ARCHIVE_CURSOR')||'{}');job.detail=formatText('Archivo de newsletters: {done}/{total} ediciones revisadas.',{done:Math.max(0,(cursor.next||2)-2),total:cursor.total||0});maintenanceCheckpoint_(job);return;}job.newslettersArchived=true;maintenanceCheckpoint_(job);}
   if(!compactNewsletterBatch_()){const compact=JSON.parse(properties_().getProperty('NEWSLETTER_COMPACTION_JOB')||'{}');job.detail=formatText('Compactación de newsletters: {done}/{total} ediciones.',{done:Math.max(0,(compact.next||2)-2),total:compact.total||0});maintenanceCheckpoint_(job);return;}job.phase='dedup';job.detail='';maintenanceCheckpoint_(job);
  }
  if(classificationPending_()||dailyCollectionPending_())return;
  if(job.phase==='dedup'){if(!auditMaintenanceIntegrity_(job)){maintenanceCheckpoint_(job);return;}job.removed+=deduplicateNews_();job.phase='news';job.newsTotal=Math.max(0,newsSheet_().getLastRow()-1);job.total=job.newsTotal+job.candidateTotal;}
  if(job.phase==='news'){
  const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,size=Math.min(MAINTENANCE_POLICY.batchRows,job.newsTotal-job.next+2),updates=[],items=taxonomyCatalog_();let read=0;
  const rows=size>0?sheet.getRange(job.next,1,size,keys.length).getDisplayValues():[];
  for(const values of rows){if(Date.now()-started>=maxMs||backgroundPaused_(true))break;const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),saved=savedNewsLabels_(row.clasificacion);const changed={clasificacion:JSON.stringify(saved),pais:newsCountry_(row),entidad:entityKey_(row.entidad),taxonomia:JSON.stringify(necessaryTaxonomyRecord_(row,items))};let corrected=false;for(const [key,value] of Object.entries(changed))if(value!==row[key]){updates.push({row:job.next+read,column:keys.indexOf(key)+1,value});corrected=true;}if(corrected)job.corrected++;read++;}
  writeNewsCells_(updates);if(updates.length)invalidateNews_(false);job.next+=read;job.reviewed+=read;job.state='Pendiente';if(job.next>job.newsTotal+1){job.phase='candidates';job.candidateNext=2;}
  }
  if(job.phase==='candidates'){
   const result=reclassifyCandidates_(job.candidateNext,MAINTENANCE_POLICY.batchRows,Math.max(0,maxMs-(Date.now()-started)));job.candidateNext=result.next;job.candidateTotal=result.total;job.total=job.newsTotal+result.total;job.corrected+=result.changed;job.state=result.done?'Completada':'Pendiente';
  }
  if(job.state==='Completada'&&!recoverMissingExcerptsBatch_(Math.min(Math.max(0,maxMs-(Date.now()-started)),4000)))job.state='Pendiente';
  job.error='';job.attempts=0;job.pausedUntil=0;if(job.state==='Completada'){compactOperationalLogs_();compactStorageDimensions_();requestDashboardSnapshots_(true);}saveMaintenanceJob_(job);
  telemetry_('mantenimiento',Date.now()-started,'OK',job.reviewed+' revisadas; '+job.removed+' noticias compactadas');
 }catch(error){job.attempts=Number(job.attempts||0)+1;job.error=String(error.message).slice(0,180);const transient=maintenanceTransientTimeout_(error);job.state=transient||job.attempts<3?'En pausa':'Revisar';job.pausedUntil=Date.now()+(transient?maintenanceRetryDelay_(job.attempts):settings_().retryMinutes*60000);saveMaintenanceJob_(job);telemetry_('mantenimiento',Date.now()-started,'Error',job.error);}
}
function drainMaintenanceRequest_(){const p=properties_();const day=p.getProperty('MAINTENANCE_REQUEST');if(!day)return;if(p.getProperty('MAINTENANCE_DAY')!==day){maintenance_();p.setProperty('MAINTENANCE_DAY',day);}p.deleteProperty('MAINTENANCE_REQUEST');}

// Explicit maintenance: keep a verified external archive before removing operational history.
function archiveAndCompactOperationalStorage(){
 authorize_(true);return withForegroundWrite_(()=>{
  const folder=archiveFolder_(configuration_().storage.primaryFolderId),source=book_(),archive=source.copy('News Radar · Archivo '+new Date().toISOString());
  fileInFolder_(archive.getId(),folder);
  for(const sheet of source.getSheets()){
   const backup=archive.getSheetByName(sheet.getName()),rows=sheet.getLastRow(),width=sheet.getLastColumn();
   if(!backup||rows!==backup.getLastRow()||width!==backup.getLastColumn()||rows&&width&&sha256_(JSON.stringify(sheet.getRange(1,1,rows,width).getDisplayValues()))!==sha256_(JSON.stringify(backup.getRange(1,1,rows,width).getDisplayValues())))throw Error('Archivo externo no verificado: '+sheet.getName());
  }
  properties_().setProperty('OPERATIONAL_ARCHIVE',archive.getUrl());
  const sheet=book_().getSheetByName('Recopilacion'),keys=RADAR.sheets.Recopilacion,seen=new Map(),remove=[],jobs=collectionJobs_(),archivedCycles=new Set(jobs.filter(job=>['Completada','Parcial'].includes(job.estado)).map(job=>job.id));let duplicateTasks=0,archivedTasks=0;
  const rank={Completada:5,Error:4,'Reintento programado':3,Pendiente:2,Omitida:1};
  const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,keys.length).getDisplayValues():[];
  rows.forEach((row,i)=>{
   if(archivedCycles.has(row[0])&&['Completada','Omitida','Error'].includes(row[3])){remove.push(i+2);archivedTasks++;return;}
   const key=JSON.stringify([row[0],row[2]]),previous=seen.get(key);
   if(!previous){seen.set(key,{row,position:i+2});return;}
   const score=value=>[rank[value[3]]||0,Number(value[4])||0,value[8]||''];
   const a=score(row),b=score(previous.row),preferred=a[0]>b[0]||a[0]===b[0]&&(a[1]>b[1]||a[1]===b[1]&&a[2]>b[2]);
   duplicateTasks++;remove.push(preferred?previous.position:i+2);if(preferred)seen.set(key,{row,position:i+2});
  });
  if(remove.length){
   const removed=new Set(remove),retained=rows.filter((_,index)=>!removed.has(index+2));
   if(retained.length){sheet.getRange(2,1,retained.length,keys.length).setNumberFormat('@').setValues(retained);SpreadsheetApp.flush();if(sha256_(JSON.stringify(retained))!==sha256_(JSON.stringify(sheet.getRange(2,1,retained.length,keys.length).getDisplayValues())))throw Error('Cola compactada no verificada.');}
   sheet.getRange(retained.length+2,1,rows.length-retained.length,keys.length).clearContent();
  }
  const changedCycles=new Set(remove.map(position=>rows[position-2][0]));
  for(const job of collectionSnapshots_(rows_('Recopilacion'),jobs.filter(job=>changedCycles.has(job.id)&&!archivedCycles.has(job.id))))writeCollectionJob_(job);
  compactOperationalLogs_();const generations=pruneNewsGenerations_();compactStorageDimensions_();
  CacheService.getScriptCache().remove('collection-status');
  return {archive:archive.getUrl(),duplicateTasks,archivedTasks,generations};
 });
}
function auditMaintenanceIntegrity_(job){
 const tables=Object.keys(RADAR.sheets);job.integrityTable=job.integrityTable||0;
 for(let checked=0;checked<3&&job.integrityTable<tables.length;checked++,job.integrityTable++){
  const name=tables[job.integrityTable],sheet=book_().getSheetByName(configurationStorageKey_(name));if(!sheet)continue;
  if(JSON.stringify(sheet.getRange(1,1,1,RADAR.sheets[name].length).getDisplayValues()[0])!==JSON.stringify(RADAR.sheets[name]))throw Error('Cabecera no válida: '+name);
 }
 if(job.integrityTable<tables.length)return false;
 if(!job.integrityChecked){
  const sheet=newsSheet_(),count=sheet.getLastRow()-1,ids=count?sheet.getRange(2,1,count,1).getDisplayValues():[],seen=new Set();let duplicates=0,missing=0;
  for(const [id] of ids){if(!id)missing++;else if(seen.has(id))duplicates++;else seen.add(id);}
  job.integrity={news:count,duplicates,missing,storage:newsStorageKey_()};
  if(duplicates||missing)throw Error('Integridad de IDs: '+duplicates+' duplicados; '+missing+' vacíos. Revisión necesaria.');
  job.integrityChecked=true;
 }
 return true;
}

function startMaintenance(){authorize_(true);return withForegroundWrite_(()=>{const job=maintenanceJob_();if(job&&['Revisar','En pausa','Pendiente'].includes(job.state)&&maintenanceTransientTimeout_(job.error)){job.state='Pendiente';job.pausedUntil=0;job.attempts=0;saveMaintenanceJob_(job);ensureBackgroundWorker_();return 'Mantenimiento incremental reanudado desde el último avance.';}maintenance_(true);return 'Mantenimiento incremental en cola.';});}

function startExcerptRecovery(){
 authorize_(true);return withForegroundWrite_(()=>{
  const p=properties_(),job=JSON.parse(p.getProperty('EXCERPT_RECOVERY_JOB')||'null');
  if(!job||job.state==='Completada')p.setProperty('EXCERPT_RECOVERY_JOB',JSON.stringify({state:'Pendiente',source:newsStorageKey_(),next:2,reviewed:0,recovered:0,failed:0,protected:0,started:new Date().toISOString()}));
  maintenance_();ensureBackgroundWorker_();return 'Recuperación de extractos RSS en cola; se conservan clasificaciones y asignaciones LLM verificadas.';
 });
}
function recoverMissingExcerptsBatch_(maxMs){
 const p=properties_(),job=JSON.parse(p.getProperty('EXCERPT_RECOVERY_JOB')||'null');if(!job||job.state==='Completada')return true;
 if(job.source!==newsStorageKey_())throw Error('La generación cambió durante la recuperación de extractos; revisa el cursor antes de reiniciar.');
 const started=Date.now(),sheet=newsSheet_(),keys=RADAR.sheets.Noticias,total=sheet.getLastRow(),size=Math.min(50,Math.max(0,total-job.next+1)),rows=size?sheet.getRange(job.next,1,size,keys.length).getDisplayValues():[],feeds=new Map(feeds_().map(feed=>[feed.name,feed])),responses=new Map(),updates=[];let requests=0,processed=0;
 for(const values of rows){
  if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
  const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));
  if(row.extracto){processed++;continue;}
  if(llmStrongResult_(llmIndex_().get(row.id),row)){job.protected++;processed++;continue;}
  const feed=feeds.get(row.fuente);let status='sin fuente RSS configurada';
  const window=feed&&collectionQueryRange_(feed.url);
  if(window&&row.fecha&&(row.fecha<window.from||row.fecha>window.to)){job.failed++;processed++;continue;}
  if(feed){
   if(!responses.has(feed.url)){
    if(requests>=2)break;requests++;
    try{const response=UrlFetchApp.fetch(feed.url,{muteHttpExceptions:true,followRedirects:true}),xml=response.getContentText();if(response.getResponseCode()!==200||xml.length>settings_().maxFeedBytes)throw Error('RSS no disponible o demasiado grande');responses.set(feed.url,{items:parseFeed_(xml)});}catch(error){responses.set(feed.url,{error:String(error.message).slice(0,120)});}
   }
   const response=responses.get(feed.url),item=response.items?.find(item=>newsUrlIdentity_(item.url)===newsUrlIdentity_(row.url));
   const extracted=item&&newsExcerpt_(item,row.titular,item.source);
   status=response.error||(!item?'artículo ausente del RSS':!extracted.text?'RSS sin extracto':'recuperado');
   if(extracted?.text){
    const labels=savedNewsLabels_(row.clasificacion),title=searchText_(plainText_(row.titular)),oldText=searchText_(plainText_(row.titular)+' '+plainText_(row.extracto)),taxonomy=taxonomySaved_(row.taxonomia);
    if(labels.contentHash===sha256_(JSON.stringify([title,oldText])))labels.contentHash=sha256_(JSON.stringify([title,searchText_(plainText_(row.titular)+' '+plainText_(extracted.text))]));
    if(row.taxonomia&&taxonomy.fingerprint===taxonomyFingerprint_(row.titular,row.extracto)){const saved=JSON.parse(row.taxonomia);saved.fingerprint=taxonomyFingerprint_(row.titular,extracted.text);updates.push({row:job.next+processed,column:keys.indexOf('taxonomia')+1,value:JSON.stringify(saved)});}
    labels.procedencia={...labels.procedencia,recuperacionExtracto:{sourceUrl:canonicalUrl_(item.sourceUrl)||feed.url,mechanism:extracted.mechanism,date:new Date().toISOString(),status}};
    updates.push({row:job.next+processed,column:keys.indexOf('extracto')+1,value:extracted.text},{row:job.next+processed,column:keys.indexOf('clasificacion')+1,value:JSON.stringify(labels)});job.recovered++;
   }
  }
  if(status!=='recuperado')job.failed++;
  telemetry_('extractos',Date.now()-started,status==='recuperado'?'OK':'Sin evidencia',row.id+'; '+row.fuente+'; '+status);processed++;
 }
 writeNewsCells_(updates);if(updates.length)invalidateNews_(true,true,false);job.next+=processed;job.reviewed+=processed;job.updated=new Date().toISOString();job.state=job.next>total?'Completada':'Pendiente';p.setProperty('EXCERPT_RECOVERY_JOB',JSON.stringify(job));return job.state==='Completada';
}
function getCorpusQualityAudit(){
 authorize_(true);const generation=dataGeneration_(),candidate=taxonomyJob_()?.generation?.newsSheet,names=[...new Set([newsStorageKey_(),candidate].filter(Boolean))],corpora=[];
 for(const name of names){
  const sheet=book_().getSheetByName(name),keys=RADAR.sheets.Noticias,ids=new Set(),urls=new Set(),counts={rows:0,missingExcerpt:0,duplicateIds:0,duplicateUrls:0,invalidDates:0,invalidTaxonomy:0},states={},strata=new Map();
  if(!sheet)throw Error('Falta generación: '+name);
  for(let first=2;first<=sheet.getLastRow();first+=100){
   for(const values of sheet.getRange(first,1,Math.min(100,sheet.getLastRow()-first+1),keys.length).getDisplayValues()){
    const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),labels=savedNewsLabels_(row.clasificacion),state=labels.estado||'unknown';counts.rows++;if(!row.extracto.trim())counts.missingExcerpt++;if(!row.id||ids.has(row.id))counts.duplicateIds++;ids.add(row.id);const url=newsUrlIdentity_(row.url);if(!url||urls.has(url))counts.duplicateUrls++;urls.add(url);if(!/^\d{4}-\d{2}-\d{2}$/.test(row.fecha)||!Number.isFinite(Date.parse(row.fecha)))counts.invalidDates++;if(taxonomySaved_(row.taxonomia).invalid)counts.invalidTaxonomy++;states[state]=(states[state]||0)+1;
    const stratum=JSON.stringify([row.pais,row.entidad,row.fuente,row.fecha.slice(0,7),row.idioma,state]),sample={id:row.id,rank:sha256_(row.id)};
    if(!strata.has(stratum)||sample.rank<strata.get(stratum).rank)strata.set(stratum,sample);
   }
  }
  corpora.push({sheet:name,...counts,states,idDigest:sha256_(JSON.stringify([...ids].sort())),urlDigest:sha256_(JSON.stringify([...urls].sort())),sample:[...strata].sort(([a],[b])=>a.localeCompare(b)).slice(0,250).map(([stratum,{id}])=>({stratum:JSON.parse(stratum),id})),llmMissingReferences:[...llmIndex_().keys()].filter(id=>!ids.has(id)).length});
 }
 return {generation,corpora,excerptJob:JSON.parse(properties_().getProperty('EXCERPT_RECOVERY_JOB')||'null')};
}
