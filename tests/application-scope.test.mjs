import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {applicationGeography} from '../src/shared/selection-policy.js';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
const row=(id,pais,segment='Empresas e instituciones')=>({id,pais,fecha:'2026-10-12',entidad:'BBVA',medio:'Editor',fuente:'Editor',titular:'Nueva app '+id,extracto:'Pagos digitales para empresas',url:'https://example.com/'+id,tipo:'Banco',segmentos:[segment],senales:['Lanzamiento de producto'],etiquetas:{generalista:true,digital:true},taxonomia:[]});
test('ámbitos de Empresas y Retail conservan sus países y las elecciones editadas',()=>{
 const {c}=server(),snapshot=JSON.parse(JSON.stringify(c.getConfiguration())),scopes=snapshot.config.applicationScope;
 assert.equal(scopes.length,2);assert.ok(scopes[0].countries.includes('Uruguay'));assert.ok(!scopes[0].countries.includes('Alemania'));assert.ok(scopes[1].countries.includes('Alemania'));assert.ok(scopes[1].countries.includes('Italia'));
 scopes[1].countries=['India'];c.saveConfiguration(snapshot);c.initializeConfiguration();assert.deepEqual(Array.from(c.configuration_().applicationScope[1].countries),['India']);
 for(const mutate of [x=>x.applicationScope[0].countries.push('Atlantis'),x=>x.applicationScope.push(x.applicationScope[0]),x=>x.applicationScope[0].countries.push(x.applicationScope[0].countries[0]),x=>x.applicationScope[0].countries='España',x=>x.applicationScope[0].name='Otro']){const invalid=JSON.parse(JSON.stringify(c.getConfiguration()));mutate(invalid.config);assert.throws(()=>c.saveConfiguration(invalid),/Ámbito/);}
});
test('Noticias, Novedades y CSV preservan países originales al agrupar geografías fuera del ámbito',()=>{
 const {c}=server(),rows=[row('india','India'),row('spain','España'),row('italy','Italia'),row('unknown','Sin determinar')],query={segment:'Empresas e instituciones',coverage:'digital',newsGeography:'Otras geografías'};
 const news=c.newsDashboard_(rows,query,[],'news');assert.deepEqual(Array.from(news.newsGeographies,r=>r.name),['España','Otras geografías']);assert.equal(news.total,3);assert.deepEqual(Array.from(news.items,r=>r.pais).sort(),['India','Italia','Sin determinar']);
 const brief=c.newsDashboard_(rows,query,[],'briefing').briefing;assert.equal(brief.geographies.find(r=>r.name==='Otras geografías').total,3);
 const csv=c.newsCsv_(c.newsGeographySelection_(rows,query),query,'es',true);assert.equal(csv.count,3);assert.ok(csv.csv.includes('India'));assert.ok(!csv.csv.includes('Nueva app spain'));
 c.cachedNewsRecords_=()=>rows;assert.equal(c.exportNews(query).count,3);assert.equal(c.exportNews({...query,country:'Sin determinar'}).count,1);
 assert.equal(c.newsDashboard_(rows,query,[],'radar').radar.summary.news,4);const geography=applicationGeography(c.configuration_().applicationScope,'');assert.equal(geography(row('it','Italia')),'Italia');assert.equal(geography(row('in','India')),'Otras geografías');
});
test('países disponibles respetan fecha, segmento y búsqueda sin encerrarse en el país elegido',()=>{
 const {c}=server(),rows=[row('india','India'),row('spain','España','Retail'),{...row('old','Japón'),fecha:'2025-01-01'}];
 assert.deepEqual(Array.from(c.newsDashboard_(rows,{segment:'Empresas e instituciones',from:'2026-01-01',country:'España'},[],'news').countries),['India']);assert.equal(c.newsDashboard_(rows,{search:'inexistente'},[],'news').countries.length,0);
});
test('consultas internacionales usan el idioma de búsqueda y conservan términos personalizados',()=>{
 const {c}=server(),config=c.configuration_(),bank=config.entities.find(r=>r.name==='BBVA');
 for(const code of ['GB','AU','JP','SG']){const geo=config.geographies.find(r=>r.code===code);for(const capability of [false,true]){const query=new URL(c.profileFeed_(geo,bank,null,capability).url).searchParams.get('q');assert.doesNotMatch(query,/"banca"|"empresa"|"cuenta"|"pagos"|"gestion|"apertura|"financiaci/);assert.match(query,/banking|business|account|digital|payment|management|factoring|finance|signature|self-service|rewards/);}}
 for(const [code,term] of [['IT','conto corrente'],['DE','girokonto'],['TR','ticari bankacılık']])assert.ok(c.collectionSearchTerms_(config.geographies.find(r=>r.code===code)).includes(term));config.settings.searchTerms=['custom flow'];assert.ok(c.collectionSearchTerms_(config.geographies.find(r=>r.code==='GB')).includes('custom flow'));
});
test('el editor de ámbito guarda las dos selecciones completas y no crea un tercer segmento',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');await a.change('#catalog-category','applicationScope');
 assert.equal(a.find('#catalog-add').hidden,true);assert.equal(a.w.document.querySelectorAll('[data-scope]').length,2);const group=a.find('[data-scope="Retail"]');group.querySelector('[data-country="India"]').checked=true;group.querySelector('[data-country="Italia"]').checked=false;await a.submit('#catalog-form');
 const saved=a.calls.findLast(r=>r.method==='saveConfiguration').query.config.applicationScope.find(r=>r.name==='Retail');assert.ok(saved.countries.includes('India'));assert.ok(!saved.countries.includes('Italia'));
});
test('Novedades renderiza países con resultados y una sola agrupación de Otras geografías',async t=>{
 const {c}=server(),items=[row('india','India'),row('spain','España'),row('unknown','Sin determinar')],geo=applicationGeography(c.configuration_().applicationScope,'Empresas e instituciones');
 const a=await app(t,{configure({data}){data.selection={segment:'Empresas e instituciones',coverage:'digital'};data.briefing={...noveltyOverview(items,[],geo),items};}});assert.deepEqual([...a.w.document.querySelectorAll('#briefing-geographies [data-geography]')].map(r=>r.dataset.geography),['España','Otras geografías']);
});
