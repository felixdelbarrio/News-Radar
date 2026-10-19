// Full export comparison against the exact prior release. Local emulator, never production latency.
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {storage} from '../tests/helpers/server.mjs';
import {root} from './source.mjs';
import {llmBundleWriter} from '../src/shared/llm-offline.js';
const total=Number(process.argv[2]||8896),baseline='ecaffa8';
if(!Number.isSafeInteger(total)||total<1||total>20000)throw Error('Use 1–20000 synthetic articles.');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim(),commit=git(['rev-parse',baseline]),source=git(['ls-tree','--name-only',commit,'dist/']).split('\n').filter(file=>file.endsWith('.gs')).map(file=>git(['show',commit+':'+file])).join('\n'),reports=[];
for(const [name,code]of [['before',source],['after',undefined]]){
 const s=storage(code),c=s.c;c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),title='BBVA lanza login biométrico para empresas';
 const row={fecha:'2026-10-19',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'',fuente:'Editor',idioma:'es',clasificacion:JSON.stringify(c.classification_(c.searchText_(title),c.searchText_(title)).labels),taxonomia:JSON.stringify(c.taxonomyRecord_(title,''))};
 c.append_('Noticias',Array.from({length:total},(_,i)=>keys.map(key=>key==='id'?'news-'+i:key==='url'?'https://publisher.example.com/'+i:row[key]||'')));c.invalidateNews_();
 global.gc?.();const start=performance.now(),cpu=process.cpuUsage(),reads=s.reads,heap=process.memoryUsage().heapUsed,zip=llmBundleWriter(text=>new TextEncoder().encode(text));let peakHeap=heap,cursor=2,revision,count=0,requests=0,downloadBytes=0,done=false;
 while(!done){const response=c.exportLlmPending({cursor,...(revision?{revision}:{})});requests++;cursor=response.cursor;revision=response.revision;count+=response.count;done=response.done;
  if(name==='before')downloadBytes+=Buffer.from(response.base64,'base64').length;else zip.add(response);
  peakHeap=Math.max(peakHeap,process.memoryUsage().heapUsed);global.gc?.();
 }
 if(name==='after')downloadBytes=zip.finish().reduce((sum,part)=>sum+part.length,0);
 const used=process.cpuUsage(cpu);reports.push({name,version:vm.runInContext('RADAR.version',c),count,requests,downloads:name==='before'?requests:1,downloadBytes,ms:Math.round(performance.now()-start),cpuMs:Math.round((used.user+used.system)/1000),reads:s.reads-reads,observedHeapIncreaseMiB:Math.round((peakHeap-heap)/1024/1024)});
}
console.log(JSON.stringify({environment:'Node Sheets emulator; synthetic articles; full export; sampled heap includes GC and is not a production peak',baselineCommit:commit,total,reports},null,2));
