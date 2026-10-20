import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
test('checkpoint shorter than its predecessor clears all old chunks',()=>{
 const {c,sheets}=fixture(),job={id:'test'};c.writeTaxonomyCheckpoint_(job,{next:2,documents:1,candidates:{a:{key:'a'}},titles:{a:[1]}});
 c.writeTaxonomyCheckpoint_(job,{next:2,documents:0,candidates:{},titles:{}});assert.equal(sheets.get('TaxonomiaTrabajo').getLastRow(),2);assert.equal(Object.keys(c.taxonomyCheckpoint_(job).candidates).length,0);
});
test('empty excerpt translates a single headline and repeated storage updates the same key',()=>{
 const {c}=fixture(),row={titular:'A headline',extracto:'  '};let input;c.LanguageApp={translate:value=>{input=value;return value;}};
 c.storeArticleTranslation_(row,'en');c.storeArticleTranslation_(row,'en');assert.equal(c.rows_('Traducciones').length,1);assert.equal(c.rows_('Traducciones')[0].extracto,'');assert.doesNotMatch(input,/excerpt/);
});
test('optional cache failure cannot abort translation or dashboard reads',()=>{
 const s=fixture(),c=s.c,cache=c.CacheService.getScriptCache();c.CacheService.getScriptCache=()=>({...cache,putAll(){throw Error('payload');},put(){throw Error('quota');}});
 assert.doesNotThrow(()=>c.writeDashboardCache_(c.CacheService.getScriptCache(),'key',{x:'data'}));assert.doesNotThrow(()=>c.cacheJson_('key',{x:1},21600));
});
test('staged sparse writes preserve intervening rows and verify one flushed generation',()=>{
 const s=fixture(),c=s.c,sheet=c.generationSheet_('Noticias_class_test',['a','b']);sheet.getRange(2,1,4,2).setValues([['1','old'],['2','keep'],['3','keep'],['4','old']]);let flushes=0;c.SpreadsheetApp.flush=()=>flushes++;
 c.writeStagedNewsRows_(sheet,[{row:2,values:['1','new']},{row:5,values:['4','new']}]);assert.equal(flushes,1);assert.deepEqual(sheet.getRange(2,1,4,2).getValues(),[['1','new'],['2','keep'],['3','keep'],['4','new']]);
});
test('restart removes abandoned targets while canonical, active and other jobs survive pruning',()=>{
 const s=fixture(),c=s.c;for(const name of ['Noticias_backup_old','Preferencias','Noticias_class_old','Noticias_tax_live','Unrelated'])c.generationSheet_(name,['id']);
 s.properties.CLASSIFICATION_JOB=JSON.stringify({state:'Pendiente',target:'Noticias_class_old'});s.properties.TAXONOMY_JOB=JSON.stringify({state:'Pendiente',target:'Noticias_tax_live'});c.requestNewsClassification_(true);c.pruneNewsGenerations_();
 for(const name of ['Noticias_backup_old','Preferencias','Noticias_class_old'])assert.equal(s.sheets.has(name),false,name);for(const name of ['Noticias','Noticias_tax_live','Unrelated'])assert.equal(s.sheets.has(name),true,name);
});
test('dashboard cache keys canonicalize empty defaults and object order',()=>{
 const {c}=fixture();assert.equal(c.dashboardCacheKey_({from:'2026-10-01',to:'2026-10-31',page:0,entity:''},'news','es'),c.dashboardCacheKey_({to:'2026-10-31',from:'2026-10-01'},'news','es'));
});
test('snapshot construction hydrates every supported language before a cold visit',()=>{
 const s=fixture(),c=s.c;for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();const sheet=s.sheets.get('DashboardSnapshots');sheet.getRange=()=>{throw Error('cold read');};for(const view of ['news','briefing','radar'])for(const language of ['es','en','tr']){const query=c.dashboardQuery_({view,initial:true});assert.ok(c.defaultDashboardSnapshot_(view,query,language));}
});
test('daily translation budget persists a pause until the next local reset',()=>{
 const s=fixture(),c=s.c,now=new Date().toISOString(),today=c.recordDay(new Date(),c.settings_().timezone);
 s.properties.TRANSLATION_JOB=JSON.stringify({state:'Pendiente',started:now,updated:now,total:1,processed:0,translated:0,errors:0,calls:3000,callDay:today,cursor:null,pausedUntil:0});c.translationCandidates_=()=>[{id:'pending',priority:0}];c.translationBatch_();const job=c.translationJob_();assert.equal(job.state,'En pausa');assert.ok(job.pausedUntil>Date.now());assert.equal(job.pausedUntil,c.nextDailyReset(Date.now(),c.settings_().timezone));
});
test('translation compaction keeps the latest active key and removes orphaned content',()=>{
 const s=fixture(),c=s.c,row={titular:'Active headline',extracto:'Active summary'},keys=vm.runInContext('RADAR.sheets.Noticias',c);c.append_('Noticias',[keys.map(key=>key==='id'?'active':row[key]||'')]);const key=c.articleTranslationKey_(row,'en');
 c.append_('Traducciones',[[key,'en','Old','Summary','1'],[key,'en','Latest','Summary','2'],['en:orphan','en','Removed','Summary','3']]);c.compactArticleTranslations_();assert.equal(c.rows_('Traducciones').length,1);assert.equal(c.rows_('Traducciones')[0].titular,'Latest');assert.equal(c.articleTranslationIndex_().get(key),2);
});
test('an interrupted sheet creation repairs its missing header on retry',()=>{
 const {c,sheets}=fixture();sheets.get('Noticias').grid.length=0;const sheet=c.generationSheet_('Noticias',['id','fecha']);assert.deepEqual(sheet.getRange(1,1,1,2).getValues(),[['id','fecha']]);
});
test('telemetry cannot turn a recoverable job failure into an uncaught exception',()=>{
 const {c}=fixture();c.append_=()=>{throw Error('Sheets timeout');};assert.doesNotThrow(()=>c.telemetry_('test',1,'Error','original error'));
});
test('storage compaction preserves schema width, occupied cells and unrelated sheets',()=>{
 const {c}=fixture(),changes=[];const fake=(name,lastRow,lastColumn)=>({getName:()=>name,getLastRow:()=>lastRow,getLastColumn:()=>lastColumn,getMaxRows:()=>1000,getMaxColumns:()=>26,deleteRows:(first,count)=>changes.push([name,'rows',first,count]),deleteColumns:(first,count)=>changes.push([name,'columns',first,count])});c.book_=()=>({getSheets:()=>[fake('Noticias_class_empty',0,0),fake('Taxonomia',300,16),fake('Personal notes',1,1)]});c.compactStorageDimensions_();assert.ok(changes.some(row=>row[0]==='Noticias_class_empty'&&row[1]==='columns'&&row[2]===14));assert.ok(changes.some(row=>row[0]==='Taxonomia'&&row[1]==='columns'&&row[2]===17));assert.ok(changes.every(row=>row[0]!=='Personal notes'));
});
test('classification preserves date priority while writing each staged batch contiguously',()=>{
 const s=fixture(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),title='BBVA lanza pagos digitales para empresas';for(const [id,fecha] of [['old','2026-01-01'],['new','2026-10-15'],['middle','2026-06-01']]){const row={id,fecha,titular:title,extracto:'',url:'https://example.com/'+id,entidad:'BBVA',fuente:'Editor',idioma:'es'};c.append_('Noticias',[keys.map(key=>row[key]||'')]);}c.requestNewsClassification_(true);assert.equal(c.classificationJob_().layout,'sequential');c.newsClassificationBatch_();const sheet=s.sheets.get(c.classificationJob_().target);assert.deepEqual(sheet.getRange(2,1,3,1).getDisplayValues().flat(),['new','middle','old']);for(let i=0;i<14&&c.classificationPending_();i++)c.dashboardSnapshotBatch_();assert.deepEqual(Array.from(c.rows_('Noticias'),row=>row.id).sort(),['middle','new','old']);assert.equal(c.classificationJob_().state,'Completada');
});
