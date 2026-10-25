import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {configurationDefaults} from '../scripts/configuration-defaults.mjs';
import {auditRuntime,digest} from '../scripts/quality-audit.mjs';
import {taxonomyDefinitions,taxonomySeed,taxonomyBuild,functionalContext} from '../src/shared/taxonomy.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/functional-quality.json',import.meta.url)));
function runtime(){
 const config=configurationDefaults(),{c}=auditRuntime(config),state={documents:0,candidates:{}};taxonomySeed(state,taxonomyDefinitions(config.taxonomy));
 const items=taxonomyBuild(state).map(row=>({...row,id:digest(row.key).slice(0,24),terminos:row.terms,segmentos:row.segments,descripcion:row.description||''}));
 return {c,items,byId:new Map(items.map(row=>[row.id,row]))};
}
test('business functions, banking APIs and client/staff agents satisfy their separate scope and catalogue contracts',()=>{
 const {c,items,byId}=runtime();
 for(const row of fixture.cases){
  const title=c.searchText_(row.title),text=c.searchText_(row.title+' '+row.excerpt),labels=c.classification_(title,text).labels,assignment=c.taxonomyRecord_(row.title,row.excerpt,items,labels);
  assert.equal(labels.digital,row.expected_scope,row.id+' scope');
  if(row.expected_scope)assert.ok(assignment.ids.some(id=>byId.get(id).subpalanca.startsWith(row.expected_prefix)),row.id+' function: '+assignment.ids.map(id=>byId.get(id).subpalanca).join(', '));
 }
});
test('a generic fallback identifies only the known block and never fabricates a landing',()=>{
 const {c,items,byId}=runtime();
 for(const [title,prefix] of [['BBVA mejora su servicio digital para empresas','03.xx'],['BBVA lanza pagos con tarjetas de empresa en su app','09.xx']]){
  const labels=title.includes('tarjetas')?c.classification_(c.searchText_(title),c.searchText_(title)).labels:{digital:true,capacidades:['Empresas: Pagos'],evento:'Mejora de oferta'};
  const result=c.taxonomyRecord_(title,'',items,labels);assert.equal(result.reason,'capability-fallback');assert.ok(byId.get(result.primary).subpalanca.startsWith(prefix));
 }
});
test('card debt, purchases, acquisition and actual transfers remain distinct',()=>{
 const {c,items,byId}=runtime();
 for(const [title,prefix] of [['BBVA permite el pago de la tarjeta de crédito desde su banca online para empresas','09.09'],['BBVA lanza pagos internacionales con tarjetas corporativas','09.'],['BBVA lanza SoftPOS para aceptar pagos con tarjeta en comercios','11.'],['Westpac cuts its flat transaction rate for small business card payments','11.'],['BBVA lanza una solución digital para pymes para aceptar pagos con tarjeta','11.'],['BBVA permite transferir desde la app para empresas con el cupo de la tarjeta de crédito','03.'],['BBVA lanza transferencias internacionales a cuentas para empresas','03.13'],['BBVA permite bloquear la tarjeta de crédito desde la app para empresas','09.06']]){
  const labels=c.classification_(c.searchText_(title),c.searchText_(title)).labels,result=c.taxonomyRecord_(title,'',items,labels);assert.ok(byId.get(result.primary)?.subpalanca.startsWith(prefix),title+': '+byId.get(result.primary)?.subpalanca);
 }
 assert.equal(functionalContext('compras con tarjetas, sin transferencias entre cuentas').transfer,false);
});
test('incidental extract references cannot promote an unrelated app through shared keywords',()=>{
 const {c}=runtime(),title=c.searchText_('BBVA lanza una app de recetas de cocina'),text=c.searchText_('BBVA lanza una app de recetas de cocina. La aplicación permite consultar recetas. La nota también menciona cash management sin anunciar cambios en ese servicio bancario.');
 assert.equal(c.classification_(title,text).labels.digital,false);
});
function upgradeServer(){
 const s=storage();s.c.initializeConfiguration();s.c.publishTaxonomy_({documents:0,candidates:{}});
 for(const key of ['CLASSIFICATION_JOB','TAXONOMY_JOB','SNAPSHOT_JOBS','DASHBOARD_SNAPSHOT_BUILD'])delete s.properties[key];
 s.book.copy=()=>{const copy=storage();for(const sheet of s.book.getSheets())sheet.copyTo(copy.book).setName(sheet.getName());s.c.SpreadsheetApp.openById=id=>id==='backup'?copy.book:s.book;copy.book.getId=()=> 'backup';copy.book.getUrl=()=> 'https://docs.google.com/spreadsheets/backup';return copy.book;};
 return s;
}
test('rule upgrade preserves catalogue identities, custom aliases, disabled capabilities and settings; repeat is idempotent',()=>{
 const s=upgradeServer(),c=s.c,config=configurationDefaults();config.capabilities.Empresas[0].enabled=false;config.taxonomy.find(b=>b.name.startsWith('09.')).functions[0].terms.push('custom alias');
 const before=config.taxonomy.map(b=>[b.name,b.functions.map(row=>[row.id,row.name,row.description])]),next=c.functionalRuleUpgrade_(config);
 assert.equal(JSON.stringify(next.taxonomy.map(b=>[b.name,b.functions.map(row=>[row.id,row.name,row.description])])),JSON.stringify(before));assert.equal(next.capabilities.Empresas[0].enabled,false);assert.equal(JSON.stringify(next.settings),JSON.stringify(config.settings));
 assert.ok(next.taxonomy.find(b=>b.name.startsWith('09.')).functions[0].terms.includes('custom alias'));assert.equal(JSON.stringify(c.functionalRuleUpgrade_(next)),JSON.stringify(next));
 const upgraded=c.applyFunctionalRuleUpgrade();assert.equal(upgraded.upgrade.state,'Staged');assert.equal(c.taxonomyJob_().reclassify,true);const id=c.taxonomyJob_().id;c.applyFunctionalRuleUpgrade();assert.equal(c.taxonomyJob_().id,id);
 c.rollbackFunctionalRuleUpgrade();assert.equal(JSON.parse(s.properties.FUNCTIONAL_RULE_UPGRADE).state,'RolledBack');
});
test('incomplete native backup blocks rule writes and leaves the original configuration intact',()=>{
 const s=upgradeServer(),before=JSON.stringify(s.sheets.get('Configuracion').grid),backup=storage();s.book.copy=()=>backup.book;
 assert.throws(()=>s.c.applyFunctionalRuleUpgrade(),/Backup no verificado/);assert.equal(JSON.stringify(s.sheets.get('Configuracion').grid),before);assert.equal(s.properties.FUNCTIONAL_RULE_UPGRADE,undefined);
});
test('staged classification does not change published news before taxonomy and snapshots finish',()=>{
 const s=upgradeServer(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),row={id:'stable',fecha:'2026-10-24',pais:'España',medio:'Editor',entidad:'BBVA',titular:'BBVA lanza pagos con tarjetas de empresa en su app',extracto:'',url:'https://example.com/stable',clasificacion:JSON.stringify({digital:true,capacidades:['Empresas: Pagos'],estado:'relevante'})};
 s.sheets.get('Noticias').grid.push(keys.map(key=>row[key]||''));const original=JSON.stringify(s.sheets.get('Noticias').grid);
 c.applyFunctionalRuleUpgrade();for(let i=0;i<10&&c.taxonomyJob_().state!=='Publicando';i++)c.taxonomyBatch_();
 assert.equal(c.taxonomyJob_().state,'Publicando');assert.equal(JSON.stringify(s.sheets.get('Noticias').grid),original);const candidate=s.book.getSheetByName(c.taxonomyJob_().generation.newsSheet),record=Object.fromEntries(keys.map((key,i)=>[key,candidate.grid[1][i]]));
 assert.equal(record.id,row.id);assert.equal(record.fecha,row.fecha);assert.equal(record.url,row.url);assert.equal(JSON.parse(record.clasificacion).version,'3.27.0');
 assert.ok(JSON.parse(record.taxonomia).ids.length);c.rollbackFunctionalRuleUpgrade();assert.equal(c.newsStorageKey_(),'Noticias');assert.equal(JSON.stringify(s.sheets.get('Noticias').grid),original);
});

test('canonical alias compaction preserves every effective catalogue matching term',async()=>{
 const {functionalCatalogRules,functionalRuleSettings}=await import('../src/shared/functional-catalogue.js');
 const config=configurationDefaults(),before=taxonomyDefinitions(config.taxonomy),restored=functionalCatalogRules(config.taxonomy,functionalRuleSettings(config.taxonomy)),after=taxonomyDefinitions(restored);
 assert.equal(JSON.stringify(after),JSON.stringify(before));
});
