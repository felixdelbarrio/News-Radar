import {$} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
import {createJobMonitor,jobProgressHtml} from './job-monitor.js';
export function createLanguageSettings({run,isActive,onRevision}){
  let scheduled=false;
  function progress(id,data,label,summary,empty){
    const job=data.job||(data.queued?{state:'En cola',total:0,processed:0,translated:0}:null),total=Number(job?.total||0),done=Number(job?.processed||0);
    $(id+'-progress').innerHTML=job?jobProgressHtml(job,{total,done,label,queued:data.queued,summary:t(summary,{done,total,translated:job.translated})}):'<p class="muted">'+t(empty)+'</p>';
  }
  const articles=createJobMonitor({id:'translation',get:'getTranslationStatus',start:'startTranslations',run,isActive,onRevision,render(data){
    scheduled=data.scheduled;
    $('translation-toggle').textContent=t(scheduled?'Desactivar traducción nocturna':'Activar traducción nocturna');
    $('translation-schedule').textContent=t('Traducción nocturna: {hour} · {timezone} · {state}',{hour:String(data.hour).padStart(2,'0')+':00',timezone:data.timezone,state:t(scheduled?'Activada':'Desactivada')});
    progress('translation',data,'Progreso de traducción','{done}/{total} noticias revisadas; {translated} traducciones guardadas.','Sin traducciones programadas ejecutadas.');
  }});
  const taxonomy=createJobMonitor({id:'taxonomy-translation',get:'getTaxonomyTranslationStatus',start:'startTaxonomyTranslations',run,isActive,onRevision,render(data){
    progress('taxonomy-translation',data,'Progreso de traducción de taxonomía','{done}/{total} nombres revisados; {translated} traducciones guardadas.','Sin traducciones de taxonomía ejecutadas.');
  }});
  $('translation-toggle').addEventListener('click',()=>run(async()=>{await call(scheduled?'disableTranslationSchedule':'installTranslationSchedule');await articles.open();},false));
  return {open:()=>Promise.all([articles.open(),taxonomy.open()]),close(){articles.close();taxonomy.close();}};
}
