function getBootstrap(){return getDashboard({view:'runs'});}
function getDashboard(query) {
  const started=Date.now(),session=authorize_(),feeds=feeds_();
  const view=query?.view||'radar',initial=Boolean(query?.initial),language=supportedLanguage(query?.language)?query.language:'es',edition=query?.edition?newsletterEdition_(query.edition,session.email):null,personal=initial&&!edition&&readingViews.includes(view)?firstNewsSubscription_(session.email):null;
  query=dashboardQuery_(edition&&initial?{...edition.query,...(typeof query.country==='string'?{country:query.country}:{}),...(typeof query.entity==='string'?{entity:query.entity}:{}),...(query.palanca?{palanca:query.palanca}:{}),...(query.subpalanca?{subpalanca:query.subpalanca}:{}),...(query.benchmark?{benchmark:query.benchmark}:{}),view,initial:false}:!edition&&initial&&personal&&readingViews.includes(view)?personalDashboardQuery_(personal,view):{...query,view});
  const preparationMs=Date.now()-started,content=dashboardContent_(query||{},feeds,view,language,edition),metadataStarted=Date.now(),runs=dashboardRuns_(),metadata=dashboardMetadata_();
  const response={...content.data,
    ...(edition?{feedback:newsletterFeedback_(edition.id,session.email)}:{}),context:edition?{mode:'edition',id:edition.id,title:edition.title,editorial:edition.editorial,commentLimit:NEWSLETTER_EDITORIAL.commentChars,from:edition.query.from,to:edition.query.to,count:edition.items.length,language:edition.language}:{mode:'current'},...metadata,taxonomyTranslations:edition?edition.names:metadata.taxonomyTranslations,initial,selection:query||{},defaults:dashboardQuery_({view,initial:true}),geographies:edition?.editorial?.geographies||metadata.geographies,applicationScope:edition?.editorial?.scope||metadata.applicationScope,
    configurationRevision:configurationRevision_(),lastRun:runs.at(-1)?.fin||runs.at(-1)?.inicio||'',collection:collectionStatus_(),newsRevision:properties_().getProperty('NEWS_REVISION')||'0',sourceCount:feeds.length,daily:dailyScheduleStatus_(),admin:session.admin,
    ...(session.admin?dashboardAdministration_():{})};
  return {...response,performance:{version:RADAR.version,serverMs:Date.now()-started,preparationMs,metadataMs:Date.now()-metadataStarted,newsMs:content.duration,cacheHit:content.cacheHit}};
}
function getAudit(query={}){authorize_(true);return administrativeRecords_('Auditoria',query,['fuente','resultado','ejecucion'],['fuente','resultado','motivo','url','ejecucion']);}
function exportNews(query) {
  const session=authorize_(),edition=query?.edition?newsletterEdition_(query.edition,session.email):null;
  const selection=dashboardQuery_(edition?{...edition.query,...query}:query),rows=edition&&query.benchmark?newsletterComparisonRows_(edition.items,edition.editorial,query.benchmark):edition?edition.items:cachedNewsRecords_();
  return newsCsv_(newsGeographySelection_(rows,selection,applicationGeography(edition?.editorial?.scope||configuration_().applicationScope,selection.segment)),selection,supportedLanguage(query?.language)?query.language:'es',true,edition?.names[query.language||'es'],edition?snapshotEntity_:entityKey_);
}

function dashboardContent_(query,feeds,view='radar',language='es',edition=null){
  const started=Date.now();if(!readingViews.includes(view))return {data:{},duration:0,cacheHit:false};
  const cache=CacheService.getScriptCache(),localized=view==='news'||view==='briefing';
  const selection=Object.fromEntries(Object.keys(query).filter(key=>query[key]!==''&&query[key]!=null&&!(key==='page'&&Number(query[key])===0)).sort().map(key=>[key,query[key]]));
  const key='dashboard-fragments:'+RADAR.version+':'+sha256_(JSON.stringify([configurationRevision_(),edition?edition.id:properties_().getProperty('NEWS_RECORDS_REVISION')||'0',view,selection,localized?[language,properties_().getProperty('TRANSLATIONS_REVISION:'+language)||'0']:null])),cached=readDashboardCache_(cache,key);
  if(cached)return {data:cached,duration:Date.now()-started,cacheHit:true};
  const data=newsDashboard_(edition&&query.benchmark?newsletterComparisonRows_(edition.items,edition.editorial,query.benchmark):edition?edition.items:cachedNewsRecords_(),query,edition?[]:feeds,view,edition?(edition.editorial||{}):null);
  if(edition){data.palanca=[...new Set(edition.items.flatMap(row=>row.taxonomia.map(item=>item.palanca)))];data.subpalanca=[...new Set(edition.items.flatMap(row=>row.taxonomia.map(taxonomyPath)))];}
  if(localized&&!edition){data.items=savedArticleTranslations_(data.items,language);if(data.briefing)data.briefing.items=savedArticleTranslations_(data.briefing.items,language);}
  writeDashboardCache_(cache,key,data);
  return {data,duration:Date.now()-started,cacheHit:false};
}
function invalidateNews_(content=true,records=true){const revision=Date.now()+'-'+Math.random().toString(36).slice(2);properties_().setProperty('NEWS_REVISION',revision);if(content)properties_().setProperty('NEWS_CONTENT_REVISION',revision);if(records)properties_().setProperty('NEWS_RECORDS_REVISION',revision);}

function dashboardRuns_(){
  const cache=CacheService.getScriptCache(),key='dashboard-runs:'+RADAR.version,cached=cache.get(key);
  if(cached)return JSON.parse(cached);
  const runs=rows_('Ejecuciones',1);cacheJson_(key,runs,15);
  return runs;
}

function getRuns(query={}){authorize_(true);const records=administrativeRecords_('Ejecuciones',query,['estado','id'],['estado','errores','id'],'inicio'),jobs=new Map(collectionJobs_().map(job=>[job.id,job]));return {...records,collection:collectionStatus_(),items:records.items.map(row=>({...row,tipo:jobs.get(row.id)?.tipo||'',desde:jobs.get(row.id)?.desde||'',hasta:jobs.get(row.id)?.hasta||''}))};}
function getCollectionProgress(){authorize_();return {collection:collectionStatus_(),newsRevision:properties_().getProperty('NEWS_REVISION')||'0'};}

function dashboardMetadata_(){
  const key='dashboard-metadata:'+RADAR.version+':'+sha256_(JSON.stringify([configurationRevision_(),properties_().getProperty('TAXONOMY_REVISION')||'0',properties_().getProperty('TAXONOMY_TRANSLATIONS_REVISION')||'0'])),cache=CacheService.getScriptCache(),cached=readDashboardCache_(cache,key);
  if(cached)return cached;
  const config=configuration_(),value={taxonomyTranslations:taxonomyTranslations_(),geographies:config.geographies,applicationScope:config.applicationScope,preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:collectionScheduleLabel_()}};
  writeDashboardCache_(cache,key,value);return value;
}
