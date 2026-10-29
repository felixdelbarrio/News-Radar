import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/server.mjs';
const row=(id,category='Enablers')=>({id,pais:'España',entidad:'Qonto',fecha:'2026-10-22',medio:'Editor',titular:'Nueva función empresarial '+id,extracto:'Hecho verificable sobre la nueva oferta digital.',url:'https://example.com/'+id,senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true},taxonomia:[{id:'api',palanca:category,subpalanca:'Suboperativa que no debe mostrarse'}]});
const setup=()=>{const {c}=storage();c.initializeConfiguration();c.settings_().newsletterAppUrl='https://example.com/exec';return c;};
test('ambas cadencias eliminan noticias duplicadas y priorizan bloques funcionales diferentes',()=>{
 const c=setup(),items=[row('a'),row('b'),row('c','Tarjetas'),row('d','Cuentas'),{...row('a'),id:'duplicate',pais:'Colombia',url:'https://example.com/other'}];
 for(const view of ['briefing','news']){const result=c.newsletterContent_(items,{view},'',new Date(),'s','es','edition');assert.equal(result.count,view==='news'?1:3);assert.equal(new Set(result.editorial.cards.map(card=>card.category)).size,view==='news'?1:3);assert.ok(result.editorial.audit.exclusions.some(item=>item.reason==='Duplicada.'));assert.equal(new Set(result.items.map(item=>item.titular)).size,result.count);}
});
test('maqueta con etiquetas y sin botón fuente; feedback tras bIA y trimestral con métricas',()=>{
 const c=setup();for(const view of ['briefing','news']){const result=c.newsletterContent_([row('a'),row('b','Cuentas')],{view},'',new Date(),'s','es','edition'),d=new JSDOM(result.html).window.document;assert.equal(d.querySelector('.newsletter-source-link'),null);assert.match(result.html,/Suboperativa que no debe mostrarse/);assert.doesNotMatch(result.html,/Consultar la fuente/);assert.ok(d.querySelector('.newsletter-brand').compareDocumentPosition(d.querySelector('.newsletter-feedback'))&4);assert.equal(d.querySelector('meta[name="color-scheme"]').content,'light only');assert.match(result.html,/@media\(prefers-color-scheme:dark\)/);assert.equal(d.querySelectorAll('.newsletter-article').length,view==='news'?1:2);assert.equal(d.querySelectorAll('.newsletter-report').length,1);}
});
test('la descripción sindicada idéntica al titular desaparece',()=>{
 const c=setup(),item=row('a');item.extracto=item.titular+' '+item.medio;const result=c.newsletterContent_([item],{view:'briefing'},'',new Date(),'s');assert.equal(new JSDOM(result.html).window.document.querySelector('.newsletter-excerpt'),null);
});
test('la prueba administrativa usa la quincena en curso y la entrega programada mantiene la cerrada',()=>{
 const c=setup();c.Date=class extends Date{constructor(value='2026-10-27T12:00:00Z'){super(value);}};let query;c.rows_=()=>[];c.newsletter_=(_rows,value)=>{query=value;return {count:0,editorial:{audit:{exclusions:[]}}};};c.newsletterContentDetail_=()=>'';c.sendNewsletterTest({cadence:'fortnightly'});assert.equal(query.from,'2026-10-16');assert.equal(query.to,'2026-10-31');assert.equal(c.subscriptionQuery_({periodicidad:'fortnightly',filtros:{}},new Date('2026-10-27'),true).from,'2026-10-01');
});
