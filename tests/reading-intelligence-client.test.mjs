import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
function history(data){data.context={mode:'edition',id:'edition-one',title:'Pagos de febrero',from:'2026-02-01',to:'2026-02-28',count:2};data.selection={from:'2026-02-01',to:'2026-02-28',entity:'BBVA'};}
test('abrir desde el correo no consulta actualidad y mantiene edición y período entre Novedades y Noticias; reset vuelve al presente',async t=>{
 const a=await app(t,{location:{edition:'edition-one'},configure({data}){history(data);}});
 assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,1);assert.equal(a.calls[0].query.edition,'edition-one');assert.equal(a.calls[0].query.initial,true);assert.match(a.find('#reading-detail').textContent,/2026-02-01/);assert.equal(a.w.document.querySelector('#reading-preference'),null);assert.equal(a.find('#from-filter').hidden,false);
 await a.click('[data-view="news"]');let query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.edition,'edition-one');assert.equal(query.from,'2026-02-01');assert.equal(query.to,'2026-02-28');assert.equal(query.view,'news');
 a.data.context={mode:'current'};await a.click('#reading-current');query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.edition,undefined);assert.equal(query.initial,true);assert.equal(query.from||'','');assert.equal(a.find('#reading-current').hidden,true);assert.equal(a.find('#reading-context').hidden,true);
});
test('quitar el período o limpiar los filtros abandona la edición en las dos vistas; los demás filtros refinan las noticias enviadas',async t=>{
 const a=await app(t,{location:{edition:'edition-one'},configure({data}){history(data);data.countries=['España','México'];}});await a.change('#filters [name="country"]','México');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,'edition-one');
 await a.click('[data-edit-filter="from"]');assert.equal(a.find('#filters-dialog').open,true);assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,'edition-one');
 const b=await app(t,{location:{edition:'edition-one'},configure({data}){history(data);}});await b.click('#all-filters');assert.equal(b.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,undefined);await b.click('[data-view="news"]');assert.equal(b.calls.filter(row=>row.method==='getDashboard').at(-1).query.edition,undefined);
});
test('sin selector personal, Más filtros solo aparece en Noticias y las palancas heredadas siguen siendo removibles',async t=>{
 const a=await app(t,{configure({data}){data.selection={palanca:'Pagos y cobros',subpalanca:'Pagos y cobros › Pagos',segment:'Empresas e instituciones',coverage:'digital'};data.palanca=['Pagos y cobros'];data.subpalanca=['Pagos y cobros › Pagos'];}});
 assert.equal(a.w.document.querySelector('#reading-preference'),null);
 for(const view of ['briefing','radar','news']){
  await a.click('[data-view="'+view+'"]');assert.equal(a.find('#reading-context').hidden,true);assert.equal(a.find('#advanced-filters').hidden,false);
  assert.equal(a.find('[data-remove-filter="palanca"]').textContent.includes('Pagos y cobros'),true);
  assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.preference,undefined);
 }
 a.data.selection={segment:'Empresas e instituciones',coverage:'digital',subpalanca:'Pagos y cobros › Pagos'};
 await a.click('[data-remove-filter="palanca"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.palanca,'');
 assert.equal(a.calls.filter(row=>row.method==='saveNewsPreference').length,0);
});
test('los filtros avanzados de una edición se aplican en Novedades y Radar y se pueden quitar sin perder el archivo',async t=>{
 const a=await app(t,{location:{edition:'edition-one'},configure({data}){history(data);data.selection.palanca='Pagos y cobros';data.palanca=['Pagos y cobros'];data.subpalanca=['Pagos y cobros › Pagos'];}});
 for(const view of ['briefing','radar']){
  await a.click('[data-view="'+view+'"]');assert.equal(a.find('#advanced-filters').hidden,false);assert.equal(a.find('#reading-context').hidden,false);
  assert.equal(a.find('[data-remove-filter="palanca"]').textContent.includes('Pagos y cobros'),true);
 }
 delete a.data.selection.palanca;await a.click('[data-remove-filter="palanca"]');const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;
 assert.equal(query.palanca,'');assert.equal(query.edition,'edition-one');assert.equal(query.from,'2026-02-01');assert.equal(query.to,'2026-02-28');
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
