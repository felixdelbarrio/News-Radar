import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {preferredRegion,applicationGeography,BRIEFING_ALLOWED_SIGNALS} from '../src/shared/selection-policy.js';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const media=(domain,iso2,extra={})=>({name:domain,domain,iso2,country:'',enabled:true,status:'VERIFICADO',...extra});
test('event geography uses explicit evidence and preserves source geography separately',()=>{
 const {c}=server();c.writeGeographyCatalog_('CatalogoMedios',[media('publisher.co','US'),media('publisher.co','ES',{editionPattern:'/mx/',editionCountry:'MX'}),media('www.sdpnoticias.com','MX')]);
 const base={titular:'Nueva plataforma digital empresarial',url:'https://publisher.co/article',rssCountry:'España'};
 for(const [row,country,reason] of [
  [{...base,titular:'Plataforma de pagos empresariales en Perú',extracto:'Disponible en Colombia'},'Perú','headline'],
  [{...base,extracto:'Se ofrece a empresas en Colombia.'},'Colombia','content'],
  [{...base,url:'https://publisher.co/mx/article'},'Sin determinar','undetermined'],
  [base,'Sin determinar','undetermined'],
  [{...base,url:'https://publisher.co/mx-other/article'},'Sin determinar','undetermined'],
  [{...base,url:'https://unlisted.co/article'},'Sin determinar','undetermined'],
  [{...base,url:'https://unlisted.com/article'},'Sin determinar','undetermined'],
  [{...base,url:'https://unlisted.com/article',rssCountry:'',id:'old',pais:'Perú'},'Sin determinar','undetermined'],
  [{...base,url:'',rssCountry:'',articleLanguage:'en-GB'},'Sin determinar','undetermined'],
  [{titular:'BBVA ofrece el pago de aportaciones del IMSS desde internet',rssCountry:'España'},'México','market'],
  [{titular:'¿Se cayó BBVA? Hay fallas en la app en pleno cierre de mes',sourceUrl:'https://sdpnoticias.com/',rssCountry:'España'},'Sin determinar','undetermined']
 ]){const decision=c.newsCountryDecision_(row);assert.equal(decision.country,country,JSON.stringify(row));assert.equal(decision.reason,reason);}
 assert.deepEqual([...c.newsCountryDecision_({...base,manualGeografias:['Argentina']}).geographies],['Argentina']);
 assert.deepEqual(new Set(c.newsCountryDecision_({...base,titular:'Nueva oferta en México y Colombia'}).geographies),new Set(['México','Colombia']));
});
test('v3: other geographies always resolves one region with local, configured-country, volume and stable priorities',()=>{
 const rows=(e,a,p)=>[{name:'APAC',total:p},{name:'EMEA',total:e},{name:'AMER',total:a}];
 for(const [counts,local,configured,selected,expected] of [
  [[0,0,1],'EMEA',[], '', 'APAC'],[[3,5,2],'EMEA',['AMER'],'','EMEA'],[[0,2,5],'EMEA',['AMER'],'','AMER'],[[0,2,5],'EMEA',['AMER','APAC'],'','APAC'],[[0,3,3],'EMEA',['AMER','APAC'],'','APAC'],[[0,0,0],'EMEA',[],'','EMEA'],[[0,1,2],'EMEA',['AMER'],'APAC','APAC'],[[0,0,1],'EMEA',['AMER'],'AMER','APAC'],[[1,2,0],'', ['EMEA','AMER'],'','AMER']
 ])assert.equal(preferredRegion(rows(...counts),local,configured,selected),expected);
});
test('v3: Noticias selects APAC before pagination when Other is the only geographic group',()=>{
 const {c}=server(),rows=[{id:'sg',pais:'Singapur',titular:'Pagos digitales',entidad:'BBVA',medio:'Editor',fecha:'2026-10-20',segmentos:['Empresas e instituciones'],senales:['Mejora de oferta'],taxonomia:[],etiquetas:{digital:true}}];
 const result=c.newsDashboard_(rows,{view:'news',newsGeography:'Otras geografías',segment:'Empresas e instituciones'},[],'news');assert.equal(result.newsGeography,'APAC');assert.equal(result.items[0].id,'sg');assert.equal(result.contextTotal,1);
});
test('v3: Novedades selects its one available subregion without another dashboard request',async t=>{
 const geographies=[{name:'España',code:'ES',region:'EMEA'},{name:'México',code:'MX',region:'AMER'},{name:'Singapur',code:'SG',region:'APAC'}],scope=[{name:'Empresas e instituciones',countries:['España','México']}],rows=[{id:'sg',pais:'Singapur',entidad:'BBVA',titular:'Nuevo pago digital',fecha:'2026-10-20',senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true},taxonomia:[]}];
 const a=await app(t,{configure({data}){data.geographies=geographies;data.applicationScope=scope;data.selection={country:'Otras geografías',segment:'Empresas e instituciones'};data.briefing={...noveltyOverview(rows,BRIEFING_ALLOWED_SIGNALS,applicationGeography(scope,'',geographies)),items:rows};}});
 const chosen=a.w.document.querySelectorAll('#briefing-geographies .geography-region[aria-selected="true"]');assert.equal(chosen.length,1);assert.equal(chosen[0].dataset.geography,'APAC');assert.match(a.find('#briefing-list').textContent,/Nuevo pago digital/);assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,1);
});

test('v3: geographic list separators reject adversarial input without nested repetition',()=>{const {c}=server();for(const text of [', and ', ' y ', ', e ', ', , and '])assert.equal(c.geographyListSeparator_(text),true);for(const text of ['', '   ', ' from ', ','.repeat(20000)+'x', ' ,'.repeat(20000)+'x'])assert.equal(c.geographyListSeparator_(text),false);});
test('v3: cached Other pages resolve the same subzone and keep unlocated records accessible without assigning a region',()=>{
 const {c}=server(),row=(id,pais)=>({id,pais,fecha:'2026-10-20',titular:'Pagos digitales '+id,entidad:'BBVA',medio:'Editor',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],taxonomia:[],etiquetas:{digital:true}}),rows=[row('sg','Singapur'),row('it','Italia'),row('unknown','Sin determinar')],query={newsGeography:'Otras geografías',segment:'Empresas e instituciones'},data=c.newsDashboard_(rows,query,[],'news'),bundle=c.compactNewsSnapshot_(rows,query,data),cached=c.compactNewsSnapshotData_(bundle,'Otras geografías','es');
 assert.equal(data.newsGeography,'EMEA');assert.equal(cached.newsGeography,data.newsGeography);assert.equal(cached.total,data.total);assert.deepEqual(new Set(cached.items.map(r=>r.id)),new Set(['it','unknown']));assert.equal(cached.items.find(r=>r.id==='unknown').pais,'Sin determinar');assert.equal(cached.newsRegions.find(r=>r.name==='APAC').total,1);
 const unknown=c.newsDashboard_([rows[2]],query,[],'news');assert.equal(unknown.total,1);assert.equal(unknown.items[0].pais,'Sin determinar');assert.ok(unknown.newsRegions.every(r=>r.total===0));
});
test('v3: Novedades preserves unlocated articles beside its selected subzone',async t=>{
 const {c}=server(),items=[{id:'unknown',pais:'Sin determinar',entidad:'BBVA',titular:'Pago digital sin región acreditada',fecha:'2026-10-20',senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true},taxonomia:[]}],briefing=c.briefing_(items,true);
 const a=await app(t,{configure({data}){data.selection={country:'Otras geografías',segment:'Empresas e instituciones'};data.briefing=JSON.parse(JSON.stringify(briefing));}});assert.match(a.find('#briefing-list').textContent,/sin región acreditada/);assert.equal(a.w.document.querySelectorAll('#briefing-geographies .geography-region[aria-selected="true"]').length,1);assert.equal(items[0].pais,'Sin determinar');
});
test('v3: a resolved international edition subzone keeps its frozen scope during navigation and export',()=>{
 const {c}=server(),config=c.configuration_(),context={cadence:'fortnightly',scope:config.applicationScope,geographies:config.geographies},rows=[{id:'es',pais:'España',fecha:'2026-10-20',entidad:'BBVA',medio:'Editor',titular:'Pago digital',segmentos:['Empresas e instituciones'],senales:['Mejora de oferta'],taxonomia:[],etiquetas:{digital:true}}],query={benchmark:'international',segment:'Empresas e instituciones'},first=c.newsDashboard_(rows,query,[],'news',context),next=c.newsDashboard_(rows,{...query,newsGeography:first.newsGeography},[],'news',context);
 assert.equal(first.newsGeography,'EMEA');assert.equal(first.total,1);assert.equal(next.total,1);assert.equal(next.items[0].id,'es');const grouping=c.newsReadingGeography_(context,{...query,newsGeography:'EMEA'});assert.equal(grouping.own('España'),false);assert.equal(c.newsCsv_(c.newsGeographySelection_(rows,{...query,newsGeography:'EMEA'},grouping),query,'es',true).count,1);
});
