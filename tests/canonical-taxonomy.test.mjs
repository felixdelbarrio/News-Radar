import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {taxonomyDefinitions,taxonomyBuild,taxonomySeed,taxonomyDecision,taxonomyText} from '../src/shared/taxonomy.js';
test('Otros es único por bloque incluso con dos bloques 13, sin editar el maestro',()=>{
 const {c}=storage();c.initializeConfiguration();const before=JSON.stringify(c.functionalCatalog_());c.publishTaxonomy_({documents:0,candidates:{}});const items=c.taxonomyCatalog_(),others=items.filter(row=>/\.xx Otros$/.test(row.subpalanca));assert.equal(others.length,22);assert.equal(new Set(others.map(row=>row.id)).size,22);assert.equal(others.filter(row=>row.palanca.startsWith('13.')).length,2);
 const ids=JSON.stringify(others.map(row=>row.id));c.publishTaxonomy_({documents:0,candidates:{}});assert.equal(JSON.stringify(c.taxonomyCatalog_().filter(row=>/\.xx Otros$/.test(row.subpalanca)).map(row=>row.id)),ids);assert.equal(JSON.stringify(c.functionalCatalog_()),before);
});
test('Otros exige bloque demostrado; dos bloques exigen evidencia independiente',()=>{
 const rules=taxonomyDefinitions([{name:'01.Bloque',terms:['custodia documental'],emerging:[],functions:[]},{name:'02.Bloque',terms:['firma remota'],emerging:[],functions:[]}]),state={documents:0,candidates:{}};taxonomySeed(state,rules);const model=taxonomyBuild(state),decide=text=>taxonomyDecision(taxonomyText(text),model,text);
 assert.equal(decide('El banco mejora su servicio digital para empresas').matches.length,0);assert.equal(decide('Nueva custodia documental para empresas').matches[0].row.subpalanca,'01.xx Otros');assert.equal(decide('Nueva custodia documental y firma remota para empresas').matches.length,2);
});
test('clasificación suficiente se reutiliza sin volver a ejecutar el motor',()=>{
 const {c}=storage();c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});const row={id:'stable',titular:'BBVA lanza login biométrico para empresas',extracto:''};row.taxonomia=JSON.stringify(c.taxonomyRecord_(row.titular,''));c.taxonomyRecord_=()=>{throw Error('No recalcular');};assert.equal(JSON.stringify(c.necessaryTaxonomyRecord_(row)),row.taxonomia);
});
test('la taxonomía canónica se actualiza in-place sin migraciones antiguas',()=>{
 const {c,sheets}=storage();c.initializeConfiguration();c.startTaxonomy();const id=c.taxonomyJob_().id;c.startTaxonomy();assert.equal(c.taxonomyJob_().id,id);
 for(let i=0;i<15&&c.taxonomyJob_().state!=='Completada';i++){if(c.taxonomyJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.taxonomyBatch_();}
 assert.equal(c.taxonomyJob_().state,'Completada');assert.equal(c.taxonomyStorageKey_(),'Taxonomia');assert.equal(c.upgradeCanonicalTaxonomy,undefined);assert.equal(sheets.has('TaxonomiaTrabajo'),false);
});
