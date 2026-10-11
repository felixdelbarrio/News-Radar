import {language,t,setLanguage} from './language.js';
import {languageNames} from '../../shared/locales.js';
let observer,translateChanges;
export function flushLocalization(){if(observer)translateChanges(observer.takeRecords());}
const attributes=['placeholder','title','aria-label','alt'],excluded='[data-original],script,style,textarea';
export function localize(root){
  if(root.nodeType===3){if(!root.parentElement?.closest(excluded))root.textContent=t(root.textContent);return;}
  if(root.nodeType!==1||root.matches(excluded))return;
  if(root.tagName==='OPTION'&&!root.hasAttribute('value'))root.setAttribute('value',root.value);
  for(const key of attributes)if(root.hasAttribute(key)){const value=root.getAttribute(key),translated=t(value);if(value!==translated)root.setAttribute(key,translated);}
  for(const node of root.childNodes)localize(node);
}
export function initializeLocalization(){
  document.documentElement.lang=language;document.title=t(document.title);
  const select=document.getElementById('preview-language');
  select.innerHTML='<option value="">'+t('Idioma del navegador')+'</option>'+Object.entries(languageNames).map(([code,name])=>'<option value="'+code+'">'+name+'</option>').join('');
  try{select.value=sessionStorage.getItem('news-radar-language')||'';}catch{}
  select.addEventListener('change',()=>setLanguage(select.value));
  const invalid=new WeakSet();
  document.addEventListener('invalid',event=>{const input=event.target;if(!input.validity.customError){input.setCustomValidity(t(input.validity.valueMissing?'Campo obligatorio.':'Introduce un valor válido.'));invalid.add(input);}},true);
  document.addEventListener('input',event=>{const input=event.target;if(invalid.has(input)){input.setCustomValidity('');invalid.delete(input);}},true);
  localize(document.body);if(language==='es')return;
  const options={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes};
  translateChanges=records=>{
    observer.disconnect();
    const roots=new Set();for(const record of records){if(record.type==='childList')for(const node of record.addedNodes)roots.add(node);else roots.add(record.target);}
    // Skip detached nodes and descendants already covered by an ancestor in this batch.
    for(const node of roots){
      if(!node.isConnected||node.parentElement?.closest(excluded))continue;
      let parent=node.parentNode;while(parent&&!roots.has(parent))parent=parent.parentNode;
      if(!parent)localize(node);
    }
    observer.observe(document.body,options);
  };
  observer=new MutationObserver(translateChanges);
  observer.observe(document.body,options);
}
