import {$} from '../core/dom.js';
import {t} from '../core/language.js';
import {createJobMonitor,jobProgressHtml} from './job-monitor.js';
export function createClassification({run,isActive,onRevision}){
  return createJobMonitor({id:'classification',get:'getClassificationStatus',start:'startClassification',run,isActive,onRevision,render(data){
    const job=data.job,total=Number(job?.total||0),done=Number(job?.processed||0);
    $('classification-schedule').textContent=t('Clasificación diaria tras completar la recopilación · {state}',{state:t(data.scheduled?'Activada':'Desactivada')});
    $('classification-progress').innerHTML=jobProgressHtml(job||{state:'Completada',updated:''},{total,done,label:'Progreso de clasificación',queued:data.queued,summary:job?t('{done}/{total} noticias revisadas; {classified} etiquetas actualizadas; {digital} digitales.',{done,total,classified:job.classified,digital:job.digital}):t('Sin clasificaciones ejecutadas.')});
  }});
}
