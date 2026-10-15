import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
const path=(palanca='Pagos',subpalanca='Cobros')=>({palanca,subpalanca});
function news(id,pais='España',entidad='BBVA',taxonomy=[path()]){return {id,pais,entidad,fecha:'2026-09-12',medio:'Editor',titular:entidad+' presenta servicio '+id,extracto:'Información del servicio '+id,tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:[],tema:'Financiación',taxonomia:taxonomy,url:'https://example.com/'+id};}
const rows=()=>[news('a'),news('b'),news('c'),news('d','España','BBVA',[path('Seguridad','Identidad')]),news('e','España','BBVA',[path('Seguridad','Identidad')]),news('f','México','Santander'),news('g','México','Santander',[path('Financiación','Crédito')])];
const clean=value=>JSON.parse(JSON.stringify(value));
test('la entrega mensual consulta el historial semanal del destinatario y destaca la alternativa más relevante',()=>{
 const {c}=server();c.settings_().newsletterEnabled=true;const period=c.newsletterPeriod_('monthly',new Date()),input=['fortnightly','fresh','recent'].map(id=>({...news(id),fecha:period.from}));
 c.newsRelevance_=row=>({fortnightly:100,fresh:90,recent:10}[row.id]);c.annotateNews_=rows=>rows;
 c.subscriptionRows_=()=>[{id:'monthly',correo:'owner@bbva.com',nombre:'Mes',periodicidad:'monthly',activa:true,actualizada:'2000-01-01',filtros:{coverage:''}}];
 c.rows_=name=>name==='Noticias'?input:name==='NewsletterEnvios'?[{id:'prior',suscripcion:'fortnightly',correo:'owner@bbva.com',estado:'Enviada',contenido:JSON.stringify(c.newsletterItemKeys_(input[0]))}]:[];
 c.newsletterSender_=()=>({});let sent;c.sendNewsletterMail_=(_sender,_email,content)=>{sent=content;return 'accepted';};
 assert.equal(c.deliverNewsletterBatch_().accepted,1);assert.equal(sent.items[0].id,'fresh');assert.equal(sent.total,3);assert.equal(sent.editorial.cards[0].additionalCount,2);assert.equal(c.newsletterEdition_(sent.editionId,'owner@bbva.com').items.length,3);
});
test('tres tarjetas diversas priorizan el país seleccionado y no mutan las evidencias',()=>{
 const {c}=server(),input=rows(),before=JSON.stringify(input),digest=c.newsletterDigest_(input,{view:'news',country:'México'},'es',value=>value);
 assert.equal(digest.cards.length,3);assert.equal(digest.cards[0].country,'México');assert.equal(new Set(digest.cards.map(card=>card.scope+card.category)).size,3);assert.equal(JSON.stringify(input),before);
 for(const card of digest.cards)assert.ok(card.evidenceIds.every(id=>input.some(row=>row.id===id)));
});
test('HTML y texto de tres cadencias contienen hecho, relevancia, fuentes y accesos históricos útiles',()=>{
 const {c}=server(),input=rows().map(row=>({...row,senales:['Lanzamiento de producto']}));input[0].fecha='2026-01-12';input[1].fecha='2026-04-12';
 for(const view of ['briefing','news','radar'])for(const language of ['es','en','tr']){
  const content=c.newsletterContent_(input,{view,segment:'Empresas e instituciones',from:'2026-01-01',to:'2026-12-31'},'Selección',new Date(),'sub',language,'edition'),dom=new JSDOM(content.html),d=dom.window.document;
  assert.equal(content.count,3);assert.equal(content.evidence.length,7);assert.equal(d.querySelectorAll('.newsletter-article').length,3);assert.equal(d.querySelectorAll('.newsletter-insight').length,3);
  for(const card of content.editorial.cards){assert.ok(content.text.includes(card.url));assert.ok(content.text.includes(card.relevance));assert.ok(!card.relevance.includes('{count}'));}
  for(const anchor of d.querySelectorAll('a')){const url=new URL(anchor.href);if(url.searchParams.has('edition'))assert.equal(url.searchParams.get('edition'),'edition');}
  assert.equal(new URL(d.querySelector('.newsletter-cta').href).searchParams.get('view'),view);assert.equal(d.querySelector('.newsletter-kpi'),null);dom.window.close();
 }
});
test('los análisis mensuales incluyen noticias ya enviadas semanalmente y guardan toda la evidencia de sus KPIs',()=>{
 const s=server(),{c}=s;c.settings_().newsletterEnabled=true;const period=c.newsletterPeriod_('monthly',new Date()),input=rows().map(row=>({...row,fecha:period.from}));
 c.subscriptionRows_=()=>[{id:'monthly',correo:'owner@bbva.com',nombre:'Mes',periodicidad:'monthly',activa:true,actualizada:'2000-01-01',filtros:{coverage:''}}];c.annotateNews_=rows=>rows;c.rows_=(name)=>name==='Noticias'?input:name==='NewsletterEnvios'?[{id:'fortnightly:fortnightly:'+period.from,suscripcion:'fortnightly',correo:'owner@bbva.com',estado:'Enviada',contenido:JSON.stringify(input.flatMap(c.newsletterItemKeys_))}]:[];
 c.newsletterSender_=()=>({});let sent;c.sendNewsletterMail_=(_sender,_email,content)=>{sent=content;return 'accepted';};assert.equal(c.deliverNewsletterBatch_().accepted,1);assert.equal(sent.total,7);assert.equal(sent.count,3);
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
test('el formulario ofrece solo las tres periodicidades y no guarda rango ni asunto',async t=>{
 const a=await app(t);await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('[name="range"]'),null);assert.deepEqual([...a.find('#personal-editor [name="periodicity"]').options].map(row=>row.value),['fortnightly','monthly','yearly']);
 await a.change('#personal-editor [name="periodicity"]','yearly');await a.submit('#personal-editor form');const payload=a.calls.find(row=>row.method==='saveSubscription').query;assert.equal(payload.periodicity,'yearly');assert.equal(payload.filters.range,undefined);assert.equal(payload.subject,undefined);
});
test('inicializar limpia filtros ajenos al modelo y normaliza periodicidades fuera de catálogo sin alterar ediciones archivadas',()=>{
 const s=server(),{c}=s;c.saveSubscription({periodicity:'monthly',filters:{entity:'BBVA'}});s.sheets.get('Suscripciones').grid[1][3]=JSON.stringify({entity:'BBVA',range:'year'});s.sheets.get('Suscripciones').grid[1][4]='invalid';c.initializeConfiguration();const record=c.subscriptionRows_()[0];assert.equal(record.periodicidad,'fortnightly');assert.deepEqual(clean(record.filtros),{entity:'BBVA',coverage:'digital'});assert.equal(JSON.parse(s.sheets.get('Suscripciones').grid[1][3]).range,undefined);const before=JSON.stringify(s.sheets.get('Suscripciones').grid);c.initializeConfiguration();assert.equal(JSON.stringify(s.sheets.get('Suscripciones').grid),before);
});
for(const [periodicity,view] of [['fortnightly','briefing'],['monthly','news'],['yearly','radar']])test('el enlace '+periodicity+' abre '+view+' con edición, filtros y período; navegar o volver al presente mantiene el contrato',async t=>{
 const s=server(),{c}=s,input=[news('s','España','BBVA'),news('m','México','Santander')].map(row=>({...row,senales:['Lanzamiento de producto']})),from='2026-09-01',to='2026-09-30',query={view,segment:'Empresas e instituciones',from,to},editionId='edition-'+periodicity;
 const content=c.newsletterContent_(input,query,'Resumen',new Date(),'subscription','es',editionId),dom=new JSDOM(content.html),link=new URL(dom.window.document.querySelector('.newsletter-cta').href),location=Object.fromEntries(link.searchParams);
 assert.equal(location.view,view);assert.equal(location.edition,editionId);assert.equal(link.searchParams.getAll('view').length,1);assert.equal(new URL(c.newsletterLinks_('subscription','',view).app).searchParams.get('view'),view);
 c.saveNewsletterEdition_(editionId,'delivery-'+periodicity,'owner@bbva.com','Resumen',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_(editionId,'Enviada');
 const requests=[],a=await app(t,{location,configure({w,data}){const original=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,payload)=>{if(method==='getDashboard'){requests.push(payload);return {...data,...clean(c.getDashboard(payload))};}return original(method,payload);};}});
 assert.equal(a.find('.nav [aria-current="page"]').dataset.view,view);assert.equal(a.find('#'+view+'-section').hidden,false);assert.equal(requests.length,1);assert.equal(requests[0].view,view);assert.equal(requests[0].edition,editionId);assert.equal(requests[0].initial,true);
 assert.equal(a.find('#filters [name="from"]').value,from);assert.equal(a.find('#filters [name="to"]').value,to);assert.equal(a.find('#filters [name="segment"]').value,'Empresas e instituciones');assert.match(a.find('#reading-context').textContent,/Resumen/);
 const alternate=view==='news'?'briefing':'news';await a.click('[data-view="'+alternate+'"]');assert.equal(a.find('#filters [name="from"]').value,from);assert.equal(a.find('#filters [name="to"]').value,to);
 await a.click('#reading-current');assert.equal(a.find('#filters [name="from"]').value,alternate==='briefing'?c.dashboardPeriod_('briefing').from:c.dashboardPeriod_('news').from);
 if(view!=='briefing')for(const more of dom.window.document.querySelectorAll('a.newsletter-cta')){const url=new URL(more.href),params=Object.fromEntries(url.searchParams);assert.equal(params.view,view);assert.equal(params.edition,editionId);const target=c.getDashboard({...params,initial:true});assert.equal(target.selection.from,from);assert.equal(target.selection.to,to);if(params.country)assert.equal(target.selection.country,params.country);assert.equal(target.selection.entity,params.entity??query.entity??undefined);}
 dom.window.close();
});
test('el contexto y las referencias se conservan sin inventar evidencia estructural',()=>{
 const {c}=server(),input=[news('b','España','BBVA',[path('Seguridad','Identidad')]),news('s1','España','Santander'),news('q','España','Qonto')];input[2].fecha='2026-09-20';
 const digest=c.newsletterDigest_(input,{view:'radar'},'es',value=>value);assert.equal(digest.cards[0].id,'b');assert.match(digest.cards[0].relevance,/no permite afirmar/);assert.equal(digest.context.view,'radar');
 const monthly=c.newsletterDigest_(input,{view:'news'},'es',value=>value);assert.match(monthly.cards[0].relevance,/2 entidades/);
});
test('el texto editorial no supera 160 palabras; no se rellena una selección sin evidencia',()=>{
 const {c}=server(),input=rows().map(row=>({...row,senales:['Lanzamiento de producto'],titular:'Un titular original verificable de dieciocho palabras para mostrar un servicio digital con novedades específicas en este período reciente',extracto:'Detalle del servicio y sus condiciones. '.repeat(30)}));
 for(const view of ['briefing','news','radar']){
  const content=c.newsletterContent_(input,{view,from:'2026-09-01',to:'2026-09-30'},'Compacta',new Date(),'sub','es','edition'),editorial=content.editorial;
  const text=[editorial.heading,editorial.intro,...editorial.cards.flatMap(card=>[card.title,card.fact,card.relevance])].join(' ');assert.ok(text.split(/\s+/).length<=160);assert.ok(text.split(/\s+/).length>=120);assert.equal(content.evidence.length,7);
 }
 for(const items of [[],[news('single')]]){
  const content=c.newsletterContent_(items,{view:'news'},'Compacta',new Date(),'sub'),dom=new JSDOM(content.html);assert.equal(dom.window.document.querySelectorAll('.newsletter-more').length,0);assert.equal(content.count,items.length);assert.equal(dom.window.document.querySelectorAll('.newsletter-links a').length,0);dom.window.close();
 }
 assert.equal(c.newsletterWords_('Texto corto',18),'Texto corto');assert.equal(c.newsletterWords_('palabra '.repeat(100),18).split(' ').length,18);
});
