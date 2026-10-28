import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';

const timeout='Se ha agotado el tiempo de espera del servicio Hojas de cálculo mientras se intentaba acceder al documento con ID book.';

test('recupera automáticamente un mantenimiento en Revisar tras un timeout de Sheets',()=>{
 const {c}=storage();c.initializeConfiguration();c.maintenance_();const job=c.maintenanceJob_();Object.assign(job,{state:'Revisar',phase:'news',next:37,reviewed:35,attempts:3,error:timeout,pausedUntil:0});c.saveMaintenanceJob_(job);
 assert.ok(Number.isFinite(c.maintenanceReadyAt_()));c.maintenanceBatch_();const resumed=c.maintenanceJob_();assert.ok(resumed.next>=37);assert.notEqual(resumed.state,'Revisar');assert.equal(resumed.attempts,0);
});

test('los timeouts repetidos conservan cursor y usan pausa acotada; otros errores requieren revisión',()=>{
 const {c}=storage();c.initializeConfiguration();c.maintenance_();c.compactCollectionTasks_=()=>{throw Error(timeout);};
 for(let attempt=1;attempt<=4;attempt++){c.maintenanceBatch_();const job=c.maintenanceJob_();assert.equal(job.state,'En pausa');assert.equal(job.next,2);assert.equal(job.attempts,attempt);assert.ok(job.pausedUntil>Date.now());job.pausedUntil=0;c.saveMaintenanceJob_(job);}
 assert.equal(c.maintenanceRetryDelay_(100),1800000);
 c.compactCollectionTasks_=()=>{throw Error('Cabecera no válida: Noticias');};for(let attempt=0;attempt<3;attempt++)c.maintenanceBatch_();assert.equal(c.maintenanceJob_().state,'Revisar');assert.equal(c.maintenanceReadyAt_(),Infinity);
});

test('el reinicio manual de un timeout conserva la fase y el avance',()=>{
 const {c}=storage();c.initializeConfiguration();c.maintenance_();const job=c.maintenanceJob_();Object.assign(job,{state:'Revisar',phase:'candidates',candidateNext:809,reviewed:80,attempts:3,error:timeout});c.saveMaintenanceJob_(job);
 assert.match(c.startMaintenance(),/reanudado/);const resumed=c.maintenanceJob_();assert.equal(resumed.phase,'candidates');assert.equal(resumed.candidateNext,809);assert.equal(resumed.reviewed,80);assert.equal(resumed.state,'Pendiente');assert.equal(resumed.attempts,0);assert.equal(resumed.pausedUntil,0);
});

test('el archivo de newsletters recorre ediciones en lotes y persiste el cursor',()=>{
 const {c,sheets,properties}=storage();c.initializeConfiguration();const sheet=sheets.get('NewsletterEdiciones');for(let i=0;i<25;i++)sheet.grid.push(['edition-'+i]);
 assert.equal(c.archiveNewsletterBatch_(),false);assert.equal(JSON.parse(properties.NEWSLETTER_ARCHIVE_CURSOR).next,10);
 assert.equal(c.archiveNewsletterBatch_(),false);assert.equal(JSON.parse(properties.NEWSLETTER_ARCHIVE_CURSOR).next,18);
 assert.equal(c.archiveNewsletterBatch_(),false);assert.equal(JSON.parse(properties.NEWSLETTER_ARCHIVE_CURSOR).next,26);
 assert.equal(c.archiveNewsletterBatch_(),true);assert.equal(properties.NEWSLETTER_ARCHIVE_CURSOR,undefined);
});

test('el archivado de logs cede un turno al mantenimiento cuando ambos comparten prioridad',()=>{
 const {c,properties:p}=storage();c.initializeConfiguration();
 c.classificationReadyAt_=()=>Infinity;c.classificationPending_=()=>false;c.snapshotPublicationPending_=()=>false;
 c.newsletterReadyAt_=()=>Infinity;c.translationReadyAt_=()=>Infinity;c.catalogSyncReadyAt_=()=>Infinity;
 c.taxonomyReadyAt_=()=>Infinity;c.taxonomyTranslationReadyAt_=()=>Infinity;c.logArchiveReadyAt_=()=>0;c.maintenanceReadyAt_=()=>0;
 const work={jobs:[],pending:[]};assert.equal(c.backgroundTask_(work,false),'archive');
 p.BACKGROUND_LAST='archive';assert.equal(c.backgroundTask_(work,false),'maintenance');
 p.BACKGROUND_LAST='maintenance';assert.equal(c.backgroundTask_(work,false),'archive');
 c.logArchiveReadyAt_=()=>Infinity;assert.equal(c.backgroundTask_(work,false),'maintenance');
});
