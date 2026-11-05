import {drainSnapshots} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {TestDate} from './helpers/clock.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
function server(){const s=storage();s.c.Date=TestDate;s.c.initializeConfiguration();return s;}
function add(s,id,date,country='España',changes={}){
 const row={id,fecha:date,pais:country,medio:'Editor',entidad:'BBVA',titular:'BBVA lanza plataforma de pagos digitales para empresas '+id,extracto:'Nueva solución de tesorería para pymes.',url:'https://editor.test/'+id,fuente:'Editor',idioma:'es',clasificacion:'{"digital":true,"generalista":true,"capacidades":["Empresas: Pagos"]}',...changes};
 s.sheets.get('Noticias').grid.push(vm.runInContext('RADAR.sheets.Noticias',s.c).map(key=>row[key]||''));s.c.invalidateNews_();
}
function build(s){for(let i=0;i<3;i++)s.c.dashboardSnapshotBatch_();assert.equal(s.c.dashboardSnapshotsPending_(),false);}
for(const view of ['briefing','news','radar'])test('snapshot '+view+' coincide con el cálculo y sobrevive a la pérdida completa de caché',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');add(s,'mx','2026-10-09','México');
 const before=c.getDashboard({view,initial:true,language:'en',newsGeography:'México'});build(s);s.cache.clear();
 c.cachedNewsRecords_=()=>{throw Error('No debe leer ni clasificar noticias');};
 const after=c.getDashboard({view,initial:true,language:'en',newsGeography:'México'});
 assert.equal(c.getDashboard({...after.selection,view,language:'en'}).performance.snapshotHit,true);
 assert.equal(after.performance.snapshotHit,true);for(const key of ['items','total','contextTotal','radar','briefing','newsGeography','selection'])assert.deepEqual(clean(after[key]??null),clean(before[key]??null));
});
for(const view of ['briefing','news','radar'])test('snapshot '+view+' mantiene el rango vacío aunque haya noticias anteriores',()=>{
 const s=server(),c=s.c,period=c.dashboardPeriod_(view,new TestDate());add(s,'previous',new Date(Date.parse(period.from)-86400000).toISOString().slice(0,10));build(s);
 const result=c.getDashboard({view,initial:true});assert.equal(result.performance.snapshotHit,true);assert.equal(result.context.periodFallback,false);assert.equal(result.selection.from,period.from);assert.equal(result.contextTotal,0);
});
test('los filtros explícitos y las páginas fuera del límite no reciben el snapshot por defecto',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');build(s);
 for(const query of [{view:'news',entity:'Santander'},{view:'news',from:'2026-01-01',to:'2026-12-31'},{view:'news',page:3}])assert.equal(c.getDashboard(query).performance.snapshotHit,false);
});
test('cada revisión solicita publicación sin servir el snapshot obsoleto',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');build(s);const q=c.dashboardQuery_({view:'news',initial:true});
 for(const key of ['CONFIG_REVISION','NEWS_REVISION','TAXONOMY_REVISION','TAXONOMY_TRANSLATIONS_REVISION','TRANSLATIONS_REVISION:tr']){
  const old=s.properties[key];s.properties[key]='changed';assert.equal(c.defaultDashboardSnapshot_('news',q,'es'),null);assert.equal(s.properties.DASHBOARD_SNAPSHOT_REQUEST,'pending');if(old===undefined)delete s.properties[key];else s.properties[key]=old;
 }
 assert.notEqual(c.dashboardSnapshotRevision_('news',new TestDate()),c.dashboardSnapshotRevision_('news',new TestDate('2027-01-01')));
});
test('un fragmento corrupto se descarta y solicita regeneración; nunca se publica una generación parcial',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');build(s);const manifest=c.dashboardSnapshotManifest_('news');s.sheets.get('DashboardSnapshots').grid[manifest.first-1][3]='corrupt';s.cache.clear();
 assert.equal(c.defaultDashboardSnapshot_('news',c.dashboardQuery_({view:'news',initial:true}),'es'),null);assert.equal(s.properties.DASHBOARD_SNAPSHOT_REQUEST,'pending');
 for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();
 const regenerated=c.dashboardSnapshotManifest_('briefing');assert.ok(regenerated.digest);
});
test('los jobs completados solicitan snapshots y el watchdog recupera snapshots pendientes',()=>{
 const s=server(),c=s.c;assert.equal(c.backgroundStageComplete_('collection',{jobs:[{pendientes:1}]}),false);assert.equal(c.backgroundStageComplete_('collection',{jobs:[{pendientes:0}]}),true);
 assert.equal(c.backgroundStageComplete_('newsletter',{}),true);c.classificationPending_=()=>false;c.classificationReadyAt_=()=>Infinity;
 c.requestDashboardSnapshots_(true);assert.equal(c.backgroundTask_({jobs:[],pending:[]},false),'snapshot');build(s);delete s.properties.BACKGROUND_PENDING;c.scheduledTriggers_('backgroundTick_').forEach(c.ScriptApp.deleteTrigger);c.backgroundWatchdog_();
 add(s,'new','2026-10-11');c.backgroundWatchdog_();assert.equal(s.properties.BACKGROUND_PENDING,'true');
});

test('el trabajador genera las tres vistas al completar un job, conserva resultados y drena la petición',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');c.requestNewsClassification_(true);c.translationReadyAt_=()=>Infinity;c.taxonomyReadyAt_=()=>Infinity;c.taxonomyTranslationReadyAt_=()=>Infinity;c.newsletterReadyAt_=()=>Infinity;c.maintenanceReadyAt_=()=>Infinity;
 c.processBackground_(5);drainSnapshots(c);assert.equal(c.classificationJob_().state,'Completada');assert.equal(c.dashboardSnapshotsPending_(),false);assert.equal(s.properties.DASHBOARD_SNAPSHOT_REQUEST,undefined);for(const view of ['briefing','news','radar'])assert.equal(c.getDashboard({view,initial:true}).performance.snapshotHit,true);
});

test('Radar comparte un snapshot entre idiomas y geografías tanto en caliente como al recuperar de Sheets',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');build(s);
 const revision=c.dashboardSnapshotManifest_('radar').revision;
 const prefix='dashboard-snapshot:'+revision+':';
 const keys=()=>[...s.cache.keys()].filter(key=>key.startsWith(prefix)&&!key.slice(prefix.length).includes('::'));
 assert.deepEqual(keys(),[prefix+'es:']);
 const query={...c.dashboardQuery_({view:'radar',initial:true}),newsGeography:'México'};
 const warm=c.defaultDashboardSnapshot_('radar',query,'en');
 assert.ok(warm);assert.deepEqual(keys(),[prefix+'es:']);
 s.cache.clear();
 const cold=c.defaultDashboardSnapshot_('radar',query,'tr');
 assert.deepEqual(clean(cold),clean(warm));assert.deepEqual(keys(),[prefix+'es:']);
});

test('Novedades conserva las variantes de idioma y comparte caché entre geografías',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');build(s);
 const revision=c.dashboardSnapshotManifest_('briefing').revision;
 const prefix='dashboard-snapshot:'+revision+':';
 const query=c.dashboardQuery_({view:'briefing',initial:true});
 const keys=()=>[...s.cache.keys()].filter(key=>key.startsWith(prefix)&&!key.slice(prefix.length).includes('::')).sort();
 const expected=['en','es','tr'].map(language=>prefix+language+':');
 assert.deepEqual(keys(),expected);
 for(const language of ['es','en','tr'])assert.ok(c.defaultDashboardSnapshot_('briefing',{...query,newsGeography:'México'},language));
 assert.deepEqual(keys(),expected);
});

test('Noticias pagina el snapshot con el mismo orden y totales que la consulta dinámica',()=>{
 const s=server(),c=s.c;
 c.settings_().pageSize=2;
 for(let i=0;i<8;i++)add(s,'n'+i,'2026-10-'+String(10-i).padStart(2,'0'),'España',{entidad:i%2?'BBVA':'Santander'});
 const query={view:'news',newsGeography:'España',language:'es'};
 const baseline=[0,1,2].map(page=>c.getDashboard({...query,page}));
 build(s);s.cache.clear();
 for(let page=0;page<3;page++){
  const result=c.getDashboard({...query,page});
  assert.equal(result.performance.snapshotHit,true);assert.equal(result.page,page);
  for(const key of ['items','page','total','contextTotal','newsGeography'])assert.deepEqual(clean(result[key]),clean(baseline[page][key]));
 }
});

test('un snapshot previo a la ampliación conserva la primera página y delega las siguientes sin leer fragmentos',()=>{
 const s=server(),c=s.c;add(s,'es','2026-10-10');build(s);
 const manifest=c.dashboardSnapshotManifest_('news');delete manifest.pageCount;s.cache.clear();
 const query=c.dashboardQuery_({view:'news',initial:true});
 assert.ok(c.defaultDashboardSnapshot_('news',query,'es'));
 s.cache.clear();
 s.sheets.get('DashboardSnapshots').getRange=()=>{throw Error('No debe hidratar un snapshot de una sola página');};
 assert.equal(c.defaultDashboardSnapshot_('news',{...query,page:1},'es'),null);
 assert.equal(s.properties.DASHBOARD_SNAPSHOT_CORRUPT,undefined);
});
