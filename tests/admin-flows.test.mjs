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
test('ejecuciones carga al abrir su pestaña, filtra en el servidor y presenta errores',async t=>{
 const a=await app(t);assert.ok(!a.calls.some(r=>r.method==='getRuns'));assert.ok(!a.find('#sources-section').querySelector('#runs-body'));
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="runs"]');assert.equal(a.find('#runs-section').hidden,false);assert.match(a.find('#runs-body').textContent,/OK/);
 await a.change('#runs-from','2026-10-01');assert.equal(a.calls.filter(r=>r.method==='getRuns').at(-1).query.from,'2026-10-01');
 a.replies.getRuns={items:[],total:0,page:0,pageSize:30,options:{}};await a.click('#runs-clear');assert.match(a.find('#runs-body').textContent,/Sin ejecuciones/);
 a.replies.getRuns=Error('Error de lectura');await a.click('[data-admin-view="runs"]');assert.match(a.find('#message').textContent,/Error de lectura/);
});
test('el seguimiento refresca contenido nuevo, evita llamadas en pestañas ocultas y reintenta errores',async t=>{
 const timers=new Map();let id=100000,hidden=false;
 const a=await app(t,{configure({w,data,replies}){
  const set=w.setTimeout.bind(w),clear=w.clearTimeout.bind(w);w.setTimeout=(fn,ms)=>{if(ms<30000)return set(fn,ms);timers.set(++id,{fn,ms});return id;};w.clearTimeout=key=>{timers.delete(key);clear(key);};
  Object.defineProperty(w.document,'hidden',{get:()=>hidden});data.newsRevision='0';data.collection={total:10,processed:2,pending:8,added:2,lastActivity:'2026-10-11',pausedUntil:String(Date.now()+600000),failed:1};replies.getCollectionProgress={newsRevision:'1',collection:{total:10,processed:3,pending:7,added:3}};
 }});
 const next=async()=>{const [key,timer]=[...timers][0];timers.delete(key);await timer.fn();return timer;};
 assert.match(a.find('#collection-progress').textContent,/2\/10/);assert.match(a.find('#collection-progress').textContent,/1 Errores/);
 hidden=true;await next();assert.ok(!a.calls.some(r=>r.method==='getCollectionProgress'));hidden=false;
 const before=a.calls.filter(r=>r.method==='getDashboard').length;a.data.newsRevision='1';a.data.collection=a.replies.getCollectionProgress.collection;await next();assert.equal(a.calls.filter(r=>r.method==='getDashboard').length,before+1);
 await next();assert.equal(a.calls.filter(r=>r.method==='getDashboard').length,before+1);
 a.replies.getCollectionProgress=Error('Sin conexión');await next();assert.equal([...timers.values()][0].ms,60000);
 a.replies.getCollectionProgress={newsRevision:'1',collection:{total:10,processed:10,pending:0,added:3}};await next();assert.equal(timers.size,0);assert.match(a.find('#collection-progress').textContent,/0 pendientes/);
});

test('volver al Radar muestra los datos actualizados durante administración sin repetir el RPC',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');a.data.radar.summary.news=5;a.data.radar.publishers=[{publisher:'Diario vivo',total:5}];
 await a.click('#collect');const calls=a.calls.filter(r=>r.method==='getDashboard').length;
 await a.click('[data-view="radar"]');assert.match(a.find('#radar-headline').textContent,/5 publicaciones/);assert.match(a.find('#publisher-chart').textContent,/Diario vivo/);assert.equal(a.calls.filter(r=>r.method==='getDashboard').length,calls);
 await a.click('[data-view="administration"]');a.data.collection.pending=5;await a.click('[data-view="news"]');await a.click('[data-view="administration"]');await a.click('#continue-collection');assert.ok(a.calls.some(r=>r.method==='resumeCollection'));
});
test('muestra progreso independiente y porcentajes atendidos para anual, diaria y cargas en cola',async t=>{
 const a=await app(t,{language:'tr-TR',configure({data}){data.collection={total:10,processed:3,pending:7,jobs:[{id:'annual',tipo:'annual',desde:'2025-10-11',hasta:'2026-10-11',estado:'En pausa',total:10,procesadas:3,pendientes:5,omitidas:1,fallidas:1,nuevas:2,actualizada:'2026-10-11',pausa:String(Date.now()+60000)},{id:'daily',tipo:'daily',desde:'2026-10-01',hasta:'2026-10-11',estado:'En cola',total:0,pendientes:0,nuevas:0}]};}});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="runs"]');
 a.replies.getRuns.collection=a.data.collection;await a.click('[data-admin-view="runs"]');assert.equal(a.find('#collection-jobs').children.length,2);assert.match(a.find('#collection-jobs').textContent,/Yıllık kurtarma/);assert.match(a.find('#collection-jobs').textContent,/Günlük toplama/);assert.equal(a.find('#collection-jobs progress').value,5);
});
test('traduce noticias progresivamente, permite consultar el original y reutiliza la traducción al volver',async t=>{
 const timers=new Map();let id=20000;
 const a=await app(t,{language:'en-US',configure({w,data,replies}){
  const set=w.setTimeout.bind(w),clear=w.clearTimeout.bind(w);w.setTimeout=(fn,ms)=>{if(ms!==250&&ms!==10000)return set(fn,ms);timers.set(++id,fn);return id;};w.clearTimeout=key=>{timers.delete(key);clear(key);};Object.defineProperty(w.document,'hidden',{value:false});
  data.items=[{id:'one',titular:'Titular original',extracto:'Extracto original',url:'https://example.com',fecha:'2026-10-11',medio:'Diario'}];
  replies.translateNews={items:[{id:'one',titular:'Translated headline',extracto:'Translated summary',original:{titular:'Titular original',extracto:'Extracto original'},translation:{language:'en',state:'translated'}}],pending:[]};
 }});
 await a.click('[data-view="news"]');assert.match(a.find('#news-list h3').textContent,/Translated headline/);assert.match(a.find('.article-original').textContent,/Titular original/);assert.match(a.find('#news-list').textContent,/Automatic translation/);
 const count=a.calls.filter(call=>call.method==='translateNews').length;await a.click('[data-view="administration"]');await a.click('[data-view="news"]');assert.equal(a.calls.filter(call=>call.method==='translateNews').length,count);
 a.data.briefing.items=[];await a.click('[data-view="briefing"]');await a.click('[data-view="news"]');assert.match(a.find('#news-list h3').textContent,/Translated headline/);assert.equal(a.calls.filter(call=>call.method==='translateNews').length,count);
 a.replies.translateNews=Error('Provider unavailable');a.data.items[0].id='changed';await a.click('[data-view="briefing"]');await a.click('[data-view="news"]');assert.match(a.find('#news-list').textContent,/Translation unavailable/);
});
