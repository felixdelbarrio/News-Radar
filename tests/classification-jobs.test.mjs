import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app,tick} from './helpers/app.mjs';
function server(count=250){
 const s=storage(),c=s.c;c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 for(let i=0;i<count;i++)s.sheets.get('Noticias').grid.push([String(i),'2026-10-10','España','Editor','BBVA','BBVA lanza IA en su banca online','','','https://example.com/'+i,'','Editor','es','']);
 const feed=c.feeds_().find(row=>row.kind==='rss');c.collectionFeeds_=range=>[{...feed,range}];c.UrlFetchApp={fetchAll:requests=>requests.map(()=>({getResponseCode:()=>200,getContentText:()=>'<rss/>'}))};c.parseFeed_=()=>[];return {...s,feed};
}
function addCollection(s,id,type,count){
 const c=s.c,keys=vm.runInContext('RADAR.sheets.Recargas',c),job={id,tipo:type,desde:'2026-10-01',hasta:'2026-10-12',inicio:new Date().toISOString(),estado:'Pendiente',total:count,pendientes:count};s.sheets.get('Recargas').grid.push(keys.map(key=>job[key]||''));
 for(let i=0;i<count;i++)s.sheets.get('Recopilacion').grid.push([id,s.feed.name,s.feed.url,'Pendiente',0,'',0,0,'','2026-10-12']);
}
test('programación diaria única, con hora y zona de configuración; solicitud durable con trabajador ocupado',()=>{
 const {c,properties}=server();c.initializeConfiguration();c.initializeConfiguration();assert.equal(c.scheduledTriggers_('dailyClassification_').length,1);const schedule=c.scheduledTriggers_('dailyClassification_')[0];assert.equal(schedule.hour,c.settings_().dailyHour);assert.equal(schedule.minute,30);assert.equal(schedule.timezone,'Europe/Madrid');assert.equal(schedule.days,1);
 const config=JSON.parse(JSON.stringify(c.getConfiguration()));config.config.settings.dailyHour=8;config.config.settings.timezone='Europe/Istanbul';c.saveConfiguration(config);assert.equal(c.scheduledTriggers_('dailyClassification_')[0].hour,8);assert.equal(c.scheduledTriggers_('dailyClassification_')[0].timezone,'Europe/Istanbul');
 const prior=c.classificationJob_();prior.day='2026-01-01';c.writeClassificationJob_(prior);const locks=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.dailyClassification_();assert.ok(properties.CLASSIFICATION_REQUEST);assert.equal(c.processBackground_().busy,true);assert.ok(properties.CLASSIFICATION_REQUEST);c.LockService=locks;c.processBackground_();assert.equal(properties.CLASSIFICATION_REQUEST,undefined);assert.equal(c.getClassificationStatus().job.state,'Completada');assert.equal(c.getClassificationStatus().job.processed,250);
 const started=c.classificationJob_().started;c.dailyClassification_();c.processBackground_();assert.equal(c.classificationJob_().started,started);
});
test('diaria consume todos los lotes prioritarios; anual, traducción y clasificación se alternan sin ejecución simultánea',()=>{
 const s=server(450),c=s.c;c.startClassification();addCollection(s,'annual','annual',50);addCollection(s,'daily','daily',7);c.requestTranslations_();const order=[],collect=c.collectionBatch_,classify=c.newsClassificationBatch_;
 c.collectionBatch_=work=>{if(work.pending.length)order.push(work.pending[0].ciclo);return collect(work);};c.translationBatch_=()=>order.push('translation');c.newsClassificationBatch_=ms=>{order.push('classification');return classify(ms);};
 c.processBackground_();assert.deepEqual(order,['daily','daily','daily']);assert.equal(c.getClassificationStatus().job.processed,0);
 c.processBackground_();assert.deepEqual(order.slice(3),['translation','classification','annual']);assert.equal(c.getClassificationStatus().job.processed,100);assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);
});
test('una diaria llegada durante clasificación se atiende en el siguiente lote, bajo el mismo bloqueo',()=>{
 const s=server(),c=s.c;c.startClassification();const order=[],classify=c.newsClassificationBatch_,collect=c.collectionBatch_;c.newsClassificationBatch_=ms=>{order.push('classification');classify(ms);c.requestDailyCollection_();};c.collectionBatch_=work=>{if(work.pending.length)order.push('daily');return collect(work);};c.processBackground_(2);assert.deepEqual(order,['classification','daily']);assert.equal(c.classificationJob_().next,102);
});
test('ejecución manual administrativa conserva cursor activo y progreso final; reejecución no vuelve a escribir etiquetas',()=>{
 const s=server(),c=s.c;c.startClassification();c.newsClassificationBatch_();assert.equal(c.getClassificationStatus().job.processed,100);const job=JSON.stringify(c.classificationJob_());c.startClassification();assert.equal(JSON.stringify(c.classificationJob_()),job);c.processBackground_();const status=c.getClassificationStatus();assert.equal(status.job.state,'Completada');assert.equal(status.job.processed,250);assert.equal(status.job.classified,250);assert.equal(status.job.digital,250);
 c.startClassification();c.processBackground_();assert.equal(c.getClassificationStatus().job.classified,0);assert.equal(c.getClassificationStatus().job.processed,250);assert.equal(c.scheduledTriggers_('backgroundTick_').length,0);
 s.setEmail('reader@bbva.com');assert.throws(()=>c.startClassification(),/administrador/);assert.throws(()=>c.getClassificationStatus(),/administrador/);
});
test('error de Sheets conserva cursor, pausa y reintenta después; no monopoliza el trabajador',()=>{
 const s=server(),c=s.c;c.startClassification();const sheet=s.sheets.get('Noticias'),range=sheet.getRange;sheet.getRange=()=>{throw Error('Sheets temporalmente no disponible');};c.processBackground_();assert.equal(c.classificationJob_().next,2);assert.equal(c.classificationJob_().state,'En pausa');assert.match(c.getClassificationStatus().job.error,/Sheets/);assert.ok(c.scheduledTriggers_('backgroundTick_')[0].delay>60000);
 sheet.getRange=range;c.startClassification();assert.equal(c.classificationJob_().pausedUntil,0);c.processBackground_();assert.equal(c.classificationJob_().state,'Completada');assert.equal(c.getClassificationStatus().job.processed,250);
});
test('barra real muestra progreso y errores, lanza manualmente y consulta solo mientras la pantalla está activa',async t=>{
 const timers=new Map();const a=await app(t,{configure:({w,replies})=>{w.setTimeout=(fn,ms)=>{const id=timers.size+1;timers.set(id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);replies.getClassificationStatus={scheduled:true,hour:5,minute:30,timezone:'Europe/Madrid',job:null};}});
 await a.click('[data-view="administration"]');assert.match(a.find('#classification-schedule').textContent,/05:30/);assert.equal(a.find('#classification-start').disabled,false);
 a.replies.getClassificationStatus.job={state:'En curso',total:250,processed:100,classified:100,digital:90,updated:'2026-10-12T08:00:00Z'};await a.click('#classification-start');assert.ok(a.calls.some(row=>row.method==='startClassification'));assert.equal(a.find('#classification-progress progress').value,100);assert.equal(a.find('#classification-progress progress').max,250);assert.equal(a.find('#classification-start').disabled,true);assert.ok([...timers.values()].some(row=>row.ms===30000));
 await a.click('[data-admin-view="sources"]');assert.equal([...timers.values()].filter(row=>row.ms===30000).length,0);
 a.replies.getClassificationStatus.job={state:'Completada',total:250,processed:250,classified:150,digital:120,updated:'2026-10-12T09:00:00Z'};await a.click('[data-admin-view="configuration"]');assert.equal(a.find('#classification-start').disabled,false);assert.equal(a.find('#classification-progress progress').value,250);
 a.replies.getClassificationStatus.job.state='En pausa';a.replies.getClassificationStatus.job.error='<Sheets error>';await a.click('[data-admin-view="sources"]');await a.click('[data-admin-view="configuration"]');assert.equal(a.find('#classification-start').disabled,false);assert.ok(a.find('#classification-progress').textContent.includes('<Sheets error>'));assert.equal(a.find('#classification-progress').querySelector('sheets'),null);await a.click('[data-view="news"]');await tick();assert.equal([...timers.values()].filter(row=>row.ms===30000).length,0);
});
test('inicializar el nuevo job conserva capacidades eliminadas y reinicia una clasificación con reglas modificadas',()=>{
 const {c}=server(),snapshot=JSON.parse(JSON.stringify(c.getConfiguration()));snapshot.config.capabilities.Empresas.shift();c.saveConfiguration(snapshot);const names=JSON.stringify(c.getConfiguration().config.capabilities.Empresas);c.initializeConfiguration();assert.equal(JSON.stringify(c.getConfiguration().config.capabilities.Empresas),names);
 c.newsClassificationBatch_();assert.equal(c.getClassificationStatus().job.processed,100);c.configuration_().entities[0].enabled=false;c.newsClassificationBatch_();assert.equal(c.getClassificationStatus().job.processed,0);assert.equal(c.classificationJob_().state,'Pendiente');
});
