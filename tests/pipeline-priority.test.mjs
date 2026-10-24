import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/delivery.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();for(let i=0;i<3;i++)s.c.dashboardSnapshotBatch_();delete s.properties.DASHBOARD_SNAPSHOT_REQUEST;return s;}
const work={pending:[{ciclo:'annual'}],jobs:[{id:'annual',tipo:'annual',pendientes:1}]};
test('prioridad única: diaria, clasificación, snapshots, newsletter, traducción de negocio, taxonomía, traducción de taxonomía y pendientes',()=>{
 const {c,properties:p}=fixture();c.settings_().newsletterEnabled=true;
 c.writeClassificationJob_({state:'Pendiente'});c.writeTranslationJob_({state:'Pendiente',businessPending:1});c.writeTaxonomyJob_({state:'Pendiente'});c.taxonomyTranslationReadyAt_=()=>Date.now();p.NEWSLETTER_REQUEST='true';
 assert.equal(c.backgroundTask_(work,true),'collection');assert.equal(c.backgroundTask_(work,false),'classification');
 c.writeClassificationJob_({state:'Completada',total:0});assert.equal(c.backgroundTask_(work,false),'newsletter');delete p.NEWSLETTER_REQUEST;assert.equal(c.backgroundTask_(work,false),'translation');p.NEWSLETTER_REQUEST='true';
 c.writeTranslationJob_({state:'Completada',total:0,businessPending:0});assert.equal(c.backgroundTask_(work,false),'newsletter');
 delete p.NEWSLETTER_REQUEST;assert.equal(c.backgroundTask_(work,false),'taxonomy');c.writeTaxonomyJob_({state:'Completada',total:0});assert.equal(c.backgroundTask_(work,false),'taxonomyTranslation');
 c.taxonomyTranslationReadyAt_=()=>Infinity;assert.equal(c.backgroundTask_(work,false),'collection');
});
test('una cuota de traducción de negocio aplaza el correo y deja avanzar pendientes sin despertar en bucle',()=>{
 const {c,properties:p}=fixture();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';c.writeTranslationJob_({state:'En pausa',businessPending:1,pausedUntil:Date.now()+86400000});
 assert.ok(c.newsletterReadyAt_(work)<=Date.now());assert.equal(c.backgroundTask_(work,false),'newsletter');
 c.writeTranslationJob_({state:'Completada',total:0,businessPending:0});assert.ok(c.newsletterReadyAt_(work)<=Date.now());
});
test('dos activadores del mismo día conservan una sola recopilación y las etapas posteriores',()=>{
 const {c,properties:p}=fixture();c.requestDailyPipeline_();c.requestDailyPipeline_();c.drainDailyPipeline_();const request=c.collectionRequests_()[0];assert.equal(c.collectionRequests_().length,1);assert.ok(p.CLASSIFICATION_REQUEST);assert.ok(p.DAILY_TRANSLATION_REQUEST);
 c.requestDailyPipeline_();c.drainDailyPipeline_();assert.equal(c.collectionRequests_().length,1);assert.equal(c.collectionRequests_()[0].id,request.id);
});
test('el envío no depende de una revisión trimestral',()=>{const {c}=fixture();assert.equal(c.queueQuarterlyTaxonomy_,undefined);});
test('actualizar programación elimina activadores independientes y conserva los cursores pendientes',()=>{
 const s=fixture(),c=s.c;const config=c.getConfiguration();config.config.settings.newsletterEnabled=true;c.saveConfiguration(config);c.enableDaily();c.writeTranslationJob_({state:'En pausa',cursor:{id:'retained'},pausedUntil:Date.now()+86400000});
 c.updateOperationalSchedule();c.workWake_();const names=c.ScriptApp.getProjectTriggers().map(t=>t.handler);assert.ok(names.includes('dailyRadar_'));assert.ok(names.includes('scheduledNewsletters_'));assert.ok(!names.some(n=>['dailyClassification_','dailyTaxonomy_','nightlyTranslations_','deliverNewsletters_','newsletterTick_'].includes(n)));assert.equal(c.translationJob_().cursor.id,'retained');
 s.setEmail('reader@bbva.com');assert.throws(()=>c.updateOperationalSchedule(),/administrador/);
});

test('snapshots preceden envíos y al publicarse newsletter gana a traducción, mantenimiento y anual',()=>{
 const {c,properties:p}=fixture();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';p.BACKGROUND_PRIORITY_BURST='99';c.writeTranslationJob_({state:'Pendiente',businessPending:100});c.maintenanceReadyAt_=()=>Date.now();c.writeTaxonomyJob_({state:'Completada',total:1});assert.equal(c.backgroundTask_(work,false),'snapshot');assert.equal(c.newsletterReadyAt_(work),Infinity);for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();assert.equal(c.backgroundTask_(work,false),'newsletter');assert.equal(c.progressBlockingJob_('newsletter',c.progressContext_()),'');p.NEWSLETTER_QUOTA_UNTIL=String(Date.now()+3600000);assert.equal(c.backgroundTask_(work,false),'translation');
});

test('una diaria pausada no despierta en bucle por catálogo, newsletter o traducción secundarios',()=>{const {c,properties:p}=fixture(),until=Date.now()+3600000,w={tasks:[],pending:[],jobs:[{id:'daily',tipo:'daily',pendientes:1,pausa:until}]};p.CATALOG_SYNC_REQUEST='pending';c.collectionReadyAt_=()=>until;c.translationReadyAt_=()=>Date.now();c.maintenanceReadyAt_=()=>Date.now();c.enrichmentReadyAt_=()=>Date.now();assert.equal(c.backgroundQueued_(w),false);assert.equal(c.backgroundNextAt_(w),until);assert.equal(c.backgroundNextAt_({jobs:w.jobs}),until);});
test('clasificación en backoff mantiene su despertar y publicación pendiente sigue siendo ejecutable',()=>{const {c,properties:p}=fixture(),until=Date.now()+3600000,w={tasks:[],pending:[],jobs:[]};c.writeClassificationJob_({state:'En pausa',pausedUntil:until});p.CATALOG_SYNC_REQUEST='pending';c.translationReadyAt_=()=>Date.now();assert.equal(c.backgroundNextAt_(w),until);c.writeClassificationJob_({state:'Completada',total:1});assert.ok(c.backgroundNextAt_(w)<=Date.now());});
