import vm from 'node:vm';
import {read,readServerScript} from './source.mjs';
const config=JSON.parse(read('assets/configuration-defaults.json')),historical=JSON.parse(read('tests/fixtures/iteration1-configuration.json'));
const search=JSON.parse(read('tests/fixtures/digital-search.json')),sources=JSON.parse(read('tests/fixtures/digital-feeds.json'));
function context(before=false){
 const c=vm.createContext({});let source=readServerScript();
 if(before)source=source.replace(read('src/server/news/Rules.gs'),read('tests/fixtures/iteration1-rules.txt')).replace(read('src/server/sources/Sources.gs'),read('tests/fixtures/iteration1-sources.txt'));
 vm.runInContext(source,c);c.configuration_=()=>before?{...config,...historical,settings:{...config.settings,...historical.settings}}:config;return c;
}
export function compareCollection(){
 const old=context(true),current=context(),now=new Date(search.now),metrics={before:{queries:0,retrieved:0,outside:0,useful:0},after:{queries:0,retrieved:0,outside:0,useful:0}},articles={before:new Map(),after:new Map()};
 for(const sample of search.queries){
  const metric=metrics[sample.strategy],evaluator=sample.strategy==='before'?old:current,entity=config.entities.find(row=>row.name===sample.entity),feed={...evaluator.profileFeed_(config.geographies[0],entity,sample.range,sample.capabilities),range:sample.range};
  metric.queries++;metric.retrieved+=sample.items.length;
  for(const raw of sample.items){
   const result=evaluator.evaluate_(raw,feed,now);if(result.reason?.startsWith('Fuera del período'))metric.outside++;
   // Misma definición de utilidad para ambas muestras; no cuenta simple coincidencia temática.
   if(result.item&&current.digitalAssessment_(current.searchText_(result.item.title),current.searchText_(result.item.title+' '+result.item.excerpt)).score>0)articles[sample.strategy].set(result.item.url,result.item.title);
  }
 }
 const precision={};for(const [strategy,evaluator] of [['before',old],['after',current]]){
  let accepted=0,useful=0,expected=0;for(const sample of sources.feeds){const feed={...config.feeds.find(row=>row.id===sample.id),kind:'rss',range:sources.range};for(const raw of sample.items){if(raw.useful)expected++;const result=evaluator.evaluate_(raw,feed,now);if(result.item&&(strategy==='before'||result.relevant)){accepted++;if(raw.useful)useful++;}}}
  precision[strategy]={accepted,useful,precision:useful/accepted,recall:useful/expected};
 }
 const contribution=[];for(const sample of sources.feeds){
  const feed={...config.feeds.find(row=>row.id===sample.id),kind:'rss',range:search.queries[0].range};let added=0;
  for(const raw of sample.items){const result=current.evaluate_(raw,feed,now);if(result.item&&result.relevant&&!articles.after.has(result.item.url)){articles.after.set(result.item.url,result.item.title);added++;}}
  contribution.push({source:sample.id,added});
 }
 for(const strategy of ['before','after'])metrics[strategy].useful=articles[strategy].size;
 const profiles=current.feeds_().filter(feed=>feed.kind==='profile').length,annual=current.collectionRange_('year',now),daily=current.collectionRecentRange_(now),oldWindows=range=>Math.ceil((Date.parse(range.to)-Date.parse(range.from)+86400000)/(7*86400000));
 const plans={annual:{before:oldWindows(annual)*profiles+config.feeds.filter(feed=>!feed.id.startsWith('finextra-')).length,after:current.collectionFeeds_(annual).length},daily:{before:oldWindows(daily)*profiles+config.feeds.filter(feed=>!feed.id.startsWith('finextra-')).length,after:current.collectionFeeds_(daily).length}};
 return {sampleDate:search.now,metrics,precision,contribution,plans,articles:Object.fromEntries(Object.entries(articles).map(([key,value])=>[key,[...value.values()]])),limitations:'Muestra observacional congelada, consultas no simultáneas y dos RSS adicionales. Utilidad determinista en búsquedas; precisión sobre siete entradas RSS etiquetadas manualmente en otra ventana (septiembre-octubre). No extrapolable a producción. Los planes excluyen subdivisiones y reintentos.'};
}
if(process.argv[1]?.endsWith('/compare-collection.mjs'))console.log(JSON.stringify(compareCollection(),null,2));
