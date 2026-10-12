import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {taxonomyPath} from '../src/shared/taxonomy-path.js';
import {storage} from './helpers/server.mjs';
import {taxonomyDefinitions,taxonomyObserve,taxonomyBuild,TAXONOMY_POLICY} from '../src/shared/taxonomy.js';
function server(titles=['BBVA lanza pagos biométricos para empresas','Santander incorpora pagos biométricos para particulares','BBVA lanza una API generativa','BBVA anuncia resultados financieros y dividendos']){
  const s=storage(),c=s.c;c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
  for(const [i,title] of titles.entries())s.sheets.get('Noticias').grid.push([String(i),'2026-10-10','España','Editor','BBVA',title,'Nueva experiencia digital para empresas y particulares','Pagos','https://example.com/'+i,'','Editor','es',JSON.stringify({generalista:true,digital:true,capacidades:[]}), '']);
  return s;
}
function finish(c){for(let i=0;i<100&&c.taxonomyPending_();i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Completada',c.taxonomyJob_().error);}
test('TF-IDF suavizado genera subpalancas recurrentes con reglas y vocabulario acotado',()=>{
  const rules=taxonomyDefinitions({Empresas:[{name:'Pagos digitales',terms:['pagos'],enabled:true}],Retail:[]}),state={documents:0,candidates:{}},excluded=new Set(['bbva','santander']);
  taxonomyObserve(state,'bbva pagos biometricos pagos biometricos',rules,excluded);taxonomyObserve(state,'santander pagos biometricos',rules,excluded);
  const model=taxonomyBuild(state),emerging=model.find(row=>row.subpalanca==='Pagos biometricos');assert.ok(emerging);assert.equal(emerging.df,2);assert.equal(emerging.peso,Number(((2+Math.log(2))/2).toFixed(6)));assert.equal(emerging.origin,'tf-idf');assert.ok(!model.some(row=>row.subpalanca.includes('bbva')));
  assert.equal(taxonomyObserve(state,'resultados corporativos',rules,excluded),false);
  for(let i=0;i<700;i++)taxonomyObserve(state,'pagos variante'+i,rules,excluded);
  assert.ok(Object.keys(state.candidates).length<=TAXONOMY_POLICY.maxCandidates+rules.length);assert.ok(taxonomyBuild(state).filter(row=>row.origin==='tf-idf').length<=7*TAXONOMY_POLICY.maxEmergingPerLever);
});
test('analiza todo el histórico, crea etiquetas estables y no escribe noticias ni catálogo en una repetición idéntica',()=>{
  const {c,sheets}=server();c.startTaxonomy();finish(c);
  const status=c.getTaxonomyStatus();assert.equal(status.job.processed,8);assert.equal(status.job.total,4);assert.ok(status.items.some(row=>row.subpalanca==='Pagos biometricos'));
  const labels=c.rows_('Noticias').map(row=>c.taxonomySaved_(row.taxonomia));assert.ok(labels[0].ids.length);assert.equal(labels[3].ids.length,0);
  const first=JSON.stringify(sheets.get('Noticias').grid),writes=[],catalogWrites=[],range=sheets.get('Noticias').getRange,catRange=sheets.get('Taxonomia').getRange;
  sheets.get('Noticias').getRange=(...args)=>{const value=range(...args),set=value.setValues;value.setValues=rows=>{writes.push(args);return set(rows);};return value;};
  sheets.get('Taxonomia').getRange=(...args)=>{const value=catRange(...args),set=value.setValues;value.setValues=rows=>{catalogWrites.push(args);return set(rows);};return value;};
  c.startTaxonomy();finish(c);assert.equal(c.getTaxonomyStatus().job.tagged,0);assert.deepEqual(writes,[]);assert.deepEqual(catalogWrites,[]);assert.equal(JSON.stringify(sheets.get('Noticias').grid),first);
});
test('el modelo cambia con contenido nuevo sin reescribir etiquetas intactas; filtros y newsletters usan la misma taxonomía',()=>{
  const {c,sheets}=server();c.startTaxonomy();finish(c);const prior=sheets.get('Noticias').grid[1][13],items=c.taxonomyCatalog_(),payment=items.find(row=>row.subpalanca==='Pagos biometricos'),query={palanca:payment.palanca,subpalanca:taxonomyPath(payment)};
  assert.equal(c.selectNews_(c.rows_('Noticias'),query).length,2);assert.deepEqual(Object.keys(c.selectNews_(c.rows_('Noticias'),query)[0].taxonomia[0]).sort(),['id','palanca','subpalanca']);assert.equal(c.newsDashboard_(c.rows_('Noticias'),{},[],'news').subpalanca.includes(query.subpalanca),true);
  const subscription=c.subscriptionRecord_({name:'Pagos',filters:query},'user@bbva.com','id',new Date(),0);assert.equal(subscription.filtros.subpalanca,query.subpalanca);assert.throws(()=>c.subscriptionRecord_({name:'Inválida',filters:{palanca:'Inventada'}},'user@bbva.com','id',new Date(),0),/taxonomía/);
  c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';const newsletter=c.newsletter_(c.rows_('Noticias'),query,'Pagos digitales',new Date(),'id');assert.equal(newsletter.count,2);assert.ok(newsletter.html.includes(query.subpalanca));assert.ok(newsletter.text.includes(query.subpalanca));
  sheets.get('Noticias').grid.push(['new','2026-10-11','España','Editor','BBVA','BBVA lanza API avanzada','','','https://example.com/new','','Editor','es','', '']);c.invalidateNews_();c.startTaxonomy();finish(c);assert.equal(sheets.get('Noticias').grid[1][13],prior);assert.ok(c.taxonomySaved_(sheets.get('Noticias').grid.at(-1)[13]).ids.length);
  sheets.get('Noticias').grid[1][5]='BBVA lanza IA generativa';c.invalidateNews_();c.startTaxonomy();finish(c);assert.notEqual(sheets.get('Noticias').grid[1][13],prior);
});
test('programación única, autorización, petición durable y recuperación diaria prioritaria',()=>{
  const s=server(Array.from({length:250},()=> 'BBVA lanza una API para empresas')),c=s.c;c.initializeConfiguration();assert.equal(c.scheduledTriggers_('dailyTaxonomy_').length,1);assert.equal(c.scheduledTriggers_('dailyTaxonomy_')[0].minute,45);
  const locks=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.dailyTaxonomy_();assert.equal(c.processBackground_().busy,true);assert.ok(s.properties.TAXONOMY_REQUEST);c.LockService=locks;
  const feed=c.feeds_()[0],keys=vm.runInContext('RADAR.sheets.Recargas',c),job={id:'daily',tipo:'daily',inicio:new Date().toISOString(),estado:'Pendiente',total:7,pendientes:7};s.sheets.get('Recargas').grid.push(keys.map(key=>job[key]||''));
  for(let i=0;i<7;i++)s.sheets.get('Recopilacion').grid.push(['daily',feed.name,feed.url,'Pendiente',0,'',0,0,'','2026-10-12']);
  c.collectionBatch_=work=>{for(const task of work.pending)s.sheets.get('Recopilacion').grid[task.row-1][3]='Completada';c.collectionSnapshots_(work.tasks,work.jobs);return {added:0,errors:[]};};
  const phases=[],taxonomy=c.taxonomyBatch_;c.taxonomyBatch_=ms=>{phases.push('taxonomy');return taxonomy(ms);};c.processBackground_();assert.deepEqual(phases,[]);assert.ok(s.properties.TAXONOMY_REQUEST);
  c.processBackground_();assert.ok(phases.length);assert.equal(s.properties.TAXONOMY_REQUEST,undefined);finish(c);
  s.setEmail('reader@bbva.com');assert.throws(()=>c.startTaxonomy(),/administrador/);assert.throws(()=>c.getTaxonomyStatus(),/administrador/);
});
test('fallos de escritura conservan el cursor y las etiquetas existentes; una modificación de corpus reinicia el análisis',()=>{
  const {c,sheets}=server();c.startTaxonomy();c.taxonomyBatch_();c.taxonomyBatch_();assert.equal(c.taxonomyJob_().phase,'tag');
  const sheet=sheets.get('Noticias'),range=sheet.getRange;sheet.getRange=(...args)=>{const result=range(...args);if(args[1]===14)result.setValues=()=>{throw Error('Escritura temporal');};return result;};
  c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'En pausa');assert.equal(c.taxonomyJob_().next,2);assert.match(c.taxonomyJob_().error,/Escritura/);
  sheet.getRange=range;c.startTaxonomy();finish(c);assert.ok(c.taxonomySaved_(sheet.grid[1][13]).ids.length);
  c.startTaxonomy();c.taxonomyBatch_();const id=c.taxonomyJob_().id;c.invalidateNews_();c.taxonomyBatch_();assert.notEqual(c.taxonomyJob_().id,id);assert.equal(c.taxonomyJob_().next,2);finish(c);
});

test('las noticias nuevas se etiquetan con el modelo vigente durante la incorporación y los lotes no leen todo el corpus',()=>{
 const {c,sheets}=server();c.startTaxonomy();finish(c);const row=c.newsRecord_({date:new Date(),title:'BBVA lanza pagos biométricos',excerpt:'Para empresas',topic:'Pagos',url:'https://example.com/new',labels:{digital:true,generalista:true,capacidades:[]}},c.feeds_()[0],new Date());
 assert.ok(c.taxonomySaved_(row[13]).ids.length);
 for(let i=0;i<260;i++)sheets.get('Noticias').grid.push([...row.slice(0,13),'']);c.invalidateNews_();const reads=[],sheet=sheets.get('Noticias'),get=sheet.getRange;sheet.getRange=(...args)=>{reads.push(args);return get(...args);};c.startTaxonomy();finish(c);assert.ok(reads.every(args=>args[2]<=100));assert.equal(c.taxonomyJob_().processed,528);
});

test('la taxonomía cede también a recuperación anual disponible y los fallos parciales no pierden contadores ni etiquetas',()=>{
 const {c,sheets,properties}=server(Array.from({length:5},()=> 'BBVA lanza una API para empresas'));c.startTaxonomy();finish(c);
 for(const index of [1,3,5])sheets.get('Noticias').grid[index][5]='BBVA lanza IA generativa';c.invalidateNews_();c.startTaxonomy();c.taxonomyBatch_();c.taxonomyBatch_();
 properties.BACKGROUND_LAST='classification';assert.equal(c.backgroundTask_({pending:[{ciclo:'annual'}]},false),'collection');
 const sheet=sheets.get('Noticias'),range=sheet.getRange;sheet.getRange=(...args)=>{const result=range(...args);if(args[1]===14&&args[0]===4)result.setValues=()=>{throw Error('Segundo bloque temporal');};return result;};
 c.taxonomyBatch_();assert.equal(c.taxonomyJob_().next,2);assert.equal(c.taxonomyJob_().tagged,1);assert.equal(c.taxonomyJob_().state,'En pausa');const first=sheet.grid[1][13];sheet.getRange=range;c.startTaxonomy();finish(c);assert.equal(c.taxonomyJob_().tagged,3);assert.equal(sheet.grid[1][13],first);
});
