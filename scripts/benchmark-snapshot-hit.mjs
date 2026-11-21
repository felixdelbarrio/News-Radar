import {performance} from 'node:perf_hooks';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {storage} from '../tests/helpers/server.mjs';
import {benchmarkSource} from './benchmark-source.mjs';
import {TestDate} from '../tests/helpers/clock.mjs';
// Synthetic local V8 + in-memory Sheets. Never interpretable as production latency.
const expected=new Map();
const baseline=benchmarkSource([...process.argv.slice(2),'--baseline=origin/develop']);
for(const [label,source] of [['baseline',baseline.source],['current',undefined]]){
 const s=storage(source),c=s.c;c.Date=TestDate;c.initializeConfiguration();
 const title='BBVA lanza pagos digitales para empresas',excerpt='Nueva funcionalidad de pagos digitales y tesorería para pymes.',labels=JSON.stringify(c.classification_(c.searchText_(title),c.searchText_(title+' '+excerpt)).labels),headers=vm.runInContext('RADAR.sheets.Noticias',c),day=c.recordDay(new TestDate(),c.settings_().timezone);
 for(let i=0;i<500;i++){const row={id:'synthetic-'+i,fecha:day,pais:i%2?'España':'México',medio:'Editor',entidad:'BBVA',titular:title+' '+i,extracto:excerpt,url:'https://editor.test/'+i,fuente:'Editor',idioma:'es',clasificacion:labels,taxonomia:'{"ids":[]}'};s.sheets.get('Noticias').grid.push(headers.map(k=>row[k]||''));}
 c.invalidateNews_();for(let i=0;i<8&&c.dashboardSnapshotsPending_();i++)c.dashboardSnapshotBatch_();
 let calls=0;const feeds=c.feeds_;c.feeds_=()=>{calls++;return feeds();};
 for(const view of ['briefing','news','radar']){
  const times=[];let bytes=0;let functional;const before=calls,reads=s.reads;
  for(let i=0;i<15;i++){let started=performance.now();const r=c.getDashboard({view,initial:true,language:'es'});times.push(performance.now()-started);bytes=Buffer.byteLength(JSON.stringify(r));functional=createHash('sha256').update(JSON.stringify({ids:r.items.map(x=>x.id),total:r.total,contextTotal:r.contextTotal,selection:r.selection,sourceCount:r.sourceCount})).digest('hex');if(!r.performance.snapshotHit)throw Error('Expected snapshot hit');}
  if(label==='baseline')expected.set(view,functional);else if(expected.get(view)!==functional)throw Error('Functional output changed: '+view);
  times.sort((a,b)=>a-b);console.log(JSON.stringify({label,baselineRevision:baseline.revision,node:process.version,view,n:times.length,p50:times[7],p95:times[14],feedsCalls:calls-before,sheetReads:s.reads-reads,bytes,syntheticRows:500,functional}));
 }
}
