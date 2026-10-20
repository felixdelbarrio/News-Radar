import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';

async function draft(a,name,value){const control=a.find('#filters [name="'+name+'"]');control.value=value;control.dispatchEvent(new a.w.Event('change',{bubbles:true}));await tick();}
const dashboards=a=>a.calls.filter(row=>row.method==='getDashboard');

test('editar criterios conserva resultados y chips hasta Aplicar filtros; restaurar solicita los criterios iniciales',async t=>{
 const a=await app(t,{configure({data}){data.selection={entity:'BBVA',from:'2026-10-07',to:'2026-10-13'};data.entities=['BBVA','Santander'];}});
 await a.click('#open-filters');const before=dashboards(a).length;
 await draft(a,'entity','Santander');assert.equal(dashboards(a).length,before);assert.match(a.find('#active-filters').textContent,/BBVA/);
 a.data.selection.entity='Santander';await a.submit('#filters');assert.equal(dashboards(a).length,before+1);assert.equal(dashboards(a).at(-1).query.entity,'Santander');assert.equal(a.find('#filters-dialog').open,false);
 await a.click('#restore-filters');assert.equal(dashboards(a).at(-1).query.initial,true);assert.equal(dashboards(a).at(-1).query.entity,undefined);
});

test('chips de fecha abren el calendario sin eliminar el período y fechas inválidas no consultan',async t=>{
 const a=await app(t,{configure({data}){data.selection={from:'2026-10-07',to:'2026-10-13'};}});await a.click('[data-view="news"]');const before=dashboards(a).length;
 assert.equal(a.w.document.querySelector('[data-remove-filter="from"]'),null);await a.click('[data-edit-filter="from"]');assert.equal(a.find('#filters-dialog').open,true);assert.equal(a.find('.calendar-dialog').open,true);await a.click('.calendar-dialog [data-calendar-close]');
 await draft(a,'from','2026-10-20');await a.submit('#filters');assert.equal(dashboards(a).length,before);assert.equal(a.find('#filters [name="to"]').validity.customError,true);
});

test('selectores largos buscan sin acentos, puntuación ni mayúsculas y conservan el control original',async t=>{
 const a=await app(t,{configure({data}){data.entities=['BBVA','Crédit-Agricole','Santander','Qonto','Akbank','Wise','ANZ'];}});
 await a.click('#open-filters');const select=a.find('#filters [name="entity"]'),wrapper=select.closest('details');assert.ok(wrapper);wrapper.open=true;await tick();
 const search=wrapper.querySelector('input');search.value='CREDIT agricole';search.dispatchEvent(new a.w.Event('input',{bubbles:true}));await tick();
 assert.deepEqual([...wrapper.querySelectorAll('[role="option"]:not([hidden])')].map(option=>option.textContent),['Crédit-Agricole']);
 select.value='Crédit-Agricole';select.dispatchEvent(new a.w.Event('change',{bubbles:true}));await tick();assert.equal(wrapper.open,false);assert.equal(select.value,'Crédit-Agricole');assert.equal([...select.options].some(option=>option.hidden),false);assert.equal(a.w.document.querySelectorAll('#filters [name="entity"]').length,1);
});

test('cargas simultáneas mantienen contexto de carga hasta finalizar y errores liberan el indicador',async t=>{
 const a=await app(t),pending=[];a.w.RADAR_PREVIEW.call=(method)=>method==='getDashboard'?new Promise((resolve,reject)=>pending.push({resolve,reject})):Promise.resolve({});
 await a.click('[data-view="news"]');await a.click('[data-view="radar"]');assert.equal(a.find('#loading').hidden,false);assert.equal(a.find('.content').getAttribute('aria-busy'),'true');
 pending[0].resolve(a.data);await tick();assert.equal(a.find('#loading').hidden,false);
 pending[1].reject(Error('Carga fallida'));await tick();assert.equal(a.find('#loading').hidden,true);assert.equal(a.find('.content').getAttribute('aria-busy'),'false');assert.match(a.find('#message').textContent,/Carga fallida/);
});
