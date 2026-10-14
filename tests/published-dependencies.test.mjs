import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {read,readServerScript} from '../scripts/source.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
test('la distribución completa entrega las tres vistas y reconoce al administrador',()=>{
 const {c}=server();for(const view of ['briefing','news','radar']){const data=c.getDashboard({view,initial:true});assert.equal(data.admin,true);assert.equal(data.performance.version,'3.0.3');}
});
test('una publicación sin las dependencias de programación y agrupado reproduce los errores de las capturas',()=>{
 for(const [file,name,views] of [['Background.gs','collectionScheduleLabel_',['briefing','radar']],['NewsGroups.gs','newsEntityPage',['news']]]){
  const s=server(),c=vm.createContext(Object.fromEntries(['PropertiesService','CacheService','SpreadsheetApp','Session','LockService','Utilities','ScriptApp'].map(key=>[key,s.c[key]])));
  vm.runInContext(readServerScript('dist').replace(read('dist/'+file),''),c);
  for(const view of views)assert.throws(()=>c.getDashboard({view,initial:true}),error=>error.name==='ReferenceError'&&error.message===name+' is not defined');assert.equal(c.authorize_().admin,true);
 }
});
