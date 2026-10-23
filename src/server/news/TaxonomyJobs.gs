let taxonomyMemory_;
const taxonomyMatchingMemory_=new WeakMap();
function taxonomyCatalog_(){
  const revision=taxonomyStorageKey_()+':'+(properties_().getProperty('TAXONOMY_REVISION')||'0');
  if(taxonomyMemory_?.revision===revision)return taxonomyMemory_.items;
  const key='taxonomy:'+revision,cache=CacheService.getScriptCache(),cached=cache.get(key);
  const items=cached?JSON.parse(cached):rows_('Taxonomia').map(row=>({...row,segmentos:JSON.parse(row.segmentos),terminos:JSON.parse(row.terminos),noticias:Number(row.noticias),peso:Number(row.peso),...JSON.parse(row.condiciones||'{}')}));
  if(!cached)cacheJson_(key,items,21600);taxonomyMemory_={revision,items};return items;
}
function taxonomyOptions_(){const rows=taxonomyCatalog_();return {palanca:[...new Set(rows.map(row=>row.palanca))],subpalanca:rows.filter(row=>row.subpalanca).map(taxonomyPath)};}
function taxonomySaved_(value){try{const data=JSON.parse(value||'{}');return {...data,invalid:Boolean(value)&&(!Array.isArray(data.ids)||data.ids.some(id=>typeof id!=='string')),fingerprint:data.fingerprint||'',ids:Array.isArray(data.ids)?data.ids:[],evidence:data.evidence||null,reason:data.reason||''};}catch(_){return {fingerprint:'',ids:[],invalid:Boolean(value)};}}
function taxonomyFingerprint_(title,excerpt){return sha256_(JSON.stringify([title,excerpt]));}
function fallbackTaxonomy_(text,labels,items){
 const capability=new Set((labels.capacidades||[]).map(value=>String(value).replace(/^Empresas:\s*/,''))),event=labels.evento||'',has=pattern=>pattern.test(text),pick=prefix=>items.find(item=>String(item.subpalanca||'').startsWith(prefix))?.id||'';
 let prefix='';
 if(event===INCIDENT_SIGNAL)prefix=has(/\b(?:login|log in|logins|acceso)\b/)?'16.01':has(/\b(?:pago|pagos|payment|payments|transferencia|transferencias|bizum)\b/)?'03.01':has(/\b(?:app|web|portal|banca|banking|canal)\b/)?'17.12':'19.07';
 else if(capability.has('Transferencias')||capability.has('Pagos'))prefix=has(/\b(?:bre-b|inmediatas?|instant(?: payments?)?)\b/)?'03.04':'03.01';
 else if(capability.has('Aplicaciones móviles empresariales')||capability.has('Banca electrónica corporativa'))prefix='01.01';
 else if(capability.has('Financiación digital')||capability.has('Préstamos y líneas de crédito'))prefix='08.01';
 else if(capability.has('Cobros y recaudación'))prefix='07.01';
 else if(capability.has('Adquirencia y terminales'))prefix='11.01';
 else if(capability.has('Autenticación y seguridad')||capability.has('Biometría'))prefix='16.01';
 return prefix?{id:pick(prefix),rule:prefix,capabilities:[...capability].sort(),signal:event}:{};
}
function taxonomyRecord_(title,excerpt,items=taxonomyCatalog_(),providedLabels=null){
 const fingerprint=taxonomyFingerprint_(title,excerpt),text=taxonomyText(title+' '+excerpt);
 if(!taxonomyMatchingMemory_.has(items))taxonomyMatchingMemory_.set(items,{rows:items.map(item=>({...item,terms:item.terminos,description:item.descripcion||''})),revision:taxonomyModelRevision_(items)});
 const model=taxonomyMatchingMemory_.get(items),metadata={fingerprint,version:TAXONOMY_POLICY.version,model:model.revision};
 const labels=providedLabels||classification_(searchText_(title),text).labels;
 if(!items.length||!taxonomyEligible_(searchText_(title),text))return {...metadata,ids:[],reason:'insufficient'};
 const decision=taxonomyDecision(text,model.rows,title),match=decision.matches[0];
 if(match)return {...metadata,ids:decision.matches.map(match=>match.row.id),primary:match.row.id,reason:decision.reason,evidence:{...match.evidence,assignments:decision.matches.map(({row,evidence})=>({id:row.id,...evidence}))}};
 const fallback=labels.digital&&fallbackTaxonomy_(text,labels,items);
 const evidence=fallback?.id?{method:'capability-fallback',rule:fallback.rule,capabilities:fallback.capabilities,signal:fallback.signal}:null;
 return evidence?{...metadata,ids:[fallback.id],primary:fallback.id,reason:'capability-fallback',evidence:{...evidence,assignments:[{id:fallback.id,...evidence}]}}:{...metadata,ids:[],reason:decision.reason};
}
function taxonomyJob_(){const raw=properties_().getProperty('TAXONOMY_JOB');return raw?JSON.parse(raw):null;}
function taxonomyPending_(){const job=taxonomyJob_();return Boolean(job&&job.state!=='Completada');}
function taxonomyReadyAt_(){const job=taxonomyJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeTaxonomyJob_(job){progressContextMemory_=undefined;properties_().setProperty('TAXONOMY_JOB',JSON.stringify(snapshotJob_('TAXONOMY_JOB',job)));}
function requestTaxonomy_(request=''){
  const catalog=refreshFunctionalCatalog_();
  const lastRow=newsSheet_().getLastRow(),candidateTotal=Math.max(0,candidateSheet_().getLastRow()-1),total=Math.max(0,lastRow-1),now=new Date().toISOString();
  const id=Utilities.getUuid();
  writeTaxonomyJob_({request,catalog,id,source:newsStorageKey_(),state:'Pendiente',phase:'scan',next:2,candidateTotal,candidateRevision:properties_().getProperty('CANDIDATES_REVISION')||'0',total,workTotal:total,processed:0,tagged:0,documents:0,started:now,updated:now,day:recordDay(now,settings_().timezone),corpus:properties_().getProperty('NEWS_CONTENT_REVISION')||'0',rules:taxonomyRulesRevision_()});
  clearTaxonomyCheckpoints_();properties_().deleteProperty('DASHBOARD_SNAPSHOT_BUILD');ensureBackgroundWorker_();
}
function drainTaxonomyRequest_(){
 const p=properties_(),request=p.getProperty('TAXONOMY_REQUEST');if(!request||taxonomyPending_())return;
 requestTaxonomy_(request);p.deleteProperty('TAXONOMY_REQUEST');
}
function getTaxonomyStatus(){
  authorize_(true);return {newsRevision:publishedNewsRevision_(),pageSize:settings_().pageSize,job:withJobProgress_('taxonomy',taxonomyJob_(),Boolean(properties_().getProperty('TAXONOMY_REQUEST'))),catalogUrl:settings_().taxonomyCatalogUrl,configurationRevision:configurationRevision_(),items:taxonomyCatalog_(),taxonomyTranslations:taxonomyTranslations_(),queued:Boolean(properties_().getProperty('TAXONOMY_REQUEST')),synced:properties_().getProperty('FUNCTIONAL_CATALOG_SYNCED')||'',scheduled:newsletterEnabled_(),timezone:settings_().timezone};
}
function startTaxonomy(){
  authorize_(true);return withForegroundWrite_(()=>{
    const job=taxonomyJob_();if(!taxonomyPending_())requestTaxonomy_();else if(job.state==='En pausa'){job.state='Pendiente';job.pausedUntil=0;writeTaxonomyJob_(job);}
    ensureBackgroundWorker_();return getTaxonomyStatus();
  });
}
function taxonomyModelRevision_(items){return sha256_(JSON.stringify(items.map(row=>[row.id,row.palanca,row.subpalanca,row.segmentos,row.terminos,row.descripcion,row.condiciones])));}
function publishTaxonomy_(state){
  taxonomySeed(state,taxonomyDefinitions(configuration_().taxonomy));
  const items=taxonomyBuild(state).map(row=>({id:sha256_(row.key).slice(0,24),palanca:row.palanca,subpalanca:row.subpalanca,segmentos:row.segments,terminos:row.terms,noticias:row.df,peso:row.peso,origen:/\.xx Otros$/.test(row.subpalanca)?'local':row.origin,descripcion:row.description||'',context:row.context||[],exclude:row.exclude||[],condiciones:JSON.stringify({context:row.context||[],exclude:row.exclude||[],...(row.emerging?{emerging:row.emerging}:{})})}));
  const revision=sha256_(JSON.stringify(items));
  if(revision===properties_().getProperty('TAXONOMY_REVISION')&&taxonomySheet_().getLastRow()>1){taxonomyMemory_={revision,items};return taxonomyModelRevision_(items);}
  const sheet=taxonomySheet_(),previous=Math.max(0,sheet.getLastRow()-1),keys=RADAR.sheets.Taxonomia;
  const values=items.map(row=>keys.map(key=>Array.isArray(row[key])?JSON.stringify(row[key]):row[key]));
  if(values.length)sheet.getRange(2,1,values.length,keys.length).setNumberFormat('@').setValues(values);
  if(previous>values.length)sheet.getRange(values.length+2,1,previous-values.length,keys.length).clearContent();
  properties_().setProperty('TAXONOMY_REVISION',revision);taxonomyMemory_={revision,items};invalidateNews_(false);
  return taxonomyModelRevision_(items);
}
function taxonomyPrimarySource_(row){return configuration_().feeds.some(feed=>feed.enabled&&entityKey_(feed.entity)===entityKey_(row.entidad)&&domainMatches_(row.url,feed.domain));}
function taxonomyEligible_(title,text){
  const assessment=digitalAssessment_(title,text);return !assessment.excluded&&!assessment.editorial;
}
function taxonomyBatch_(maxMs=TAXONOMY_POLICY.maxMs){
 const job=taxonomyJob_();if(job&&!['Completada','Publicando'].includes(job.state)){if(job.rules!==taxonomyRulesRevision_()||job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')||job.candidateRevision!==(properties_().getProperty('CANDIDATES_REVISION')||'0')){requestTaxonomy_(job.request);return;}}
 return withTaxonomyGeneration_(job,()=>taxonomyGenerationBatch_(maxMs));
}
function taxonomyGenerationBatch_(maxMs){
 const job=taxonomyJob_();if(!job||['Completada','Publicando'].includes(job.state))return;
 const started=Date.now();let written=false;
 try{
  if(job.phase!=='tag'){
   const state=readTaxonomyCheckpoint_(job),definitions=taxonomyDefinitions(configuration_().taxonomy),excluded=new Set(configuration_().entities.flatMap(row=>[row.name,...row.aliases]).map(taxonomyText));
   taxonomySeed(state,definitions);
   if(job.phase==='scan'){
    const cursor={table:0,row:2,...job.scanCursor};let observed=0;
    while(cursor.table<2&&Date.now()-started<maxMs&&!backgroundPaused_(true)){
     const name=cursor.table===0?'Noticias':'Candidatos',sheet=recordSheet_(name),keys=RADAR.sheets[name],count=cursor.table===0?job.total:job.candidateTotal,width=cursor.table===0?7:6;
     if(cursor.row>count+1){cursor.table++;cursor.row=2;continue;}
     const size=Math.min(5000,count+2-cursor.row),rows=sheet.getRange(cursor.row,2,size,width).getDisplayValues(),provenance=cursor.table===1?sheet.getRange(cursor.row,keys.indexOf('procedencia')+1,size,1).getDisplayValues():null;
     let read=0;
     for(const values of rows){
      if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
      const row=Object.fromEntries(keys.slice(1,1+width).map((key,j)=>[key,values[j]]));
      observeTaxonomyRow_(state,row,definitions,excluded,row.medio||JSON.parse(provenance?.[read][0]||'{}').medio||'');read++;observed++;
     }
     cursor.row+=read;if(read<rows.length)break;
    }
    while(cursor.table<2&&cursor.row>(cursor.table===0?job.total:job.candidateTotal)+1){cursor.table++;cursor.row=2;}
    job.scanCursor=cursor;job.documents=state.documents;job.candidatesProcessed=cursor.table>1?job.candidateTotal:cursor.table===1?cursor.row-2:0;
    if(cursor.table===2)job.phase='publish';
    // The manifest and exact next-row cursor commit together, after verification.
    if(observed||job.phase==='publish')saveTaxonomyCheckpoint_(job,state);
   }
   if(job.phase==='publish'&&Date.now()-started<maxMs&&!backgroundPaused_()){
    prepareTaxonomyGeneration_(job);
    withTaxonomyGeneration_(job,()=>{job.model=publishTaxonomy_(state);});job.documents=state.documents;job.phase='tag';job.next=2;
   }
  }else{
   const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,items=taxonomyCatalog_(),size=Math.min(TAXONOMY_POLICY.batchRows,job.total-job.next+2),updates=[];let read=0;
   const rows=size>0?sheet.getRange(job.next,1,size,keys.length).getDisplayValues():[],expected=[];
   for(const values of rows){if(Date.now()-started>=maxMs||backgroundPaused_(true))break;const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));const assignment=necessaryTaxonomyRecord_(row,items);validateTaxonomyAssignment_(assignment,items,row.id,true,row);const value=JSON.stringify(assignment);expected.push([value]);if(value!==row.taxonomia)updates.push({row:job.next+read,column:keys.indexOf('taxonomia')+1,value});read++;}
   writeNewsCells_(updates);
   if(read&&sha256_(JSON.stringify(expected))!==sha256_(JSON.stringify(sheet.getRange(job.next,keys.indexOf('taxonomia')+1,read,1).getDisplayValues())))throw Error('Etiquetado persistido incompleto.');
   written=updates.length>0;job.next+=read;job.tagged+=updates.length;job.processed=job.next-2;
   if(job.next>job.total+1){job.state='Completada';job.verified=true;properties_().setProperties({TAXONOMY_APPLIED_MODEL:job.model,TAXONOMY_APPLIED_RULES:job.rules,TAXONOMY_EVALUATED_CORPUS:job.corpus});}
  }
  if(written)invalidateNews_(false);Object.assign(job,{state:job.state==='Completada'?'Completada':'En curso',updated:new Date().toISOString(),error:'',pausedUntil:0});writeTaxonomyJob_(job);
  if(job.phase==='tag'){clearTaxonomyCheckpoints_();if(job.checkpoint){delete job.checkpoint;delete job.scanCursor;writeTaxonomyJob_(job);}}
  if(job.state==='Completada'){requestTaxonomyTranslations_();requestDashboardSnapshots_(true);}
  telemetry_('taxonomia',Date.now()-started,'OK',job.phase+'; '+job.processed+' revisadas; '+job.tagged+' etiquetas actualizadas');
 }catch(error){const durable=taxonomyJob_()||job;Object.assign(durable,{state:'En pausa',error:String(error.message).slice(0,180),pausedUntil:Date.now()+(serviceQuotaPause_(error)||settings_().retryMinutes*60000)});writeTaxonomyJob_(durable);telemetry_('taxonomia',Date.now()-started,'Error',durable.error);}
}

function observeTaxonomyRow_(state,row,definitions,excluded,publisher){
  if(!row.titular)return;
  const text=taxonomyText(row.titular+' '+row.extracto),url=newsUrlIdentity_(row.url),urlKey=url?'url:'+sha256_(url):'',identity=titleIdentity_({title:row.titular,date:row.fecha,publisher}),key=identity?sha256_(identity.key):'',days=state.titles[key]||[];
  const duplicate=urlKey&&Object.hasOwn(state.titles,urlKey)||identity&&days.some(day=>Math.abs(day-identity.day)<=COLLECTION_POLICY.duplicateDays);
  if(duplicate)return;
  if(urlKey)state.titles[urlKey]=[];
  if(identity){days.push(identity.day);state.titles[key]=days;}
  if(taxonomyEligible_(searchText_(row.titular),text))taxonomyObserve(state,text,definitions,excluded,publisher,{headline:row.titular,primary:taxonomyPrimarySource_(row)});
}

const taxonomyValidationMemory_=new WeakMap();
function taxonomyValidationIndex_(items){
  if(!taxonomyValidationMemory_.has(items)){
    const ids=new Set();for(const item of items){if(!item.id||ids.has(item.id))throw Error('Catálogo funcional con IDs vacíos o duplicados.');ids.add(item.id);}
    let model;taxonomyValidationMemory_.set(items,{ids,byId:new Map(items.map(item=>[item.id,item])),get model(){return model||(model=taxonomyModelRevision_(items));}});
  }
  return taxonomyValidationMemory_.get(items);
}
function validateTaxonomyAssignment_(saved,items,id,strict=true,row=null){
  const index=taxonomyValidationIndex_(items),fail=message=>{throw Error('Integridad taxonómica ['+id+']: '+message);};
  if(saved.invalid||new Set(saved.ids).size!==saved.ids.length||saved.ids.some(value=>!index.ids.has(value)))fail('IDs inexistentes o duplicados.');
  if((strict||saved.model)&&saved.model!==index.model)fail('Generación del catálogo distinta.');
  if(!strict)return;
  if(saved.version!==TAXONOMY_POLICY.version||!saved.reason||row&&saved.fingerprint!==taxonomyFingerprint_(row.titular,row.extracto))fail('Asignación pendiente de reproceso.');
  if(row&&!saved.ids.length&&saved.reason!=='insufficient'){const labels=savedNewsLabels_(row.clasificacion);if(labels.digital&&fallbackTaxonomy_(taxonomyText(row.titular+' '+row.extracto),labels,items)?.id)fail('Asignación pendiente de reproceso.');}
  const assignments=saved.evidence?.assignments||[];
  if(saved.ids.length>TAXONOMY_POLICY.maxAssignments||assignments.length!==saved.ids.length||saved.ids.some((value,i)=>assignments[i]?.id!==value)||saved.ids.length&&saved.primary!==saved.ids[0])fail('Evidencia o categoría principal incompleta.');
  const text=row?taxonomyText(row.titular+' '+row.extracto):'',used=[];
  for(const evidence of assignments){
    if(evidence.method==='capability-fallback'){
      if(saved.reason!=='capability-fallback'||saved.ids.length!==1||!row)fail('Fallback sin trazabilidad verificable.');
      const labels=savedNewsLabels_(row.clasificacion),expected=labels.digital&&fallbackTaxonomy_(text,labels,items);
      if(!expected?.id||expected.id!==evidence.id||expected.rule!==evidence.rule||expected.signal!==evidence.signal||JSON.stringify(expected.capabilities)!==JSON.stringify(evidence.capabilities)||evidence.terms?.length)fail('Regla, capacidad o señal de fallback incoherente.');
      continue;
    }
    if(!Array.isArray(evidence.terms)||!evidence.terms.length||!['literal','description'].includes(evidence.method)||row&&evidence.terms.some(term=>!taxonomyTermCounts(text,[term]).size))fail('Evidencia individual no verificable.');
    if(used.length&&!taxonomyIndependentEvidence(evidence,used))fail('Evidencia secundaria solapada o genérica.');
    used.push(...evidence.terms);
  }
}


function taxonomyCheckpointFirstRow_(){return 2+DASHBOARD_SNAPSHOTS.views.length*2*DASHBOARD_SNAPSHOTS.parts;}
function readTaxonomyCheckpoint_(job){
 const manifest=job.checkpoint;if(!manifest)return {documents:0,candidates:{},titles:{}};
 const sheet=book_().getSheetByName('DashboardSnapshots'),rows=sheet?.getRange(manifest.first,1,manifest.parts,4).getDisplayValues();
 if(!rows||rows.some(([kind,generation,part],i)=>kind!=='taxonomy-checkpoint'||generation!==manifest.generation||Number(part)!==i))throw Error('Checkpoint de taxonomía incompleto.');
 const text=rows.map(row=>row[3]).join('');if(sha256_(text)!==manifest.digest)throw Error('Checkpoint de taxonomía corrupto.');return JSON.parse(text);
}
function taxonomyCheckpointFreeRow_(sheet,parts,keep=null){
 const first=taxonomyCheckpointFirstRow_(),count=Math.max(0,sheet.getLastRow()-first+1),rows=count?sheet.getRange(first,1,count,4).getDisplayValues():[];
 let start=first,free=0;
 for(let i=0;i<rows.length;i++){
  const row=first+i,protectedRow=keep&&row>=keep.first&&row<keep.first+keep.parts;
  if(protectedRow||rows[i].some(value=>value!=='')){free=0;start=row+1;continue;}
  if(++free>=parts)return start;
 }
 return keep&&start<keep.first+keep.parts&&start+parts>keep.first?keep.first+keep.parts:start;
}
function saveTaxonomyCheckpoint_(job,state){
 const sheet=generationSheet_('DashboardSnapshots',RADAR.sheets.DashboardSnapshots),text=JSON.stringify(state),parts=Math.max(1,Math.ceil(text.length/40000)),first=taxonomyCheckpointFreeRow_(sheet,parts,job.checkpoint),generation=job.id+':'+Utilities.getUuid(),needed=first+parts-1;
 if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
 sheet.getRange(first,1,parts,4).setNumberFormat('@').setValues(Array.from({length:parts},(_,i)=>['taxonomy-checkpoint',generation,String(i),text.slice(i*40000,(i+1)*40000)]));SpreadsheetApp.flush();
 const candidate={...job,checkpoint:{first,parts,generation,digest:sha256_(text)}};readTaxonomyCheckpoint_(candidate);writeTaxonomyJob_(candidate);job.checkpoint=candidate.checkpoint;clearTaxonomyCheckpoints_(candidate.checkpoint);
}
function clearTaxonomyCheckpoints_(keep=null){
 const sheet=book_().getSheetByName('DashboardSnapshots'),first=taxonomyCheckpointFirstRow_(),count=sheet?sheet.getLastRow()-first+1:0;if(count<=0)return;
 const rows=sheet.getRange(first,1,count,2).getDisplayValues();
 for(let start=0;start<rows.length;){if(rows[start][0]!=='taxonomy-checkpoint'||rows[start][1]===keep?.generation){start++;continue;}let end=start+1;while(end<rows.length&&rows[end][0]==='taxonomy-checkpoint'&&rows[end][1]!==keep?.generation)end++;sheet.getRange(first+start,1,end-start,4).clearContent();start=end;}
}
