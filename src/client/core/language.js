import {detectLanguage,languageNames,translateText,formatText} from '../../shared/locales.js';
const storageKey='news-radar-language';
function browserLanguage(){return detectLanguage(typeof navigator==='undefined'?[]:navigator.languages||[navigator.language]);}
let override;try{override=globalThis.sessionStorage?.getItem(storageKey);}catch{}
export let language=Object.hasOwn(languageNames,override)?override:browserLanguage();
export function getLanguageOverride(){return Object.hasOwn(languageNames,override)?override:'';}
let taxonomyNames={};
export function setTaxonomyTranslations(value){
  if(JSON.stringify(value)===JSON.stringify(taxonomyNames))return;
  taxonomyNames=value;window.dispatchEvent(new Event('news-radar-taxonomy-translations'));
}
export function t(value,values){
  if(values)return formatText(value,values,language);
  const names=taxonomyNames[language],translated=language==='es'?value:names&&Object.hasOwn(names,value)?names[value]:translateText(value,language);
  return String(translated).replace(/(^| › )\d{2}\.(?:\d{2}\.|xx\s+)?\s*/g,'$1');
}
export function setLanguage(value){
  if(value&&!Object.hasOwn(languageNames,value))throw Error(t('Idioma no admitido.'));
  try{if(value)sessionStorage.setItem(storageKey,value);else sessionStorage.removeItem(storageKey);}catch{throw Error(t('El navegador no permite guardar el idioma de esta pestaña.'));}
  override=value;const next=value||browserLanguage();if(next===language)return;
  language=next;window.dispatchEvent(new Event('news-radar-language-change'));
}
