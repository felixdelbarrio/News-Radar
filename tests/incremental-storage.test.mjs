import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {readServerScript} from '../scripts/source.mjs';
function currentSourceStorage(){let code=readServerScript('dist');for(const file of ['news/TaxonomyJobs.gs','metrics/Maintenance.gs','collection/Collection.gs'])code=code.replace(readFileSync(new URL('../dist/'+file.split('/').at(-1),import.meta.url),'utf8'),readFileSync(new URL('../src/server/'+file,import.meta.url),'utf8'));return storage(code);}
import {storage} from './helpers/server.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
function add(s,id,title='BBVA lanza pagos digitales para empresas',url='https://editor.test/'+id){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c),row={id,fecha:'2026-10-10',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'Pagos digitales y tesorería para empresas',url,idioma:'es'};s.c.append_('Noticias',[keys.map(key=>row[key]||'')]);}
test('migration previews active sheets and renames them before deleting obsolete tables',()=>{
 const s=fixture(),c=s.c;add(s,'old');const active=c.generationSheet_('Noticias_class_active',vm.runInContext('RADAR.sheets.Noticias',c));active.grid.push(['current']);const id=active.getSheetId();s.properties.DATA_GENERATION=JSON.stringify({newsSheet:'Noticias_class_active',taxonomySheet:'Taxonomia'});vm.runInContext('dataGenerationMemory_=undefined',c);
 const plan=c.previewCanonicalStorage();assert.equal(plan.moves.length,1);assert.ok(s.sheets.has('Noticias_class_active'));const result=c.migrateCanonicalStorage();assert.equal(c.newsSheet_().getSheetId(),id);assert.equal(c.newsSheet_().grid[1][0],'current');assert.ok(result.removed.some(name=>name.startsWith('Obsoleta_')));assert.equal(s.sheets.has('Noticias_class_active'),false);assert.equal(s.properties.CANONICAL_STORAGE_JOURNAL,undefined);
});
test('migration resumes a rename interrupted after retiring the old base',()=>{
 const s=fixture(),c=s.c,active=c.generationSheet_('Noticias_class_active',vm.runInContext('RADAR.sheets.Noticias',c));active.grid.push(['current']);s.properties.DATA_GENERATION=JSON.stringify({newsSheet:'Noticias_class_active'});vm.runInContext('dataGenerationMemory_=undefined',c);const rename=active.setName;let first=true;active.setName=name=>{if(first){first=false;throw Error('Interrupted');}return rename(name);};assert.throws(()=>c.migrateCanonicalStorage(),/Interrupted/);assert.ok(s.properties.CANONICAL_STORAGE_JOURNAL);c.migrateCanonicalStorage();assert.equal(c.newsSheet_().grid[1][0],'current');assert.equal(c.newsStorageKey_(),'Noticias');
});
test('incremental pass skips current rows and writes only an edited record in place',()=>{
 const s=fixture(),c=s.c;add(s,'one');add(s,'two','BBVA incorpora autenticación biométrica para empresas');c.requestNewsClassification_(true);c.newsClassificationBatch_();for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();let calls=0;const classify=c.classification_;c.classification_=(...args)=>{calls++;return classify(...args);};c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(calls,0);for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();assert.equal(c.newsStorageKey_(),'Noticias');c.newsSheet_().grid[2][5]='BBVA mejora el acceso de banca online para empresas';c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(calls,1);assert.equal([...s.sheets.keys()].some(name=>/Noticias_(class|tax|maintenance)_/.test(name)),false);
});
test('physical deduplication repoints newsletter references before deleting the losing row',()=>{
 const s=fixture(),c=s.c;add(s,'one');add(s,'two');const rows=c.rows_('Noticias'),aliases=[];c.uniqueNews_(rows,aliases);assert.equal(aliases.length,1);s.sheets.get('NewsletterContenido').grid.push(['edition',rows[aliases[0].index].id]);const retained=rows[aliases[0].representativeIndex].id;assert.equal(c.cleanDuplicateNews().removed,1);assert.equal(c.rows_('Noticias').length,1);assert.equal(c.rows_('NewsletterContenido')[0].noticia,retained);assert.equal(c.cleanDuplicateNews().removed,0);
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
 const s=currentSourceStorage(),c=s.c;c.initializeConfiguration();add(s,'one');c.requestTaxonomy_();let checks=0,published=false;c.backgroundPaused_=()=>++checks>=3;c.publishTaxonomy_=()=>{published=true;};c.taxonomyBatch_();assert.equal(published,false);assert.equal(c.taxonomyJob_().phase,'scan');assert.equal(c.taxonomyJob_().next,2);
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
