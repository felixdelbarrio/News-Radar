// Read-only replay: no Sheet writes, ingestions, network requests or email.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {storage} from '../tests/helpers/server.mjs';
import {readServerScript,read} from './source.mjs';
import decisions from '../tests/fixtures/headline-editorial-decisions.json' with {type:'json'};
const input=process.argv[2],out=process.argv[3];
if(!input||!out)throw Error('Usage: node scripts/audit-headlines.mjs input.json output.json');
const current=readServerScript(),previousRules=execFileSync('git',['show','origin/develop:dist/Rules.gs'],{encoding:'utf8'});
const before=storage(current.replace(read('dist/Rules.gs'),()=>previousRules)).c,after=storage(current).c;
before.initializeConfiguration();after.initializeConfiguration();
const rows=JSON.parse(fs.readFileSync(input,'utf8')),timings={before:[],after:[]};
const evaluate=(c,row,times)=>{const title=c.searchText_(row.title),text=c.searchText_(row.title+' '+row.excerpt),start=performance.now(),a=c.classification_(title,text).assessment;times.push(performance.now()-start);return {digital:a.relevant,business:a.business,channel:a.channel,signals:Array.from(a.signals),evidence:a.evidence};};
const results=rows.map(row=>{
 const prior=evaluate(before,row,timings.before),next=evaluate(after,row,timings.after);
 const reviewed=decisions.find(item=>item.id===row.id),decision=reviewed?.decision||'indeterminada',confidence=reviewed?.confidence||'insuficiente';
 return {...row,decision,confidence,reason:reviewed?.reason||'El titular no permite establecer el segmento y la capacidad digital con suficiente certeza.',rule:'digitalAssessment_: evidencia de servicio, segmento, exclusiones y contexto funcional',before:prior,after:next,changed:prior.digital!==next.digital,historicalAction:decision.startsWith('FP confirmado')?'Elegible para revisión selectiva contra snapshot de producción; no implica escritura':'Sin cambios',test:reviewed?'tests/headline-editorial.test.mjs':'Sin etiqueta inequívoca; no se usa para precisión/recall'};
});
const stats=values=>{const sorted=values.slice().sort((a,b)=>a-b);return {n:sorted.length,medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1]};};
fs.writeFileSync(out,JSON.stringify({method:'Local Node replay in fixture Workspace; each record classified once per version; cold and warm samples mixed. No production performance claim.',baseline:'origin/develop',total:results.length,changed:results.filter(r=>r.changed).length,timings:{before:stats(timings.before),after:stats(timings.after)},results},null,2)+'\n');
console.log(JSON.stringify({total:results.length,changed:results.filter(r=>r.changed).length,timings:{before:stats(timings.before),after:stats(timings.after)}}));
