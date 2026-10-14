import {$,escape,date,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
import {progressState} from '../../shared/progress-state.js';
export function progressDetailsHtml(status){
  return `<div class="small muted"><p>${escape(t('Última ejecución'))}: ${escape(t(date(status.lastExecutedAt)))}</p>${status.pauseReason?`<p>${escape(t('Motivo de la pausa'))}: ${escape(t(status.pauseReason))}</p>`:''}${status.restartAt?`<p>${escape(t('Previsión de reinicio'))}: ${escape(date(status.restartAt))}</p>`:''}${status.waitingFor?`<p>${escape(t('Esperando a'))}: ${escape(t(status.waitingFor))}</p>`:''}</div>`;
}
export function jobProgressHtml(job,{total,done,label,summary,queued=false}){
  const status=job.progress||progressState({state:job.state,queued,lastExecutedAt:job.updated,pausedUntil:job.pausedUntil,error:job.error});
  return `<div class="panel-header"><span>${escape(t(status.state))}</span><span>${done}/${total}</span></div><progress max="${Math.max(1,total)}" value="${done}" aria-label="${escape(t(label))}"></progress><p>${escape(summary)}</p>${progressDetailsHtml(status)}${job.error&&job.error!==status.pauseReason?'<p>'+escape(t(job.error))+'</p>':''}`;
}
export function createJobMonitor({id,get,start,run,isActive,render,onRevision=()=>{}}){
  let timer,request=0;
  function close(){request++;clearTimeout(timer);}
  async function refresh(provided){
    close();const current=request;
    try{
      const data=provided||await call(get);if(current!==request)return;
      const active=data.active??Boolean(data.queued||data.job&&data.job.state!=='Completada');
      onRevision(data.newsRevision);
      if(start){const button=$(id+'-start');button.dataset.jobActive=String(active&&data.job?.state!=='En pausa');button.disabled=button.dataset.jobActive==='true';}render(data);
      if(active&&isActive())timer=setTimeout(poll,30000);
    }catch(error){if(current===request){message(error.message,true);if(isActive())timer=setTimeout(poll,60000);}}
  }
  async function poll(){if(!isActive())return;if(document.hidden){timer=setTimeout(poll,30000);return;}await refresh();}
  if(start)$(id+'-start').addEventListener('click',()=>run(async()=>{await call(start);await refresh();},false));
  return {open:refresh,close};
}
