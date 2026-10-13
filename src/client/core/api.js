import {t,setTaxonomyTranslations} from './language.js';
function receive(data){if(data?.taxonomyTranslations)setTaxonomyTranslations(data.taxonomyTranslations);return data;}
let pending=0;
function loading(delta){
  pending+=delta;
  const indicator=document.getElementById('loading');indicator.hidden=pending===0;
  document.getElementById('loading-label').textContent=t('Cargando contenido…');
  document.querySelector('.content').setAttribute('aria-busy',String(pending>0));
}
function call(method, ...args) {
  const visible=!['recordEvents','getCollectionProgress'].includes(method);if(visible)loading(1);
  let response;
  try{response=send(method,...args);}catch(error){if(visible)loading(-1);throw error;}
  if(visible)response.then(()=>loading(-1),()=>loading(-1));
  return response;
}
function send(method, ...args) {
  if(window.RADAR_PREVIEW){const response=window.RADAR_PREVIEW.call(method,...args);response.then(receive,()=>{});return response;}
  return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(data=>resolve(receive(data))).withFailureHandler(error=>reject(Error(t(error.message||String(error)))))[method](...args));
}
export {call};
