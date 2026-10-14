import test from 'node:test';
import assert from 'node:assert/strict';
import {nextDailyReset,progressState} from '../src/shared/progress-state.js';
import {storage} from './helpers/server.mjs';
test('el reinicio diario es estable y respeta los cambios de hora de Madrid',()=>{
 for(const [now,expected] of [['2026-03-28T12:00:00Z','2026-03-28T23:00:00Z'],['2026-03-29T12:00:00Z','2026-03-29T22:00:00Z'],['2026-10-25T12:00:00Z','2026-10-25T23:00:00Z']])assert.equal(new Date(nextDailyReset(Date.parse(now),'Europe/Madrid')).toISOString(),expected.replace('Z','.000Z'));
 assert.equal(nextDailyReset(Date.parse('2026-10-14T12:00:00Z'),'UTC'),Date.parse('2026-10-15T00:00:00Z'));
});
test('los estados distinguen cuota, error temporal, ejecución y prioridad sin reinicios en tareas terminadas',()=>{
 const now=1000,base={state:'Pendiente',lastExecutedAt:'2026-10-14T08:00:00Z',nextAt:2000};
 assert.equal(progressState({...base,quotaUntil:3000,waitingFor:'Clasificación de noticias'},now).state,'Detenido por falta de cuota');assert.equal(progressState({...base,quotaUntil:3000},now).restartAt,3000);
 assert.equal(progressState({...base,pausedUntil:2500,error:'HTTP 503'},now).pauseReason,'HTTP 503');assert.equal(progressState({...base,running:true,waitingFor:'Otra tarea'},now).waitingFor,'');assert.equal(progressState({...base,waitingFor:'Clasificación de noticias'},now).state,'En espera de otro trabajo');assert.equal(progressState({...base,state:'Completada',quotaUntil:3000},now).restartAt,0);
});
test('la traducción y los envíos identifican la clasificación pendiente y su fecha de espera',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();const until=Date.now()+600000;c.writeClassificationJob_({...c.classificationJob_(),state:'En pausa',pausedUntil:until});c.writeTranslationJob_({state:'Pendiente',calls:0,callDay:c.recordDay(new Date(),c.settings_().timezone)});
 let state=c.getTranslationStatus().job.progress;assert.equal(state.waitingFor,'Clasificación de noticias');assert.ok(state.restartAt>=until);assert.equal(state.state,'En espera de otro trabajo');
 c.writeTranslationJob_({state:'En pausa',calls:3000,callDay:c.recordDay(new Date(),c.settings_().timezone)});state=c.getTranslationStatus().job.progress;assert.equal(state.state,'Detenido por falta de cuota');assert.equal(state.pauseReason,'Cuota agotada');assert.equal(state.restartAt,c.nextDailyReset(Date.now(),c.settings_().timezone));
});
test('recopilación diaria y anual muestran la pausa global por cuota y no pierden sus contadores',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();s.properties.FETCH_PAUSED_UNTIL=String(Date.now()+3600000);
 const job={id:'annual',tipo:'annual',inicio:'2026-10-14',estado:'Pendiente',total:10,procesadas:3,pendientes:7,actualizada:'2026-10-14T08:00:00Z'};
 const status=c.collectionStatus_(null,[job]);assert.equal(status.jobs[0].progress.state,'Detenido por falta de cuota');assert.equal(status.jobs[0].progress.restartAt,Number(s.properties.FETCH_PAUSED_UNTIL));assert.equal(status.jobs[0].progress.lastExecutedAt,job.actualizada);assert.equal(status.processed,3);assert.equal(status.pending,7);
});
