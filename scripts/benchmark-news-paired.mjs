import {benchmarkNews} from './benchmark-news.mjs';
import {benchmarkSource} from './benchmark-source.mjs';
const baseline=benchmarkSource(['--baseline=HEAD']);
// Alternate execution order; keep browser interactions and other test processes idle.
for(let sample=1;sample<=4;sample++)for(const version of sample%2?['baseline','current']:['current','baseline']){
 globalThis.gc?.();
 console.log(JSON.stringify({version,baseline:baseline.revision,count:50000,sample,runs:benchmarkNews(50000,sample,version==='baseline'?baseline.source:undefined)}));
}
