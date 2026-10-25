import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {parse} from 'acorn';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {readServerScript} from './source.mjs';
import {configurationDefaults} from './configuration-defaults.mjs';

export const digest=value=>createHash('sha256').update(value).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));

// Instrument the actual expression in a disposable VM. Never copied to dist.
// Observers return the original value; short-circuited operands stay unobserved.
export function instrumentAssessment(source){
 const tree=parse(source,{ecmaVersion:'latest'}),fn=tree.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name==='digitalAssessment_');
 if(!fn)throw Error('digitalAssessment_ contract changed');
 const declaration=fn.body.body.flatMap(node=>node.declarations||[]).find(node=>node.id.name==='relevant');
 const result=fn.body.body.find(node=>node.type==='ReturnStatement');
 if(!declaration||!result)throw Error('Assessment instrumentation contract changed');
 const gates=[];
 function wrap(node){
  let expression=source.slice(node.start,node.end);
  if(node.type==='LogicalExpression')expression=wrap(node.left)+' '+node.operator+' '+wrap(node.right);
  else if(node.type==='CallExpression'&&node.callee.name==='Boolean')expression='Boolean('+wrap(node.arguments[0])+')';
  const key=String(gates.length);gates.push({key,expression:source.slice(node.start,node.end)});
  return '__auditObserve('+JSON.stringify(key)+',('+expression+'))';
 }
 const expression=wrap(declaration.init),locals='__auditLocals({aiOnly,workforce,bilateral,explicitDigital,excluded,editorial,business,channel,shared,incident,operational,digital:relevant,capabilities:capabilities.map(row=>row.segment+": "+row.name)});\n';
 return {source:source.slice(0,declaration.init.start)+expression+source.slice(declaration.init.end,result.start)+locals+source.slice(result.start),gates};
}

export function auditRuntime(config=configurationDefaults(),{trace=true}={}){
 const original=readServerScript('src/server'),instrumented=trace?instrumentAssessment(original):{source:original,gates:[]};
 let conditions={},locals={};
 const c=vm.createContext({__auditObserve:(key,value)=>{conditions[key]=Boolean(value);return value;},__auditLocals:value=>{locals=clone(value);},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_algorithm,value)=>[...createHash('sha256').update(value).digest()]}});
 vm.runInContext(instrumented.source,c);c.configuration_=()=>config;
 c.validateConfiguration_(config);
 return {c,sourceRevision:digest(original),configRevision:digest(JSON.stringify(config)),classify(row){
  conditions={};locals={};
  const title=c.searchText_(c.plainText_(row.title)),text=c.searchText_(c.plainText_(row.title)+' '+c.plainText_(row.excerpt));
  const result=c.classification_(title,text,true,row.publisher||'');
  return {labels:clone(result.labels),trace:trace?{...locals,conditions:instrumented.gates.map(gate=>({...gate,value:Object.hasOwn(conditions,gate.key)?conditions[gate.key]:null})),semantics:'null = not evaluated (short circuit); observed false is a gate result, not proof of editorial error'}:null};
 }};
}

// Unknown evidence never becomes a negative reference. Abstentions on verified
// positives count against recall; they are also reported independently.
export function qualityMetrics(rows){
 const counts={tp:0,fp:0,tn:0,fn:0,abstentions:0,unknownEvidence:0,verified:0};
 for(const row of rows){
  if(row.verification_status!=='verified_evidence'||!['relevant','not_relevant'].includes(row.label_auto)){counts.unknownEvidence++;continue;}
  counts.verified++;
  if(!['relevant','not_relevant'].includes(row.prediction)){counts.abstentions++;if(row.label_auto==='relevant')counts.fn++;continue;}
  counts[row.label_auto==='relevant'?(row.prediction==='relevant'?'tp':'fn'):(row.prediction==='relevant'?'fp':'tn')]++;
 }
 const precision=counts.tp+counts.fp?counts.tp/(counts.tp+counts.fp):null,recall=counts.tp+counts.fn?counts.tp/(counts.tp+counts.fn):null;
 return {...counts,total:rows.length,coverage:rows.length?counts.verified/rows.length:0,precision,recall,f1:precision!==null&&recall!==null?(precision+recall?2*precision*recall/(precision+recall):0):null};
}

export function publicationDecision(gates){
 const required=['G0','G1','G2','G3','G4'];
 return {decision:required.every(key=>gates[key]?.passed===true)?'GO':'NO-GO',gates:Object.fromEntries(required.map(key=>[key,gates[key]||{passed:false,reason:'No evidence supplied'}]))};
}

const stateLabel=state=>({'relevante':'relevant','no relevante':'not_relevant','indeterminado':'unknown'}[state]||'unknown');
export function runAudit(fixture,{config=configurationDefaults(),configurationKind='repository_defaults',sourceProbes=null,sourceReviews=[]}={}){
 const runtime=auditRuntime(config),timings=[];
 if(fixture.cases.length!==170||new Set(fixture.cases.map(row=>row.id)).size!==170)throw Error('Expected 170 unique cases');
 if(sourceProbes&&sourceProbes.input_sha256!==fixture.source_sha256)throw Error('Source probes belong to another input');
 const rows=[...fixture.cases].sort((a,b)=>a.priority.localeCompare(b.priority)||a.id.localeCompare(b.id)).map(row=>{
  const started=performance.now(),result=runtime.classify(row);timings.push(performance.now()-started);
  const country=runtime.c.newsCountry_({titular:row.title,extracto:row.excerpt,url:row.url,pais:row.country_stored,medio:row.publisher||'',fuente:''});
  const probe=sourceProbes?.results[row.id];
  if(probe&&probe.input_url!==row.url)throw Error('Source probe URL mismatch for '+row.id);
  const review=sourceReviews.find(review=>review.id===row.id);
  if(review&&(!/^https:\/\//.test(review.evidence_url)||typeof review.evidence_excerpt!=='string'||review.evidence_excerpt.length>300||!Number.isFinite(Date.parse(review.evidence_date))||!review.rationale))throw Error('Incomplete source review for '+row.id);
  return {...row,input_sha256:digest(JSON.stringify(row)),partition:parseInt(digest(runtime.c.canonicalUrl_(row.url)||row.id).slice(0,8),16)%5===0?'holdout':'diagnostic',configuration_kind:configurationKind,source_revision:runtime.sourceRevision,config_revision:runtime.configRevision,replay_status:'not_reproducible',replay_reason:fixture.missing_inputs.join('; '),replay_match:null,diagnostic_state_agreement:result.labels.estado===row.state_stored,prediction:stateLabel(result.labels.estado),diagnostic_country:country,rule_trace:result.trace,labels:result.labels,evaluate_status:'not_reproducible: original date and feed unavailable',source_probe:probe||null,verification_status:review?'weak_evidence':'unknown',label_auto:'unknown',evidence_url:review?.evidence_url||'',evidence_excerpt:review?.evidence_excerpt||'',evidence_date:review?.evidence_date||'',source_review:review||null,decision:'NO-GO',decision_reason:'Missing exact replay inputs and independent source evidence; preserve stored record and active generation'};
 });
 timings.sort((a,b)=>a-b);
 const gates={G0:{passed:false,reason:'No immutable production snapshot, writer exclusion or tested production rollback'},G1:{passed:false,reason:'170 diagnostic evaluations; exact production replay and independent source verification unavailable'},G2:{passed:false,reason:'No independently evidenced holdout or demonstrated causal rule correction; metrics unavailable'},G3:{passed:false,reason:'170 local input IDs preserved; production and historical-reference reconciliation unavailable'},G4:{passed:false,reason:'Local checks are separate; live pilot and equivalent before/after WebApp measurements unavailable'}};
 return {schema:1,input_sha256:fixture.source_sha256,rows,metrics:qualityMetrics(rows),publication:publicationDecision(gates),diagnostic:{stateAgreement:rows.filter(row=>row.diagnostic_state_agreement).length,states:Object.fromEntries(['relevant','not_relevant','unknown'].map(state=>[state,rows.filter(row=>row.prediction===state).length])),performance:{p50:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)],unit:'ms',scope:'local instrumented diagnostic only; not production or baseline/candidate comparison'}},active_generation:'unverified',reclassified:0,published:0};
}

export function auditCsv(rows){
 const fields=['id','title','url','priority','state_before','state_stored','prediction','replay_status','replay_reason','replay_match','diagnostic_state_agreement','evaluate_status','country_before','country_stored','diagnostic_country','partition','verification_status','label_auto','evidence_url','evidence_excerpt','evidence_date','source_revision','config_revision','configuration_kind','decision','decision_reason','source_probe','source_review','rule_trace'];
 const cell=value=>'"'+String(typeof value==='object'&&value!==null?JSON.stringify(value):value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 return [fields,...rows.map(row=>fields.map(key=>row[key]))].map(values=>values.map(cell).join(',')).join('\r\n')+'\r\n';
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [input,output='output/iteration-27',configFile,probeFile,reviewFile]=process.argv.slice(2);
 if(!input)throw Error('Usage: node scripts/quality-audit.mjs fixture.json [output-directory] [resolved-config.json|-] [source-probes.json] [source-reviews.json]');
 const fixture=JSON.parse(fs.readFileSync(input,'utf8')),result=runAudit(fixture,{...(configFile&&configFile!=='-'?{config:JSON.parse(fs.readFileSync(configFile,'utf8')),configurationKind:'supplied_unattested_snapshot'}:{}),...(probeFile?{sourceProbes:JSON.parse(fs.readFileSync(probeFile,'utf8'))}:{}),...(reviewFile?{sourceReviews:JSON.parse(fs.readFileSync(reviewFile,'utf8'))}:{})});
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(output,'audit.csv'),auditCsv(result.rows));
 const {rows,...report}=result;fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:rows.length,...report},null,2));
}
