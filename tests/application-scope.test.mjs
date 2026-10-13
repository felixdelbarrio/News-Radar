import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {applicationGeography} from '../src/shared/selection-policy.js';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
const row=(id,pais,segment='Project Finance')=>({id,pais,fecha:'2026-10-12',entidad:'ADB',medio:'The Asset',fuente:'The Asset',titular:'Financing '+id,extracto:'Project financing',url:'https://example.com/'+id,tipo:'Banca multilateral',segmentos:[segment],senales:['Operación de Project Finance'],etiquetas:{generalista:true,digital:segment!=='Project Finance'},taxonomia:[]});
test('ámbitos iniciales separan países de apps BBVA y APAC; guardar conserva elecciones',()=>{
 const {c}=server(),snapshot=JSON.parse(JSON.stringify(c.getConfiguration()));
 const scopes=snapshot.config.applicationScope;assert.ok(scopes[0].countries.includes('Uruguay'));assert.ok(!scopes[0].countries.includes('Alemania'));assert.ok(scopes[1].countries.includes('Alemania'));assert.ok(scopes[1].countries.includes('Italia'));assert.equal(scopes[2].countries.length,12);assert.ok(!scopes[2].countries.includes('España'));
 scopes[2].countries=['India'];c.saveConfiguration(snapshot);c.initializeConfiguration();assert.deepEqual(Array.from(c.configuration_().applicationScope[2].countries),['India']);
 for(const mutate of [x=>x.applicationScope[0].countries.push('Atlantis'),x=>x.applicationScope.push(x.applicationScope[0]),x=>x.applicationScope[0].countries.push(x.applicationScope[0].countries[0]),x=>x.applicationScope[0].countries='España',x=>x.applicationScope[0].name='Otro']){const invalid=JSON.parse(JSON.stringify(c.getConfiguration()));mutate(invalid.config);assert.throws(()=>c.saveConfiguration(invalid),/Ámbito/);}
});
test('Noticias, Novedades y CSV agrupan países restantes sin perder su país original; Radar conserva su alcance',()=>{
 const {c}=server(),rows=[row('india','India'),row('spain','España'),row('italy','Italia'),row('unknown','Sin determinar')],query={segment:'Project Finance',coverage:'generalista',newsGeography:'Otras geografías'};
 const news=c.newsDashboard_(rows,query,[],'news');assert.deepEqual(Array.from(news.newsGeographies,r=>r.name),['India','Sin determinar','Otras geografías']);assert.equal(news.total,2);assert.deepEqual(Array.from(news.items,r=>r.pais).sort(),['España','Italia']);
 const brief=c.newsDashboard_(rows,query,[],'briefing').briefing;assert.equal(brief.geographies.find(r=>r.name==='Otras geografías').total,2);
 const selected=c.newsGeographySelection_(rows,query),csv=c.newsCsv_(selected,query,'es',true);assert.equal(csv.count,2);assert.ok(csv.csv.includes('España'));assert.ok(!csv.csv.includes('Financing india'));
 c.cachedNewsRecords_=()=>rows;assert.equal(c.exportNews(query).count,2);assert.equal(c.exportNews({...query,newsGeography:'Sin determinar'}).count,1);
 const radar=c.newsDashboard_(rows,query,[],'radar').radar;assert.ok(radar.geographies.some(r=>r.country==='España'));assert.equal(radar.summary.news,4);
 const aggregate=applicationGeography(c.configuration_().applicationScope,'');assert.equal(aggregate(row('it','Italia')),'Italia');assert.equal(aggregate(row('in','India')),'India');
});
test('países disponibles respetan fecha, segmento y búsqueda, sin encerrarse en el país elegido',()=>{
 const {c}=server(),rows=[row('india','India'),row('spain','España','Retail'),{...row('old','Japón'),fecha:'2025-01-01'}];
 assert.deepEqual(Array.from(c.newsDashboard_(rows,{segment:'Project Finance',from:'2026-01-01',country:'España'},[],'news').countries),['India']);
 assert.equal(c.newsDashboard_(rows,{search:'inexistente'},[],'news').countries.length,0);assert.equal(c.newsDashboard_([],{},c.feeds_()).countries.length,0);
});
test('consultas internacionales seleccionan términos del idioma y conservan términos personalizados',()=>{
 const {c}=server(),config=c.configuration_(),bank=config.entities.find(r=>r.name==='BBVA');
 for(const code of ['GB','AU','JP','SG']){const geo=config.geographies.find(r=>r.code===code);for(const capability of [false,true]){const query=new URL(c.profileFeed_(geo,bank,null,capability).url).searchParams.get('q');assert.doesNotMatch(query,/"banca"|"empresa"|"cuenta"|"pagos"|"gestion|"apertura|"financiaci/);assert.match(query,/banking|business|account|digital|payment|management|factoring|finance|signature|self-service|rewards/);}
  const finance=new URL(c.profileFeed_(geo,bank,null,false,true).url).searchParams.get('q');assert.match(finance,/project finance/);assert.doesNotMatch(finance,/financiaci|licitación|contrato/);
 }
 for(const [code,term] of [['IT','conto corrente'],['DE','girokonto'],['TR','ticari bankacılık']])assert.ok(c.collectionSearchTerms_(config.geographies.find(r=>r.code===code)).includes(term));
 config.settings.searchTerms=['custom flow'];assert.ok(c.collectionSearchTerms_(config.geographies.find(r=>r.code==='GB')).includes('custom flow'));
});
test('el editor de ámbito permite seleccionar países por segmento y guarda el catálogo completo',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');await a.change('#catalog-category','applicationScope');
 assert.equal(a.find('#catalog-add').hidden,true);assert.equal(a.w.document.querySelectorAll('[data-scope]').length,3);
 const group=a.find('[data-scope="Project Finance"]');group.querySelector('[data-country="España"]').checked=true;group.querySelector('[data-country="India"]').checked=false;await a.submit('#catalog-form');
 const saved=a.calls.findLast(r=>r.method==='saveConfiguration').query.config.applicationScope.find(r=>r.name==='Project Finance');assert.ok(saved.countries.includes('España'));assert.ok(!saved.countries.includes('India'));
});
test('Novedades renderiza solo países con resultados y las dos pestañas transversales',async t=>{
 const {c}=server(),items=[row('india','India'),row('spain','España'),row('unknown','Sin determinar')],geo=applicationGeography(c.configuration_().applicationScope,'Project Finance');
 const a=await app(t,{configure({data}){data.selection={segment:'Project Finance',coverage:'generalista'};data.briefing={...noveltyOverview(items,[],geo),items};}});
 assert.deepEqual([...a.w.document.querySelectorAll('#briefing-geographies [data-geography]')].map(r=>r.dataset.geography),['India','Sin determinar','Otras geografías']);
});
