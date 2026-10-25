import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditRuntime,qualityMetrics,publicationDecision,runAudit,auditCsv,instrumentAssessment} from '../scripts/quality-audit.mjs';
import {probeSource,probeAudit} from '../scripts/probe-audit-sources.mjs';
import os from 'node:os';
import path from 'node:path';

const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/iteration-27-audit.json',import.meta.url)));
test('test-only trace preserves all 170 actual classifier outputs and short-circuit evaluation',()=>{
 const traced=auditRuntime(),plain=auditRuntime(undefined,{trace:false});
 let skipped=0;
 for(const row of cases.cases){
  const observed=traced.classify(row),expected=plain.classify(row);
  assert.deepEqual(observed.labels,expected.labels,row.id);
  assert.equal(observed.trace.digital,expected.labels.digital);
  assert.equal(observed.trace.conditions.at(-1).value,expected.labels.digital);
  skipped+=observed.trace.conditions.filter(gate=>gate.value===null).length;
 }
 assert.ok(skipped>0,'short-circuited gates must remain unobserved');
});
test('an incomplete production input never becomes an exact replay or a gold label',()=>{
 const before=JSON.stringify(cases),report=runAudit(cases);
 assert.equal(JSON.stringify(cases),before);
 assert.equal(report.rows.length,170);
 assert.equal(new Set(report.rows.map(row=>row.id)).size,170);
 assert.ok(report.rows.every(row=>row.replay_match===null&&row.replay_status==='not_reproducible'&&row.label_auto==='unknown'));
 assert.equal(report.metrics.verified,0);
 assert.equal(report.metrics.precision,null);
 assert.equal(report.metrics.recall,null);
 assert.equal(report.publication.decision,'NO-GO');
 assert.equal(report.reclassified,0);
 assert.equal(report.published,0);
 assert.deepEqual(report.rows.map(row=>[row.id,row.partition]),runAudit(cases).rows.map(row=>[row.id,row.partition]));
});
test('unknown references are excluded; classifier abstention cannot inflate recall',()=>{
 const metrics=qualityMetrics([
  {verification_status:'unknown',label_auto:'not_relevant',prediction:'relevant'},
  {verification_status:'weak_evidence',label_auto:'relevant',prediction:'relevant'},
  {verification_status:'verified_evidence',label_auto:'unknown',prediction:'not_relevant'},
  {verification_status:'verified_evidence',label_auto:'relevant',prediction:'relevant'},
  {verification_status:'verified_evidence',label_auto:'relevant',prediction:'unknown'},
  {verification_status:'verified_evidence',label_auto:'not_relevant',prediction:'relevant'},
  {verification_status:'verified_evidence',label_auto:'not_relevant',prediction:'not_relevant'},
 ]);
 assert.equal(metrics.unknownEvidence,3);assert.equal(metrics.verified,4);assert.equal(metrics.abstentions,1);
 assert.equal(metrics.tp,1);assert.equal(metrics.fp,1);assert.equal(metrics.tn,1);assert.equal(metrics.fn,1);
 assert.equal(metrics.precision,.5);assert.equal(metrics.recall,.5);assert.equal(metrics.f1,.5);
});
test('all required publication gates must explicitly pass',()=>{
 const gates=Object.fromEntries(['G0','G1','G2','G3','G4'].map(key=>[key,{passed:true}]));
 assert.equal(publicationDecision(gates).decision,'GO');
 for(const key of Object.keys(gates)){
  assert.equal(publicationDecision({...gates,[key]:{passed:false}}).decision,'NO-GO');
  assert.equal(publicationDecision({...gates,[key]:{passed:'true'}}).decision,'NO-GO');
  const missing={...gates};delete missing[key];assert.equal(publicationDecision(missing).decision,'NO-GO');
 }
 assert.equal(publicationDecision({}).decision,'NO-GO');
});
test('partial source reviews remain unknown and mismatched evidence stops the audit',()=>{
 const reviews=JSON.parse(fs.readFileSync(new URL('./fixtures/iteration-27-source-reviews.json',import.meta.url)));
 const report=runAudit(cases,{sourceReviews:reviews});
 assert.equal(report.rows.filter(row=>row.verification_status==='weak_evidence').length,3);
 assert.equal(report.metrics.verified,0);assert.equal(report.metrics.precision,null);
 assert.ok(report.rows.every(row=>row.label_auto==='unknown'));
 assert.throws(()=>runAudit(cases,{sourceProbes:{input_sha256:'other'}}),/another input/);
 assert.throws(()=>runAudit(cases,{sourceProbes:{input_sha256:cases.source_sha256,results:{[cases.cases[0].id]:{input_url:'https://wrong.example/'}}}}),/URL mismatch/);
 assert.throws(()=>runAudit(cases,{sourceReviews:[{id:cases.cases[0].id,evidence_url:'https://example.com/'}]}),/Incomplete source review/);
});
test('changed instrumentation contracts stop explicitly',()=>{
 assert.throws(()=>instrumentAssessment('function renamed(){}'),/contract changed/);
 assert.throws(()=>instrumentAssessment('function digitalAssessment_(){return {};}'),/contract changed/);
});
test('CSV protects formula cells and escapes evidence and trace fields',()=>{
 const csv=auditCsv([{id:'=1+1',title:'a,"b"\nc',rule_trace:{value:false}}]);
 assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"a,""b""\nc"'));
 assert.ok(csv.includes('{""value"":false}'));
});
test('source probes bound content and never mistake aggregator or redirect for evidence',async()=>{
 const url=cases.cases.find(row=>row.url.startsWith('https://news.google.com/')).url;
 for(const input of ['http://news.google.com/','https://127.0.0.1/','https://news.google.com.evil.example/','https://a:b@news.google.com/'])assert.equal((await probeSource(input,{fetcher:()=>{throw Error('Must not fetch');}})).status,'unsupported_source_host');
 for(const input of ['https://news.google.com/rss/articles/private-file-content',url+'&secret=private-file-content','https://news.google.com/upload?data=private-file-content'])assert.equal((await probeSource(input,{fetcher:()=>{throw Error('Must not fetch');}})).status,'unapproved_source_url');
 const redirect=await probeSource(url,{fetcher:async()=>new Response('',{status:302,headers:{location:'https://127.0.0.1/private'}})});
 assert.equal(redirect.status,'redirect_requires_source_verification');assert.equal(redirect.verification_status,'unknown');
 const success=await probeSource(url,{fetcher:async(requestUrl,options)=>{assert.equal(requestUrl,url);assert.equal(options.redirect,'manual');return new Response('consent page');}});
 assert.equal(success.label_auto,'unknown');assert.equal(success.evidence_excerpt,'');assert.equal(success.status,'aggregator_not_original_evidence');
 assert.equal((await probeSource(url,{maxBytes:2,fetcher:async()=>new Response('too long')})).status,'response_limit');
 assert.equal((await probeSource(url,{fetcher:async()=>new Response('',{status:403})})).status,'http_error');
 assert.equal((await probeSource(url,{fetcher:async()=>{throw new TypeError('network unavailable');}})).status,'fetch_failed');
});
test('source checkpoint resumes without fetching completed IDs and refuses another input',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'radar-audit-'));
 try{
  const output=path.join(directory,'probe.json'),fixture={source_sha256:'frozen',cases:cases.cases.slice(0,5)};let count=0;
  const probe=async url=>{count++;return {input_url:url,status:'fetch_failed',verification_status:'unknown'};};
  await probeAudit(fixture,output,{probe});assert.equal(count,5);
  await probeAudit(fixture,output,{probe});assert.equal(count,5);
  await assert.rejects(probeAudit({...fixture,source_sha256:'other'},output,{probe}),/different audit/);
  const checkpoint=JSON.parse(fs.readFileSync(output,'utf8'));checkpoint.probe_revision=1;fs.writeFileSync(output,JSON.stringify(checkpoint));
  await assert.rejects(probeAudit(fixture,output,{probe}),/different source probe revision/);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
