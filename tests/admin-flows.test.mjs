import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
test('suscripciones personales y administrativas guardan, editan, prueban y eliminan sin alterar filtros',async t=>{
 const a=await app(t);await a.click('[data-view="subscriptions"]');assert.match(a.find('#subscriptions-list').textContent,/Mi canal/);
 await a.click('#subscriptions-list [data-action="edit"]');assert.equal(a.find('#personal-editor [name="name"]').value,'Mi canal');
 await a.change('#personal-editor [name="name"]','Mi edición');await a.submit('#personal-editor form');assert.equal(a.calls.find(r=>r.method==='saveSubscription').query.name,'Mi edición');
 await a.click('#subscriptions-list [data-action="test"]');assert.match(a.find('#message').textContent,/aceptado/);
 await a.click('#subscriptions-list [data-action="apply"]');assert.equal(a.find('#page-title').textContent,'Noticias');
 await a.click('[data-view="subscriptions"]');await a.click('#subscriptions-list [data-action="delete"]');assert.ok(a.calls.some(r=>r.method==='deleteSubscription'));
 await a.click('#new-subscription');await a.click('[data-view="administration"]');await a.click('[data-admin-view="subscribers"]');
 await a.click('#new-admin-subscription');await a.submit('#admin-subscription-editor form');assert.ok(a.calls.some(r=>r.method==='saveAdminSubscription'));
 await a.click('#admin-subscriptions-list [data-action="edit"]');await a.click('[data-close-editor]');assert.equal(a.find('#admin-subscription-editor').hidden,true);
 a.replies.getSubscriptions=[];await a.click('[data-view="subscriptions"]');assert.match(a.find('#subscriptions-list').textContent,/No tienes suscripciones/);
});
test('newsletter informa de vacíos, duplicados, cuotas, bloqueos y errores de pruebas',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="subscribers"]');
 assert.match(a.find('#newsletter-content-note').textContent,/1 envíos anteriores/);assert.match(a.find('#delivery-history-body').textContent,/Gmail ID/);
 await a.click('#test-newsletter');assert.match(a.find('#newsletter-test-result').textContent,/Incluye 0 novedades/);
 await a.click('#install-newsletter');assert.match(a.find('#newsletter-test-result').textContent,/Instalada/);
 for(const [state,text] of [['no_due','No hay entregas'],['busy','otro envío'],['limit','límite'],['processed','repetidas omitidas'],['error','Fallo Gmail']]){a.replies.sendPendingNewsletters={state,accepted:1,empty:2,duplicates:3,pending:0,error:state==='error'?'Fallo Gmail':''};await a.click('#send-pending-newsletters');assert.match(a.find('#newsletter-test-result').textContent,new RegExp(text));}
 a.replies.sendNewsletterTest=Error('Alias pendiente');await a.click('#test-newsletter');assert.match(a.find('#newsletter-test-result').textContent,/Alias pendiente/);
 a.replies.getNewsletterDeliveryStatus={...a.replies.getNewsletterDeliveryStatus,available:false,enabled:false,scheduled:false,untracked:0,last:null,error:'Sin alias'};a.replies.getNewsletterHistory={items:[],options:{},total:0,page:0,pageSize:30};await a.click('#validate-newsletter-sender');assert.match(a.find('#newsletter-sender-status').textContent,/Sin alias/);assert.match(a.find('#delivery-history-body').textContent,/Sin envíos/);
});
test('catálogos preservan cambios al cambiar de categoría y permiten ordenar, añadir y guardar',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');
 const first=a.find('#catalog-fields [data-key="name"]');first.value='Entidad editada';
 await a.change('#catalog-category','settings');await a.change('#catalog-fields [data-key="pageSize"]','25');await a.change('#catalog-category','entities');assert.equal(a.find('#catalog-fields [data-key="name"]').value,'Entidad editada');
 await a.click('#catalog-fields [data-move="1"]');await a.click('#catalog-fields .catalog-row:nth-child(2) [data-move="-1"]');await a.click('#catalog-add');assert.ok(a.find('#catalog-fields').textContent.includes('Nueva entrada'));
 await a.click('#catalog-fields .catalog-row:last-child [data-remove]');await a.submit('#catalog-form');const saved=a.calls.find(r=>r.method==='saveConfiguration');assert.equal(saved.query.config.settings.pageSize,25);assert.equal(saved.query.config.entities[0].name,'Entidad editada');
 await a.click('#catalog-reload');assert.ok(a.calls.filter(r=>r.method==='getConfiguration').length>=3);
});
test('fuentes y novedades recorren formularios reales, recuperación y filtros de administración',async t=>{
 const a=await app(t);await a.click('[data-view="briefing"]');assert.match(a.find('#briefing-list').textContent,/BBVA lanza cuenta/);await a.click('[data-signal]');assert.equal(a.calls.filter(r=>r.method==='getDashboard').at(-1).query.signal,'Lanzamiento de producto');
 a.data.briefing={total:0,bySignal:[],items:[]};await a.click('[data-view="news"]');await a.click('[data-view="briefing"]');assert.match(a.find('#briefing-list').textContent,/No hay novedades/);
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="sources"]');await a.click('#add-source');assert.equal(a.find('#source-fields').children.length,2);await a.click('#add-source');assert.match(a.find('#message').textContent,/Máximo/);
 await a.click('#source-fields .source:last-child .remove-source');await a.submit('#sources-form');assert.equal(a.calls.find(r=>r.method==='saveFeeds').query.length,1);
 a.data.daily=true;await a.click('#toggle-daily');assert.ok(a.calls.some(r=>r.method==='enableDaily'));await a.click('#toggle-daily');assert.ok(a.calls.some(r=>r.method==='disableDaily'));
 await a.click('#collect');assert.ok(a.calls.some(r=>r.method==='collectNow'));await a.click('#retry-collection');await a.click('#save-source-settings');
 for(const view of ['adoption','telemetry','audit'])await a.click('[data-admin-view="'+view+'"]');assert.ok(a.calls.some(r=>r.method==='getTelemetry'));assert.match(a.find('#telemetry-body').textContent,/Completa/);
 await a.click('#download-telemetry');assert.match(a.find('#message').textContent,/descargada/);
 a.replies.getTelemetry=Error('Lectura fallida');await a.click('[data-admin-view="telemetry"]');assert.match(a.find('#message').textContent,/Lectura fallida/);
});
