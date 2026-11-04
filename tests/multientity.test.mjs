import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {annotateFixtures} from './helpers/canonical-fixtures.mjs';
import {app} from './helpers/app.mjs';
import {newsEntityGroups,newsEntityPage} from '../src/shared/news-groups.js';
import {noveltyOverview} from '../src/shared/novelty-groups.js';

const article=(id,titular,entidad='BBVA')=>({id,fecha:'2026-11-03',pais:'España',medio:'CriptoNoticias',entidad,titular,extracto:'',url:'https://example.com/'+id,fuente:'BBVA · México',idioma:'es',clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}'});
const title='BBVA y Santander de España priorizan stablecoins antes que depósitos tokenizados';
const plain=value=>JSON.parse(JSON.stringify(value));

test('el titular reconoce protagonistas conjuntos, evita menciones incidentales y conserva la entidad principal',()=>{
 const {c}=storage();c.initializeConfiguration();const index=c.businessIndex_(),names=(titular,entidad='BBVA')=>plain(c.headlineProtagonists_(article('x',titular,entidad),index));
 assert.deepEqual(names(title),['BBVA','Santander']);
 assert.deepEqual(names('BBVA, Santander y Stripe lanzan pagos empresariales'),['BBVA','Santander','Stripe']);
 assert.deepEqual(names('BBVA y BBVA Empresas anuncian pagos'),['BBVA']);
 assert.deepEqual(names('BBVA supera a Santander en pagos'),['BBVA']);
 assert.deepEqual(names('Rumores del mercado: BBVA y Santander emitirán stablecoins'),['BBVA']);
 assert.deepEqual(names('La ciudad de Santander y BBVA anuncian pagos'),['BBVA']);
});

test('una noticia única se filtra y agrupa en ambos bancos; Radar cuenta asociaciones sin duplicar totales ni CSV',()=>{
 const {c}=storage();c.initializeConfiguration();c.taxonomyOptions_=()=>({});
 const raw=article('joint',title),rows=annotateFixtures(c,[raw]);rows[0].taxonomia=[{id:'payments',palanca:'Pagos',subpalanca:'Transferencias'}];
 assert.deepEqual(plain(rows[0].entidades),['BBVA','Santander']);
 assert.deepEqual(newsEntityGroups(rows).map(group=>[group.name,group.total]),[['BBVA',1],['Santander',1]]);
 assert.deepEqual(newsEntityPage(rows,0,30).map(row=>row.id),['joint']);
 const query={country:'España',from:'2026-11-01',to:'2026-11-04'};
 for(const entity of ['BBVA','Santander'])assert.equal(c.newsDashboard_(rows,{...query,entity},[],'news').total,1);
 assert.equal(c.selectAnnotatedNews_(rows,{...query,country:'México',entity:'Santander'}).length,0);
 const radar=c.newsDashboard_(rows,query,[],'radar');
 assert.equal(radar.stats.news,1);assert.equal(radar.stats.associations,2);
 assert.deepEqual(plain(radar.radar.ranking.map(row=>[row.entity,row.total])),[['BBVA',1],['Santander',1]]);
 assert.equal(radar.radar.geographies[0].total,1);
 assert.deepEqual(plain(radar.heatmap.entities.map(row=>[row.name,row.total])),[['BBVA',1],['Santander',1]]);
 assert.equal(c.newsCsv_([raw],{...query,entity:'Santander'}).count,1);
 const news=c.newsDashboard_(rows,query,[],'news'),bundle=c.compactNewsSnapshot_(rows,query,news),restored=c.compactNewsSnapshotData_(bundle,'España','es');
 assert.deepEqual(plain(restored.items[0].entidades),['BBVA','Santander']);assert.equal(restored.total,1);
});

test('Novedades muestra una tarjeta con dos logos y Noticias una fila en cada grupo',async t=>{
 const row={...article('joint',title),entidades:['BBVA','Santander'],tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:['Mejora de oferta'],etiquetas:{digital:true},taxonomia:[]};
 const a=await app(t,{configure({data}){data.briefing={...noveltyOverview([row],['Mejora de oferta']),items:[row]};data.items=[row];data.total=1;data.contextTotal=1;}});
 assert.equal(a.find('#briefing-list').querySelectorAll('article').length,1);
 assert.equal(a.find('#briefing-list article').querySelectorAll('.entity-logo').length,2);
 assert.equal(a.find('#briefing-list article').querySelectorAll('a').length,1);
 await a.click('[data-view="news"]');
 assert.deepEqual([...a.find('#news-list').querySelectorAll('.news-entity-group')].map(group=>[group.getAttribute('aria-label'),group.querySelectorAll('.news-row').length]),[['BBVA',1],['Santander',1]]);
 assert.equal(a.find('#result-count').textContent,'1 publicación');
 const filtered=await app(t,{entry:'news',configure({data}){data.items=[row];data.total=1;data.contextTotal=1;data.selection={entity:'Santander'};}});
 assert.deepEqual([...filtered.find('#news-list').querySelectorAll('.news-entity-group')].map(group=>group.getAttribute('aria-label')),['Santander']);
});
