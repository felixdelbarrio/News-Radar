import {configurationDefaults} from './configuration-defaults.mjs';
import {registerServer} from './local-server.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {readServerScript,renderIncludes} from './source.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const seed=configurationDefaults();
const context=vm.createContext({});vm.runInContext(readServerScript(),context);context.configuration_=()=>seed;context.sha256_=value=>createHash('sha256').update(value).digest('hex');
const feeds=seed.feeds,now=new Date('2026-10-09T10:00:00+02:00');
const raw=JSON.parse(fs.readFileSync(path.join(root,'assets/feed-snapshot.json'),'utf8'));
const rows=raw.flatMap((item,i)=>{
  const feed=feeds[i<10?0:1],result=context.evaluate_(item,feed,now);if(!result.item)return [];
  const n=result.item;return [{id:String(i),fecha:n.date.toISOString().slice(0,10),pais:n.country,medio:feed.name,entidad:feed.entity,titular:n.title,extracto:n.excerpt,url:n.url,fuente:feed.name,idioma:n.language||feed.language||'',clasificacion:JSON.stringify(n.labels)}];
});
const taxonomyState={documents:0,candidates:{}},definitions=context.taxonomyDefinitions(seed.taxonomy),excluded=new Set(seed.entities.flatMap(row=>[row.name,...row.aliases]).map(context.taxonomyText));
for(const row of rows){const text=context.taxonomyText(row.titular+' '+row.extracto);if(context.taxonomyEligible_(context.searchText_(row.titular),text))context.taxonomyObserve(taxonomyState,text,definitions,excluded);}
const taxonomy=context.taxonomyBuild(taxonomyState).map(row=>({id:createHash('sha256').update(row.key).digest('hex').slice(0,24),palanca:row.palanca,subpalanca:row.subpalanca,segmentos:row.segments,terminos:row.terms,noticias:row.df,peso:row.peso,origen:row.origin,descripcion:row.description||'',context:row.context||[],exclude:row.exclude||[]}));
for(const row of rows)row.taxonomia=JSON.stringify(context.taxonomyRecord_(row.titular,row.extracto,taxonomy));
const taxonomyNames=Object.fromEntries(['es','en','tr'].map(language=>[language,Object.fromEntries(taxonomy.flatMap(row=>{const parent=language==='es'?row.palanca:context.translateText(row.palanca,language),child=language==='es'?row.subpalanca:context.translateText(row.subpalanca,language);return [[row.palanca,parent],...(child?[[row.subpalanca,child],[context.taxonomyPath(row),parent+' › '+child]]:[])];}))]));
const names=['briefingAllowed','radarOutageSelection_','radarOutages_','radarPreviousPeriod_','settings_','searchText_','businessIndex_','phraseMatch_','phrasePosition_','phrasePattern_','headlineEntity_','digitalAssessment_','newsRelevance_','newsLabels_','taxonomySaved_','taxonomyOptions_','taxonomyLanguage_','taxonomyPath','taxonomySubLabel','taxonomyChoices','savedNewsLabels_','classification_','localizedSearchTerms_','capabilitySearchTerms_','catalogueSearchRows_','taxonomyText','collectionSearchTerms_','validateCapabilities_','santanderExcluded_','sourceCountry_','domainCountry_','sourceGeographies_','newsCountry_','publisherKey_','annotateNews_','effectiveTaxonomyAssignment_','validateTaxonomyAssignment_','entityKey_','selectNews_','selectAnnotatedNews_','uniqueNews_','newsUrlIdentity_','titleKey_','titleIdentity_','editorialIdentity_','equivalentEditorialTitle_','duplicateTitleEntries_','duplicateTitleEntry_','rememberTitle_','newsRepresentative_','snapshotEntity_','newsScope_','newsGeographySelection_','newsReadingGeography_','radarMetrics_','taxonomyHeatmap_','entityOrder','entityVolumeOrder','newsEntityGroups','newsEntityPage','applicationGeography','geographyOrder','geographyLabel','publicationOrder','noveltyOverview','noveltyGroups','noveltyCount','briefing_','newsDashboard_','safeCell_','newsCsv_','canonicalUrl_','domainMatches_','plainText_','validateConfiguration_','validateTaxonomy_','functionalConfigurationSettings_','functionalRuleSettings','functionalConditions','collectionPeriod_','countryScopedSource_','profileFeed_','defaultFeeds_','customFeeds_','configuredFeeds_','feeds_','saveFeeds','saveSourceSettings','subscriptionFilters_','subscriptionRecord_','newsletterCountries_','subscriptionQuery_','subscriptionDefaults_','calendarDate_','dashboardPeriod_','newsletterSubject_','newsletterDeliveryId_','dashboardQuery_','collectionRange_','newsletterWindow','readingWindow','newsletterPeriod_','newsletterEmail_','newsletterNextDate_','eventDuration_','metrics_','recordText','recordQuery','filterRecords','recordOptions','recordPage','recordDay','adminLogSelection_','adminLogMetrics_','feedbackKpis_','adminFeedbackSelection_','translationMatcher','translateText','supportedLanguage','feedLanguage'];
const shared=names.map(name=>context[name].toString()).join('\n'),serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c');
context.properties_=()=>({getProperties:()=>({}),getProperty:()=>null});
context.progressContext_=()=>({});context.jobProgressState_=(_stage,job)=>context.progressState({state:job.state,lastExecutedAt:job.updated||''});
context.snapshotJobsPending_=()=>false;context.dashboardSnapshotsPending_=()=>false;
context.getNewsletterProgress=()=>({job:{state:'Completada',total:0,processed:0},queued:false});
const previewSchedule={jobs:[...context.collectionSchedules_().map(job=>({...job,expected:job.enabled?1:0,valid:true})),{handler:'scheduledNewsletters_',hour:seed.settings.newsletterHour,minute:seed.settings.newsletterMinute,timezone:seed.settings.timezone,expected:seed.settings.newsletterEnabled?1:0,valid:true},{handler:'backgroundWatchdog_',expected:1,valid:true}]};
const previewControlPanel={groups:context.controlPanelGroups_({jobs:[]},previewSchedule),collection:{jobs:[]},archive:{},daily:true};
const previewDelay=Math.min(5000,Math.max(0,Number(process.env.PREVIEW_LATENCY_MS)||0));
const preview=`<script>(()=>{
const ADMIN_PAGE_SIZE=${serialize(vm.runInContext('ADMIN_PAGE_SIZE',context))};
const ADMIN_LOGS=${serialize(vm.runInContext('ADMIN_LOGS',context))};
const rows_=(name,limit,width)=>name==='Adopcion'?usage:[];
const otherGeography=${serialize(vm.runInContext('otherGeography',context))};
const applicationScopeSegments=${serialize(vm.runInContext('applicationScopeSegments',context))};
const readingViews=${serialize(vm.runInContext('readingViews',context))};
const INCIDENT_SIGNAL=${serialize(vm.runInContext('INCIDENT_SIGNAL',context))};
const BRIEFING_ALLOWED_SIGNALS=${serialize(vm.runInContext('BRIEFING_ALLOWED_SIGNALS',context))};
const sectorNewsDefaults=${serialize(vm.runInContext('sectorNewsDefaults',context))};
const coverageOptions=${serialize(vm.runInContext('coverageOptions',context))};
const subscriptionFilterKeys=${serialize(vm.runInContext('subscriptionFilterKeys',context))};
const newsletterCadences=${serialize(vm.runInContext('newsletterCadences',context))};
const translationMatchers=new Map();
const translations=${serialize(vm.runInContext('translations',context))};
const languageNames=${serialize(vm.runInContext('languageNames',context))};
let collectionLanguageMemory_,catalogueSearchMemory_,taxonomyMemory_;
const COLLECTION_POLICY=${serialize(vm.runInContext('COLLECTION_POLICY',context))};
const RELEVANCE_ROLES=${serialize(vm.runInContext('RELEVANCE_ROLES',context))};
const CLASSIFICATION_WORK=${serialize(vm.runInContext('CLASSIFICATION_WORK',context))};
const capabilityDefaults=${serialize(seed.capabilities)};

const DOMAIN_COUNTRY_CODES=${serialize(vm.runInContext('DOMAIN_COUNTRY_CODES',context))};
const DOMAIN_COUNTRY_PUBLISHERS=${serialize(vm.runInContext('DOMAIN_COUNTRY_PUBLISHERS',context))};
const domainCountryIndexes_=new WeakMap();
const newsRelevanceMemory_=new WeakMap();
const EDITORIAL_STOPWORDS=new Set(${serialize(vm.runInContext("[...EDITORIAL_STOPWORDS]",context))});
const RADAR=${serialize(vm.runInContext('RADAR',context))};
let configuration=${serialize(seed)},businessIndexMemory_,configuredFeedMemory_,sourceGeographyMemory_,revision='0',recordDateFormatter;const selections=[],usage=[],feedbackRows=[{id:'preview-feedback',edicion:'preview-edition',nombre_edicion:'Balance de Empresas',fecha_envio:'2026-10-01T10:00:00Z',cadencia:'quarterly',pais:'España',idioma:'es',correo:'usuario@bbva.com',valoracion:'positive',comentario:'La selección resulta útil para seguir las novedades.',estado:'pendiente',fecha:'2026-10-10T12:00:00Z'}];
const configuration_=()=>configuration,rows=${serialize(rows)},admin=${process.env.PREVIEW_ADMIN==='1'};
const authorize_=()=>{if(!admin)throw Error('Acción de administrador.');};
const configurationRevision_=()=>revision;
const properties_=()=>({getProperty:()=>revision});
const translationIdentityRows_=rows=>rows;
const llmState_=()=>({});
const llmIndex_=()=>new Map();
const llmStrongResult_=()=>false;
const llmEditorialExclusion_=()=>false;
const taxonomyCatalog_=()=>${serialize(taxonomy)},taxonomyTranslations_=()=>(${serialize(taxonomyNames)});
const taxonomyValidationIndex_=()=>({ids:new Set(taxonomyCatalog_().map(row=>row.id)),model:${serialize(context.taxonomyModelRevision_(taxonomy))}});
function writeConfiguration_(config,version){authorize_();if(version!==revision)throw Error('La configuración ha cambiado. Recarga los catálogos.');validateConfiguration_(config);configuration=JSON.parse(JSON.stringify(config));revision=String(Number(revision)+1);return 'Configuración local guardada en memoria. No se ha escrito en Google.';}
${shared}
window.RADAR_PREVIEW={async call(method,q={},query={}){
${previewDelay?`if(method!=='recordEvents')await new Promise(resolve=>setTimeout(resolve,${previewDelay}));`:''}
 if(method==='resumeCollection'){authorize_();return {added:0,pending:0,errors:[],notice:'Vista local: no hay recuperaciones remotas en curso.'};}
 if(method==='collectNow'){authorize_();const range=(q||'today')!=='year'?collectionRecentRange_(new Date()):collectionRange_(q,new Date()),available=rows.filter(row=>row.fecha>=range.from&&row.fecha<=range.to).length;return {added:0,pending:0,errors:[],notice:'Vista local: '+available+' noticias de la instantánea en el período '+range.from+' / '+range.to+'. La consulta remota se ejecuta únicamente en Apps Script.'};}
 if(method==='recordEvents'){usage.push(...q.map(event=>({fecha:new Date().toISOString(),correo:'usuario@bbva.com',sesion:event.session,evento:event.event,vista:event.view,duracion_ms:eventDuration_(event.duration)})));if(usage.length>settings_().eventLimit)usage.splice(0,usage.length-settings_().eventLimit);return {saved:true};}
 if(method==='getMyNewsletterHistory')return {...recordPage([],q),options:{},limit:settings_().eventLimit,limited:false};
 if(method==='getControlPanel'){authorize_();return ${serialize(previewControlPanel)};}
 if(method==='getAdminLogs'){authorize_();const data=adminLogSelection_(q,query);return {...data,...recordPage(data.items,query,ADMIN_PAGE_SIZE)};}
 if(method==='exportAdminLogs'){authorize_();const data=adminLogSelection_(q,query),cell=value=>'"'+String(safeCell_(value??'')).replace(/"/g,'""')+'"';return {csv:String.fromCharCode(65279)+[data.columns,...data.items.map(row=>data.columns.map(key=>row[key]))].map(row=>row.map(cell).join(',')).join(String.fromCharCode(13,10)),count:data.items.length};}
 if(method==='getLlmCategorization'){authorize_();return {mode:'deterministic',revision:'0',total:rows.length,valid:0,pending:rows.length,percent:0,projectUrl:'https://chatgpt.com/g/g-p-6ad52125ec4881a4857081893e339cd5',instructions:'Vista local. El flujo offline opera en Apps Script.',job:null,limits:{importBytes:2097152,importRows:250}};}
 if(['saveLlmCategorization','exportLlmPending','importLlmResults'].includes(method))throw Error('El flujo offline requiere el libro real en Apps Script.');
 if(method==='getTaxonomyStatus'){authorize_();return {scheduled:false,hour:settings_().dailyHour,minute:45,timezone:settings_().timezone,job:null,items:taxonomyCatalog_(),catalogUrl:settings_().taxonomyCatalogUrl,configurationRevision:configurationRevision_()};}
 if(method==='startTaxonomy'){authorize_();throw Error('El catálogo global de funcionalidades se ejecuta en Google Apps Script.');}
 if(method==='getClassificationStatus') {authorize_();return {scheduled:false,hour:settings_().dailyHour,timezone:settings_().timezone,job:null};}
 if(method==='startClassification'){authorize_();throw Error('La clasificación se ejecuta en Google Apps Script.');}
 if(method==='getTranslationStatus'){authorize_();return {scheduled:true,hour:2,timezone:settings_().timezone,job:null,queued:false};}
 if(['startTranslations'].includes(method)){authorize_();throw Error('La traducción nocturna se ejecuta en Google Apps Script.');}
 if(method==='getCollectionProgress')return {newsRevision:revision,configurationRevision:revision,collection:{total:0,pending:0}};
 if(method==='getAdminFeedback'){authorize_();const selected=adminFeedbackSelection_(feedbackRows,q);return {...recordPage(selected.slice().reverse(),q,settings_().pageSize),global:feedbackKpis_(feedbackRows),filtered:feedbackKpis_(selected),options:recordOptions(feedbackRows,['valoracion','estado','edicion','correo']),interactions:selected.length?[{edicion:'preview-edition',accesses:2,reads:1,exports:0}]:[]};}
 if(method==='setNewsletterFeedbackState'){authorize_();if(!['pendiente','atendido'].includes(q.state))throw Error('Estado de seguimiento no válido.');const row=feedbackRows.find(row=>row.id===q.id);if(!row)throw Error('Valoración no disponible.');row.estado=q.state;return {saved:true};}
 if(method==='exportNewsletterFeedback'){authorize_();const selected=adminFeedbackSelection_(feedbackRows,q).slice().reverse(),columns=['fecha','correo','edicion','nombre_edicion','cadencia','pais','idioma','valoracion','comentario','estado'],cell=value=>'"'+String(safeCell_(value??'')).replace(/"/g,'""')+'"';return {csv:String.fromCharCode(65279)+[columns,...selected.map(row=>columns.map(key=>row[key]))].map(row=>row.map(cell).join(',')).join(String.fromCharCode(13,10)),count:selected.length};}
 if(method==='getAdoption'){authorize_();const selected=filterRecords(usage,q,['correo','vista','evento'],['correo','vista','evento','sesion'],'fecha',settings_().timezone),metrics=metrics_(selected,Date.now()),page=recordPage(metrics.users,q,settings_().pageSize);return {...metrics,users:page.items,total:page.total,page:page.page,pageSize:page.pageSize,options:recordOptions(usage,['correo','vista','evento']),retentionDays:settings_().retentionDays,limited:usage.length===settings_().eventLimit};}
 if(method==='exportTelemetry'){authorize_();return {schemaVersion:1,exportedAt:new Date().toISOString(),preview:true,telemetry:[],runs:[],audit:[],collection:{tasks:[]},usage:metrics_(usage,Date.now())};}
 if(method==='getConfiguration'){authorize_();return {config:JSON.parse(JSON.stringify(configuration)),revision,capabilityDefaults};}
 if(method==='saveConfiguration')return writeConfiguration_(q.config,q.revision);
 if(method==='saveSourceSettings')return saveSourceSettings(q);
 if(method==='saveFeeds')return saveFeeds(q);
 if(method==='exportNews'){const selection=dashboardQuery_(q);return newsCsv_(newsGeographySelection_(annotateNews_(rows),selection),selection,q.language||'es',true);}
 if(method==='getNewsletterOptions')return {email:'usuario@bbva.com',defaults:subscriptionDefaults_(),enabled:settings_().newsletterEnabled,countries:newsletterCountries_()};
 if(method==='sendNewsletterTest'){authorize_();throw Error('La vista local no envía correos. Usa la aplicación publicada.');}
 if(method==='getNewsletterProgress'){authorize_();return {enabled:false,active:false,queued:false,job:{total:0,processed:0,pending:0,accepted:0,empty:0,review:0,updated:'',state:'Completada'}};}
 if(method==='getNewsletterDeliveryStatus'){authorize_();return {address:settings_().newsletterSender,name:settings_().newsletterSenderName,available:false,enabled:settings_().newsletterEnabled,scheduled:false,remaining:settings_().newsletterDailyLimit,error:'Vista local: verifica el remitente y los permisos en la instalación de Apps Script.'};}
 if(method==='getAdminSubscriptions'){authorize_();return JSON.parse(JSON.stringify(selections.map(row=>({...row,nextDelivery:''}))));}
 if(method==='getSubscriptions')return JSON.parse(JSON.stringify(selections.filter(row=>row.correo==='usuario@bbva.com').map(row=>({...row,nextDelivery:''}))));
 if(method==='saveSubscription'||method==='saveAdminSubscription'){if(method==='saveAdminSubscription')authorize_();const email=method==='saveAdminSubscription'?q.email:'usuario@bbva.com',index=selections.findIndex(row=>row.correo===email);const row=subscriptionRecord_(q,method==='saveAdminSubscription'?q.email:'usuario@bbva.com',(index>=0?selections[index].id:q.id)||String(selections.length+1)+'-'+Date.now(),new Date(),selections.filter(r=>r.id!==q.id).length);if(index<0)selections.push(row);else selections[index]=row;return 'Suscripción local guardada en memoria, sin envío de correo.';}
 if(method==='deleteSubscription'||method==='deleteAdminSubscription'){const index=selections.findIndex(row=>row.id===q);if(index<0)throw Error('Selección no encontrada.');selections.splice(index,1);return 'Selección local eliminada.';}
 if(method!=='getDashboard')throw Error('Esta acción necesita la instalación en Apps Script.');
 const language=supportedLanguage(q.language)?q.language:'es',view=q.view||'radar',initial=Boolean(q.initial),settings=settings_();
 q=dashboardQuery_({...q,view});
 const feeds=feeds_();let data=newsDashboard_(annotateNews_(rows),q,feeds,view),periodFallback=false;if(initial&&['briefing','news'].includes(view)&&(view==='briefing'?data.briefing.total:data.total)===0){q={...q,...dashboardPeriod_(view,new Date(),true)};data=newsDashboard_(annotateNews_(rows),q,feeds,view);periodFallback=true;}if(view==='news'||view==='briefing'){const untranslated=row=>({...row,translation:{language,state:'pending'}});data.items=data.items.map(untranslated);if(data.briefing)data.briefing.items=data.briefing.items.map(untranslated);}return {...data,...(view==='radar'?{years:[...new Set(selectNews_(rows,sectorNewsDefaults).map(row=>row.fecha.slice(0,4)))].filter(year=>/^[0-9]{4}$/.test(year)&&year>='2000'&&year<=recordDay(new Date(),settings.timezone).slice(0,4)).sort().reverse()}:{}),context:{mode:'current',periodFallback},taxonomyTranslations:taxonomyTranslations_(),initial,selection:q,defaults:dashboardQuery_({view,initial:true}),preferences:{timezone:settings.timezone,retentionDays:settings.retentionDays,eventLimit:settings.eventLimit,unknownCountry:settings.unknownCountry,dailyLabel:settings.dailyHour+':00 · '+settings.timezone},geographies:configuration.geographies,applicationScope:configuration.applicationScope,newsRevision:revision,configurationRevision:revision,collection:{total:0,pending:0},lastRun:'',sourceCount:feeds.length,daily:false,admin,...(admin?{maxFeeds:settings.maxCustomFeeds,feeds:customFeeds_(),configuredFeeds:configuredFeeds_()}:{})};
}};
})();</script>`;
const read=name=>fs.readFileSync(path.join(dist,name+'.html'),'utf8');
const html=renderIncludes(read('Index')).replace('<script id="radar-client">',()=>preview+'<script id="radar-client">');
fs.mkdirSync(path.join(root,'output'),{recursive:true});fs.writeFileSync(path.join(root,'output/preview.html'),html);
export function createPreviewServer(){
 const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  if(!['/','/favicon.ico'].includes(req.url)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'||req.url==='/favicon.ico'?'':html);
 });
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&!process.argv.includes('--write-only')){
 const port=Number(process.env.PORT??4173);if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT debe ser un puerto válido.');
 const server=createPreviewServer();server.on('error',error=>{console.error('No se pudo iniciar la vista local: '+error.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',async()=>{
  try{await registerServer(server);console.log('Vista previa: http://127.0.0.1:'+server.address().port+' · '+rows.length+' publicaciones reales');}
  catch(error){console.error('No se pudo registrar el servidor: '+error.message+'. Ejecuta make kill.');server.close();process.exitCode=1;}
 });
}
