import {registerServer} from './local-server.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {readServerScript,renderIncludes} from './source.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const seed=JSON.parse(fs.readFileSync(path.join(root,'assets/configuration-defaults.json'),'utf8'));
const context=vm.createContext({});vm.runInContext(readServerScript(),context);context.configuration_=()=>seed;
const feeds=seed.feeds,now=new Date('2026-10-09T10:00:00+02:00');
const raw=JSON.parse(fs.readFileSync(path.join(root,'assets/feed-snapshot.json'),'utf8'));
const rows=raw.flatMap((item,i)=>{
  const feed=feeds[i<10?0:1],result=context.evaluate_(item,feed,now);if(!result.item)return [];
  const n=result.item;return [{id:String(i),fecha:n.date.toISOString().slice(0,10),pais:n.country,medio:feed.name,entidad:feed.entity,titular:n.title,extracto:n.excerpt,url:n.url,fuente:feed.name,idioma:n.language||feed.language||'',clasificacion:JSON.stringify(n.labels)}];
});
const taxonomyState={documents:0,candidates:{}},definitions=context.taxonomyDefinitions(seed.taxonomy),excluded=new Set(seed.entities.flatMap(row=>[row.name,...row.aliases]).flatMap(value=>context.taxonomyText(value).split(' ')));
for(const row of rows){const text=context.taxonomyText(row.titular+' '+row.extracto);if(context.taxonomyEligible_(context.searchText_(row.titular),text))context.taxonomyObserve(taxonomyState,text,definitions,excluded);}
const taxonomy=context.taxonomyBuild(taxonomyState).map(row=>({id:createHash('sha256').update(row.key).digest('hex').slice(0,24),palanca:row.palanca,subpalanca:row.subpalanca,segmentos:row.segments,terminos:row.terms,noticias:row.df,peso:row.peso,origen:row.origin}));
for(const row of rows)row.taxonomia=JSON.stringify({ids:context.taxonomyNewsIds_(row.titular,row.extracto,taxonomy)});
const taxonomyNames=Object.fromEntries(['es','en','tr'].map(language=>[language,Object.fromEntries(taxonomy.flatMap(row=>{const parent=language==='es'?row.palanca:context.translateText(row.palanca,language),child=language==='es'?row.subpalanca:context.translateText(row.subpalanca,language);return [[row.palanca,parent],[row.subpalanca,child],[context.taxonomyPath(row),parent+' › '+child]];}))]));
const names=['settings_','searchText_','businessIndex_','phraseMatch_','phrasePosition_','phrasePattern_','headlineEntity_','digitalAssessment_','newsRelevance_','newsLabels_','taxonomySaved_','taxonomyOptions_','taxonomyLanguage_','taxonomyPath','taxonomySubLabel','taxonomyChoices','savedNewsLabels_','classification_','localizedSearchTerms_','capabilitySearchTerms_','catalogueSearchRows_','taxonomyText','collectionSearchTerms_','validateCapabilities_','termsMatch_','sourceCountry_','sourceGeographies_','newsCountry_','publisherKey_','annotateNews_','entityKey_','selectNews_','selectAnnotatedNews_','uniqueNews_','newsUrlIdentity_','titleKey_','titleIdentity_','editorialIdentity_','equivalentEditorialTitle_','duplicateTitleEntry_','rememberTitle_','newsRepresentative_','snapshotEntity_','newsScope_','newsGeographySelection_','radarMetrics_','taxonomyHeatmap_','entityOrder','entityVolumeOrder','newsEntityGroups','newsEntityPage','applicationGeography','geographyOrder','geographyLabel','noveltyOverview','noveltyGroups','noveltyCount','briefing_','newsDashboard_','safeCell_','newsCsv_','canonicalUrl_','domainMatches_','plainText_','validateConfiguration_','collectionPeriod_','profileFeed_','defaultFeeds_','customFeeds_','configuredFeeds_','feeds_','saveFeeds','saveSourceSettings','subscriptionFilters_','subscriptionRecord_','newsletterCountries_','subscriptionQuery_','subscriptionDefaults_','calendarDate_','dashboardPeriod_','newsletterSubject_','newsletterDeliveryId_','dashboardQuery_','collectionRange_','newsletterWindow','readingWindow','newsletterPeriod_','newsletterEmail_','newsletterNextDate_','eventDuration_','metrics_','recordText','recordQuery','filterRecords','recordOptions','recordPage','recordDay','translationMatcher','translateText','supportedLanguage','feedLanguage'];
const shared=names.map(name=>context[name].toString()).join('\n'),serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const previewDelay=Math.min(5000,Math.max(0,Number(process.env.PREVIEW_LATENCY_MS)||0));
const preview=`<script>(()=>{
const otherGeography=${serialize(vm.runInContext('otherGeography',context))};
const applicationScopeSegments=${serialize(vm.runInContext('applicationScopeSegments',context))};
const readingViews=${serialize(vm.runInContext('readingViews',context))};
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

const newsRelevanceMemory_=new WeakMap();
const RADAR=${serialize(vm.runInContext('RADAR',context))};
let configuration=${serialize(seed)},businessIndexMemory_,configuredFeedMemory_,sourceGeographyMemory_,revision='0',recordDateFormatter;const selections=[],usage=[];
const configuration_=()=>configuration,rows=${serialize(rows)},admin=${process.env.PREVIEW_ADMIN==='1'};
const authorize_=()=>{if(!admin)throw Error('Acción de administrador.');};
const configurationRevision_=()=>revision;
const properties_=()=>({getProperty:()=>revision});
const translationIdentityRows_=rows=>rows;
const taxonomyCatalog_=()=>${serialize(taxonomy)},taxonomyTranslations_=()=>(${serialize(taxonomyNames)});
function writeConfiguration_(config,version){authorize_();if(version!==revision)throw Error('La configuración ha cambiado. Recarga los catálogos.');validateConfiguration_(config);configuration=JSON.parse(JSON.stringify(config));revision=String(Number(revision)+1);return 'Configuración local guardada en memoria. No se ha escrito en Google.';}
${shared}
window.RADAR_PREVIEW={async call(method,q={}){
${previewDelay?`if(method!=='recordEvents')await new Promise(resolve=>setTimeout(resolve,${previewDelay}));`:''}
 if(method==='resumeCollection'){authorize_();return {added:0,pending:0,errors:[],notice:'Vista local: no hay recuperaciones remotas en curso.'};}
 if(method==='collectNow'){authorize_();const range=(q||'today')!=='year'?collectionRecentRange_(new Date()):collectionRange_(q,new Date()),available=rows.filter(row=>row.fecha>=range.from&&row.fecha<=range.to).length;return {added:0,pending:0,errors:[],notice:'Vista local: '+available+' noticias de la instantánea en el período '+range.from+' / '+range.to+'. La consulta remota se ejecuta únicamente en Apps Script.'};}
 if(method==='recordEvents'){usage.push(...q.map(event=>({fecha:new Date().toISOString(),correo:'usuario@bbva.com',sesion:event.session,evento:event.event,vista:event.view,duracion_ms:eventDuration_(event.duration)})));if(usage.length>settings_().eventLimit)usage.splice(0,usage.length-settings_().eventLimit);return {saved:true};}
 if(method==='getMyNewsletterHistory')return {...recordPage([],q),options:{},limit:settings_().eventLimit,limited:false};
 if(method==='getMaintenanceStatus'){authorize_();return {active:false,job:null};}
 if(method==='getNewsletterHistory'){authorize_();return {...recordPage([],q),options:{},limit:settings_().eventLimit,limited:false};}
 if(method==='getRuns') {authorize_();return {...recordPage([],q),options:{},collection:{jobs:[]},classification:{scheduled:false,queued:false,job:null},limit:settings_().eventLimit,limited:false};}
 if(method==='getTaxonomyStatus'){authorize_();return {scheduled:false,hour:settings_().dailyHour,minute:45,timezone:settings_().timezone,job:null,items:taxonomyCatalog_(),catalogUrl:settings_().taxonomyCatalogUrl,configurationRevision:configurationRevision_()};}
 if(method==='startTaxonomy'){authorize_();throw Error('El catálogo global de funcionalidades se ejecuta en Google Apps Script.');}
 if(method==='getClassificationStatus') {authorize_();return {scheduled:false,hour:settings_().dailyHour,timezone:settings_().timezone,job:null};}
 if(method==='startClassification'){authorize_();throw Error('La clasificación se ejecuta en Google Apps Script.');}
 if(method==='getTranslationStatus'){authorize_();return {scheduled:false,hour:2,timezone:settings_().timezone,job:null,queued:false};}
 if(['installTranslationSchedule','disableTranslationSchedule','startTranslations'].includes(method)){authorize_();throw Error('La traducción nocturna se ejecuta en Google Apps Script.');}
 if(method==='getCollectionProgress')return {newsRevision:revision,configurationRevision:revision,collection:{total:0,pending:0}};
 if(method==='getAudit'){authorize_();return {...recordPage([],q),options:{},limit:settings_().eventLimit,limited:false};}
 if(method==='getNewsletterInsights')return {adoption:{items:[],total:0,page:0,pageSize:30},feedback:{items:[],total:0,page:0,pageSize:30}};
 if(method==='getAdoption'){authorize_();const selected=filterRecords(usage,q,['correo','vista','evento'],['correo','vista','evento','sesion'],'fecha',settings_().timezone),metrics=metrics_(selected,Date.now()),page=recordPage(metrics.users,q,settings_().pageSize);return {...metrics,users:page.items,total:page.total,page:page.page,pageSize:page.pageSize,options:recordOptions(usage,['correo','vista','evento']),retentionDays:settings_().retentionDays,limited:usage.length===settings_().eventLimit};}
 if(method==='exportTelemetry'){authorize_();return {schemaVersion:1,exportedAt:new Date().toISOString(),preview:true,telemetry:[],runs:[],audit:[],collection:{tasks:[]},usage:metrics_(usage,Date.now())};}
 if(method==='getTelemetry'){authorize_();const metrics=metrics_(usage,Date.now());return {...recordPage([],q),options:{},limit:settings_().eventLimit,limited:false,rows:[],latencyP95:metrics.latencyP95,clientErrors:metrics.failures,collection:{processed:0,pending:0}};}
 if(method==='getConfiguration'){authorize_();return {config:JSON.parse(JSON.stringify(configuration)),revision,capabilityDefaults};}
 if(method==='saveConfiguration')return writeConfiguration_(q.config,q.revision);
 if(method==='saveTaxonomySource'){authorize_();const config=structuredClone(configuration_());config.settings.taxonomyCatalogUrl=q.url;return writeConfiguration_(config,q.revision);}
 if(method==='saveSourceSettings')return saveSourceSettings(q);
 if(method==='saveFeeds')return saveFeeds(q);
 if(method==='exportNews'){const selection=dashboardQuery_(q);return newsCsv_(newsGeographySelection_(annotateNews_(rows),selection),selection,q.language||'es',true);}
 if(method==='getTaxonomyTranslationStatus')return {job:null,queued:false,taxonomyTranslations:{}};
 if(method==='startTaxonomyTranslations')throw Error('El catálogo global de funcionalidades se ejecuta en Google Apps Script.');
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
 const feeds=feeds_();let data=newsDashboard_(annotateNews_(rows),q,feeds,view),periodFallback=false;if(initial&&['briefing','news'].includes(view)&&(view==='briefing'?data.briefing.total:data.total)===0){q={...q,...dashboardPeriod_(view,new Date(),true)};data=newsDashboard_(annotateNews_(rows),q,feeds,view);periodFallback=true;}if(view==='news'||view==='briefing'){const untranslated=row=>({...row,translation:{language,state:'pending'}});data.items=data.items.map(untranslated);if(data.briefing)data.briefing.items=data.briefing.items.map(untranslated);}return {...data,context:{mode:'current',periodFallback},taxonomyTranslations:taxonomyTranslations_(),initial,selection:q,defaults:dashboardQuery_({view,initial:true}),preferences:{timezone:settings.timezone,retentionDays:settings.retentionDays,eventLimit:settings.eventLimit,unknownCountry:settings.unknownCountry,dailyLabel:settings.dailyHour+':00 · '+settings.timezone},geographies:configuration.geographies,applicationScope:configuration.applicationScope,newsRevision:revision,configurationRevision:revision,collection:{total:0,pending:0},lastRun:'',sourceCount:feeds.length,daily:false,admin,...(admin?{maxFeeds:settings.maxCustomFeeds,feeds:customFeeds_(),configuredFeeds:configuredFeeds_()}:{})};
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
