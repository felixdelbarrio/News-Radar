function dashboardSnapshotRevision_(view,now=new Date()){
  const p=properties_().getProperties(),period=dashboardPeriod_(view,now);
  return sha256_(JSON.stringify([RADAR.version,NEWS_CACHE.schema,view,p.CONFIG_REVISION||'0',p.NEWS_REVISION||'0',p.TAXONOMY_REVISION||'0',p.TAXONOMY_TRANSLATIONS_REVISION||'0',Object.keys(languageNames).map(code=>p['TRANSLATIONS_REVISION:'+code]||'0'),period]));
}
function dashboardSnapshotManifest_(view){const value=properties_().getProperty('DASHBOARD_SNAPSHOT:'+view);return value?JSON.parse(value):null;}
function dashboardSnapshotsPending_(){return DASHBOARD_SNAPSHOTS.views.some(view=>dashboardSnapshotManifest_(view)?.revision!==dashboardSnapshotRevision_(view));}
function requestDashboardSnapshots_(ready=false){if(!dashboardSnapshotsPending_())return;const previous=properties_().getProperty('DASHBOARD_SNAPSHOT_REQUEST');if(previous&&(!ready||previous==='ready'))return;properties_().setProperty('DASHBOARD_SNAPSHOT_REQUEST',ready?'ready':'pending');ensureBackgroundWorker_();}
function defaultDashboardSnapshot_(view,query,language){
  if(!DASHBOARD_SNAPSHOTS.views.includes(view))return null;
  const defaults=dashboardQuery_({view,initial:true}),revision=dashboardSnapshotRevision_(view),manifest=dashboardSnapshotManifest_(view);
  if(manifest?.periodFallback&&query.from===manifest.period.from&&query.to===manifest.period.to)Object.assign(defaults,manifest.period);
  if(Object.entries(query).some(([key,value])=>value!==''&&value!=null&&key!=='newsGeography'&&!(key==='page'&&Number(value)===0)&&value!==defaults[key]))return null;
  if(manifest?.revision!==revision){requestDashboardSnapshots_();return null;}
  const cache=CacheService.getScriptCache(),key='dashboard-snapshot:'+revision+':'+language+':'+(query.newsGeography||''),cached=readDashboardCache_(cache,key);if(cached)return cached;
  try{
    const rows=book_().getSheetByName('DashboardSnapshots')?.getRange(manifest.first,1,manifest.parts,4).getDisplayValues();
    if(!rows||rows.some(([name,generation,part],index)=>name!==view||generation!==manifest.generation||Number(part)!==index))throw Error('Fragmentos incompletos');
    const encoded=rows.map(row=>row[3]).join('');if(sha256_(encoded)!==manifest.digest)throw Error('Contenido incompleto');
    const bundle=JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(encoded),'application/gzip')).getDataAsString()),variants=Object.hasOwn(bundle.variants,query.newsGeography)?bundle.variants[query.newsGeography]:bundle.variants[''],data=variants[view==='radar'?'es':language];
    const value={data,period:bundle.period,periodFallback:bundle.periodFallback};writeDashboardCache_(cache,key,value);return value;
  }catch(error){console.warn('Snapshot '+view+': '+String(error.message||error));if(dashboardSnapshotManifest_(view)?.generation===manifest.generation)properties_().deleteProperty('DASHBOARD_SNAPSHOT:'+view);requestDashboardSnapshots_();return null;}
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
  const view=DASHBOARD_SNAPSHOTS.views.find(view=>dashboardSnapshotManifest_(view)?.revision!==dashboardSnapshotRevision_(view));
  if(!view){properties_().deleteProperty('DASHBOARD_SNAPSHOT_REQUEST');return false;}
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
  properties_().setProperty('DASHBOARD_SNAPSHOT:'+view,JSON.stringify({revision,generation,slot,first,parts,digest:sha256_(encoded),generated:new Date().toISOString(),period,periodFallback}));
  telemetry_('dashboard-snapshot',Date.now()-started,'OK',view+'; '+period.from+' — '+period.to+'; anterior '+periodFallback+'; variantes '+Object.keys(variants).length+'; comprimido '+encoded.length+' caracteres');
  if(!dashboardSnapshotsPending_())properties_().deleteProperty('DASHBOARD_SNAPSHOT_REQUEST');return true;
}
function rebuildDashboardSnapshots(){authorize_(true);return withForegroundWrite_(()=>{for(const view of DASHBOARD_SNAPSHOTS.views)properties_().deleteProperty('DASHBOARD_SNAPSHOT:'+view);requestDashboardSnapshots_(true);return 'Snapshots de Novedades, Noticias y Radar en cola.';});}

function dashboardSnapshotsReady_(work){return !classificationPending_()&&!dailyCollectionPending_(work)&&!properties_().getProperty('DAILY_PIPELINE_REQUEST')&&dashboardSnapshotsPending_();}
