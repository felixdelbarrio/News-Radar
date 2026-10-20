import {$} from '../core/dom.js';
export function createFilterPanel(){
  const dialog=$('filters-dialog'),panels={administration:$('admin-tabs'),news:$('filters-section')};
  for(const panel of Object.values(panels))$('mobile-filters').appendChild(panel);
  $('mobile-filters').appendChild($('sidebar-context'));
  $('mobile-filters').appendChild(document.querySelector('.sidebar-foot'));
  const media=window.matchMedia('(max-width:767px)');
  function administrationLayout(){
    const tabs=panels.administration,admin=!$('administration-section').hidden;
    (media.matches?$('mobile-filters'):$('administration-tools')).appendChild(tabs);
    tabs.setAttribute('aria-orientation',media.matches?'vertical':'horizontal');
    if(admin)document.querySelector('.selection-toolbar').hidden=!media.matches;
    if(dialog.open&&!media.matches&&admin)dialog.close();
  }
  media.addEventListener('change',administrationLayout);
  $('open-filters').addEventListener('click',()=>dialog.showModal());
  $('close-filters').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('[data-admin-view]'))dialog.close();});
  return {show(view){
    if(dialog.open)dialog.close();
    const toolbar=document.querySelector('.selection-toolbar'),freshness=$('selection-freshness'),host=document.querySelector('#'+view+'-section .reading-hero');
    $('open-filters').hidden=view==='briefing';
    toolbar.hidden=view==='subscriptions'||view==='administration'&&!media.matches;
    if(view==='administration')$('administration-tools').appendChild(toolbar);else if(host){host.appendChild(freshness);host.appendChild(toolbar);}else{const content=document.querySelector('.content');content.prepend(toolbar);toolbar.after(freshness);}
    const active=panels[view]||panels.news,admin=view==='administration',reading=!admin&&view!=='subscriptions';
    for(const panel of Object.values(panels))panel.hidden=view==='subscriptions'||panel!==active;
    $('panel-button-label').textContent=admin?'Menú':'Filtros';$('panel-dialog-title').textContent=admin?'Administración':'Filtros';dialog.setAttribute('aria-label',admin?'Herramientas de administración':'Configurar filtros');$('filter-dialog-actions').hidden=!reading;administrationLayout();
  }};
}
