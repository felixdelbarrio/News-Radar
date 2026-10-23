import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {readServerScript} from '../scripts/source.mjs';
function currentSourceStorage(){let code=readServerScript('dist');for(const file of ['news/TaxonomyJobs.gs','metrics/Maintenance.gs','collection/Collection.gs','storage/Generations.gs'])code=code.replace(readFileSync(new URL('../dist/'+file.split('/').at(-1),import.meta.url),'utf8'),readFileSync(new URL('../src/server/'+file,import.meta.url),'utf8'));return storage(code);}
import {storage} from './helpers/server.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
function add(s,id,title='BBVA lanza pagos digitales para empresas',url='https://editor.test/'+id){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c),row={id,fecha:'2026-10-10',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'Pagos digitales y tesorería para empresas',url,idioma:'es'};s.c.append_('Noticias',[keys.map(key=>row[key]||'')]);}
test('ordinary initialization preserves canonical sheet identities and pending jobs',()=>{
 const s=fixture(),c=s.c;add(s,'original');c.requestNewsClassification_();const sheet=c.newsSheet_(),job=JSON.stringify(c.classificationJob_());c.initializeConfiguration();assert.equal(c.newsSheet_().getSheetId(),sheet.getSheetId());assert.equal(c.newsSheet_().grid[1][0],'original');assert.equal(JSON.stringify(c.classificationJob_()),job);
});
test('obsolete sheet cleanup preserves checkpoints and canonical data without a migration reset',()=>{
 const s=fixture(),c=s.c;add(s,'original');c.generationSheet_('TaxonomiaTrabajo',['id']);const before=JSON.stringify(c.classificationJob_());assert.ok(c.pruneNewsGenerations_().includes('TaxonomiaTrabajo'));assert.equal(JSON.stringify(c.classificationJob_()),before);assert.equal(c.newsSheet_().grid[1][0],'original');assert.equal(c.pruneNewsGenerations_().length,0);
});
test('incremental pass skips current rows and writes only an edited record in place',()=>{
 const s=fixture(),c=s.c;add(s,'one');add(s,'two','BBVA incorpora autenticación biométrica para empresas');c.requestNewsClassification_(true);c.newsClassificationBatch_();for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();let calls=0;const classify=c.classification_;c.classification_=(...args)=>{calls++;return classify(...args);};c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(calls,0);for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();assert.equal(c.newsStorageKey_(),'Noticias');c.newsSheet_().grid[2][5]='BBVA mejora el acceso de banca online para empresas';c.configurationEdited_({range:{getSheet:()=>c.newsSheet_()}});c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(calls,1);assert.equal([...s.sheets.keys()].some(name=>/Noticias_(class|tax|maintenance)_/.test(name)),false);
});
test('physical deduplication preserves the frozen newsletter article after deleting its live duplicate',()=>{
 const s=fixture(),c=s.c;add(s,'one');add(s,'two');const rows=c.rows_('Noticias'),aliases=[];c.uniqueNews_(rows,aliases);assert.equal(aliases.length,1);const losing=rows[aliases[0].index],frozen=JSON.stringify(c.packNews_(losing));s.sheets.get('NewsletterContenido').grid.push(['edition',frozen]);const retained=rows[aliases[0].representativeIndex].id;assert.equal(c.cleanDuplicateNews().removed,1);assert.equal(c.rows_('Noticias').length,1);assert.equal(c.rows_('Noticias')[0].id,retained);assert.equal(c.rows_('NewsletterContenido')[0].noticia,frozen);assert.equal(c.unpackNews_(JSON.parse(c.rows_('NewsletterContenido')[0].noticia)).id,losing.id);assert.equal(c.cleanDuplicateNews().removed,0);
});
test('strict log caps and completed task purge operate independently of classification',()=>{
 const s=fixture(),c=s.c;const sheet=s.sheets.get('Auditoria');for(let i=0;i<5010;i++)sheet.grid.push([String(i),'2026-10-10']);const task=s.sheets.get('Recopilacion');task.grid.push(['done','source','url','Completada'],['error','source','url','Error']);const jobs=s.sheets.get('Recargas'),keys=vm.runInContext('RADAR.sheets.Recargas',c);for(const id of ['done','error'])jobs.grid.push(keys.map(key=>({id,estado:'Parcial'})[key]||''));add(s,'one');c.requestNewsClassification_(true);c.maintenance_(true);c.maintenanceBatch_();assert.equal(sheet.getLastRow()-1,5000);assert.equal(sheet.grid[1][0],'10');assert.equal(task.grid.length,2);assert.equal(task.grid[1][0],'error');
});

test('taxonomy memory scan reads 19k records in six contiguous lightweight ranges',async()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();
 for(const [name,count] of [['Noticias',9034],['Candidatos',10000]]){const keys=vm.runInContext('RADAR.sheets.'+name,c),row=keys.map(key=>({id:'row',fecha:'2026-10-10',titular:'Headline',extracto:'Excerpt',url:'https://example.test',entidad:'BBVA',procedencia:'{}'})[key]||'');for(let i=0;i<count;i++)Array.prototype.push.call(s.sheets.get(name).grid,row);}
 c.requestTaxonomy_();const reads=[];for(const name of ['Noticias','Candidatos']){const sheet=s.sheets.get(name),get=sheet.getRange;sheet.getRange=(...args)=>{reads.push([name,...args]);return get(...args);};}
 c.observeTaxonomyRow_=()=>{};c.publishTaxonomy_=()=> 'model';c.taxonomyBatch_();assert.equal(c.taxonomyJob_().phase,'tag');assert.equal(reads.length,6);assert.deepEqual(reads.map(row=>row[4]),[7,7,6,1,6,1]);assert.equal(s.sheets.has('TaxonomiaTrabajo'),false);
});
test('taxonomy respects a foreground pause before publishing its memory-only scan',async()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();add(s,'one');c.requestTaxonomy_();let checks=0,published=false;c.backgroundPaused_=()=>++checks>=3;c.publishTaxonomy_=()=>{published=true;};c.taxonomyBatch_();assert.equal(published,false);assert.equal(c.taxonomyJob_().phase,'publish');assert.ok(c.taxonomyJob_().checkpoint);assert.equal(c.taxonomyJob_().next,2);
});
test('maintenance caps logs once while waiting for classification instead of rereading every batch',async()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();let compacted=0;c.compactOperationalLogs_=()=>{compacted++;};c.classificationPending_=()=>true;c.maintenance_(true);c.maintenanceBatch_();c.maintenanceBatch_();assert.equal(compacted,1);assert.equal(c.maintenanceJob_().phase,'dedup');
});

test('collection appends without physically sorting news or restarting an active classification',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();add(s,'existing');const sheet=c.newsSheet_(),keys=vm.runInContext('RADAR.sheets.Noticias',c),feed=c.feeds_().find(row=>row.kind==='rss');
 const fresh=keys.map(key=>({id:'older',fecha:'2026-01-01',pais:'España',medio:'Editor',entidad:'BBVA',titular:'BBVA estrena banca online para empresas',url:'https://editor.test/older'})[key]||'');
 const job={id:'cycle',tipo:'daily',desde:'2026-01-01',hasta:'2026-10-15',inicio:new Date().toISOString(),estado:'Pendiente',total:1,pendientes:1};s.sheets.get('Recargas').grid.push(vm.runInContext('RADAR.sheets.Recargas',c).map(key=>job[key]||''));s.sheets.get('Recopilacion').grid.push(['cycle',feed.name,feed.url,'Pendiente',0,'',0,0,'','2026-10-15']);
 c.writeClassificationJob_({state:'En curso',next:2,total:1,revision:c.classificationRulesRevision_(),version:'3.14.0'});const before=JSON.stringify(c.classificationJob_());c.requestNewsClassification_=()=>{throw Error('Must not restart classification');};const range=sheet.getRange;sheet.getRange=(...args)=>{const value=range(...args);value.sort=()=>{throw Error('Must not physically sort');};return value;};
 c.fetchFeedBatch_=()=>[{response:{}}];c.ingestFeed_=()=>({news:[fresh],audit:[],candidates:[],evaluated:1,inside:1,relevant:1,digital:1});c.requestTranslations_=()=>{};const work=c.collectionWork_(Date.now()),result=c.collectionBatch_(work);assert.equal(result.added,1);assert.equal(JSON.stringify(c.classificationJob_()),before);assert.equal(sheet.grid[1][0],'existing');assert.equal(sheet.grid[2][0],'older');
});

test('maintenance applies the same translated headline deduplication plan as preview and preserves archive references',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();
 add(s,'english','BBVA launches international digital payments platform for businesses');add(s,'spanish','BBVA presenta su plataforma digital de pagos internacionales para empresas');
 const rows=c.rows_('Noticias'),english=rows.find(row=>row.id==='english'),spanish=rows.find(row=>row.id==='spanish'),keys=vm.runInContext('RADAR.sheets.Traducciones',c);
 c.append_('Traducciones',[keys.map(key=>({clave:c.articleTranslationKey_(english,'es'),idioma:'es',titular:spanish.titular,extracto:'Texto traducido',fecha:'2026-10-10'})[key]||'')]);s.properties['TRANSLATIONS_REVISION:es']='1';
 const aliases=[];c.uniqueNews_(rows,aliases);assert.equal(aliases.length,0,'Original titles must differ without translation identities');
 const preview=c.previewNewsDeduplication();assert.equal(preview.duplicates,1);const group=preview.groups[0],losing=group.duplicates[0].id,retained=group.representative.id;
 s.sheets.get('NewsletterContenido').grid.push(['historical-edition',JSON.stringify(c.packNews_(rows.find(row=>row.id===losing)))]);const contentBefore=s.sheets.get('NewsletterContenido').grid[1].slice();
 assert.equal(c.cleanDuplicateNews().removed,preview.duplicates);assert.equal(c.rows_('Noticias').length,preview.unique);assert.equal(c.rows_('Noticias')[0].id,retained);const content=s.sheets.get('NewsletterContenido').grid[1];assert.deepEqual(content,contentBefore);assert.equal(c.unpackNews_(JSON.parse(content[1])).id,losing);assert.equal(c.previewNewsDeduplication().duplicates,0);assert.equal(c.cleanDuplicateNews().removed,0);
});

test('log compaction removes terminal omitted tasks only in finished cycles without errors or pending work',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();const jobs=s.sheets.get('Recargas'),keys=vm.runInContext('RADAR.sheets.Recargas',c),tasks=s.sheets.get('Recopilacion');
 for(const [id,estado] of [['done','Completada'],['partial','Parcial'],['retry','Parcial'],['running','Pendiente'],['missing','Completada']])jobs.grid.push(keys.map(key=>({id,estado})[key]||''));
 for(const [id,states] of [['done',['Completada','Omitida','Cancelada']],['partial',['Omitida','Error']],['retry',['Omitida','Reintento programado']],['running',['Omitida','Pendiente']],['orphan',['Omitida']]])for(const state of states)tasks.grid.push([id,'source','https://example.test/'+id,state]);
 c.compactOperationalLogs_();assert.equal(tasks.grid.slice(1).some(row=>row[0]==='done'),false);assert.deepEqual(tasks.grid.slice(1).map(row=>[row[0],row[3]]),[['partial','Omitida'],['partial','Error'],['retry','Omitida'],['retry','Reintento programado'],['running','Omitida'],['running','Pendiente'],['orphan','Omitida']]);
 c.dashboardSnapshotsPending_=()=>false;const omitted=c.collectionSnapshots_([{ciclo:'terminal',estado:'Omitida',nuevas:0}],[{id:'terminal',estado:'Pendiente'}]);assert.equal(omitted[0].estado,'Completada');assert.equal(omitted[0].omitidas,1);assert.equal(omitted[0].fallidas,0);
});

test('bounded taxonomy scan resumes its exact durable cursor across calls without rereading processed rows',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();for(let i=0;i<12;i++)add(s,'scan-'+i,'BBVA estrena solución digital para empresas '+i);c.requestTaxonomy_();
 let clock=100000;const NativeDate=c.Date||Date;c.Date=class extends NativeDate{static now(){return clock;}};c.backgroundPaused_=()=>false;const seen=[];c.observeTaxonomyRow_=(state,row)=>{clock+=2;seen.push(row.titular);state.documents++;};c.publishTaxonomy_=()=> 'model';
 c.taxonomyBatch_(5);const first=c.taxonomyJob_();assert.equal(first.phase,'scan');assert.equal(first.scanCursor.row,5);assert.equal(first.documents,3);assert.ok(first.checkpoint.first>=386);assert.equal(c.readTaxonomyCheckpoint_(first).documents,3);
 c.taxonomyBatch_(5);const second=c.taxonomyJob_();assert.equal(second.scanCursor.row,8);assert.equal(second.documents,6);assert.equal(second.id,first.id);assert.notEqual(second.checkpoint.generation,first.checkpoint.generation);
 for(let i=0;i<8&&c.taxonomyJob_().phase!=='tag';i++)c.taxonomyBatch_(5);assert.equal(c.taxonomyJob_().phase,'tag');assert.equal(seen.length,12);assert.equal(new Set(seen).size,12);assert.equal(c.taxonomyJob_().checkpoint,undefined);assert.equal(s.sheets.get('DashboardSnapshots').grid.some(row=>row?.[0]==='taxonomy-checkpoint'),false);
});
test('an interrupted checkpoint write preserves the committed accumulator and next-row cursor',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();for(let i=0;i<10;i++)add(s,'retry-'+i);c.requestTaxonomy_();let clock=200000;const NativeDate=c.Date||Date;c.Date=class extends NativeDate{static now(){return clock;}};c.backgroundPaused_=()=>false;c.observeTaxonomyRow_=(state)=>{clock+=2;state.documents++;};c.publishTaxonomy_=()=> 'model';c.taxonomyBatch_(5);
 const committed=c.taxonomyJob_(),sheet=s.sheets.get('DashboardSnapshots'),get=sheet.getRange;let fail=true;sheet.getRange=(...args)=>{const range=get(...args),set=range.setValues;range.setValues=rows=>{if(fail&&rows[0]?.[0]==='taxonomy-checkpoint'){fail=false;set(rows.slice(0,1));throw Error('Interrupted checkpoint');}return set(rows);};return range;};
 c.taxonomyBatch_(5);assert.equal(c.taxonomyJob_().state,'En pausa');assert.equal(c.taxonomyJob_().scanCursor.row,committed.scanCursor.row);assert.equal(c.readTaxonomyCheckpoint_(c.taxonomyJob_()).documents,3);sheet.getRange=get;c.taxonomyBatch_(5);assert.equal(c.taxonomyJob_().documents,6);assert.equal(c.taxonomyJob_().scanCursor.row,8);
});
test('checkpoint writes and cleanup preserve both reserved dashboard snapshot slots',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();const sheet=s.sheets.get('DashboardSnapshots');sheet.getRange(2,1,1,4).setValues([['briefing','public-a','0','snapshot-a']]);sheet.getRange(385,1,1,4).setValues([['radar','public-b','0','snapshot-b']]);const job={...c.taxonomyJob_(),id:'checkpoint',state:'En curso',phase:'scan'};c.saveTaxonomyCheckpoint_(job,{documents:1,candidates:{},titles:{}});assert.equal(job.checkpoint.first,386);c.clearTaxonomyCheckpoints_();assert.deepEqual(sheet.grid[1],['briefing','public-a','0','snapshot-a']);assert.deepEqual(sheet.grid[384],['radar','public-b','0','snapshot-b']);
});

test('taxonomy checkpoint fragments verify their digest and an explicit restart clears orphaned accumulators',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();c.requestTaxonomy_();const job=c.taxonomyJob_(),state={documents:1200,candidates:{},titles:Object.fromEntries(Array.from({length:1200},(_,i)=>['title-'+String(i).padStart(60,'x'),[i]]))};c.saveTaxonomyCheckpoint_(job,state);assert.ok(job.checkpoint.parts>1);assert.equal(c.readTaxonomyCheckpoint_(job).documents,1200);const sheet=s.sheets.get('DashboardSnapshots');sheet.grid[job.checkpoint.first-1][3]+='corrupt';assert.throws(()=>c.readTaxonomyCheckpoint_(job),/corrupto/);c.requestTaxonomy_('restart');assert.equal(c.taxonomyJob_().checkpoint,undefined);assert.equal(sheet.grid.some(row=>row?.[0]==='taxonomy-checkpoint'),false);
});

test('checkpoint first fit reuses blank tail gaps across changing sizes without overwriting live or unrelated cells',()=>{
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();c.requestTaxonomy_();const job=c.taxonomyJob_(),sheet=s.sheets.get('DashboardSnapshots'),reserved=c.taxonomyCheckpointFirstRow_();sheet.getRange(reserved+4,1,1,4).setValues([['another-consumer','generation','0','keep-me']]);
 let maxParts=0;const positions=[];
 for(const size of [5,9,7,11,6,10,4]){
  const state={documents:size,candidates:{},titles:{padding:'x'.repeat((size-1)*40000+1000)}};c.saveTaxonomyCheckpoint_(job,state);maxParts=Math.max(maxParts,job.checkpoint.parts);positions.push(job.checkpoint.first);assert.equal(c.readTaxonomyCheckpoint_(job).documents,size);assert.deepEqual(sheet.grid[reserved+3],['another-consumer','generation','0','keep-me']);assert.ok(sheet.getLastRow()-reserved+1<=3*maxParts+5);
 }
 assert.ok(positions.some((position,i)=>i>0&&position<positions[i-1]));const keep=job.checkpoint;sheet.getRange(keep.first,1,keep.parts,4).clearContent();assert.ok(c.taxonomyCheckpointFreeRow_(sheet,keep.parts,keep)>=keep.first+keep.parts||c.taxonomyCheckpointFreeRow_(sheet,keep.parts,keep)+keep.parts<=keep.first);assert.equal(c.taxonomyCheckpointFreeRow_({getLastRow:()=>reserved-1},2,{first:reserved,parts:2}),reserved+2);
});
