import vm from 'node:vm';
import {benchmarkSource} from './benchmark-source.mjs';
import {performance} from 'node:perf_hooks';
import {storage} from '../tests/helpers/server.mjs';
// Local V8 + in-memory Sheets adapter. These are NOT Apps Script measurements.
let canonicalBenchmarkLabels;
function benchmarkLabels(){if(canonicalBenchmarkLabels)return canonicalBenchmarkLabels;const {c}=storage();c.initializeConfiguration();const title='BBVA lanza pagos digitales para empresas',text=title+' Nueva funcionalidad de pagos digitales y tesorería para pymes.';return canonicalBenchmarkLabels=JSON.stringify(c.classification_(c.searchText_(title),c.searchText_(text)).labels);}
export function benchmarkNews(count,sample,source){
 const labels=benchmarkLabels(),s=storage(source),c=s.c;c.initializeConfiguration();
 for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 const headers=vm.runInContext('RADAR.sheets.Noticias',c),grid=s.sheets.get('Noticias').grid;
 for(let i=0;i<count;i++){
  const row={id:'n'+i,fecha:new Date(Date.UTC(2025,9,16)+Math.floor(i*365/count)*86400000).toISOString().slice(0,10),pais:'España',medio:'Editor',entidad:i%2?'BBVA':'Santander',titular:`BBVA lanza pagos digitales para empresas con producto ${i}`,extracto:'Nueva funcionalidad de pagos digitales y tesorería para pymes.',url:'https://editor.test/news/'+i,capturada:'2026-10-15T00:00:00Z',fuente:'Editor',idioma:'es',clasificacion:labels,taxonomia:'{"ids":[]}'};
  grid.push(headers.map(key=>row[key]||''));
 }
 const runs=[];
 for(const [scenario,view,page] of [['radar cold','radar',0],['briefing cold','briefing',0],['news cold','news',0],['news next page','news',1],['news cache hit','news',1],['old period','news',0],['full history','news',0]]){
  const query=scenario==='full history'?{from:'2025-10-16',to:'2026-10-15',page}:scenario==='old period'?{from:'2025-10-16',to:'2025-10-17',page}:{from:'2026-09-18',to:'2026-10-15',page};
  globalThis.gc?.();const heapBefore=process.memoryUsage().heapUsed,reads=s.reads,start=performance.now(),result=c.dashboardContent_(query,[],view,'es'),ms=Math.round((performance.now()-start)*10)/10;globalThis.gc?.();
  runs.push({scenario,ms,sheetReads:s.reads-reads,total:result.data.total,cacheHit:result.cacheHit,retainedHeapBytes:globalThis.gc?process.memoryUsage().heapUsed-heapBefore:null});
 }
 return runs;
}
if(process.argv[1]?.endsWith('/benchmark-news.mjs')){
 const {baseline,revision:baselineRevision,source}=benchmarkSource(process.argv.slice(2));
 for(const count of [10000,25000,50000])for(let sample=1;sample<=3;sample++)console.log(JSON.stringify({baseline,baselineRevision,count,sample,runs:benchmarkNews(count,sample,source)}));
}
