import {$,escape,date,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function createLanguageSettings({run,isActive}){
  let timer,scheduled=false,request=0;
  function close(){request++;clearTimeout(timer);}
  function render(data){
    scheduled=data.scheduled;
    $('translation-toggle').textContent=scheduled?'Desactivar traducción nocturna':'Activar traducción nocturna';
    $('translation-schedule').textContent=t('Traducción nocturna: {hour} · {timezone} · {state}',{hour:String(data.hour).padStart(2,'0')+':00',timezone:data.timezone,state:t(scheduled?'Activada':'Desactivada')});
    const job=data.job||(data.queued?{state:'En cola',total:0,processed:0,translated:0,updated:''}:null),total=Number(job?.total||0),done=Number(job?.processed||0);
    $('translation-progress').innerHTML=job?`<div class="panel-header"><h3>${escape(t('Progreso de traducción'))}</h3><span>${escape(t(data.queued?'En cola':job.state))}</span></div><progress max="${Math.max(1,total)}" value="${done}" aria-label="${escape(t('Progreso de traducción'))}"></progress><p>${escape(t('{done}/{total} noticias revisadas; {translated} traducciones guardadas.',{done,total,translated:job.translated}))}</p><p class="small muted">${escape(t('Última actividad'))}: ${escape(date(job.updated))}</p>${job.error?'<p class="small">'+escape(t(job.error))+'</p>':''}`:'<p class="muted">Sin traducciones programadas ejecutadas.</p>';
  }
  async function open(){
    close();const current=request;
    try{const data=await call('getTranslationStatus');if(current!==request)return;render(data);if((data.queued||(data.job&&['Pendiente','En curso','En pausa'].includes(data.job.state)))&&isActive())timer=setTimeout(poll,30000);}
    catch(error){if(current===request){message(error.message,true);if(isActive())timer=setTimeout(poll,60000);}}
  }
  async function poll(){if(!isActive())return;if(document.hidden){timer=setTimeout(poll,30000);return;}await open();}
  $('translation-toggle').addEventListener('click',()=>run(async()=>{await call(scheduled?'disableTranslationSchedule':'installTranslationSchedule');await open();},false));
  $('translation-start').addEventListener('click',()=>run(async()=>{await call('startTranslations');await open();},false));
  return {open,close};
}
