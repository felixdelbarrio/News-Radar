import {beginLoading} from './loading.js';
export {refreshLoading} from './loading.js';
import {t,setTaxonomyTranslations} from './language.js';
function receive(data){if(data?.taxonomyTranslations)setTaxonomyTranslations(data.taxonomyTranslations);return data;}
const requests=new Map();
function call(method, ...args) {
  const key=method.startsWith('get')?JSON.stringify([method,...args]):null;
  if(key&&requests.has(key))return requests.get(key);
  const finishLoading=beginLoading(method,args);
  let response;
  try{response=send(method,...args);}catch(error){finishLoading();throw error;}
  if(key)requests.set(key,response);
  const complete=()=>{if(key)requests.delete(key);finishLoading();};
  response.then(complete,complete);
  return response;
}
function send(method, ...args) {
  if(window.RADAR_PREVIEW){const response=window.RADAR_PREVIEW.call(method,...args);response.then(receive,()=>{});return response;}
  return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(data=>resolve(receive(data))).withFailureHandler(error=>reject(Error(t(error.message||String(error)))))[method](...args));
}
export {call};
