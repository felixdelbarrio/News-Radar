import {$} from '../core/dom.js';
export function createFilterPanel(){
  const dialog=$('filters-dialog'),panels={administration:$('admin-tabs'),subscriptions:$('subscriptions-sidebar'),news:$('filters-section')};
  for(const panel of Object.values(panels))$('mobile-filters').appendChild(panel);
  $('mobile-filters').appendChild($('sidebar-context'));
  $('mobile-filters').appendChild(document.querySelector('.sidebar-foot'));
  $('open-filters').addEventListener('click',()=>dialog.showModal());
  $('close-filters').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-admin-view]'))dialog.close();});
  return {show(view){
    if(dialog.open)dialog.close();const active=panels[view]||panels.news,admin=view==='administration',reading=!admin&&view!=='subscriptions';
    for(const panel of Object.values(panels))panel.hidden=panel!==active;
    $('panel-button-label').textContent=admin?'Menú':'Filtros';$('panel-dialog-title').textContent=admin?'Administración':'Filtros';dialog.setAttribute('aria-label',admin?'Herramientas de administración':'Configurar filtros');$('filter-dialog-actions').hidden=!reading;
  }};
}
