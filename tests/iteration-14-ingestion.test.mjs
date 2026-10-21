import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
test('incident evidence in article text is relevant without an enterprise keyword and hypothetical help remains excluded',()=>{
 const {c}=server();
 for(const [title,body] of [['BBVA informa sobre su servicio','Los clientes de BBVA no pueden acceder a su banca online por un fallo informatico.'],['HSBC service update','HSBC mobile banking down: customers unable to access the app.'],['Santander informa a sus clientes','Banco Santander presenta fallas: el sistema caido no permite operar con transferencias.']]){
  const assessment=c.classification_(c.searchText_(title),c.searchText_(title+' '+body)).assessment;
  assert.equal(assessment.relevant,true,title);assert.equal(assessment.business,true,title);assert.ok(assessment.capabilities.length,title);assert.ok(assessment.signals.includes('Incidencia operativa'),title);
 }
 for(const text of ['BBVA explica qué hacer si la app no funciona','HSBC explains how to fix mobile banking down errors','BBVA evalúa el riesgo de caída del sistema de pagos'])assert.equal(c.classification_(c.searchText_(text),c.searchText_(text)).assessment.signals.includes('Incidencia operativa'),false,text);
});
test('editorial dedup preserves short numeric amounts while resolving entity aliases',()=>{
 const {c}=server(),item={entity:'BBVA Empresas',publisher:'Editor',title:'BBVA presenta plataforma digital pagos internacionales empresas 10 paises',date:'2026-10-20'},known={titles:new Map()};c.rememberTitle_(known,item);
 assert.equal(c.duplicateTitle_(known,{...item,entity:'BBVA',title:'BBVA lanza plataforma digital pagos internacionales empresas 10 paises'}),true);
 assert.equal(c.duplicateTitle_(known,{...item,entity:'BBVA',title:'BBVA lanza plataforma digital pagos internacionales empresas 20 paises'}),false);
});
test('lightweight known URL index uses one date-to-URL range without classification or translation reads and reuses memory',()=>{
 const {c,sheets,properties}=server(),sheet=sheets.get('Noticias'),keys=vm.runInContext('RADAR.sheets.Noticias',c),row={id:'a',fecha:'2026-10-20',pais:'España',medio:'Editor',entidad:'BBVA Empresas',titular:'BBVA presenta nueva plataforma digital pagos internacionales empresas',extracto:'BODY MUST NOT BE READ',url:'https://example.com/news'};
 Array.prototype.push.call(sheet.grid,keys.map(key=>row[key]||''));
 const ranges=[],getRange=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{ranges.push(args);return getRange(...args);};
 c.rows_=()=>{throw Error('Do not load complete tables or translations');};
 const first=c.knownUrls_();assert.ok(first.has(row.url));assert.equal(c.knownUrls_(),first);assert.deepEqual(ranges,[[2,2,1,7]]);assert.ok(ranges.every(([,column,,width])=>column+width-1<keys.indexOf('clasificacion')+1));assert.equal(JSON.stringify([...first.titles]).includes(row.extracto),false);
 assert.equal(c.duplicateTitle_(first,{title:row.titular,date:row.fecha,entity:'BBVA',publisher:'Editor'}),true);
 properties.NEWS_CONTENT_REVISION='changed';assert.notEqual(c.knownUrls_(),first);assert.equal(ranges.length,2);
});
