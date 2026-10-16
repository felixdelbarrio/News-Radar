import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readServerScript,read} from '../scripts/source.mjs';
import {recordQuery,filterRecords,recordPage} from '../src/shared/record-filters.js';
test('filtros compartidos combinan búsqueda, valores exactos y fechas de la zona de negocio',()=>{
 const rows=[{fecha:'2026-10-10T22:30:00Z',fuente:'México',resultado:'Error',motivo:'HTTP 302'}, {fecha:'2026-10-11T22:30:00Z',fuente:'México',resultado:'Error',motivo:'HTTP 302'}, {fecha:'2026-10-11T10:00:00Z',fuente:'España',resultado:'OK',motivo:''}];
 const selected=filterRecords(rows,{from:'2026-10-11',to:'2026-10-11',fuente:'México',resultado:'Error',search:'mexico error http'},['fuente','resultado'],['fuente','resultado','motivo'],'fecha','Europe/Madrid');assert.deepEqual(selected,[rows[0]]);
 assert.throws(()=>recordQuery({from:'2026-02-30'}),/Fecha/);assert.throws(()=>recordQuery({from:'2026-10-12',to:'2026-10-11'}),/anterior/);assert.throws(()=>recordQuery({search:'x'.repeat(161)}),/largo/);
 assert.equal(recordPage(rows,{page:99},2).page,1);assert.equal(recordPage(rows,{page:99},2).items.length,1);
});
function server(){const c=vm.createContext({});vm.runInContext(readServerScript('dist',true),c);c.settings_=()=>JSON.parse(read('assets/configuration-defaults.json')).settings;c.authorize_=()=>({admin:true});return c;}
test('Auditoría filtra antes de paginar y encuentra errores anteriores a las últimas 100 entradas',()=>{
 const c=server(),rows=Array.from({length:201},(_,i)=>({fecha:'2026-10-11T10:00:00Z',fuente:i<40?'BBVA':'Santander',resultado:i<40?'Error':'Incluida',motivo:'HTTP 302',ejecucion:'cycle'}));c.rows_=(name,limit)=>{assert.equal(name,'Auditoria');assert.equal(limit,20000);return rows;};
 const first=c.getAudit({fuente:'BBVA',resultado:'Error'}),next=c.getAudit({fuente:'BBVA',resultado:'Error',page:1});assert.equal(first.total,40);assert.equal(first.items.length,30);assert.equal(next.items.length,10);assert.equal(first.options.fuente.length,2);
 c.authorize_=()=>{throw Error('Solo administrador');};assert.throws(()=>c.getAudit({}),/administrador/);
});
test('Adopción recalcula métricas, tabla y días a partir de los mismos eventos filtrados',()=>{
 const c=server(),now=new Date().toISOString();c.rows_=()=>[{fecha:now,correo:'a@bbva.com',sesion:'a',evento:'lectura',vista:'news'}, {fecha:now,correo:'a@bbva.com',sesion:'b',evento:'acceso',vista:'radar'}, {fecha:now,correo:'b@bbva.com',sesion:'c',evento:'lectura',vista:'news'}];
 const result=c.getAdoption({correo:'a@bbva.com',vista:'news',evento:'lectura'});assert.equal(result.events,1);assert.equal(result.sessions,1);assert.equal(result.mau,1);assert.equal(result.users.length,1);assert.equal(result.daily[0].users,1);assert.equal(result.options.correo.length,2);
});
test('el historial de newsletters omite las huellas y filtra por destinatario sin exponer contenido',()=>{
 const c=server();c.rows_=(name,limit,width)=>{if(name==='NewsletterEdiciones')return [];assert.equal(name,'NewsletterEnvios');assert.equal(limit,20000);assert.equal(width,8);return [{fecha:'2026-10-11T10:00:00Z',correo:'a@bbva.com',suscripcion:'a',estado:'Enviada',detalle:'Gmail ID: one; 2 noticias incluidas'}, {fecha:'2026-10-11T10:00:00Z',correo:'b@bbva.com',suscripcion:'b',estado:'Enviada',detalle:'Gmail ID: two'}];};
 const result=c.getNewsletterHistory({correo:'a@bbva.com'});assert.equal(result.total,1);assert.equal(result.items[0].noticias,2);assert.equal(result.items[0].contenido,undefined);
});
