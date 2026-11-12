// Read-only comparison. Use a local, authorized JSON export; the report contains
// record IDs and must remain outside the repository.
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {benchmarkSource} from './benchmark-source.mjs';
import {storage} from '../tests/helpers/server.mjs';

const [input,output,...flags]=process.argv.slice(2);
if(!input||!output||!flags.some(flag=>flag.startsWith('--baseline=')))throw Error('Uso: node scripts/audit-bei-evidence.mjs entrada.json informe.json --baseline=<revisión>');
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(rows)||!rows.length||rows.some(row=>!row?.id||typeof row.titular!=='string')||new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('Se requiere una lista no vacía con id único y titular por noticia.');
const baseline=benchmarkSource(flags);
function runner(source){
 const {c}=storage(source);c.initializeConfiguration();
 return rows.map(row=>{
  const titular=c.plainText_(row.titular),extracto=c.plainText_(row.extracto||''),title=c.searchText_(titular),text=c.searchText_(titular+' '+extracto);
  return ()=>{
   const {assessment}=c.classification_(title,text,false,row.medio);
   const geography=c.newsCountryDecision_({...row,titular,extracto});
   return {digital:assessment.relevant,segmento:assessment.evidence.segmento,geografias:Array.from(geography.geographies),metodo:geography.reason,confianza:geography.confidence};
  };
 });
}
const engines=[runner(baseline.source),runner()],timings=[[],[]];
let decisions;
for(let round=0;round<12;round++)for(const i of round%2?[1,0]:[0,1]){
 const start=performance.now(),results=engines[i].map(run=>run());
 if(round>=2)timings[i].push(performance.now()-start);
 if(round===11){decisions??=[];decisions[i]=results;}
}
const [before,after]=decisions;
const changes=rows.flatMap(({id},i)=>{
 const a=before[i],b=after[i];
 return a.digital===b.digital&&JSON.stringify(a.geografias)===JSON.stringify(b.geografias)&&JSON.stringify(a.segmento)===JSON.stringify(b.segmento)?[]:[{id,antes:a,despues:b}];
});
const metric=(values,durations)=>{
 const ms=durations.toSorted((a,b)=>a-b);
 return {eligible:values.filter(row=>row.digital).length,unknown:values.filter(row=>row.geografias[0]==='Sin determinar').length,medianMs:+((ms[4]+ms[5])/2).toFixed(2),p95Ms:+ms[9].toFixed(2)};
};
const summary={baseline:baseline.revision,rows:rows.length,changes:changes.length,before:metric(before,timings[0]),after:metric(after,timings[1]),scope:'Texto suministrado y configuración local. No consulta artículos ni mide latencia de Apps Script.'};
fs.writeFileSync(output,JSON.stringify({summary,changes},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(summary,null,2));
