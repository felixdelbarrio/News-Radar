import {configurationDefaults} from '../scripts/configuration-defaults.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storage} from './helpers/server.mjs';
import {taxonomyDefinitions,taxonomyObserve,taxonomyBuild,taxonomySeed} from '../src/shared/taxonomy.js';
const config=configurationDefaults(),blocks=config.taxonomy;
test('el Excel aporta 322 códigos únicos, 22 bloques y conserva las dos etiquetas del prefijo 13',()=>{
 const rows=blocks.flatMap(block=>block.functions);assert.equal(rows.length,322);assert.equal(new Set(rows.map(row=>row.id)).size,322);assert.equal(blocks.length,22);assert.equal(blocks.filter(block=>block.name.startsWith('13.')).length,2);
 assert.equal(blocks.find(block=>block.name==='08.Financiación').functions.find(row=>row.id==='08.02').name,'Crédito Virtual');assert.equal(blocks.find(block=>block.name==='20.Venta Digital').functions.find(row=>row.id==='20.04').name,'Quantum');
 const state={documents:0,candidates:{}};taxonomySeed(state,taxonomyDefinitions(blocks));const model=taxonomyBuild(state);assert.equal(model.filter(row=>row.subpalanca).length,344);assert.ok(model.every(row=>row.df===0));
});
test('ningún TF-IDF crea bloques, duplica biometría o convierte adjetivos y verbos recurrentes en funciones',()=>{
 const definitions=taxonomyDefinitions(blocks),state={documents:0,candidates:{}};
 for(let i=0;i<6;i++)taxonomyObserve(state,'pagos crecen pagos novedosos pagos biometricos con quantum pagos con stablecoins',definitions,new Set(),'Editor '+i);
 const emerging=taxonomyBuild(state).filter(row=>row.origin==='tf-idf');assert.ok(emerging.length<=1);assert.ok(emerging.every(row=>row.subpalanca.startsWith('03.xx ')&&row.palanca.startsWith('03.')));
 const independent={documents:0,candidates:{}};for(let i=0;i<4;i++)taxonomyObserve(independent,'pagos con stablecoins',definitions,new Set(),'Editor '+i);assert.equal(taxonomyBuild(independent).filter(row=>row.origin==='tf-idf').length,0);
 const single={documents:0,candidates:{}};for(let i=0;i<20;i++)taxonomyObserve(single,'pagos con stablecoins',definitions,new Set(),'Mismo editor');assert.equal(taxonomyBuild(single).filter(row=>row.origin==='tf-idf').length,0);
});
test('las revisiones de Drive interpretan ambas estructuras, ignoran referencias XX y preservan equivalencias',()=>{
 const {c}=storage();c.initializeConfiguration();
 const tables=[['ID','ID OLD','Bloque funcional','Funcionalidad/Sub Operativa'],['08.02','','Financiación','Crédito Virtual'],['19.XX','','Capacidades core','Referencia'],['08.43','','Financiación','Nuevo servicio empresarial']];
 const channel=[['ID','Bloque funcional','Funcionalidad/Sub Operativa'],['20.04','Venta Digital','Quantum']];
 const result=c.functionalCatalogRules(c.functionalCatalogRows_([tables,channel]),blocks),functions=result.flatMap(block=>block.functions);assert.equal(functions.length,3);assert.equal(functions.find(row=>row.id==='08.43').name,'Nuevo servicio empresarial');assert.deepEqual(Array.from(functions.find(row=>row.id==='08.02').terms),['credito virtual','virtual credit']);assert.ok(!functions.some(row=>row.id==='19.XX'));
 assert.throws(()=>c.functionalCatalogRows_([tables,[...channel,['20.04','Venta Digital','Duplicado']]]),/duplicada/);
});
test('revisión sin acceso conserva reglas y noticias, registra el fallo y continúa usando el Excel',()=>{
 const {c,sheets}=storage();c.initializeConfiguration();const before=JSON.stringify(sheets.get('Configuracion').grid),news=JSON.stringify(sheets.get('Noticias').grid);
 c.SpreadsheetApp.openById=()=>{throw Error('PERMISSION_DENIED');};const result=c.refreshFunctionalCatalog_();assert.equal(result.error,'PERMISSION_DENIED');assert.equal(JSON.stringify(sheets.get('Configuracion').grid),before);assert.equal(JSON.stringify(sheets.get('Noticias').grid),news);
});
test('la revisión de Drive actualiza el espejo y conserva solo equivalencias en las reglas',()=>{
 const s=storage(),{c,sheets}=s;c.initializeConfiguration();c.saveTaxonomySource({url:'https://docs.google.com/spreadsheets/d/source/edit',revision:c.configurationRevision_()});
 const data={'Soluciones Funcionales':[['ID','ID OLD','Bloque funcional','Funcionalidad/Sub Operativa'],['08.02','','Financiación','Crédito Virtual'],['08.43','','Financiación','Servicio nuevo']], 'Capacidades canal (core y VD)':[['ID','Bloque funcional','Funcionalidad/Sub Operativa'],['20.04','Venta Digital','Quantum']]};
 c.SpreadsheetApp.openById=id=>id==='book'?s.book:{getSheetByName:name=>({getLastRow:()=>data[name].length,getRange:()=>({getDisplayValues:()=>data[name]})})};
 assert.equal(c.refreshFunctionalCatalog_().changed,true);const value=sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1];assert.equal(JSON.parse(value).flatMap(block=>block.functions).length,322);assert.ok(JSON.parse(value).every(block=>block.functions.every(row=>!Object.hasOwn(row,'name'))));assert.equal(c.configuration_().taxonomy.flatMap(block=>block.functions).length,3);assert.equal(sheets.get('CatalogoFuncional').getLastRow(),4);assert.equal(c.refreshFunctionalCatalog_().changed,false);assert.equal(sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1],value);
});
test('el trabajo reanudado conserva estadísticas de las primeras 100 noticias y publica todas las funciones',()=>{
 const {c,sheets}=storage();c.initializeConfiguration();for(let i=0;i<130;i++)sheets.get('Noticias').grid.push([String(i),'2026-10-10','España','Editor '+i,'BBVA','BBVA lanza pagos con stablecoins '+i,'Nueva operativa para empresas','https://example.com/'+i,'','Editor '+i,'es','{"digital":true,"capacidades":["Empresas: Pagos"]}','']);
 c.startTaxonomy();c.taxonomyBatch_();const job=c.taxonomyJob_(),first=c.taxonomyCheckpoint_(job);assert.equal(first.documents,100);assert.ok(Object.keys(first.candidates).length<10);c.taxonomyBatch_();const last=c.taxonomyCheckpoint_(c.taxonomyJob_());assert.equal(last.documents,130);assert.equal(last.candidates['03.Pagos - Transf. y traspasos|Otros'].df,130);
 for(let i=0;i<10&&c.taxonomyPending_();i++){if(c.taxonomyJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.taxonomyBatch_();}assert.equal(c.taxonomyJob_().state,'Completada');assert.ok(c.taxonomyCatalog_().some(row=>row.subpalanca.startsWith('03.xx ')));assert.equal(c.taxonomyCatalog_().filter(row=>row.subpalanca&&row.origen==='regla').length,322);
 assert.ok(!c.taxonomyTranslationNames_().includes(''));const names=c.taxonomyTranslations_().es;assert.equal(names['08.Financiación'],'08.Financiación');assert.equal(names['08.Financiación › 08.02.Crédito Virtual'],'08.Financiación › 08.02.Crédito Virtual');
});
