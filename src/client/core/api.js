import {t,setTaxonomyTranslations} from './language.js';
function receive(data){if(data?.taxonomyTranslations)setTaxonomyTranslations(data.taxonomyTranslations);return data;}
function call(method, ...args) {
  if(window.RADAR_PREVIEW){const response=window.RADAR_PREVIEW.call(method,...args);response.then(receive,()=>{});return response;}
  return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(data=>resolve(receive(data))).withFailureHandler(error=>reject(Error(t(error.message||String(error)))))[method](...args));
}
export {call};
