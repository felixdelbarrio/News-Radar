import {t} from '../core/language.js';
export const normalizeOption=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function initializeSearchableSelects(){
  const controls=new WeakMap();
  function update(select){
    if(!controls.has(select)&&select.options.length>6){
      const details=document.createElement('details'),summary=document.createElement('summary'),search=document.createElement('input'),empty=document.createElement('p');
      details.className='searchable-select';summary.setAttribute('aria-label',select.labels?.[0]?.firstChild?.textContent.trim()||t('Buscar opciones'));search.type='search';search.placeholder=t('Buscar opciones');search.setAttribute('aria-label',t('Buscar opciones'));empty.textContent=t('Sin coincidencias');empty.className='small muted';empty.hidden=true;
      select.before(details);details.append(summary,search,select,empty);select.size=6;
      controls.set(select,{summary});
      search.addEventListener('input',event=>{
        event.stopPropagation();const query=normalizeOption(search.value);let matches=0;
        for(const option of select.options){option.hidden=Boolean(option.value&&!normalizeOption(option.textContent).includes(query));if(option.value&&!option.hidden)matches++;}
        empty.hidden=matches>0;
      });
      search.addEventListener('change',event=>event.stopPropagation());
      search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();select.focus();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();details.open=false;summary.focus();}});
      select.addEventListener('change',()=>{summary.textContent=select.selectedOptions[0]?.textContent||t('Todos');details.open=false;summary.focus();});
      details.addEventListener('toggle',()=>{
        if(details.open)search.focus();
        else{for(const option of select.options)option.hidden=false;search.value='';empty.hidden=true;}
      });
    }
    const control=controls.get(select);
    if(control){const label=select.selectedOptions[0]?.textContent||t('Todos');if(control.summary.textContent!==label)control.summary.textContent=label;}
  }
  // Inspect changed form controls only; unrelated charts, cards and status text do not rescan all selects.
  const observer=new MutationObserver(records=>{
    const changed=new Set();
    for(const record of records){
      const parent=record.target.nodeType===1?record.target.closest('select'):null;if(parent)changed.add(parent);
      for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches('select'))changed.add(node);for(const select of node.querySelectorAll('select'))changed.add(select);}
    }
    for(const select of changed)if(select.isConnected)update(select);
  });
  for(const select of document.querySelectorAll('select'))update(select);
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('pointerdown',event=>{for(const details of document.querySelectorAll('.searchable-select[open]'))if(!details.contains(event.target))details.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const details=event.target.closest('.searchable-select[open]');if(details){event.preventDefault();event.stopPropagation();details.open=false;details.querySelector('summary').focus();}}});
  document.addEventListener('toggle',event=>{const summary=event.target.matches?.('details')?event.target.querySelector(':scope > summary[data-expanded]'):null;if(summary)summary.textContent=t(summary.dataset[event.target.open?'expanded':'collapsed']);},true);
}
