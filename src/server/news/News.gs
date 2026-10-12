function getDashboard(query) {
  const started=Date.now(),session=authorize_(),feeds=feeds_(),config=configuration_();
  const view=query?.view||'radar',initial=Boolean(query?.initial),language=supportedLanguage(query?.language)?query.language:'es',edition=query?.edition?newsletterEdition_(query.edition,session.email):null,personal=initial&&!edition&&['news','briefing','radar'].includes(view)?firstNewsSubscription_(session.email):null;
  query=dashboardQuery_(edition&&initial?{...edition.query,...(query.country?{country:query.country}:{}),...(query.entity?{entity:query.entity}:{}),view,initial:false}:!edition&&initial&&personal&&['news','briefing','radar'].includes(view)?personalDashboardQuery_(personal,view):query);
  const preparationMs=Date.now()-started,content=dashboardContent_(query||{},feeds,view,language,edition),metadataStarted=Date.now(),runs=dashboardRuns_();
  const response={...content.data,
    context:edition?{mode:'edition',id:edition.id,title:edition.title,from:edition.query.from,to:edition.query.to,count:edition.items.length,language:edition.language}:{mode:'current'},taxonomyTranslations:edition?edition.names:taxonomyTranslations_(),initial,selection:query||{},defaults:dashboardQuery_({view:'news',initial:true}),preferences:{timezone:config.settings.timezone,retentionDays:config.settings.retentionDays,eventLimit:config.settings.eventLimit,unknownCountry:config.settings.unknownCountry,dailyLabel:config.settings.dailyHour+':00 · '+config.settings.timezone},geographies:config.geographies,
    lastRun:runs.at(-1)?.inicio||'',collection:collectionStatus_(),newsRevision:properties_().getProperty('NEWS_REVISION')||'0',sourceCount:feeds.length,daily:dailyScheduleStatus_(),admin:session.admin,
    ...(session.admin?dashboardAdministration_():{})};
  return {...response,performance:{version:RADAR.version,serverMs:Date.now()-started,preparationMs,metadataMs:Date.now()-metadataStarted,newsMs:content.duration,cacheHit:content.cacheHit}};
}
function getAudit(query={}){authorize_(true);return administrativeRecords_('Auditoria',query,['fuente','resultado','ejecucion'],['fuente','resultado','motivo','url','ejecucion']);}
function exportNews(query) {
  const session=authorize_(),edition=query?.edition?newsletterEdition_(query.edition,session.email):null;
  return newsCsv_(edition?edition.items:rows_('Noticias',settings_().newsReadLimit),dashboardQuery_({...query,...(query.newsGeography?{country:query.newsGeography}:{})}),supportedLanguage(query?.language)?query.language:'es',Boolean(edition),edition?.names[query.language||'es']);
}

function dashboardContent_(query,feeds,view='radar',language='es',edition=null){
  const started=Date.now(),cache=CacheService.getScriptCache(),localized=view==='news'||view==='briefing';
  const selection=Object.fromEntries(Object.keys(query).filter(key=>query[key]!==''&&query[key]!=null&&!(key==='page'&&Number(query[key])===0)).sort().map(key=>[key,query[key]]));
  const key='dashboard:'+RADAR.version+':'+sha256_(JSON.stringify([configurationRevision_(),edition?edition.id:properties_().getProperty('NEWS_REVISION')||'0',view,selection,localized?[language,properties_().getProperty('TRANSLATIONS_REVISION')||'0']:null])),cached=cache.get(key);
  if(cached)return {data:JSON.parse(cached),duration:Date.now()-started,cacheHit:true};
  const data=newsDashboard_(edition?edition.items:cachedNewsRecords_(),query,feeds,view);
  if(edition){data.palanca=[...new Set(edition.items.flatMap(row=>row.taxonomia.map(item=>item.palanca)))];data.subpalanca=[...new Set(edition.items.flatMap(row=>row.taxonomia.map(taxonomyPath)))];}
  if(localized&&!edition){data.items=savedArticleTranslations_(data.items,language);if(data.briefing)data.briefing.items=savedArticleTranslations_(data.briefing.items,language);}
  cacheJson_(key,data,300);
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
