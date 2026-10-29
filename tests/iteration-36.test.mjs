import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {presentationServer,presentationContent,presentationCases,presentationRows} from './helpers/newsletter-presentation.mjs';
import {app} from './helpers/app.mjs';

for(const {name,query} of presentationCases)test(name+': etiquetas completas, ámbito y jerarquía de Iteración 36',()=>{
 const {c}=presentationServer(),rows=structuredClone(presentationRows).map(row=>({...row,taxonomia:row.taxonomia.map(tag=>({...tag,palanca:'17.'+tag.palanca}))})),content=presentationContent(c,query,rows),d=new JSDOM(content.html).window.document;
 assert.match(content.subject,/^\[bIA\] 🚀 BBVA BEI ·/);assert.equal(d.querySelector('.newsletter-wordmark img').getAttribute('src'),'cid:bei-logo');assert.match(d.querySelector('.newsletter-wordmark img').alt,/Banca de Empresas e Instituciones/);assert.ok(content.images.some(image=>image.id==='bei-logo'&&image.data.length>1000));
 for(const cta of d.querySelectorAll('.newsletter-cta'))assert.doesNotMatch(cta.textContent,/17\./);
 for(const card of d.querySelectorAll('.newsletter-article')){
  const chips=[...card.querySelectorAll('.newsletter-chip')].map(chip=>chip.textContent);
  assert.ok(chips.includes('Lanzamiento de producto'));assert.ok(chips.includes('Canal digital'));assert.ok(chips.includes('Empresas e instituciones'));assert.ok(chips.includes('API'));
  if(query.view==='briefing')assert.match(card.querySelector('.newsletter-eyebrow').textContent,/^Trending topic (nacional|internacional) #[1-3]$/);
 }
 for(const entity of d.querySelectorAll('.newsletter-entity')){
  assert.equal(entity.querySelector('.newsletter-entity-name').style.fontSize,'24px');
  const list=entity.querySelector('ul');assert.ok(list.children.length);assert.equal(list.style.listStyleType,'disc');assert.equal(entity.querySelector('ol'),null);assert.equal(entity.querySelector('.newsletter-lever-label').textContent,'Bloques funcionales mencionados en prensa:');const example=entity.querySelector('.newsletter-article');if(example)assert.ok(list.compareDocumentPosition(example)&4);
 }
 assert.equal(d.querySelector('.newsletter-highlight-cell').style.backgroundColor,'rgb(7, 14, 70)');
 const highlights=[...d.querySelectorAll('.newsletter-executive')].map(node=>node.textContent);assert.ok(highlights.some(text=>text.includes('dentro de la mirada internacional')));if(query.country)assert.ok(highlights.some(text=>text.includes('en '+query.country+', con más menciones')));
 c.saveNewsletterEdition_('presentation-edition','delivery','owner@bbva.com',content.subject,query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('presentation-edition','Enviada');
 const summary=c.getNewsletterSummary('presentation-edition');assert.equal(summary.count,content.total);assert.equal(summary.cards.length,content.count);assert.equal(summary.cadence,content.editorial.cadence);assert.equal(summary.landscapes.global.total,content.editorial.landscapes.global.total);assert.ok(summary.cards.every(card=>card.entity));
});
test('tabla administrativa conserva filtros, edición, altas y el idioma elegido para pruebas',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="subscribers"]');
 assert.ok(a.find('#admin-subscriptions-list table'));assert.equal(a.w.document.querySelectorAll('#admin-subscriptions-list th').length,6);
 await a.click('#new-admin-subscription');await a.change('#admin-subscription-editor [name="language"]','tr');await a.submit('#admin-subscription-editor form');assert.equal(a.calls.find(row=>row.method==='saveAdminSubscription').query.language,'tr');
 await a.click('#admin-subscriptions-list [data-action="edit"]');assert.equal(a.find('#admin-subscription-editor [name="language"]').value,'es');await a.click('[data-close-editor]');
 await a.change('#newsletter-test-form [name="language"]','en');await a.submit('#newsletter-test-form');assert.equal(a.calls.find(row=>row.method==='sendNewsletterTest').query.language,'en');assert.equal(a.find('#newsletter-test-form [name="language"]').value,'en');
 await a.click('#subscribers-open-filters');await a.change('#subscribers-search','missing@bbva.com');assert.match(a.find('#admin-subscriptions-list').textContent,/Sin suscripciones/);
 await a.click('#subscribers-chips [data-clear-filter]');assert.ok(a.find('#admin-subscriptions-list table'));
});
test('el histórico separa publicaciones y ejemplos de la edición sin recalcularla',async t=>{
 const a=await app(t,{configure({replies}){
  replies.getMyNewsletterHistory={items:[{edition:'saved-edition',fecha:'2026-10-29T08:00:00Z',estado:'Enviada',desde:'2026-10-01',hasta:'2026-12-31'}],total:1};
  replies.getNewsletterSummary={from:'2026-10-01',to:'2026-12-31',country:'España',language:'es',cadence:'quarterly',count:129,topics:[],cards:[{entity:'BBVA',category:'Enablers',scope:'España',title:'Ejemplo enviado',url:'https://example.com/edition'}],landscapes:{local:{total:89,entityCount:7,themes:[{name:'Enablers',count:42}]},global:{total:40,entityCount:5,themes:[{name:'Pagos',count:12}]}}};
 }});
 await a.click('[data-view="subscriptions"]');assert.equal(a.calls.filter(row=>row.method==='getNewsletterSummary').length,0);
 await a.click('#personal-history summary');const text=a.find('#personal-history').textContent;
 assert.match(text,/Publicaciones del trimestre/);assert.match(text,/89 publicaciones · 7 entidades/);assert.match(text,/40 publicaciones · 5 entidades/);assert.match(text,/Ejemplos incluidos · 1/);assert.match(text,/BBVA · Enablers/);
 await a.click('#personal-history summary');await a.click('#personal-history summary');assert.equal(a.calls.filter(row=>row.method==='getNewsletterSummary').length,1);
});
