import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {read,readServerScript} from './source.mjs';
import {benchmarkSource} from './benchmark-source.mjs';
import {taxonomyDefinitions,taxonomyObserve,taxonomyBuild,taxonomySeed,taxonomyText} from '../src/shared/taxonomy.js';
const config=JSON.parse(read('assets/configuration-defaults.json')),base=benchmarkSource(['--baseline=HEAD']),oldConfig=JSON.parse(execFileSync('git',['show',base.revision+':assets/configuration-defaults.json'],{encoding:'utf8'}));
const contexts=[base.source,readServerScript()].map((source,i)=>{const context=vm.createContext({});vm.runInContext(source,context);context.configuration_=()=>i?config:oldConfig;return context;});
const samples=new Map();
for(const file of ['digital-feeds','iteration3-feeds'])for(const feed of JSON.parse(read('tests/fixtures/'+file+'.json')).feeds)for(const item of feed.items)samples.set(item.url,{...item,publisher:item.source||feed.id});
for(const query of JSON.parse(read('tests/fixtures/digital-search.json')).queries)for(const item of query.items)samples.set(item.url,{...item,publisher:item.source||query.entity});
for(const item of JSON.parse(read('assets/feed-snapshot.json')))samples.set(item.url,{...item,publisher:'BBVA'});
const rows=[...samples.values()],runs=[],accepted=[];
for(let version=0;version<2;version++){
 const context=contexts[version],times=[];let selected;
 for(let run=0;run<6;run++){
  const started=performance.now();selected=rows.filter(row=>context.digitalAssessment_(context.searchText_(context.plainText_(row.title)),context.searchText_(context.plainText_(row.title+' '+row.excerpt))).relevant);
  if(run)times.push(performance.now()-started);
 }
 accepted.push(new Set(selected.map(row=>row.url)));runs.push({version:version?'3.3.0':'HEAD',accepted:selected.length,medianCpuMs:times.sort((a,b)=>a-b)[2]});
}
const definitions=taxonomyDefinitions(config.taxonomy),state={documents:0,candidates:{}},excluded=new Set(config.entities.flatMap(row=>[row.name,...row.aliases]).flatMap(value=>taxonomyText(value).split(' '))),started=performance.now();taxonomySeed(state,definitions);
for(const row of rows)if(accepted[1].has(row.url))taxonomyObserve(state,taxonomyText(contexts[1].plainText_(row.title+' '+row.excerpt)),definitions,excluded,row.publisher);
const model=taxonomyBuild(state),byName=new Map(),byCode=new Map();
for(const block of config.taxonomy)for(const row of block.functions){const key=taxonomyText(row.name);if(!byName.has(key))byName.set(key,[]);byName.get(key).push(row.id);const code=row.id.slice(0,2);if(!byCode.has(code))byCode.set(code,new Set());byCode.get(code).add(block.name);}
const result={generatedAt:new Date().toISOString(),baseline:base.revision,measurement:'Local V8, frozen source samples; excludes Google network, Apps Script quotas and RSS retrieval.',corpus:rows.length,runs,preserved:[...accepted[0]].filter(url=>accepted[1].has(url)).length,lost:[...accepted[0]].filter(url=>!accepted[1].has(url)),added:rows.filter(row=>accepted[1].has(row.url)&&!accepted[0].has(row.url)).map(row=>row.title),taxonomy:{cpuMs:performance.now()-started,documents:state.documents,candidates:Object.keys(state.candidates).length,checkpointBytes:Buffer.byteLength(JSON.stringify({documents:state.documents,candidates:state.candidates})),classified:rows.filter(row=>accepted[1].has(row.url)&&model.some(item=>item.df&&item.terms.some(term=>taxonomyText(row.title+' '+row.excerpt).includes(term)))).length,emerging:model.filter(row=>row.origin==='tf-idf').map(row=>row.subpalanca)},catalog:{blocks:config.taxonomy.length,functions:config.taxonomy.reduce((n,row)=>n+row.functions.length,0),characters:JSON.stringify(config.taxonomy).length,configurationBytes:Buffer.byteLength(JSON.stringify(config)),duplicateNames:[...byName].filter(([,ids])=>ids.length>1),sharedPrefixes:[...byCode].filter(([,names])=>names.size>1).map(([code,names])=>({code,names:[...names]})),coverage:config.taxonomy.map(block=>({name:block.name,functions:block.functions.length,withAliases:block.functions.filter(row=>row.terms.length).length,news:model.filter(row=>row.palanca===block.name).reduce((n,row)=>n+row.df,0)}))}};
fs.mkdirSync('output/functional-taxonomy',{recursive:true});fs.writeFileSync('output/functional-taxonomy/audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
