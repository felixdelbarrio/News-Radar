import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){
 const s=storage(),c=s.c;c.initializeConfiguration();
 for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 const feed=c.feeds_().find(feed=>feed.kind==='rss');c.collectionFeeds_=range=>[{...feed,range}];
 c.UrlFetchApp={fetchAll:requests=>requests.map(()=>({getResponseCode:()=>200,getContentText:()=>'<rss/>'}))};c.parseFeed_=()=>[];return {...s,feed};
}
function addJob(s,id,type,count,priority='2026-10-11'){
 const keys=vm.runInContext('RADAR.sheets.Recargas',s.c),job={id,tipo:type,desde:'2025-10-11',hasta:priority,inicio:'2026-10-11T00:00:00Z',fin:'',estado:'Pendiente',total:count,procesadas:0,pendientes:count,omitidas:0,fallidas:0,nuevas:0,actualizada:'',pausa:''};
 s.sheets.get('Recargas').grid.push(keys.map(key=>job[key]));
 for(let i=0;i<count;i++)s.sheets.get('Recopilacion').grid.push([id,s.feed.name,s.feed.url,'Pendiente',0,'',0,0,'',priority]);return job;
}
test('la diaria queda registrada con el trabajador ocupado y se procesa junto a la anual sin perder el día',()=>{
 const s=server(),c=s.c,range=c.collectionRange_('year',new Date());c.requestCollection_('annual',range);
 const locks=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.dailyRadar_();
 assert.equal(c.collectionRequests_().length,2);assert.equal(c.collectionStatus_().queued,2);
 c.LockService=locks;const result=c.backgroundTick_();c.backgroundTick_();const jobs=c.collectionJobs_();assert.equal(jobs.length,2);assert.equal(result.errors.length,0);assert.ok(jobs.some(job=>job.tipo==='annual'));assert.ok(jobs.some(job=>job.tipo==='daily'));assert.ok(jobs.every(job=>job.estado==='Completada'));assert.equal(c.collectionRequests_().length,0);
 c.dailyRadar_();assert.equal(c.collectionJobs_().length,3);assert.equal(c.collectionRequests_().length,0);
});
test('el planificador reserva cupo diario, avanza el anual y lee URLs solo del lote seleccionado',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',30,'2025-11-01');addJob(s,'daily','daily',8);
 const reads=[],sheet=s.sheets.get('Recopilacion'),range=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{reads.push(args);return range(...args);};
 const work=c.collectionWork_(Date.now());assert.equal(work.pending.filter(task=>task.ciclo==='daily').length,3);assert.equal(work.pending.filter(task=>task.ciclo==='annual').length,0);assert.equal(work.tasks.length,38);
 assert.deepEqual(reads.slice(0,2),[[2,1,38,1],[2,4,38,7]]);assert.equal(reads.slice(2).reduce((n,read)=>n+read[2],0),3);assert.ok(reads.slice(2).every(read=>read[1]===2&&read[3]===2));
 c.backgroundTick_();c.backgroundTick_();c.backgroundTick_();assert.equal(c.collectionWork_(Date.now()).pending.length,12);c.configuration_().settings.collectionBatch=5;assert.equal(c.collectionWork_(Date.now()).pending.length,20);
});
test('las pausas de la anual no bloquean la diaria y los reintentos respetan su espera',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',20);addJob(s,'daily','daily',2);
 const jobs=s.sheets.get('Recargas');jobs.grid[1][14]=String(Date.now()+600000);
 assert.ok(c.collectionWork_(Date.now()).pending.every(task=>task.ciclo==='daily'));
 s.sheets.get('Recopilacion').grid[21][3]='Reintento programado';s.sheets.get('Recopilacion').grid[21][5]=new Date().toISOString();assert.equal(c.collectionWork_(Date.now()).pending.length,1);
 c.retryCollectionErrors();assert.equal(c.collectionJobs_()[0].pausa,'');
});
test('cada lote guarda contadores por ciclo y deduplica noticias compartidas entre diaria y anual',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',1);addJob(s,'daily','daily',1);
 const date=new Date('2026-10-10T12:00:00Z');c.parseFeed_=()=>[{title:'BBVA lanza financiación para empresas',date:date.toISOString(),url:'https://bbva.com/nueva-noticia',excerpt:'Nueva cuenta para empresas'}];
 const result=c.backgroundTick_();assert.equal(result.added,1);c.backgroundTick_();assert.equal(c.rows_('Noticias').length,1);assert.equal(c.rows_('Ejecuciones').length,2);
 const status=c.collectionStatus_();assert.equal(status.jobs.length,2);assert.equal(status.jobs.reduce((n,job)=>n+Number(job.nuevas),0),1);assert.ok(status.jobs.every(job=>job.estado==='Completada'));
 const runs=c.getRuns({id:'daily'});assert.equal(runs.total,1);assert.equal(runs.items[0].tipo,'daily');assert.ok(runs.collection.jobs.length);
});
test('preparar una solicitud es idempotente incluso si quedó una parte de la cola escrita',()=>{
 const s=server(),c=s.c;c.requestCollection_('annual',{from:'2025-01-01',to:'2026-01-01'});const request=c.collectionRequests_()[0];
 addJob(s,request.id,'annual',1);s.sheets.get('Recargas').grid[1][2]=request.range.from;s.sheets.get('Recargas').grid[1][3]=request.range.to;s.sheets.get('Recargas').grid[1][6]='Preparando';c.drainCollectionRequests_();assert.equal(c.rows_('Recopilacion').length,1);assert.equal(c.collectionRequests_().length,0);
 s.sheets.get('Recargas').grid[1][6]='Preparando';let selected;c.collectionFeeds_=range=>{selected=range;return [{...s.feed,range}];};
 c.requestCollection_('annual',{from:'2025-01-02',to:'2026-01-02'});c.drainCollectionRequests_();assert.equal(c.collectionJobs_().length,1);assert.equal(c.rows_('Recopilacion').length,1);assert.equal(selected.to,'2026-01-01');
});
test('terminar una carga conserva su progreso pero retira sus tareas al preparar la siguiente',()=>{
 const s=server(),c=s.c;addJob(s,'done','daily',1);c.backgroundTick_();assert.equal(c.rows_('Recopilacion').length,1);
 c.requestCollection_('annual',{from:'2026-10-11',to:'2026-10-11'});c.drainCollectionRequests_();assert.equal(c.rows_('Recopilacion').length,1);assert.notEqual(c.rows_('Recopilacion')[0].ciclo,'done');assert.equal(c.collectionJobs_().find(job=>job.id==='done').procesadas,'1');
});
test('errores simultáneos solo pausan su ciclo y quedan reintentables',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',2);addJob(s,'daily','daily',1);
 const ingest=c.ingestFeed_;c.ingestFeed_=(feed,known,cycle,now,response)=>{if(cycle==='annual'){const e=Error('HTTP 503');e.retryable=true;throw e;}return ingest(feed,known,cycle,now,response);};
 c.backgroundTick_();c.backgroundTick_();const jobs=c.collectionJobs_();assert.ok(Number(jobs.find(job=>job.id==='annual').pausa)>Date.now());assert.equal(jobs.find(job=>job.id==='daily').estado,'Completada');assert.equal(c.rows_('Recopilacion').filter(task=>task.estado==='Reintento programado').length,2);
});
test('el despertador recupera solicitudes si coincide con el apagado del activador y reintenta un bloqueo',()=>{
 const s=server(),c=s.c;c.requestCollection_('annual',{from:'2026-10-11',to:'2026-10-11'});
 c.ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()==='backgroundTick_').forEach(trigger=>c.ScriptApp.deleteTrigger(trigger));
 const locks=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.backgroundTick_();assert.equal(c.collectionRequests_().length,1);assert.ok(c.ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='backgroundTick_'));
 c.LockService=locks;c.backgroundTick_();assert.equal(c.collectionRequests_().length,0);assert.ok(c.collectionJobs_().some(job=>job.estado==='Completada'));assert.ok(!c.ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='backgroundTick_'));
});
test('un fallo temporal del trabajador conserva el despertador y la solicitud',()=>{
 const s=server(),c=s.c;c.requestCollection_('annual',{from:'2026-10-11',to:'2026-10-11'});
 const tick=c.drainCollectionRequests_;c.drainCollectionRequests_=()=>{throw Error('Servicio temporalmente indisponible');};assert.throws(()=>c.backgroundTick_(),/indisponible/);
 assert.equal(c.collectionRequests_().length,1);assert.ok(c.ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='backgroundTick_'));
 c.drainCollectionRequests_=tick;c.backgroundTick_();assert.equal(c.collectionRequests_().length,0);
});
test('la siguiente ejecución repara el progreso si falló su última escritura sin volver a descargar',()=>{
 const s=server(),c=s.c;addJob(s,'daily','daily',1);const write=c.writeCollectionJob_;let interrupted=false;
 c.writeCollectionJob_=job=>{if(job.estado==='Completada'&&!interrupted){interrupted=true;throw Error('Escritura interrumpida');}write(job);};
 assert.throws(()=>c.backgroundTick_(),/interrumpida/);assert.equal(c.collectionJobs_()[0].estado,'En curso');assert.equal(c.rows_('Recopilacion')[0].estado,'Completada');
 c.UrlFetchApp.fetchAll=()=>{throw Error('No debe descargar otra vez');};c.backgroundTick_();assert.equal(c.collectionJobs_()[0].estado,'Completada');assert.equal(c.collectionJobs_()[0].pendientes,'0');assert.equal(c.collectionJobs_()[0].procesadas,'1');
});
test('los lanzamientos manual y programado comparten la solicitud diaria y rechazan duplicados activos',()=>{
 const s=server(),c=s.c;c.collectNow();const first=c.collectionRequests_()[0];assert.equal(first.kind,'daily');assert.deepEqual(first.range,c.collectionRecentRange_(new Date()));assert.throws(()=>c.collectNow(),/diaria en curso/);
 const lock=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.dailyRadar_();assert.equal(c.collectionRequests_().length,1);assert.deepEqual(c.collectionRequests_()[0].range,first.range);c.LockService=lock;c.backgroundTick_();assert.equal(c.collectionJobs_().length,1);
 c.collectNow();assert.equal(c.collectionRequests_().length,1);c.backgroundTick_();assert.equal(c.collectionJobs_().length,2);
 c.collectNow('year');assert.throws(()=>c.collectNow('year'),/anual en curso/);c.drainCollectionRequests_();assert.throws(()=>c.collectNow('year'),/anual en curso/);
});
test('un único trabajador serializa diaria, anual y traducción, y alterna los dos procesos secundarios',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',30);addJob(s,'daily','daily',1);const order=[];const collect=c.collectionBatch_;
 c.collectionBatch_=work=>{order.push(work.pending[0]?.ciclo);return collect(work);};c.translationBatch_=()=>{order.push('translation');};c.requestTranslations_();
 c.backgroundTick_();assert.deepEqual(order,['daily']);c.backgroundTick_();assert.deepEqual(order,['daily','translation']);c.backgroundTick_();assert.deepEqual(order,['daily','translation','annual']);c.backgroundTick_();assert.deepEqual(order,['daily','translation','annual','translation']);
 assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);
 const lock=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};assert.equal(c.backgroundTick_().busy,true);assert.equal(order.length,4);assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);c.LockService=lock;
});
test('la inicialización elimina trabajadores antiguos, conserva tareas y recrea los horarios desde configuración',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',1);c.enableDaily();for(const name of ['collectionTick_','collectionWake_','translationTick_'])c.ScriptApp.newTrigger(name).timeBased().create();c.initializeConfiguration();assert.equal(s.properties['WORK_PENDING:background'],'true');c.workWake_();
 const scheduled=c.ScriptApp.getProjectTriggers();assert.ok(!scheduled.some(t=>['collectionTick_','collectionWake_','translationTick_'].includes(t.handler)));assert.equal(c.rows_('Recopilacion').length,1);assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);
 const daily=c.scheduledTriggers_('dailyRadar_')[0],translation=c.scheduledTriggers_('nightlyTranslations_')[0];assert.equal(daily.hour,c.settings_().dailyHour);assert.equal(translation.hour,2);assert.equal(translation.minute,0);assert.equal(translation.timezone,c.settings_().timezone);assert.equal(translation.days,1);
 const cfg=JSON.parse(JSON.stringify(c.configuration_()));cfg.settings.dailyHour=8;cfg.settings.timezone='Europe/Istanbul';c.writeConfiguration_(cfg,c.configurationRevision_());assert.equal(c.scheduledTriggers_('dailyRadar_')[0].hour,8);assert.equal(c.scheduledTriggers_('nightlyTranslations_')[0].timezone,'Europe/Istanbul');
});
test('los reintentos despiertan al vencer la espera y una diaria adelanta ese despertar',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',2);c.UrlFetchApp.fetchAll=requests=>requests.map(()=>({getResponseCode:()=>503}));c.backgroundTick_();assert.ok(c.scheduledTriggers_('backgroundTick_')[0].delay>60000);c.requestDailyCollection_();assert.equal(c.scheduledTriggers_('backgroundTick_')[0].delay,60000);
});
test('el trabajador aprovecha un despertar para tres lotes y persiste resultados en cada uno',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',50);const batches=[],collect=c.collectionBatch_;c.collectionBatch_=work=>{const result=collect(work);batches.push(c.rows_('Recopilacion').filter(task=>task.estado==='Completada').length);return result;};
 c.processBackground_();assert.deepEqual(batches,[12,24,36]);assert.equal(c.rows_('Ejecuciones').length,3);assert.equal(c.collectionJobs_()[0].pendientes,'14');assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);
});
test('una diaria llegada durante un lote anual es el siguiente lote y las llamadas lentas limitan el turno',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',50);const order=[],collect=c.collectionBatch_;c.collectionBatch_=work=>{order.push(work.pending[0]?.ciclo);const result=collect(work);if(order.length===1)c.requestDailyCollection_();return result;};c.processBackground_();assert.equal(order[0],'annual');assert.match(order[1],/^daily\//);assert.equal(order[2],'annual');
 const nativeDate=vm.runInContext('Date',c);let clock=Date.now(),batches=0;c.Date=class extends nativeDate{constructor(value){super(value===undefined?clock:value);}static now(){return clock;}};c.collectionBatch_=work=>{batches++;const result=collect(work);clock+=50000;return result;};c.processBackground_();assert.equal(batches,1);assert.equal(c.scheduledTriggers_('backgroundTick_').length,1);
});

test('relanzar diaria o anual reutiliza una única línea por tipo y conserva el histórico de ejecuciones',()=>{
 const s=server(),c=s.c;addJob(s,'old-daily','daily',1);addJob(s,'old-annual','annual',1);
 for(const row of s.sheets.get('Recargas').grid.slice(1)){row[4]='2026-10-10';row[6]='Completada';row[9]=0;}
 addJob(s,'new-daily','daily',2);addJob(s,'new-annual','annual',3);
 const status=c.collectionStatus_();assert.equal(status.jobs.length,2);assert.deepEqual([...status.jobs.map(job=>job.id)],['new-daily','new-annual']);assert.equal(c.collectionJobs_().length,4);
 s.properties['COLLECTION_REQUEST:new']=JSON.stringify({id:'queued',kind:'daily',range:{from:'2026-10-01',to:'2026-10-12'},created:'2099-10-12'});s.cache.delete('collection-status');assert.equal(c.collectionStatus_().jobs.length,2);
});

test('la configuración detiene al trabajador entre lotes y conserva las tareas para reanudar',()=>{
 const s=server(),c=s.c;addJob(s,'maintenance','annual',50);const collect=c.collectionBatch_;let batches=0;
 c.collectionBatch_=work=>{batches++;const result=collect(work);s.properties['WORK_INTENT:test']=String(Date.now()+600000);return result;};
 c.processBackground_();assert.equal(batches,1);assert.equal(c.collectionJobs_()[0].pendientes,'38');assert.equal(s.properties['WORK_PENDING:background'],'true');
 delete s.properties['WORK_INTENT:test'];c.collectionBatch_=collect;c.workWake_();c.processBackground_();
 assert.equal(c.collectionJobs_()[0].pendientes,'2');assert.equal(c.collectionJobs_()[0].procesadas,'48');
});
