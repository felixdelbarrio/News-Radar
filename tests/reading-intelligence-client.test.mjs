import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
function history(data){data.context={mode:'edition',id:'edition-one',title:'Pagos de febrero',from:'2026-02-01',to:'2026-02-28',count:2};data.selection={from:'2026-02-01',to:'2026-02-28',entity:'BBVA'};}
test('el correo contextualiza Noticias y cambiar a otras vistas conserva filtros independientes',async t=>{
 const a=await app(t,{location:{edition:'edition-one',view:'news'},configure({data}){history(data);}});
 assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,1);assert.equal(a.calls[0].query.edition,'edition-one');assert.equal(a.w.document.querySelector('#reading-context'),null);
 for(const view of ['briefing','radar']){await a.click('[data-view="'+view+'"]');const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.edition,undefined);assert.equal(query.view,view);}
 await a.click('[data-view="news"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,'edition-one');
});
test('editar Noticias refina la edición y restaurar filtros vuelve a actualidad',async t=>{
 const a=await app(t,{location:{edition:'edition-one',view:'news'},configure({data}){history(data);data.countries=['España','México'];}});await a.change('#filters [name="country"]','México');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,'edition-one');
 await a.click('[data-edit-filter="from"]');assert.equal(a.find('#filters-dialog').open,true);await a.click('#restore-filters');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,undefined);
});
test('Más filtros está disponible en Noticias; Novedades no ofrece filtrado y Radar permite geografía, entidad y año',async t=>{
 const a=await app(t);assert.equal(a.find('#open-filters').hidden,true);assert.equal(a.w.document.querySelector('#reading-context'),null);
 await a.click('[data-view="radar"]');assert.equal(a.find('#advanced-filters').hidden,false);assert.equal(a.find('#entity-filter').hidden,false);assert.equal(a.find('#year-filter').hidden,false);for(const name of ['search','type','signal','source'])assert.equal(a.find('#'+name+'-filter').hidden,true);assert.equal(a.find('[name="palanca"]').closest('label').hidden,false);assert.equal(a.find('[name="subpalanca"]').closest('label').hidden,false);
 await a.click('[data-view="news"]');assert.equal(a.find('#advanced-filters').hidden,false);assert.equal(a.find('#entity-filter').hidden,false);assert.equal(a.find('#year-filter').hidden,true);
});
test('la edición no transmite sus filtros avanzados a Novedades ni a Radar',async t=>{
 const a=await app(t,{location:{edition:'edition-one',view:'news'},configure({data}){history(data);data.selection.palanca='Pagos y cobros';data.palanca=['Pagos y cobros'];}});
 for(const view of ['briefing','radar']){await a.click('[data-view="'+view+'"]');const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.edition,undefined);assert.equal(query.palanca,undefined);assert.equal(query.from,undefined);}
});
test('la matriz cambia ejes y medidas sin RPC, muestra porcentajes accesibles y abre evidencia con filtros canónicos y período',async t=>{
 const a=await app(t,{language:'en-US',configure({data}){
  data.selection={from:'2026-02-01',to:'2026-02-28',segment:'Empresas e instituciones'};data.heatmap={nodes:[{id:'parent',level:'palanca',palanca:'Pagos y cobros',subpalanca:'',count:2},{id:'child',level:'subpalanca',palanca:'Pagos y cobros',subpalanca:'Pagos instantáneos',count:2}],entities:[{name:'BBVA',total:4,counts:[[0,2],[1,2]]}],countries:[{name:'España',total:4,counts:[[0,2],[1,2]]}],total:4,tagged:2};data.palanca=['Pagos y cobros'];data.subpalanca=['Pagos y cobros › Pagos instantáneos'];
 }});
 await a.click('[data-view="radar"]');const before=a.calls.filter(row=>row.method==='getDashboard').length;assert.equal(a.w.document.querySelectorAll('#heatmap-table .heat-cell').length,1);assert.match(a.find('#heatmap-summary').textContent,/2\/4/);assert.match(a.find('#heatmap-table button').getAttribute('aria-label'),/50/);
 await a.change('#heatmap-axis','countries');await a.change('#heatmap-level','subpalanca');await a.change('#heatmap-measure','share');assert.equal(a.find('#heatmap-table button>span:last-child').textContent,'50 %');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,before);
 await a.click('#heatmap-table button');const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.view,'news');assert.equal(query.country,'España');assert.equal(query.palanca,'Pagos y cobros');assert.equal(query.subpalanca,'Pagos y cobros › Pagos instantáneos');assert.equal(query.from,'2026-02-01');assert.equal(query.to,'2026-02-28');
});

test('Mi Newsletter no tiene acciones que apliquen filtros a la lectura',async t=>{const a=await app(t);await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('#subscriptions-list [data-action="apply"]'),null);assert.equal(a.w.document.querySelector('#subscriptions-sidebar'),null);});
