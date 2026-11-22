import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {read,renderIncludes} from '../scripts/source.mjs';
import {storage} from './helpers/server.mjs';

test('digital exige una asignación con ID funcional y la elegibilidad conserva la relevancia BEI',()=>{
  const {c}=storage();
  c.initializeConfiguration();
  const block=c.configuration_().taxonomy[0],entry=block.functions[0];
  const items=[
    {id:'official',palanca:block.name,subpalanca:entry.id+'.'+entry.name},
    {id:'other',palanca:block.name,subpalanca:'01.xx Otros'},
    {id:'general',palanca:'Generalista',subpalanca:''}
  ];
  const ids=c.globalFunctionalIds_(items),has=values=>c.hasValidFunctionalAssignment_({ids:values},ids);
  assert.equal(has(['official']),true);
  assert.equal(has(['other','official']),true);
  assert.equal(has(['other','general','retired']),false);
  assert.equal(has([]),false);
  assert.throws(()=>c.hasValidFunctionalAssignment_({},ids),/Respuesta funcional inválida/);
  assert.throws(()=>has([null]),/Respuesta funcional inválida/);
  const eligible=(estado,digital)=>c.businessNews_({etiquetas:{estado,digital,capacidades:['Empresas: Pagos']}});
  assert.equal(eligible('relevante',false),true);
  assert.equal(eligible('no relevante',true),false);
});

test('un cambio del léxico EDC reinicia la clasificación pendiente con la misma configuración',()=>{
  const {c}=storage();
  c.initializeConfiguration();
  const sheet=c.newsSheet_(),keys=vm.runInContext('RADAR.sheets.Noticias',c);
  for(const id of ['processed','pending'])sheet.grid.push(keys.map(key=>key==='id'?id:''));
  c.requestNewsClassification_();
  const checkpoint=c.classificationJob_();
  c.writeClassificationJob_({...checkpoint,state:'En curso',next:3,classified:1});
  vm.runInContext(`const originalLexicon=EDCCatalogClassifier.getFunctionalLanguageLexicon;
    EDCCatalogClassifier.getFunctionalLanguageLexicon=()=>[...originalLexicon(),{language:'es',channel:['portal de prueba']}];
    functionalRuntimeRevisionMemory_=undefined;
    classificationRevisionMemory_=undefined;`,c);
  c.newsClassificationBatch_();
  const restarted=c.classificationJob_();
  assert.equal(restarted.state,'Pendiente');
  assert.equal(restarted.next,2);
  assert.equal(restarted.total,checkpoint.total);
  assert.equal(restarted.classified,0);
  assert.equal(restarted.version,checkpoint.version);
  assert.notEqual(restarted.revision,checkpoint.revision);
  assert.equal(restarted.revision,c.classificationRulesRevision_());
});

test('el HTML compilado mantiene los scriptlets fuera del JavaScript ejecutable',()=>{
  const template=read('dist/Index.html');
  assert.match(template,/<script type="application\/json" id="radar-bootstrap"><\?!= bootstrap; \?><\/script>/);
  const rendered=renderIncludes(template),scripts=[...rendered.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(JSON.parse(scripts.find(([,attrs])=>attrs.includes('radar-bootstrap'))[2]),null);
  for(const [,attrs,source] of scripts)if(!attrs.includes('application/json'))new vm.Script(source);
});

test('el backfill conserva el origen y no publica un lote fallido ni elimina generaciones',()=>{
  const {c,sheets,book,properties}=storage();
  c.initializeConfiguration();
  c.publishTaxonomy_({documents:0,candidates:{}});
  const title='BBVA lanza confirming del comprador con aplazamiento de pago de facturas en su banca digital para empresas',source=c.newsStorageKey_();
  const labels={schema:1,estado:'relevante',digital:false,capacidades:['Empresas: Financiación digital'],procedencia:{geografias:['México']}};
  const news=c.newsSheet_(),row={id:'historical',fecha:'2026-10-12',pais:'México',entidad:'BBVA',titular:title,url:'https://evidence.example/article',clasificacion:JSON.stringify(labels)};
  const keys=vm.runInContext('RADAR.sheets.Noticias',c);
  news.grid.push(keys.map(key=>row[key]||''));
  book.insertSheet('Noticias_tax_older');
  const backup=storage();
  book.copy=()=>{for(const sheet of book.getSheets())sheet.copyTo(backup.book).setName(sheet.getName());return backup.book;};
  c.startDigitalBackfill();
  assert.equal(c.taxonomyJob_().backup.id,backup.book.getId());
  c.taxonomyBatch_();
  const classify=c.taxonomyDecision;
  c.taxonomyDecision=()=>{throw Error('Timeout EDC');};
  c.taxonomyBatch_();
  assert.equal(c.taxonomyJob_().next,2);
  assert.equal(c.taxonomyJob_().state,'En pausa');
  assert.equal(c.newsStorageKey_(),source);
  assert.deepEqual(JSON.parse(news.grid[1][keys.indexOf('clasificacion')]),labels);
  c.taxonomyDecision=classify;
  c.taxonomyBatch_();
  assert.equal(c.taxonomyJob_().state,'Publicando',c.taxonomyJob_().error);
  for(let i=0;i<8&&c.taxonomyJob_().state==='Publicando';i++)c.dashboardSnapshotBatch_();
  const job=c.taxonomyJob_(),published=c.newsSheet_().grid[1],state=JSON.parse(published[keys.indexOf('clasificacion')]);
  assert.equal(job.state,'Completada',job.error);
  assert.notEqual(c.newsStorageKey_(),source);
  assert.equal(state.digital,true);
  assert.equal(job.digital,1);
  assert.equal(state.estado,labels.estado);
  assert.deepEqual(state.procedencia,labels.procedencia);
  assert.equal(published[keys.indexOf('id')],row.id);
  assert.equal(sheets.has('Noticias_tax_older'),true);
  assert.equal(JSON.parse(properties.DATA_GENERATION_ROLLBACK).newsSheet||'Noticias',source);
  c.startDigitalBackfill();
  assert.equal(c.taxonomyJob_().id,job.id);
});

test('una exclusión de relevancia editable solo afecta al idioma configurado',()=>{
  const {c}=storage();
  c.initializeConfiguration();
  const snapshot=JSON.parse(JSON.stringify(c.getConfiguration()));
  assert.ok(snapshot.relevanceLanguages.includes('ja'));
  const title=c.searchText_('BBVA lanza pagos digitales para empresas con campaña exclusiva');
  const relevant=language=>c.classification_(title,title,false,'',language).assessment.relevant;
  assert.equal(relevant('es'),true);
  snapshot.config.relevanceRules.push({name:'Campañas en español',role:'corporate',language:'es',terms:['campaña exclusiva'],enabled:true});
  c.saveConfiguration(snapshot);
  assert.equal(relevant('es-MX'),false);
  assert.equal(relevant('en'),true);
  assert.equal(relevant(''),true);
});
