import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {publicationOrder,noveltyGroups} from '../src/shared/novelty-groups.js';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
function add(c,name,row){const keys=vm.runInContext('RADAR.sheets.'+name,c);c.append_(name,[keys.map(key=>row[key]??'')]);}
test('cada turno solicita clasificación y traducción aunque una instalación tuviera la traducción desactivada',()=>{
 const s=fixture(),c=s.c;s.properties.TRANSLATION_ENABLED='false';c.queueScheduledCollection_=()=>{};c.requestNewsletterDelivery_=()=>{};c.dailyCollectionPending_=()=>false;c.classificationPending_=()=>false;
 for(const slot of ['daily','afternoon','evening']){c.requestDailyPipeline_(slot);c.drainDailyPipeline_();assert.ok(s.properties.CLASSIFICATION_REQUEST);assert.ok(s.properties.DAILY_TRANSLATION_REQUEST);delete s.properties.CLASSIFICATION_REQUEST;c.drainDailyTranslations_({jobs:[]});assert.ok(s.properties.TRANSLATION_REQUEST);assert.equal(s.properties.TRANSLATION_PRIORITY_REQUEST,'true');delete s.properties.TRANSLATION_REQUEST;delete s.properties.TRANSLATION_PRIORITY_REQUEST;}
});
test('Logs filtra antes de paginar y exporta toda la selección con protección CSV',()=>{
 const {c,setEmail}=fixture();for(let i=0;i<25;i++)add(c,'Telemetria',{fecha:'2026-10-24T10:00:00Z',operacion:'dashboard',estado:i%2?'Error':'OK',duracion_ms:i,detalle:i===0?'=SUM(1,2)':'detalle '+i});
 const page=c.getAdminLogs('telemetry',{operacion:'dashboard',estado:'OK',page:1});assert.equal(page.total,13);assert.equal(page.items.length,3);assert.equal(page.pageSize,10);assert.equal(page.metrics.total,13);
 const exported=c.exportAdminLogs('telemetry',{operacion:'dashboard',estado:'OK',page:1});assert.equal(exported.count,13);assert.equal(exported.csv.charCodeAt(0),0xfeff);assert.ok(!exported.csv.includes('"=SUM'));
 assert.throws(()=>c.getAdminLogs('missing'),/válido/);assert.throws(()=>c.getAdminLogs('telemetry',{from:'2026-10-25',to:'2026-10-24'}),/anterior/);setEmail('reader@bbva.com');assert.throws(()=>c.getAdminLogs('telemetry'),/autorizado/);assert.throws(()=>c.exportAdminLogs('telemetry'),/autorizado/);
});
test('Logs agrega actividad, accesos e interacciones después de filtrar y enlaza el archivo enviado',()=>{
 const {c}=fixture();for(const [correo,sesion,evento] of [['a@bbva.com','one','acceso'],['a@bbva.com','one','lectura'],['b@bbva.com','two','acceso']]){add(c,'Adopcion',{fecha:'2026-10-24T10:00:00Z',correo,sesion,evento,vista:'news'});add(c,'NewsletterEventos',{id:correo+evento,fecha:'2026-10-24T10:00:00Z',correo,sesion,evento,edicion:'edition',cadencia:'fortnightly',destino:'news'});}
 assert.equal(c.getAdminLogs('daily',{correo:'a@bbva.com'}).items[0].eventos,2);assert.equal(c.getAdminLogs('daily').items[0].usuarios,2);assert.equal(c.getAdminLogs('accesses').total,2);assert.equal(c.getAdminLogs('interactions',{correo:'a@bbva.com'}).items[0].lecturas,1);
 add(c,'NewsletterEnvios',{id:'delivery',correo:'a@bbva.com',estado:'Enviada',fecha:'2026-10-24',detalle:'Gmail ID: x; 3 noticias incluidas'});add(c,'NewsletterEdiciones',{id:'edition',envio:'delivery',estado:'Enviada'});const row=c.getAdminLogs('newsletters').items[0];assert.equal(row.edition,'edition');assert.equal(row.noticias,3);assert.equal(row.contenido,undefined);
});
test('Novedades aplica fecha de publicación antes del límite y entre entidades, sin mutar el corpus',()=>{
 const {c}=fixture();c.settings_().briefingLimit=2;const rows=[{id:'old',fecha:'2026-10-01',entidad:'BBVA'},{id:'new-b',fecha:'2026-10-23',entidad:'Santander'},{id:'new-a',fecha:'2026-10-23',entidad:'Qonto'},{id:'missing',entidad:'BBVA'}].map(row=>({...row,pais:'España',senales:['Lanzamiento de producto']})),before=JSON.stringify(rows);
 assert.deepEqual(rows.slice().sort(publicationOrder).map(row=>row.id),['new-a','new-b','old','missing']);assert.deepEqual(Array.from(c.briefing_(rows,true).items,row=>row.id),['new-a','new-b']);assert.deepEqual(noveltyGroups(rows)[0].items.map(row=>row.id),['new-a','new-b','old','missing']);assert.equal(JSON.stringify(rows),before);
});
test('la pantalla de Novedades conserva el orden por fecha sin agrupar por entidad',async t=>{
 const rows=[['old','2026-10-01','BBVA'],['latest','2026-10-24','Santander'],['middle','2026-10-20','BBVA']].map(([id,fecha,entidad])=>({id,fecha,entidad,pais:'España',titular:id,url:'https://example.com/'+id,senales:['Lanzamiento de producto'],segmentos:[]}));const a=await app(t,{configure({data}){data.briefing.items=rows;}});assert.deepEqual([...a.w.document.querySelectorAll('#briefing-list h3')].map(row=>row.textContent),['latest','middle','old']);
});
test('los controles y los historiales tienen un único destino y cambiar Logs no duplica el paginador',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');for(const id of ['translation-progress','taxonomy-progress','newsletter-delivery-progress'])assert.ok(a.find('#runs-section').contains(a.find('#'+id)));assert.equal(a.w.document.getElementById('translation-toggle'),null);assert.equal(a.w.document.querySelector('#language-section progress'),null);
 await a.click('[data-admin-view="audit"]');for(const view of ['daily','telemetry','audit','runs'])await a.change('#logs-view',view);const before=a.calls.filter(row=>row.method==='getAdminLogs').length;a.replies.getAdminLogs.total=30;a.replies.getAdminLogs.pageSize=10;await a.click('#logs-clear');await a.click('#logs-pagination [data-page="1"]');assert.equal(a.calls.filter(row=>row.method==='getAdminLogs').length,before+2);
});
