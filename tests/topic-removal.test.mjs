import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {read} from '../scripts/source.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
test('retirar Tema migra la columna física sin desplazar datos, conserva preferencias y es idempotente',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),sheet=s.sheets.get('Noticias'),oldKeys=[...keys];oldKeys.splice(7,0,'tema');sheet.grid[0]=oldKeys;
 const row={id:'stored',fecha:'2026-10-10',pais:'España',medio:'Editor',entidad:'BBVA',titular:'BBVA lanza pagos digitales para empresas',extracto:'Cobros online',tema:'Pagos',url:'https://example.com/story',capturada:'2026-10-11T00:00:00Z',fuente:'Editor',idioma:'es',clasificacion:JSON.stringify({generalista:true,digital:true,capacidades:['Empresas: Pagos']}),taxonomia:JSON.stringify({fingerprint:'stable',ids:['keep']})};sheet.grid.push(oldKeys.map(key=>row[key]));
 const config=s.sheets.get('Configuracion');config.grid.push(['topics',JSON.stringify([{name:'Obsoleto',terms:['antiguo'],enabled:true}])]);const settings=config.grid.find(row=>row[0]==='settings');settings[1]=JSON.stringify({...JSON.parse(settings[1]),defaultTopic:'Obsoleto',unclassifiedTopic:'Sin clasificar'});
 c.saveSubscription({periodicity:'weekly',filters:{entity:'BBVA',coverage:'',segment:'Retail'}});const subscriptions=s.sheets.get('Suscripciones');subscriptions.grid[1][3]=JSON.stringify({entity:'BBVA',segment:'Retail',coverage:'',topic:'Obsoleto'});
 c.initializeConfiguration();const expected={...row};delete expected.tema;
 assert.deepEqual(clean(c.rows_('Noticias')[0]),expected);assert.deepEqual(clean(sheet.grid[0]),clean(keys));assert.equal(sheet.grid[1].length,keys.length);
 const current=c.getConfiguration().config;assert.equal(current.topics,undefined);assert.equal(current.settings.defaultTopic,undefined);assert.equal(current.settings.unclassifiedTopic,undefined);assert.deepEqual(JSON.parse(subscriptions.grid[1][3]),{coverage:'',entity:'BBVA',segment:'Retail'});
 const newsBefore=JSON.stringify(sheet.grid),configBefore=JSON.stringify(config.grid),preferencesBefore=JSON.stringify(subscriptions.grid);c.initializeConfiguration();assert.equal(JSON.stringify(sheet.grid),newsBefore);assert.equal(JSON.stringify(config.grid),configBefore);assert.equal(JSON.stringify(subscriptions.grid),preferencesBefore);
});
test('las capacidades y TF-IDF trabajan sin temas; la entrada generalista no impone restricciones temáticas',()=>{
 const {c}=storage();c.initializeConfiguration();const feed=c.feeds_().find(row=>row.domain==='bbva.com'),now=new Date('2026-10-12T12:00:00Z'),item={title:'BBVA publica un comunicado corporativo',excerpt:'Comunicado de su equipo',url:'https://www.bbva.com/comunicado',date:'2026-10-11'};
 const result=c.evaluate_(item,feed,now);assert.ok(result.item);assert.equal(result.item.labels.generalista,true);assert.equal(result.item.labels.digital,false);assert.equal(result.item.topic,undefined);
 assert.equal(c.classification_('bbva lanza pagos digitales para empresas','bbva lanza pagos digitales para empresas').labels.digital,true);assert.equal(c.taxonomyEligible_('bbva lanza pagos digitales','bbva lanza pagos digitales para empresas'),true);
 assert.equal(c.getNewsletterOptions().catalogs.topic,undefined);assert.equal(c.dashboardQuery_({view:'news',topic:'Obsoleto'}).topic,undefined);assert.doesNotMatch(c.newsCsv_([result.item],{}).csv.split('\r\n')[0],/tema|topic/i);
 assert.doesNotMatch(read('src/server/news/TaxonomyJobs.gs'),/topics|\.tema|defaultTopic/);
});
test('Tema desaparece de filtros y administración en la interfaz real',async t=>{
 const a=await app(t);assert.equal(a.w.document.querySelector('#filters [name="topic"]'),null);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');assert.equal(a.w.document.querySelector('#catalog-category option[value="topics"]'),null);await a.change('#catalog-category','settings');assert.equal(a.w.document.querySelector('[data-key="defaultTopic"]'),null);assert.equal(a.w.document.querySelector('[data-key="unclassifiedTopic"]'),null);
});
