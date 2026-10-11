import {$,escape,date,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {displayRecord,formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import {createRecordFilters} from './record-filters.js';
let filters,request=0;
export async function loadRuns(){
  filters||=createRecordFilters('runs',[['estado','Estado'],['id','Recarga']],loadRuns,{dates:true,placeholder:'Estado o error'});
  const current=++request;
  try{
    const data=await call('getRuns',filters.query());if(current!==request)return;
    renderCollectionJobs(data.collection);filters.options(data.options);filters.page(data);
    $('runs-body').innerHTML=data.items.map(r=>`<tr><td>${escape(displayRecord(r.tipo,language))} ${escape(r.desde)} — ${escape(r.hasta)}</td><td>${escape(date(r.inicio))}</td><td>${escape(r.estado)}</td><td>${escape(r.evaluadas)}</td><td>${escape(r.nuevas)}</td><td>${escape(r.errores||'—')}</td></tr>`).join('')||'<tr><td colspan="6">Sin ejecuciones con estos filtros.</td></tr>';
  }catch(error){if(current===request)message(error.message,true);}
}

export function renderCollectionJobs(status){
  $('collection-jobs').innerHTML=(status?.jobs||[]).map(job=>{
    const done=Number(job.procesadas||0)+Number(job.omitidas||0)+Number(job.fallidas||0),total=Number(job.total||0);
    return `<article class="collection-job"><div class="panel-header"><h3>${escape(displayRecord(job.tipo,language))}</h3><span>${escape(t(job.estado))}</span></div><p class="small muted">${escape(formatCalendarDay(job.desde,language))} — ${escape(formatCalendarDay(job.hasta,language))}</p><progress max="${Math.max(1,total)}" value="${done}" aria-label="${escape(displayRecord(job.tipo,language))}"></progress><p>${escape(t('{done}/{total} consultas; {added} noticias incorporadas.',{done,total,added:job.nuevas||0}))}</p><p class="small muted">${Number(job.pendientes||0)} ${escape(t('Pendientes'))} · ${Number(job.fallidas||0)} ${escape(t('Errores'))}${job.actualizada?' · '+escape(t('Última actividad'))+': '+escape(date(job.actualizada)):''}${Number(job.pausa)>Date.now()?' · '+escape(t('Reintento programado'))+': '+escape(date(new Date(Number(job.pausa)))):''}</p></article>`;
  }).join('')||'<p class="muted">Sin recuperaciones registradas.</p>';
}
