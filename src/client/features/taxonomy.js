import {$,escape} from '../core/dom.js';
import {t} from '../core/language.js';
import {filterRecords,recordOptions,recordPage} from '../../shared/record-filters.js';
import {createRecordFilters} from './record-filters.js';
import {createJobMonitor,jobProgressHtml} from './job-monitor.js';
export function createTaxonomy({run,isActive,onRevision}){
  let items=[],pageSize,signature='';
  const filters=createRecordFilters('taxonomy',[['palanca','Palanca']],render,{placeholder:'Palanca, subpalanca o término'});
  function render(){
    const query=filters.query(),page=recordPage(filterRecords(items,query,['palanca'],['palanca','subpalanca','terminos','segmentos']),query,pageSize);
    $('taxonomy-body').innerHTML=page.items.map(row=>`<tr><td>${escape(row.palanca)}</td><td><strong data-original>${escape(row.subpalanca)}</strong></td><td>${escape(row.segmentos.join(' · '))}</td><td>${row.noticias}</td><td data-original>${escape(row.terminos.join(' · '))}</td><td>${escape(row.origen==='tf-idf'?'TF-IDF':t('Reglas de negocio'))}</td></tr>`).join('')||'<tr><td colspan="6">'+t('Sin taxonomía disponible. Ejecuta el job para generarla.')+'</td></tr>';
    filters.page(page);$('taxonomy-count').textContent=t('{palancas} palancas · {subpalancas} subpalancas',{palancas:new Set(items.map(row=>row.palanca)).size,subpalancas:items.length});
  }
  return createJobMonitor({id:'taxonomy',get:'getTaxonomyStatus',start:'startTaxonomy',run,isActive,onRevision,render(data){
    const job=data.job,total=Number(job?.total||0)*2,done=Number(job?.processed||0);
    $('taxonomy-schedule').textContent=t('Taxonomía diaria: {hour} · {timezone} · {state}. La recuperación diaria tiene prioridad.',{hour:String(data.hour).padStart(2,'0')+':'+String(data.minute).padStart(2,'0'),timezone:data.timezone,state:t(data.scheduled?'Activada':'Desactivada')});
    $('taxonomy-progress').innerHTML=job?jobProgressHtml(job,{total,done,label:'Progreso de taxonomía',queued:data.queued,summary:t('{done}/{total} pasos de análisis y etiquetado; {tagged} etiquetas actualizadas.',{done,total,tagged:job.tagged})}):'<p class="muted">'+t(data.queued?'En cola':'Sin taxonomías ejecutadas.')+'</p>';
    const next=JSON.stringify([data.items,data.pageSize]);
    if(next!==signature){signature=next;items=data.items;pageSize=data.pageSize;filters.options(recordOptions(items,['palanca']));render();}
  }});
}
