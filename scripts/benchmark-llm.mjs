// Local Sheets emulator: these measurements do not estimate Apps Script quotas or latency.
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {storage} from '../tests/helpers/server.mjs';
const total=Number(process.argv[2]||8863),views=['briefing','news','radar'];
const oldFiles=execFileSync('git',['ls-tree','--name-only','HEAD','dist/'],{encoding:'utf8'}).trim().split('\n').filter(file=>file.endsWith('.gs'));
const oldSource=oldFiles.map(file=>execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'})).join('\n');
const measurements=[];
function prepare(source){
 const s=storage(source),c=s.c;c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),title='BBVA lanza login biométrico para empresas',labels=JSON.stringify(c.classification_(c.searchText_(title),c.searchText_(title)).labels),taxonomia=JSON.stringify(c.taxonomyRecord_(title,''));
 const rows=Array.from({length:total},(_,i)=>({id:'news-'+i,fecha:'2026-10-17',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'',url:'https://example.com/'+i,fuente:'Editor',idioma:'es',clasificacion:labels,taxonomia}));
 c.append_('Noticias',rows.map(row=>keys.map(key=>row[key]||'')));c.invalidateNews_();return {s,c,rows};
}
function measure(label,s,fn){
 let writes=0;const originals=[];for(const sheet of s.book.getSheets()){const get=sheet.getRange;originals.push([sheet,get]);sheet.getRange=(...args)=>{const range=get(...args),set=range.setValues;range.setValues=(...values)=>{writes++;return set(...values);};return range;};}
 const reads=s.reads,ram=process.memoryUsage().heapUsed,start=performance.now(),value=fn();const row={label,ms:Math.round((performance.now()-start)*10)/10,heapDeltaMiB:Math.round((process.memoryUsage().heapUsed-ram)/1024/1024*10)/10,reads:s.reads-reads,writes};measurements.push(row);for(const [sheet,get]of originals)sheet.getRange=get;return value;
}
for(const [name,source]of [['baseline-3.7.2',oldSource],['new-deterministic',undefined]]){
 const {s,c,rows}=prepare(source);measure(name+':snapshots',s,()=>{for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();});
 for(const view of views)measure(name+':'+view,s,()=>c.getDashboard({view,initial:true}));
 if(name==='new-deterministic'){
  const archive=measure('export:first-zip',s,()=>c.exportLlmPending());
  const context=c.llmContext_(),result=rows.slice(0,250).map(row=>({newsId:row.id,contentHash:c.llmArticle_(row).contentHash,catalogRevision:context.catalogRevision,taxonomyRevision:context.taxonomyRevision,schemaVersion:1,ids:[],primary:'',evidence:[],status:'insufficient_evidence'}));
  measure('import:250-synthetic-empty-results',s,()=>c.importLlmResults({name:'results.json',base64:Buffer.from(JSON.stringify({schemaVersion:1,results:result})).toString('base64')}));
  for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();const state=c.getLlmCategorization();c.saveLlmCategorization({projectUrl:state.projectUrl,mode:'llm',revision:state.revision});measure('new-llm:snapshots',s,()=>{for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();});
  for(const view of views)measure('new-llm:'+view,s,()=>c.getDashboard({view,initial:true}));
  console.log(JSON.stringify({environment:'Node.js local Sheets emulator; synthetic duplicated headlines; not production',total,valid:c.getLlmCategorization().valid,pending:c.getLlmCategorization().pending,firstZip:{count:archive.count,bytes:Buffer.from(archive.base64,'base64').length,done:archive.done},measurements},null,2));
 }
}
