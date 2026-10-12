import {identityMark} from '../../shared/visual-identity.js';
import {geographyLabel} from '../../shared/selection-policy.js';
import {$,escape} from '../core/dom.js';
import {t} from '../core/language.js';
export function createGeographyTabs(id,panelId,onSelect){
  const tabs=$(id),panel=$(panelId);let rows=[],active='',focus=false;
  function select(name){if(name===active){tabs.querySelector('[aria-selected="true"]').focus();return;}focus=true;onSelect(name);}
  tabs.addEventListener('click',event=>{const button=event.target.closest('[data-geography]');if(button)select(button.dataset.geography);});
  tabs.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.closest('[role="tab"]'))return;
    event.preventDefault();const index=rows.findIndex(row=>row.name===active),next=event.key==='Home'?0:event.key==='End'?rows.length-1:(index+(event.key==='ArrowRight'?1:-1)+rows.length)%rows.length;
    tabs.querySelectorAll('[role="tab"]')[next].focus();select(rows[next].name);
  });
  return {render(geographies,selected){rows=geographies;active=selected;tabs.hidden=!rows.length;
    tabs.innerHTML=rows.map((row,index)=>`<button type="button" class="button" role="tab" id="${id}-${index}" aria-controls="${panelId}" aria-selected="${row.name===active}" tabindex="${row.name===active?0:-1}" data-geography="${escape(row.name)}">${identityMark('countries',row.name,escape)}${escape(t(geographyLabel(row.name)))}<span class="geography-count">${row.total}</span></button>`).join('');
    const index=rows.findIndex(row=>row.name===active);if(index>=0)panel.setAttribute('aria-labelledby',id+'-'+index);else panel.removeAttribute('aria-labelledby');if(focus){tabs.querySelector('[aria-selected="true"]')?.focus();focus=false;}
  }};
}
