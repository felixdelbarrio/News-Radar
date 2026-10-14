import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {noveltyOverview,noveltyGroups,noveltyCount} from '../src/shared/novelty-groups.js';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
const signals=['Lanzamiento de producto','Mejora de oferta','Alianza estratégica'];
function row(id,pais='España',entidad='BBVA',senales=[signals[0]],segmentos=['Empresas e instituciones']){return {id,pais,entidad,senales,segmentos,tipo:'Banco tradicional',titular:entidad+' lanza producto '+id,extracto:'Nueva oferta para empresas',fecha:'2026-10-10',medio:'Editor',url:'https://example.com/'+id,tema:'Financiación',taxonomia:[]};}
function server(){const s=storage();s.c.initializeConfiguration();return s;}
test('agrupa cada noticia una sola vez en geografía, entidad y combinación de segmentos sin mutar ni sumar etiquetas duplicadas',()=>{
 const rows=[row('a','España','Santander',[...signals,signals[0]],['Retail','Empresas e instituciones','Retail']),row('b','España','BBVA'),row('c','México','BBVA'),row('d','España','Santander'),row('e','','',[],[])],before=JSON.stringify(rows),overview=noveltyOverview(rows,signals),groups=noveltyGroups(rows);
 assert.equal(overview.total,5);assert.equal(overview.bySignal[0].total,4);assert.equal(overview.geographies.find(row=>row.name==='España').total,3);assert.equal(overview.geographies[0].entityCount,2);
 assert.deepEqual(groups[0].entities.map(row=>row.name),['BBVA','Santander']);assert.equal(groups[0].entities[1].segments[0].name,'Empresas e instituciones · Retail');
 const ids=groups.flatMap(group=>group.entities.flatMap(entity=>entity.segments.flatMap(segment=>segment.items.map(row=>row.id))));assert.equal(new Set(ids).size,5);assert.equal(ids.length,5);assert.equal(JSON.stringify(rows),before);assert.deepEqual(noveltyGroups([]),[]);assert.equal(noveltyOverview([]).total,0);assert.equal(noveltyCount(1,'novedad','novedades'),'1 novedad');assert.equal(noveltyCount(2,'novedad','novedades'),'2 novedades');
});
test('el límite por geografía no oculta mercados minoritarios y los KPIs conservan la población completa',()=>{
 const {c}=server();c.settings_().briefingLimit=2;
 const rows=[...Array.from({length:6},(_,i)=>row(String(i))),row('mx','México','Santander')],briefing=c.briefing_(rows,true),newsletter=c.briefing_(rows);
 assert.equal(briefing.total,7);assert.equal(briefing.items.length,3);assert.equal(briefing.geographies.find(row=>row.name==='México').total,1);assert.equal(briefing.geographies[0].bySignal[0].total,6);assert.equal(briefing.limited,true);assert.equal(newsletter.items.length,2);
});
test('las pestañas cambian tarjetas y KPIs sin RPC, admiten teclado y conservan o recuperan la geografía tras filtrar',async t=>{
 const rows=[row('a'),row('b','México','Santander',[signals[1]]),row('c','España','Santander',[signals[2]])];
 const a=await app(t,{configure({data}){data.briefing={...noveltyOverview(rows,signals),items:rows};}}),tabs=()=>[...a.w.document.querySelectorAll('#briefing-geographies [role="tab"]')];
 assert.equal(tabs().length,2);assert.equal(tabs()[0].dataset.geography,'España');assert.equal(a.w.document.querySelectorAll('#briefing-list article').length,2);const before=a.calls.filter(row=>row.method==='getDashboard').length;
 await a.click('#briefing-geographies [data-geography="México"]');assert.equal(a.find('#briefing-list h3').textContent,'Santander lanza producto b');assert.equal(a.find('#briefing-signals [data-signal="Mejora de oferta"] strong').textContent,'1');assert.equal(a.find('#briefing-count').textContent,'Novedades detectadas: 3');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,before);
 const active=a.find('#briefing-geographies [aria-selected="true"]');active.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(a.find('#briefing-geographies [aria-selected="true"]').dataset.geography,'España');assert.equal(a.w.document.activeElement.id,a.find('#briefing-geographies [aria-selected="true"]').id);
 await a.click('#briefing-geographies [data-geography="México"]');await a.click('#briefing-signals [data-signal="Mejora de oferta"]');const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.country,'México');assert.equal(query.signal,signals[1]);assert.equal(a.find('#briefing-geographies [aria-selected="true"]').dataset.geography,'México');
 a.data.briefing={...noveltyOverview([rows[0]],signals),items:[rows[0]]};await a.change('#filters [name="search"]','producto');assert.equal(tabs().length,1);assert.equal(tabs()[0].dataset.geography,'España');
 a.data.briefing={...noveltyOverview([],signals),items:[]};await a.change('#filters [name="search"]','inexistente');assert.equal(a.find('#briefing-geographies').hidden,true);assert.equal(tabs().length,0);assert.match(a.find('#briefing-list').textContent,/No hay novedades/);
});
test('KPIs de geografía limitada muestran totales reales y ninguna pestaña vacía',async t=>{
 const rows=[row('a')],overview=noveltyOverview(rows,signals);overview.geographies[0].total=8;overview.geographies[0].entityCount=3;overview.geographies[0].bySignal[0].total=8;
 const a=await app(t,{configure({data}){data.briefing={...overview,total:8,limited:true,items:rows};}});assert.equal(a.find('#briefing-limit').hidden,false);assert.match(a.find('#briefing-geography-summary').textContent,/8 novedades · 3 entidades/);assert.equal(a.find('#briefing-signals strong').textContent,'8');
});
test('newsletter conserva toda la evidencia y presenta un máximo de tres tarjetas con estilos inline',()=>{
 const {c}=server(),rows=[row('s1','España','Santander',[signals[0]],['Retail','Empresas e instituciones']),row('b','España','BBVA',[signals[2]]),row('s2','España','Santander',[signals[1]]),row('m','México','BBVA')];c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';
 for(const language of ['es','en','tr']){
  const content=c.newsletterContent_(rows,{from:'2026-10-06',to:'2026-10-12'},'Novedades',new Date(),'id',language,'edition'),d=new JSDOM(content.html).window.document;
  assert.equal(content.count,3);assert.equal(d.querySelectorAll('.newsletter-article').length,3);assert.equal(content.total,4);assert.equal(content.evidence.length,4);assert.ok(d.querySelector('.newsletter-article').style.background);assert.ok(d.querySelector('.newsletter-insight').style.borderLeft);assert.match(content.html,/\?edition=edition/);assert.match(content.subject,/^\[bIA\]/);
 }
 c.settings_().briefingLimit=2;assert.equal(c.newsletterContent_(rows,{},'Novedades',new Date(),'id').count,2);
});
test('el modelo compartido se publica para cliente y Apps Script y evita scripts en el correo',()=>{
 const {c}=server(),record=row('safe','<img src=x>','<script>');record.titular='<script>alert(1)</script>';record.extracto='<img src=x onerror=alert(1)>';const content=c.newsletterContent_([record],{},'Prueba',new Date(),'id'),d=new JSDOM(content.html).window.document;assert.equal(d.querySelectorAll('script,[onerror]').length,0);assert.ok(!d.body.textContent.includes(record.titular));assert.equal(typeof c.noveltyOverview,'function');assert.equal(typeof c.noveltyGroups,'function');
});
