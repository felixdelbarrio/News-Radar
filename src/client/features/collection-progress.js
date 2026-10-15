import {$,date} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function createCollectionProgress({isActive,isBusy,onStatus}){
  let timer,polling=false;
  function render(status){
    const node=$('collection-progress');node.hidden=!isActive()||!(status?.total||status?.queued);
    onStatus(status);if(node.hidden)return;
    node.textContent=t('Recuperación: {processed}/{total} consultas; {pending} pendientes; {added} noticias incorporadas.',status)
      +(status.lastActivity?' '+t('Última actividad')+': '+date(status.lastActivity)+'.':'')
      +(status.queued?' '+t('{queued} recargas en cola.',status):'')
      +(status.failed?' '+status.failed+' '+t('Errores')+'.':'');
  }
  function update(data){
    render(data.collection);clearTimeout(timer);
    if(isActive()&&(data.collection?.pending||data.collection?.queued))timer=setTimeout(poll,30000);
  }
  async function poll(){
    if(!isActive()){clearTimeout(timer);return;}
    if(document.hidden||isBusy()||polling){timer=setTimeout(poll,30000);return;}
    polling=true;
    try{
      const data=await call('getCollectionProgress');
      update(data);
    }catch{timer=setTimeout(poll,60000);}
    finally{polling=false;}
  }
  return {update};
}
