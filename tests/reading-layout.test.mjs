import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
import {taxonomyChoices,taxonomySubLabel} from '../src/shared/taxonomy-path.js';
const paths=['Pagos › Cobros','Pagos › Transferencias','Seguridad › Identidad'];
const row=(id,pais)=>({id,pais,entidad:'BBVA',fecha:'2026-10-10',titular:'Titular '+id,extracto:'Detalle '+id,url:'https://example.com/'+id,medio:'El Economista',tema:'Pagos',tipo:'Banco',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],etiquetas:{digital:true,generalista:true},taxonomia:[{palanca:'Pagos',subpalanca:'Cobros'}],translation:{state:'translated',language:'es'},original:{titular:'Titular '+id,extracto:'Detalle '+id}});
test('el total de Novedades suma países y no cambia al cambiar pestaña; tarjetas empiezan por titular y omiten información repetida',async t=>{
 const rows=[row('a','Colombia'),row('b','España'),row('c','México'),row('d','Sin determinar')],a=await app(t,{configure({data}){data.briefing={...noveltyOverview(rows,['Lanzamiento de producto']),items:rows};data.selection={coverage:'digital',segment:'Empresas e instituciones'};}});
 assert.equal(a.find('#briefing-count').textContent,'4 publicaciones');await a.click('#briefing-geographies [data-geography="México"]');assert.equal(a.find('#briefing-count').textContent,'4 publicaciones');
 const card=a.find('#briefing-list article');assert.ok(card.firstElementChild.querySelector('h3'));assert.equal(card.querySelector('details'),null);assert.doesNotMatch(card.textContent,/Traducción automática|Pendiente de traducción/);assert.match(card.textContent,/Canal digital/);assert.match(card.textContent,/Pagos/);assert.match(card.textContent,/Cobros/);assert.doesNotMatch(card.textContent,/›/);assert.ok(card.querySelector('.publisher-logo'));assert.equal(card.querySelectorAll('a').length,1);assert.ok(card.querySelector('.story-link'));
});
test('los combos de Noticias se limitan mutuamente y muestran solo el nombre de la subpalanca',async t=>{
 const a=await app(t,{configure({data}){data.palanca=['Pagos','Seguridad'];data.subpalanca=paths;}});await a.click('[data-view="news"]');
 await a.change('#filters [name="palanca"]','Pagos');assert.deepEqual([...a.find('#filters [name="subpalanca"]').options].map(option=>option.textContent),['Todos','Cobros','Transferencias']);
 await a.change('#filters [name="palanca"]','');await a.change('#filters [name="subpalanca"]','Seguridad › Identidad');assert.deepEqual([...a.find('#filters [name="palanca"]').options].map(option=>option.textContent),['Todos','Seguridad']);assert.doesNotMatch(a.find('#active-filters').textContent,/›/);
});
test('la relación de taxonomía mantiene identidades internas y etiquetas breves sin prefijos',()=>{
 assert.equal(taxonomySubLabel('Pagos › Cobros'),'Cobros');assert.deepEqual(taxonomyChoices(paths,{palanca:'Pagos'}).subpalanca,paths.slice(0,2));assert.deepEqual(taxonomyChoices(paths,{subpalanca:paths[2]}).palanca,['Seguridad']);
});
test('el alta personal solo ofrece geografía e idioma sin filtros de contenido',async t=>{const a=await app(t,{configure({replies}){replies.getSubscriptions=[];}});await a.click('[data-view="subscriptions"]');for(const name of ['palanca','subpalanca','entity','coverage','segment','periodicity'])assert.equal(a.w.document.querySelector('#personal-editor [name="'+name+'"]'),null);assert.ok(a.find('#personal-editor [name="country"]'));assert.ok(a.find('#personal-editor [name="language"]'));});
test('una subpalanca compartida limita el combo a todas sus palancas asociadas',()=>{
 const shared=['Pagos › Transferencias','Experiencia › Transferencias','Seguridad › Identidad'];assert.deepEqual(taxonomyChoices(shared,{subpalanca:shared[0]}).palanca,['Pagos','Experiencia']);
});
test('Radar usa el año cuando no hay fechas explícitas y cuenta medios sobre toda la selección',async()=>{
 const {storage}=await import('./helpers/server.mjs');const {c}=storage();c.initializeConfiguration();c.taxonomyOptions_=()=>({});
 const now=new Date('2026-10-12T12:00:00Z'),query=c.dashboardQuery_({view:'radar',initial:false,from:'',to:''},now);assert.equal(query.from,'2026-01-01');assert.equal(query.to,'2026-12-31');
 const input=Array.from({length:40},(_,i)=>({...row(String(i),'España'),fecha:i<20?'2026-02-10':'2026-10-10'})),data=c.newsDashboard_(input,query,[],'radar');assert.equal(data.radar.publishers[0].total,40);assert.equal(data.radar.available.total,40);assert.equal(data.radar.available.from,'2026-02-10');assert.ok(data.items.length<data.radar.summary.news);
 const manual=c.dashboardQuery_({view:'radar',from:'2026-09-01',to:'2026-09-30'},now);assert.equal(manual.from,'2026-01-01');assert.equal(manual.to,'2026-12-31');
});
test('cambiar entre palancas asociadas conserva la subpalanca compartida sin introducir etiquetas con prefijos',async t=>{
 const a=await app(t,{configure({data}){data.palanca=['Pagos','Experiencia'];data.subpalanca=['Pagos › Transferencias','Experiencia › Transferencias'];}});await a.click('[data-view="news"]');await a.change('#filters [name="subpalanca"]','Pagos › Transferencias');await a.change('#filters [name="palanca"]','Experiencia');assert.equal(a.find('#filters [name="subpalanca"]').value,'Experiencia › Transferencias');assert.match(a.find('#active-filters').textContent,/Transferencias/);assert.doesNotMatch(a.find('#active-filters').textContent,/›/);
});
test('las opciones regeneradas conservan el nombre canónico al cambiar de idioma',async t=>{
 const a=await app(t,{language:'en-US',configure({data}){data.palanca=['Pagos','Seguridad'];data.subpalanca=['Pagos › Capacidad propia','Seguridad › Identidad'];data.taxonomyTranslations={en:{'Capacidad propia':'Custom capability'},tr:{'Capacidad propia':'Özel yetenek'}};}});await a.click('[data-view="news"]');await a.change('#filters [name="palanca"]','Pagos');assert.match(a.find('#filters [name="subpalanca"]').textContent,/Custom capability/);await a.change('#preview-language','tr');assert.match(a.find('#filters [name="subpalanca"]').textContent,/Özel yetenek/);
});
