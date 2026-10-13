import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {noveltyOverview,noveltyGroups} from '../src/shared/novelty-groups.js';
import {geographyOrder,geographyLabel,sectorNewsDefaults} from '../src/shared/selection-policy.js';
const clean=value=>JSON.parse(JSON.stringify(value));
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const row=(id,pais)=>({id,pais,entidad:'BBVA',fecha:'2026-10-10',senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true,generalista:true},taxonomia:[],titular:'BBVA lanza producto digital para empresas '+id,extracto:'Información del producto',medio:'Editor',tema:'Canales digitales',tipo:'Banco tradicional',url:'https://example.com/'+id});
test('las tres vistas comparten segmento y cobertura iniciales y respetan las elecciones explícitas',()=>{
 const {c}=server(),now=new Date('2026-10-12T12:00:00Z');
 for(const view of ['briefing','news','radar']){
  const initial=c.dashboardQuery_({view,initial:true},now);assert.equal(initial.segment,sectorNewsDefaults.segment);assert.equal(initial.coverage,'digital');
  for(const coverage of ['','generalista','digital']){const query=c.dashboardQuery_({view,initial:false,segment:'Retail',coverage},now);assert.equal(query.segment,'Retail');assert.equal(query.coverage,coverage);assert.equal(c.personalDashboardQuery_({filtros:{segment:'Retail',coverage}},view,now).coverage,coverage);}
  assert.throws(()=>c.dashboardQuery_({view,coverage:'unknown'},now),/cobertura/);
 }
});
test('la newsletter nueva incluye Canal digital; Todos y Generalista se conservan al guardar, recargar y consultar cada periodicidad',()=>{
 const s=server(),{c}=s;assert.deepEqual(clean(c.subscriptionDefaults_().filters),sectorNewsDefaults);assert.deepEqual(clean(c.getNewsletterOptions().catalogs.coverage),['digital','generalista']);
 for(const coverage of ['','generalista','digital'])for(const periodicity of ['weekly','monthly','yearly']){
  c.saveSubscription({periodicity,filters:{segment:'Retail',coverage}});const own=c.subscriptionRows_('owner@bbva.com').at(-1);assert.equal(own.filtros.coverage,coverage);assert.equal(own.filtros.segment,'Retail');assert.equal(c.subscriptionQuery_(own,new Date()).coverage,coverage);c.initializeNewsletterCadences_(s.sheets.get('Suscripciones'));assert.equal(c.subscriptionRows_().at(-1).filtros.coverage,coverage);
 }
 const created=c.subscriptionRecord_({filters:{entity:'BBVA'}},'owner@bbva.com','default',new Date(),0);assert.equal(created.filtros.coverage,'digital');assert.equal(created.filtros.segment,sectorNewsDefaults.segment);assert.match(created.nombre,/Cobertura: Canal digital/);
 assert.throws(()=>c.subscriptionRecord_({filters:{coverage:'mobile'}},'owner@bbva.com','bad',new Date(),0),/cobertura/);
});
test('países seguidos se ordenan antes de Transversal y Otras geografías',()=>{
 const input=[row('m','México'),row('z','Zimbabue'),row('a','Alemania'),...Array.from({length:6},(_,i)=>row('u'+i,'Sin determinar'))],names=['Alemania','México','Zimbabue','Sin determinar'];
 assert.deepEqual(noveltyOverview(input).geographies.map(row=>row.name),names);assert.deepEqual(noveltyGroups(input).map(row=>row.name),names);assert.equal(geographyLabel(names.at(-1)),'Transversal');assert.equal(geographyLabel('España'),'España');assert.deepEqual(input.map(row=>({name:row.pais})).sort(geographyOrder).slice(0,3).map(row=>row.name),names.slice(0,3));
 const {c}=server(),data=c.newsDashboard_(input,{},[],'news');assert.deepEqual(Array.from(data.newsGeographies,row=>row.name),['Alemania','México','Sin determinar','Otras geografías']);assert.equal(data.newsGeography,'Alemania');assert.equal(c.newsDashboard_(input,{newsGeography:'Sin determinar'},[],'news').total,6);
});
test('las pestañas muestran Transversal y conservan su clave en Novedades, Noticias y enlaces del correo',async t=>{
 const input=[row('u','Sin determinar'),row('u2','Sin determinar'),row('m','México'),row('e','España')],s=server();
 const a=await app(t,{configure({data}){data.briefing={...noveltyOverview(input),items:input};data.newsGeographies=noveltyOverview(input).geographies;data.newsGeography='España';}});
 const tabs=selector=>[...a.w.document.querySelectorAll(selector+' [role="tab"]')];assert.deepEqual(tabs('#briefing-geographies').map(row=>row.dataset.geography),['España','México','Sin determinar']);assert.match(tabs('#briefing-geographies').at(-1).textContent,/Transversal/);
 await a.click('#briefing-geographies [data-geography="Sin determinar"]');assert.match(a.find('#briefing-geography-summary').textContent,/Transversal/);await a.click('#briefing-signals [data-signal]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.country,'Sin determinar');
 await a.click('[data-view="news"]');assert.match(tabs('#news-geographies').at(-1).textContent,/Transversal/);await a.click('#news-geographies [data-geography="Sin determinar"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.newsGeography,'Sin determinar');
 s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';const content=s.c.newsletterContent_(input,{view:'news'},'Resumen',new Date(),'id','es','edition');assert.match(content.html,/Transversal/);assert.doesNotMatch(content.html,/>Sin determinar</);assert.match(content.html,/country=Sin%20determinar/);
});
test('formularios personales y administrativos muestran Cobertura y permiten eliminar el valor por defecto',async t=>{
 const s=server(),a=await app(t,{configure({replies}){replies.getNewsletterOptions={...replies.getNewsletterOptions,defaults:s.c.subscriptionDefaults_(),catalogs:{coverage:['digital','generalista'],segment:['Empresas e instituciones','Retail'],entity:['BBVA']}};}});
 await a.click('[data-view="subscriptions"]');assert.equal(a.find('#personal-editor [name="coverage"]').value,'digital');assert.equal(a.find('#personal-editor [name="segment"]').value,sectorNewsDefaults.segment);assert.equal(a.find('#personal-editor [name="coverage"] option[value="digital"]').textContent,'Canal digital');await a.change('#personal-editor [name="coverage"]','');await a.submit('#personal-editor form');assert.equal(a.calls.find(row=>row.method==='saveSubscription').query.filters.coverage,'');
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="subscribers"]');await a.click('#new-admin-subscription');assert.equal(a.find('#admin-subscription-editor [name="coverage"]').value,'digital');await a.change('#admin-subscription-editor [name="coverage"]','generalista');await a.submit('#admin-subscription-editor form');assert.equal(a.calls.find(row=>row.method==='saveAdminSubscription').query.filters.coverage,'generalista');
});
