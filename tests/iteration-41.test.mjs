import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {readingWindow,newsletterWindow} from '../src/shared/newsletter-cadences.js';
function server(day='2026-11-02'){const s=storage();s.c.Date=class extends Date{constructor(...args){super(...(args.length?args:[day+'T12:00:00Z']));}};s.c.initializeConfiguration();return s;}
for(const [day,from] of [['2026-11-02','2026-08-02'],['2024-05-31','2024-02-29'],['2025-05-31','2025-02-28'],['2024-02-29','2023-11-29'],['2027-01-01','2026-10-01']])test('tres meses inclusivos con ajuste de fin de mes '+day,()=>assert.deepEqual(readingWindow('news',day),{from,to:day}));
for(const day of ['2024-02-29','2026-03-29','2026-10-25','2027-01-01'])test('días naturales sin dependencia de DST '+day,()=>{for(const [view,days] of [['briefing',15],['radar',365]]){const {from,to}=readingWindow(view,day);assert.equal((Date.parse(to)-Date.parse(from))/86400000+1,days);}});
for(const view of ['briefing','news','radar'])test('API '+view+' conserva vacío, fechas y contadores sin recurrir al pasado',()=>{
 const s=server(),c=s.c,period=c.dashboardPeriod_(view),date=new Date(Date.parse(period.from)-86400000).toISOString().slice(0,10),row={id:'previous',fecha:date,pais:'España',medio:'Editor',entidad:'BBVA',titular:'BBVA lanza pagos digitales para empresas',extracto:'Nueva solución para pymes',url:'https://editor.test/previous',clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}'};
 s.sheets.get('Noticias').grid.push(vm.runInContext('RADAR.sheets.Noticias',c).map(key=>row[key]||''));
 for(const query of [{view,initial:true},{view},{view,...period},{view,...period,page:1}]){const data=c.getDashboard(query);assert.equal(data.selection.from,period.from);assert.equal(data.selection.to,period.to);assert.equal(data.context.periodFallback,false);assert.equal(data.contextTotal,0);assert.equal(data.items.length,0);}
 const historic=c.getDashboard({view,from:date,to:date});assert.equal(historic.contextTotal,1);
});
for(const day of ['2026-11-01','2026-11-02'])test('prueba quincenal pendiente antes del envío '+day,()=>{
 const {c}=server(day),now=new Date(day+'T07:00:00Z'),query=c.newsletterTestQuery_('fortnightly','España',now,[]);assert.equal(query.from,'2026-10-16');assert.equal(query.to,'2026-10-31');
 for(const estado of ['Enviando','Enviada','Revisar','Sin novedades','No enviado']){const next=c.newsletterTestQuery_('fortnightly','España',now,[{suscripcion:'sub',desde:query.from,hasta:query.to,estado}]);assert.equal(next.from,'2026-11-01');assert.equal(next.to,'2026-11-15');}
 assert.equal(c.newsletterTestQuery_('fortnightly','España',now,[{suscripcion:'',desde:query.from,hasta:query.to,estado:'Enviada'}]).from,query.from);
});
for(const day of ['2026-04-01','2027-01-01','2026-10-25'])test('prueba trimestral conserva calendario natural '+day,()=>{const {c}=server(day),q=c.newsletterTestQuery_('quarterly','',new Date(day+'T12:00:00Z'),[]),p=newsletterWindow('quarterly',day,true);assert.deepEqual({from:q.from,to:q.to},{from:p.from,to:p.to});});
test('identidad editorial por host evita colisión de marcas y mantiene iconos independientes',()=>{
 const {c}=server(),index=c.businessIndex_();index.publisherCountries.set('expansion','España');index.verifiedMedia=[{name:'Expansión',domain:'expansion.com',iso2:'ES'},{name:'Expansión México',domain:'expansion.mx',iso2:'MX'}];
 assert.equal(c.editorialCountry_('https://www.expansion.com','Expansión',index).country,'España');assert.equal(c.editorialCountry_('https://expansion.mx','Expansión',index).country,'México');assert.equal(c.editorialCountry_('https://unconfigured.test','Expansión',index).country,'');
 assert.equal(c.configuredPublisher_('https://expansion.mx',index),'Expansión México');assert.equal(c.configuredPublisher_('https://other.expansion.mx',index),'');
 c.taxonomyCatalog_=()=>[];c.effectiveTaxonomyAssignment_=()=>({ids:[]});const annotated=c.annotateNews_([{medio:'Expansión',pais:'México',entidad:'BBVA',clasificacion:JSON.stringify({digital:true,capacidades:[],procedencia:{dominioMedio:'expansion.mx'}})}]);assert.equal(annotated[0].medio,'Expansión México');
 assert.notEqual(c.identityAsset('publishers','expansion.com').id,c.identityAsset('publishers','expansion.mx').id);
 assert.match(c.identityMark('publishers','Expansión México',x=>x),/data:image\/png;base64,/);
 const feeds=c.configuredFeeds_().filter(row=>row.domain==='expansion.mx');assert.equal(feeds.length,1);assert.equal(feeds[0].country,'México');
});
test('snapshot de periodo antiguo nunca sustituye al rango vigente',()=>{const {c}=server();const query=c.dashboardQuery_({view:'news',initial:true});c.dashboardSnapshotManifest_=()=>({revision:c.dashboardSnapshotRevision_('news'),schema:vm.runInContext('NEWS_CACHE.schema',c),period:{from:'2026-07-01',to:'2026-09-30'},periodFallback:true});assert.equal(c.defaultDashboardSnapshot_('news',query,'es'),null);});

test('ingesta RSS conserva identidad mexicana aunque el item comparta marca con España',()=>{
 const {c}=server(),feed=c.configuredFeeds_().find(row=>row.domain==='expansion.mx');c.taxonomyRecord_=()=>[];
 const item={title:'Una noticia sobre España',excerpt:'Texto',url:'https://expansion.mx/noticia',publisher:'Expansión',date:new Date('2026-11-02T10:00:00Z'),labels:{},geography:{country:'España',geographies:['España'],scope:'country',reason:'content',confidence:'high',countryEvidence:[]}};
 const values=c.newsRecord_(item,feed,new Date('2026-11-02T12:00:00Z')),row=Object.fromEntries(vm.runInContext('RADAR.sheets.Noticias',c).map((key,i)=>[key,values[i]])),provenance=JSON.parse(row.clasificacion).procedencia;
 assert.equal(row.medio,'Expansión México');assert.equal(provenance.dominioMedio,'expansion.mx');assert.equal(provenance.paisMedio,'México');assert.equal(row.pais,'España');
});
test('el desglose agregado de recopilación cabe completo en telemetría sin cambiar otros límites',()=>{
 const {c}=server(),detail='fase '.repeat(150)+'; '+JSON.stringify({runId:'fixture',persistence:{snapshots:12,flush:3}});c.telemetry_('recopilacion',100,'OK',detail);c.telemetry_('dashboard',1,'OK',detail);
 const log=c.rows_('Telemetria');assert.match(log.find(row=>row.operacion==='recopilacion').detalle,/"flush":3/);assert.equal(log.find(row=>row.operacion==='dashboard').detalle.length,300);
});

for(const [selection,year] of [[{from:'2025-11-03',to:'2026-11-02'},'2025'],[{from:'2025-01-01',to:'2025-12-31'},'']])test('Radar cambia entre ventana móvil e histórico sin arrastrar fechas '+year,async t=>{
 const a=await app(t,{configure({data}){data.selection=selection;data.years=['2026','2025'];}});await a.click('[data-view="radar"]');
 assert.equal(a.find('#filters').elements.year.value,selection.to.endsWith('-12-31')?'2025':'');
 await a.change('#filters [name="year"]',year);const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.year,year);assert.equal(query.from,'');assert.equal(query.to,'');
});
test('un lote vacío registra fases completas y estados sin logs por noticia',()=>{
 const s=server(),c=s.c,feed=c.configuredFeeds_().find(row=>row.domain==='expansion.mx'),job={id:'fixture-cycle',tipo:'daily',desde:'2026-10-31',hasta:'2026-11-02',inicio:'2026-11-02T06:00:00Z',estado:'Pendiente',total:1,pendientes:1};
 s.sheets.get('Recargas').grid.push(vm.runInContext('RADAR.sheets.Recargas',c).map(key=>job[key]||''));s.sheets.get('Recopilacion').grid.push([job.id,feed.name,feed.url,'Pendiente',0,'',0,0,'',job.hasta]);
 s.properties.BACKGROUND_RUN_ID='fixture-run';c.collectionTaskFeed_=()=>feed;c.fetchFeedBatch_=()=>[{response:{}}];c.ingestFeed_=()=>({news:[],audit:[],candidates:[],evaluated:0,inside:0});
 const result=c.collectionBatch_(c.collectionWork_(Date.now())),detail=c.rows_('Telemetria').find(row=>row.operacion==='recopilacion').detalle,metrics=JSON.parse(detail.slice(detail.indexOf('{"runId"')));
 assert.equal(result.added,0);assert.equal(metrics.runId,'fixture-run');assert.equal(metrics.planned,1);assert.equal(metrics.completed,1);assert.equal(metrics.evaluated,0);for(const key of ['candidates','coverage','news','media','audit','children','tasks','runs','snapshots','flush','status'])assert.ok(metrics.persistence[key]>=0,key);assert.equal(c.rows_('Recopilacion')[0].estado,'Completada');
});
