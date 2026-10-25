import {identityMark} from '../../shared/visual-identity.js';
import {browserCountry} from '../core/browser-country.js';
import {geographyLabel,REGION_CODES,countryRegion,otherGeography} from '../../shared/selection-policy.js';
import {$,escape} from '../core/dom.js';
import {t} from '../core/language.js';
export function createGeographyTabs(id,panelId,onSelect){
  const tabs=$(id),panel=$(panelId);let rows=[],regions=[],active='',focus=false;
  function select(name){if(name===otherGeography&&regions.some(row=>row.total))name=countryRegion(browserCountry())||regions.find(row=>row.total)?.name||REGION_CODES[0];if(name===active){tabs.querySelector('[tabindex="0"]').focus();return;}focus=true;onSelect(name);}
  tabs.addEventListener('click',event=>{const button=event.target.closest('[data-geography]');if(button)select(button.dataset.geography);});
  tabs.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.closest('[role="tab"]'))return;
    event.preventDefault();const index=rows.findIndex(row=>row.name===active),next=event.key==='Home'?0:event.key==='End'?rows.length-1:(index+(event.key==='ArrowRight'?1:-1)+rows.length)%rows.length;
    tabs.querySelectorAll('[role="tab"]')[next].focus();select(rows[next].name);
  });
  return {render(geographies,selected,regionalRows=[]){regions=regionalRows;const regional=selected===otherGeography||REGION_CODES.includes(selected);rows=[...geographies,...(regional?regions:[])];active=selected;tabs.hidden=!rows.length;
    tabs.innerHTML=rows.map((row,index)=>`<button type="button" class="button" role="tab" id="${id}-${index}" aria-controls="${panelId}" aria-selected="${row.name===active||row.name===otherGeography&&REGION_CODES.includes(active)}" tabindex="${row.name===active?0:-1}" data-geography="${escape(row.name)}">${REGION_CODES.includes(row.name)?regionMark(row.name):identityMark('countries',row.name,escape)}${escape(t(geographyLabel(row.name)))}<span class="geography-count">${row.total}</span></button>`).join('');
    const index=rows.findIndex(row=>row.name===active);if(index>=0)panel.setAttribute('aria-labelledby',id+'-'+index);else panel.removeAttribute('aria-labelledby');if(focus){tabs.querySelector('[tabindex="0"]')?.focus();focus=false;}
  }};
}

function regionMark(name){
 const path=['M13 5l5 3-2 4 3 3-2 4-4-2-1-5-3-2z','M10 4l5 3-2 4 3 2-4 7-3-4 1-5-4-2z','M5 5l5-1 2 4-4 4 3 3-1 5-3-4 1-4-4-3z'][REGION_CODES.indexOf(name)];
 return `<svg class="geography-flag region-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/><path d="${path}" fill="currentColor"/></svg>`;
}
