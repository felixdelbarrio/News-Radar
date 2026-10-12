import {$,escape,date,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function jobProgressHtml(job,{total,done,label,summary,queued=false}){
  return `<div class="panel-header"><span>${escape(t(queued?'En cola':job.state))}</span><span>${done}/${total}</span></div><progress max="${Math.max(1,total)}" value="${done}" aria-label="${escape(t(label))}"></progress><p>${escape(summary)}</p><p class="small muted">${escape(t('Última actividad'))}: ${escape(date(job.updated))}</p>${job.error?'<p>'+escape(job.error)+'</p>':''}`;
}
export function createJobMonitor({id,get,start,run,isActive,render,onRevision}){
  let timer,request=0;
  function close(){request++;clearTimeout(timer);}
  async function refresh(){
    close();const current=request;
    try{
      const data=await call(get);if(current!==request)return;
      const active=Boolean(data.queued||data.job&&data.job.state!=='Completada');
      onRevision(data.newsRevision);
      $(id+'-start').disabled=active&&data.job?.state!=='En pausa';render(data);
      if(active&&isActive())timer=setTimeout(poll,30000);
    }catch(error){if(current===request){message(error.message,true);if(isActive())timer=setTimeout(poll,60000);}}
  }
  async function poll(){if(!isActive())return;if(document.hidden){timer=setTimeout(poll,30000);return;}await refresh();}
  $(id+'-start').addEventListener('click',()=>run(async()=>{await call(start);await refresh();},false));
  return {open:refresh,close};
}
