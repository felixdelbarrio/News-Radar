function getDashboard(query) {
  const started=Date.now(),session=authorize_(),feeds=feeds_(),config=configuration_();
  const initial=Boolean(query?.initial);query=dashboardQuery_(query);
  const content=dashboardContent_(query||{},feeds),runs=rows_('Ejecuciones',session.admin?10:1);
  const response={...content.data,
    initial,selection:query||{},defaults:dashboardQuery_({view:'news',initial:true}),preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:config.settings.dailyHour+':00 · '+config.settings.timezone},geographies:config.geographies,
    lastRun:runs.at(-1)?.inicio||'',sourceCount:feeds.length,daily:properties_().getProperty('DAILY_ENABLED')==='true',admin:session.admin,
    ...(session.admin?{maxFeeds:settings_().maxCustomFeeds,schedule:'Ventana: últimos '+settings_().windowDays+' días. Recopilación diaria a partir de las '+settings_().dailyHour+':00 ('+settings_().timezone+').',runs:runs.reverse(),feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl(),collection:collectionStatus_()}:{} )};
  return {...response,performance:{serverMs:Date.now()-started,newsMs:content.duration,cacheHit:content.cacheHit}};
}
function getAudit() { authorize_(true); return rows_('Auditoria',100).reverse(); }
function exportNews(query) {
  authorize_();return newsCsv_(rows_('Noticias',settings_().newsReadLimit),dashboardQuery_(query));
}

function dashboardContent_(query,feeds){
  const started=Date.now(),cache=CacheService.getScriptCache();
  const selection=Object.fromEntries(Object.keys(query).filter(key=>query[key]!==''&&query[key]!=null&&!(key==='page'&&Number(query[key])===0)).sort().map(key=>[key,query[key]]));
  const key='dashboard:'+RADAR.version+':'+configurationRevision_()+':'+(properties_().getProperty('NEWS_REVISION')||'0')+':'+JSON.stringify(selection);
  const cacheable=key.length<=250,cached=cacheable?cache.get(key):null;
  if(cached)return {data:JSON.parse(cached),duration:Date.now()-started,cacheHit:true};
  const data=newsDashboard_(rows_('Noticias',settings_().newsReadLimit),query,feeds),encoded=JSON.stringify(data);
  if(cacheable&&encoded.length<=90000&&encodeURIComponent(encoded).replace(/%[A-F\d]{2}/gi,'x').length<=90000)cache.put(key,encoded,60);
  return {data,duration:Date.now()-started,cacheHit:false};
}
function invalidateNews_(){properties_().setProperty('NEWS_REVISION',Date.now()+'-'+Math.random().toString(36).slice(2));}
