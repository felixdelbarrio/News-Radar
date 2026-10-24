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
    const bundle=JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(encoded),'application/gzip')).getDataAsString()),data=view==='news'?compactNewsSnapshotData_(bundle.news,query.newsGeography,language):bundle.variants[''][view==='radar'?'es':language];
    const value={data,metadata:bundle.metadata,period:bundle.period,periodFallback:bundle.periodFallback};writeDashboardCache_(cache,key,value);return value;
  }catch(error){console.warn('Snapshot '+view+': '+String(error.message||error));properties_().setProperty('DASHBOARD_SNAPSHOT_CORRUPT','true');requestDashboardSnapshots_();return null;}
}
function dashboardSnapshotData_(rows,query,feeds,view){
  const data=newsDashboard_(rows,query,feeds,view,null,null,view==='radar'?radarPreviousRows_(query):null);dashboardCatalogOptions_(data,feeds);if(view==='radar')data.years=radarAvailableYears_();return data;
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
function dashboardSnapshotBatch_(){try{return llmJob_()?.state==='Publicando'?llmSnapshotBatch_():buildDashboardSnapshotBatch_();}catch(error){recordSnapshotFailure_(error);throw error;}}

function buildDashboardSnapshotBatch_(job=null){
 if(!taxonomyPublicationReady_()||classificationJob_()&&!['Completada','Publicando'].includes(classificationJob_().state))return false;
 const taxonomy=taxonomyJob_();
 if(taxonomy?.state==='Publicando'&&taxonomy.generation){
  if(taxonomy.generation.newsSheet===newsStorageKey_()&&taxonomy.generation.taxonomySheet===taxonomyStorageKey_()){
   for(const view of DASHBOARD_SNAPSHOTS.views)verifyDashboardSnapshot_(view,dashboardSnapshotManifest_(view));
   completeSnapshotJobs_();return buildPreparedDashboardSnapshotBatch_(job);
  }
  if(!taxonomySourceUnchanged_(taxonomy)||taxonomy.rules!==taxonomyRulesRevision_()){requestTaxonomy_(taxonomy.request);return false;}
  return withTaxonomyGeneration_(taxonomy,()=>buildPreparedDashboardSnapshotBatch_(job));
 }
 return buildPreparedDashboardSnapshotBatch_(job);
}
function buildPreparedDashboardSnapshotBatch_(job=null){
  const p=properties_().getProperties(),now=new Date(),signature=sha256_(JSON.stringify(DASHBOARD_SNAPSHOTS.views.map(view=>dashboardSnapshotRevision_(view,now,p))));
  let build=JSON.parse(p.DASHBOARD_SNAPSHOT_BUILD||'null');
  if(!build||build.signature!==signature)build={signature,manifests:{}};
  if(!job&&!dashboardSnapshotsPending_()){completeSnapshotJobs_();clearDashboardSnapshotRequest_();return false;}
  const batchStart=Date.now(),feeds=feeds_(),recordSets=new Map(),metadata=dashboardMetadata_();
  while(Date.now()-batchStart<BACKGROUND_WORK.sliceMs*2){
  const view=DASHBOARD_SNAPSHOTS.views.find(view=>!build.manifests[view]);
  if(!view)return publishDashboardSnapshotSet_(build,job);
  const started=Date.now(),revision=dashboardSnapshotRevision_(view);let query=dashboardQuery_({view,initial:true}),rows=snapshotRecords(query),data=dashboardSnapshotData_(rows,query,feeds,view),periodFallback=false;
  if((view==='briefing'?data.briefing.total:data.contextTotal)===0){query={...query,...dashboardPeriod_(view,new Date(),true)};rows=snapshotRecords(query);data=dashboardSnapshotData_(rows,query,feeds,view);periodFallback=true;}
  const payload=view==='news'?{news:compactNewsSnapshot_(rows,query,data)}:{variants:{'':dashboardSnapshotLanguages_(data,view)}};
  const period={from:query.from,to:query.to};
  if(view==='news')for(const language of Object.keys(languageNames))writeDashboardCache_(CacheService.getScriptCache(),'dashboard-snapshot:'+revision+':'+language+':',{data:compactNewsSnapshotData_(payload.news,'',language),metadata,period,periodFallback});
  else hydrateDashboardSnapshot_(CacheService.getScriptCache(),revision,payload.variants,view,period,periodFallback,metadata);
  const encoded=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify({period,periodFallback,metadata,...payload}),'application/json')).getBytes()),parts=Math.ceil(encoded.length/DASHBOARD_SNAPSHOTS.chars);
  if(parts>DASHBOARD_SNAPSHOTS.parts)throw Error('Snapshot demasiado grande: '+view);
  if(revision!==dashboardSnapshotRevision_(view))return true;
  let sheet=book_().getSheetByName('DashboardSnapshots');if(!sheet){sheet=book_().insertSheet('DashboardSnapshots');sheet.getRange(1,1,1,4).setValues([RADAR.sheets.DashboardSnapshots]);sheet.setFrozenRows(1);}
  const previous=dashboardSnapshotManifest_(view),slot=previous?.slot===0?1:0,first=2+(DASHBOARD_SNAPSHOTS.views.indexOf(view)*2+slot)*DASHBOARD_SNAPSHOTS.parts,generation=Utilities.getUuid(),needed=first+parts-1;
  if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
  sheet.getRange(first,1,parts,4).setNumberFormat('@').setValues(Array.from({length:parts},(_,index)=>[view,generation,String(index),encoded.slice(index*DASHBOARD_SNAPSHOTS.chars,(index+1)*DASHBOARD_SNAPSHOTS.chars)]));SpreadsheetApp.flush();
  build.manifests[view]={revision,generation,slot,first,parts,digest:sha256_(encoded),generated:new Date().toISOString(),period,periodFallback};
  properties_().setProperty('DASHBOARD_SNAPSHOT_BUILD',JSON.stringify(build));
  telemetry_('dashboard-snapshot',Date.now()-started,'OK',view+'; '+period.from+' — '+period.to+'; anterior '+periodFallback+'; variantes '+(view==='news'?1:Object.keys(payload.variants).length)+'; comprimido '+encoded.length+' caracteres');
  if(DASHBOARD_SNAPSHOTS.views.every(view=>build.manifests[view]))return publishDashboardSnapshotSet_(build,job);
  }return true;
  function snapshotRecords(query){const key=query.from+'|'+query.to;if(!recordSets.has(key))recordSets.set(key,cachedNewsRecords_(query));return recordSets.get(key);}
}
function clearDashboardSnapshotRequest_(){for(const key of ['DASHBOARD_SNAPSHOT_REQUEST','DASHBOARD_SNAPSHOT_REQUESTED_AT','DASHBOARD_SNAPSHOT_BUILD','DASHBOARD_SNAPSHOT_CORRUPT'])properties_().deleteProperty(key);}
function publishDashboardSnapshotSet_(build,job){
  const signature=sha256_(JSON.stringify(DASHBOARD_SNAPSHOTS.views.map(view=>dashboardSnapshotRevision_(view))));
  if(build.signature!==signature)return true;
  for(const view of DASHBOARD_SNAPSHOTS.views)try{verifyDashboardSnapshot_(view,build.manifests[view]);}catch(error){delete build.manifests[view];properties_().setProperty('DASHBOARD_SNAPSHOT_BUILD',JSON.stringify(build));throw error;}
  const previous=dataGeneration_(),generation={...previous,...(job?.categorization?{categorization:job.categorization}:{}),newsSheet:newsStorageKey_(),taxonomySheet:taxonomyStorageKey_(),snapshots:build.manifests,revision:build.signature,published:new Date().toISOString()};
  // All view manifests and the historical corpus switch together. The previous slots remain intact.
  properties_().setProperty('DATA_GENERATION',JSON.stringify(generation));dataGenerationMemory_=generation;
  clearDashboardSnapshotRequest_();completeSnapshotJobs_();if(job?.llm){const llm=llmJob_();properties_().setProperty('LLM_JOB',JSON.stringify({...llm,state:'Completada',progress:100,error:'',published:generation.published}));}pruneNewsGenerations_();return true;
}
function rebuildDashboardSnapshots(){authorize_(true);return withForegroundWrite_(()=>{properties_().setProperty('DASHBOARD_SNAPSHOT_CORRUPT','true');requestDashboardSnapshots_(true);return 'Snapshots de Novedades, Noticias y Radar en cola.';});}

function dashboardSnapshotsReady_(work){return taxonomyPublicationReady_()&&(!classificationPending_()||snapshotJobsPending_())&&!dailyCollectionPending_(work)&&!dailyPipelineRequested_()&&dashboardSnapshotsPending_();}

function verifyDashboardSnapshot_(view,manifest){
  if(!manifest)throw Error('Falta snapshot de '+view);
  const rows=book_().getSheetByName(manifest.sheet||'DashboardSnapshots').getRange(manifest.first,1,manifest.parts,4).getDisplayValues();
  if(rows.some(([name,generation,part],index)=>name!==view||generation!==manifest.generation||Number(part)!==index)||sha256_(rows.map(row=>row[3]).join(''))!==manifest.digest)throw Error('Snapshot incompleto: '+view);return rows;
}
function hydrateDashboardSnapshot_(cache,revision,variants,view,period,periodFallback,metadata){
  for(const [geography,values] of Object.entries(variants))for(const language of Object.keys(languageNames))writeDashboardCache_(cache,'dashboard-snapshot:'+revision+':'+language+':'+geography,{data:values[view==='radar'?'es':language],metadata,period,periodFallback});
}

// One shared catalogue and article table replace country × language copies of the same payload.
function compactNewsSnapshot_(rows,query,data){
  const selected=selectAnnotatedNews_(rows,query),geography=newsReadingGeography_(null,query),groups=new Map([...data.newsGeographies,...regionalGeographies(selected,geography)].map(row=>[row.name,[]]));
  for(const row of selected){const name=geography(row);groups.get(name)?.push(row);if(name===otherGeography)groups.get(countryRegion(row.pais))?.push(row);}
  const articles=[],positions=new Map(),pages={};
  for(const [name,items] of groups){const page=newsEntityPage(items,0,data.pageSize);pages[name]={total:items.length,items:page.map(row=>{if(!positions.has(row)){positions.set(row,articles.length);articles.push(row);}return positions.get(row);})};}
  const fields=[...new Set(articles.flatMap(row=>Object.keys(row)))].filter(key=>!['_sheetRow','identityTitles'].includes(key)),records=articles.map(row=>fields.map(key=>row[key]??null)),translations={};
  for(const language of Object.keys(languageNames))translations[language]=savedArticleTranslations_(articles,language).map((row,index)=>[snapshotTextDelta_(articles[index].titular,row.titular),snapshotTextDelta_(articles[index].extracto??'',row.extracto??''),row.translation]);
  const {items,page,newsGeography,total,...metadata}=data;return {metadata,fields,records,translations,pages,defaultGeography:newsGeography};
}
function compactNewsSnapshotData_(bundle,geography,language){
  const name=Object.hasOwn(bundle.pages,geography)?geography:bundle.defaultGeography,page=bundle.pages[name]||{total:0,items:[]};
  const items=page.items.map(index=>{
    const row=Object.fromEntries(bundle.fields.flatMap((key,position)=>bundle.records[index][position]===null?[]:[[key,bundle.records[index][position]]])),[titular,extracto,translation]=bundle.translations[language][index];
    return {...row,titular:snapshotTextValue_(row.titular,titular),extracto:snapshotTextValue_(row.extracto??'',extracto),...(translation.state==='translated'?{original:{titular:row.titular,extracto:row.extracto}}:{}),translation};
  });
  return {...bundle.metadata,items,total:page.total,page:0,newsGeography:name};
}

function snapshotTextDelta_(original,value){
  if(original===value)return null;
  let prefix=0,suffix=0;while(prefix<original.length&&prefix<value.length&&original[prefix]===value[prefix])prefix++;
  while(suffix<original.length-prefix&&suffix<value.length-prefix&&original[original.length-1-suffix]===value[value.length-1-suffix])suffix++;
  return prefix+suffix>24?[prefix,suffix,value.slice(prefix,value.length-suffix)]:value;
}
function snapshotTextValue_(original,delta){return delta===null?original:Array.isArray(delta)?original.slice(0,delta[0])+delta[2]+(delta[1]?original.slice(-delta[1]):''):delta;}
