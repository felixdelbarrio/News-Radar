import test from 'node:test';
import assert from 'node:assert/strict';
import {read,files} from '../scripts/source.mjs';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';

test('News Radar no contiene código, configuración, diccionarios ni controles del recopilador independiente',()=>{
 for(const file of [...files('src'), 'assets/configuration-defaults.json','assets/admin-schema.json'])assert.doesNotMatch(read(file),/project[\s-]?finance|projectFinance|financiaci[oó]n de proyectos/i,file);
 const s=storage();s.c.initializeConfiguration();assert.deepEqual(Array.from(s.c.configuration_().segments,r=>r.name),['Empresas e instituciones']);assert.deepEqual(Array.from(s.c.configuration_().applicationScope,r=>r.name),['Empresas e instituciones']);
 assert.throws(()=>s.c.collectNow('projectFinance'),/Hoy o Último año/);assert.equal(s.c.projectFinanceRadar_,undefined);
});
test('las búsquedas anuales conservan variantes digitales y generan menos consultas sin fuentes de infraestructura',()=>{
 const s=storage();s.c.initializeConfiguration();const c=s.c,config=c.configuration_(),range={from:'2026-10-01',to:'2026-10-12'},feeds=c.collectionFeeds_(range),enabled=c.feeds_();
 assert.equal(feeds.length,enabled.filter(feed=>feed.kind==='rss').length+enabled.filter(feed=>feed.kind==='profile').length*2);
 assert.ok(feeds.some(feed=>feed.capabilitySearch));for(const feed of feeds)assert.doesNotMatch(decodeURIComponent(feed.url).replace(/\+/g,' '),/project finance|project financing|financial close|non-recourse/i);
 c.enableDaily();assert.deepEqual(Array.from(c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='dailyRadar_'),t=>t.hour),[7]);assert.ok(!c.ScriptApp.getProjectTriggers().some(t=>/finance/i.test(t.handler)));
 assert.deepEqual(Object.keys(c.recoveryAvailability([],[])),['today','year']);
 for(const [entity,country,term] of [['BBVA','Italia','conto corrente'],['BBVA','Alemania','girokonto'],['Intesa Sanpaolo','Italia','banca digitale']])assert.ok(new URL(c.feeds_().find(row=>row.entity===entity&&row.country===country).url).searchParams.get('q').includes(term));
});
test('el editor, los combos y Ejecuciones muestran solo los ámbitos y las colas de News Radar',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');await a.change('#catalog-category','settings');assert.doesNotMatch(a.find('#catalog-fields').textContent,/Project Finance/);await a.click('[data-admin-view="runs"]');assert.equal(a.w.document.getElementById('collect-project-finance'),null);assert.doesNotMatch(a.find('#collection-jobs').textContent,/Project Finance/);
});
