import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {inferredCountryCode} from '../src/client/core/browser-country.js';
function server(){const s=storage();s.c.initializeConfiguration();const tables=vm.runInContext('RADAR.sheets',s.c);for(const [name,keys] of Object.entries(tables))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}

test('39: every enabled geography has one active profile or one bounded BEI fallback, without duplicate tasks',()=>{
 const {c}=server(),config=c.configuration_(),profiles=c.defaultFeeds_().filter(row=>row.kind==='profile'&&row.enabled),covered=new Set(profiles.map(row=>row.country)),feeds=c.feeds_(),fallbacks=feeds.filter(row=>row.geographySearch);
 assert.ok(fallbacks.length>0);assert.equal(fallbacks.length,config.geographies.filter(row=>row.enabled&&!covered.has(row.name)).length);
 for(const geo of config.geographies.filter(row=>row.enabled)){const local=feeds.filter(row=>row.country===geo.name);assert.ok(local.length,geo.name);assert.equal(local.filter(row=>row.geographySearch).length,covered.has(geo.name)?0:1);}
 for(const row of fallbacks){const q=new URL(row.url).searchParams.get('q');assert.ok(q.length<=c.COLLECTION_POLICY?.queryChars||q.length<1500);assert.match(q,/\(.+\) \(.+\) \(.+\)/);assert.ok(q.includes('"'+config.geographies.find(g=>g.name===row.country).searchName+'"'));assert.equal(row.kind,'rss');}
 const range={from:'2026-10-01',to:'2026-10-07'},tasks=c.collectionFeeds_(range);assert.equal(new Set(tasks.map(row=>row.url)).size,tasks.length);for(const row of fallbacks)assert.equal(tasks.filter(task=>task.id===row.id).length,1);
 c.saveSourceSettings([]);assert.equal(c.feeds_().length,0,'explicitly disabled sources must not regenerate active fallbacks');
});

test('39: every enabled country preserves explicit article evidence above a contradictory RSS origin',()=>{
 const {c}=server();for(const geo of c.configuration_().geographies.filter(row=>row.enabled)){const row={titular:'BBVA lanza plataforma digital de pagos para empresas en '+geo.name,rssCountry:geo.code==='ES'?'México':'España',language:'en'};assert.equal(c.newsCountryDecision_(row).country,geo.name,geo.code);}
 for(const code of ['PA','BO','PY','AD'])assert.equal(c.configuration_().geographies.find(row=>row.code===code).language,code==='AD'?'es':'es-419');
 assert.equal(c.newsCountryDecision_({titular:'A new corporate platform',articleLanguage:'zh-TW'}).country,'APAC');
});

test('39: technical US edition for Uruguay is not a conflicting article country; headline targets prevail',()=>{
 const {c}=server(),config=c.configuration_(),geo=config.geographies.find(g=>g.code==='UY'),entity=config.entities.find(e=>e.name==='Santander'),feed=c.profileFeed_(geo,entity),base={entidad:'Santander',fuente:feed.name,feedUrl:feed.url,rssCountry:'Uruguay'};
 assert.equal(new URL(feed.url).searchParams.get('gl'),'US');assert.equal(c.newsCountryDecision_({...base,titular:'Santander presenta plataforma de pagos para empresas'}).country,'Uruguay');
 for(const [title,expected] of [['Santander Uruguay lanza pagos digitales para empresas','Uruguay'],['HSBC México ofrece nuevas soluciones de tesorería para Asia','APAC'],['Bank launches corporate payments in Taiwan','APAC'],['BBVA lanza banca digital en España','España'],['BBVA lanza banca digital en México','México'],['BBVA lanza banca digital en Argentina','Argentina'],['BBVA lanza banca digital en Perú','Perú'],['BBVA lanza banca digital en Colombia','Colombia']])assert.equal(c.newsCountryDecision_({...base,titular:title}).country,expected,title);
 assert.equal(inferredCountryCode([], 'America/La_Paz'),'BO');assert.equal(inferredCountryCode([], 'Asia/Taipei'),'TW');
 const national=c.newsCountryDecision_({...base,titular:'HSBC launches corporate payments in Asia, starting in Singapore'});assert.equal(national.country,'Singapur');assert.equal(national.reason,'headline');assert.ok(national.countryEvidence.some(item=>item.country==='Singapur'));
 const fromContent=c.newsCountryDecision_({...base,titular:'HSBC México ofrece nuevas soluciones de tesorería para Asia',extracto:'La plataforma se ofrecerá primero a las empresas en Singapore.'});assert.equal(fromContent.country,'Singapur');assert.equal(fromContent.reason,'content');
});

test('39: source quality uses retained summaries once, separates unknown denominators and caches bounded reads',()=>{
 const s=server(),{c,sheets}=s,now=new Date().toISOString(),cycle='sample',source=c.feeds_()[0].name;
 sheets.get('Auditoria').grid.push([cycle,now,source,'https://example.com/rss','Fuente consultada','12 evaluadas; 2 nuevas; 7 excluidas; 3 duplicadas; 2 relevantes; 12 dentro del período; motivos {"fuera de canal":7}']);
 sheets.get('Auditoria').grid.push([...sheets.get('Auditoria').grid.at(-1)]);
 sheets.get('Recopilacion').grid.push([cycle,source,'https://example.com/rss','Error','2',now,'0','0','HTTP 503','2026-10-01']);
 sheets.get('Recopilacion').grid.push([cycle,source,'https://example.com/other','Completada','1',now,'12','2','','2026-10-01']);
 sheets.get('Cobertura').grid.push([cycle,now,source,'España','','','12','12','sí','2','Parcial','saturada']);
 const result=c.getSourceQuality({days:'7',source}),row=result.items[0];assert.equal(row.queries,1);assert.equal(row.errors,2);assert.equal(row.attempts,3);assert.equal(row.availability,33.3);assert.equal(row.retrieved,12);assert.equal(row.discarded,7);assert.equal(row.reasons['fuera de canal'],7);assert.equal(row.saturated,1);assert.equal(row.saturationPercent,100);assert.equal(row.localPercent,null);assert.equal(row.unknownPercent,null);
 const reads=s.reads;assert.equal(c.getSourceQuality({days:'7',source}).cacheHit,true);assert.equal(s.reads,reads);assert.throws(()=>c.getSourceQuality({days:31}),/Período/);s.setEmail('outsider@example.com');assert.throws(()=>c.getSourceQuality({days:30}));
});

test('39: Noticias has one geography control and thematic requests keep all geographic counts',async t=>{
 const a=await app(t,{configure({data}){data.newsGeography='España';data.selection={country:'',from:'2026-10-01',to:'2026-10-31'};}});await a.click('[data-view="news"]');assert.equal(a.find('#geography-filter').hidden,true);assert.equal(a.w.document.querySelector('[data-remove-filter="country"]'),null);
 await a.change('#filters [name="search"]','pagos');const call=a.calls.filter(row=>row.method==='getDashboard').at(-1);assert.equal(call.query.country||'','');assert.equal(call.query.newsGeography,'España');
});

test('39: incoming external countries resolve to their regional tab instead of the first own country',()=>{
 const {c}=server(),rows=[['es','España','BBVA renueva su banca digital de tesorería'],['ng','Nigeria','BBVA abre APIs de pagos corporativos'],['sg','Singapur','BBVA digitaliza el comercio exterior empresarial']].map(([id,pais,titular])=>({id,pais,titular,entidad:'BBVA',medio:'Editor',url:'https://example.com/'+id,fecha:'2026-10-20',segmentos:['Empresas e instituciones'],senales:['Mejora de oferta'],taxonomia:[],etiquetas:{digital:true}}));
 for(const [country,region,id] of [['Nigeria','EMEA','ng'],['Singapur','APAC','sg']]){const data=c.newsDashboard_(rows,{view:'news',country,from:'2026-10-01',to:'2026-10-31'},[],'news');assert.equal(data.newsGeography,region);assert.equal(data.contextTotal,3);assert.deepEqual(Array.from(data.items,row=>row.id),[id]);const selected=c.newsGeographySelection_(rows,{newsGeography:country});assert.deepEqual(Array.from(selected,row=>row.id),[id]);}
});

test('39: source quality administration reuses filters, pagination and escaped table cells',async t=>{
 const a=await app(t,{configure({replies}){replies.getSourceQuality={days:30,items:[{source:'<unsafe>',country:'España',availability:null,queries:0,errors:0,retrieved:0,relevant:0,reasons:{'<b>':2},discarded:2,duplicates:0,lastNews:'',lastQuery:'',publishers:0,localPercent:null,unknownPercent:null,saturationPercent:null}],total:1,page:0,pageSize:10,options:{days:[['7','7 días'],['30','30 días'],['90','90 días']],source:['<unsafe>']},metrics:{sources:1,queries:0,errors:0,retrieved:0,relevant:0,duplicates:0},limit:5000,limited:true,retentionDays:90,retainedFrom:null};}});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="sourceQuality"]');assert.equal(a.find('#sourceQuality-section').hidden,false);assert.equal(a.find('#sourceQuality-days').value,'30');assert.equal(a.calls.filter(row=>row.method==='getSourceQuality').at(-1).query.days,'30');assert.match(a.find('#sourceQuality-body').textContent,/<unsafe>/);assert.equal(a.w.document.querySelector('#sourceQuality-body unsafe'),null);await a.change('#sourceQuality-days','7');assert.equal(a.calls.filter(row=>row.method==='getSourceQuality').at(-1).query.days,'7');assert.match(a.find('#sourceQuality-note').textContent,/métricas parciales/);
});


test('39: event markets override actor origins and preserve multinational scope',()=>{
 const {c}=server();
 for(const [titular,extracto,expected] of [
  ['Taiwan bank launches corporate payments platform in Spain','','España'],
  ['HSBC México lanza pagos para empresas en Bangladesh','','Bangladés'],
  ['Westpac Australia launches corporate payments in New Zealand','','Nueva Zelanda'],
  ['Santander UK Banking Outage Leaves Thousands Without Access to Funds','','Reino Unido'],
  ['Afirme digitaliza gastos para empresas','El banco mexicano amplía su plataforma en México.','México'],
  ['BBVA presenta pagos digitales Bre-B','','Colombia'],
  ['Amazon and Santander’s Openbank Pay launch new payment options for customers in Poland','','Polonia'],
  ['BCP lanza SIP y moderniza el sistema de pagos en el Paraguay','','Paraguay'],
  ['BCP amplía su plataforma empresarial en Bolivia','','Bolivia'],
  ['Davivienda amplía el acceso a pagos digitales en Panamá','','Panamá'],
  ['HSBC México presenta plataforma empresarial','La nueva solución se lanza en Bangladesh.','Bangladés']
 ])assert.equal(c.newsCountryDecision_({titular,extracto,rssCountry:'España'}).country,expected,titular);
 const multi=c.newsCountryDecision_({titular:'Revolut outage: app and cards stop working in UK, France and Spain'});assert.deepEqual(new Set(multi.geographies),new Set(['Reino Unido','Francia','España']));assert.equal(multi.scope,'multicountry');
 assert.equal(c.newsCountryDecision_({titular:'Getnet llega a un acuerdo con WeChat Pay para abrir sus pagos a los turistas de China',rssCountry:'España'}).country,'España');
});

test('39: the existing historical batch can repair geography without changing functional or editorial fields',()=>{
 const {c,sheets}=server(),keys=vm.runInContext('RADAR.sheets.Noticias',c),record={id:'geo-only',fecha:'2026-10-20',pais:'España',titular:'HSBC launches corporate payments in Bangladesh',extracto:'Contenido bloqueado',entidad:'HSBC',medio:'Editor',clasificacion:JSON.stringify({digital:true,capacidades:['Empresas: Pagos'],senales:['Lanzamiento','Alianza','Mejora de oferta','Incidencia'],evento:'Lanzamiento',procedencia:{mechanism:'blocked'}}),taxonomia:JSON.stringify({ids:[]})};
 sheets.get('Noticias').grid.push(keys.map(key=>record[key]||''));const before=[...sheets.get('Noticias').grid[1]],labels=JSON.parse(before[keys.indexOf('clasificacion')]);c.requestNewsClassification_(true,true);c.newsClassificationBatch_();const after=sheets.get('Noticias').grid[1];
 assert.equal(after[keys.indexOf('pais')],'Bangladés');for(let i=0;i<keys.length;i++)if(!['pais','clasificacion'].includes(keys[i]))assert.equal(after[i],before[i],keys[i]);const updated=JSON.parse(after[keys.indexOf('clasificacion')]);delete updated.procedencia;delete labels.procedencia;assert.deepEqual(updated,labels);assert.equal(c.classificationJob_().processed,undefined);assert.equal(c.classificationJob_().next,3);
});
