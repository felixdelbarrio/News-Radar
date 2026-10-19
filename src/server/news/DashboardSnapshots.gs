function dashboardSnapshotRevision_(view,now=new Date(),p=properties_().getProperties()){
  const period=dashboardPeriod_(view,now);
  return sha256_(JSON.stringify([RADAR.version,llmRevision_(),NEWS_CACHE.schema,newsStorageKey_(),taxonomyStorageKey_(),view,p.CONFIG_REVISION||'0',p.NEWS_REVISION||'0',p.TAXONOMY_REVISION||'0',p.TAXONOMY_TRANSLATIONS_REVISION||'0',Object.keys(languageNames).map(code=>p['TRANSLATIONS_REVISION:'+code]||'0'),period]));
}
function dashboardSnapshotManifest_(view){return dataGeneration_().snapshots?.[view]||null;}
function dashboardSnapshotsPending_(){if(llmJob_()?.state==='Publicando'&&!llmStateOverride_)return true;const p=properties_().getProperties(),now=new Date();return snapshotJobsPending_()||Boolean(p.DASHBOARD_SNAPSHOT_CORRUPT)||DASHBOARD_SNAPSHOTS.views.some(view=>dashboardSnapshotManifest_(view)?.revision!==dashboardSnapshotRevision_(view,now,p));}
function dashboardSnapshotsDue_(){const p=properties_().getProperties();return Boolean(p.DASHBOARD_SNAPSHOT_REQUEST&&(p.DASHBOARD_SNAPSHOT_REQUEST==='ready'||Date.now()-Number(p.DASHBOARD_SNAPSHOT_REQUESTED_AT||Date.now())>=DASHBOARD_SNAPSHOTS.refreshMs));}
function invalidateDashboardSnapshots_(){const p=properties_();if(!p.getProperty('DASHBOARD_SNAPSHOT_REQUEST'))p.setProperty('DASHBOARD_SNAPSHOT_REQUEST','pending');if(!p.getProperty('DASHBOARD_SNAPSHOT_REQUESTED_AT'))p.setProperty('DASHBOARD_SNAPSHOT_REQUESTED_AT',String(Date.now()));}
function requestDashboardSnapshots_(ready=false){if(!dashboardSnapshotsPending_())return;const previous=properties_().getProperty('DASHBOARD_SNAPSHOT_REQUEST');invalidateDashboardSnapshots_();if(previous&&(!ready||previous==='ready'))return;if(ready)properties_().setProperty('DASHBOARD_SNAPSHOT_REQUEST','ready');ensureBackgroundWorker_();}
function defaultDashboardSnapshot_(view,query,language){
  if(!DASHBOARD_SNAPSHOTS.views.includes(view))return null;
  const defaults=dashboardQuery_({view,initial:true}),revision=dashboardSnapshotRevision_(view),manifest=dashboardSnapshotManifest_(view);
  if(manifest?.periodFallback&&query.from===manifest.period.from&&query.to===manifest.period.to)Object.assign(defaults,manifest.period);
  if(Object.entries(query).some(([key,value])=>value!==''&&value!=null&&key!=='newsGeography'&&!(key==='page'&&Number(value)===0)&&value!==defaults[key]))return null;
  if(manifest?.revision!==revision){requestDashboardSnapshots_();if(!manifest)return null;}
  const cache=CacheService.getScriptCache(),key='dashboard-snapshot:'+manifest.revision+':'+language+':'+(query.newsGeography||''),cached=readDashboardCache_(cache,key);if(cached)return cached;
  try{
    const rows=book_().getSheetByName(manifest.sheet||'DashboardSnapshots')?.getRange(manifest.first,1,manifest.parts,4).getDisplayValues();
    if(!rows||rows.some(([name,generation,part],index)=>name!==view||generation!==manifest.generation||Number(part)!==index))throw Error('Fragmentos incompletos');
    const encoded=rows.map(row=>row[3]).join('');if(sha256_(encoded)!==manifest.digest)throw Error('Contenido incompleto');
    const bundle=JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(encoded),'application/gzip')).getDataAsString()),variants=Object.hasOwn(bundle.variants,query.newsGeography)?bundle.variants[query.newsGeography]:bundle.variants[''],data=variants[view==='radar'?'es':language];
    const value={data,period:bundle.period,periodFallback:bundle.periodFallback};writeDashboardCache_(cache,key,value);return value;
  }catch(error){console.warn('Snapshot '+view+': '+String(error.message||error));properties_().setProperty('DASHBOARD_SNAPSHOT_CORRUPT','true');requestDashboardSnapshots_();return null;}
}
function dashboardSnapshotData_(rows,query,feeds,view){
  const data=newsDashboard_(rows,query,feeds,view);dashboardCatalogOptions_(data,feeds);return data;
}
function dashboardSnapshotLanguages_(data,view){
  const values={};
  for(const language of view==='radar'?['es']:Object.keys(languageNames)){
    const value={...data,items:view==='radar'?data.items:savedArticleTranslations_(data.items,language)};
    if(data.briefing)value.briefing={...data.briefing,items:savedArticleTranslations_(data.briefing.items,language)};
    dashboardArticleFields_(value);values[language]=value;
  }
  return values;
}
// The worker holds the script lock. Publish the manifest last, using the inactive slot.
function dashboardSnapshotBatch_(){
  try{
  const job=[classificationJob_(),taxonomyJob_(),maintenanceJob_()].find(job=>job?.state==='Publicando'&&job.target);
  if(!job)return llmJob_()?.state==='Publicando'?llmSnapshotBatch_():buildDashboardSnapshotBatch_();
  if(!validateSnapshotJob_(job))return true;
  newsSheetOverride_=job.target;taxonomySheetOverride_=job.modelTarget;
  try{return buildDashboardSnapshotBatch_(job);}finally{newsSheetOverride_=undefined;taxonomySheetOverride_=undefined;}
  }catch(error){recordSnapshotFailure_(error);if(error.restartJob){const job=[classificationJob_(),taxonomyJob_(),maintenanceJob_()].find(job=>job?.state==='Publicando'&&job.target);if(job?.modelTarget)requestTaxonomy_(job.request);else if(job?.target.startsWith('Noticias_class_'))requestNewsClassification_(true);else if(job)maintenance_(true);return true;}throw error;}
}

function buildDashboardSnapshotBatch_(job=null){
  const p=properties_().getProperties(),now=new Date(),signature=sha256_(JSON.stringify(DASHBOARD_SNAPSHOTS.views.map(view=>dashboardSnapshotRevision_(view,now,p))));
  let build=JSON.parse(p.DASHBOARD_SNAPSHOT_BUILD||'null');
  if(!build||build.signature!==signature)build={signature,manifests:{}};
  if(!job&&!dashboardSnapshotsPending_()){completeSnapshotJobs_();clearDashboardSnapshotRequest_();return false;}
  const view=DASHBOARD_SNAPSHOTS.views.find(view=>!build.manifests[view]);
  if(!view)return publishDashboardSnapshotSet_(build,job);
  const started=Date.now(),revision=dashboardSnapshotRevision_(view),feeds=feeds_();let query=dashboardQuery_({view,initial:true}),rows=cachedNewsRecords_(query),data=dashboardSnapshotData_(rows,query,feeds,view),periodFallback=false;
  if((view==='briefing'?data.briefing.total:data.contextTotal)===0){query={...query,...dashboardPeriod_(view,new Date(),true)};rows=cachedNewsRecords_(query);data=dashboardSnapshotData_(rows,query,feeds,view);periodFallback=true;}
  const variants={'':dashboardSnapshotLanguages_(data,view)};
  if(view==='news')for(const geography of data.newsGeographies)variants[geography.name]=geography.name===data.newsGeography?variants['']:dashboardSnapshotLanguages_(dashboardSnapshotData_(rows,{...query,newsGeography:geography.name},feeds,view),view);
  const period={from:query.from,to:query.to},encoded=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify({period,periodFallback,variants}),'application/json')).getBytes()),parts=Math.ceil(encoded.length/DASHBOARD_SNAPSHOTS.chars);
  if(parts>DASHBOARD_SNAPSHOTS.parts)throw Error('Snapshot demasiado grande: '+view);
  if(revision!==dashboardSnapshotRevision_(view))return true;
  let sheet=book_().getSheetByName('DashboardSnapshots');if(!sheet){sheet=book_().insertSheet('DashboardSnapshots');sheet.getRange(1,1,1,4).setValues([RADAR.sheets.DashboardSnapshots]);sheet.setFrozenRows(1);}
  const previous=dashboardSnapshotManifest_(view),slot=previous?.slot===0?1:0,first=2+(DASHBOARD_SNAPSHOTS.views.indexOf(view)*2+slot)*DASHBOARD_SNAPSHOTS.parts,generation=Utilities.getUuid(),needed=first+parts-1;
  if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
  sheet.getRange(first,1,parts,4).setNumberFormat('@').setValues(Array.from({length:parts},(_,index)=>[view,generation,String(index),encoded.slice(index*DASHBOARD_SNAPSHOTS.chars,(index+1)*DASHBOARD_SNAPSHOTS.chars)]));SpreadsheetApp.flush();
  build.manifests[view]={revision,generation,slot,first,parts,digest:sha256_(encoded),generated:new Date().toISOString(),period,periodFallback};
  properties_().setProperty('DASHBOARD_SNAPSHOT_BUILD',JSON.stringify(build));
  writeDashboardCache_(CacheService.getScriptCache(),'dashboard-snapshot:'+revision+':es:',{data:variants[''].es,period,periodFallback});
  telemetry_('dashboard-snapshot',Date.now()-started,'OK',view+'; '+period.from+' — '+period.to+'; anterior '+periodFallback+'; variantes '+Object.keys(variants).length+'; comprimido '+encoded.length+' caracteres');
  if(DASHBOARD_SNAPSHOTS.views.every(view=>build.manifests[view]))publishDashboardSnapshotSet_(build,job);return true;
}
function clearDashboardSnapshotRequest_(){for(const key of ['DASHBOARD_SNAPSHOT_REQUEST','DASHBOARD_SNAPSHOT_REQUESTED_AT','DASHBOARD_SNAPSHOT_BUILD','DASHBOARD_SNAPSHOT_CORRUPT'])properties_().deleteProperty(key);}
function publishDashboardSnapshotSet_(build,job){
  const signature=sha256_(JSON.stringify(DASHBOARD_SNAPSHOTS.views.map(view=>dashboardSnapshotRevision_(view))));
  if(build.signature!==signature)return true;
  if(job&&!job.llm)assertSnapshotJobSource_(job);
  for(const view of DASHBOARD_SNAPSHOTS.views)try{verifyDashboardSnapshot_(view,build.manifests[view]);}catch(error){delete build.manifests[view];properties_().setProperty('DASHBOARD_SNAPSHOT_BUILD',JSON.stringify(build));throw error;}
  const previous=dataGeneration_(),generation={...previous,...(job?.categorization?{categorization:job.categorization}:{}),newsSheet:job?.target||previous.newsSheet||'Noticias',...(job?.modelTarget?{taxonomySheet:job.modelTarget}:{}),snapshots:build.manifests,revision:build.signature,published:new Date().toISOString()};
  // All view manifests and the historical corpus switch together. The previous slots remain intact.
  if(job&&previous.snapshots)savePreviousDataGeneration_(previous);
  properties_().setProperty('DATA_GENERATION',JSON.stringify(generation));dataGenerationMemory_=generation;
  clearDashboardSnapshotRequest_();completeSnapshotJobs_(job);if(job?.llm){const llm=llmJob_();properties_().setProperty('LLM_JOB',JSON.stringify({...llm,state:'Completada',progress:100,error:'',published:generation.published}));}return true;
}
function rebuildDashboardSnapshots(){authorize_(true);return withForegroundWrite_(()=>{properties_().setProperty('DASHBOARD_SNAPSHOT_CORRUPT','true');requestDashboardSnapshots_(true);return 'Snapshots de Novedades, Noticias y Radar en cola.';});}

function dashboardSnapshotsReady_(work){return (!classificationPending_()||snapshotJobsPending_())&&!dailyCollectionPending_(work)&&!properties_().getProperty('DAILY_PIPELINE_REQUEST')&&dashboardSnapshotsPending_();}

function verifyDashboardSnapshot_(view,manifest){
  if(!manifest)throw Error('Falta snapshot de '+view);
  const rows=book_().getSheetByName(manifest.sheet||'DashboardSnapshots').getRange(manifest.first,1,manifest.parts,4).getDisplayValues();
  if(rows.some(([name,generation,part],index)=>name!==view||generation!==manifest.generation||Number(part)!==index)||sha256_(rows.map(row=>row[3]).join(''))!==manifest.digest)throw Error('Snapshot incompleto: '+view);return rows;
}
function savePreviousDataGeneration_(generation){
  const sheet=generationSheet_('DashboardSnapshotBackup',RADAR.sheets.DashboardSnapshots),snapshots={};let first=2;
  for(const view of DASHBOARD_SNAPSHOTS.views){const manifest=generation.snapshots[view],rows=verifyDashboardSnapshot_(view,manifest);verifiedGenerationWrite_(sheet,first,rows);snapshots[view]={...manifest,sheet:'DashboardSnapshotBackup',first};first+=rows.length;}
  properties_().setProperty('PREVIOUS_DATA_GENERATION',JSON.stringify({...generation,snapshots}));
}
function rollbackDataGeneration(){
  authorize_(true);return withForegroundWrite_(()=>{
    const raw=properties_().getProperty('PREVIOUS_DATA_GENERATION');if(!raw)throw Error('No hay generación anterior verificada.');
    const previous=JSON.parse(raw);if(!book_().getSheetByName(previous.newsSheet)||Object.values(previous.newsletterTables||{}).some(name=>!book_().getSheetByName(name)))throw Error('Falta el histórico anterior.');
    for(const view of DASHBOARD_SNAPSHOTS.views)verifyDashboardSnapshot_(view,previous.snapshots[view]);
    properties_().setProperty('DATA_GENERATION',raw);dataGenerationMemory_=previous;clearDashboardSnapshotRequest_();return 'Generación anterior restaurada.';
  });
}

