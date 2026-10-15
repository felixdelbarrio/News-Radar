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
test('las vistas actuales fijan el ámbito empresarial y digital y rechazan cobertura desconocida',()=>{const {c}=server(),now=new Date('2026-10-12T12:00:00Z');for(const view of ['briefing','news','radar']){const q=c.dashboardQuery_({view,initial:false,segment:'Retail',coverage:''},now);assert.equal(q.segment,sectorNewsDefaults.segment);assert.equal(q.coverage,'digital');assert.throws(()=>c.dashboardQuery_({view,coverage:'unknown'},now),/cobertura/);}});
test('la suscripción conserva solo país y todas las cadencias',()=>{const {c}=server();for(const periodicity of ['fortnightly','monthly','yearly']){c.saveSubscription({periodicity,filters:{segment:'Retail',coverage:'generalista'}});const row=c.getSubscriptions()[0];assert.equal(row.periodicidad,'all');assert.equal(row.filtros.segment,sectorNewsDefaults.segment);assert.equal(row.filtros.coverage,'digital');}assert.equal(c.getSubscriptions().length,1);});
test('países seguidos se ordenan antes de Otras geografías, que incluye noticias sin país',()=>{
 const input=[row('m','México'),row('z','Zimbabue'),row('a','Alemania'),...Array.from({length:6},(_,i)=>row('u'+i,'Sin determinar'))],names=['Alemania','México','Zimbabue','Otras geografías'];
 assert.deepEqual(noveltyOverview(input).geographies.map(row=>row.name),names);assert.deepEqual(noveltyGroups(input).map(row=>row.name),names);assert.equal(geographyLabel('Sin determinar'),'Otras geografías');assert.equal(geographyLabel('España'),'España');assert.deepEqual(input.map(row=>({name:geographyLabel(row.pais)})).sort(geographyOrder).slice(0,3).map(row=>row.name),names.slice(0,3));
 const {c}=server(),data=c.newsDashboard_(input,{},[],'news');assert.deepEqual(Array.from(data.newsGeographies,row=>row.name),['México','Otras geografías']);assert.equal(data.newsGeography,'México');assert.equal(c.newsDashboard_(input,{newsGeography:'Otras geografías'},[],'news').total,8);
});
test('las pestañas y el correo agrupan las noticias sin país en Otras geografías',async t=>{
 const input=[row('u','Sin determinar'),row('u2','Sin determinar'),row('m','México'),row('e','España')],s=server();
 const a=await app(t,{configure({data}){data.briefing={...noveltyOverview(input),items:input};data.newsGeographies=noveltyOverview(input).geographies;data.newsGeography='España';}});
 const tabs=selector=>[...a.w.document.querySelectorAll(selector+' [role="tab"]')];assert.deepEqual(tabs('#briefing-geographies').map(row=>row.dataset.geography),['España','México','Otras geografías']);assert.match(tabs('#briefing-geographies').at(-1).textContent,/Otras geografías/);
 await a.click('#briefing-geographies [data-geography="Otras geografías"]');assert.match(a.find('#briefing-geography-summary').textContent,/Otras geografías/);const reads=a.calls.length;await a.click('#briefing-signals .signal-card');assert.equal(a.calls.length,reads);
 await a.click('[data-view="news"]');assert.match(tabs('#news-geographies').at(-1).textContent,/Otras geografías/);await a.click('#news-geographies [data-geography="Otras geografías"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.newsGeography,'Otras geografías');
 s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';const content=s.c.newsletterContent_(input,{view:'news'},'Resumen',new Date(),'id','es','edition');assert.match(content.html,/Otras geografías/);assert.doesNotMatch(content.html,/>Sin determinar</);assert.equal(s.c.newsletterExploreLink_(s.c.newsletterLinks_('id','edition').app,'news','Sin determinar').includes('country=Sin%20determinar'),true);
});
test('los formularios de suscripción no exponen cobertura ni segmento',async t=>{const a=await app(t,{configure({replies}){replies.getSubscriptions=[];}});await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('#personal-editor [name="coverage"]'),null);await a.click('[data-view="administration"]');await a.click('[data-admin-view="subscribers"]');await a.click('#new-admin-subscription');assert.equal(a.w.document.querySelector('#admin-subscription-editor [name="segment"]'),null);});
