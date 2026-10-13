import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
const story=(id,country='España',entity='BBVA',category='Integración y automatización')=>({id,pais:country,entidad:entity,fecha:'2026-10-13',medio:'Editor',titular:'Un servicio digital para empresas '+id,extracto:'Un cambio concreto y verificable.',senales:[],segmentos:['Empresas e instituciones'],tipo:'Banco tradicional',etiquetas:{digital:true},taxonomia:[{id:'api',palanca:category,subpalanca:'APIs e integración'}],url:'https://example.com/'+id});
const query={view:'news',country:'España',coverage:'digital',segment:'Empresas e instituciones',from:'2026-10-01',to:'2026-10-31'};
test('el ejemplo mensual y anual prioriza la relevancia entre noticias nuevas para el destinatario sin recortar el corpus',()=>{
 const {c}=setup(),input=[story('fortnightly'),story('fresh'),story('recent')];input[2].fecha='2026-10-31';for(const row of input)row.senales=['Lanzamiento de producto'];
 c.newsRelevance_=row=>({fortnightly:100,fresh:90,recent:10}[row.id]);
 const fortnightly=c.newsletterContent_(input,{view:'briefing'},'Semana',new Date(),'sub');
 const known=new Set(c.newsletterItemKeys_(input[0]));
 assert.equal(fortnightly.editorial.cards[0].id,'fortnightly');
 for(const view of ['news','radar']){
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
 const related=d.querySelector('.newsletter-related');assert.equal(related.textContent,'32 noticias más en esta palanca ↗');assert.equal(new URL(related.href).searchParams.get('palanca'),'Integración y automatización');assert.doesNotMatch(d.body.textContent,/Consultar fuente/);assert.equal(d.querySelector('h3 a').href,'https://example.com/0');assert.match(content.text,/32 noticias más/);
});
test('geografía primero, mirada global después y enlaces con conteos reproducibles sobre la edición archivada',()=>{
 const s=setup(),c=s.c,input=[story('a'),story('b','México','Santander'),story('c','México','Santander','Pagos y cobros')];
 c.annotateNews_=rows=>rows;const content=c.newsletter_(input,query,'Mes',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 assert.equal(content.total,3);assert.equal(content.editorial.localCount,1);assert.equal(content.editorial.globalCount,3);assert.equal(content.editorial.cards[0].scope,'local');assert.equal(content.editorial.cards[1].scope,'global');assert.deepEqual([...d.querySelectorAll('.newsletter-scope h2')].map(el=>el.textContent),['España','Tendencias globales']);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Mes',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 const link=new URL(d.querySelector('.newsletter-related').href),params=Object.fromEntries(link.searchParams),data=c.getDashboard({...params,initial:true});assert.equal(data.selection.country,'');assert.equal(data.selection.from,query.from);assert.equal(data.newsGeographies.reduce((sum,row)=>sum+row.total,0),2);assert.equal(content.editorial.cards[1].relatedCount,2);
 const local=c.getDashboard({edition:'edition',view:'news',initial:true});assert.equal(local.selection.country,'España');assert.equal(local.total,1);
});
test('sin evidencia local se comunica la ausencia y no se inventa una bandera; sin edición no hay enlace histórico',()=>{
 const {c}=setup(),content=c.newsletterContent_([story('a','Sin determinar')],query,'Mes',new Date(),'sub'),d=new JSDOM(content.html).window.document;
 assert.match(d.querySelector('.newsletter-empty-local').textContent,/Sin noticias en España/);assert.equal(d.querySelector('.geography-flag'),null);assert.equal(d.querySelector('.newsletter-related'),null);assert.equal(d.querySelector('.newsletter-links a'),null);assert.match(d.querySelector('.newsletter-links').textContent,/Única noticia/);
});
test('una palanca filtrada prevalece sobre el orden de las etiquetas y los contadores se traducen',()=>{
 const {c}=setup(),input=[story('a'),story('b')];for(const row of input)row.taxonomia.unshift({id:'payments',palanca:'Pagos y cobros',subpalanca:'Pagos'});
 for(const language of ['en','tr']){const content=c.newsletterContent_(input,{...query,country:'',palanca:'Integración y automatización'},'Mes',new Date(),'sub',language,'edition');assert.equal(content.editorial.cards[0].category,'Integración y automatización');assert.doesNotMatch(content.html,/\{count\}|noticias más en esta palanca|Un ejemplo de esta palanca/);assert.equal(content.editorial.cards[0].relatedCount,2);}
});
test('la semanal agrupa por subpalanca, conserva la palanca y abre solo sus evidencias locales o globales',()=>{
 const s=setup(),c=s.c,input=[story('a'),story('b'),story('c','México','Santander'),story('d','México','Santander')];
 for(const row of input)row.senales=['Lanzamiento de producto'];input[3].taxonomia=[{id:'ai',palanca:'Integración y automatización',subpalanca:'Inteligencia artificial'}];
 c.annotateNews_=rows=>rows;
 const content=c.newsletter_(input,{...query,view:'briefing'},'Semana',new Date(),'sub','es','fortnightly'),d=new JSDOM(content.html).window.document;
 assert.equal(content.count,3);assert.equal(content.editorial.focusLabel,'Subpalanca');assert.equal(content.editorial.cards[0].relatedCount,2);assert.equal(content.editorial.cards[1].relatedCount,3);assert.match(d.querySelector('.newsletter-lever-label').textContent,/Subpalanca/);assert.equal(d.querySelector('.newsletter-lever').textContent,'APIs e integración');assert.match(d.querySelector('.newsletter-subcategory').textContent,/Palanca: Integración y automatización/);assert.match(d.querySelector('.newsletter-related').textContent,/1 noticia más en esta subpalanca/);
 c.saveNewsletterEdition_('fortnightly','delivery','owner@bbva.com','Semana',{...query,view:'briefing'},'es',content.evidence,content.editorial);c.completeNewsletterEdition_('fortnightly','Enviada');
 for(const anchor of d.querySelectorAll('.newsletter-related')){const params=Object.fromEntries(new URL(anchor.href).searchParams),target=c.getDashboard({...params,initial:true});assert.equal(target.selection.subpalanca,'Integración y automatización › APIs e integración');assert.equal(target.newsGeographies.reduce((sum,row)=>sum+row.total,0),params.country?2:3);}
 for(const language of ['en','tr']){const translated=c.newsletterContent_(input,{...query,view:'briefing'},'Semana',new Date(),'sub',language,'fortnightly');assert.doesNotMatch(translated.html,/noticia más en esta subpalanca|Un ejemplo de esta subpalanca|\{count\}/);}
});
test('la trimestral prioriza volumen anual frente a recencia y resume entidades y actividad por trimestre con evidencia completa',()=>{
 const s=setup(),c=s.c,input=Array.from({length:8},(_,i)=>({...story('old'+i,i<5?'España':'México',i<4?'BBVA':'Santander','Pagos y cobros'),fecha:'2026-'+['01','04','07','10'][i%4]+'-10'}));
 input.push({...story('latest','España','Qonto','Acceso y experiencia digital'),fecha:'2026-12-31'});input[0].taxonomia.push({...input[0].taxonomia[0],id:'duplicate',subpalanca:'Otra etiqueta'});input.push(story('transversal','Sin determinar','Revolut','Integración y automatización'));
 c.annotateNews_=rows=>rows;
 const content=c.newsletter_(input,{...query,view:'news',from:'2026-01-01',to:'2026-12-31'},'Año',new Date(),'sub','es','annual'),d=new JSDOM(content.html).window.document,landscapes=content.editorial.landscapes;
 assert.equal(content.total,10);assert.equal(landscapes.local.total,6);assert.equal(landscapes.global.total,10);assert.equal(landscapes.global.themes[0].name,'Pagos y cobros');assert.equal(landscapes.global.themes[0].count,8);assert.equal(landscapes.global.themes[0].share,80);assert.equal(landscapes.global.leaders[0].name,'BBVA');assert.equal(landscapes.global.leaders[0].count,4);assert.deepEqual(Array.from(landscapes.global.leaders.slice(0,2),row=>row.position),[1,1]);assert.equal(landscapes.global.leaders[0].themes[0].name,'Pagos y cobros');assert.equal(landscapes.global.countryCount,2);assert.equal(landscapes.global.unknownCountryCount,1);assert.deepEqual(Array.from(landscapes.global.quarters),[2,2,2,4]);
 assert.equal(content.editorial.cards[0].category,'Pagos y cobros');assert.equal(new Set(content.editorial.cards.map(card=>card.id)).size,content.count);assert.equal(d.querySelectorAll('.newsletter-report').length,2);assert.match(d.querySelector('.newsletter-executive').textContent,/83%/);assert.match(content.text,/80% del corpus/);assert.match(content.text,/Quién ocupó la conversación/);assert.doesNotMatch(d.body.textContent,/Consultar fuente/);
 const bar=d.querySelector('.newsletter-bar-fill');assert.equal(bar.style.width,'83%');assert.equal((bar.outerHTML.match(/style=/g)||[]).length,1);
 c.saveNewsletterEdition_('annual','delivery','owner@bbva.com','Año',{...query,view:'news',from:'2026-01-01',to:'2026-12-31'},'es',content.evidence,content.editorial);c.completeNewsletterEdition_('annual','Enviada');
 const entityLink=d.querySelector('.newsletter-leader-name a'),params=Object.fromEntries(new URL(entityLink.href).searchParams),target=c.getDashboard({...params,initial:true});assert.equal(target.selection.entity,'BBVA');assert.equal(target.selection.country,'España');assert.equal(target.total,4);
 c.settings_().briefingLimit=1;const limited=c.newsletterContent_(input,{view:'news'},'Año',new Date(),'sub');assert.equal(limited.count,1);assert.equal(limited.editorial.landscapes.global.total,10);
});
test('la trimestral sin geografía muestra solo mirada global, traduce sus métricas y admite datos sin taxonomía',()=>{
 const {c}=setup(),input=[{...story('one','Sin determinar'),taxonomia:[]}];
 for(const language of ['es','en','tr']){const content=c.newsletterContent_(input,{view:'news'},'Año',new Date(),'sub',language),d=new JSDOM(content.html).window.document;assert.equal(d.querySelectorAll('.newsletter-report').length,1);assert.equal(content.editorial.landscapes.global.themes.length,0);assert.equal(content.editorial.landscapes.global.countryCount,0);assert.doesNotMatch(content.html,/\{theme\}|\{share\}|NaN|undefined/);assert.equal(d.querySelector('.newsletter-leader-name a'),null);}
 const empty=c.newsletterContent_([],{view:'news'},'Año',new Date(),'sub');assert.equal(new JSDOM(empty.html).window.document.querySelector('.newsletter-report'),null);
});
