import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {read,readClientScript,renderIncludes} from '../scripts/source.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function app(t){
 const dom=new JSDOM(renderIncludes(read('dist/Index.html')),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window,calls=[];
 t.after(()=>w.close());w.__coverage__=globalThis.__coverage__||{};w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.ResizeObserver=class{observe(){}};
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 const config=JSON.parse(read('assets/configuration-defaults.json')),row={id:'a',correo:'owner@bbva.com',nombre:'Mi canal',periodicidad:'weekly',activa:true,filtros:{entity:'BBVA'},query:{entity:'BBVA'},nextDelivery:'2026-10-12',ultimaEntrega:{estado:'Enviada',desde:'2026-10-01',hasta:'2026-10-07'}};
 const emptyPage={items:[],options:{},total:0,page:0,pageSize:30,limit:20000},data={items:[],page:0,pageSize:30,total:0,countries:['España'],entities:['BBVA'],sources:['Editor'],topics:['Financiación'],segments:['Empresas e instituciones'],signals:['Lanzamiento de producto'],stats:{},radar:{summary:{},countries:[],entities:[],trend:{dates:[],series:[]}},briefing:{total:1,limited:true,bySignal:[{name:'Lanzamiento de producto',total:1}],items:[{titular:'BBVA lanza cuenta',url:'https://example.com',fecha:'2026-10-11',senales:['Lanzamiento de producto'],segmentos:[],pais:'España',entidad:'BBVA',medio:'Editor',tipo:'Banco',tema:'Cuenta'}]},admin:true,sourceCount:1,feeds:[{name:'RSS',url:'https://example.com/rss',country:'España',entity:'BBVA',domain:'example.com',enabled:true}],configuredFeeds:[],maxFeeds:2,daily:false,runs:[{inicio:'2026-10-11',estado:'OK',evaluadas:1,nuevas:1}],collection:{total:1,processed:1,pending:0,failed:0},preferences:{timezone:'Europe/Madrid',unknownCountry:'Global',retentionDays:30,eventLimit:20000}};
 const replies={getDashboard:data,getConfiguration:{config,revision:'test'},saveConfiguration:'Configuración guardada',getSubscriptions:[row,{...row,id:'b',activa:false,filtros:{},ultimaEntrega:null,nextDelivery:''}],getAdminSubscriptions:[row],getNewsletterOptions:{email:'owner@bbva.com',enabled:true,defaults:{name:'Nuevo canal',periodicity:'monthly',filters:{}},catalogs:{entity:['BBVA'],country:['España'],topic:['Financiación']}},saveSubscription:'Suscripción guardada',saveAdminSubscription:'Suscripción guardada',deleteSubscription:'Suscripción eliminada',sendSubscriptionTest:{recipient:'owner@bbva.com',count:1},getNewsletterDeliveryStatus:{address:'group@bbva.com',name:'Radar',available:true,enabled:true,scheduled:true,remaining:10,untracked:1,last:{fecha:'2026-10-11',estado:'Enviada',correo:'owner@bbva.com',detalle:'Gmail ID: a'}},getNewsletterHistory:{...emptyPage,total:1,limited:true,items:[{fecha:'2026-10-11',correo:'owner@bbva.com',estado:'Enviada',noticias:1,detalle:'Gmail ID: a'}]},sendNewsletterTest:{recipient:'owner@bbva.com',sender:'group@bbva.com',messageId:'a',count:0,from:'2026-10-05',to:'2026-10-11'},installNewsletterSchedule:'Instalada',sendPendingNewsletters:{state:'processed',accepted:1,empty:2,duplicates:3,pending:0},getAdoption:{...emptyPage,dau:1,wau:1,mau:1,returning:0,sessions:1,events:1,users:[{correo:'owner@bbva.com',first:'2026-10-10',last:'2026-10-11',sessions:1,actions:1}],daily:[{date:'2026-10-11',users:1,sessions:1}]},getTelemetry:{...emptyPage,rows:[{fecha:'2026-10-11',operacion:'Recopilar',duracion_ms:42,estado:'OK',detalle:'Completa'}],latencyP95:42,clientErrors:0,collection:{processed:1,pending:0}},getAudit:emptyPage,collectNow:{added:1,pending:1,errors:[]},enableDaily:'Activada',disableDaily:'Desactivada',saveFeeds:'Guardadas',saveSourceSettings:'Guardadas',retryCollectionErrors:'Reintento',exportTelemetry:{},recordEvents:{saved:true}};
 w.RADAR_PREVIEW={async call(method,query){calls.push({method,query});const value=replies[method];if(value instanceof Error)throw value;return structuredClone(value);}};
 vm.runInContext(readClientScript(true),dom.getInternalVMContext());await tick();
 const find=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);return el;};
 const click=async selector=>{find(selector).click();await tick();};
 const change=async(selector,value)=>{const el=find(selector);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();};
 const submit=async selector=>{find(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();};
 return {w,find,click,change,submit,calls,replies,data,config};
}
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
