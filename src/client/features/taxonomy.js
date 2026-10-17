import {$,escape,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t,language} from '../core/language.js';
import {filterRecords,recordOptions,recordPage} from '../../shared/record-filters.js';
import {createRecordFilters} from './record-filters.js';
import {createJobMonitor,jobProgressHtml} from './job-monitor.js';
export function createTaxonomy({run,isActive,onRevision}){
  let items=[],pageSize,signature='',sourceSignature='',revision;
  $('taxonomy-source-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{message(await call('saveTaxonomySource',{url:$('taxonomy-catalog-url').value.trim(),refresh:$('taxonomy-catalog-refresh').checked,revision}));await monitor.open();});});
  const filters=createRecordFilters('taxonomy',[['palanca',"Bloque funcional"]],render,{placeholder:"Bloque funcional, funcionalidad / sub operativa o término"});
  function render(){
    const query=filters.query(),page=recordPage(filterRecords(items,query,['palanca'],['palanca','subpalanca','terminos','segmentos']),query,pageSize);
    $('taxonomy-body').innerHTML=page.items.map(row=>`<tr><td data-original>${escape(t(row.palanca))}</td><td><strong data-original>${escape(t(row.subpalanca))}</strong></td><td>${escape(row.segmentos.join(' · '))}</td><td>${row.noticias}</td><td data-original>${escape(row.terminos.join(' · '))}</td><td>${escape(row.origen==='tf-idf'?'TF-IDF':t('Reglas de negocio'))}</td></tr>`).join('')||'<tr><td colspan="6">'+t('Sin taxonomía disponible. Ejecuta el job para generarla.')+'</td></tr>';
    filters.page(page);$('taxonomy-count').textContent=t('{blocks} bloques funcionales · {functions} funcionalidades / sub operativas',{blocks:new Set(items.map(row=>row.palanca)).size,functions:items.filter(row=>row.subpalanca).length});
  }
  const monitor=createJobMonitor({id:'taxonomy',get:'getTaxonomyStatus',start:'startTaxonomy',run,isActive,onRevision,render(data){
    const source=JSON.stringify([data.configurationRevision,data.catalogUrl,data.catalogRefresh]);
    if(source!==sourceSignature){sourceSignature=source;revision=data.configurationRevision;$('taxonomy-catalog-url').value=data.catalogUrl||'';$('taxonomy-catalog-refresh').checked=Boolean(data.catalogRefresh);}
    $('taxonomy-catalog-status').textContent=data.job?.catalog?.error?t('No se pudo revisar Drive; se utiliza el catálogo guardado. ')+data.job.catalog.error:data.catalogRefresh?t('Se revisará Drive al iniciar la actualización.'):t('Se utiliza el catálogo guardado desde el Excel.');
    const job=data.job,total=Number(job?.total||0)*2,done=Number(job?.processed||0);
    $('taxonomy-schedule').textContent=t('Taxonomía tras completar las newsletters trimestrales · {state}',{state:t(data.scheduled?'Activada':'Desactivada')});
    $('taxonomy-progress').innerHTML=job?jobProgressHtml(job,{total,done,label:'Progreso de taxonomía',queued:data.queued,summary:t('{done}/{total} pasos de análisis y etiquetado; {tagged} etiquetas actualizadas.',{done,total,tagged:job.tagged})}):'<p class="muted">'+t(data.queued?'En cola':'Sin taxonomías ejecutadas.')+'</p>';
    const next=JSON.stringify([data.items,data.pageSize,data.taxonomyTranslations,language]);
    if(next!==signature){signature=next;items=data.items;pageSize=data.pageSize;filters.options(recordOptions(items,['palanca']));render();}
  }});
  return monitor;
}
