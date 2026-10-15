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
test('el enlace anual conserva su ámbito al refinar filtros, lo muestra al lector y permite retirarlo',async t=>{
 const {c}=setup(),content=c.newsletter_(corpus(),query,'Cierre',new Date(),'sub','es','edition');c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Cierre',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 const params=Object.fromEntries(new URL(content.editorial.cards.find(row=>row.scope==='group').related).searchParams),requests=[],a=await app(t,{location:params,configure({w,data}){const original=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,payload)=>{if(method==='getDashboard'){requests.push(payload);return {...data,...JSON.parse(JSON.stringify(c.getDashboard(payload)))};}return original(method,payload);};}});
 assert.match(a.find('#active-filters').textContent,/Ámbito comparativo: El grupo en otras geografías/);await a.change('#filters [name="entity"]','BBVA');assert.equal(requests.at(-1).benchmark,'group');await a.click('#active-filters [data-remove-filter="benchmark"]');assert.equal(requests.at(-1).benchmark,undefined);assert.doesNotMatch(a.find('#active-filters').textContent,/Ámbito comparativo/);
});
test('la anual compara tres corpus disjuntos, normaliza las diferencias y abre sus evidencias exactas',()=>{
 const {c}=setup(),items=corpus(),content=c.newsletter_(items,query,'Cierre',new Date(),'sub','es','edition'),comparison=content.editorial.comparison,d=new JSDOM(content.html).window.document;
 assert.equal(content.total,16);assert.equal(comparison.panels.local.total,6);assert.equal(comparison.panels.group.total,4);assert.equal(comparison.panels.market.total,5);assert.equal(comparison.unassigned,1);assert.equal(comparison.geographies[0].name,'México');assert.equal(comparison.geographies[0].total,3);
 const integration=comparison.contrasts.find(row=>row.name==='Integración y automatización');assert.equal(integration.local.count,4);assert.equal(integration.group.count,1);assert.equal(integration.market.count,1);assert.ok(Math.abs(integration.gap-(400/6-20))<.001);
 assert.deepEqual(Array.from(content.editorial.cards,row=>row.scope),['local','group','market']);assert.equal(d.querySelectorAll('.newsletter-comparison').length,1);assert.equal(d.querySelectorAll('.newsletter-report').length,4);assert.match(content.text,/47 puntos porcentuales/);assert.match(content.text,/Tres decisiones/);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Cierre',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 for(const anchor of d.querySelectorAll('.newsletter-contrast a')){const params=Object.fromEntries(new URL(anchor.href).searchParams),row=comparison.contrasts.find(row=>row.name===params.palanca),target=c.getDashboard({...params,initial:true});assert.equal(target.selection.entity,'');assert.equal(target.newsGeographies.reduce((sum,row)=>sum+row.total,0),row[params.benchmark].count);assert.equal(c.exportNews(params).count,row[params.benchmark].count);}
 for(const card of content.editorial.cards){const target=c.exportNews(Object.fromEntries(new URL(card.related).searchParams));assert.equal(target.count,card.relatedCount);}
});
test('la anual muestra ausencia de evidencia sin fabricar ceros comparativos y respeta el idioma y los filtros restantes',()=>{
 const {c}=setup(),items=[story('one','México','BBVA')];
 for(const language of ['es','en','tr']){const content=c.newsletter_(items,query,'Cierre',new Date(),'sub',language,'edition'),d=new JSDOM(content.html).window.document;assert.equal(content.editorial.comparison.panels.local.total,0);assert.equal(content.editorial.comparison.contrasts[0].gap,null);assert.match(d.querySelector('.newsletter-contrast').textContent,/—/);assert.doesNotMatch(content.html,/\{theme\}|\{gap\}|undefined|NaN/);if(language!=='es')assert.doesNotMatch(d.body.textContent,/El espejo del año|Tres decisiones para abrir/);}
 assert.equal(c.newsletter_(items,{...query,source:'Otro medio'},'Cierre',new Date(),'sub').count,0);
});
test('la mensual conserva el informe ejecutivo y muestra los tres meses del cierre',()=>{
 const {c}=setup(),items=['07','08','09'].map((month,i)=>story('quarter'+i,'España','BBVA','Pagos y cobros','2026-'+month+'-10')),content=c.newsletter_(items,{...query,entity:'',view:'news',from:'2026-07-01',to:'2026-09-30'},'Trimestre',new Date(),'sub');
 const d=new JSDOM(content.html).window.document;assert.equal(content.editorial.cadence,'monthly');assert.equal(content.editorial.comparison,null);assert.equal(d.querySelectorAll('.newsletter-quarters td').length,6);assert.deepEqual([...d.querySelector('.newsletter-quarters').querySelectorAll('strong')].map(row=>row.textContent),['1','1','1']);assert.match(content.text,/EL TRIMESTRE|trimestre/);assert.doesNotMatch(content.text,/El pulso del año|El espejo del año/);
});
test('las ventanas cubren quincenas naturales, años bisiestos, trimestres y cierres en la zona configurada',()=>{
 const {c}=setup();for(const [cadence,day,from,to] of [['fortnightly','2028-03-01','2028-02-16','2028-02-29'],['fortnightly','2026-10-16','2026-10-01','2026-10-15'],['fortnightly','2027-01-01','2026-12-16','2026-12-31'],['monthly','2027-01-01','2026-12-01','2026-12-31'],['monthly','2026-07-01','2026-06-01','2026-06-30']]){const period=c.newsletterWindow(cadence,day,true);assert.deepEqual([period.from,period.to],[from,to]);}
 const midnight=c.newsletterPeriod_('fortnightly',new Date('2026-10-15T22:30:00Z'));assert.equal(midnight.to,'2026-10-15');
 assert.equal(c.subscriptionRecord_({},'owner@bbva.com','id',new Date()).periodicidad,'all');
});
test('inicializar convierte los datos existentes sin mantener cadencias antiguas en el contrato activo',()=>{
 const {c,sheets}=setup();c.saveSubscription({periodicity:'fortnightly',filters:{entity:'BBVA'}});c.saveAdminSubscription({email:'other@bbva.com',periodicity:'monthly',filters:{entity:'Santander'}});const sheet=sheets.get('Suscripciones');sheet.grid[1][4]='weekly';sheet.grid[2][4]='monthly';const settings=sheets.get('Configuracion').grid.find(row=>row[0]==='settings'),value=JSON.parse(settings[1]);value.defaultPeriodicity='monthly';settings[1]=JSON.stringify(value);c.initializeConfiguration();assert.deepEqual(Array.from(c.subscriptionRows_(),row=>row.periodicidad),['all','all']);assert.equal(c.settings_().defaultPeriodicity,undefined);const before=JSON.stringify(sheet.grid);c.initializeConfiguration();assert.equal(JSON.stringify(sheet.grid),before);
});
