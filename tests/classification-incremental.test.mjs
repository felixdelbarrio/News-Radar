import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';

function fixture(count=1004){
 const s=storage(),c=s.c;c.initializeConfiguration();
 const feed=c.feeds_().find(f=>f.entity==='BBVA'&&f.country==='España'&&f.domain==='news.google.com'),now=new Date('2026-10-27T07:00:00Z');
 const item=c.evaluate_({title:'BBVA lanza pagos digitales para empresas',excerpt:'Nueva plataforma digital para empresas',url:'https://news.google.com/rss/articles/seed',source:'Editor',date:'2026-10-26T10:00:00Z'},feed,now).item;
 const seed=Array.from(c.newsRecord_(item,feed,now)),sheet=c.newsSheet_(),keys=vm.runInContext('RADAR.sheets.Noticias',c),labelColumn=keys.indexOf('clasificacion'),currentVersion=vm.runInContext('RADAR.version',c);
 const append=(size,version=currentVersion,stale=false)=>{for(let i=0;i<size;i++){const row=[...seed],labels=JSON.parse(row[labelColumn]);row[0]='id-'+sheet.grid.length;row[7]='https://news.google.com/rss/articles/'+row[0];labels.procedencia.versionReglas=version;if(stale)labels.contentHash='outdated';row[labelColumn]=JSON.stringify(labels);sheet.grid.push(row);}};
 append(count,'3.30.2');s.properties.NEWS_RECORDS_REVISION='initial';
 s.properties.CLASSIFICATION_JOB=JSON.stringify({source:c.newsStorageKey_(),total:count,next:count+2,revision:c.newsClassificationRevision_(),recordsRevision:'initial',state:'Completada',classified:0,digital:0});
 const reads=[],writes=[],get=sheet.getRange.bind(sheet),write=c.writeNewsCells_,classify=c.classification_;let engineCalls=0;
 sheet.getRange=(...args)=>{reads.push(args);return get(...args);};c.writeNewsCells_=updates=>{writes.push(...updates);return write(updates);};c.classification_=(...args)=>{engineCalls++;return classify(...args);};
 return {...s,sheet,keys,append,reads,writes,engineCalls:()=>engineCalls};
}

test('technical releases reuse the live checkpoint; five appended articles read only five rows and preserve the historical corpus',()=>{
 const s=fixture(),c=s.c,before=JSON.stringify(s.sheet.grid),checkpoint=s.properties.CLASSIFICATION_JOB;c.requestNewsClassification_();assert.equal(s.properties.CLASSIFICATION_JOB,checkpoint);assert.equal(s.reads.length,0);
 s.append(5);c.invalidateNews_(true,true,false);c.requestNewsClassification_();const job=c.getClassificationStatus().job;assert.equal(job.total,5);assert.equal(job.sourceTotal,1009);assert.equal(job.firstRow,1006);assert.equal(job.processed,0);assert.equal(c.controlProcess_('classification',job).done,0);
 c.newsClassificationBatch_();assert.ok(s.reads.some(([row,column,count,width])=>row===1006&&column===1&&count===5&&width===13));assert.ok(s.reads.every(([row])=>row>=1006));assert.equal(s.engineCalls(),0);assert.equal(s.writes.length,0);assert.equal(c.getClassificationStatus().job.processed,5);assert.equal(c.controlProcess_('classification',c.classificationJob_()).done,5);assert.equal(JSON.stringify(s.sheet.grid.slice(0,1005)),before);
});

test('a missing checkpoint validates current labels without rewriting application-version provenance',()=>{
 const s=fixture(3),c=s.c;delete s.properties.CLASSIFICATION_JOB;c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(c.getClassificationStatus().job.processed,3);assert.equal(s.engineCalls(),0);assert.equal(s.writes.length,0);
});

test('incremental batches resume across appends and their own label writes without restarting or rereading old rows',()=>{
 const s=fixture(4),c=s.c;s.append(150,undefined,true);c.invalidateNews_(true,true,false);c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(c.classificationJob_().next,106);const input=c.classificationJob_().inputRevision;assert.equal(c.classificationInputRevision_(),input);
 s.append(5);c.invalidateNews_(true,true,false);c.requestNewsClassification_();assert.equal(c.classificationJob_().next,106);c.newsClassificationBatch_();assert.equal(c.getClassificationStatus().job.total,155);assert.equal(c.getClassificationStatus().job.processed,155);assert.equal(c.classificationJob_().sourceTotal,159);assert.equal(s.engineCalls(),150);assert.ok(s.reads.every(([row])=>row>=6));assert.ok(s.writes.every(update=>update.row>=6));
});

test('historical edits, deletions, source replacements and rule changes invalidate an incremental cursor; explicit force still scans all rows',()=>{
 for(const mutation of ['edit','delete','source','rules','force']){
  const s=fixture(4),c=s.c;s.append(3);c.invalidateNews_(true,true,false);c.requestNewsClassification_();assert.equal(c.classificationJob_().firstRow,6);
  if(mutation==='edit'){s.sheet.grid[1][5]='BBVA mejora pagos digitales para empresas';c.invalidateNews_();}
  if(mutation==='delete')s.sheet.grid.pop();
  if(mutation==='source')c.newsStorageKey_=()=> 'replacement';
  if(mutation==='rules'){c.configuration_().entities[0].enabled=false;vm.runInContext('classificationRevisionMemory_=undefined',c);}
  if(mutation==='force')c.requestNewsClassification_(true);else c.newsClassificationBatch_();
  assert.equal(c.classificationJob_().firstRow,2,mutation);assert.equal(c.classificationJob_().next,2,mutation);assert.equal(c.classificationJob_().total,mutation==='delete'?6:7,mutation);
 }
});
