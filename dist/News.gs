function radarAvailableYears_(){
  const current=recordDay(new Date(),settings_().timezone).slice(0,4),key='radar-years:'+RADAR.version+':'+newsStorageKey_()+':'+(properties_().getProperty('NEWS_RECORDS_REVISION')||'0')+':'+current,cache=CacheService.getScriptCache(),cached=cache.get(key);if(cached)return JSON.parse(cached);
  const years=[...new Set(businessNewsIndex_().rows.map(row=>row.fecha.slice(0,4)).filter(year=>/^\d{4}$/.test(year)&&year>='2000'&&year<=current))].sort().reverse();cacheJson_(key,years,NEWS_CACHE.seconds);return years;
}
function getDashboard(query) {
  const started=Date.now(),session=authorize_(),feeds=feeds_();
  const view=query?.view||'radar',initial=Boolean(query?.initial),automaticPeriod=initial||!query?.from&&!query?.to,language=supportedLanguage(query?.language)?query.language:'es',edition=query?.edition&&view==='news'?newsletterEdition_(query.edition,session.email,session.admin):null;
  if(edition&&initial&&view==='news'&&query.country&&!query.newsGeography&&!['entity','palanca','subpalanca','benchmark'].some(key=>query[key]))query={...query,newsGeography:applicationGeography(edition.editorial?.scope||configuration_().applicationScope,edition.query.segment)({pais:query.country}),country:''};
  query=dashboardQuery_(edition&&initial?{...edition.query,...(typeof query.country==='string'?{country:query.country}:{}),...(typeof query.entity==='string'?{entity:query.entity}:{}),...(query.palanca?{palanca:query.palanca}:{}),...(query.subpalanca?{subpalanca:query.subpalanca}:{}),...(query.benchmark?{benchmark:query.benchmark}:{}),...(typeof query.newsGeography==='string'?{newsGeography:query.newsGeography}:{}),view,initial:false}:{...(edition?.query||{}),...query,view},new Date(),!edition);
  const preparationMs=Date.now()-started,contentStarted=Date.now(),canFallback=!edition&&readingViews.includes(view)&&automaticPeriod,snapshot=!edition?defaultDashboardSnapshot_(view,query,language):null;let periodFallback=Boolean(snapshot?.periodFallback);
  if(snapshot)query={...query,...snapshot.period};
  if(!snapshot&&canFallback&&newsPeriodCount_(query)===0){query={...query,...dashboardPeriod_(view,new Date(),true)};periodFallback=true;}
  let content=snapshot?{data:snapshot.data,cacheHit:true,snapshotHit:true}:dashboardContent_(query||{},feeds,view,language,edition);
  if(!snapshot&&canFallback&&!periodFallback&&(view==='briefing'?content.data.briefing.total:content.data.total)===0){query={...query,...dashboardPeriod_(view,new Date(),true)};content=dashboardContent_(query,feeds,view,language);periodFallback=true;}
  const newsMs=Date.now()-contentStarted;
  const metadataStarted=Date.now(),metadata=dashboardMetadata_(),catalogMs=Date.now()-metadataStarted,operationStarted=Date.now(),operation=dashboardOperation_(session.admin),operationMs=Date.now()-operationStarted,yearsStarted=Date.now(),years=view==='radar'?(content.data.years||radarAvailableYears_()):null,yearsMs=Date.now()-yearsStarted,dailyStarted=Date.now(),daily=dailyScheduleStatus_(),dailyMs=Date.now()-dailyStarted;
  const response={...content.data,...(view==='radar'?{years}:{}),
    ...(edition?{feedback:newsletterFeedback_(edition.id,session.email)}:{}),context:edition?{mode:'edition',id:edition.id,title:edition.title,editorial:edition.editorial,commentLimit:NEWSLETTER_EDITORIAL.commentChars,from:edition.query.from,to:edition.query.to,count:edition.items.length,language:edition.language}:{mode:'current',periodFallback},...metadata,taxonomyTranslations:edition?edition.names:metadata.taxonomyTranslations,initial,selection:query||{},defaults:dashboardQuery_({view,initial:true}),geographies:edition?.editorial?.geographies||metadata.geographies,applicationScope:edition?.editorial?.scope||metadata.applicationScope,
    configurationRevision:configurationRevision_(),...operation,daily,newsRevision:publishedNewsRevision_(),sourceCount:feeds.length,admin:session.admin};
  return {...response,performance:{version:RADAR.version,serverMs:Date.now()-started,preparationMs,metadataMs:Date.now()-metadataStarted,metadataDetails:{catalogMs,operationMs,yearsMs,dailyMs},newsMs,cacheHit:content.cacheHit,snapshotHit:Boolean(content.snapshotHit)}};
}
function exportNews(query) {
  const session=authorize_(),edition=query?.edition&&(query.view||'news')==='news'?newsletterEdition_(query.edition,session.email,session.admin):null;
  const selection=dashboardQuery_(edition?{...edition.query,...query}:query,new Date(),!edition),rows=edition&&query.benchmark?newsletterComparisonRows_(edition.items,edition.editorial,query.benchmark):edition?edition.items:cachedNewsRecords_(selection);
  return newsCsv_(newsGeographySelection_(rows,selection,newsReadingGeography_(edition?.editorial,selection)),selection,supportedLanguage(query?.language)?query.language:'es',true,edition?.names[query.language||'es'],edition?snapshotEntity_:entityKey_,newsReadingGeography_(edition?.editorial,selection));
}

function dashboardContent_(query,feeds,view='radar',language='es',edition=null){
  const started=Date.now();if(!readingViews.includes(view))return {data:{},duration:0,cacheHit:false};
  const cache=CacheService.getScriptCache(),localized=view==='news'||view==='briefing';
  const selection=Object.fromEntries(Object.keys(query).filter(key=>query[key]!==''&&query[key]!=null&&!(key==='page'&&Number(query[key])===0)).sort().map(key=>[key,query[key]]));
  const key=dashboardCacheKey_(selection,view,localized?language:null,edition),cached=readDashboardCache_(cache,key);
  if(cached)return {data:cached,duration:Date.now()-started,cacheHit:true};
  // A page-independent plan stores row positions and compact metrics, never article bodies.
  const paginated=!edition&&view==='news',sharedKey=paginated?dashboardCacheKey_(Object.fromEntries(Object.entries(selection).filter(([key])=>key!=='page')),view,localized?language:null):null;
  const plan=paginated?readDashboardCache_(cache,sharedKey+':selection'):null;
  if(plan){
    const page=Math.min(Math.max(0,Math.floor(Number(query.page)||0)),Math.max(0,Math.ceil(plan.positions.length/settings_().pageSize)-1)),positions=plan.positions.slice(page*settings_().pageSize,(page+1)*settings_().pageSize),records=new Map(annotateNews_(newsRowsAt_(positions.slice().sort((a,b)=>a-b))).map(row=>[row._sheetRow,row]));
    const data={...plan.data,page,items:positions.map(position=>records.get(position))};
    if(localized)data.items=savedArticleTranslations_(data.items,language);
    dashboardArticleFields_(data);writeDashboardCache_(cache,key,data);return {data,duration:Date.now()-started,cacheHit:true};
  }
  let positions;
  const data=newsDashboard_(edition&&query.benchmark?newsletterComparisonRows_(edition.items,edition.editorial,query.benchmark):edition?edition.items:cachedNewsRecords_(query),query,edition?[]:feeds,view,edition?(edition.editorial||{}):null,paginated?ordered=>{positions=ordered.map(row=>row._sheetRow);}:null,view==='radar'&&!edition?radarPreviousRows_(query):null);
  if(!edition)dashboardCatalogOptions_(data,feeds);
  if(edition){data.palanca=[...new Set(edition.items.flatMap(row=>row.taxonomia.map(item=>item.palanca)))];data.subpalanca=[...new Set(edition.items.flatMap(row=>row.taxonomia.filter(item=>item.subpalanca).map(taxonomyPath)))];}
  if(localized&&!edition){data.items=savedArticleTranslations_(data.items,language);if(data.briefing)data.briefing.items=savedArticleTranslations_(data.briefing.items,language);}
  if(paginated&&positions?.every(Number.isInteger)){const {items,page,...metadata}=data;writeDashboardCache_(cache,sharedKey+':selection',{data:metadata,positions});}
  dashboardArticleFields_(data);writeDashboardCache_(cache,key,data);
  return {data,duration:Date.now()-started,cacheHit:false};
}
function invalidateNews_(content=true,records=true){invalidateDashboardSnapshots_();const revision=Date.now()+'-'+Math.random().toString(36).slice(2);properties_().setProperty('NEWS_REVISION',revision);if(content)properties_().setProperty('NEWS_CONTENT_REVISION',revision);if(records)properties_().setProperty('NEWS_RECORDS_REVISION',revision);}

function dashboardRuns_(){
  const cache=CacheService.getScriptCache(),key='dashboard-runs:'+RADAR.version,cached=cache.get(key);
  if(cached)return JSON.parse(cached);
  const runs=rows_('Ejecuciones',1);cacheJson_(key,runs,15);
  return runs;
}

function getCollectionProgress(){authorize_();return {collection:collectionStatus_(),newsRevision:publishedNewsRevision_()};}

let dashboardMetadataMemory_;
function dashboardMetadata_(){
  const p=properties_().getProperties(),signature=JSON.stringify([RADAR.version,taxonomyStorageKey_(),p.CONFIG_REVISION||'0',p.TAXONOMY_REVISION||'0',p.TAXONOMY_TRANSLATIONS_REVISION||'0']),key='dashboard-metadata:'+sha256_(signature);
  if(dashboardMetadataMemory_?.signature===signature)return dashboardMetadataMemory_.value;
  const cache=CacheService.getScriptCache(),encoded=cache.get(key);
  if(encoded){const value=JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(encoded),'application/gzip')).getDataAsString());dashboardMetadataMemory_={signature,value};return value;}
  const config=configuration_(),value={taxonomyTranslations:taxonomyTranslations_(),geographies:config.geographies,applicationScope:config.applicationScope,preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:collectionScheduleLabel_()}};
  const compressed=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(value),'application/json')).getBytes());
  if(compressed.length<=90000)try{cache.put(key,compressed,NEWS_CACHE.seconds);}catch(_){}
  dashboardMetadataMemory_={signature,value};return value;
}

function dashboardArticleFields_(data){
  const clean=({_sheetRow,identityTitles,...row})=>row;
  data.items=data.items.map(clean);if(data.briefing)data.briefing.items=data.briefing.items.map(clean);
}

function dashboardCacheKey_(selection,view,language,edition=null){
  return 'dashboard-fragments:'+newsStorageKey_()+':'+taxonomyStorageKey_()+':'+RADAR.version+':'+sha256_(JSON.stringify([NEWS_CACHE.schema,llmRevision_(),configurationRevision_(),edition?[edition.id,newsletterArchiveKey_()]:properties_().getProperty('NEWS_RECORDS_REVISION')||'0',view,Object.fromEntries(Object.entries(selection).filter(([key,value])=>value!==''&&value!=null&&!(key==='page'&&Number(value)===0)).sort(([a],[b])=>a.localeCompare(b))),Object.keys(languageNames).map(code=>properties_().getProperty('TRANSLATIONS_REVISION:'+code)||'0'),language]));
}

function dashboardCatalogOptions_(data,feeds){
  const index=newsRecordIndex_();data.entities=[...new Set([...index.entities.map(entityKey_),...feeds.map(feed=>entityKey_(feed.entity))])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));data.sources=[...new Set(index.sources.map(publisherKey_))].sort((a,b)=>a.localeCompare(b,'es'));
}

// Volatile status shares the existing 15-second freshness budget; publication revision stays live.
function dashboardOperation_(admin){
  const cache=CacheService.getScriptCache(),key='dashboard-operation:'+RADAR.version+':'+configurationRevision_()+':'+admin,cached=cache.get(key);if(cached)return JSON.parse(cached);
  const runs=dashboardRuns_(),value={lastRun:runs.at(-1)?.fin||runs.at(-1)?.inicio||'',collection:collectionStatus_(),...(admin?dashboardAdministration_():{})};cacheJson_(key,value,15);return value;
}

function getControlPanel(){authorize_(true);progressContextMemory_=undefined;const started=Date.now(),collection=collectionStatus_(),schedule=getOperationalSchedule(),result={groups:controlPanelGroups_(collection,schedule),collection,archive:schedule.archive,daily:dailyScheduleStatus_()};telemetry_('control-panel',Date.now()-started,'OK',result.groups.length+' grupos operativos');return result;}
