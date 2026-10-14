import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
const order=['runs','subscribers','adoption','telemetry','taxonomy','language','sources','audit','configuration'];
test('la entrada abre Novedades y Administración abre Ejecuciones y el menú centralizado sitúa Suscripciones en segundo lugar',async t=>{
 const a=await app(t,{entry:''});assert.equal(a.find('#briefing-section').hidden,false);await a.click('[data-view="administration"]');
 assert.deepEqual([...a.find('#admin-tabs').children].map(button=>button.dataset.adminView),order);
 assert.equal(a.find('#runs-section').hidden,false);
 assert.equal(a.find('#admin-tab-runs').getAttribute('aria-selected'),'true');
 assert.equal(a.find('#admin-tabs').parentElement.id,'administration-tools');
 assert.equal(a.find('#administration-tools').previousElementSibling.classList.contains('admin-heading'),true);
 assert.equal(a.calls.filter(row=>row.method==='getBootstrap').length,0);
 assert.equal(a.calls.filter(row=>row.method==='getRuns').length,1);
 assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,1);
 await a.click('#admin-tab-subscribers');assert.equal(a.find('#subscribers-section').hidden,false);
});
test('el menú móvil conserva el orden y se presenta debajo de Administración',async t=>{
 const a=await app(t,{entry:'',configure({w}){w.matchMedia=()=>({matches:true,addEventListener(){}});}});await a.click('[data-view="administration"]');
 assert.deepEqual([...a.find('#admin-tabs').children].map(button=>button.dataset.adminView),order);
 assert.equal(a.find('#admin-tabs').parentElement.id,'mobile-filters');
 assert.equal(a.find('#admin-tabs').getAttribute('aria-orientation'),'vertical');
 assert.equal(a.find('.selection-toolbar').parentElement.id,'administration-tools');
 assert.equal(a.find('.selection-toolbar').hidden,false);
 await a.click('#open-filters');
 a.find('#admin-tab-runs').dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 assert.equal(a.find('#admin-tab-subscribers').getAttribute('aria-selected'),'true');

});
