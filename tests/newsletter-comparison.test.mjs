import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {storage} from './helpers/delivery.mjs';
import {app} from './helpers/app.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';s.c.annotateNews_=rows=>rows;return s;}
const story=(id,country,entity,theme='Pagos y cobros',date='2026-09-10')=>({id,pais:country,entidad:entity,fecha:date,medio:'Editor',titular:entity+' presenta servicio '+id,extracto:'Una nueva capacidad para el canal.',url:'https://example.com/'+id,tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],etiquetas:{digital:true},senales:['Lanzamiento de producto'],taxonomia:[{palanca:theme,subpalanca:'API'}]});
const query={view:'radar',country:'España',entity:'BBVA',segment:'Empresas e instituciones',coverage:'digital',from:'2026-01-01',to:'2026-12-31'};
function corpus(){return [...Array.from({length:6},(_,i)=>story('local'+i,'España',i%2?'Santander':'BBVA',i<4?'Integración y automatización':'Pagos y cobros')),...Array.from({length:3},(_,i)=>story('group'+i,'México','BBVA')),story('turkey','Turquía','BBVA','Integración y automatización'),...Array.from({length:5},(_,i)=>story('market'+i,'Reino Unido','Revolut',i<4?'Pagos y cobros':'Integración y automatización')),story('unknown','Sin determinar','BBVA')];}
test('la newsletter anual está retirada de generación y selección de cadencias',()=>{
 const {c}=setup();assert.equal(vm.runInContext('newsletterCadences.yearly',c),undefined);assert.throws(()=>c.newsletterWindow('yearly','2026-10-20'),/Periodicidad/);assert.throws(()=>c.newsletterContent_(corpus(),query,'Anual',new Date(),'sub'),/Periodicidad/);
});
test('la trimestral separa geografía e internacional y abre las evidencias exactas de cada bloque',()=>{
 const {c}=setup(),items=corpus(),q={...query,view:'news',entity:''},content=newsletterFixture(c,items,q,'Trimestre',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 assert.equal(content.total,16);assert.equal(content.editorial.landscapes.local.total,6);assert.equal(content.editorial.landscapes.global.total,10);assert.deepEqual(Array.from(content.editorial.cards,row=>row.scope),['local','global']);assert.equal(d.querySelectorAll('.newsletter-comparison').length,0);assert.equal(d.querySelectorAll('.newsletter-report').length,2);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Trimestre',q,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 for(const card of content.editorial.cards){const params=Object.fromEntries(new URL(card.related).searchParams),evidence=c.exportNews(params);assert.equal(evidence.count,card.relatedCount);if(card.scope==='global')assert.equal(params.benchmark,'international');}
});
test('la trimestral comunica ausencia local y respeta idiomas y filtros sin fabricar comparaciones',()=>{
 const {c}=setup(),items=[story('one','México','BBVA')],q={...query,view:'news',entity:''};
 for(const language of ['es','en','tr']){const content=newsletterFixture(c,items,q,'Trimestre',new Date(),'sub',language,'edition'),d=new JSDOM(content.html).window.document;assert.equal(content.editorial.localCount,0);assert.equal(content.editorial.globalCount,1);assert.equal(d.querySelectorAll('.newsletter-report').length,1);assert.doesNotMatch(content.html,/\{theme\}|undefined|NaN/);assert.equal(d.querySelector('.newsletter-comparison'),null);}
 assert.equal(newsletterFixture(c,items,{...q,source:'Otro medio'},'Trimestre',new Date(),'sub').count,0);
});
test('la trimestral sustituye los contadores mensuales por un ejemplo dentro del informe',()=>{
 const {c}=setup(),items=['07','08','09'].map((month,i)=>story('quarter'+i,'España','BBVA','Pagos y cobros','2026-'+month+'-10')),content=newsletterFixture(c,items,{...query,entity:'',view:'news',from:'2026-07-01',to:'2026-09-30'},'Trimestre',new Date(),'sub','es','edition'),d=new JSDOM(content.html).window.document;
 assert.equal(content.editorial.cadence,'quarterly');assert.equal(d.querySelectorAll('.newsletter-quarters').length,0);assert.equal(d.querySelectorAll('.newsletter-report .newsletter-article').length,1);assert.equal(d.querySelectorAll('.newsletter-metric').length,3);assert.match(content.text,/trimestre/);assert.doesNotMatch(content.text,/corpus|El espejo del año/);
});
test('las ventanas cubren quincenas naturales, años bisiestos, trimestres y cierres en la zona configurada',()=>{
 const {c}=setup();for(const [cadence,day,from,to] of [['fortnightly','2028-03-01','2028-02-16','2028-02-29'],['fortnightly','2026-10-16','2026-10-01','2026-10-15'],['fortnightly','2027-01-01','2026-12-16','2026-12-31'],['quarterly','2027-01-01','2026-10-01','2026-12-31'],['quarterly','2026-07-01','2026-04-01','2026-06-30']]){const period=c.newsletterWindow(cadence,day,true);assert.deepEqual([period.from,period.to],[from,to]);}
 const midnight=c.newsletterPeriod_('fortnightly',new Date('2026-10-15T22:30:00Z'));assert.equal(midnight.to,'2026-10-15');
 assert.equal(c.subscriptionRecord_({},'owner@bbva.com','id',new Date()).periodicidad,'all');
});
test('inicializar convierte los datos existentes sin mantener cadencias antiguas en el contrato activo',()=>{
 const {c,sheets}=setup();c.saveSubscription({periodicity:'fortnightly',filters:{entity:'BBVA'}});c.saveAdminSubscription({email:'other@bbva.com',periodicity:'quarterly',filters:{entity:'Santander'}});const sheet=sheets.get('Suscripciones');sheet.grid[1][4]='weekly';sheet.grid[2][4]='quarterly';const settings=sheets.get('Configuracion').grid.find(row=>row[0]==='settings'),value=JSON.parse(settings[1]);value.defaultPeriodicity='quarterly';settings[1]=JSON.stringify(value);c.initializeConfiguration();assert.deepEqual(Array.from(c.subscriptionRows_(),row=>row.periodicidad),['all','all']);assert.equal(c.settings_().defaultPeriodicity,undefined);const before=JSON.stringify(sheet.grid);c.initializeConfiguration();assert.equal(JSON.stringify(sheet.grid),before);
});
