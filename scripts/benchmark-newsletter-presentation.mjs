import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {presentationServer,presentationContent,presentationCases,presentationContract} from '../tests/helpers/newsletter-presentation.mjs';
const target=process.argv[2]||'tmp/iteration33/post';fs.mkdirSync(target,{recursive:true});
const s=presentationServer(),c=s.c,report={samples:30,runtime:process.version,scope:'Local VM; Gmail and Sheets simulated. No live send or remote latency measured.',cases:{}};
c.Utilities.base64EncodeWebSafe=value=>Buffer.from(value).toString('base64url');
const percentile=(values,p)=>values.slice().sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
for(const {name,query} of presentationCases){
 const times=[],inline=[],original=c.newsletterInline_;let content;
 c.newsletterInline_=(...args)=>{const start=performance.now(),result=original(...args);inline.push(performance.now()-start);return result;};
 for(let i=0;i<5;i++)presentationContent(c,query);inline.length=0;
 const reads=s.reads,heap=process.memoryUsage().heapUsed;
 for(let i=0;i<report.samples;i++){const start=performance.now();content=presentationContent(c,query);times.push(performance.now()-start);}
 c.newsletterInline_=original;let mime='';c.gmailRequest_=(_path,payload)=>{mime=Buffer.from(payload.raw,'base64url').toString();return {id:'simulated'};};
 c.sendNewsletterMail_({name:'News Radar',address:'news-radar.group@bbva.com'},'owner@bbva.com',content);
 const html=content.html.replace(/cid:([^" ]+)/g,(_match,id)=>'data:image/png;base64,'+content.images.find(image=>image.id===id).data);
 fs.writeFileSync(path.join(target,name+'.html'),html);
 fs.writeFileSync(path.join(target,name+'.contract.json'),JSON.stringify(presentationContract(content),null,2)+'\n');
 report.cases[name]={totalMs:{p50:percentile(times,.5),p95:percentile(times,.95)},inlineMs:{p50:percentile(inline,.5),p95:percentile(inline,.95)},htmlBytes:Buffer.byteLength(content.html),mimeBytes:Buffer.byteLength(mime),cidCount:content.images.length,cidBytes:content.images.reduce((sum,image)=>sum+Buffer.from(image.data,'base64').length,0),simulatedSheetReads:s.reads-reads,heapDeltaBytes:process.memoryUsage().heapUsed-heap};
}
fs.writeFileSync(path.join(target,'measurements.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
