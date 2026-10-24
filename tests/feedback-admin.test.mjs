import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
function fixture(){
 const s=storage(),c=s.c;c.initializeConfiguration();
 for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 function add(name,row){const keys=vm.runInContext('RADAR.sheets.'+name,c);s.sheets.get(name).grid.push(keys.map(key=>row[key]??''));}
 add('NewsletterEdiciones',{id:'edition-a',nombre:'Balance empresas',filtros:JSON.stringify({view:'news',country:'México'}),fecha:'2026-10-01',idioma:'es',estado:'Enviada'});
 for(let i=0;i<35;i++)add('NewsletterFeedback',{id:'f'+i,edicion:'edition-a',correo:i%2?'one@bbva.com':'two@bbva.com',valoracion:i%2?'positive':'negative',comentario:i===0?'=SUM(1,2)':'Comentario, "útil"',fecha:'2026-10-10T12:00:00Z',estado:i%2?'atendido':'pendiente'});
 for(const evento of ['acceso','lectura','exportacion'])add('NewsletterEventos',{id:evento,edicion:'edition-a',correo:'one@bbva.com',evento,fecha:'2026-10-10T12:00:00Z'});
 return s;
}
test('feedback administrativo filtra antes de paginar, enriquece cabeceras y conserva KPIs de la selección',()=>{
 const s=fixture(),c=s.c;c.newsRows_=()=>{throw Error('No debe leer noticias');};
 const all=c.getAdminFeedback();assert.equal(all.total,35);assert.ok(all.items.length<35);assert.equal(all.filtered.positive,17);assert.equal(all.filtered.pending,18);
 const selected=c.getAdminFeedback({valoracion:'positive',correo:'one@bbva.com',from:'2026-10-10',to:'2026-10-10',search:'Balance'});
 assert.equal(selected.total,17);assert.equal(selected.filtered.positiveRate,100);assert.equal(selected.items[0].pais,'México');assert.equal(selected.items[0].cadencia,'quarterly');assert.equal(selected.items[0].nombre_edicion,'Balance empresas');assert.equal(selected.global,undefined);assert.equal(selected.interactions,undefined);assert.equal(c.getAdminLogs('interactions',{correo:'one@bbva.com'}).items[0].lecturas,1);
 assert.equal(c.getAdminFeedback({from:'2026-10-11'}).total,0);assert.throws(()=>c.getAdminFeedback({from:'2026-10-12',to:'2026-10-10'}),/anterior/);
});
test('CSV exporta todas las filas filtradas con BOM, comillas, orden y protección de fórmulas; acceso solo administrador',()=>{
 const s=fixture(),c=s.c,result=c.exportNewsletterFeedback({page:100});assert.equal(result.count,35);assert.equal(result.csv.charCodeAt(0),0xfeff);assert.ok(result.csv.startsWith('\ufeff"fecha","correo","edicion","nombre_edicion","cadencia","pais","idioma","valoracion","comentario","estado"'));assert.ok(result.csv.includes('Comentario, ""útil""'));assert.ok(!result.csv.includes('"=SUM'));assert.equal(c.exportNewsletterFeedback({estado:'atendido'}).count,17);
 s.setEmail('reader@bbva.com');assert.throws(()=>c.getAdminFeedback(),/no autorizado/);assert.throws(()=>c.exportNewsletterFeedback(),/no autorizado/);assert.throws(()=>c.recordEvents([{event:'vista',view:'feedback',session:'1234567890123456'}]),/restringida/);
});
test('pestaña Feedback sigue a Adopción y permite filtrar, atender y exportar sin duplicar la tabla',async t=>{
 const kpis={total:1,positive:1,negative:0,positiveRate:100,pending:1,resolved:0};
 const a=await app(t,{configure({replies}){replies.getAdminFeedback={items:[{id:'f1',fecha:'2026-10-10',correo:'one@bbva.com',edicion:'edition',nombre_edicion:'Balance',fecha_envio:'2026-10-01',pais:'México',idioma:'es',cadencia:'quarterly',valoracion:'positive',comentario:'Útil',estado:'pendiente'}],total:1,page:0,pageSize:30,global:kpis,filtered:kpis,options:{estado:['pendiente','atendido'],edicion:['edition'],correo:['one@bbva.com']},interactions:[{edicion:'edition',accesses:2,reads:1,exports:0}]};replies.setNewsletterFeedbackState={saved:true};replies.exportNewsletterFeedback={csv:'\ufefftest',count:1};}});
 const tabs=[...a.w.document.querySelectorAll('[data-admin-view]')].map(el=>el.dataset.adminView);assert.equal(tabs[tabs.indexOf('adoption')+1],'feedback');assert.equal(a.w.document.querySelector('#newsletter-feedback-body'),null);
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="feedback"]');assert.ok(a.find('#feedback-body').textContent.includes('Balance'));
 await a.change('#feedback-estado','atendido');assert.equal(a.calls.filter(row=>row.method==='getAdminFeedback').at(-1).query.estado,'atendido');
 await a.change('#feedback-body select','atendido');assert.deepEqual(clean(a.calls.find(row=>row.method==='setNewsletterFeedbackState').query),{id:'f1',state:'atendido'});
 await a.click('#feedback-export');assert.equal(a.calls.find(row=>row.method==='exportNewsletterFeedback').query.estado,'atendido');
});
test('Noticias y Novedades no tienen chips fijos de incidencia',async t=>{
 const a=await app(t);assert.equal(a.w.document.querySelectorAll('[data-outage-view]').length,0);await a.click('[data-view="news"]');assert.equal(a.find('#filters').elements.signal.value,'');assert.equal(a.w.document.querySelectorAll('#active-filters [data-remove-filter="signal"]').length,0);
});
test('feedback registra duración medida de consultas y CSV y conserva errores sin registrar accesos rechazados',()=>{
 const s=fixture(),c=s.c,events=[];let now=1000;c.Date=class extends Date{static now(){return now;}};
 c.telemetry_=(...args)=>events.push(args);const rows=c.adminFeedbackRows_;c.adminFeedbackRows_=()=>{now+=37;return rows();};
 c.getAdminFeedback();c.exportNewsletterFeedback();assert.deepEqual(clean(events.map(event=>event.slice(0,3))),[['feedback_admin',37,'OK'],['feedback_export',37,'OK']]);
 c.adminFeedbackRows_=()=>{now+=19;throw Error('Lectura interrumpida');};assert.throws(()=>c.getAdminFeedback(),/Lectura interrumpida/);assert.throws(()=>c.exportNewsletterFeedback(),/Lectura interrumpida/);assert.deepEqual(clean(events.slice(2)),[['feedback_admin',19,'Error','Lectura interrumpida'],['feedback_export',19,'Error','Lectura interrumpida']]);
 s.setEmail('reader@bbva.com');assert.throws(()=>c.getAdminFeedback(),/no autorizado/);assert.throws(()=>c.exportNewsletterFeedback(),/no autorizado/);assert.equal(events.length,4);
});
