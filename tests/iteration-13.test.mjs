import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/delivery.mjs';
import {app} from './helpers/app.mjs';
const clean=x=>JSON.parse(JSON.stringify(x));
function server(){const s=storage();s.c.initializeConfiguration();s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
function row(id,pais='España',palanca='08. Financiación',score=10){return {etiquetas:{digital:true},segmentos:['Empresas e instituciones'],id,pais,entidad:'BBVA',titular:'Servicio digital para empresas '+id,extracto:'Financiación digital para empresas',url:'https://example.com/'+id,medio:'Editor',fuente:'Editor',idioma:'es',fecha:'2026-09-01',senales:['Lanzamiento de producto'],taxonomia:[{id:'08.01',palanca,subpalanca:'08.01. Landing de Financiación'}],score};}
test('13: Radar siempre consulta un año entero y descarta filtros de otras vistas',()=>{
 const {c}=server(),now=new Date('2026-10-20T12:00:00Z');
 assert.deepEqual(clean(c.dashboardQuery_({view:'radar',country:'España',year:'2025',entity:'BBVA',signal:'x',from:'2025-08-15'},now)),{segment:'Empresas e instituciones',coverage:'digital',entity:'BBVA',country:'España',from:'2025-01-01',to:'2025-12-31'});
 assert.deepEqual(clean(c.dashboardPeriod_('radar',now,true)),{from:'2025-01-01',to:'2025-12-31'});
 assert.equal(c.dashboardQuery_({view:'radar',initial:true,country:'España'},now).country,'España');
 assert.equal(c.dashboardQuery_({view:'briefing',entity:'BBVA',country:'España'},now).country,undefined);
 assert.deepEqual(Object.keys(vm.runInContext('newsletterCadences',c)),['fortnightly','quarterly']);
 assert.throws(()=>c.newsletterPeriod_('yearly',now));
});


test('13: traducciones pendientes ajenas no bloquean newsletter y solo se traduce lo seleccionado',()=>{
 const {c,properties:p}=server();p.DAILY_TRANSLATION_REQUEST='pending';c.businessTranslationPending_=()=>true;c.snapshotJobsPending_=()=>false;c.classificationPending_=()=>false;c.dailyCollectionPending_=()=>false;
 assert.equal(c.newsletterPipelinePending_(),false);
 let translated=[];c.savedArticleTranslations_=items=>items.map(row=>({...row,translation:{state:translated.includes(row.id)?'translated':'pending'}}));c.storeArticleTranslation_=row=>translated.push(row.id);c.requestDashboardSnapshots_=()=>{};
 assert.equal(c.newsletterTranslationsReady_([row('chosen')],'en',Date.now(),10000),true);assert.deepEqual(translated,['chosen']);assert.equal(c.newsletterTranslationsReady_([row('chosen')],'en',Date.now(),10000),true);
});
test('13: Novedades sin filtros; Radar con geografía, entidad y año; feedback accesible desde enlace de correo',async t=>{
 const a=await app(t,{configure({data}){data.selection={from:'2026-10-16',to:'2026-10-31'};}});assert.equal(a.find('#open-filters').hidden,true);assert.equal(a.find('.selection-toolbar').hidden,false);assert.equal(a.find('#active-filters').querySelectorAll('span.filter-chip').length,2);assert.equal(a.find('#active-filters').querySelectorAll('button').length,0);assert.equal(a.w.document.querySelector('#reading-context'),null);
 await a.click('[data-view="radar"]');assert.equal(a.find('#entity-filter').hidden,false);assert.equal(a.find('#advanced-filters').hidden,false);assert.equal(a.find('#year-filter').hidden,false);assert.equal(a.find('#from-filter').hidden,true);
 await a.click('[data-view="news"]');assert.equal(a.find('#entity-filter').hidden,false);assert.equal(a.find('#advanced-filters').hidden,false);
 const b=await app(t,{location:{edition:'edition',view:'news',feedback:'positive'}});assert.equal(b.find('#feedback-dialog').open,true);assert.equal(b.find('#edition-feedback').elements.rating.value,'positive');
});
test('13: entrega la selección traducida aunque la cola general siga pendiente y conserva la reserva del envío',()=>{
 const {c,properties:p}=server();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';p.DAILY_TRANSLATION_REQUEST='pending';c.businessTranslationPending_=()=>true;c.snapshotJobsPending_=()=>false;c.classificationPending_=()=>false;c.dailyCollectionPending_=()=>false;
 const input=[row('ready')],subscription={id:'sub',correo:'owner@bbva.com',nombre:'Quincena',idioma:'es'},query={view:'briefing',from:'2026-09-01',to:'2026-09-15'};
 c.newsletterDeliveryPlan_=()=>({planned:[{row:subscription,id:'delivery',query}],due:[{row:subscription,id:'delivery',query}],periods:new Map()});const rows=c.rows_;c.rows_=(name,...args)=>name==='Noticias'?input:rows(name,...args);c.annotateNews_=rows=>rows;c.businessNews_=()=>true;c.newsScope_=()=>true;c.selectAnnotatedNews_=rows=>rows;c.savedArticleTranslations_=(rows,language)=>rows.map(row=>({...row,translation:{state:'translated',language}}));c.newsletterSender_=()=>({});let sent=0;c.sendNewsletterMail_=()=>{sent++;return 'message-id';};
 const result=c.deliverNewsletterBatch_();assert.equal(result.accepted,1);assert.equal(sent,1);assert.equal(c.rows_('NewsletterEnvios').at(-1).estado,'Enviada');assert.ok(c.rows_('NewsletterEnvios').at(-1).contenido.includes('url:'));assert.equal(p.DAILY_TRANSLATION_REQUEST,'pending');
});
test('Radar ofrece únicamente años con noticias empresariales publicadas, sin depender del año seleccionado',async t=>{
 const {c}=server(),year=new Date().getFullYear();c.businessNewsIndex_=()=>({rows:[{fecha:year+'-01-02'},{fecha:(year-2)+'-03-04'},{fecha:year+'-04-05'},{fecha:(year+1)+'-01-01'},{fecha:'invalida'}]});
 assert.deepEqual(Array.from(c.radarAvailableYears_()),[String(year),String(year-2)]);
 const a=await app(t,{configure({data}){data.years=[String(year),String(year-2)];data.selection={from:(year-1)+'-01-01',to:(year-1)+'-12-31'};}});await a.click('[data-view="radar"]');
 assert.deepEqual(Array.from(a.find('#filters').elements.year.options,option=>option.value),[String(year),String(year-2)]);
 a.data.years=[];await a.change('#filters select[name="country"]','España');assert.equal(a.find('#filters').elements.year.options.length,0);
});
