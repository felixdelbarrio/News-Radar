import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {storage} from './helpers/server.mjs';
import {readServerScript} from '../scripts/source.mjs';
function fixture(){let source=readServerScript('dist');for(const file of ['news/DashboardSnapshots.gs','news/News.gs','news/TranslationJobs.gs','news/Feeds.gs','collection/Collection.gs'])source=source.replace(fs.readFileSync('dist/'+file.split('/').at(-1),'utf8'),()=>fs.readFileSync('src/server/'+file,'utf8'));const s=storage(source);s.c.initializeConfiguration();return s;}
const clean=value=>JSON.parse(JSON.stringify(value));
function rows(c){return ['España','México','Colombia','Argentina','Perú','Uruguay','Alemania','Turquía','Chile'].flatMap((pais,country)=>Array.from({length:35},(_,i)=>({id:country+'-'+i,fecha:'2026-10-10',pais,entidad:i%2?'BBVA':'Santander',medio:'Editor '+i,titular:'Nueva solución de pagos internacionales '+Array.from({length:5},(_,n)=>createHash('sha256').update(country+':'+i+':'+n).digest('hex').slice(0,12)).join(' '),extracto:('Texto empresarial de tesorería de '+pais+' '+i+' ').repeat(15),url:'https://editor.test/'+country+'/'+i,fuente:'Editor',idioma:'es',tipo:'Banco',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],etiquetas:{digital:true},taxonomia:[],clasificacion:JSON.stringify({digital:true,capacidades:['Empresas: Pagos'],procedencia:{url:'https://editor.test/'+country+'/'+i}})})));}
test('compact news snapshot preserves every geographic first page and locale with one shared metadata and article table',()=>{
 const {c}=fixture(),input=rows(c),query={from:'2026-10-01',to:'2026-10-15',segment:'Empresas e instituciones',coverage:'digital'},data=c.dashboardSnapshotData_(input,query,[],'news');
 // Simulate durable translations, including all original bodies, without external calls.
 c.savedArticleTranslations_=(items,language)=>items.map(row=>({...row,titular:language+': '+row.titular,extracto:language+': '+row.extracto,original:{titular:row.titular,extracto:row.extracto},translation:{language,state:'translated'}}));
 const baseline={};for(const geography of ['',...data.newsGeographies.map(row=>row.name)])baseline[geography]=c.dashboardSnapshotLanguages_(c.dashboardSnapshotData_(input,{...query,...(geography?{newsGeography:geography}:{})},[],'news'),'news');
 const started=performance.now(),bundle=c.compactNewsSnapshot_(input,query,data),elapsed=performance.now()-started;
 for(const geography of ['',...data.newsGeographies.map(row=>row.name)])for(const language of ['es','en','tr'])assert.deepEqual(clean(c.compactNewsSnapshotData_(bundle,geography,language)),clean(baseline[geography][language]));
 const before=gzipSync(JSON.stringify({variants:baseline})).length,after=gzipSync(JSON.stringify({news:bundle})).length;assert.ok(after<before*.6,JSON.stringify({before,after,reduction:1-after/before}));assert.ok(elapsed<6000);console.log('compact snapshot benchmark',JSON.stringify({before,after,reduction:1-after/before,ms:elapsed,geographies:data.newsGeographies.length}));
});
test('knownUrls never reads excerpts or translations and reuses its execution index',()=>{
 const s=fixture(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),row={id:'one',fecha:'2026-10-10',pais:'España',entidad:'BBVA',medio:'Editor',titular:'BBVA lanza nuevo portal digital de tesorería',extracto:'PRIVATE BODY',url:'https://editor.test/one'};c.append_('Noticias',[keys.map(key=>row[key]||'')]);
 const sheet=c.newsSheet_(),get=sheet.getRange,reads=[];sheet.getRange=(...args)=>{assert.ok(!(args[1]<=7&&args[1]+args[3]>7),'Must not read extracto column');reads.push(args);return get(...args);};c.articleIdentityTitles_=()=>{throw Error('No translations');};const first=c.knownUrls_();assert.equal(first.has(row.url),true);assert.deepEqual(reads,[[2,2,1,5],[2,8,1,1]]);assert.equal(c.knownUrls_(),first);assert.equal(reads.length,2);
});
test('completed translation revision returns without reading articles or emitting empty telemetry and invalidates on content changes',()=>{
 const s=fixture(),c=s.c;let telemetry=0,scans=0;c.telemetry_=()=>telemetry++;c.translationCandidates_=()=>{scans++;return [];};c.translationBatch_();assert.equal(scans,1);assert.equal(telemetry,0);c.translationJob_=()=>({state:'Completada'});c.requestTranslations_();c.translationCandidates_=()=>{throw Error('Must not scan again');};c.articleTranslationIndex_=()=>{throw Error('Must not read translations');};c.newsRowsForCandidates_=()=>{throw Error('Must not read articles');};const started=performance.now();c.translationBatch_();assert.ok(performance.now()-started<150);assert.equal(telemetry,0);assert.equal(s.properties.TRANSLATION_REQUEST,undefined);s.properties.NEWS_CONTENT_REVISION='edited';c.requestTranslations_();c.translationCandidates_=()=>{scans++;return [];};c.translationBatch_();assert.equal(scans,2);
});
test('dashboard metadata warm cache requires one cache get and no catalogue RPC after a new execution',()=>{
 const s=fixture(),c=s.c,expected=c.dashboardMetadata_();vm.runInContext('dashboardMetadataMemory_=undefined',c);c.taxonomyTranslations_=()=>{throw Error('Must use compressed metadata');};let gets=0;const cache=c.CacheService.getScriptCache(),get=cache.get;c.CacheService.getScriptCache=()=>({...cache,get:key=>{gets++;return get(key);}});const started=performance.now();assert.deepEqual(clean(c.dashboardMetadata_()),clean(expected));assert.equal(gets,1);assert.ok(performance.now()-started<150);s.properties.TAXONOMY_REVISION='new';assert.throws(()=>c.dashboardMetadata_(),/compressed metadata/);
});
test('Radar keeps explicit entity and functional filters across initial annual queries and strips unsupported scope fields',()=>{
 const s=fixture(),c=s.c;vm.runInContext(fs.readFileSync('src/server/config/Calendar.gs','utf8'),c);
 const query=c.dashboardQuery_({view:'radar',initial:true,year:'2025',country:'Colombia',entity:'BBVA',palanca:'Pagos',subpalanca:'Transferencias',signal:'Lanzamiento de producto',search:'irrelevant'},new Date('2026-10-23T00:00:00Z'));
 assert.deepEqual(clean(query),{segment:'Empresas e instituciones',coverage:'digital',entity:'BBVA',palanca:'Pagos',subpalanca:'Transferencias',country:'Colombia',from:'2025-01-01',to:'2025-12-31'});
 const reset=c.dashboardQuery_({view:'radar',initial:true},new Date('2026-10-23T00:00:00Z'));assert.equal(reset.country,'');assert.equal(reset.entity,undefined);assert.equal(reset.palanca,undefined);
});
test('completion cache never certifies new content requested during the active translation batch',()=>{
 const s=fixture(),c=s.c;c.telemetry_=()=>{};let scans=0;c.translationCandidates_=()=>{scans++;s.properties.TRANSLATION_REQUEST=new Date(Date.now()+1000).toISOString();s.properties.NEWS_CONTENT_REVISION='arrived-during-scan';return [];};c.requestTranslations_();c.translationBatch_();assert.ok(s.properties.TRANSLATION_REQUEST);assert.equal(s.properties.TRANSLATION_COMPLETED_REVISION,undefined);c.translationJob_=()=>({state:'Completada'});c.translationCandidates_=()=>{scans++;return [];};c.translationBatch_();assert.equal(scans,2);
});
test('a hundred already translated rows checkpoint once per batch and never poll the daily queue per language',()=>{
 const s=fixture(),c=s.c,rows=Array.from({length:100},(_,i)=>({id:'done-'+i,fecha:'2026-10-10',captured:'2026-10-10T00:00:00Z',priority:0,titular:'Producto '+i,extracto:'Operativa '+i,fuente:'Editor'}));
 c.translationCandidates_=()=>rows;c.newsRowsForCandidates_=selected=>new Map(selected.map(row=>[row.id,row]));c.articleTranslationIndex_=()=>new Map(rows.flatMap(row=>['es','en','tr'].map(language=>[c.articleTranslationKey_(row,language),1])));c.backgroundPaused_=()=>false;c.storeArticleTranslation_=()=>{throw Error('Already complete');};
 let saves=0,queueChecks=0;const save=c.writeTranslationJob_;c.writeTranslationJob_=job=>{saves++;return save(job);};c.collectionRequests_=()=>{queueChecks++;return [];};c.translationBatch_();assert.equal(c.translationJob_().state,'Publicando');assert.equal(c.translationJob_().processed,100);assert.ok(saves<=4,String(saves));assert.ok(queueChecks<=6,String(queueChecks));
});
