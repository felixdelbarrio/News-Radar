import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
const story=(id,country='España',entity='BBVA',category='Integración y automatización')=>({id,pais:country,entidad:entity,fecha:'2026-10-13',medio:'Editor',titular:'Un servicio digital para empresas '+id,extracto:'Un cambio concreto y verificable.',senales:[],segmentos:['Empresas e instituciones'],tipo:'Banco tradicional',etiquetas:{digital:true},taxonomia:[{id:'api',palanca:category,subpalanca:'APIs e integración'}],url:'https://example.com/'+id});
const query={view:'news',country:'España',coverage:'digital',segment:'Empresas e instituciones',from:'2026-10-01',to:'2026-10-31'};
test('el ejemplo trimestral y anual prioriza la relevancia entre noticias nuevas para el destinatario sin recortar el corpus',()=>{
 const {c}=setup(),input=[story('fortnightly'),story('fresh'),story('recent')];input[2].fecha='2026-10-31';for(const row of input)row.senales=['Lanzamiento de producto'];
 c.newsRelevance_=row=>({fortnightly:100,fresh:90,recent:10}[row.id]);
 const fortnightly=c.newsletterContent_(input,{view:'briefing'},'Semana',new Date(),'sub');
 const known=new Set(c.newsletterItemKeys_(input[0]));
 assert.equal(fortnightly.editorial.cards[0].id,'fortnightly');
 for(const view of ['news']){
  const fresh=c.newsletterContent_(input,{view},'Informe',new Date(),'sub','es','edition',known);
  assert.equal(fresh.editorial.cards[0].id,'fresh');assert.equal(fresh.editorial.reusedCount,0);assert.equal(fresh.total,3);assert.equal(fresh.evidence.length,3);assert.equal(fresh.editorial.cards[0].additionalCount,2);
  const other=c.newsletterContent_(input,{view},'Informe',new Date(),'other');assert.equal(other.editorial.cards[0].id,'fortnightly');
  const allKnown=new Set(input.flatMap(row=>Array.from(c.newsletterItemKeys_(row)))),fallback=c.newsletterContent_(input,{view},'Informe',new Date(),'sub','es','edition',allKnown);
  assert.equal(fallback.count,1);assert.equal(fallback.editorial.cards[0].id,'fortnightly');assert.equal(fallback.editorial.reusedCount,1);
 }
 const copy={...input[0],id:'copy'};assert.equal(c.newsletterWasSent_(copy,known),true);
 const noUrl=input.map(row=>({...row,url:''}));assert.equal(c.newsletterUnseen_(noUrl,new Set()).length,3);
});
test('la palanca encabeza el ejemplo, mantiene banco y bandera y cuenta 32 noticias adicionales sin duplicar etiquetas',()=>{
 const {c}=setup(),input=Array.from({length:33},(_,i)=>story(String(i)));input[0].taxonomia.push({...input[0].taxonomia[0],id:'erp',subpalanca:'Automatización'});
 const content=c.newsletterContent_(input,{...query,country:''},'Mes',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 assert.equal(content.count,1);assert.equal(content.editorial.cards[0].relatedCount,33);assert.equal(d.querySelector('.newsletter-lever').textContent,'Integración y automatización');assert.match(d.querySelector('.newsletter-example-label').textContent,/ejemplo/);assert.match(d.querySelector('.newsletter-bank').textContent,/BBVA/);assert.ok(d.querySelector('.geography-flag'));assert.match(d.querySelector('.newsletter-subcategory').textContent,/APIs e integración · Automatización/);
 const related=d.querySelector('.newsletter-related');assert.equal(related.textContent,'32 noticias más en este bloque funcional ↗');assert.equal(new URL(related.href).searchParams.get('palanca'),'Integración y automatización');assert.doesNotMatch(d.body.textContent,/Consultar fuente/);assert.equal(d.querySelector('h3 a').href,'https://example.com/0');assert.match(content.text,/32 noticias más/);
});
test('el informe presenta geografía e internacional disjuntas con enlaces reproducibles',()=>{
 const {c}=setup(),input=[story('a'),story('b','México','Santander'),story('c','México','Santander')];c.annotateNews_=rows=>rows;
 const content=newsletterFixture(c,input,query,'Trimestre',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 assert.equal(content.editorial.localCount,1);assert.equal(content.editorial.globalCount,2);assert.equal(content.editorial.cards[0].scope,'local');assert.equal(content.editorial.cards[1].scope,'global');assert.equal(d.querySelectorAll('.newsletter-scope').length,0);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Trimestre',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 const params=Object.fromEntries(new URL(d.querySelector('.newsletter-related').href).searchParams);assert.equal(params.benchmark,'international');assert.equal(c.exportNews(params).count,2);assert.equal(c.getDashboard({edition:'edition',view:'news',initial:true}).total,1);
});
test('sin evidencia local se comunica la ausencia, sin inventar bandera ni mensajes de noticia única',()=>{
 const {c}=setup(),content=c.newsletterContent_([story('a','Sin determinar')],query,'Trimestre',new Date(),'sub'),d=new JSDOM(content.html).window.document;
 assert.match(d.querySelector('.newsletter-empty-local').textContent,/Sin noticias en España/);assert.equal(d.querySelector('.geography-flag'),null);assert.equal(d.querySelector('.newsletter-related'),null);assert.equal(d.querySelector('.newsletter-links a'),null);assert.equal(d.querySelector('.newsletter-links').textContent,'');assert.doesNotMatch(content.text,/Única noticia/);
});
test('una palanca filtrada prevalece sobre el orden de las etiquetas y los contadores se traducen',()=>{
 const {c}=setup(),input=[story('a'),story('b')];for(const row of input)row.taxonomia.unshift({id:'payments',palanca:'Pagos y cobros',subpalanca:'Pagos'});
 for(const language of ['en','tr']){const content=c.newsletterContent_(input,{...query,country:'',palanca:'Integración y automatización'},'Mes',new Date(),'sub',language,'edition');assert.equal(content.editorial.cards[0].category,'Integración y automatización');assert.doesNotMatch(content.html,/\{count\}|noticias más en esta palanca|Un ejemplo de este bloque funcional/);assert.equal(content.editorial.cards[0].relatedCount,2);}
});
test('la quincenal agrupa por bloque funcional y sus enlaces abren todas las suboperativas de esa mirada',()=>{
 const {c}=setup(),input=[story('a'),story('b'),story('c','México','Santander'),story('d','México','Santander')];for(const row of input)row.senales=['Lanzamiento de producto'];input[3].taxonomia=[{id:'ai',palanca:'Integración y automatización',subpalanca:'Inteligencia artificial'}];c.annotateNews_=rows=>rows;
 const q={...query,view:'briefing'},content=newsletterFixture(c,input,q,'Quincena',new Date(),'sub','es','fortnightly'),d=new JSDOM(content.html).window.document;
 assert.equal(content.count,2);assert.equal(content.editorial.focusLabel,'Bloque funcional');assert.equal(content.editorial.cards[0].relatedCount,2);assert.equal(content.editorial.cards[1].relatedCount,2);assert.equal(d.querySelector('.newsletter-lever').textContent,'Integración y automatización');
 c.saveNewsletterEdition_('fortnightly','delivery','owner@bbva.com','Quincena',q,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('fortnightly','Enviada');
 for(const anchor of d.querySelectorAll('.newsletter-related')){const params=Object.fromEntries(new URL(anchor.href).searchParams);assert.equal(params.subpalanca,undefined);assert.equal(c.exportNews(params).count,2);}
});
test('la trimestral prioriza el bloque con más evidencia y presenta KPIs propios por mirada',()=>{
 const {c}=setup(),input=Array.from({length:8},(_,i)=>story('old'+i,i<5?'España':'México',i<4?'BBVA':'Santander','Pagos y cobros'));input.push(story('latest','España','Qonto','Acceso y experiencia digital'),story('unknown','Sin determinar','Revolut'));c.annotateNews_=rows=>rows;
 const content=newsletterFixture(c,input,query,'Trimestre',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 assert.equal(content.total,10);assert.equal(content.editorial.landscapes.local.total,6);assert.equal(content.editorial.landscapes.global.total,4);assert.equal(content.editorial.cards[0].category,'Pagos y cobros');assert.equal(content.editorial.cards[1].category,'Pagos y cobros');assert.equal(content.editorial.landscapes.local.bbvaCount,4);assert.equal(content.editorial.landscapes.global.bbvaCount,0);assert.equal(d.querySelectorAll('.newsletter-report').length,2);assert.equal(d.querySelectorAll('.newsletter-article').length,2);assert.equal(d.querySelectorAll('.newsletter-quarters').length,0);assert.doesNotMatch(d.body.textContent,/corpus|Geografías identificadas/);
});
test('la trimestral sin geografía muestra solo mirada global, traduce sus métricas y admite datos sin taxonomía',()=>{
 const {c}=setup(),input=[{...story('one','Sin determinar'),taxonomia:[]}];
 for(const language of ['es','en','tr']){const content=c.newsletterContent_(input,{view:'news'},'Año',new Date(),'sub',language),d=new JSDOM(content.html).window.document;assert.equal(d.querySelectorAll('.newsletter-report').length,1);assert.equal(content.editorial.landscapes.global.themes.length,0);assert.equal(content.editorial.landscapes.global.countryCount,0);assert.doesNotMatch(content.html,/\{theme\}|\{share\}|NaN|undefined/);assert.equal(d.querySelector('.newsletter-leader-name a'),null);}
 const empty=c.newsletterContent_([],{view:'news'},'Año',new Date(),'sub');assert.equal(new JSDOM(empty.html).window.document.querySelector('.newsletter-report'),null);
});
