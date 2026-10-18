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
function taxonomySaved_(value){try{const data=JSON.parse(value||'{}');return {fingerprint:data.fingerprint||'',ids:Array.isArray(data.ids)?data.ids:[],evidence:data.evidence||null,reason:data.reason||''};}catch(_){return {fingerprint:'',ids:[]};}}
function taxonomyFingerprint_(title,excerpt){return sha256_(JSON.stringify([title,excerpt]));}
function taxonomyRecord_(title,excerpt,items=taxonomyCatalog_()){
 const fingerprint=taxonomyFingerprint_(title,excerpt),text=taxonomyText(title+' '+excerpt);
 if(!taxonomyMatchingMemory_.has(items))taxonomyMatchingMemory_.set(items,{rows:items.map(item=>({...item,terms:item.terminos,description:item.descripcion||''})),revision:taxonomyModelRevision_(items)});
 const model=taxonomyMatchingMemory_.get(items),metadata={fingerprint,version:TAXONOMY_POLICY.version,model:model.revision};
 if(!items.length||!taxonomyEligible_(searchText_(title),text))return {...metadata,ids:[],reason:'insufficient'};
 const decision=taxonomyDecision(text,model.rows,title),match=decision.matches[0];
 return {...metadata,ids:decision.matches.map(match=>match.row.id),reason:decision.reason,...(match?{evidence:{...match.evidence,assignments:decision.matches.map(({row,evidence})=>({id:row.id,...evidence}))}}:{})};
}
function taxonomyJob_(){const raw=properties_().getProperty('TAXONOMY_JOB');return raw?JSON.parse(raw):null;}
function taxonomyPending_(){const job=taxonomyJob_();return Boolean(job&&job.state!=='Completada');}
function taxonomyReadyAt_(){const job=taxonomyJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeTaxonomyJob_(job){progressContextMemory_=undefined;properties_().setProperty('TAXONOMY_JOB',JSON.stringify(snapshotJob_('TAXONOMY_JOB',job)));}
function requestTaxonomy_(request=''){
  request=properties_().getProperty('TAXONOMY_QUARTER_REQUEST')||request;
  const catalog=refreshFunctionalCatalog_();
  const lastRow=newsSheet_().getLastRow(),candidateTotal=Math.max(0,candidateSheet_().getLastRow()-1),total=Math.max(0,lastRow-1),now=new Date().toISOString();
  const id=Utilities.getUuid();
  writeTaxonomyJob_({request,catalog,id,source:newsStorageKey_(),target:'Noticias_tax_'+id,modelTarget:'Taxonomia_gen_'+id,state:'Pendiente',phase:'scan',next:2,cursor:null,candidateTotal,candidateRevision:properties_().getProperty('CANDIDATES_REVISION')||'0',total,workTotal:total*2+candidateTotal,lastRow,processed:0,tagged:0,documents:0,started:now,updated:now,day:recordDay(now,settings_().timezone),corpus:properties_().getProperty('NEWS_CONTENT_REVISION')||'0',rules:taxonomyRulesRevision_()});
  ensureBackgroundWorker_();
}
function drainTaxonomyRequest_(){
  const p=properties_(),day=p.getProperty('TAXONOMY_QUARTER_REQUEST')||p.getProperty('TAXONOMY_REQUEST');if(!day||taxonomyPending_()&&taxonomyJob_().request===day)return;
  if(taxonomyPending_()&&!day.startsWith('quarterly:'))return;
  if(taxonomyJob_()?.request!==day||day.startsWith('quarterly:'))requestTaxonomy_(day);p.deleteProperty('TAXONOMY_REQUEST');
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
function taxonomyCheckpoint_(job){
  const sheet=book_().getSheetByName('TaxonomiaTrabajo');if(sheet.getLastRow()<2)return {next:2,documents:0,candidates:{}};
  const meta=JSON.parse(sheet.getRange(2,1,1,1).getDisplayValues()[0][0]);if(meta.id!==job.id)return {next:2,documents:0,candidates:{}};
  const candidates={};if(meta.chunks)for(const [value] of sheet.getRange(3,1,meta.chunks,1).getDisplayValues())for(const entry of JSON.parse(value))candidates[entry.key]=entry;
  const titles={};
  for(let offset=0;offset<(meta.titleChunks||0);offset+=100)for(const [value] of sheet.getRange(3+meta.chunks+offset,1,Math.min(100,meta.titleChunks-offset),1).getDisplayValues())Object.assign(titles,Object.fromEntries(JSON.parse(value)));
  return {...meta,candidates,titles};
}
function writeTaxonomyCheckpoint_(job,state){
  const chunks=taxonomyCheckpointChunks_(Object.values(state.candidates),TAXONOMY_POLICY.checkpointRows),titleChunks=taxonomyCheckpointChunks_(Object.entries(state.titles||{}));
  const meta={id:job.id,next:state.next,documents:state.documents,cursor:state.cursor||null,size:state.size,candidateNext:state.candidateNext||2,chunks:chunks.length,titleChunks:titleChunks.length};
  book_().getSheetByName('TaxonomiaTrabajo').getRange(2,1,chunks.length+titleChunks.length+1,1).setNumberFormat('@').setValues([[JSON.stringify(meta)],...chunks,...titleChunks]);
}
function taxonomyCheckpointChunks_(entries,maxRows=Infinity){
  const chunks=[];let values=[],size=2;
  for(const entry of entries){const encoded=JSON.stringify(entry);if(values.length&&(size+encoded.length+1>TAXONOMY_POLICY.checkpointChars||values.length>=maxRows)){chunks.push(['['+values.join(',')+']']);values=[];size=2;}if(encoded.length+2>TAXONOMY_POLICY.checkpointChars)throw Error('Registro de catálogo global de funcionalidades demasiado grande.');values.push(encoded);size+=encoded.length+1;}
  if(values.length)chunks.push(['['+values.join(',')+']']);return chunks;
}
function taxonomyModelRevision_(items){return sha256_(JSON.stringify(items.map(row=>[row.id,row.palanca,row.subpalanca,row.segmentos,row.terminos,row.descripcion,row.condiciones])));}
function publishTaxonomy_(state){
  taxonomySeed(state,taxonomyDefinitions(configuration_().taxonomy));
  const items=taxonomyBuild(state).map(row=>({id:sha256_(row.key).slice(0,24),palanca:row.palanca,subpalanca:row.subpalanca,segmentos:row.segments,terminos:row.terms,noticias:row.df,peso:row.peso,origen:row.origin,descripcion:row.description||'',context:row.context||[],exclude:row.exclude||[],condiciones:JSON.stringify({context:row.context||[],exclude:row.exclude||[]})}));
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
  const job=taxonomyJob_();if(!job||['Completada','Publicando'].includes(job.state))return;
  const started=Date.now();let written=false;
  try{
    if(job.rules!==taxonomyRulesRevision_()||job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')||job.lastRow!==newsSheet_().getLastRow()||job.candidateRevision!==(properties_().getProperty('CANDIDATES_REVISION')||'0')||job.source!==newsStorageKey_()){requestTaxonomy_(job.request);return;}
    const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,column=keys.indexOf('taxonomia');
    if(job.phase==='scan'){
      const state=taxonomyCheckpoint_(job),definitions=taxonomyDefinitions(configuration_().taxonomy),excluded=new Set(configuration_().entities.flatMap(row=>[row.name,...row.aliases]).map(taxonomyText));
      taxonomySeed(state,definitions);
      const rows=newsWorkRows_({...job,cursor:state.cursor||null},TAXONOMY_POLICY.batchRows);let cursor=state.cursor||null,read=0;
      state.titles=state.titles||{};
      for(const row of rows){
        if(Date.now()-started>=maxMs||backgroundPaused_(true)||read%20===0&&properties_().getProperty('DAILY_PIPELINE_REQUEST'))break;
        observeTaxonomyRow_(state,row,definitions,excluded,publisherKey_(row.medio));
        cursor=newsWorkCursor_(row);state.next++;read++;
      }
      state.cursor=cursor;writeTaxonomyCheckpoint_(job,state);job.cursor=cursor;job.next=state.next;job.documents=state.documents;job.processed=state.next-2;
      if(state.next>job.total+1){job.phase=job.candidateTotal?'scanCandidates':'publish';}
    }else if(job.phase==='scanCandidates'){
      const state=taxonomyCheckpoint_(job),definitions=taxonomyDefinitions(configuration_().taxonomy),excluded=new Set(configuration_().entities.flatMap(row=>[row.name,...row.aliases]).map(taxonomyText)),next=state.candidateNext||2,size=Math.min(TAXONOMY_POLICY.batchRows,job.candidateTotal-next+2);
      taxonomySeed(state,definitions);state.titles=state.titles||{};let read=0;
      if(size>0)for(const values of candidateSheet_().getRange(next,1,size,RADAR.sheets.Candidatos.length).getDisplayValues()){
        if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
        const row=Object.fromEntries(RADAR.sheets.Candidatos.map((key,index)=>[key,values[index]]));
        observeTaxonomyRow_(state,row,definitions,excluded,publisherKey_(JSON.parse(row.procedencia||'{}').medio||''));
        read++;
      }
      state.candidateNext=next+read;writeTaxonomyCheckpoint_(job,state);job.documents=state.documents;job.candidatesProcessed=state.candidateNext-2;job.processed=job.total+job.candidatesProcessed;if(state.candidateNext>job.candidateTotal+1)job.phase='publish';
    }else if(job.phase==='publish'){
      migrationSheet_(job.modelTarget,RADAR.sheets.Taxonomia);taxonomySheetOverride_=job.modelTarget;try{job.model=publishTaxonomy_(taxonomyCheckpoint_(job));}finally{taxonomySheetOverride_=undefined;}
      if(!book_().getSheetByName(job.target))newsSheet_().copyTo(book_()).setName(job.target);job.changed=job.model!==properties_().getProperty('TAXONOMY_APPLIED_MODEL')||job.rules!==properties_().getProperty('TAXONOMY_APPLIED_RULES');job.phase='tag';job.next=2;job.cursor=null;
    }else{
      taxonomySheetOverride_=job.modelTarget;let items;try{items=taxonomyCatalog_();}finally{taxonomySheetOverride_=undefined;}const rows=newsWorkRows_(job,TAXONOMY_POLICY.batchRows),updates=[];let next=job.next,cursor=job.cursor;
      for(const row of rows){
        if(Date.now()-started>=maxMs||backgroundPaused_(true)||(next-job.next)%20===0&&properties_().getProperty('DAILY_PIPELINE_REQUEST'))break;
        const saved=taxonomySaved_(row.taxonomia),fingerprint=taxonomyFingerprint_(row.titular,row.extracto);
        if(job.changed||saved.fingerprint!==fingerprint||!saved.reason){
          const record=taxonomyRecord_(row.titular,row.extracto,items),value=JSON.stringify(record);if(value!==row.taxonomia)updates.push({row:row._sheetRow,column:column+1,value});
        }
        cursor=newsWorkCursor_(row);next++;
      }
      newsSheetOverride_=job.target;try{writeNewsCells_(updates);}finally{newsSheetOverride_=undefined;}written=updates.length>0;if(written)SpreadsheetApp.flush();job.tagged+=updates.length;job.cursor=cursor;job.next=next;job.processed=job.total+job.candidateTotal+Math.min(job.total,job.next-2);
      if(job.next>job.total+1){job.state='Completada';properties_().setProperty('TAXONOMY_APPLIED_MODEL',job.model);properties_().setProperty('TAXONOMY_APPLIED_RULES',job.rules);properties_().setProperty('TAXONOMY_EVALUATED_CORPUS',job.corpus);}
    }
    Object.assign(job,{state:job.state==='Completada'?'Completada':'En curso',updated:new Date().toISOString(),error:'',pausedUntil:0});writeTaxonomyJob_(job);
    if(job.state==='Completada'){if(job.request?.startsWith('quarterly:')){properties_().setProperty('TAXONOMY_PERIOD',job.request.slice(10));properties_().deleteProperty('TAXONOMY_QUARTER_REQUEST');}requestTaxonomyTranslations_();requestDashboardSnapshots_(true);}
    telemetry_('taxonomia',Date.now()-started,'OK',job.phase+'; '+job.processed+'/'+job.workTotal+' revisadas; '+job.tagged+' etiquetas actualizadas');
  }catch(error){Object.assign(job,{state:'En pausa',error:String(error.message).slice(0,180),updated:new Date().toISOString(),pausedUntil:Date.now()+(serviceQuotaPause_(error)||settings_().retryMinutes*60000)});writeTaxonomyJob_(job);telemetry_('taxonomia',Date.now()-started,'Error',job.error);}
  finally{if(written)invalidateNews_(false);}
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
