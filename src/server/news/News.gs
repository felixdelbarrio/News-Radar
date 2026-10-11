function getDashboard(query) {
  const started=Date.now(),session=authorize_(),feeds=feeds_(),config=configuration_();
  const view=query?.view||'radar',initial=Boolean(query?.initial);query=dashboardQuery_(query);
  const preparationMs=Date.now()-started,content=dashboardContent_(query||{},feeds,view),metadataStarted=Date.now(),runs=dashboardRuns_();
  const response={...content.data,
    initial,selection:query||{},defaults:dashboardQuery_({view:'news',initial:true}),preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:config.settings.dailyHour+':00 · '+config.settings.timezone},geographies:config.geographies,
    lastRun:runs.at(-1)?.inicio||'',sourceCount:feeds.length,daily:properties_().getProperty('DAILY_ENABLED')==='true',admin:session.admin,
    ...(session.admin?{maxFeeds:settings_().maxCustomFeeds,schedule:'Ventana: últimos '+settings_().windowDays+' días. Recopilación diaria a partir de las '+settings_().dailyHour+':00 ('+settings_().timezone+').',runs:runs.reverse(),feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl(),collection:collectionStatus_()}:{} )};
  return {...response,performance:{version:RADAR.version,serverMs:Date.now()-started,preparationMs,metadataMs:Date.now()-metadataStarted,newsMs:content.duration,cacheHit:content.cacheHit}};
}
function getAudit(query={}){authorize_(true);return administrativeRecords_('Auditoria',query,['fuente','resultado','ejecucion'],['fuente','resultado','motivo','url','ejecucion']);}
function exportNews(query) {
  authorize_();return newsCsv_(rows_('Noticias',settings_().newsReadLimit),dashboardQuery_(query));
}

function dashboardContent_(query,feeds,view='radar'){
  const started=Date.now(),cache=CacheService.getScriptCache();
  const selection=Object.fromEntries(Object.keys(query).filter(key=>query[key]!==''&&query[key]!=null&&!(key==='page'&&Number(query[key])===0)).sort().map(key=>[key,query[key]]));
  const key='dashboard:'+RADAR.version+':'+sha256_(JSON.stringify([configurationRevision_(),properties_().getProperty('NEWS_REVISION')||'0',view,selection])),cached=cache.get(key);
  if(cached)return {data:JSON.parse(cached),duration:Date.now()-started,cacheHit:true};
  const data=newsDashboard_(rows_('Noticias',settings_().newsReadLimit),query,feeds,view),encoded=JSON.stringify(data);
  if(encoded.length<=90000&&encodeURIComponent(encoded).replace(/%[A-F\d]{2}/gi,'x').length<=90000)cache.put(key,encoded,60);
  return {data,duration:Date.now()-started,cacheHit:false};
}
function invalidateNews_(){properties_().setProperty('NEWS_REVISION',Date.now()+'-'+Math.random().toString(36).slice(2));}

function dashboardRuns_(){
  const cache=CacheService.getScriptCache(),key='dashboard-runs:'+RADAR.version,cached=cache.get(key);
  if(cached)return JSON.parse(cached);
  const runs=rows_('Ejecuciones',10),encoded=JSON.stringify(runs);
  if(encodeURIComponent(encoded).replace(/%[A-F\d]{2}/gi,'x').length<=90000)cache.put(key,encoded,15);
  return runs;
}
