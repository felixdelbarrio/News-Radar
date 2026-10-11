import {detectLanguage,languageNames,translateText,formatText} from '../../shared/locales.js';
const storageKey='news-radar-language';
function browserLanguage(){return detectLanguage(typeof navigator==='undefined'?[]:navigator.languages||[navigator.language]);}
let override;try{override=globalThis.sessionStorage?.getItem(storageKey);}catch{}
export const language=Object.hasOwn(languageNames,override)?override:browserLanguage();
export const t=(value,values)=>values?formatText(value,values,language):translateText(value,language);
export function setLanguage(value){
  if(value&&!Object.hasOwn(languageNames,value))throw Error(t('Idioma no admitido.'));
  try{if(value)sessionStorage.setItem(storageKey,value);else sessionStorage.removeItem(storageKey);}catch{throw Error(t('El navegador no permite guardar el idioma de esta pestaña.'));}
  window.location.reload();
}
