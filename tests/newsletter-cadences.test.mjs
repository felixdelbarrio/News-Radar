import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/delivery.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
const path=(palanca='Pagos',subpalanca='Cobros')=>({palanca,subpalanca});
function news(id,pais='España',entidad='BBVA',taxonomy=[path()]){return {etiquetas:{digital:true,capacidades:['Empresas: Pagos']},clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id,pais,entidad,fecha:'2026-09-12',medio:'Editor',titular:entidad+' presenta servicio digital para empresas '+id,extracto:'Información del servicio para empresas '+id,tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:[],tema:'Financiación',taxonomia:taxonomy,url:'https://example.com/'+id};}
const rows=()=>[news('a'),news('b'),news('c'),news('d','España','BBVA',[path('Seguridad','Identidad')]),news('e','España','BBVA',[path('Seguridad','Identidad')]),news('f','México','Santander'),news('g','México','Santander',[path('Financiación','Crédito')])];
const clean=value=>JSON.parse(JSON.stringify(value));
test('la entrega trimestral consulta el historial semanal del destinatario y destaca la alternativa más relevante',()=>{
 const {c}=server();c.settings_().newsletterEnabled=true;const period=c.newsletterPeriod_('quarterly',new Date());c.queueQuarterlyTaxonomy_=()=>true;const input=['fortnightly','fresh','recent'].map(id=>({...news(id),fecha:period.from}));
 c.newsRelevance_=row=>({fortnightly:100,fresh:90,recent:10}[row.id]);c.annotateNews_=rows=>rows;
 c.subscriptionRows_=()=>[{id:'quarterly',correo:'owner@bbva.com',nombre:'Mes',periodicidad:'quarterly',activa:true,actualizada:'2000-01-01',filtros:{coverage:''}}];
 c.rows_=name=>name==='Noticias'?input:name==='NewsletterEnvios'?[{id:'prior',suscripcion:'fortnightly',correo:'owner@bbva.com',estado:'Enviada',contenido:JSON.stringify(c.newsletterItemKeys_(input[0]))}]:[];
 c.newsletterSender_=()=>({});let sent;c.sendNewsletterMail_=(_sender,_email,content)=>{sent=content;return 'accepted';};
 assert.equal(c.deliverNewsletterBatch_().accepted,1);assert.equal(sent.items[0].id,'fresh');assert.equal(sent.total,3);assert.equal(sent.editorial.cards[0].additionalCount,2);assert.equal(c.newsletterEdition_(sent.editionId,'owner@bbva.com').items.length,3);
});
test('las miradas trimestrales priorizan el país seleccionado y no mutan las evidencias',()=>{
 const {c}=server(),input=rows(),before=JSON.stringify(input),digest=c.newsletterDigest_(input,{view:'news',country:'México'},'es',value=>value);
 assert.equal(digest.cards.length,2);assert.equal(digest.cards[0].country,'México');assert.equal(new Set(digest.cards.map(card=>card.scope+card.category)).size,2);assert.equal(JSON.stringify(input),before);
 for(const card of digest.cards)assert.ok(card.evidenceIds.every(id=>input.some(row=>row.id===id)));
});
test('HTML y texto de las dos cadencias contienen hecho, relevancia, fuentes y accesos históricos útiles',()=>{
 const {c}=server(),input=rows().map(row=>({...row,senales:['Lanzamiento de producto']}));input[0].fecha='2026-01-12';input[1].fecha='2026-04-12';
 for(const view of ['briefing','news'])for(const language of ['es','en','tr']){
  const content=c.newsletterContent_(input,{view,segment:'Empresas e instituciones',from:'2026-01-01',to:'2026-12-31'},'Selección',new Date(),'sub',language,'edition'),dom=new JSDOM(content.html),d=dom.window.document;
  assert.equal(content.count,view==='briefing'?3:1);assert.equal(content.evidence.length,7);assert.equal(d.querySelectorAll('.newsletter-article').length,content.count);assert.equal(d.querySelectorAll('.newsletter-insight').length,content.count);
  for(const card of content.editorial.cards){assert.ok(content.text.includes(card.url));assert.ok(content.text.includes(card.relevance));assert.ok(!card.relevance.includes('{count}'));}
  for(const anchor of d.querySelectorAll('a')){const url=new URL(anchor.href);if(url.searchParams.has('edition'))assert.equal(url.searchParams.get('edition'),'edition');}
  assert.equal(new URL(d.querySelector('.newsletter-cta').href).searchParams.get('view'),view==='briefing'?'news':view);assert.equal(d.querySelector('.newsletter-kpi'),null);dom.window.close();
 }
});
test('los análisis trimestrales incluyen noticias ya enviadas semanalmente y guardan toda la evidencia de sus KPIs',()=>{
 const s=server(),{c}=s;c.settings_().newsletterEnabled=true;const period=c.newsletterPeriod_('quarterly',new Date());c.queueQuarterlyTaxonomy_=()=>true;const input=rows().map(row=>({...row,fecha:period.from}));
 c.subscriptionRows_=()=>[{id:'quarterly',correo:'owner@bbva.com',nombre:'Mes',periodicidad:'quarterly',activa:true,actualizada:'2000-01-01',filtros:{coverage:''}}];c.annotateNews_=rows=>rows;c.rows_=(name)=>name==='Noticias'?input:name==='NewsletterEnvios'?[{id:'fortnightly:fortnightly:'+period.from,suscripcion:'fortnightly',correo:'owner@bbva.com',estado:'Enviada',contenido:JSON.stringify(input.flatMap(c.newsletterItemKeys_))}]:[];
 c.newsletterSender_=()=>({});let sent;c.sendNewsletterMail_=(_sender,_email,content)=>{sent=content;return 'accepted';};assert.equal(c.deliverNewsletterBatch_().accepted,1);assert.equal(sent.total,7);assert.equal(sent.count,1);
 const archived=c.newsletterEdition_(sent.editionId,'owner@bbva.com');assert.equal(archived.items.length,7);assert.equal(archived.query.view,'news');
 const dashboard=c.getDashboard({view:'news',initial:true,edition:sent.editionId,country:'España',entity:'BBVA'});assert.equal(dashboard.total,5);assert.equal(dashboard.context.count,7);assert.equal(dashboard.selection.from,period.from);assert.equal(dashboard.selection.to,period.to);
});
test('Noticias pagina cada geografía manteniendo los totales completos, recupera una pestaña ausente y exporta su selección',()=>{
 const {c}=server();c.settings_().pageSize=2;const input=rows(),first=c.newsDashboard_(input,{},[],'news'),second=c.newsDashboard_(input,{newsGeography:'México',page:10},[],'news');
 assert.equal(first.total,5);assert.equal(first.items.length,2);assert.deepEqual(Array.from(first.newsGeographies,row=>[row.name,row.total]),[['España',5],['México',2]]);assert.equal(second.page,0);assert.equal(second.total,2);assert.ok(second.items.every(row=>row.pais==='México'));
 const page=c.newsDashboard_(input,{newsGeography:'España',page:2},[],'news');assert.equal(page.items.length,1);assert.equal(page.items[0].id,'e');assert.equal(c.newsDashboard_(input,{newsGeography:'México',country:'España'},[],'news').newsGeography,'España');assert.equal(c.newsDashboard_([],{},[],'news').newsGeographies.length,0);
 c.cachedNewsRecords_=()=>input;c.selectNews_=(_rows,query)=>c.selectAnnotatedNews_(input,query);const csv=c.exportNews({view:'news',newsGeography:'México',from:'2026-01-01',to:'2026-12-31'});assert.equal(csv.count,2);assert.doesNotMatch(csv.csv,/España/);
});
test('Noticias cambia pestaña mediante un solo RPC y reinicia la página; el teclado conserva el foco',async t=>{
 const s=server(),input=rows();s.c.settings_().pageSize=2;
 const a=await app(t,{configure({w,data}){const original=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,query)=>{const reply=await original(method,query);return method==='getDashboard'&&query.view==='news'?{...data,...clean(s.c.newsDashboard_(input,query,[],'news')),selection:query}:reply;};}});
 await a.click('[data-view="news"]');assert.equal(a.w.document.querySelectorAll('#news-geographies [role="tab"]').length,2);const before=a.calls.filter(row=>row.method==='getDashboard').length;
 await a.click('#news-geographies [data-geography="México"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,before+1);assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.newsGeography,'México');assert.equal(a.find('#result-count').textContent,'7 publicaciones');assert.equal(a.find('#next').disabled,true);
 a.find('#news-geographies [aria-selected="true"]').dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));assert.equal(a.find('#news-geographies [aria-selected="true"]').dataset.geography,'España');assert.equal(a.w.document.activeElement.id,a.find('#news-geographies [aria-selected="true"]').id);await a.click('#next');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.page,1);
});
test('el formulario de alta no ofrece periodicidad, rango ni asunto',async t=>{const a=await app(t,{configure({replies}){replies.getSubscriptions=[];}});await a.click('[data-view="subscriptions"]');for(const name of ['range','periodicity','subject'])assert.equal(a.w.document.querySelector('#personal-editor [name="'+name+'"]'),null);await a.submit('#personal-editor form');const payload=a.calls.find(r=>r.method==='saveSubscription').query;assert.equal(payload.periodicity,undefined);assert.equal(payload.subject,undefined);});
test('inicializar conserva suscripciones vigentes sin ejecutar migraciones de cadencias',()=>{const s=server(),{c}=s;c.saveSubscription({country:'España'});const before=JSON.stringify(s.sheets.get('Suscripciones').grid);c.initializeConfiguration();assert.equal(c.subscriptionRows_()[0].periodicidad,'all');assert.equal(c.subscriptionRows_()[0].filtros.entity,undefined);assert.equal(JSON.stringify(s.sheets.get('Suscripciones').grid),before);c.initializeConfiguration();assert.equal(JSON.stringify(s.sheets.get('Suscripciones').grid),before);});

for(const [periodicity,view] of [['fortnightly','briefing'],['quarterly','news']])test('el enlace '+periodicity+' abre '+view+' con edición, filtros y período; navegar o volver al presente mantiene el contrato',async t=>{
 const targetView=view==='briefing'?'news':view;const s=server(),{c}=s,input=[news('s','España','BBVA'),news('m','México','Santander')].map(row=>({...row,senales:['Lanzamiento de producto']})),from='2026-09-01',to='2026-09-30',query={view,segment:'Empresas e instituciones',from,to},editionId='edition-'+periodicity;
 const content=c.newsletterContent_(input,query,'Resumen',new Date(),'subscription','es',editionId),dom=new JSDOM(content.html),link=new URL(dom.window.document.querySelector('.newsletter-cta').href),location=Object.fromEntries(link.searchParams);
 assert.equal(location.view,targetView);assert.equal(location.edition,editionId);assert.equal(link.searchParams.getAll('view').length,1);assert.equal(new URL(c.newsletterLinks_('subscription','',view).app).searchParams.get('view'),view);
 c.saveNewsletterEdition_(editionId,'delivery-'+periodicity,'owner@bbva.com','Resumen',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_(editionId,'Enviada');
 const requests=[],a=await app(t,{location,configure({w,data}){const original=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,payload)=>{if(method==='getDashboard'){requests.push(payload);return {...data,...clean(c.getDashboard(payload))};}return original(method,payload);};}});
 assert.equal(a.find('.nav [aria-current="page"]').dataset.view,targetView);assert.equal(a.find('#'+targetView+'-section').hidden,false);assert.equal(requests.length,1);assert.equal(requests[0].view,targetView);assert.equal(requests[0].edition,editionId);assert.equal(requests[0].initial,true);
 assert.equal(a.find('#filters [name="from"]').value,from);assert.equal(a.find('#filters [name="to"]').value,to);assert.equal(a.w.document.querySelector('#filters [name="segment"]'),null);assert.equal(a.w.document.querySelector('#reading-context'),null);
 const alternate=targetView==='news'?'briefing':'news';await a.click('[data-view="'+alternate+'"]');assert.equal(requests.at(-1).edition,undefined);await a.click('[data-view="news"]');await a.click('#restore-filters');assert.equal(requests.at(-1).edition,undefined);
 if(view!=='briefing')for(const more of dom.window.document.querySelectorAll('a.newsletter-cta')){const url=new URL(more.href),params=Object.fromEntries(url.searchParams);assert.equal(params.view,view);assert.equal(params.edition,editionId);const target=c.getDashboard({...params,initial:true});assert.equal(target.selection.from,from);assert.equal(target.selection.to,to);if(params.country)assert.equal(target.selection.country,params.country);assert.equal(target.selection.entity,params.entity??query.entity??undefined);}
 dom.window.close();
});
test('la trimestral mantiene las referencias dentro de la evidencia y no afirma cambios estructurales',()=>{
 const {c}=server(),input=rows(),digest=c.newsletterDigest_(input,{view:'news'},'es',v=>v);assert.equal(digest.cards.length,1);for(const card of digest.cards){assert.ok(card.evidenceIds.every(id=>input.some(row=>row.id===id)));assert.doesNotMatch(card.relevance,/cambio estructural|trimestres/);}
});
test('los títulos, hechos y relevancia respetan sus límites editoriales y una selección vacía no se rellena',()=>{
 const {c}=server(),digest=c.newsletterDigest_(rows(),{view:'news'},'es',v=>v),limits=vm.runInContext('NEWSLETTER_EDITORIAL',c);for(const card of digest.cards)for(const [key,limit] of [['title',limits.titleWords],['fact',limits.factWords],['relevance',limits.relevanceWords]])assert.ok(card[key].split(/\s+/).length<=limit);
 assert.equal(c.newsletterDigest_([],{view:'news'},'es',v=>v).cards.length,0);
});
