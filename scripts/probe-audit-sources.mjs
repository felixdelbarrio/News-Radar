import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {digest} from './quality-audit.mjs';
export const SOURCE_PROBE_REVISION=1;

// A bounded transport probe, not an editorial verifier. Google/consent HTML is
// never promoted to article evidence. Do not follow arbitrary redirects or run
// article scripts. Original source corroboration is a separate evidence step.
export async function probeSource(url,{fetcher=fetch,timeoutMs=4000,maxBytes=131072}={}){
 const checkedAt=new Date().toISOString();
 const result={input_url:url,checked_at:checkedAt,verification_status:'unknown',label_auto:'unknown',evidence_url:'',evidence_excerpt:''};
 let parsed;
 try{parsed=new URL(url);}catch{return {...result,status:'invalid_url'};}
 if(parsed.protocol!=='https:'||parsed.hostname!=='news.google.com'||parsed.port||parsed.username||parsed.password)return {...result,status:'unsupported_source_host'};
 try{
  const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(timeoutMs),headers:{Accept:'text/html'}});
  if(response.status>=300&&response.status<400){await response.body?.cancel();return {...result,status:'redirect_requires_source_verification',http_status:response.status,redirect_target:response.headers.get('location')||''};}
  if(!response.ok){await response.body?.cancel();return {...result,status:'http_error',http_status:response.status};}
  let bytes=0;const chunks=[];
  if(response.body)for await(const chunk of response.body){bytes+=chunk.length;if(bytes>maxBytes)return {...result,status:'response_limit',http_status:response.status,bytes};chunks.push(chunk);}
  return {...result,status:'aggregator_not_original_evidence',http_status:response.status,bytes,response_sha256:digest(Buffer.concat(chunks))};
 }catch(error){return {...result,status:'fetch_failed',error:String(error.name||'Error')};}
}

export async function probeAudit(fixture,output,{concurrency=4,probe=probeSource,progress=()=>{}}={}){
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>4)throw Error('Concurrency must be between one and four');
 const cases=[...fixture.cases].sort((a,b)=>a.priority.localeCompare(b.priority)||a.id.localeCompare(b.id));
 const cache=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{input_sha256:fixture.source_sha256,probe_revision:SOURCE_PROBE_REVISION,results:{}};
 if(cache.input_sha256!==fixture.source_sha256)throw Error('Checkpoint belongs to a different audit input');
 if(cache.probe_revision!==SOURCE_PROBE_REVISION)throw Error('Checkpoint belongs to a different source probe revision');
 let cursor=0,completed=0;
 // Each completed attempt is durable; interrupted runs retry only absent IDs.
 fs.mkdirSync(path.dirname(output),{recursive:true});
 await Promise.all(Array.from({length:concurrency},async()=>{
  while(cursor<cases.length){
   const row=cases[cursor++];if(cache.results[row.id]?.input_url===row.url)continue;
   cache.results[row.id]={id:row.id,...await probe(row.url)};
   fs.writeFileSync(output+'.tmp',JSON.stringify(cache,null,2)+'\n');fs.renameSync(output+'.tmp',output);
   completed++;if(completed%20===0)progress(completed);
  }
 }));
 return cache;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [input,output='output/iteration-27/source-probes.json']=process.argv.slice(2);
 if(!input)throw Error('Usage: node scripts/probe-audit-sources.mjs fixture.json [checkpoint.json]');
 const result=await probeAudit(JSON.parse(fs.readFileSync(input,'utf8')),output,{progress:count=>console.log(count+' source attempts completed')});
 console.log(JSON.stringify({attempted:Object.keys(result.results).length,statuses:Object.values(result.results).reduce((counts,row)=>(counts[row.status]=(counts[row.status]||0)+1,counts),{})}));
}
