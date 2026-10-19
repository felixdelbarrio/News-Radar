import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {configurationDefaults} from '../scripts/configuration-defaults.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();return s;}
function finish(c){for(let i=0;i<10&&c.taxonomyPending_();i++){if(c.taxonomyJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.taxonomyBatch_();}assert.equal(c.taxonomyJob_().state,'Completada');}
test('newsletters no solicitan reconstrucción trimestral',()=>{const {c,properties:p}=setup();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';assert.equal(c.queueQuarterlyTaxonomy_,undefined);assert.notEqual(c.newsletterReadyAt_({jobs:[]}),Infinity);});
test('newsletters no solicitan reconstrucción trimestral',()=>{const {c,properties:p}=setup();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';assert.equal(c.queueQuarterlyTaxonomy_,undefined);assert.notEqual(c.newsletterReadyAt_({jobs:[]}),Infinity);});
for(const news of [false,true])test('la migración conserva el último maestro guardado sin Drive, '+(news?'con noticias':'sin noticias'),()=>{
 const {c,sheets,properties:p}=setup(),blocks=configurationDefaults().taxonomy;blocks.find(block=>block.name.startsWith('08.')).functions.push({id:'08.99',name:'Operativa incorporada al maestro',description:'Descripción guardada antes de la migración.',terms:['servicio propio']});
 sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1]=JSON.stringify(blocks);p.CATALOG_VERSION='3.4.0';delete p.FUNCTIONAL_CATALOG_REVISION;
 if(news)sheets.get('Noticias').grid.push(['news','2026-10-10','España','BBVA','BBVA','Nueva financiación empresarial','','https://www.bbva.com/noticia/','','BBVA','es','{}','{}']);
 c.initializeConfiguration();const actual=c.configuration_().taxonomy.flatMap(block=>block.functions).find(row=>row.id==='08.99');assert.equal(actual.name,'Operativa incorporada al maestro');assert.equal(actual.description,'Descripción guardada antes de la migración.');assert.equal(sheets.get('CatalogoFuncional').grid.filter(row=>row[0]==='08.99').length,1);
 const rules=JSON.parse(sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1]);assert.equal(rules.flatMap(block=>block.functions).find(row=>row.id==='08.99').name,undefined);assert.equal(c.refreshFunctionalCatalog_().source,'espejo');c.initializeConfiguration();assert.equal(c.configuration_().taxonomy.flatMap(block=>block.functions).find(row=>row.id==='08.99').name,actual.name);
});
