import {configurationDefaults} from './configuration-defaults.mjs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {read,readServerScript} from './source.mjs';
const config=configurationDefaults();
const additions=JSON.parse(read('tests/fixtures/iteration3-feeds.json'));
const existing=JSON.parse(read('tests/fixtures/digital-feeds.json'));
export function compareDigital(){
 const c=vm.createContext({});vm.runInContext(readServerScript(),c);c.configuration_=()=>config;
 const now=new Date('2026-10-12T23:59:59Z'),range={from:'2026-09-01',to:'2026-10-12'},sources=[];
 const known=new Set();let received=0,added=0,digital=0;
 for(const sample of [...existing.feeds,...additions.feeds]){
  const feed={...config.feeds.find(row=>row.id===sample.id),kind:'rss',range};let accepted=0,channels=0;
  for(const raw of sample.items){received++;const result=c.evaluate_(raw,feed,now);if(!result.item||known.has(result.item.url))continue;known.add(result.item.url);accepted++;if(result.item.labels.digital)channels++;}
  sources.push({source:sample.id,received:sample.items.length,unique:accepted,digital:channels});added+=accepted;digital+=channels;
 }
 const old={...config,feeds:config.feeds.slice(0,5),entities:config.entities.slice(0,-4)};
 const plans={};for(const kind of ['daily','annual']){
  const period=kind==='daily'?c.collectionRecentRange_(now):{from:'2025-10-13',to:'2026-10-13'},after=c.collectionFeeds_(period).length;c.configuration_=()=>old;const before=c.collectionFeeds_(period).length;c.configuration_=()=>config;plans[kind]={before,after,changePercent:Math.round((after/before-1)*1000)/10};
 }
 const rows=additions.feeds.flatMap(sample=>sample.items).map(raw=>({title:c.searchText_(c.plainText_(raw.title)),text:c.searchText_(c.plainText_(raw.title+' '+raw.excerpt))}));
 const rounds=10,timings=[];for(let warmup=0;warmup<2;warmup++)for(const row of rows)c.classification_(row.title,row.text);
 for(let round=0;round<rounds;round++)for(const labels of round%2?[true,false]:[false,true]){
  const start=performance.now();for(const row of rows)c.classification_(row.title,row.text,labels);timings.push({labels,ms:performance.now()-start});
 }
 const median=labels=>{const times=timings.filter(row=>row.labels===labels).map(row=>row.ms).sort((a,b)=>a-b);return Math.round((times[4]+times[5])/2*100)/100;};
 return {range,received,unique:added,digital,sources,plans,cpu:{rowsPerRound:rows.length,rounds,withoutLabelsMedianMs:median(false),withLabelsMedianMs:median(true)},limitations:'RSS congelados: siete entradas Finextra seleccionadas y 60 entradas completas de dos RSS nuevos. Incremental respecto a esta muestra, no a todo el histórico o Google News. CPU local con la misma carga y reglas, comparando construir o no etiquetas; no mide latencia de Apps Script ni red. Planes sin saturaciones ni reintentos.'};
}
if(process.argv[1]?.endsWith('/compare-digital.mjs'))console.log(JSON.stringify(compareDigital(),null,2));
