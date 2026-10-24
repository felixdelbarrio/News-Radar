import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
function logs(s,count=110){const sheet=s.sheets.get('Telemetria');sheet.grid.splice(1);for(let i=0;i<count;i++)sheet.grid.push([new Date().toISOString(),'dashboard','10','OK',String(i)]);return sheet;}
test('13:00 Madrid se añade al horario existente y su instalación es idempotente',()=>{
 const s=server(),c=s.c;c.enableDaily();c.updateOperationalSchedule();c.updateOperationalSchedule();const report=c.getOperationalSchedule();assert.equal(report.valid,true);const additional=c.scheduledTriggers_('afternoonRadar_');assert.equal(additional.length,1);assert.equal(additional[0].hour,13);assert.equal(additional[0].timezone,'Europe/Madrid');assert.equal(additional[0].minute,0);assert.equal(c.scheduledTriggers_('backgroundWatchdog_').length,1);assert.equal(c.scheduledTriggers_('dailyRadar_').length,1);assert.equal(c.scheduledTriggers_('eveningRadar_')[0].hour,21);c.disableDaily();assert.equal(c.scheduledTriggers_('eveningRadar_').length,0);assert.equal(c.scheduledTriggers_('afternoonRadar_').length,0);assert.equal(c.scheduledTriggers_('dailyRadar_').length,0);
});
test('un horario principal de 13:00 Madrid no instala un activador duplicado; la zona configurada se aplica a las tres franjas',()=>{
 const s=server(),c=s.c;c.settings_().dailyHour=13;c.enableDaily();assert.equal(c.scheduledTriggers_('afternoonRadar_').length,0);assert.equal(c.getOperationalSchedule().valid,true);c.settings_().timezone='Europe/Istanbul';c.replaceCollectionSchedule_();assert.equal(c.scheduledTriggers_('afternoonRadar_').length,0);assert.equal(c.scheduledTriggers_('dailyRadar_')[0].timezone,'Europe/Istanbul');
});
test('las tres solicitudes sobreviven hasta el coordinador y cada franja se ejecuta una sola vez al día',()=>{
 const s=server(),c=s.c,calls=[];c.queueScheduledCollection_=kind=>calls.push(kind);c.requestNewsletterDelivery_=()=>{};c.requestDailyPipeline_();c.afternoonRadar_();c.eveningRadar_();assert.ok(s.properties.COLLECTION_EVENING_REQUEST);assert.ok(s.properties.DAILY_PIPELINE_REQUEST);assert.ok(s.properties.COLLECTION_AFTERNOON_REQUEST);c.drainDailyPipeline_();assert.equal(calls.length,3);assert.equal(c.dailyPipelineRequested_(),false);c.requestDailyPipeline_();c.afternoonRadar_();c.drainDailyPipeline_();assert.equal(calls.length,3);
});
test('las 13:00 quedan diferidas durante una escritura y se reanudan sin perder su franja',()=>{
 const s=server(),c=s.c;s.properties['WORK_INTENT:test']=String(Date.now()+60000);c.afternoonRadar_();assert.equal(s.properties['WORK_PENDING:afternoon'],'true');assert.equal(s.properties.COLLECTION_AFTERNOON_REQUEST,undefined);delete s.properties['WORK_INTENT:test'];c.workWake_();assert.ok(s.properties.COLLECTION_AFTERNOON_REQUEST);assert.equal(s.properties['WORK_PENDING:afternoon'],undefined);
});
test('el archivo de logs verifica carpeta y contenido antes de retirar un lote y conserva Adopción',()=>{
 const s=server(),c=s.c,sheet=logs(s);c.append_('Adopcion',Array.from({length:5010},(_,i)=>[String(i),'user@bbva.com','session','acceso','news','0']));assert.equal(c.archiveLogBatch_('Telemetria'),false);assert.equal(sheet.getLastRow()-1,10);assert.equal(sheet.grid[1][4],'100');const [id]=[...s.archiveBooks][0],payload=JSON.parse(c.archivePayload_(id));assert.equal(payload.rows.length,100);assert.equal(s.archiveFiles.get(id).parent,c.configuration_().storage.logFolderId);assert.equal(c.rows_('Adopcion').length,5010);assert.equal(c.archiveLogBatch_('Telemetria'),true);
});
test('permiso denegado y parent incorrecto dejan intactos los logs',()=>{
 for(const failure of ['permission','parent']){const s=server(),c=s.c,sheet=logs(s);if(failure==='permission')c.DriveApp.getFolderById=()=>{throw Error('Sin permiso');};else c.DriveApp.getFileById=()=>({moveTo(){},getParents:()=>({hasNext:()=>false})});assert.throws(()=>c.archiveLogBatch_('Telemetria'),/permiso|carpeta/);assert.equal(sheet.getLastRow()-1,110);}
});
test('un crash entre verificar y borrar reutiliza el mismo documento',()=>{
 const s=server(),c=s.c,sheet=logs(s),remove=sheet.deleteRows;sheet.deleteRows=()=>{throw Error('crash');};assert.throws(()=>c.archiveLogBatch_('Telemetria'),/crash/);assert.equal(sheet.getLastRow()-1,110);assert.equal(s.archiveBooks.size,1);sheet.deleteRows=remove;c.archiveLogBatch_('Telemetria');assert.equal(sheet.getLastRow()-1,10);assert.equal(s.archiveBooks.size,1);
});
test('un crash después de borrar recupera el checkpoint sin retirar otro lote',()=>{
 const s=server(),c=s.c,sheet=logs(s),flush=c.SpreadsheetApp.flush;c.SpreadsheetApp.flush=()=>{if(sheet.getLastRow()-1===10)throw Error('lost response');};assert.throws(()=>c.archiveLogBatch_('Telemetria'),/lost response/);assert.equal(sheet.getLastRow()-1,10);c.SpreadsheetApp.flush=flush;c.archiveLogBatch_('Telemetria');assert.equal(sheet.getLastRow()-1,10);assert.equal(s.properties['ARCHIVE_SHEET:Telemetria'],undefined);
});
test('un documento corrupto impide retirar filas y las filas de más de veinte días se archivan aunque sean menos de diez',()=>{
 const s=server(),c=s.c,sheet=logs(s,3);sheet.grid.slice(1).forEach(row=>row[0]='2000-01-01T00:00:00Z');const read=c.archivePayload_;c.archivePayload_=()=> 'corrupt';assert.throws(()=>c.archiveLogBatch_('Telemetria'),/no verificado/);assert.equal(sheet.getLastRow()-1,3);c.archivePayload_=read;c.archiveLogBatch_('Telemetria');assert.equal(sheet.getLastRow()-1,0);
});
test('el catálogo de almacenamiento valida números, IDs y carpetas antes de guardar',()=>{
 const s=server(),c=s.c,snapshot=JSON.parse(JSON.stringify(c.getConfiguration()));snapshot.config.storage.logRows=0;assert.throws(()=>c.saveConfiguration(snapshot),/almacenamiento/);snapshot.config.storage.logRows=10;snapshot.config.storage.logFolderId='new-folder-123';c.DriveApp.getFolderById=()=>{throw Error('Sin permiso');};assert.throws(()=>c.saveConfiguration(snapshot),/permiso/);assert.notEqual(c.configuration_().storage.logFolderId,'new-folder-123');
});
test('las ediciones antiguas se leen desde un archivo verificado sin perder contenido ni permitir acceso ajeno',()=>{
 const s=server(),c=s.c,editionKeys=vm.runInContext('RADAR.sheets.NewsletterEdiciones',c),sendKeys=vm.runInContext('RADAR.sheets.NewsletterEnvios',c);
 for(let i=0;i<5;i++){
  const id='edition-'+i,delivery='delivery-'+i,article={id:'article-'+i,fecha:'2026-09-10',pais:'España',entidad:'BBVA',titular:'Pagos empresariales '+i,extracto:'Producto para empresas',url:'https://example.test/'+i,segmentos:[],senales:[],taxonomia:[]},packed=c.packNews_(article);
  s.sheets.get('NewsletterContenido').grid.push([id,JSON.stringify(packed)]);
  const metadata={id,envio:delivery,correo:'owner@bbva.com',nombre:'Edición '+i,filtros:'{}',idioma:'es',fecha:'2026-09-1'+i,inicio:i+2,cantidad:1,estado:'Enviada',traducciones:'{}',editorial:JSON.stringify({scope:c.configuration_().applicationScope,cards:[]})};s.sheets.get('NewsletterEdiciones').grid.push(editionKeys.map(key=>String(metadata[key]??'')));
  const send={id:delivery,suscripcion:'sub',correo:'owner@bbva.com',estado:'Enviada',fecha:metadata.fecha,detalle:'1 noticias incluidas',contenido:'[]'};s.sheets.get('NewsletterEnvios').grid.push(sendKeys.map(key=>send[key]??''));
 }
 const before=c.newsletterEdition_('edition-0','owner@bbva.com');assert.equal(c.getMyNewsletterHistory().total,3);assert.equal(c.archiveNewsletterBatch_(),false);assert.equal(s.sheets.get('NewsletterContenido').grid[1][1],'');const after=c.newsletterEdition_('edition-0','owner@bbva.com');assert.equal(after.items[0].titular,before.items[0].titular);assert.equal(c.getNewsletterSummary('edition-0').topics[0],before.items[0].titular);assert.equal(c.rows_('NewsletterEnvios').length,5);assert.ok([...s.archiveFiles.values()].some(file=>file.parent===c.configuration_().storage.newsletterFolderId));assert.throws(()=>c.newsletterEdition_('edition-0','other@bbva.com'),/no disponible/);
});
test('las generaciones activas y pestañas desconocidas se conservan incluso con backup, y sin backup no se retira ninguna',()=>{
 const s=server(),c=s.c;for(const name of ['Noticias_tax_active','Noticias_tax_pending','Noticias_tax_old','personal'])s.book.insertSheet(name).grid.push(['id']);s.properties.DATA_GENERATION=JSON.stringify({newsSheet:'Noticias_tax_active'});vm.runInContext('dataGenerationMemory_=undefined',c);s.properties.TAXONOMY_JOB=JSON.stringify({state:'Pendiente',generation:{newsSheet:'Noticias_tax_pending'}});assert.equal(c.pruneNewsGenerations_().length,0);const removed=c.pruneNewsGenerations_(true);assert.deepEqual(Array.from(removed),['Noticias_tax_old']);assert.ok(s.sheets.has('personal'));assert.ok(s.sheets.has('Noticias_tax_active'));assert.ok(s.sheets.has('Noticias_tax_pending'));
});

test('una recopilación activa conserva la solicitud adicional hasta poder iniciar otro ciclo',()=>{
 const s=server(),c=s.c;let active=true,queued=0;c.dailyCollectionPending_=()=>active;c.queueScheduledCollection_=()=>queued++;c.requestNewsletterDelivery_=()=>{};c.afternoonRadar_();c.drainDailyPipeline_();assert.equal(queued,0);assert.ok(s.properties.COLLECTION_AFTERNOON_REQUEST);assert.equal(s.properties.COLLECTION_AFTERNOON_DAY,undefined);active=false;c.drainDailyPipeline_();assert.equal(queued,1);assert.equal(s.properties.COLLECTION_AFTERNOON_REQUEST,undefined);
});
test('auditoría incremental verifica cabeceras y bloquea IDs ambiguos sin modificar noticias',()=>{
 const s=server(),c=s.c,job={};let done=false;for(let i=0;i<20&&!done;i++)done=c.auditMaintenanceIntegrity_(job);assert.equal(done,true);assert.ok(job.integrityTable>=20);const news=s.sheets.get('Noticias');Array.prototype.push.call(news.grid,['same','2026-10-10'],['same','2026-10-11']);const before=JSON.stringify(news.grid);assert.throws(()=>{const next={};for(let i=0;i<20;i++)c.auditMaintenanceIntegrity_(next);},/IDs/);assert.equal(JSON.stringify(news.grid),before);
});

test('los errores de archivo tienen tres reintentos y reanudación administrativa explícita',()=>{
 const s=server(),c=s.c;logs(s);s.properties.LOG_ARCHIVE_PENDING='true';c.DriveApp.getFolderById=()=>{throw Error('Sin permiso');};for(let i=0;i<3;i++)c.operationalArchiveBatch_();assert.equal(c.logArchiveReadyAt_(),Infinity);assert.equal(c.getOperationalSchedule().archive.attempts,3);assert.match(c.getOperationalSchedule().archive.error,/permiso/);c.resumeOperationalArchive();assert.equal(s.properties.LOG_ARCHIVE_ATTEMPTS,undefined);assert.ok(Number.isFinite(c.logArchiveReadyAt_()));
});

test('Administración edita la conservación sin duplicar el ID primario y acerca el alta a la lista',async t=>{
 const a=await app(t,{configure({replies}){replies.getConfiguration.storagePrimaryId='primary-book';}});await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');await a.change('#catalog-category','storage');assert.match(a.find('#catalog-help').textContent,/primary-book/);await a.change('#catalog-category','retention');assert.equal(a.find('#catalog-fields [data-key="logRows"]').value,'10');await a.change('#catalog-fields [data-key="logRows"]','8');await a.submit('#catalog-form');const saved=a.calls.find(row=>row.method==='saveConfiguration').query.config;assert.equal(saved.storage.logRows,8);assert.equal(saved.storage.primaryId,undefined);assert.equal(a.find('#catalog-add').hidden,true);await a.click('[data-admin-view="subscribers"]');await a.click('#new-admin-subscription');assert.equal(a.find('#admin-subscription-editor').hidden,false);assert.ok(a.find('#admin-subscription-editor').compareDocumentPosition(a.find('#admin-subscriptions-list'))&a.w.Node.DOCUMENT_POSITION_FOLLOWING);
});

test('las dos franjas adicionales esperan por separado y se ejecutan sin perder solicitudes',()=>{
 const s=server(),c=s.c;let active=true;const calls=[];c.dailyCollectionPending_=()=>active;c.queueScheduledCollection_=()=>{calls.push(1);active=true;};c.requestNewsletterDelivery_=()=>{};
 c.afternoonRadar_();c.eveningRadar_();c.drainDailyPipeline_();assert.equal(calls.length,0);active=false;c.drainDailyPipeline_();assert.equal(calls.length,1);assert.ok(s.properties.COLLECTION_EVENING_REQUEST);active=false;c.drainDailyPipeline_();assert.equal(calls.length,2);assert.equal(c.dailyPipelineRequested_(),false);
});
test('cancelar la anual conserva noticias y registros y evita reintentar sus errores',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Recargas',c),job={id:'annual',tipo:'annual',estado:'Pendiente',pendientes:2,total:2};
 c.append_('Recargas',[keys.map(key=>job[key]??'')]);c.append_('Recopilacion',[['annual','A','https://example.com/a','Pendiente',0,'',0,0,'','2026-10-23'],['annual','B','https://example.com/b','Error',1,'',0,0,'HTTP 503','2026-10-23']]);
 const news=c.newsSheet_().getLastRow();assert.equal(c.cancelAnnualRecovery_().cancelled,2);assert.equal(c.collectionJobs_()[0].estado,'Cancelada');assert.equal(c.collectionJobs_()[0].pendientes,'0');assert.ok(c.rows_('Recopilacion').every(task=>task.estado==='Omitida'));assert.equal(c.newsSheet_().getLastRow(),news);c.retryCollectionErrors();assert.equal(c.collectionWork_(Date.now()).pending.length,0);assert.throws(()=>c.collectNow('year'),/diaria/);assert.throws(()=>c.resumeCollection('year'),/no válido/);
});
test('Logs conserva detalles largos y usa filtros modales',async t=>{
 const a=await app(t,{configure({replies}){replies.getAdminLogs.items=[{fecha:'2026-10-24',estado:'OK',detalle:'Detalle largo '.repeat(40)}];}});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="audit"]');const detail=a.find('#logs-body .record-detail');assert.equal(detail.open,false);assert.ok(detail.textContent.includes('Detalle largo'));await a.click('#logs-open-filters');assert.equal(a.find('#logs-dialog').open,true);await a.click('#logs-close-filters');assert.equal(a.find('#logs-dialog').open,false);
});
test('reintentar fuentes no reactiva recuperaciones anuales históricas parciales',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Recargas',c);
 for(const [id,tipo] of [['old','annual'],['today','daily']]){const job={id,tipo,estado:'Parcial',pendientes:0,total:1,fallidas:1};c.append_('Recargas',[keys.map(key=>job[key]??'')]);c.append_('Recopilacion',[[id,'Fuente','https://example.com/'+id,'Error',1,'',0,0,'HTTP 503','2026-10-23']]);}
 c.retryCollectionErrors();assert.equal(c.rows_('Recopilacion')[0].estado,'Error');assert.equal(c.rows_('Recopilacion')[1].estado,'Pendiente');c.cancelAnnualRecovery_();assert.equal(c.collectionJobs_().find(job=>job.id==='old').estado,'Cancelada');assert.equal(c.rows_('Recopilacion')[0].estado,'Omitida');assert.equal(c.rows_('Recopilacion')[1].estado,'Pendiente');
});
test('la telemetría acepta todas las pestañas del catálogo central y rechaza las administrativas al lector',()=>{
 const s=server(),c=s.c,navigation=vm.runInContext('APPLICATION_NAVIGATION',c),admin=Object.keys(navigation.adminViews),event=view=>({session:'telemetry-admin-session-123',event:'vista',view,duration:0});
 assert.equal(c.recordEvents(admin.map(event)).saved,true);assert.deepEqual([...c.rows_('Adopcion')].map(row=>row.vista).sort(),admin.sort());s.setEmail('reader@bbva.com');for(const view of admin)assert.throws(()=>c.recordEvents([event(view)]),/Vista restringida/);assert.throws(()=>c.recordEvents([event('unknown-view')]),/Evento no válido/);
});
