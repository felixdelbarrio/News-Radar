import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {applicationGeography,geographyMatches,regionalGeographies} from '../src/shared/selection-policy.js';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
const row=(id,pais)=>({id,pais,fecha:'2026-10-20',entidad:'BBVA',medio:'Editor',fuente:'Editor',titular:'BBVA lanza pagos digitales para empresas '+id,extracto:'Tesorería online para pymes',url:'https://example.com/'+id,tipo:'Banco',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],etiquetas:{digital:true},taxonomia:[]});
function server(){const s=storage();s.c.initializeConfiguration();return s;}
test('regional filters, CSV and compact snapshots exclude every country with its own tab',()=>{
 const {c}=server(),rows=['España','Turquía','México','Perú','Colombia','Argentina','Uruguay','Venezuela','Italia','Reino Unido','Estados Unidos','India'].map((country,i)=>row(String(i),country)),query={segment:'Empresas e instituciones',coverage:'digital'},geo=applicationGeography(c.configuration_().applicationScope,query.segment),data=c.newsDashboard_(rows,query,[],'news'),bundle=c.compactNewsSnapshot_(rows,query,data);
 for(const [region,expected] of [['EMEA',['Italia','Reino Unido']],['AMER',['Estados Unidos']],['APAC',['India']]]){
  const selected=c.selectAnnotatedNews_(rows,{...query,country:region});assert.deepEqual(Array.from(selected,r=>r.pais).sort(),expected.sort());
  assert.deepEqual(Array.from(c.newsGeographySelection_(rows,{newsGeography:region}),r=>r.pais).sort(),expected.sort());
  assert.equal(c.newsCsv_(rows,{...query,country:region},'es',true).count,expected.length);
  assert.equal(c.compactNewsSnapshotData_(bundle,region,'es').total,expected.length);
  assert.equal(regionalGeographies(rows,geo).find(r=>r.name===region).total,expected.length);
 }
 assert.equal(geographyMatches(rows[0],'EMEA',geo),false);
 assert.equal(new Set(bundle.records.map(record=>JSON.stringify(record))).size,bundle.records.length);
});
test('Spain selects EMEA on entering other geographies and exposes regional SVG tabs',async t=>{
 const scope=[{name:'Empresas e instituciones',countries:['España','Turquía']}],items=[row('es','España'),row('it','Italia'),row('in','India')],geo=applicationGeography(scope);
 const a=await app(t,{configure({data}){data.applicationScope=scope;data.selection={};data.briefing={...noveltyOverview(items,[],geo),items};}});
 await a.click('#briefing-geographies [data-geography="Otras geografías"]');
 assert.equal(a.find('#briefing-geographies [data-geography="EMEA"]').getAttribute('aria-selected'),'true');assert.equal(a.find('#filters [name="country"]').value,'EMEA');assert.equal(a.find('#geography-filter summary').textContent,'EMEA');assert.ok([...a.find('#filters [name="country"]').options].some(option=>option.value==='España'));
 assert.equal(a.w.document.querySelectorAll('#briefing-geographies svg').length,3);
 assert.match(a.find('#briefing-list').textContent,/empresas it/);assert.doesNotMatch(a.find('#briefing-list').textContent,/empresas es|empresas in/);
 await a.click('#briefing-geographies [data-geography="APAC"]');assert.match(a.find('#briefing-list').textContent,/empresas in/);
});
test('warm operational polling never writes telemetry and reuses installed trigger counts',()=>{
 const s=server(),{c}=s;let reads=0,writes=0;const get=c.ScriptApp.getProjectTriggers;c.ScriptApp.getProjectTriggers=()=>{reads++;return get();};c.telemetry_=()=>writes++;
 c.getControlPanel();const initial=reads;c.getControlPanel();assert.equal(reads,initial);
 c.getOperationalSchedule();const warm=reads;c.getOperationalSchedule();assert.equal(reads,warm);assert.equal(writes,0);
});
test('classification rejects publisher headings, layoffs, marketing AI and child delivery',()=>{
 const {c}=server();
 for(const title of ["The Business: AI stocks are in a bubble, says Citi's Dirk Willer The Business",'Barclays to cut 5,000 jobs by end of 2026 as AI drives workforce reduction','CMO Carla Hassan shares how JPMorgan Chase is leaning into AI for business growth','Shinhan Bank Adds Child Meal Card Payments to Ddaenggyeoyo Delivery App','Malaysia Aviation Group secures US$75mil trade finance facility from Citi']){const text=c.searchText_(title);assert.equal(c.classification_(text,text).labels.digital,false,title);}
 for(const title of ['BBVA lanza una API de pagos para pymes','BBVA incorpora IA a su asistente digital para empresas']){const text=c.searchText_(title);assert.equal(c.classification_(text,text).labels.digital,true,title);}
});
test('English capacity profiles contain no unregistered Spanish catalogue titles',()=>{
 const {c}=server(),config=c.configuration_(),geo=config.geographies.find(r=>r.code==='GB');
 const terms=Array.from(c.capabilitySearchTerms_(geo,config.entities[0]));assert.ok(terms.length);assert.doesNotMatch(terms.join(' '),/Traspasos|Transferencias individuales|autónom|emprendedor|\(/);const query=new URL(c.profileFeed_(geo,config.entities[0],null,true).url).searchParams.get('q');assert.doesNotMatch(query,/autónom|emprendedor|Traspasos|Transferencias individuales/);
});
test('restarting taxonomy deletes the unpublished pair and protects the published source',()=>{
 const s=server(),{c}=s;c.requestTaxonomy_('',false);const job=c.taxonomyJob_();c.prepareTaxonomyGeneration_(job);const pair=job.generation;assert.ok(s.book.getSheetByName(pair.newsSheet));c.requestTaxonomy_('',false);assert.equal(s.book.getSheetByName(pair.newsSheet),undefined);assert.equal(s.book.getSheetByName(pair.taxonomySheet),undefined);assert.ok(s.book.getSheetByName(c.newsStorageKey_()));
});
test('regional newsletter evidence remains confined to its selected countries',()=>{
 const {c}=server(),rows=[row('es','España'),row('it','Italia'),row('in','India')];assert.equal(c.newsletterSelectionQuery_({country:'EMEA'}).country,'EMEA');const digest=c.newsletterDigest_(rows,{view:'briefing',country:'EMEA'},'es',value=>value);assert.deepEqual(Array.from(digest.cards,r=>r.country),['Italia']);assert.equal(digest.focused,false);
});

test('regional edition filters respect the original direct scope and a bank publisher preserves outage evidence',()=>{
 const {c}=server(),geo=c.newsReadingGeography_({cadence:'fortnightly',scope:c.configuration_().applicationScope},{benchmark:'international',newsGeography:'EMEA'});assert.equal(c.geographyMatches(row('es','España'),'EMEA',geo),false);assert.equal(c.geographyMatches(row('it','Italia'),'EMEA',geo),true);
 const title=c.searchText_('BBVA customers report business banking app outage');assert.equal(c.classification_(title,title,true,'BBVA').labels.digital,true);
});
