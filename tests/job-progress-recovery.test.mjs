import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {app,tick} from './helpers/app.mjs';
import {storage} from './helpers/delivery.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
test('Ejecuciones incluye una sola clasificación bajo las recargas y usa el estado del mismo RPC',async t=>{
 const a=await app(t,{entry:''});await a.click('[data-view="administration"]');assert.ok(a.find('#runs-section').contains(a.find('#classification-start')));assert.equal(a.find('#classification-progress').querySelectorAll('progress').length,1);assert.ok(a.find('[data-process-group="collection"]').compareDocumentPosition(a.find('#classification-progress'))&a.w.Node.DOCUMENT_POSITION_FOLLOWING);assert.equal(a.w.document.querySelector('#configuration-section #classification-start'),null);assert.equal(a.calls.filter(c=>c.method==='getClassificationStatus').length,0);
 await a.click('#classification-start');assert.equal(a.calls.filter(c=>c.method==='startClassification').length,1);
});
test('la interfaz solo permite recopilación diaria y conserva la continuación diaria',async t=>{
 const a=await app(t,{entry:'',configure({data,replies}){data.collection={pending:20,blocked:{today:true},jobs:[]};replies.getRuns.collection=data.collection;}});
 await a.click('[data-view="administration"]');assert.equal(a.w.document.querySelector('[name="recovery-range"]'),null);assert.equal(a.find('[data-collection-slot="daily"]').disabled,true);
 await a.click('#control-panel-refresh');assert.equal(a.calls.filter(c=>c.method==='getControlPanel').length,2);assert.equal(a.calls.filter(c=>c.method==='collectNow').length,0);
});
test('el supervisor repone un trabajador perdido y conserva las pausas y los datos pendientes',()=>{
 const s=fixture(),c=s.c;c.requestCollection_('annual',{from:'2025-10-01',to:'2026-10-01'});for(const trigger of c.scheduledTriggers_('backgroundTick_'))c.ScriptApp.deleteTrigger(trigger);c.backgroundWatchdog_();assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);assert.equal(c.collectionRequests_().length,1);
 const next=s.properties.BACKGROUND_NEXT;c.backgroundWatchdog_();assert.equal(s.properties.BACKGROUND_NEXT,next);assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);
 c.initializeBackgroundSchedules_();assert.equal(c.scheduledTriggers_('backgroundWatchdog_').length,1);assert.equal(c.scheduledTriggers_('backgroundWatchdog_')[0].minutes,5);
});
test('el supervisor no interrumpe un trabajador en ejecución ni lee hojas cuando no hay pendientes',()=>{
 const s=fixture(),c=s.c;for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();const scheduled=c.scheduledTriggers_('backgroundTick_').length;delete s.properties.BACKGROUND_PENDING;delete s.properties['WORK_PENDING:background'];c.collectionJobs_=()=>{throw Error('No debe consultar Sheets');};c.backgroundWatchdog_();s.properties.BACKGROUND_PENDING='true';c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.backgroundWatchdog_();assert.equal(c.scheduledTriggers_('backgroundTick_').length,scheduled);
});
test('el progreso de newsletter deduplica intentos, detecta revisiones y nunca lee Noticias ni consulta Gmail',()=>{
 const s=fixture(),c=s.c;c.settings_().newsletterEnabled=true;
 for(let i=0;i<3;i++)s.sheets.get('Suscripciones').grid.push([String(i),'owner@bbva.com','Canal','{}','quarterly','true','2000-01-01','es']);
 const plan=c.newsletterDeliveryPlan_(new Date(),[]),period=plan.periods.get('quarterly'),id=plan.planned[0].id;
 s.sheets.get('NewsletterEnvios').grid.push([id,'0','owner@bbva.com',period.from,period.to,'No enviado',new Date().toISOString(),'',''],[id,'0','owner@bbva.com',period.from,period.to,'Enviada',new Date().toISOString(),'','']);
 const second=plan.planned[1].id;s.sheets.get('NewsletterEnvios').grid.push([second,'1','owner@bbva.com',period.from,period.to,'Revisar',new Date().toISOString(),'','']);
 c.refreshNewsletterStatus_();s.sheets.get('Noticias').getRange=()=>{throw Error('No debe leer noticias');};c.newsletterSender_=()=>{throw Error('No debe consultar Gmail');};const progress=c.getNewsletterProgress();assert.equal(progress.job.total,3);assert.equal(progress.job.processed,1);assert.equal(progress.job.pending,1);assert.equal(progress.job.review,1);assert.equal(progress.job.state,'En pausa');
 const reads=s.reads;c.getNewsletterProgress();assert.equal(s.reads,reads);s.setEmail('reader@bbva.com');assert.throws(()=>c.getNewsletterProgress(),/administrador/);
});
test('envíos acotados mantienen progreso entre lotes y la taxonomía se completa antes de todas las trimestrales',()=>{
 const s=fixture(),c=s.c;c.settings_().newsletterEnabled=true;for(let i=0;i<3;i++)s.sheets.get('Suscripciones').grid.push([String(i),'owner@bbva.com','Canal','{}','quarterly','true','2000-01-01','es']);
 let clock=Date.now();c.Date=class extends Date{constructor(value=clock){super(value);}static now(){return clock;}};c.newsletterContent_=()=>{clock+=5000;return {count:0,items:[]};};c.newsletterContentDetail_=()=>'';
 const first=c.deliverNewsletterBatch_(undefined,5000);assert.equal(first.empty,1);assert.equal(first.pending,2);assert.equal(s.properties.TAXONOMY_REQUEST,undefined);assert.ok(s.properties.NEWSLETTER_REQUEST);const progress=c.getNewsletterProgress();assert.equal(progress.job.processed,1);assert.equal(progress.job.total,3);
 clock+=c.settings_().pauseMinutes*60000;c.deliverNewsletterBatch_();assert.equal(c.rows_('NewsletterEnvios').length,3);assert.equal(s.properties.TAXONOMY_REQUEST,undefined);assert.equal(s.properties.NEWSLETTER_REQUEST,undefined);c.deliverNewsletterBatch_();assert.equal(c.rows_('NewsletterEnvios').length,3);
});
test('el progreso de envíos solo se sondea en la vista administrativa activa',async t=>{
 const timers=new Map();let id=0;const a=await app(t,{configure({w,replies}){const set=w.setTimeout.bind(w),clear=w.clearTimeout.bind(w);w.setTimeout=(fn,ms)=>{if(ms<30000)return set(fn,ms);timers.set(++id,{fn,ms});return id;};w.clearTimeout=key=>{timers.delete(key);clear(key);};replies.getNewsletterProgress={enabled:true,active:true,queued:true,job:{state:'En cola',total:3,processed:1,pending:2,accepted:1,empty:0,review:0}};}});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="runs"]');assert.equal(a.find('#newsletter-delivery-progress progress').value,1);assert.equal(a.find('#newsletter-delivery-progress progress').max,3);assert.ok([...timers.values()].some(t=>t.ms===30000));await a.click('[data-admin-view="subscribers"]');assert.equal([...timers.values()].filter(t=>t.ms===30000).length,0);
});
test('el supervisor recupera solicitudes de clasificación sin cursor activo y trabajo diferido tras una configuración',()=>{
 const s=fixture(),c=s.c;s.properties.CLASSIFICATION_REQUEST='2026-01-01';delete s.properties.BACKGROUND_PENDING;c.backgroundWatchdog_();assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);assert.equal(s.properties.CLASSIFICATION_REQUEST,'2026-01-01');
 c.deferBackgroundWork_('daily');c.backgroundWatchdog_();assert.ok(s.properties.DAILY_PIPELINE_REQUEST);assert.equal(s.properties['WORK_PENDING:daily'],undefined);
});
