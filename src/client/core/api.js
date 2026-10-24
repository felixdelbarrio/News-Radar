import {browserCountry} from './browser-country.js';
import {beginLoading} from './loading.js';
export {refreshLoading} from './loading.js';
import {t,setTaxonomyTranslations} from './language.js';
function receive(data){if(data?.taxonomyTranslations)setTaxonomyTranslations(data.taxonomyTranslations);return data;}
const requests=new Map(),dashboards=new Map();
const dashboardStorage='radar-dashboards:v22';let dashboardRevision='',prefetched=false;
const dashboardKey=query=>JSON.stringify(Object.entries(query||{}).filter(([key,value])=>value!==''&&value!=null&&!(key==='page'&&Number(value)===0)&&!(key==='initial'&&value===false)).sort(([a],[b])=>a.localeCompare(b)));
try{const saved=JSON.parse(sessionStorage.getItem(dashboardStorage)||'null');if(saved&&Date.now()-saved.at<300000){dashboardRevision=saved.revision;for(const [key,value] of saved.entries)dashboards.set(key,value);}}catch(_){}
function rememberDashboard(query,data){
 const revision=JSON.stringify([data.newsRevision,data.configurationRevision]);if(revision!==dashboardRevision){dashboards.clear();dashboardRevision=revision;}
 const value={data,at:Date.now()};dashboards.set(dashboardKey(query),value);
 const selection={...data.selection,...(query.newsGeography&&!data.selection?.newsGeography?{newsGeography:query.newsGeography}:{}),view:query.view,language:query.language,initial:false};dashboards.set(dashboardKey(selection),value);
 while(dashboards.size>12)dashboards.delete(dashboards.keys().next().value);
 try{sessionStorage.setItem(dashboardStorage,JSON.stringify({at:Date.now(),revision:dashboardRevision,entries:[...dashboards]}));}catch(_){}
}
function prefetchDashboards(query){
 if(prefetched||query.edition)return;prefetched=true;
 const idle=window.requestIdleCallback|| (callback=>setTimeout(callback,1000));
 idle(()=>{for(const view of ['briefing','news','radar'])if(view!==query.view)call('getDashboard',{view,language:query.language||'es',initial:true,...(view==='news'?{newsGeography:query.newsGeography||browserCountry()}:{})},{reuse:true}).catch(()=>{});});
}

let initialDashboard;let releaseInitialDashboard;
const secondaryMethods=new Set(['recordEvents','getCollectionProgress']);
export function deferSecondaryRequests(){if(!initialDashboard)initialDashboard=new Promise(resolve=>{releaseInitialDashboard=resolve;});}
export function releaseSecondaryRequests(){if(releaseInitialDashboard){releaseInitialDashboard();initialDashboard=null;releaseInitialDashboard=null;}}
function call(method, ...args) {
  if(initialDashboard&&secondaryMethods.has(method))return initialDashboard.then(()=>call(method,...args));
  const key=method==='getDashboard'?'getDashboard:'+dashboardKey(args[0]):method.startsWith('get')?JSON.stringify([method,...args]):null;
  if(key&&requests.has(key))return method==='getDashboard'?requests.get(key).then(data=>({...data,performance:{...data.performance,sharedRequest:true}})):requests.get(key);
  const dashboard=method==='getDashboard'&&['briefing','news','radar'].includes(args[0]?.view)&&!args[0]?.edition;
  const cached=dashboard&&args[1]?.reuse&&dashboards.get(dashboardKey(args[0]));
  if(cached){
    if(Date.now()-cached.at>=60000){const refresh=send(method,args[0]).then(data=>{rememberDashboard(args[0],data);return data;});requests.set(key,refresh);refresh.then(()=>requests.delete(key),()=>requests.delete(key));}
    return Promise.resolve(receive({...cached.data,performance:{...cached.data.performance,clientCacheHit:true,serverMs:0,transportMs:0}}));
  }
  const finishLoading=beginLoading(method,args);
  let response;const started=performance.now();
  try{response=send(method,...(method==='getDashboard'?args.slice(0,1):args));if(method==='getDashboard')response=response.then(data=>({...data,performance:{...data.performance,transportMs:Math.round(performance.now()-started)}}));}catch(error){finishLoading();throw error;}
  if(dashboard)response=response.then(data=>{rememberDashboard(args[0],data);prefetchDashboards(args[0]);return data;});
  if(key)requests.set(key,response);
  if(!method.startsWith('get')&&method!=='recordEvents'){dashboards.clear();try{sessionStorage.removeItem(dashboardStorage);}catch(_){}}
  const complete=()=>{if(key)requests.delete(key);finishLoading();};
  response.then(complete,complete);
  return response;
}
function send(method, ...args) {
  if(window.RADAR_PREVIEW){const response=window.RADAR_PREVIEW.call(method,...args);response.then(receive,()=>{});return response;}
  return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(data=>resolve(receive(data))).withFailureHandler(error=>reject(Error(t(error.message||String(error)))))[method](...args));
}
export {call};
