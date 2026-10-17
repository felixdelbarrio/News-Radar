import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/server.mjs';
import {configurationDefaults} from '../scripts/configuration-defaults.mjs';
import {taxonomyDefinitions,taxonomyText,taxonomyMatches,taxonomyObserve,taxonomyBuild} from '../src/shared/taxonomy.js';
const definitions=taxonomyDefinitions(configurationDefaults().taxonomy);
function setup(){const s=storage();s.c.initializeConfiguration();s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
function story(id,country,entity,subpalanca){return {id,pais:country,entidad:entity,fecha:'2026-10-10',medio:'Editor',fuente:'Editor',titular:entity+' presenta '+subpalanca+' para empresas',extracto:'Una nueva solución empresarial '+id,url:'https://example.com/'+id,tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',etiquetas:{digital:true,capacidades:['Empresas: Pagos']},taxonomia:[{id:subpalanca,palanca:'17.Enablers',subpalanca}]};}
test('el maestro aporta descripciones por encabezado y la configuración guarda solo equivalencias',()=>{
 const {c,sheets}=setup(),rules=JSON.parse(sheets.get('Configuracion').grid.find(row=>row[0]==='taxonomy')[1]);assert.ok(rules.every(block=>block.functions.every(row=>!('name' in row)&&!('description' in row))));
 const source=c.functionalCatalogRows_([[['ID','Bloque funcional','Funcionalidad/Sub Operativa','Descripción'],['08.02','Financiación','Crédito Virtual','Descripción del crédito']],[['ID','Bloque funcional','Funcionalidad/Sub Operativa','Comentarios','Otro','Descripción'],['20.04','Venta Digital','Quantum','','','Analítica cualitativa']]]);
 assert.equal(source[0].functions[0].description,'Descripción del crédito');assert.equal(source[1].functions[0].description,'Analítica cualitativa');
 const snapshot=c.getConfiguration();snapshot.config.taxonomy[0].functions[0].name='Nombre local';assert.throws(()=>c.saveConfiguration(snapshot),/exclusivamente desde el catálogo maestro/);
});
test('las descripciones permiten reconocer la operativa y una landing necesita evidencia agregadora',()=>{
 const headline='Banco ofrece a concesionarios financiación para adquirir vehículos y mantenerlos expuestos hasta su venta';assert.equal(taxonomyMatches(taxonomyText(headline),definitions,headline)[0]?.row.key,'08.23');
 for(const text of ['BBVA lanza Cobro al Toque para que las pymes reciban pagos','Banco lanza un préstamo para empresas','Banco presenta un nuevo seguro para transacciones'])assert.ok(taxonomyMatches(taxonomyText(text),definitions,text).every(({row})=>!row.subpalanca.includes('Landing')));
 const dashboard='Banco presenta una visión integral de financiación en su landing de Financiación';assert.equal(taxonomyMatches(taxonomyText(dashboard),definitions,dashboard)[0]?.row.key,'08.01');
});
test('un producto concreto admite una noticia oficial; una mención aislada de un tercero no lo crea',()=>{
 const headline='BBVA lanza ‘Cobro al Toque’ para facilitar soluciones de cobro a las pymes',text=taxonomyText(headline+' Un smartphone se convierte en punto de venta móvil con Tap to Phone.');
 for(const primary of [false,true]){const state={documents:0,candidates:{}};taxonomyObserve(state,text,definitions,new Set(),'BBVA',{headline,primary});const emerging=taxonomyBuild(state).filter(row=>row.origin==='tf-idf');assert.equal(emerging.length,primary?1:0);if(primary){assert.equal(emerging[0].subpalanca,'11.xx Cobro al Toque');assert.equal(taxonomyMatches(text,taxonomyBuild(state),headline)[0].row.subpalanca,'11.xx Cobro al Toque');}}
 const {c}=setup();assert.equal(c.taxonomyPrimarySource_({url:'https://www.bbva.com/es/empresas/producto/',entidad:'BBVA'}),true);assert.equal(c.taxonomyPrimarySource_({url:'https://news.google.com/rss/articles/third-party',entidad:'BBVA',medio:'BBVA'}),false);
});
test('la quincenal conserva los literales y sus accesos abren Noticias con período y evidencias exactas',()=>{
 const {c}=setup(),query={view:'briefing',country:'España',from:'2026-10-01',to:'2026-10-15'},input=[story('s1','España','BBVA','API Channel'),story('s2','España','Qonto','API Channel'),story('m','México','Santander','Integración contable'),story('c','Colombia','Bancolombia','Integración contable')];
 const content=c.newsletterContent_(input,query,'Selección',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 for(const text of ['Banca de Empresas e Instituciones','Trending topics en España.','Funcionalidad / sub operativa, más relevante','Noticia seleccionada','1 noticia más en este ámbito'])assert.ok(d.body.textContent.includes(text),text);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Selección',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 for(const anchor of d.querySelectorAll('.newsletter-related,.newsletter-cta')){const params=Object.fromEntries(new URL(anchor.href).searchParams),result=c.getDashboard({...params,initial:true});assert.equal(params.view,'news');assert.equal(params.from,query.from);assert.equal(result.selection.from,query.from);assert.equal(result.selection.to,query.to);if(params.benchmark==='international'){assert.equal(params.newsGeography,'Otras geografías');assert.equal(result.total,2);assert.equal(result.newsGeographies.length,1);assert.equal(result.newsGeographies[0].name,'Otras geografías');assert.equal(c.exportNews(params).count,2);}else assert.equal(result.selection.country,'España');}
 const global=c.newsletterContent_(input.map((row,i)=>({...row,taxonomia:[{...row.taxonomia[0],subpalanca:'Función '+i}]})),{...query,country:''},'Sector',new Date(),'sub','es','global');assert.equal(global.count,3);assert.doesNotMatch(global.html,/TU GEOGRAFÍA/);assert.match(global.html,/MIRADA INTERNACIONAL/);
});
test('la revisión trimestral termina antes de habilitar envíos y conserva sus solicitudes al reanudar',()=>{
 const {c,properties:p}=setup();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';const period={to:'2026-09-30'};assert.equal(c.queueQuarterlyTaxonomy_(period),false);assert.equal(c.newsletterReadyAt_({jobs:[]}),Infinity);c.drainTaxonomyRequest_();assert.equal(c.taxonomyJob_().request,'quarterly:2026-09-30');
 for(let i=0;i<4&&c.taxonomyPending_();i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Completada');assert.equal(p.TAXONOMY_PERIOD,period.to);assert.equal(p.TAXONOMY_QUARTER_REQUEST,undefined);assert.equal(c.queueQuarterlyTaxonomy_(period),true);assert.ok(c.newsletterReadyAt_({jobs:[]})<=Date.now());assert.equal(p.DASHBOARD_SNAPSHOT_REQUEST,'ready');
});
test('las pruebas administrativas llevan asunto de prueba y no contaminan el historial, y el vacío no se envía',()=>{
 const {c}=setup(),period=c.newsletterPeriod_('fortnightly',new Date()),input=[{...story('test','España','BBVA','API Channel'),fecha:period.from}],original=c.rows_;let rows=input,sent=0;
 c.rows_=(name,...args)=>name==='Noticias'?rows:original(name,...args);c.annotateNews_=value=>value;c.newsletterSender_=()=>({address:'sender@bbva.com'});c.sendNewsletterMail_=(_sender,_email,content)=>{sent++;assert.match(content.subject,/^\[PRUEBA\]/);return 'gmail-test';};
 assert.equal(c.sendNewsletterTest({cadence:'fortnightly',country:'España'}).accepted,true);assert.equal(c.newsletterSentContent_(c.rows_('NewsletterEnvios')).size,0);rows=[];assert.equal(c.sendNewsletterTest({cadence:'fortnightly'}).accepted,false);assert.equal(sent,1);
});
