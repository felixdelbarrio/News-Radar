import {drainSnapshots} from './helpers/canonical-fixtures.mjs';
import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app,tick} from './helpers/app.mjs';
import {inferredCountryCode} from '../src/client/core/browser-country.js';
import {taxonomyObserve,taxonomyBuild,taxonomyDefinitions,TAXONOMY_POLICY} from '../src/shared/taxonomy.js';
const plain=value=>JSON.parse(JSON.stringify(value));
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
function article(id,date='2026-10-10',changes={}){return {id,fecha:date,pais:'España',entidad:'BBVA',medio:'Editor',fuente:'Editor',titular:'BBVA lanza una plataforma digital de pagos empresariales para nuevas empresas '+id,extracto:'Pagos digitales y tesorería para empresas y pymes.',url:'https://editor.test/'+id,idioma:'es',capturada:'2026-10-15T00:00:00Z',clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',taxonomia:'{"ids":[]}',...changes};}
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);s.c.newsSheet_().grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));s.c.invalidateNews_();}
const query={from:'2026-01-01',to:'2026-12-31'};
test('ámbito único filtra antes de clasificar y rechaza ingesta ajena sin perder originales',()=>{
 const s=server(),c=s.c;add(s,[article('business'),article('retail','2026-10-10',{clasificacion:'{"digital":true,"capacidades":["Retail: Cuenta"]}'}),article('general','2026-10-10',{clasificacion:'{"digital":false,"capacidades":[]}'})]);
 const annotate=c.annotateNews_;let count=0;c.annotateNews_=rows=>{count+=rows.length;return annotate(rows);};const result=c.getDashboard({...query,view:'radar',segment:'Retail',coverage:'digital'});assert.equal(result.total,1);assert.equal(count,1);assert.equal(c.rows_('Noticias').length,3);assert.equal(result.selection.segment,'Empresas e instituciones');assert.equal(result.selection.coverage,'digital');
 const feed={name:'Editor',entity:'BBVA',country:'España',domain:'editor.test',kind:'rss'};
 assert.match(c.evaluate_({title:'BBVA presenta resultados trimestrales',url:'https://editor.test/results',date:'2026-10-14',excerpt:'El consejo presenta los resultados.'},feed,new Date('2026-10-15')).reason,/Fuera de canal/);
});
test('país es preferencia local aproximada y no se inventa una ubicación para idiomas ambiguos',()=>{
 assert.equal(inferredCountryCode(['en-US'],'Europe/Madrid'),'ES');assert.equal(inferredCountryCode(['es-MX'],''),'MX');assert.equal(inferredCountryCode(['en'],''),'');assert.equal(inferredCountryCode(['es'],'America/Caracas'),'VE');assert.equal(inferredCountryCode(['en'],'Asia/Dubai'),'AE');
});
test('una suscripción por usuario admite solo país del ámbito y no cambia filtros de lectura',()=>{
 const s=server(),c=s.c;c.saveSubscription({country:'España',filters:{entity:'Santander',segment:'Retail'},periodicity:'yearly'});const first=c.getSubscriptions()[0];c.saveSubscription({country:'México',active:false});const rows=c.getSubscriptions();assert.equal(rows.length,1);assert.equal(rows[0].id,first.id);assert.equal(rows[0].periodicidad,'all');assert.equal(rows[0].activa,false);assert.deepEqual(plain(rows[0].filtros),{...plain(c.subscriptionFilters_({})),country:'México'});assert.equal(c.getDashboard({view:'radar',initial:true}).selection.country,'');assert.throws(()=>c.saveSubscription({country:'Canadá'}),/Geografía/);assert.ok(c.newsletterCountries_().includes('Venezuela'));
});
test('la entrega automática genera quincenal, trimestral y anual sin selección de periodicidad',()=>{
 const {c}=server();c.saveSubscription({country:'España'});const row=c.subscriptionRows_()[0];row.actualizada='2025-01-01T00:00:00Z';c.subscriptionRows_=()=>[row];const plan=c.newsletterDeliveryPlan_(new Date('2026-01-10T12:00:00Z'),[]);assert.deepEqual(Array.from(plan.due,item=>item.row.periodicidad),['fortnightly','quarterly']);assert.equal(new Set(plan.due.map(item=>item.id)).size,2);assert.deepEqual(plain(c.newsletterWindow('quarterly','2026-03-15',true)),{from:'2025-10-01',to:'2025-12-31',cutoff:'2026-01-01T00:00:00.000Z',available:'2026-01-07'});
});
test('clasificación y taxonomía recorren fechas descendentes aunque la hoja esté desordenada',()=>{
 const s=server(),c=s.c;add(s,[article('old','2026-01-01'),article('new','2026-10-15'),article('middle','2026-06-01')]);const ordered=c.newsWorkRows_({total:3,cursor:null},3);assert.deepEqual(Array.from(ordered,row=>row.id),['new','middle','old']);const seen=[],classify=c.classification_;c.classification_=(title,...rest)=>{seen.push(title);return classify(title,...rest);};c.requestNewsClassification_(true);c.newsClassificationBatch_();assert.match(seen[0],/old$/);assert.match(seen[2],/middle$/);drainSnapshots(c);assert.equal(c.classificationJob_().state,'Completada');
});
test('TF-IDF conserva evidencia de solapamiento acotada y suprime categorías redundantes',()=>{
 const state={documents:0,candidates:{}},definitions=taxonomyDefinitions([{name:'17.Enablers',terms:['ai'],emerging:[],functions:[{id:'17.01',name:'Inteligencia artificial',terms:['ai']}]}]);for(let i=0;i<10;i++)taxonomyObserve(state,'ai agents ai push para automatizar pagos',definitions,new Set());const result=taxonomyBuild(state);assert.equal(result.filter(row=>row.origin==='tf-idf').length,0);for(const row of Object.values(state.candidates))assert.ok(Object.keys(row.overlap||{}).length<=TAXONOMY_POLICY.maxOverlapLinks);
 const a={key:'a',palanca:'03.Pagos',subpalanca:'03.xx A',terms:['token wallets'],segments:['Empresas'],origin:'tf-idf',sources:['A','B'],df:10,tf:10,overlap:{b:9}},b={...a,key:'b',subpalanca:'03.xx B',terms:['wallet payments'],overlap:{a:9}},distinct={...a,key:'c',subpalanca:'03.xx C',overlap:{},df:6},anchor={...a,key:'block',origin:'regla',subpalanca:'',terms:[]};const grouped=taxonomyBuild({documents:30,candidates:{a,b,distinct,anchor}});assert.equal(grouped.filter(row=>row.origin==='tf-idf').length,0);
});
test('mantenimiento elimina duplicados físicos sin conservar canonicalId',()=>{
 const s=server(),c=s.c,base=article('base'),duplicate={...base,id:'copy',url:'https://editor.test/copy'};add(s,[base,duplicate]);c.writeClassificationJob_({...c.classificationJob_(),state:'Completada'});delete s.properties.MAINTENANCE_JOB;c.maintenance_();for(let i=0;i<20&&c.maintenanceJob_().state!=='Completada';i++){if(c.maintenanceJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.maintenanceBatch_();}assert.equal(c.maintenanceJob_().state,'Completada');assert.equal(c.rows_('Noticias').length,1);assert.equal(c.maintenanceJob_().removed,1);assert.equal(c.rows_('Noticias').filter(row=>JSON.parse(row.clasificacion).canonicalId).length,0);
});
test('compactación conserva únicamente los eventos recientes dentro del límite',()=>{
 const s=server(),c=s.c,sheet=s.sheets.get('Telemetria');c.configuration_().storage.logRows=10;sheet.grid.splice(1);for(let i=0;i<310;i++)sheet.grid.push([new Date().toISOString(),'fetch','10','OK',String(i)]);for(let i=0;i<10&&!c.compactOperationalLogs_();i++);assert.equal(sheet.grid.length,11);assert.equal(sheet.grid[1][4],'300');assert.ok(s.archiveBooks.size>=3);c.compactOperationalLogs_();assert.equal(sheet.grid.length,11);
});
test('resúmenes de newsletters respetan destinatario y administración',()=>{
 const s=server(),c=s.c;const row=annotateFixtures(c,[article('snapshot')])[0];c.saveNewsletterEdition_('edition','delivery','reader@bbva.com','Enviada',{...query,view:'news',country:'España'},'es',[row],{cards:[{title:'Pagos digitales'}]});c.completeNewsletterEdition_('edition','Enviada');assert.equal(c.getNewsletterSummary('edition').count,1);s.setEmail('other@bbva.com');assert.throws(()=>c.getNewsletterSummary('edition'),/no disponible/);s.setEmail('reader@bbva.com');assert.deepEqual(plain(c.getNewsletterSummary('edition').topics),['Pagos digitales']);
});
test('interfaz elimina selección de cobertura y segmento y usa contenedores comunes',async t=>{
 const a=await app(t);assert.ok(a.find('#page-title').classList.contains('visually-hidden'));assert.equal(a.w.document.querySelector('#filters [name="segment"]'),null);assert.equal(a.w.document.querySelector('#filters [name="coverage"]'),null);assert.equal(a.w.document.querySelector('#radar-open-news'),null);await a.click('[data-view="subscriptions"]');assert.match(a.find('#subscriptions-section').textContent,/Mi Newsletter/);assert.equal(a.w.document.querySelector('#personal-editor [name="periodicity"]'),null);await a.click('[data-view="administration"]');assert.equal(a.find('#admin-tabs [aria-selected="true"]').dataset.adminView,'runs');assert.ok(a.find('#maintenance-progress'));await a.click('[data-admin-view="subscribers"]');await tick();assert.equal(a.w.document.querySelector('#install-newsletter'),null);assert.ok(a.find('#newsletter-test-form [name="cadence"]'));
});
test('el contador de medios unifica variantes del editor sin confundirlas con entidad mencionada',()=>{
 const s=server(),c=s.c;add(s,[article('a','2026-10-10',{medio:'BBVA'}),article('b','2026-10-11',{medio:'BBVA · Empresas',titular:'BBVA lanza autenticación biométrica empresarial'}),article('c','2026-10-12',{medio:'Otro editor',titular:'BBVA incorpora financiación sostenible para pymes'})]);const data=c.getDashboard({...query,view:'radar'});assert.equal(data.radar.summary.news,3);assert.equal(data.radar.publishers.find(row=>row.publisher==='BBVA').total,2);assert.equal(data.radar.ranking.find(row=>row.entity==='BBVA').total,3);assert.equal(data.sources.includes('BBVA · Empresas'),false);
});
test('el catálogo corporativo conserva identidades aunque compartan vocabulario y noticias',()=>{
 const common={palanca:'Integración y automatización',segments:['Empresas'],origin:'regla',df:61,tf:61},a={...common,key:'a',subpalanca:'Inteligencia artificial',terms:['ai','ia'],overlap:{b:61,c:61}},b={...common,key:'b',subpalanca:'Inteligencia artificial aplicada al canal',terms:['ai','ia','inteligencia artificial'],overlap:{a:61,c:61}},c={...common,key:'c',subpalanca:'APIs',terms:['api'],overlap:{a:61,b:61}};const result=taxonomyBuild({documents:100,candidates:{a,b,c}});assert.equal(result.length,3);assert.ok(result.some(row=>row.subpalanca==='Inteligencia artificial'));assert.ok(result.some(row=>row.subpalanca==='APIs'));
});
test('el resumen de una edición antigua usa como máximo tres titulares del snapshot sin consultar Noticias',()=>{
 const s=server(),c=s.c,rows=annotateFixtures(c,[article('a'),article('b'),article('c'),article('d')]);c.saveNewsletterEdition_('legacy','delivery','owner@bbva.com','Antigua',{from:'2026-10-01',to:'2026-10-15'},'es',rows,null);c.completeNewsletterEdition_('legacy','Enviada');s.c.newsSheet_().grid.splice(1);assert.equal(c.getNewsletterSummary('legacy').topics.length,3);
});
