import {$,date} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function createCollectionProgress({reload,isBusy,onStatus}){
  let timer,revision,polling=false;
  function render(status){
    const node=$('collection-progress');node.hidden=!(status?.total||status?.queued);
    onStatus(status);if(node.hidden)return;
    node.textContent=t('Recuperación: {processed}/{total} consultas; {pending} pendientes; {added} noticias incorporadas.',status)
      +(status.lastActivity?' '+t('Última actividad')+': '+date(status.lastActivity)+'.':'')
      +(status.queued?' '+t('{queued} recargas en cola.',status):'')
      +(status.failed?' '+status.failed+' '+t('Errores')+'.':'');
  }
  function update(data){
    revision=data.newsRevision;render(data.collection);clearTimeout(timer);
    if(data.collection?.pending||data.collection?.queued)timer=setTimeout(poll,30000);
  }
  async function poll(){
    if(document.hidden||isBusy()||polling){timer=setTimeout(poll,30000);return;}
    polling=true;
    try{
      const data=await call('getCollectionProgress');
      const changed=data.newsRevision!==revision;update(data);
      if(changed)await reload(data);
    }catch{timer=setTimeout(poll,60000);}
    finally{polling=false;}
  }
  return {update};
}
