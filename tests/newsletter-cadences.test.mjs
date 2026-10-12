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
test('el resumen elige una noticia de la palanca más frecuente por país, sin duplicar etiquetas ni alterar los registros',()=>{
 const {c}=server(),input=rows(),before=JSON.stringify(input),digest=c.newsletterDigest_(input);
 assert.equal(digest.groups.length,2);assert.deepEqual(Array.from(digest.featured,row=>row.id),['a','g']);
 const summary=digest.selections.get(digest.groups[0]);assert.equal(summary.occurrences,3);assert.equal(summary.remaining,4);assert.equal(JSON.stringify(input),before);
 const multi=news('multi','España','BBVA',[path(),path(),path('Pagos','Transferencias')]),one=c.newsletterDigest_([multi]);assert.equal(one.featured.length,1);assert.equal(one.selections.get(one.groups[0]).occurrences,1);
 const untagged=c.newsletterDigest_([news('x','España','BBVA',[]),news('y','España','BBVA',[])]);assert.equal(untagged.featured.length,1);assert.equal(untagged.selections.get(untagged.groups[0]).remaining,1);
});
test('newsletter mensual muestra KPIs del corpus completo, una tarjeta por país y más noticias con filtros y edición privados',()=>{
 const {c}=server(),input=rows();
 for(const language of ['es','en','tr']){
  const content=c.newsletterContent_(input,{view:'news',segment:'Empresas e instituciones',from:'2026-09-01',to:'2026-09-30'},'Selección',new Date(),'sub',language,'edition'),dom=new JSDOM(content.html),d=dom.window.document;
  assert.equal(content.count,2);assert.equal(content.total,7);assert.equal(content.evidence.length,7);assert.equal(d.querySelectorAll('.newsletter-article').length,2);assert.equal(d.querySelectorAll('.newsletter-geography').length,2);
  assert.deepEqual([...d.querySelectorAll('.newsletter-kpi-value')].map(row=>row.textContent),['7','2','2','3']);assert.equal(d.querySelectorAll('.newsletter-insight').length,2);
  const link=new URL(d.querySelector('.newsletter-more').href);assert.equal(link.searchParams.get('edition'),'edition');assert.equal(link.searchParams.get('view'),'news');assert.equal(link.searchParams.get('country'),'España');assert.equal(link.searchParams.has('entity'),false);assert.equal(link.searchParams.getAll('view').length,1);assert.match(d.querySelector('.newsletter-more').textContent,/4/);assert.match(content.text,/4/);dom.window.close();
 }
});
test('newsletter anual usa un Radar compacto con cobertura, evolución trimestral y categorías predominantes',()=>{
 const {c}=server(),input=rows();input[0].fecha='2026-01-12';input[1].fecha='2026-04-12';input[2].fecha='2026-12-12';
 const content=c.newsletterContent_(input,{view:'radar',from:'2026-01-01',to:'2026-12-31'},'Radar anual',new Date(),'sub','es','edition'),dom=new JSDOM(content.html),d=dom.window.document;
 assert.equal(d.querySelectorAll('.newsletter-article').length,0);assert.match(d.querySelector('h1').textContent,/año/);assert.match(d.querySelector('.newsletter-year').textContent,/BBVA/);assert.deepEqual([...d.querySelectorAll('.newsletter-year strong')].map(row=>row.textContent),['1','1','4','1']);
 assert.equal(content.count,7);assert.equal(content.evidence.length,7);assert.match(content.text,/Trimestre 3: 4/);assert.match(content.text,/Explorar Radar/);assert.equal(new URL(d.querySelector('.newsletter-cta').href).searchParams.get('view'),'radar');assert.equal(new URL(d.querySelector('.newsletter-more').href).searchParams.get('view'),'radar');dom.window.close();
});
test('los análisis mensuales incluyen noticias ya enviadas semanalmente y guardan toda la evidencia de sus KPIs',()=>{
 const s=server(),{c}=s;c.settings_().newsletterEnabled=true;const period=c.newsletterPeriod_('monthly',new Date()),input=rows().map(row=>({...row,fecha:period.from}));
 c.subscriptionRows_=()=>[{id:'monthly',correo:'owner@bbva.com',nombre:'Mes',periodicidad:'monthly',activa:true,actualizada:'2000-01-01',filtros:{coverage:''}}];c.annotateNews_=rows=>rows;c.rows_=(name)=>name==='Noticias'?input:name==='NewsletterEnvios'?[{id:'weekly:weekly:'+period.from,suscripcion:'weekly',correo:'owner@bbva.com',estado:'Enviada',contenido:JSON.stringify(input.flatMap(c.newsletterItemKeys_))}]:[];
 c.newsletterSender_=()=>({});let sent;c.sendNewsletterMail_=(_sender,_email,content)=>{sent=content;return 'accepted';};assert.equal(c.deliverNewsletters_().accepted,1);assert.equal(sent.total,7);assert.equal(sent.count,2);
 const archived=c.newsletterEdition_(sent.editionId,'owner@bbva.com');assert.equal(archived.items.length,7);assert.equal(archived.query.view,'news');
 const dashboard=c.getDashboard({view:'news',initial:true,edition:sent.editionId,country:'España',entity:'BBVA'});assert.equal(dashboard.total,5);assert.equal(dashboard.context.count,7);assert.equal(dashboard.selection.from,period.from);assert.equal(dashboard.selection.to,period.to);
});
test('Noticias pagina cada geografía manteniendo los totales completos, recupera una pestaña ausente y exporta su selección',()=>{
 const {c}=server();c.settings_().pageSize=2;const input=rows(),first=c.newsDashboard_(input,{},[],'news'),second=c.newsDashboard_(input,{newsGeography:'México',page:10},[],'news');
 assert.equal(first.total,5);assert.equal(first.items.length,2);assert.deepEqual(Array.from(first.newsGeographies,row=>[row.name,row.total]),[['España',5],['México',2]]);assert.equal(second.page,0);assert.equal(second.total,2);assert.ok(second.items.every(row=>row.pais==='México'));
 const page=c.newsDashboard_(input,{newsGeography:'España',page:2},[],'news');assert.equal(page.items.length,1);assert.equal(page.items[0].id,'e');assert.equal(c.newsDashboard_(input,{newsGeography:'México',country:'España'},[],'news').newsGeography,'España');assert.equal(c.newsDashboard_([],{},[],'news').newsGeographies.length,0);
 c.rows_=()=>input;c.selectNews_=(_rows,query)=>c.selectAnnotatedNews_(input,query);const csv=c.exportNews({view:'news',newsGeography:'México'});assert.equal(csv.count,2);assert.doesNotMatch(csv.csv,/España/);
});
test('Noticias cambia pestaña mediante un solo RPC y reinicia la página; el teclado conserva el foco',async t=>{
 const s=server(),input=rows();s.c.settings_().pageSize=2;
 const a=await app(t,{configure({w,data}){const original=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,query)=>{const reply=await original(method,query);return method==='getDashboard'&&query.view==='news'?{...data,...clean(s.c.newsDashboard_(input,query,[],'news')),selection:query}:reply;};}});
 await a.click('[data-view="news"]');assert.equal(a.w.document.querySelectorAll('#news-geographies [role="tab"]').length,2);const before=a.calls.filter(row=>row.method==='getDashboard').length;
 await a.click('#news-geographies [data-geography="México"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,before+1);assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.newsGeography,'México');assert.equal(a.find('#result-count').textContent,'2 publicaciones');assert.equal(a.find('#next').disabled,true);
 a.find('#news-geographies [aria-selected="true"]').dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,100));assert.equal(a.find('#news-geographies [aria-selected="true"]').dataset.geography,'España');assert.equal(a.w.document.activeElement.id,a.find('#news-geographies [aria-selected="true"]').id);await a.click('#next');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.page,1);
});
test('el formulario ofrece solo las tres periodicidades y no guarda rango ni asunto',async t=>{
 const a=await app(t);await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('[name="range"]'),null);assert.deepEqual([...a.find('#personal-editor [name="periodicity"]').options].map(row=>row.value),['weekly','monthly','yearly']);
 await a.change('#personal-editor [name="periodicity"]','yearly');await a.submit('#personal-editor form');const payload=a.calls.find(row=>row.method==='saveSubscription').query;assert.equal(payload.periodicity,'yearly');assert.equal(payload.filters.range,undefined);assert.equal(payload.subject,undefined);
});
test('inicializar limpia filtros ajenos al modelo y normaliza periodicidades fuera de catálogo sin alterar ediciones archivadas',()=>{
 const s=server(),{c}=s;c.saveSubscription({periodicity:'monthly',filters:{entity:'BBVA'}});s.sheets.get('Suscripciones').grid[1][3]=JSON.stringify({entity:'BBVA',range:'year'});s.sheets.get('Suscripciones').grid[1][4]='invalid';c.initializeConfiguration();const record=c.subscriptionRows_()[0];assert.equal(record.periodicidad,'weekly');assert.deepEqual(clean(record.filtros),{entity:'BBVA',coverage:'digital'});assert.equal(JSON.parse(s.sheets.get('Suscripciones').grid[1][3]).range,undefined);const before=JSON.stringify(s.sheets.get('Suscripciones').grid);c.initializeConfiguration();assert.equal(JSON.stringify(s.sheets.get('Suscripciones').grid),before);
});
for(const [periodicity,view] of [['weekly','briefing'],['monthly','news'],['yearly','radar']])test('el enlace '+periodicity+' abre '+view+' con edición, filtros y período; navegar o volver al presente mantiene el contrato',async t=>{
 const s=server(),{c}=s,input=[news('s','España','BBVA'),news('m','México','Santander')].map(row=>({...row,senales:['Lanzamiento de producto']})),from='2026-09-01',to='2026-09-30',query={view,segment:'Empresas e instituciones',from,to},editionId='edition-'+periodicity;
 const content=c.newsletterContent_(input,query,'Resumen',new Date(),'subscription','es',editionId),dom=new JSDOM(content.html),link=new URL(dom.window.document.querySelector('.newsletter-cta').href),location=Object.fromEntries(link.searchParams);
 assert.equal(location.view,view);assert.equal(location.edition,editionId);assert.equal(link.searchParams.getAll('view').length,1);assert.equal(new URL(c.newsletterLinks_('subscription','',view).app).searchParams.get('view'),view);
 c.saveNewsletterEdition_(editionId,'delivery-'+periodicity,'owner@bbva.com','Resumen',query,'es',content.evidence);c.completeNewsletterEdition_(editionId,'Enviada');
 const requests=[],a=await app(t,{location,configure({w,data}){const original=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,payload)=>{if(method==='getDashboard'){requests.push(payload);return {...data,...clean(c.getDashboard(payload))};}return original(method,payload);};}});
 assert.equal(a.find('.nav [aria-current="page"]').dataset.view,view);assert.equal(a.find('#'+view+'-section').hidden,false);assert.equal(requests.length,1);assert.equal(requests[0].view,view);assert.equal(requests[0].edition,editionId);assert.equal(requests[0].initial,true);
 assert.equal(a.find('#filters [name="from"]').value,from);assert.equal(a.find('#filters [name="to"]').value,to);assert.equal(a.find('#filters [name="segment"]').value,'Empresas e instituciones');assert.match(a.find('#reading-context').textContent,/Resumen/);
 const alternate=view==='news'?'briefing':'news';await a.click('[data-view="'+alternate+'"]');assert.equal(a.find('#filters [name="from"]').value,from);assert.equal(a.find('#filters [name="to"]').value,to);
 await a.click('#reading-current');assert.equal(a.find('#filters [name="from"]').value,alternate==='briefing'?c.recentNewsRange_().from:c.currentMonth_().from);
 if(view!=='briefing')for(const more of dom.window.document.querySelectorAll('.newsletter-more')){const url=new URL(more.href),params=Object.fromEntries(url.searchParams);assert.equal(params.view,view);assert.equal(params.edition,editionId);const target=c.getDashboard({...params,initial:true});assert.equal(target.selection.from,from);assert.equal(target.selection.to,to);assert.equal(target.selection.country,params.country);assert.equal(target.selection.entity,params.entity||query.entity||undefined);}
 dom.window.close();
});
test('la palanca se acumula entre entidades y subpalancas; el destacado es el más reciente de la palanca ganadora',()=>{
 const {c}=server(),input=[news('b','España','BBVA',[path('Seguridad','Identidad')]),news('s1','España','Santander',[path('Pagos','Cobros')]),news('s2','España','Santander',[path('Pagos','Transferencias')]),news('q','España','Qonto',[path('Pagos','Cobros')])];
 input[3].fecha='2026-09-20';
 const digest=c.newsletterDigest_(input),summary=digest.selections.get(digest.groups[0]);assert.equal(summary.item.id,'q');assert.equal(summary.category,'Pagos');assert.equal(summary.occurrences,3);assert.equal(digest.featured.length,1);
});
test('ambas newsletters respetan un destacado por país, resumen breve, evidencia completa y enlaces de país sin imponer entidad',()=>{
 const {c}=server(),input=rows().map(row=>({...row,senales:['Lanzamiento de producto'],extracto:'Detalle del servicio y sus condiciones. '.repeat(30)}));
 for(const view of ['briefing','news']){
  const content=c.newsletterContent_(input,{view,from:'2026-09-01',to:'2026-09-30'},'Compacta',new Date(),'sub','es','edition'),dom=new JSDOM(content.html),d=dom.window.document;
  for(const section of d.querySelectorAll('.newsletter-geography'))assert.equal(section.querySelectorAll('.newsletter-article').length,1);
  assert.equal(content.evidence.length,7);assert.equal(content.count,2);assert.equal(content.total,7);assert.equal(d.querySelector('.newsletter-index'),null);
  for(const excerpt of d.querySelectorAll('.newsletter-excerpt')){assert.ok(excerpt.textContent.length<=241);assert.ok(excerpt.textContent.endsWith('…'));}
  for(const more of d.querySelectorAll('.newsletter-more')){const url=new URL(more.href);assert.equal(url.searchParams.get('view'),view);assert.equal(url.searchParams.get('edition'),'edition');assert.equal(url.searchParams.has('entity'),false);assert.ok(url.searchParams.get('country'));}
  assert.match(content.text,/Ver más/);dom.window.close();
 }
});
test('una geografía con una noticia y un corpus vacío no generan enlaces sobrantes',()=>{
 const {c}=server();for(const items of [[],[news('single')]]){
  const content=c.newsletterContent_(items,{view:'news'},'Compacta',new Date(),'sub'),dom=new JSDOM(content.html);assert.equal(dom.window.document.querySelectorAll('.newsletter-more').length,0);assert.equal(content.count,items.length);dom.window.close();
 }
 assert.equal(c.newsletterExcerpt_('Texto corto'),'Texto corto');assert.ok(c.newsletterExcerpt_('x'.repeat(500)).length<=241);
});
