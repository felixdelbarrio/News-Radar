import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app,tick} from './helpers/app.mjs';
import {annotateFixtures} from './helpers/canonical-fixtures.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
const plain=value=>JSON.parse(JSON.stringify(value));
test('abrir ediciones desde Logs y Feedback después de Noticias carga una sola consulta de la edición correcta',async t=>{
 const kpis={total:1,positive:1,negative:0,positiveRate:100,pending:1,resolved:0};
 const a=await app(t,{entry:'news',configure({w,replies}){
  replies.getAdminFeedback={items:[{id:'feedback',fecha:'2026-10-24',correo:'reader@bbva.com',edicion:'edition-feedback',nombre_edicion:'Feedback',idioma:'es',cadencia:'quarterly',valoracion:'positive',estado:'pendiente'}],filtered:kpis,total:1,page:0,pageSize:10,options:{}};
  replies.getAdminLogs={columns:['edition'],fields:[],items:[{edition:'edition-logs'}],metrics:{cards:[]},total:1,page:0,pageSize:10,options:{}};
  const backend=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,query)=>{const value=await backend(method,query);if(method==='getDashboard')return {...value,context:query.edition?{mode:'edition',id:query.edition,count:0}: {mode:'current'}};return value;};
 }});
 for(const [view,id] of [['audit','edition-logs'],['feedback','edition-feedback']]){
  await a.click('[data-view="administration"]');await a.click('[data-admin-view="'+view+'"]');
  const count=a.calls.filter(row=>row.method==='getDashboard').length;await a.click('[data-open-edition="'+id+'"]');
  const calls=a.calls.filter(row=>row.method==='getDashboard');assert.equal(calls.length,count+1);assert.equal(calls.at(-1).query.view,'news');assert.equal(calls.at(-1).query.edition,id);assert.equal(a.find('#news-section').hidden,false);assert.equal(a.find('#administration-section').hidden,true);
 }
});
test('lectura y CSV de una edición ajena exigen administrador y no comparten caché con acceso de destinatario',()=>{
 const s=fixture(),c=s.c,rows=annotateFixtures(c,[{id:'sent',fecha:'2026-10-01',pais:'España',entidad:'BBVA',medio:'Editor',titular:'BBVA lanza pagos digitales para empresas',extracto:'Nueva plataforma digital empresarial',url:'https://example.com/sent',idioma:'es',clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}'}]);
 c.saveNewsletterEdition_('foreign-edition','delivery','reader@bbva.com','Edición ajena',{from:'2026-10-01',to:'2026-10-15'},'es',rows);c.completeNewsletterEdition_('foreign-edition','Enviada');
 const query={view:'news',edition:'foreign-edition',initial:true};assert.equal(c.getDashboard(query).items[0].id,'sent');assert.equal(c.exportNews(query).count,1);
 s.properties.OWNER_EMAIL='new-admin@bbva.com';assert.throws(()=>c.getDashboard({...query,admin:true}),/no disponible/);assert.throws(()=>c.exportNews({...query,admin:true}),/no disponible/);
 s.setEmail('other@bbva.com');assert.throws(()=>c.getDashboard(query),/no disponible/);
 s.setEmail('reader@bbva.com');assert.equal(c.getDashboard(query).total,1);assert.equal(c.exportNews(query).count,1);
});
test('horarios, activación por franja y supervisor se guardan y reconcilian sin duplicar activadores',()=>{
 const s=fixture(),c=s.c,config=plain(c.getConfiguration());Object.assign(config.config.settings,{dailyHour:7,dailyMinute:10,afternoonEnabled:false,eveningHour:20,eveningMinute:45,newsletterHour:10,newsletterMinute:20,watchdogMinutes:10});c.saveConfiguration(config);c.workWake_();
 assert.equal(c.scheduledTriggers_('dailyRadar_')[0].hour,7);assert.equal(c.scheduledTriggers_('dailyRadar_')[0].minute,10);assert.equal(c.scheduledTriggers_('afternoonRadar_').length,0);assert.equal(c.scheduledTriggers_('eveningRadar_')[0].minute,45);assert.equal(c.scheduledTriggers_('scheduledNewsletters_')[0].hour,10);assert.equal(c.scheduledTriggers_('scheduledNewsletters_')[0].minute,20);assert.equal(c.scheduledTriggers_('backgroundWatchdog_')[0].minutes,10);c.updateOperationalSchedule();assert.equal(c.scheduledTriggers_('backgroundWatchdog_').length,1);assert.equal(c.getOperationalSchedule().valid,true);
 const invalid=plain(c.getConfiguration());invalid.config.settings.watchdogMinutes=7;assert.throws(()=>c.saveConfiguration(invalid),/intervalos/);
});
test('recopilación manual solicita categorización y traducción, y la cuota de traducción deja avanzar mantenimiento',()=>{
 const {c,properties:p}=fixture();c.collectNow();assert.ok(p.CLASSIFICATION_REQUEST);assert.ok(p.DAILY_TRANSLATION_REQUEST);assert.ok(p.COLLECTION_MANUAL_JOB);
 c.dailyCollectionPending_=()=>false;c.dailyPipelineRequested_=()=>false;c.classificationPending_=()=>false;c.classificationReadyAt_=()=>Infinity;delete p.CLASSIFICATION_REQUEST;c.snapshotPublicationPending_=()=>false;c.newsletterReadyAt_=()=>Infinity;c.translationReadyAt_=()=>Date.now()+3600000;c.taxonomyReadyAt_=()=>Infinity;c.taxonomyTranslationReadyAt_=()=>Infinity;c.logArchiveReadyAt_=()=>Infinity;c.maintenanceReadyAt_=()=>Date.now();assert.equal(c.backgroundTask_({pending:[],jobs:[]},false),'maintenance');
});
test('editar columnas ajenas al catálogo no encola y los cambios funcionales sí se reintentan con backoff',()=>{
 const {c,properties:p}=fixture();let column=6;const range={getSheet:()=>({getName:()=> 'Soluciones Funcionales',getLastRow:()=>2,getRange:()=>({getDisplayValues:()=>[['ID','Bloque funcional','Funcionalidad/Sub Operativa','Descripción','Otra','Notas']]})}),getRow:()=>2,getColumn:()=>column,getNumColumns:()=>1};
 c.functionalCatalogEdited_({range});assert.equal(p.CATALOG_SYNC_REQUEST,undefined);column=3;c.functionalCatalogEdited_({range});assert.ok(p.CATALOG_SYNC_REQUEST);p.CATALOG_SYNC_RETRY_AT=String(Date.now()+3600000);assert.ok(c.catalogSyncReadyAt_()>Date.now());
});
test('el panel mantiene los ocho grupos, las tres franjas y el estado del supervisor sin cargar artículos',()=>{
 const s=fixture(),c=s.c;c.newsRows_=()=>{throw Error('No leer corpus');};s.properties.SUPERVISOR_LAST='2026-10-24T10:00:00Z';s.properties.SUPERVISOR_DISPATCH=JSON.stringify({task:'classification',at:'2026-10-24T10:01:00Z'});
 const data=c.getControlPanel();assert.deepEqual(Array.from(data.groups,row=>row.id),['supervisor','collection','classification','snapshots','newsletter','translation','maintenance','catalogue']);assert.deepEqual(Array.from(data.groups[1].jobs,row=>row.label),['06:00','13:00','21:00']);assert.equal(data.groups[0].jobs[0].progress.lastExecutedAt,'2026-10-24T10:00:00Z');assert.equal(data.groups[0].jobs[0].dispatched.label,'Clasificación de noticias');assert.equal(data.groups[7].jobs.length,2);assert.equal(data.groups[7].jobs[0].modified,'2026-10-01T12:00:00.000Z');
});
test('los filtros administrativos conservan borradores hasta Aplicar, muestran chips y permiten quitarlos',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="audit"]');await a.click('#logs-open-filters');const input=a.find('#logs-search');input.value='consulta';input.dispatchEvent(new a.w.Event('input',{bubbles:true}));await tick();const before=a.calls.filter(row=>row.method==='getAdminLogs').length;await a.click('#logs-close-filters');assert.equal(a.calls.filter(row=>row.method==='getAdminLogs').length,before);await a.click('#logs-open-filters');assert.equal(input.value,'');input.value='consulta';await a.click('#logs-apply');assert.equal(a.calls.filter(row=>row.method==='getAdminLogs').length,before+1);assert.match(a.find('#logs-chips').textContent,/consulta/);await a.click('#logs-chips button');assert.equal(a.calls.filter(row=>row.method==='getAdminLogs').length,before+2);assert.equal(a.find('#logs-chips').textContent,'');
});
test('configuración filtra sin perder entradas ocultas y reúne detección y equivalencias en un único catálogo',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');const total=a.config.entities.length;await a.change('#configuration-search','BBVA');assert.ok([...a.find('#catalog-fields').children].some(row=>row.hidden));await a.submit('#catalog-form');assert.equal(a.calls.filter(row=>row.method==='saveConfiguration').at(-1).query.config.entities.length,total);await a.click('#configuration-clear');await a.change('#catalog-category','taxonomy');assert.ok(a.find('[data-config-detection]'));assert.ok(a.find('[data-taxonomy-block] textarea'));assert.equal(a.w.document.querySelector('#catalog-category option[value="capabilities"]'),null);await a.change('#catalog-category','storage');assert.ok(a.find('[data-key="taxonomyCatalogUrl"]'));assert.equal(a.w.document.querySelector('#catalog-fields [data-key="logRows"]'),null);await a.change('#catalog-category','retention');assert.ok(a.find('[data-key="logRows"]'));
});
