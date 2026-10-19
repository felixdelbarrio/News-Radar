// Paired technical measurements only; no precision claim or production quota estimate.
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {storage} from '../tests/helpers/server.mjs';
import {root} from './source.mjs';
const total=Number(process.argv[2]||8863),baselineRef=process.argv[3]||'0ba392b',measurements=[];
if(!Number.isSafeInteger(total)||total<1||total>50000)throw Error('Use 1–50000 synthetic articles.');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim(),commit=git(['rev-parse','--verify',baselineRef+'^{commit}']);
const baselineSource=git(['ls-tree','--name-only',commit,'dist/']).split('\n').filter(file=>file.endsWith('.gs')).map(file=>git(['show',commit+':'+file])).join('\n');
function measure(version,stage,s,operation){
 const reads=s.reads,start=performance.now(),heap=process.memoryUsage().heapUsed,originals=[],seen=new Set(),insert=s.book.insertSheet;let writes=0;
 const observe=sheet=>{if(seen.has(sheet))return sheet;seen.add(sheet);const get=sheet.getRange;originals.push([sheet,get]);sheet.getRange=(...args)=>{const range=get(...args),set=range.setValues;range.setValues=(...values)=>{writes++;return set(...values);};return range;};return sheet;};
 s.book.getSheets().forEach(observe);s.book.insertSheet=(...args)=>observe(insert(...args));
 try{const value=operation();measurements.push({version,stage,ms:Math.round((performance.now()-start)*10)/10,reads:s.reads-reads,writes,heapDeltaMiB:Math.round((process.memoryUsage().heapUsed-heap)/1024/1024*10)/10});return value;}
 finally{s.book.insertSheet=insert;for(const [sheet,get] of originals)sheet.getRange=get;}
}
function finish(c){for(let i=0;i<10&&c.llmJob_()?.state==='Publicando';i++)c.dashboardSnapshotBatch_();if(c.llmJob_()?.state!=='Completada')throw Error('Publication incomplete.');}
const states=[];
for(const source of [baselineSource,undefined]){
 const s=storage(source),c=s.c;c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});
 const version=vm.runInContext('RADAR.version',c),keys=vm.runInContext('RADAR.sheets.Noticias',c),title='BBVA lanza login biométrico para empresas',classification=JSON.stringify(c.classification_(c.searchText_(title),c.searchText_(title)).labels),taxonomy=JSON.stringify(c.taxonomyRecord_(title,''));
 c.append_('Noticias',Array.from({length:total},(_,i)=>{const row={id:'news-'+i,fecha:'2026-10-10',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'',url:'https://publisher.example.com/'+i,fuente:'Editor',idioma:'es',clasificacion:classification,taxonomia:taxonomy};return keys.map(key=>row[key]||'');}));c.invalidateNews_();
 measure(version,'snapshots:deterministic',s,()=>{for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();});
 const rows=c.rows_('Noticias');measure(version,'effective:deterministic',s,()=>c.annotateNews_(rows));
 const archive=measure(version,'export:first-zip',s,()=>c.exportLlmPending());
 const context=c.llmContext_(),id=c.taxonomyCatalog_().find(row=>row.subpalanca.includes('16.01.')).id,schemaVersion=context.schemaVersion;
 const results=rows.slice(0,250).map(row=>({newsId:row.id,contentHash:c.llmArticle_(row).contentHash,catalogRevision:context.catalogRevision,taxonomyRevision:context.taxonomyRevision,schemaVersion,ids:[id],primary:id,evidence:[{id,quote:'login biométrico',...(schemaVersion===2?{source:'article'}:{})}],status:'classified',...(schemaVersion===2?{sources:[],proposals:[],replaces:''}:{})}));
 measure(version,'import:classified',s,()=>c.importLlmResults({name:'results.json',base64:Buffer.from(JSON.stringify({schemaVersion,results})).toString('base64')}));finish(c);
 const state=c.getLlmCategorization();if(state.mode!==undefined)c.saveLlmCategorization({projectUrl:state.projectUrl,mode:'llm',revision:state.revision});measure(version,'snapshots:llm',s,()=>finish(c));
 measure(version,'effective:llm',s,()=>c.annotateNews_(rows));
 for(const view of ['briefing','news','radar']){
  s.cache.clear();measure(version,'read:cold:'+view,s,()=>c.getDashboard({view,initial:true}));measure(version,'read:warm:'+view,s,()=>c.getDashboard({view,initial:true}));
 }
 states.push({version,schemaVersion,valid:c.getLlmCategorization().valid,total,firstZip:{count:archive.count,bytes:archive.files?archive.files.reduce((sum,file)=>sum+Buffer.byteLength(file.text),0):Buffer.from(archive.base64,'base64').length}});
}
console.log(JSON.stringify({environment:'Node.js Sheets emulator; synthetic duplicated headlines; one observation per stage; heap delta includes GC; not production or semantic quality',baseline:{commit},states,measurements},null,2));
