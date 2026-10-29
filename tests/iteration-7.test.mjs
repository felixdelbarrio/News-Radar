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
test('el catálogo no publica conceptos emergentes automáticos',()=>{const state={documents:0,candidates:{}};taxonomyObserve(state,'pagos con stablecoins',definitions,new Set(),'Editor');assert.equal(taxonomyBuild(state).filter(row=>row.origin==='tf-idf').length,0);});

test('newsletters no solicitan reconstrucción trimestral',()=>{const {c,properties:p}=setup();c.settings_().newsletterEnabled=true;p.NEWSLETTER_REQUEST='true';assert.equal(c.queueQuarterlyTaxonomy_,undefined);assert.notEqual(c.newsletterReadyAt_({jobs:[]}),Infinity);});
test('las pruebas administrativas llevan asunto de prueba y no contaminan el historial, y el vacío no se envía',()=>{
 const {c}=setup(),period=c.newsletterWindow('fortnightly',new Date().toISOString().slice(0,10)),input=[{...story('test','España','BBVA','API Channel'),fecha:period.from}],original=c.rows_;let rows=input,sent=0;
 c.rows_=(name,...args)=>name==='Noticias'?rows:original(name,...args);c.annotateNews_=value=>value;c.newsletterSender_=()=>({address:'sender@bbva.com'});c.sendNewsletterMail_=(_sender,_email,content)=>{sent++;assert.match(content.subject,/^\[bIA\] 🚀 BBVA BEI · \[PRUEBA\]/);return 'gmail-test';};
 assert.equal(c.sendNewsletterTest({cadence:'fortnightly',country:'España'}).accepted,true);assert.equal(c.newsletterSentContent_(c.rows_('NewsletterEnvios')).size,0);rows=[];assert.equal(c.sendNewsletterTest({cadence:'fortnightly'}).accepted,false);assert.equal(sent,1);
});
