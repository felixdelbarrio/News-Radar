import {t} from '../core/language.js';
export const normalizeOption=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function initializeSearchableSelects(){
  const controls=new WeakMap();let sequence=0;
  function update(select){
    if(!controls.has(select)){
      const details=document.createElement('details'),summary=document.createElement('summary'),search=document.createElement('input'),list=document.createElement('div'),empty=document.createElement('p');
      const label=select.labels?.[0]?.firstChild?.textContent.trim()||t('Buscar opciones');
      details.className='searchable-select';summary.setAttribute('aria-label',label);summary.setAttribute('aria-haspopup','listbox');list.id='select-options-'+(++sequence);list.setAttribute('role','listbox');list.setAttribute('aria-label',label);summary.setAttribute('aria-controls',list.id);list.className='select-options';search.type='search';search.placeholder=t('Buscar opciones');search.setAttribute('aria-label',t('Buscar opciones'));search.setAttribute('role','combobox');search.setAttribute('aria-controls',list.id);search.setAttribute('aria-autocomplete','list');empty.textContent=t('Sin coincidencias');empty.className='small muted';empty.hidden=true;
      select.before(details);details.append(summary,search,list,select,empty);select.hidden=true;
      let active=null;
      const highlight=option=>{active?.classList.remove('is-focused');active=option;if(active){active.classList.add('is-focused');search.setAttribute('aria-activedescendant',active.id);}else search.removeAttribute('aria-activedescendant');};
      const options=()=>[...list.children].filter(option=>!option.hidden&&!option.disabled);
      const filter=()=>{const query=normalizeOption(search.value);for(const option of list.children)option.hidden=Boolean(query&&!normalizeOption(option.textContent).includes(query));const visible=options();empty.hidden=visible.length>0;highlight(visible.find(option=>option.getAttribute('aria-selected')==='true')||visible[0]);};
      const close=()=>{details.open=false;summary.focus();};
      list.addEventListener('click',event=>{const option=event.target.closest('[role="option"]');if(!option)return;select.value=select.options[Number(option.dataset.index)].value;select.dispatchEvent(new Event('change',{bubbles:true}));close();});
      list.addEventListener('pointerover',event=>{const option=event.target.closest('[role="option"]');if(option)highlight(option);});
      search.addEventListener('input',event=>{event.stopPropagation();filter();});search.addEventListener('change',event=>event.stopPropagation());
      details.addEventListener('keydown',event=>{
        if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
          if(!details.open){details.open=true;filter();}event.preventDefault();const visible=options(),index=visible.indexOf(active),next=event.key==='Home'?0:event.key==='End'?visible.length-1:(index+(event.key==='ArrowUp'?-1:1)+visible.length)%visible.length;highlight(visible[next]);active?.scrollIntoView?.({block:'nearest'});
        }else if(event.key==='Enter'&&details.open&&event.target!==summary){event.preventDefault();active?.click();}
        else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      });
      select.addEventListener('change',()=>{controls.get(select).render();close();});
      details.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(details.open));search.setAttribute('aria-expanded',String(details.open));if(details.open){search.value='';filter();(search.hidden?list:search).focus();}else{search.value='';highlight(null);}});
      list.tabIndex=-1;
      let signature='',selected=-1;
      const render=()=>{const next=JSON.stringify([...select.options].map(option=>[option.value,option.textContent,option.disabled]));if(next===signature&&selected===select.selectedIndex)return;signature=next;selected=select.selectedIndex;summary.textContent=select.selectedOptions[0]?.textContent||t('Todos');search.hidden=select.options.length<=6;list.replaceChildren(...[...select.options].map((option,index)=>{const button=document.createElement('button');button.type='button';button.id=list.id+'-'+index;button.dataset.index=String(index);button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.tabIndex=-1;button.disabled=option.disabled;button.textContent=option.textContent;return button;}));filter();};
      controls.set(select,{render});
    }
    controls.get(select).render();
  }
  const observer=new MutationObserver(records=>{
    const changed=new Set();for(const record of records){const parent=record.target.nodeType===1?record.target.closest('select'):null;if(parent)changed.add(parent);for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches('select'))changed.add(node);for(const select of node.querySelectorAll('select'))changed.add(select);}}
    for(const select of changed)if(select.isConnected)update(select);
  });
  for(const select of document.querySelectorAll('select'))update(select);
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('pointerdown',event=>{for(const details of document.querySelectorAll('.searchable-select[open]'))if(!details.contains(event.target))details.open=false;});
  document.addEventListener('toggle',event=>{const summary=event.target.matches?.('details')?event.target.querySelector(':scope > summary[data-expanded]'):null;if(summary)summary.textContent=t(summary.dataset[event.target.open?'expanded':'collapsed']);},true);
  return ()=>{for(const select of document.querySelectorAll('select'))controls.get(select)?.render();};
}
