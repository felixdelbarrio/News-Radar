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
 const s=server(),c=s.c,range=c.collectionRange_('year',new Date());c.startCollection_(range);
 const locks=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.dailyRadar_();
 assert.equal(c.collectionRequests_().length,2);assert.equal(c.collectionStatus_().queued,2);
 c.LockService=locks;const result=c.collectionTick_(),jobs=c.collectionJobs_();assert.equal(jobs.length,2);assert.equal(result.errors.length,0);assert.ok(jobs.some(job=>job.tipo==='annual'));assert.ok(jobs.some(job=>job.tipo==='daily'));assert.ok(jobs.every(job=>job.estado==='Completada'));assert.equal(c.collectionRequests_().length,0);
 c.dailyRadar_();assert.equal(c.collectionJobs_().length,2);assert.equal(c.collectionRequests_().length,0);
});
test('el planificador reserva cupo diario, avanza el anual y lee URLs solo del lote seleccionado',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',30,'2025-11-01');addJob(s,'daily','daily',8);
 const reads=[],sheet=s.sheets.get('Recopilacion'),range=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{reads.push(args);return range(...args);};
 const work=c.collectionWork_(Date.now());assert.equal(work.pending.filter(task=>task.ciclo==='daily').length,3);assert.equal(work.pending.filter(task=>task.ciclo==='annual').length,12);assert.equal(work.tasks.length,38);
 assert.deepEqual(reads.slice(0,2),[[2,1,38,1],[2,4,38,7]]);assert.equal(reads.slice(2).reduce((n,read)=>n+read[2],0),15);assert.ok(reads.slice(2).every(read=>read[1]===2&&read[3]===2));
 c.configuration_().settings.collectionBatch=5;assert.equal(c.collectionWork_(Date.now()).pending.length,20);
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
 const date=new Date(Date.now()-86400000);c.parseFeed_=()=>[{title:'BBVA lanza financiación para empresas',date:date.toISOString(),url:'https://bbva.com/nueva-noticia',excerpt:'Nueva cuenta para empresas'}];
 const result=c.collectionTick_();assert.equal(result.added,1);assert.equal(c.rows_('Noticias').length,1);assert.equal(c.rows_('Ejecuciones').length,2);
 const status=c.collectionStatus_();assert.equal(status.jobs.length,2);assert.equal(status.jobs.reduce((n,job)=>n+Number(job.nuevas),0),1);assert.ok(status.jobs.every(job=>job.estado==='Completada'));
 const runs=c.getRuns({id:'daily'});assert.equal(runs.total,1);assert.equal(runs.items[0].tipo,'daily');assert.ok(runs.collection.jobs.length);
});
test('preparar una solicitud es idempotente incluso si quedó una parte de la cola escrita',()=>{
 const s=server(),c=s.c;c.startCollection_({from:'2025-01-01',to:'2026-01-01'});const request=c.collectionRequests_()[0];
 addJob(s,request.id,'annual',1);s.sheets.get('Recargas').grid[1][2]=request.range.from;s.sheets.get('Recargas').grid[1][3]=request.range.to;s.sheets.get('Recargas').grid[1][6]='Preparando';c.drainCollectionRequests_();assert.equal(c.rows_('Recopilacion').length,1);assert.equal(c.collectionRequests_().length,0);
 s.sheets.get('Recargas').grid[1][6]='Preparando';let selected;c.collectionFeeds_=range=>{selected=range;return [{...s.feed,range}];};
 c.startCollection_({from:'2025-01-02',to:'2026-01-02'});c.drainCollectionRequests_();assert.equal(c.collectionJobs_().length,1);assert.equal(c.rows_('Recopilacion').length,1);assert.equal(selected.to,'2026-01-01');
});
test('terminar una carga conserva su progreso pero retira sus tareas al preparar la siguiente',()=>{
 const s=server(),c=s.c;addJob(s,'done','manual',1);c.collectionTick_();assert.equal(c.rows_('Recopilacion').length,1);
 c.startCollection_({from:'2026-10-11',to:'2026-10-11'});c.drainCollectionRequests_();assert.equal(c.rows_('Recopilacion').length,1);assert.notEqual(c.rows_('Recopilacion')[0].ciclo,'done');assert.equal(c.collectionJobs_().find(job=>job.id==='done').procesadas,'1');
});
test('errores simultáneos solo pausan su ciclo y quedan reintentables',()=>{
 const s=server(),c=s.c;addJob(s,'annual','annual',2);addJob(s,'daily','daily',1);
 const ingest=c.ingestFeed_;c.ingestFeed_=(feed,known,cycle,now,response)=>{if(cycle==='annual'){const e=Error('HTTP 503');e.retryable=true;throw e;}return ingest(feed,known,cycle,now,response);};
 c.collectionTick_();const jobs=c.collectionJobs_();assert.ok(Number(jobs.find(job=>job.id==='annual').pausa)>Date.now());assert.equal(jobs.find(job=>job.id==='daily').estado,'Completada');assert.equal(c.rows_('Recopilacion').filter(task=>task.estado==='Reintento programado').length,2);
});
test('el despertador recupera solicitudes si coincide con el apagado del activador y reintenta un bloqueo',()=>{
 const s=server(),c=s.c;c.startCollection_({from:'2026-10-11',to:'2026-10-11'});
 c.ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()==='collectionTick_').forEach(trigger=>c.ScriptApp.deleteTrigger(trigger));
 const locks=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.collectionWake_();assert.equal(c.collectionRequests_().length,1);assert.ok(c.ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='collectionWake_'));
 c.LockService=locks;c.collectionWake_();assert.equal(c.collectionRequests_().length,0);assert.ok(c.collectionJobs_().some(job=>job.estado==='Completada'));assert.ok(!c.ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='collectionWake_'));
});
test('un fallo temporal del trabajador conserva el despertador y la solicitud',()=>{
 const s=server(),c=s.c;c.startCollection_({from:'2026-10-11',to:'2026-10-11'});
 const tick=c.collectionTick_;c.collectionTick_=()=>{throw Error('Servicio temporalmente indisponible');};assert.throws(()=>c.collectionWake_(),/indisponible/);
 assert.equal(c.collectionRequests_().length,1);assert.ok(c.ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='collectionWake_'));
 c.collectionTick_=tick;c.collectionWake_();assert.equal(c.collectionRequests_().length,0);
});
test('la siguiente ejecución repara el progreso si falló su última escritura sin volver a descargar',()=>{
 const s=server(),c=s.c;addJob(s,'daily','daily',1);const write=c.writeCollectionJob_;let interrupted=false;
 c.writeCollectionJob_=job=>{if(job.estado==='Completada'&&!interrupted){interrupted=true;throw Error('Escritura interrumpida');}write(job);};
 assert.throws(()=>c.collectionTick_(),/interrumpida/);assert.equal(c.collectionJobs_()[0].estado,'En curso');assert.equal(c.rows_('Recopilacion')[0].estado,'Completada');
 c.UrlFetchApp.fetchAll=()=>{throw Error('No debe descargar otra vez');};c.collectionTick_();assert.equal(c.collectionJobs_()[0].estado,'Completada');assert.equal(c.collectionJobs_()[0].pendientes,'0');assert.equal(c.collectionJobs_()[0].procesadas,'1');
});
