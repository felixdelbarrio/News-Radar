import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {benchmarkNews} from './benchmark-news.mjs';
const baseline=process.argv.find(value=>value.startsWith('--baseline='))?.split('=')[1]||'dda3660fa5cb1c5bcbcb43a0e8d8cc7d940bc91b';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20e6});
const source=git('ls-tree','-r','--name-only',baseline,'dist').trim().split('\n').filter(file=>file.endsWith('.gs')).map(file=>git('show',baseline+':'+file)).join('\n');
const results=[];
for(const count of [858,8580,85800])for(let repetition=1;repetition<=3;repetition++)for(const [revision,code] of [[baseline,source],['working-tree',undefined]]){
 const result={revision,count,repetition,runs:benchmarkNews(count,repetition,code)};results.push(result);process.stdout.write(JSON.stringify(result)+'\n');
}
fs.mkdirSync('output/iteration-19',{recursive:true});fs.writeFileSync('output/iteration-19/local-benchmarks.json',JSON.stringify({environment:'Local V8 and in-memory Sheets; not Apps Script latency',baseline,results},null,2));
