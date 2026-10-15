import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){
  const s=storage(),c=s.c;c.initializeConfiguration();
  for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
  const rows=[{id:'one',palanca:'Pagos y cobros',subpalanca:'Pagos biometricos',segmentos:['Empresas'],terminos:['pagos biometricos'],noticias:2,peso:1,origen:'tf-idf'},{id:'two',palanca:'Pagos y cobros',subpalanca:'Pagos recurrentes',segmentos:['Retail'],terminos:['pagos recurrentes'],noticias:2,peso:1,origen:'regla'}];
  s.sheets.get('Taxonomia').grid.push(...rows.map(row=>vm.runInContext('RADAR.sheets.Taxonomia',c).map(key=>Array.isArray(row[key])?JSON.stringify(row[key]):row[key])));
  s.properties.TAXONOMY_REVISION='one';let calls=[];c.LanguageApp={translate(name,source,language){calls.push({name,source,language});return language+' '+name;}};
  return {...s,calls,rows};
}
function finish(c){for(let i=0;i<20;i++){c.taxonomyTranslationBatch_();if(c.taxonomyTranslationJob_().state==='Completada')return;}assert.fail(JSON.stringify(c.taxonomyTranslationJob_()));}
test('traduce cada nombre único a los idiomas soportados, reutiliza resultados y mantiene IDs y etiquetas',()=>{
  const s=server(),c=s.c,news=JSON.stringify(s.sheets.get('Noticias').grid),catalog=JSON.stringify(s.sheets.get('Taxonomia').grid);
  c.startTaxonomyTranslations();finish(c);assert.equal(c.taxonomyTranslationJob_().total,9);assert.equal(s.calls.length,6);assert.deepEqual([...new Set(s.calls.map(row=>row.language))],['es','en','tr']);assert.ok(s.calls.every(row=>row.source===''));
  assert.equal(c.taxonomyTranslations_().tr['Pagos y cobros › Pagos biometricos'],'Ödemeler ve tahsilatlar › tr Pagos biometricos');
  assert.equal(JSON.stringify(s.sheets.get('Noticias').grid),news);assert.equal(JSON.stringify(s.sheets.get('Taxonomia').grid),catalog);assert.equal(s.properties.NEWS_CONTENT_REVISION,undefined);
  const stored=JSON.stringify(s.sheets.get('TaxonomiaTraducciones').grid),revision=s.properties.NEWS_REVISION;c.startTaxonomyTranslations();finish(c);
  assert.equal(s.calls.length,6);assert.equal(c.taxonomyTranslationJob_().translated,0);assert.equal(JSON.stringify(s.sheets.get('TaxonomiaTraducciones').grid),stored);assert.equal(s.properties.NEWS_REVISION,revision);
  c.writeTranslationJob_({state:'Completada',calls:3000,callDay:c.recordDay(new Date(),c.settings_().timezone)});c.startTaxonomyTranslations();assert.ok(c.taxonomyTranslationReadyAt_()<=Date.now());finish(c);assert.equal(s.calls.length,6);
  c.LanguageApp={translate(){throw Error('No se traduce en lecturas');}};assert.ok(c.getTaxonomyStatus().taxonomyTranslations.en['Pagos biometricos']);
});
test('traduce solo nombres nuevos y elimina traducciones fuera del catálogo vigente',()=>{
  const s=server(),c=s.c;c.startTaxonomyTranslations();finish(c);
  s.sheets.get('Taxonomia').grid[2][2]='Pagos instantaneos';s.properties.TAXONOMY_REVISION='two';c.requestTaxonomyTranslations_();finish(c);
  assert.equal(s.calls.length,9);assert.equal(c.rows_('TaxonomiaTraducciones').length,9);assert.ok(!c.taxonomyTranslations_().en['Pagos recurrentes']);assert.equal(c.taxonomyTranslations_().en['Pagos biometricos'],'en Pagos biometricos');
});
test('un error conserva traducciones parciales y cursor; el lanzamiento manual reanuda la misma línea',()=>{
  const s=server(),c=s.c;let fail=true;c.LanguageApp={translate(name,_source,language){if(language==='en'&&fail)throw Error('Temporal');return language+' '+name;}};
  c.startTaxonomyTranslations();c.taxonomyTranslationBatch_();const failed=c.taxonomyTranslationJob_();assert.equal(failed.state,'En pausa');assert.equal(failed.processed,1);assert.equal(c.rows_('TaxonomiaTraducciones').length,1);
  assert.ok(c.taxonomyTranslationReadyAt_()>Date.now());fail=false;c.startTaxonomyTranslations();finish(c);assert.equal(c.rows_('TaxonomiaTraducciones').length,9);assert.equal(c.taxonomyTranslationJob_().translated,9);
  s.setEmail('reader@bbva.com');assert.throws(()=>c.startTaxonomyTranslations(),/no autorizado/);assert.throws(()=>c.getTaxonomyTranslationStatus(),/no autorizado/);
});
test('presupuesto compartido con noticias y lotes acotados; no monopoliza ni compite con recuperación',()=>{
  const s=server(),c=s.c,today=c.recordDay(new Date(),c.settings_().timezone);
  c.writeTranslationJob_({state:'Completada',calls:2999,callDay:today});c.startTaxonomyTranslations();c.taxonomyTranslationBatch_();assert.equal(s.calls.length,1);assert.equal(c.translationCallsToday_(),3000);assert.equal(c.taxonomyTranslationJob_().state,'En pausa');assert.ok(c.taxonomyTranslationReadyAt_()>Date.now());assert.equal(c.translationReadyAt_(),Infinity);
  c.writeTranslationJob_({state:'Completada',calls:0,callDay:today});finish(c);assert.equal(s.calls.length,6);
  c.writeTaxonomyTranslationJob_({...c.taxonomyTranslationJob_(),state:'Pendiente'});const annual={pending:[{ciclo:'annual'}],jobs:[{id:'annual',tipo:'year'}]};assert.equal(c.backgroundTask_(annual,false),'taxonomyTranslation');assert.equal(c.backgroundTask_(annual,true),'collection');
  c.writeTaxonomyJob_({state:'En curso'});assert.equal(c.taxonomyTranslationReadyAt_(),Infinity);
});
test('finalizar taxonomía encola traducción automáticamente y los lectores utilizan nombres guardados',()=>{
  const s=server(),c=s.c;c.startTaxonomy();for(let i=0;i<10&&c.taxonomyPending_();i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Completada');assert.ok(s.properties.TAXONOMY_TRANSLATION_REQUEST);
  // Reuse a classified article without changing its canonical taxonomy labels.
  const model=s.rows; s.sheets.get('Taxonomia').grid.splice(1);s.sheets.get('Taxonomia').grid.push(...model.map(row=>vm.runInContext('RADAR.sheets.Taxonomia',c).map(key=>Array.isArray(row[key])?JSON.stringify(row[key]):row[key])));s.properties.TAXONOMY_REVISION='reader';finish(c);
  const row={id:'news',fecha:'2026-10-11',pais:'España',medio:'Editor',entidad:'BBVA',titular:'BBVA lanza pagos biometricos para empresas',extracto:'Nuevo canal digital',tema:'Pagos',url:'https://example.com/news',capturada:'',fuente:'Editor',idioma:'es',clasificacion:JSON.stringify({generalista:true,digital:true,capacidades:["Empresas: Pagos"]}),taxonomia:JSON.stringify({fingerprint:'test',ids:['one']})};
  s.sheets.get('Noticias').grid.push(vm.runInContext('RADAR.sheets.Noticias',c).map(key=>row[key]||''));
  c.LanguageApp={translate(){throw Error('Los lectores no traducen');}};
  const query={view:'news',from:'2026-01-01',to:'2026-12-31',entity:'BBVA',palanca:'Pagos y cobros',subpalanca:'Pagos y cobros › Pagos biometricos',language:'en'};
  const data=c.getDashboard(query);assert.equal(data.total,1);assert.equal(data.items[0].taxonomia[0].id,'one');assert.equal(data.taxonomyTranslations.en[query.subpalanca],'Payments and collections › en Pagos biometricos');
  assert.match(c.exportNews(query).csv,/en Pagos biometricos/);
  const mail=c.newsletter_(c.rows_('Noticias'),query,'News',new Date(),undefined,'en');assert.match(mail.html,/en Pagos biometricos/);assert.match(mail.text,/en Pagos biometricos/);
});
test('una diaria recibida durante la llamada detiene el lote tras guardar el resultado y un traductor lento respeta el tiempo',()=>{
 const s=server(),c=s.c;c.LanguageApp={translate(name){c.requestDailyCollection_();return name;}};c.startTaxonomyTranslations();c.taxonomyTranslationBatch_();assert.equal(c.taxonomyTranslationJob_().processed,1);assert.equal(c.rows_('TaxonomiaTraducciones').length,1);
 const other=server();let clock=Date.now();other.c.Date=class extends Date{constructor(value=clock){super(value);}static now(){return clock;}};other.c.LanguageApp={translate(name){clock+=20000;return name;}};other.c.startTaxonomyTranslations();other.c.taxonomyTranslationBatch_();assert.equal(other.c.taxonomyTranslationJob_().processed,1);
});
test('un catálogo amplio se divide en lotes de llamadas y reanuda al cambiar de día aunque no haya traducción nocturna',()=>{
 const s=server(),c=s.c,sheet=s.sheets.get('Taxonomia');for(let i=0;i<12;i++)sheet.grid.push(['extra'+i,'Pagos y cobros','Pago variante '+i,'["Retail"]','["pago"]',1,1,'regla']);s.properties.TAXONOMY_REVISION='large';
 c.startTaxonomyTranslations();c.taxonomyTranslationBatch_();assert.equal(s.calls.length,20);assert.equal(c.taxonomyTranslationJob_().state,'Pendiente');finish(c);assert.equal(s.calls.length,42);
 c.disableTranslationSchedule();c.writeTaxonomyTranslationJob_({...c.taxonomyTranslationJob_(),state:'En pausa',callDay:'2000-01-01',calls:3000,pausedUntil:0});assert.ok(c.taxonomyTranslationReadyAt_()<=Date.now());c.taxonomyTranslationBatch_();assert.equal(c.taxonomyTranslationJob_().state,'Completada');assert.equal(c.taxonomyTranslationJob_().calls,0);
});
test('el índice de nombres guardados se reutiliza entre ejecuciones sin nuevas lecturas de Sheets',()=>{
 const s=server(),c=s.c;c.startTaxonomyTranslations();finish(c);vm.runInContext('taxonomyTranslationMemory_=undefined;',c);c.taxonomyTranslationIndex_();const reads=s.reads;
 vm.runInContext('taxonomyTranslationMemory_=undefined;',c);assert.equal(c.taxonomyTranslationIndex_().size,9);assert.equal(s.reads,reads);
});
