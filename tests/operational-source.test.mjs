import test from 'node:test';import assert from 'node:assert/strict';import {storage} from './helpers/server.mjs';
function runtime(){const s=storage();s.c.initializeConfiguration();s.c.publishTaxonomy_({documents:0,candidates:{}});return s.c;}
const now=new Date('2026-11-22T12:00:00Z');
function article(c,title,extra={}){const feed=c.configuredFeeds_().find(row=>row.incidentOnly);return c.evaluate_({title,excerpt:'',date:'2026-11-21T12:00:00Z',url:'https://news.google.com/rss/articles/operational-test',...extra},feed,now);}
test('public Downdetector references are a controllable RSS source, not direct status/API access',()=>{
 const c=runtime(),feed=c.configuredFeeds_().find(row=>row.incidentOnly);assert(feed.enabled);assert.match(feed.name,/referencias a Downdetector/);assert.equal(new URL(feed.url).hostname,'news.google.com');assert.equal(feed.entity,'Sector');assert.match(new URL(feed.url).searchParams.get('q'),/downdetector/);
 const range={from:'2026-11-01',to:'2026-11-10'},period=c.collectionProfile_(feed,range),index=c.collectionFeedIndex_(),resumed=c.collectionTaskFeed_({fuente:feed.name,url:period.url},index);assert.equal(resumed.incidentOnly,true);assert.equal(resumed.range.from,range.from);
 c.saveSourceSettings(c.configuredFeeds_().filter(row=>row.enabled&&!row.incidentOnly).map(row=>row.id));assert.equal(c.configuredFeeds_().find(row=>row.incidentOnly).enabled,false);
});
test('reported corporate service outages retain the incident signal and original article date',()=>{
 const c=runtime(),result=article(c,'BBVA Net Cash: caída de la banca online para empresas según Downdetector');assert(result.item,result.reason);assert.equal(result.item.labels.evento,'Indisponibilidad / Incidencia operativa');assert.deepEqual(Array.from(result.item.labels.senales),['Indisponibilidad / Incidencia operativa']);assert.notEqual(result.item.labels.evidencia.senales[0].texto,'downdetector');assert.equal(result.item.date.toISOString(),'2026-11-21T12:00:00.000Z');const feed=c.configuredFeeds_().find(row=>row.incidentOnly),values=c.newsRecord_(result.item,feed,now),row=Object.fromEntries(['id','fecha','pais','medio','entidad','titular','extracto','url','capturada','fuente','idioma','clasificacion','taxonomia'].map((key,i)=>[key,values[i]]));const annotated=c.annotateNews_([row])[0];assert.equal(c.briefingAllowed(annotated),false);assert.deepEqual(Array.from(annotated.senales),['Indisponibilidad / Incidencia operativa']);
});
test('the operational source does not convert minorista, novelty, normal status or untracked entities into incidents',()=>{
 const c=runtime();for(const title of ['BBVA: caída de la app según Downdetector','BBVA: caída de la app para particulares según Downdetector','BBVA Net Cash lanza nueva plataforma de banca online para empresas y menciona Downdetector','BBVA Net Cash de banca online para empresas: no hay interrupción del servicio según Downdetector','Proveedor desconocido: caída de la app empresarial según Downdetector']){assert.equal(article(c,title).item,undefined,title);}
});
test('the same operational report keeps normal duplicate and date validation',()=>{
 const c=runtime();assert.equal(article(c,'BBVA Net Cash: caída de la banca online para empresas según Downdetector',{date:'invalid'}).item,undefined);assert.equal(article(c,'BBVA Net Cash: caída de la banca online para empresas según Downdetector',{date:'2026-11-25T12:00:00Z'}).item,undefined);
});

test('the operational source admits explicit SME and self-employed service impact',()=>{
 const c=runtime();for(const title of ['BBVA Net Cash: caída de la banca online para pymes según Downdetector','Qonto: caída de la app para autónomos según Downdetector']){const result=article(c,title);assert(result.item,result.reason);assert.equal(result.item.labels.evento,'Indisponibilidad / Incidencia operativa');}
});
