import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {read} from '../scripts/source.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
test('las capacidades y TF-IDF trabajan sin temas; la entrada generalista no impone restricciones temáticas',()=>{
 const {c}=storage();c.initializeConfiguration();const feed=c.feeds_().find(row=>row.domain==='bbva.com'),now=new Date('2026-10-12T12:00:00Z'),item={title:'BBVA publica un comunicado corporativo',excerpt:'Comunicado de su equipo',url:'https://www.bbva.com/comunicado',date:'2026-10-11'};
 const result=c.evaluate_(item,feed,now);assert.equal(result.item,undefined);assert.match(result.reason,/canal digital/);
 assert.equal(c.classification_('bbva lanza pagos digitales para empresas','bbva lanza pagos digitales para empresas').labels.digital,true);assert.equal(c.taxonomyEligible_('bbva lanza pagos digitales','bbva lanza pagos digitales para empresas'),true);
 assert.equal(c.getNewsletterOptions().catalogs?.topic,undefined);assert.equal(c.dashboardQuery_({view:'news',topic:'Obsoleto'}).topic,undefined);assert.doesNotMatch(c.newsCsv_([],{}).csv.split('\r\n')[0],/tema|topic/i);
 assert.doesNotMatch(read('src/server/news/TaxonomyJobs.gs'),/topics|\.tema|defaultTopic/);
});
test('Tema desaparece de filtros y administración en la interfaz real',async t=>{
 const a=await app(t);assert.equal(a.w.document.querySelector('#filters [name="topic"]'),null);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');assert.equal(a.w.document.querySelector('#catalog-category option[value="topics"]'),null);await a.change('#catalog-category','settings');assert.equal(a.w.document.querySelector('[data-key="defaultTopic"]'),null);assert.equal(a.w.document.querySelector('[data-key="unclassifiedTopic"]'),null);
});
