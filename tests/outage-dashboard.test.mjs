import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {BRIEFING_ALLOWED_SIGNALS,briefingAllowed,articleGeographies} from '../src/shared/selection-policy.js';
import {articleEntities} from '../src/shared/news-groups.js';
const signal='Indisponibilidad / Incidencia operativa';
function context(){const c=vm.createContext({INCIDENT_SIGNAL:signal,entityKey_:value=>value,plainText_:value=>value,canonicalUrl_:value=>value,articleGeographies,articleEntities});vm.runInContext(fs.readFileSync('src/server/news/Radar.gs','utf8'),c);return c;}
const row=(id,date,entity='BBVA',country='España',senales=[signal])=>({id,fecha:date,entidad:entity,pais:country,senales,taxonomia:[{palanca:'Pagos'}],titular:'Fallo de transferencias',medio:'Diario',url:'https://example.com/'+id});
test('briefing admite exclusivamente las tres señales comerciales, excluye incidencias incluso mezcladas',()=>{
 assert.deepEqual(BRIEFING_ALLOWED_SIGNALS,['Lanzamiento de producto','Mejora de oferta','Alianza estratégica']);
 for(const name of BRIEFING_ALLOWED_SIGNALS)assert.equal(briefingAllowed({senales:[name]}),true);
 for(const senales of [[],[signal],['Incidencia operativa'],['Otros'],['Mejora de oferta',signal]])assert.equal(briefingAllowed({senales}),false);
});
test('riesgo anual agrega evidencia, entidades, países, vectores y comparativa sin contaminar métricas comerciales',()=>{
 const c=context(),rows=[row('a','2026-01-03'),row('b','2026-02-03','BBVA','Colombia'),row('c','2026-02-04','Santander'),row('d','2026-03-04','Citi','España',['Mejora de oferta'])],result=c.radarOutages_(rows,[row('old','2025-01-03')],{from:'2026-01-01',to:'2026-12-31'});
 assert.equal(result.total,3);assert.equal(result.affected,2);assert.equal(result.active,3);assert.equal(result.ratio,67);assert.equal(result.change,200);assert.equal(result.months.length,12);assert.equal(result.months[1].total,2);assert.equal(result.top.entity,'BBVA');assert.equal(result.top.total,2);assert.equal(result.top.countries.length,2);assert.equal(result.vector.name,'Pagos');assert.equal(result.latest[0].id,'c');assert.equal(result.concentration,67);
});
test('riesgo anual vacío y años bisiestos conservan rango y no inventan variaciones',()=>{
 const c=context(),result=c.radarOutages_([],[],{from:'2026-01-01',to:'2026-12-31'});assert.equal(result.total,0);assert.equal(result.top,null);assert.equal(result.change,0);assert.match(result.summary,/Sin incidencias/);
 assert.deepEqual(JSON.parse(JSON.stringify(c.radarPreviousPeriod_({from:'2024-02-29',to:'2024-12-31'}))),{from:'2023-02-28',to:'2023-12-31'});
 const current=c.radarOutages_([row('a','2026-01-03')],[],{from:'2026-01-01',to:'2026-12-31'});assert.equal(current.change,null);
});
test('incidencias muestra solo los meses del período filtrado, también al cruzar de año',()=>{
 const c=context(),query={from:'2025-11-03',to:'2026-11-02'},result=c.radarOutages_([row('nov','2025-11-03'),row('ene','2026-01-03'),row('fin','2026-11-02')],[],query);
 assert.equal(result.months.length,13);assert.equal(result.months[0].month,'2025-11');assert.equal(result.months[0].total,1);assert.equal(result.months.at(-1).month,'2026-11');assert.equal(result.months.reduce((n,m)=>n+m.total,0),result.total);
 const short=c.radarOutages_([row('only','2026-10-31')],[],{from:'2026-10-31',to:'2026-11-02'});assert.deepEqual(Array.from(short.months,m=>m.month),['2026-10','2026-11']);assert.doesNotMatch(short.summary,/anual/);
 const empty=c.radarOutages_([],[],{from:'2026-06-15',to:'2026-06-15'});assert.equal(empty.months.length,1);assert.equal(empty.months[0].month,'2026-06');assert.doesNotMatch(empty.summary,/anual/);
});
test('vistas no contienen accesos fijos de incidencia y Radar sitúa riesgo después de medios',()=>{
 for(const name of ['NewsView','BriefingView'])assert.doesNotMatch(fs.readFileSync('src/views/'+name+'.html','utf8'),/data-outage-view|briefing-problems/);
 const html=fs.readFileSync('src/views/RadarView.html','utf8');assert.ok(html.indexOf('radar-outage-title')>html.indexOf('publisher-chart'));assert.match(html,/data-outage-explore/);
});
import {app,tick} from './helpers/app.mjs';
test('Radar presenta KPIs y abre Noticias con incidencia conservando el período que cruza de año',async t=>{
 const outage=context().radarOutages_([row('a','2026-01-03')],[],{from:'2025-11-03',to:'2026-11-02'});
 const a=await app(t,{entry:'radar',location:{view:'radar'},configure({data}){data.radar.outages=JSON.parse(JSON.stringify(outage));data.signals=[...BRIEFING_ALLOWED_SIGNALS,signal];data.selection={from:'2025-11-03',to:'2026-11-02',country:'España',signal:''};}});
 await tick();await a.click('[data-view="radar"]');await tick();assert.equal(a.find('#message').hidden,true,a.find('#message').textContent);assert.equal(a.find('#radar-outage').hidden,false);assert.equal(a.find('#radar-outage-kpis').children.length,4);assert.ok(a.find('#radar-outage-evidence').textContent.includes('Fallo de transferencias'));
 assert.match(a.find('#radar-outage-timeline time').textContent,/25/);assert.match(a.find('#radar-outage-timeline .activity-chart').lastElementChild.querySelector('time').textContent,/26/);
 await a.click('[data-outage-explore]');const query=a.calls.filter(call=>call.method==='getDashboard').at(-1).query;assert.equal(query.view,'news');assert.equal(query.signal,signal);assert.equal(query.country||'','');assert.equal(query.newsGeography,'España');assert.equal(query.from,'2025-11-03');assert.equal(query.to,'2026-11-02');
});
