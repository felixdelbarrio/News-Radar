import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/delivery.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
const work={pending:[{ciclo:'annual'}],jobs:[{id:'annual',tipo:'annual',pendientes:1}]};
test('prioridad única: diaria, clasificación, traducción de negocio, newsletter, taxonomía, traducción de taxonomía y pendientes',()=>{
 const {c,properties:p}=fixture();c.settings_().newsletterEnabled=true;
 c.writeClassificationJob_({state:'Pendiente'});c.writeTranslationJob_({state:'Pendiente',businessPending:1});c.writeTaxonomyJob_({state:'Pendiente'});c.taxonomyTranslationReadyAt_=()=>Date.now();p.NEWSLETTER_REQUEST='true';
 assert.equal(c.backgroundTask_(work,true),'collection');assert.equal(c.backgroundTask_(work,false),'classification');
 c.writeClassificationJob_({state:'Completada'});assert.equal(c.backgroundTask_(work,false),'translation');
 c.writeTranslationJob_({state:'Completada',businessPending:0});assert.equal(c.backgroundTask_(work,false),'newsletter');
 delete p.NEWSLETTER_REQUEST;assert.equal(c.backgroundTask_(work,false),'taxonomy');c.writeTaxonomyJob_({state:'Completada'});assert.equal(c.backgroundTask_(work,false),'taxonomyTranslation');
 c.taxonomyTranslationReadyAt_=()=>Infinity;assert.equal(c.backgroundTask_(work,false),'collection');
});
test('una cuota de traducción de negocio aplaza el correo y deja avanzar pendientes sin despertar en bucle',()=>{
 const {c,properties:p}=fixture();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';c.writeTranslationJob_({state:'En pausa',businessPending:1,pausedUntil:Date.now()+86400000});
 assert.equal(c.newsletterReadyAt_(work),Infinity);assert.equal(c.backgroundTask_(work,false),'collection');
 c.writeTranslationJob_({state:'Completada',businessPending:0});assert.ok(c.newsletterReadyAt_(work)<=Date.now());
});
test('dos activadores del mismo día conservan una sola recopilación y las etapas posteriores',()=>{
 const {c,properties:p}=fixture();c.requestDailyPipeline_();c.requestDailyPipeline_();c.drainDailyPipeline_();const request=c.collectionRequests_()[0];assert.equal(c.collectionRequests_().length,1);assert.ok(p.CLASSIFICATION_REQUEST);assert.ok(p.DAILY_TRANSLATION_REQUEST);
 c.requestDailyPipeline_();c.drainDailyPipeline_();assert.equal(c.collectionRequests_().length,1);assert.equal(c.collectionRequests_()[0].id,request.id);
});
test('la revisión mensual se deduplica y el corpus sin cambios no repite el análisis',()=>{
 const {c,properties:p}=fixture();c.queueMonthlyTaxonomy_({to:'2026-06-30'});assert.equal(p.TAXONOMY_REQUEST,'2026-06-30');delete p.TAXONOMY_REQUEST;c.queueMonthlyTaxonomy_({to:'2026-06-30'});assert.equal(p.TAXONOMY_REQUEST,undefined);
 p.TAXONOMY_EVALUATED_CORPUS=p.NEWS_CONTENT_REVISION||'0';p.TAXONOMY_APPLIED_RULES=c.classificationRulesRevision_();c.queueMonthlyTaxonomy_({to:'2026-09-30'});assert.equal(p.TAXONOMY_REQUEST,undefined);
});
test('actualizar programación elimina activadores independientes y conserva los cursores pendientes',()=>{
 const s=fixture(),c=s.c;c.settings_().newsletterEnabled=true;c.enableDaily();for(const name of ['dailyClassification_','dailyTaxonomy_','nightlyTranslations_','deliverNewsletterBatch_','newsletterTick_'])c.ScriptApp.newTrigger(name).timeBased().create();c.writeTranslationJob_({state:'En pausa',cursor:{id:'retained'},pausedUntil:Date.now()+86400000});
 c.updateOperationalSchedule();c.workWake_();const names=c.ScriptApp.getProjectTriggers().map(t=>t.handler);assert.ok(names.includes('dailyRadar_'));assert.ok(names.includes('scheduledNewsletters_'));assert.ok(!names.some(n=>['dailyClassification_','dailyTaxonomy_','nightlyTranslations_','deliverNewsletterBatch_','newsletterTick_'].includes(n)));assert.equal(c.translationJob_().cursor.id,'retained');
 s.setEmail('reader@bbva.com');assert.throws(()=>c.updateOperationalSchedule(),/administrador/);
});
