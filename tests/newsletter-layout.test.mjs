import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
const story=(id,country='España',entity='BBVA',category='Integración y automatización')=>({id,pais:country,entidad:entity,fecha:'2026-10-13',medio:'Editor',titular:'Un servicio digital para empresas '+id,extracto:'Un cambio concreto y verificable.',senales:['Mejora de oferta'],segmentos:['Empresas e instituciones'],tipo:'Banco tradicional',etiquetas:{digital:true},taxonomia:[{id:'api',palanca:category,subpalanca:'APIs e integración'}],url:'https://example.com/'+id});
const query={view:'news',country:'España',coverage:'digital',segment:'Empresas e instituciones',from:'2026-10-01',to:'2026-10-31'};







test('la trimestral sin geografía muestra solo mirada global, traduce sus métricas y admite datos sin taxonomía',()=>{
 const {c}=setup(),input=[{...story('one','Sin determinar'),taxonomia:[]}];
 for(const language of ['es','en','tr']){const content=c.newsletterContent_(input,{view:'news'},'Año',new Date(),'sub',language),d=new JSDOM(content.html).window.document;assert.equal(d.querySelectorAll('.newsletter-report').length,1);assert.equal(content.editorial.landscapes.global.themes[0].name,'Otros');assert.equal(content.editorial.landscapes.global.countryCount,0);assert.doesNotMatch(content.html,/\{theme\}|\{share\}|NaN|undefined/);assert.equal(d.querySelector('.newsletter-leader-name a'),null);}
 const empty=c.newsletterContent_([],{view:'news'},'Año',new Date(),'sub');assert.equal(new JSDOM(empty.html).window.document.querySelector('.newsletter-report'),null);
});
test('ambas cadencias excluyen incidencias de tarjetas, evidencia y KPIs aunque dominen el corpus',()=>{
 const {c}=setup(),commercial=story('commercial'),incidents=Array.from({length:12},(_,i)=>({...story('incident-'+i,i%2?'México':'España'),senales:['Indisponibilidad / Incidencia operativa']}));
 const input=[commercial,...incidents],before=JSON.stringify(input);
 for(const view of ['briefing','news']){
  const result=c.newsletterContent_(input,{...query,view},'Selección comercial',new Date(),'subscription');
  assert.equal(result.total,1);assert.equal(result.evidence.length,1);assert.equal(result.editorial.cards.length,1);assert.equal(result.editorial.cards[0].id,'commercial');assert.equal(result.editorial.cards[0].relatedCount,1);assert.equal(result.editorial.localCount,1);assert.equal(result.editorial.globalCount,0);assert.doesNotMatch(result.html,/incident-/);
 }
 assert.equal(JSON.stringify(input),before);
});
