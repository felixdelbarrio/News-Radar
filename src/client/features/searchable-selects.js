import {t} from '../core/language.js';
export const normalizeOption=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
// Keep the native select as the form control: keyboard navigation and validation
// continue to work, and all existing change handlers receive the same element.
export function initializeSearchableSelects(){
  const controls=new Map();
  function scan(){
    observer.disconnect();
    for(const select of document.querySelectorAll('select')){
      if(!controls.has(select)&&select.options.length>6){
        const details=document.createElement('details'),summary=document.createElement('summary'),search=document.createElement('input'),empty=document.createElement('p');
        details.className='searchable-select';summary.setAttribute('aria-label',select.labels?.[0]?.firstChild?.textContent.trim()||t('Buscar opciones'));search.type='search';search.placeholder=t('Buscar opciones');search.setAttribute('aria-label',t('Buscar opciones'));empty.textContent=t('Sin coincidencias');empty.className='small muted';empty.hidden=true;
        select.before(details);details.append(summary,search,select,empty);select.size=6;
        const control={details,summary,search,empty};controls.set(select,control);
        search.addEventListener('input',event=>{
          event.stopPropagation();
          const query=normalizeOption(search.value);let matches=0;
          for(const option of select.options){option.hidden=Boolean(option.value&&!normalizeOption(option.textContent).includes(query));if(option.value&&!option.hidden)matches++;}
          empty.hidden=matches>0;
        });
        search.addEventListener('change',event=>event.stopPropagation());
        search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();select.focus();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();details.open=false;summary.focus();}});
        select.addEventListener('change',()=>{summary.textContent=select.selectedOptions[0]?.textContent||t('Todos');details.open=false;summary.focus();});
        details.addEventListener('toggle',()=>{
          if(details.open){search.focus();}
          else{for(const option of select.options)option.hidden=false;search.value='';empty.hidden=true;}
        });
      }
      const control=controls.get(select);
      if(control){const label=select.selectedOptions[0]?.textContent||t('Todos');if(control.summary.textContent!==label)control.summary.textContent=label;}
    }
    observe();
  }
  function observe(){observer.observe(document.body,{subtree:true,childList:true});}
  const observer=new MutationObserver(scan);scan();
}
