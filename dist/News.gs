function getDashboard(query) {
  const started=Date.now(),session=authorize_(),feeds=feeds_(),config=configuration_();
  const view=query?.view||'radar',initial=Boolean(query?.initial),language=supportedLanguage(query?.language)?query.language:'es';query=dashboardQuery_(query);
  const preparationMs=Date.now()-started,content=dashboardContent_(query||{},feeds,view,language),metadataStarted=Date.now(),runs=dashboardRuns_();
  const response={...content.data,
    initial,selection:query||{},defaults:dashboardQuery_({view:'news',initial:true}),preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:config.settings.dailyHour+':00 · '+config.settings.timezone},geographies:config.geographies,
    lastRun:runs.at(-1)?.inicio||'',collection:collectionStatus_(),newsRevision:properties_().getProperty('NEWS_REVISION')||'0',sourceCount:feeds.length,daily:scheduledTriggers_('dailyRadar_').length>0,admin:session.admin,
    ...(session.admin?{maxFeeds:settings_().maxCustomFeeds,schedule:'Ventana: últimos '+settings_().windowDays+' días. Recopilación diaria a partir de las '+settings_().dailyHour+':00 ('+settings_().timezone+').',feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl()}:{} )};
  return {...response,performance:{version:RADAR.version,serverMs:Date.now()-started,preparationMs,metadataMs:Date.now()-metadataStarted,newsMs:content.duration,cacheHit:content.cacheHit}};
}
function getAudit(query={}){authorize_(true);return administrativeRecords_('Auditoria',query,['fuente','resultado','ejecucion'],['fuente','resultado','motivo','url','ejecucion']);}
function exportNews(query) {
  authorize_();return newsCsv_(rows_('Noticias',settings_().newsReadLimit),dashboardQuery_(query));
}

function dashboardContent_(query,feeds,view='radar',language='es'){
  const started=Date.now(),cache=CacheService.getScriptCache(),localized=view==='news'||view==='briefing';
  const selection=Object.fromEntries(Object.keys(query).filter(key=>query[key]!==''&&query[key]!=null&&!(key==='page'&&Number(query[key])===0)).sort().map(key=>[key,query[key]]));
  const key='dashboard:'+RADAR.version+':'+sha256_(JSON.stringify([configurationRevision_(),properties_().getProperty('NEWS_REVISION')||'0',view,selection,localized?[language,properties_().getProperty('TRANSLATIONS_REVISION')||'0']:null])),cached=cache.get(key);
  if(cached)return {data:JSON.parse(cached),duration:Date.now()-started,cacheHit:true};
  const data=newsDashboard_(rows_('Noticias',settings_().newsReadLimit),query,feeds,view);
  if(localized){data.items=savedArticleTranslations_(data.items,language);if(data.briefing)data.briefing.items=savedArticleTranslations_(data.briefing.items,language);}
  cacheJson_(key,data,60);
  return {data,duration:Date.now()-started,cacheHit:false};
}
function invalidateNews_(content=true){const revision=Date.now()+'-'+Math.random().toString(36).slice(2);properties_().setProperty('NEWS_REVISION',revision);if(content)properties_().setProperty('NEWS_CONTENT_REVISION',revision);}

function dashboardRuns_(){
  const cache=CacheService.getScriptCache(),key='dashboard-runs:'+RADAR.version,cached=cache.get(key);
  if(cached)return JSON.parse(cached);
  const runs=rows_('Ejecuciones',1);cacheJson_(key,runs,15);
  return runs;
}

function getRuns(query={}){authorize_(true);const records=administrativeRecords_('Ejecuciones',query,['estado','id'],['estado','errores','id'],'inicio'),jobs=new Map(collectionJobs_().map(job=>[job.id,job]));return {...records,collection:collectionStatus_(),items:records.items.map(row=>({...row,tipo:jobs.get(row.id)?.tipo||'',desde:jobs.get(row.id)?.desde||'',hasta:jobs.get(row.id)?.hasta||''}))};}
function getCollectionProgress(){authorize_();return {collection:collectionStatus_(),newsRevision:properties_().getProperty('NEWS_REVISION')||'0'};}
