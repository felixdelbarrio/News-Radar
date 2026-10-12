import {$} from '../core/dom.js';
export function createFilterPanel(){
  const dialog=$('filters-dialog'),mobile=window.matchMedia('(max-width:767px)'),panels={administration:$('admin-tabs'),subscriptions:$('subscriptions-sidebar'),news:$('filters-section')};
  function place(){if(dialog.open)dialog.close();const target=$(mobile.matches?'mobile-filters':'desktop-filters');for(const panel of Object.values(panels))target.appendChild(panel);}
  $('open-filters').addEventListener('click',()=>dialog.showModal());
  for(const id of ['close-filters','apply-filters'])$(id).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-admin-view]'))dialog.close();});
  mobile.addEventListener('change',place);place();
  return {show(view){
    if(dialog.open)dialog.close();const active=panels[view]||panels.news,admin=view==='administration';
    for(const panel of Object.values(panels))panel.hidden=panel!==active;
    $('panel-button-label').textContent=admin?'Menú':'Filtros';$('panel-dialog-title').textContent=admin?'Administración':'Filtros';$('filters-dialog').setAttribute('aria-label',admin?'Herramientas de administración':'Configurar filtros');$('apply-filters').textContent=admin?'Cerrar':'Ver resultados';
  }};
}
