import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {app,tick} from './helpers/app.mjs';
import {formatCalendarMonth} from '../src/shared/locales.js';
const incident='Indisponibilidad / Incidencia operativa';
const article={id:'incident',fecha:'2026-10-23',entidad:'Bank of America',pais:'Estados Unidos',medio:'Editor',titular:'Business banking outage',extracto:'Login unavailable',url:'https://example.com/incident',senales:[incident],taxonomia:[]};
test('Radar comparte las traducciones guardadas de las evidencias sin conservar cuerpos auxiliares',()=>{
 const {c}=storage();c.initializeConfiguration();c.append_('Traducciones',[[c.articleTranslationKey_(article,'es'),'es','Incidencia en banca de empresas','Acceso no disponible','2026-10-25']]);
 const data={items:[],radar:{outages:c.radarOutages_([article],[],{from:'2026-01-01',to:'2026-12-31'})}};c.dashboardArticleFields_(data);
 const evidence=data.radar.outages.latest[0];assert.equal(evidence.titles.es,'Incidencia en banca de empresas');assert.equal(evidence.titles.en,undefined);assert.equal(evidence.text,undefined);assert.equal(evidence.title,article.titular);
});
test('las barras mensuales no mezclan años y los rótulos usan nombres localizados',()=>{
 const {c}=storage();c.initializeConfiguration();const result=c.radarOutages_([{...article,fecha:'2025-11-03'},article],[],{from:'2025-11-01',to:'2026-12-31'});
 assert.equal(result.months.length,12);assert.ok(result.months.every(row=>row.month.startsWith('2026-')));assert.equal(result.months[9].total,1);assert.match(formatCalendarMonth('2026-01','es'),/ene/i);assert.match(formatCalendarMonth('2026-01','en'),/Jan/);
});
test('Radar muestra traducción disponible y las barras con nombres de meses',async t=>{
 const {c}=storage();c.initializeConfiguration();const outage=c.radarOutages_([article],[],{from:'2026-01-01',to:'2026-12-31'});outage.latest[0].titles={es:'Incidencia traducida'};
 const a=await app(t,{entry:'radar',location:{view:'radar'},configure({data}){data.radar.outages=JSON.parse(JSON.stringify(outage));}});await tick();await a.click('[data-view="radar"]');await tick();assert.equal(a.find('#message').hidden,true,a.find('#message').textContent);
 assert.match(a.find('#radar-outage-evidence').textContent,/Incidencia traducida/);assert.doesNotMatch(a.find('#radar-outage-evidence').textContent,/Business banking outage/);assert.match(a.find('#radar-outage-timeline time').textContent,/ene/i);assert.equal(a.w.document.querySelectorAll('.outage-bar').length,12);
});
test('Geografías concentra catálogo, estado y pestañas propias sin perder países personalizados',async t=>{
 const a=await app(t);a.config.geographies.push({name:'Arabia Saudí',searchName:'Saudi Arabia',terms:['Saudi'],code:'SA',language:'en',mapId:'682',enabled:true});a.config.applicationScope[0].countries.push('Arabia Saudí');
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');await a.change('#catalog-category','applicationScope');
 assert.equal(a.w.document.querySelector('#catalog-category option[value="geographies"]'),null);assert.equal(a.find('#catalog-category option[value="applicationScope"]').textContent,'Geografías');
 const row=a.find('[data-country="Arabia Saudí"]').closest('[data-geography]');row.querySelector('[data-key="searchName"]').value='Kingdom of Saudi Arabia';await a.submit('#catalog-form');
 const saved=a.calls.findLast(call=>call.method==='saveConfiguration').query.config;assert.ok(saved.applicationScope[0].countries.includes('Arabia Saudí'));assert.equal(saved.geographies.find(country=>country.code==='SA').searchName,'Kingdom of Saudi Arabia');
 await a.click('#catalog-add');assert.equal(a.find('[data-country=""]').closest('[data-geography]').querySelector('[data-key="name"]').value,'');
});
import {noveltyOverview} from '../src/shared/novelty-groups.js';
import {applicationGeography} from '../src/shared/selection-policy.js';
test('las caídas bursátiles no son incidencias de canal y las interrupciones reales siguen admitidas',()=>{
 const {c}=storage();c.initializeConfiguration();
 for(const title of ['La banca de Wall Street revive la crisis de 2008: la caída de Bankinter anticipa la sangría bursátil en España','Bankinter sufre una caída bursátil y pérdidas en bolsa','Bank of America goes down in stock market crash as shares tumble']){const text=c.searchText_(title),labels=c.classification_(text,text).labels;assert.equal(labels.digital,false,title);assert.equal(labels.senales.includes(incident),false,title);}
 for(const title of ['Bankinter sufre una caída de la app: los clientes no pueden acceder a sus cuentas','Bankinter reports online banking outage and failed payments for businesses']){const text=c.searchText_(title),labels=c.classification_(text,text).labels;assert.equal(labels.digital,true,title);assert.ok(labels.senales.includes(incident),title);}
});
test('Otras geografías permite el agregado residual, evita regiones vacías y vuelve a un país explícito',async t=>{
 const items=['España','India','Arabia Saudí'].map((pais,i)=>({...article,id:String(i),pais,titular:'BBVA lanza producto '+pais,senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true}}));
 const a=await app(t,{configure({data}){data.selection={country:''};data.countries=items.map(row=>row.pais);data.briefing={...noveltyOverview(items,[],applicationGeography(data.applicationScope,undefined,data.geographies)),items};}});
 await a.click('#briefing-geographies [data-geography="Otras geografías"]');assert.equal(a.w.document.querySelector('[data-all-regions]'),null);
 await a.click('#briefing-geographies [data-geography="APAC"]');a.data.selection.country='España';await a.change('#filters [name="country"]','España');assert.equal(a.find('#briefing-geographies [data-geography="España"]').getAttribute('aria-selected'),'true');assert.match(a.find('#briefing-list').textContent,/producto España/);
});
test('actualizar las reglas del catálogo preserva los países propios editados',()=>{
 const {c}=storage();c.initializeConfiguration();const saved=c.getConfiguration();saved.config.applicationScope[0].countries=['España'];c.saveConfiguration(saved);c.properties_().setProperty('CATALOG_VERSION','anterior');c.initializeConfiguration();assert.deepEqual(Array.from(c.configuration_().applicationScope[0].countries),['España']);assert.ok(c.configuration_().signals.find(row=>row.group==='Problema').exclude.includes('sangría bursátil'));
});
