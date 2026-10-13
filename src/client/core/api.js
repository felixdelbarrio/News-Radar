import {t,setTaxonomyTranslations} from './language.js';
function receive(data){if(data?.taxonomyTranslations)setTaxonomyTranslations(data.taxonomyTranslations);return data;}
let pending=0,replacing=0;
function loading(delta,append){
  pending+=delta;if(!append)replacing+=delta;
  const indicator=document.getElementById('loading');indicator.hidden=pending===0;
  document.getElementById('loading-label').textContent=t('Cargando contenido…');
  const content=document.querySelector('.content');content.setAttribute('aria-busy',String(pending>0));content.setAttribute('data-loading',replacing?'replace':pending?'append':'');
}
function call(method, ...args) {
  const visible=!['recordEvents','getCollectionProgress'].includes(method),append=method==='getDashboard'&&args[0]?.view==='news'&&args[0]?.page>0;if(visible)loading(1,append);
  let response;
  try{response=send(method,...args);}catch(error){if(visible)loading(-1,append);throw error;}
  if(visible)response.then(()=>loading(-1,append),()=>loading(-1,append));
  return response;
}
function send(method, ...args) {
  if(window.RADAR_PREVIEW){const response=window.RADAR_PREVIEW.call(method,...args);response.then(receive,()=>{});return response;}
  return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(data=>resolve(receive(data))).withFailureHandler(error=>reject(Error(t(error.message||String(error)))))[method](...args));
}
export {call};
