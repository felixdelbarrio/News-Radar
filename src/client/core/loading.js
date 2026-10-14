import {t} from './language.js';
const activity=new Map(),loaded=new WeakSet();
function activePanel(){
  return document.querySelector('#administration-section:not([hidden]) .admin-content>section:not([hidden])')||document.querySelector('.content>section:not([hidden])');
}
export function refreshLoading(){
  const panel=activePanel(),state=activity.get(panel),mode=state?.replace?'replace':state?.append?'append':state?.pending?'refresh':'';
  const indicator=document.getElementById('loading'),skeleton=document.getElementById('loading-skeleton');
  indicator.hidden=!state?.pending;skeleton.hidden=mode!=='replace';
  document.getElementById('loading-label').textContent=t('Cargando contenido…');
  const content=document.querySelector('.content');content.setAttribute('aria-busy',String(Boolean(state?.pending)));content.setAttribute('data-loading',mode);
  if(panel&&(indicator.parentElement!==panel||indicator.dataset.mode!==mode)){
    panel.prepend(skeleton);if(mode==='append')panel.appendChild(indicator);else panel.prepend(indicator);indicator.dataset.mode=mode;
  }
}
export function beginLoading(method,args){
  if(['recordEvents','getCollectionProgress'].includes(method))return ()=>{};
  const panel=method==='getDashboard'?document.getElementById(args[0].view+'-section'):activePanel();
  if(!panel)return ()=>{};
  const append=method==='getDashboard'&&args[0]?.view==='news'&&args[0]?.page>0;
  const replace=!append&&(method==='getDashboard'||method.startsWith('get')&&!loaded.has(panel));
  const state=activity.get(panel)||{pending:0,append:0,replace:0};activity.set(panel,state);
  function update(delta){
    state.pending+=delta;if(append)state.append+=delta;if(replace)state.replace+=delta;
    panel.setAttribute('data-loading',state.replace?'replace':state.append?'append':state.pending?'refresh':'');panel.setAttribute('aria-busy',String(state.pending>0));refreshLoading();
  }
  update(1);let finished=false;
  return ()=>{if(finished)return;finished=true;loaded.add(panel);update(-1);if(!state.pending)activity.delete(panel);};
}
