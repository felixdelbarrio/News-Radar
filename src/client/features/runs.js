import {$,escape,date,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {displayRecord,formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import {progressState} from '../../shared/progress-state.js';
import {progressDetailsHtml} from './job-monitor.js';
import {createRecordFilters} from './record-filters.js';
let filters,request=0,syncRecovery=()=>{};
export async function loadRuns(){
  filters||=createRecordFilters('runs',[['estado','Estado'],['id','Recarga']],loadRuns,{dates:true,placeholder:'Estado o error'});
  const current=++request;
  try{
    const data=await call('getRuns',filters.query());if(current!==request)return;
    renderCollectionJobs(data.collection);filters.options(data.options);filters.page(data);
    $('runs-body').innerHTML=data.items.map(r=>`<tr><td>${escape(displayRecord(r.tipo,language))} ${escape(r.desde)} — ${escape(r.hasta)}</td><td>${escape(date(r.inicio))}</td><td>${escape(r.estado)}</td><td>${escape(r.evaluadas)}</td><td>${escape(r.nuevas)}</td><td>${escape(r.errores||'—')}</td></tr>`).join('')||'<tr><td colspan="6">Sin ejecuciones con estos filtros.</td></tr>';
    return data;
  }catch(error){if(current===request)message(error.message,true);}
}

export function renderCollectionJobs(status){
  syncRecovery(status);
  const total=Number(status?.total||0),done=Number(status?.processed||0)+Number(status?.skipped||0)+Number(status?.failed||0);
  $('collection-total').hidden=!total;$('collection-total-progress').max=Math.max(1,total);$('collection-total-progress').value=done;
  $('collection-total-label').textContent=t('{done}/{total} consultas; {added} noticias incorporadas.',{done,total,added:status?.added||0});
  $('collection-total-details').innerHTML=status?.progress?progressDetailsHtml(status.progress):'';
  const jobs=[...(status?.jobs||[])];
  $('collection-jobs').innerHTML=jobs.map(job=>{
    const progress=job.progress||progressState({state:job.estado,lastExecutedAt:job.actualizada,pausedUntil:job.pausa}),done=Number(job.procesadas||0)+Number(job.omitidas||0)+Number(job.fallidas||0),total=Number(job.total||0);
    return `<article class="collection-job" data-collection-kind="${escape(job.tipo)}"><div class="panel-header"><h3>${escape(displayRecord(job.tipo,language))}</h3><span>${escape(t(progress.state))}</span></div>${job.desde?`<p class="small muted">${escape(formatCalendarDay(job.desde,language))} — ${escape(formatCalendarDay(job.hasta,language))}</p>`:''}<progress max="${Math.max(1,total)}" value="${done}" aria-label="${escape(displayRecord(job.tipo,language))}"></progress><p>${escape(t('{done}/{total} consultas; {added} noticias incorporadas.',{done,total,added:job.nuevas||0}))}</p><p class="small muted">${Number(job.pendientes||0)} ${escape(t('Pendientes'))} · ${Number(job.fallidas||0)} ${escape(t('Errores'))}</p>${progressDetailsHtml(progress)}</article>`;
  }).join('');
}

export function createRecoveryControls({getData,run}){
  let busy=false,status={};
  const radios=[...document.querySelectorAll('input[name="recovery-range"]')];
  function render(next=status){
    status=next||{};
    for(const radio of radios)radio.disabled=busy;
    const range=document.querySelector('input[name="recovery-range"]:checked').value,blocked=Boolean(status.blocked?.[range]);
    $('collect').disabled=busy||blocked;
    $('recovery-status').textContent=blocked?t(range==='year'?'Ya hay una recuperación anual en curso.':'Ya hay una recuperación diaria en curso.'):'';
    $('continue-collection').hidden=!blocked;$('continue-collection').disabled=busy;
    $('retry-collection').disabled=busy;$('toggle-daily').disabled=busy;
    $('toggle-daily').textContent=t(getData()?.daily?'Desactivar recopilación diaria':'Activar recopilación diaria');
    $('recovery-schedule').textContent=getData()?.schedule||'';
  }
  async function recover(method,range){return run(async()=>{
    const result=await call(method,...(range?[range]:[]));message(result.notice,result.errors.length>0);
  });}
  $('collect').addEventListener('click',()=>recover('collectNow',document.querySelector('input[name="recovery-range"]:checked').value));
  $('continue-collection').addEventListener('click',()=>recover('resumeCollection',document.querySelector('input[name="recovery-range"]:checked').value));
  radios.forEach(radio=>radio.addEventListener('change',()=>render()));
  $('toggle-daily').addEventListener('click',()=>run(async()=>{
    const enabled=getData().daily,result=await call(enabled?'disableDaily':'enableDaily');message(enabled?'Recopilación diaria desactivada.':result);
  }));
  $('retry-collection').addEventListener('click',()=>run(async()=>message(await call('retryCollectionErrors'))));
  syncRecovery=render;
  return {setBusy(value){busy=value;render();}};
}
