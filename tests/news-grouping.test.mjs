import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newsEntityGroups,newsEntityPage} from '../src/shared/news-groups.js';
import {storage} from './helpers/server.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
const row=(id,entidad,pais='España',fecha='2026-10-10')=>({id,entidad,pais,fecha,titular:'Titular único '+id,url:'https://example.com/'+id,medio:'Editor',tema:'Canales digitales',senales:[],segmentos:[],etiquetas:{digital:true},taxonomia:[]});
test('ordena por BBVA y alfabeto, conservando fechas y paginando sobre los grupos completos',()=>{
 const rows=[row('z1','Zeta'),row('a1','Alfa'),row('b1','BBVA'),row('z2','Zeta','España','2026-10-09'),row('a2','Alfa','España','2026-10-08'),row('g1','Gamma')];
 assert.deepEqual(newsEntityGroups(rows).map(group=>[group.name,group.total]),[['BBVA',1],['Alfa',2],['Gamma',1],['Zeta',2]]);
 assert.deepEqual(newsEntityPage(rows,0,3).map(row=>row.id),['b1','a1','a2']);
 assert.deepEqual(newsEntityPage(rows,2,3).map(row=>row.id),['a2','g1','z1']);
 assert.deepEqual(newsEntityPage(rows,6,3),[]);
});
test('Noticias calcula la prioridad por país antes de paginar y mantiene Transversal al final',()=>{
 const {c}=storage();c.initializeConfiguration();c.taxonomyOptions_=()=>({});
 const rows=[row('s1','Santander'),row('b1','BBVA'),row('s2','Santander','España','2026-10-09'),row('b2','BBVA','México'),row('x1','Zeta','Sin determinar')];
 const dashboard=c.newsDashboard_(rows,{newsGeography:'España'},[],'news');
 assert.deepEqual(clean(dashboard.items).map(row=>row.id),['b1','s1','s2']);
 assert.deepEqual(clean(dashboard.newsGeographies).map(row=>row.name),['España','México','Sin determinar']);
 assert.deepEqual(clean(c.newsDashboard_(rows,{newsGeography:'México'},[],'news').items).map(row=>row.id),['b2']);
});
test('Radar sitúa el mapa de calor inmediatamente después de KPI y antes del mapa geográfico',()=>{
 const source=fs.readFileSync(new URL('../src/views/RadarView.html',import.meta.url),'utf8');
 assert.ok(source.indexOf('id="metrics"')<source.indexOf('class="panel taxonomy-heatmap"'));
 assert.ok(source.indexOf('class="panel taxonomy-heatmap"')<source.indexOf('id="map-panel"'));
});
test('la programación diaria reutiliza la consulta y se invalida al desactivar, activar y reconfigurar',()=>{
 const {c}=storage();c.initializeConfiguration();let reads=0;const triggers=c.ScriptApp.getProjectTriggers;c.ScriptApp.getProjectTriggers=()=>{reads++;return triggers();};
 assert.equal(c.dailyScheduleStatus_(),false);const first=reads;assert.equal(c.dailyScheduleStatus_(),false);assert.equal(reads,first);
 c.enableDaily();assert.equal(c.dailyScheduleStatus_(),true);const active=reads;assert.equal(c.dailyScheduleStatus_(),true);assert.equal(reads,active);
 c.disableDaily();assert.equal(c.dailyScheduleStatus_(),false);
 c.configuration_().settings.dailyHour=8;c.replaceCollectionSchedule_();assert.equal(c.dailyScheduleStatus_(),true);
 c.properties_().setProperty('DAILY_ENABLED','false');c.initializeBackgroundSchedules_();assert.equal(c.dailyScheduleStatus_(),false);
});

test('la paginación del servidor conserva las entidades contiguas aunque BBVA tenga menos noticias',()=>{
 const {c}=storage();c.initializeConfiguration();c.taxonomyOptions_=()=>({});
 const size=c.settings_().pageSize,rows=[...Array.from({length:size+4},(_,i)=>row('s'+i,'Santander')),...Array.from({length:2},(_,i)=>row('b'+i,'BBVA'))];
 const first=c.newsDashboard_(rows,{},[],'news'),second=c.newsDashboard_(rows,{page:1},[],'news');
 assert.equal(first.items.length,size);assert.deepEqual(clean(first.items).slice(0,2).map(row=>row.entidad),['BBVA','BBVA']);
 assert.ok(first.items.slice(2).every(row=>row.entidad==='Santander'));assert.ok(second.items.every(row=>row.entidad==='Santander'));
 assert.equal(new Set([...first.items,...second.items].map(row=>row.id)).size,rows.length);
});

test('la interfaz presenta encabezados por entidad y evita crear tarjetas ocultas al cargar otras vistas',async t=>{
 const {app}=await import('./helpers/app.mjs');
 const a=await app(t,{configure({data}){data.items=[row('b1','BBVA'),row('s1','Santander'),row('s2','Santander')];data.total=3;}});
 assert.equal(a.w.document.querySelectorAll('#news-list article').length,0);
 await a.click('[data-view="radar"]');assert.equal(a.w.document.querySelectorAll('#news-list article').length,0);
 await a.click('[data-view="news"]');
 assert.deepEqual([...a.w.document.querySelectorAll('.news-entity-heading')].map(el=>el.textContent),['BBVA','Santander']);
 assert.equal(a.w.document.querySelectorAll('#news-list article').length,3);assert.equal(a.w.document.querySelectorAll('.news-entity-group').length,2);assert.deepEqual([...a.w.document.querySelectorAll('.news-entity-group')].map(group=>[group.getAttribute('aria-label'),group.querySelectorAll('article').length]),[['BBVA',1],['Santander',2]]);
 assert.equal(a.w.document.querySelectorAll('.news-entity-heading .entity-logo').length,2);
});

test('el orden alfabético ignora el volumen y cada entidad conserva las fechas descendentes al paginar',()=>{
 const {c}=storage();c.initializeConfiguration();c.taxonomyOptions_=()=>({});c.settings_().pageSize=3;
 const input=[row('z1','Zeta','España','2026-10-12'),row('a-old','Alfa','España','2026-10-08'),row('z2','Zeta','España','2026-10-11'),row('b','BBVA','España','2026-10-06'),row('a-new','Alfa','España','2026-10-10'),row('z3','Zeta','España','2026-10-09')];
 const first=c.newsDashboard_(input,{},[],'news'),next=c.newsDashboard_(input,{page:1},[],'news');
 assert.deepEqual(clean(first.items).map(row=>row.id),['b','a-new','a-old']);assert.deepEqual(clean(next.items).map(row=>row.id),['z1','z2','z3']);
});
