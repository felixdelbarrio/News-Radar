import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {configurationDefaults} from '../scripts/configuration-defaults.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();return s;}
function finish(c){for(let i=0;i<5&&c.taxonomyPending_();i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Completada');}
test('guardar reglas durante una revisión trimestral conserva la solicitud y libera los envíos al terminar',()=>{
 const {c,properties:p}=setup(),period={to:'2026-09-30'};c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';c.queueQuarterlyTaxonomy_(period);c.drainTaxonomyRequest_();const previous=c.taxonomyJob_().id;
 const snapshot=JSON.parse(JSON.stringify(c.getConfiguration()));snapshot.config.taxonomy[0].terms.push('nuevo contexto');c.saveConfiguration(snapshot);assert.notEqual(c.taxonomyJob_().id,previous);assert.equal(c.taxonomyJob_().request,'quarterly:'+period.to);assert.equal(c.newsletterReadyAt_({jobs:[]}),Infinity);
 finish(c);assert.equal(p.TAXONOMY_QUARTER_REQUEST,undefined);assert.equal(p.TAXONOMY_PERIOD,period.to);assert.ok(c.newsletterReadyAt_({jobs:[]})<=Date.now());
});
test('el trabajador recupera una revisión trimestral desplazada aunque falte la solicitud en cola',()=>{
 const {c,properties:p}=setup(),period={to:'2026-09-30'},request='quarterly:'+period.to;c.queueQuarterlyTaxonomy_(period);c.drainTaxonomyRequest_();
 c.writeTaxonomyJob_({...c.taxonomyJob_(),request:'manual'});delete p.TAXONOMY_REQUEST;assert.equal(c.queueQuarterlyTaxonomy_(period),false);assert.equal(p.TAXONOMY_REQUEST,request);c.drainTaxonomyRequest_();assert.equal(c.taxonomyJob_().request,request);
 c.writeTaxonomyJob_({...c.taxonomyJob_(),request:'manual'});delete p.TAXONOMY_REQUEST;c.drainTaxonomyRequest_();assert.equal(c.taxonomyJob_().request,request);c.writeTaxonomyJob_({...c.taxonomyJob_(),state:'Completada',request:'manual'});delete p.TAXONOMY_REQUEST;assert.equal(c.backgroundQueued_({jobs:[]}),true);c.drainTaxonomyRequest_();finish(c);assert.equal(c.queueQuarterlyTaxonomy_(period),true);assert.equal(p.TAXONOMY_QUARTER_REQUEST,undefined);
});
for(const news of [false,true])test('la migración conserva el último maestro guardado sin Drive, '+(news?'con noticias':'sin noticias'),()=>{
 const {c,sheets,properties:p}=setup(),blocks=configurationDefaults().taxonomy;blocks.find(block=>block.name.startsWith('08.')).functions.push({id:'08.99',name:'Operativa incorporada al maestro',description:'Descripción guardada antes de la migración.',terms:['servicio propio']});
 sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1]=JSON.stringify(blocks);p.CATALOG_VERSION='3.4.0';delete p.FUNCTIONAL_CATALOG_REVISION;
 if(news)sheets.get('Noticias').grid.push(['news','2026-10-10','España','BBVA','BBVA','Nueva financiación empresarial','','https://www.bbva.com/noticia/','','BBVA','es','{}','{}']);
 c.initializeConfiguration();const actual=c.configuration_().taxonomy.flatMap(block=>block.functions).find(row=>row.id==='08.99');assert.equal(actual.name,'Operativa incorporada al maestro');assert.equal(actual.description,'Descripción guardada antes de la migración.');assert.equal(sheets.get('CatalogoFuncional').grid.filter(row=>row[0]==='08.99').length,1);
 const rules=JSON.parse(sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1]);assert.equal(rules.flatMap(block=>block.functions).find(row=>row.id==='08.99').name,undefined);assert.equal(c.refreshFunctionalCatalog_().source,'espejo');c.initializeConfiguration();assert.equal(c.configuration_().taxonomy.flatMap(block=>block.functions).find(row=>row.id==='08.99').name,actual.name);
});
