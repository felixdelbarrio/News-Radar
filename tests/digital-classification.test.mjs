import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const positive=[
 'Qonto lanza una API bancaria para integrar tesorería en ERP',
 'BBVA incorpora IA a su asistente digital para empresas',
 'N26 launches new online banking subscription management',
 'BBVA mejora la banca móvil con autenticación biométrica',
 'Qonto lanza API para pagos masivos con aprobaciones multinivel',
 'BBVA renueva banca online y firma electrónica',
 'Stripe launches AI for payments',
 'Bankinter estrena una nueva app con notificaciones y control de gastos'
];
const negative=[
 'BBVA reports record earnings and appoints an AI director',
 'Qonto anuncia resultados financieros de banca online',
 'BBVA obtiene un premio de innovación digital',
 'Banco tradicional presenta resultados trimestrales',
 'Festival presenta aplicaciones de IA para pintura'
];
test('canal digital contempla móvil, web, API e IA en contexto bancario; etiquetas y capacidades no son excluyentes',()=>{
 const {c}=server();for(const title of positive){const labels=c.classification_(c.searchText_(title),c.searchText_(title)).labels;assert.equal(labels.digital,true,title);assert.equal(labels.generalista,true,title);assert.ok(labels.capacidades.length,title);}
 for(const title of negative)assert.equal(c.classification_(c.searchText_(title),c.searchText_(title)).labels.digital,false,title);
 assert.equal(c.classification_('bankinter celebra encuentros de analisis y mercados','bankinter celebra encuentros de analisis y mercados. la entidad ofrece banca online y herramientas de ia').labels.digital,false);
 const labels=c.classification_(c.searchText_(positive[4]),c.searchText_(positive[4])).labels;assert.ok(labels.capacidades.length>=3);
 assert.deepEqual(JSON.parse(JSON.stringify(c.savedNewsLabels_('bad'))),{generalista:false,digital:false,capacidades:[]});
});
test('etiquetas se persisten durante la ingesta y no se recalculan al consultar, exportar o generar newsletters',()=>{
 const {c}=server(),feed=c.feeds_().find(row=>row.entity==='BBVA'&&row.kind==='rss'),now=new Date('2026-10-12T12:00:00Z');
 const item=c.evaluate_({title:positive[1],excerpt:'Una mejora para clientes de empresas',url:'https://www.bbva.com/es/ia/',date:'2026-10-11'},feed,now).item;assert.ok(item);
 const values=c.newsRecord_(item,feed,now);assert.equal(JSON.parse(values[12]).digital,true);c.append_('Noticias',[values]);
 c.newsLabels_=()=>{throw Error('Las consultas deben leer las etiquetas persistidas');};
 const rows=c.rows_('Noticias');assert.equal(c.selectNews_(rows,{coverage:'digital'}).length,1);assert.equal(c.selectNews_(rows,{coverage:'generalista'}).length,1);assert.equal(c.selectNews_(rows,{coverage:'digital',country:'México'}).length,0);
 assert.equal(c.newsCsv_(rows,{}).count,1);assert.doesNotMatch(c.newsCsv_(rows,{}).csv.split('\r\n')[0],/clasificacion/);
 assert.equal(c.newsletter_(rows,{},'Canal',now,'sub').count,1);assert.equal(c.radarMetrics_(c.selectNews_(rows,{}),{}).summary.news,1);
});
test('histórico acotado, reanudable e idempotente sin volver a consultar fuentes; cambios se aplican sin desplegar',()=>{
 const {c,sheets,properties}=server(),sheet=sheets.get('Noticias');
 for(let i=0;i<205;i++)sheet.grid.push([String(i),'2026-10-10','España','Editor','BBVA',positive[1],'','','https://example.com/'+i,'','Editor','es','']);
 c.requestNewsClassification_(true);c.UrlFetchApp={fetchAll:()=>{throw Error('No se consultan fuentes al clasificar');}};
 const reads=[],writes=[],range=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{reads.push(args);const r=range(...args),set=r.setValues.bind(r);r.setValues=values=>{writes.push(args);return set(values);};return r;};
 c.newsClassificationBatch_();assert.equal(JSON.parse(properties.CLASSIFICATION_JOB).next,102);assert.equal(sheet.grid[100][12].includes('"digital":true'),true);assert.equal(sheet.grid[101][12],'');
 c.newsClassificationBatch_();assert.equal(JSON.parse(properties.CLASSIFICATION_JOB).next,202);c.newsClassificationBatch_();assert.equal(c.classificationJob_().state,'Completada');assert.ok(reads.every(row=>row[2]<=100));assert.equal(c.rows_('Noticias').filter(row=>JSON.parse(row.clasificacion).digital).length,205);assert.equal(writes.filter(row=>row[1]===13).length,3);
 c.initializeConfiguration();assert.equal(c.classificationJob_().state,'Completada');c.requestNewsClassification_(true);while(c.classificationPending_())c.newsClassificationBatch_();assert.equal(writes.filter(row=>row[1]===13).length,3);
 const snapshot=JSON.parse(JSON.stringify(c.getConfiguration()));snapshot.config.capabilities={Empresas:[],Retail:[]};c.saveConfiguration(snapshot);assert.ok(properties.CLASSIFICATION_JOB);while(c.classificationPending_())c.newsClassificationBatch_();assert.equal(JSON.parse(sheet.grid[1][12]).digital,false);assert.equal(JSON.parse(sheet.grid[1][12]).generalista,true);
});
test('filtros independientes se combinan y todas las vistas incluyen cobertura digital por defecto',()=>{
 const {c}=server(),now=new Date('2026-10-12T12:00:00Z');assert.equal(c.dashboardQuery_({view:'news',initial:true},now).coverage,'digital');const briefing=c.dashboardQuery_({view:'briefing',initial:true},now);assert.equal(briefing.segment,'Empresas e instituciones');assert.equal(briefing.coverage,'digital');assert.equal(briefing.entity,undefined);
 assert.equal(c.dashboardQuery_({view:'news',coverage:''},now).coverage,'');assert.equal(c.dashboardQuery_({view:'radar',coverage:'digital'},now).coverage,'digital');assert.equal(c.dashboardQuery_({coverage:'digital'},now).coverage,'digital');assert.throws(()=>c.dashboardQuery_({view:'news',coverage:'mobile'}),/cobertura/);
 const rows=positive.slice(0,2).map((title,i)=>({id:String(i),fecha:'2026-10-10',entidad:'BBVA',pais:i?'México':'España',titular:title,extracto:'',clasificacion:JSON.stringify({generalista:true,digital:true,capacidades:[]})}));rows.push({...rows[0],id:'general',titular:'BBVA presenta financiación para nuevas empresas',url:'https://example.com/general',clasificacion:JSON.stringify({generalista:true,digital:false,capacidades:[]})});
 assert.equal(c.selectNews_(rows,{}).length,3);assert.equal(c.selectNews_(rows,{coverage:'generalista'}).length,3);assert.equal(c.selectNews_(rows,{coverage:'digital'}).length,2);assert.equal(c.selectNews_(rows,{coverage:'digital',country:'España',entity:'BBVA',from:'2026-10-09',to:'2026-10-11'}).length,1);
});
test('el selector real conserva elecciones por vista, permite Todos y aparece en Radar',async t=>{
 const {c}=server(),a=await app(t,{configure:({data})=>{data.selection=c.dashboardQuery_({view:'briefing',initial:true});data.defaults=c.dashboardQuery_({view:'news',initial:true});}});
 assert.equal(a.find('#filters [name="coverage"]').value,'digital');assert.equal(a.find('#filters [name="segment"]').value,'Empresas e instituciones');assert.equal(a.find('#coverage-filter').hidden,false);
 a.data.selection=undefined;await a.change('#filters [name="coverage"]','generalista');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.coverage,'generalista');
 await a.click('[data-view="news"]');assert.equal(a.find('#filters [name="coverage"]').value,'digital');await a.change('#filters [name="coverage"]','');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.coverage,'');
 await a.click('[data-view="briefing"]');assert.equal(a.find('#filters [name="coverage"]').value,'generalista');await a.click('[data-view="radar"]');assert.equal(a.find('#coverage-filter').hidden,false);
});
test('migración conserva noticias y ediciones; incorpora valores nuevos una sola vez',()=>{
 const {c,sheets,properties}=server(),sheet=sheets.get('Configuracion'),caps=sheet.grid.find(row=>row[0]==='capabilities'),feeds=sheet.grid.find(row=>row[0]==='feeds'),entities=sheet.grid.find(row=>row[0]==='entities');
 const config=c.getConfiguration().config,old=JSON.parse(caps[1]);old.Empresas=old.Empresas.slice(0,35);old.Empresas[0].enabled=false;old.Empresas[0].terms=['termino propio'];old.Retail=old.Retail.slice(0,35);caps[1]=JSON.stringify(old);feeds[1]=JSON.stringify(config.feeds.slice(0,5).map(row=>({...row,enabled:false})));entities[1]=JSON.stringify(config.entities.slice(0,-4));properties.CATALOG_VERSION='1.10.0';properties.CLASSIFICATION_VERSION='1.10.0';delete properties.CLASSIFICATION_JOB;c.invalidateConfiguration_();
 const news=sheets.get('Noticias');news.grid[0]=news.grid[0].slice(0,12);news.grid.push(['original','2026-10-10','España','Editor','BBVA',positive[1],'','','https://www.bbva.com/original','capturada','Editor','es']);c.initializeConfiguration();const upgraded=c.getConfiguration().config;
 assert.equal(upgraded.feeds.length,7);assert.equal(upgraded.entities.length,config.entities.length);assert.equal(upgraded.capabilities.Empresas[0].enabled,false);assert.deepEqual(JSON.parse(JSON.stringify(upgraded.capabilities.Empresas[0].terms)),['termino propio']);assert.equal(news.grid[1][0],'original');assert.equal(news.grid[0].length,14);assert.ok(properties.CLASSIFICATION_JOB);
 const stored=JSON.stringify(sheet.grid);c.initializeConfiguration();assert.equal(JSON.stringify(sheet.grid),stored);
});
test('Novedades agrupa BBVA primero; newsletter escoge un único destacado reciente por país',()=>{
 const {c}=server(),rows=[];for(const [entity,total,date] of [['BBVA',1,'2026-10-08'],['Qonto',3,'2026-10-11'],['N26',2,'2026-10-10'],['Santander',1,'2026-10-09']])for(let i=0;i<total;i++)rows.push({entidad:entity,fecha:date,titular:entity+' lanza una nueva cuenta para empresas '+i,extracto:'',url:'https://example.com/'+entity+i,pais:'España',medio:'Editor'});
 const selected=c.annotateNews_(rows),grouped=c.newsDashboard_(c.annotateNews_(rows),{},c.feeds_(),'briefing').briefing.items;assert.deepEqual(JSON.parse(JSON.stringify(grouped.map(row=>row.entidad))),['BBVA','Qonto','Qonto','Qonto','N26','N26','Santander']);
 const newsletter=c.newsletter_(rows,{},'Canal',new Date('2026-10-12T12:00:00Z'),'sub');assert.equal(newsletter.items[0].entidad,'Qonto');assert.equal(newsletter.count,1);assert.equal(newsletter.evidence.length,7);assert.equal(c.briefing_(selected).items[0].entidad,'BBVA');
});
