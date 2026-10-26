import {attachNewsletterSummaries} from './newsletter-summary.js';
import { $, escape, date, message, metricCards } from "../core/dom.js";
import { call } from "../core/api.js";
import {createRecordFilters} from './record-filters.js';
import {activityChart} from './activity-chart.js';
import {newsletterCadences} from '../../shared/newsletter-cadences.js';
import {t} from '../core/language.js';
const filters={},requests={};let adoptionCohort='dau';
const adoptionCohorts=[['dau','DAU','Usuarios · 24 horas'],['wau','WAU','Usuarios · 7 días'],['mau','MAU','Usuarios · 30 días'],['returning','Recurrentes','Más de una sesión · 30 días'],['total','Total usuarios','Usuarios · período filtrado']];
$('adoption-metrics').addEventListener('click',event=>{const cohort=event.target.closest('[data-cohort]')?.dataset.cohort;if(cohort&&cohort!==adoptionCohort){adoptionCohort=cohort;filters.adoption.reset();loadMetrics('adoption',()=>!$('adoption-section').hidden&&!$('administration-section').hidden);}});
async function loadMetrics(view, isCurrent) {
  if(view==='feedback')return loadFeedback(isCurrent);
  filters[view]||=createRecordFilters(view,[['correo','Usuario'],['vista','Vista'],['evento','Evento']],()=>loadMetrics(view,isCurrent),{dates:true});
  const request=requests[view]=(requests[view]||0)+1;
  try {
    const data=await call('getAdoption',{...filters[view].query(),cohort:adoptionCohort});
    if (!isCurrent()||requests[view]!==request) return;
    filters[view].options(data.options);
    if (view === "adoption") {
      $('adoption-metrics').innerHTML=adoptionCohorts.map(([key,label,hint])=>'<button type="button" class="metric" data-cohort="'+key+'" aria-pressed="'+(key===adoptionCohort)+'"><span>'+escape(t(label))+'</span><strong>'+Number(data[key==='total'?'totalUsers':key]||0)+'</strong><span class="small">'+escape(t(hint))+'</span></button>').join('');
      filters[view].page(data);$('adoption-users-label').textContent=t(adoptionCohorts.find(([key])=>key===adoptionCohort)[1])+' · '+t('{count} usuarios',{count:data.total});
      $('adoption-body').innerHTML=data.users.map(row=>'<tr>'+[row.correo,date(row.last),row.sessions,row.actions,date(row.first)].map((value,index)=>'<td data-label="'+escape(t(['Usuario','Último acceso','Sesiones','Eventos','Primer acceso'][index]))+'">'+escape(value)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="5">'+t('No hay usuarios en este grupo.')+'</td></tr>';
      $("adoption-note").textContent = t('{sessions} sesiones y {events} eventos que cumplen los filtros en los últimos 30 días. Incluye al administrador; sesiones identificadas por apertura del navegador.',data)+' ' + (data.limited ? "Límite de eventos alcanzado; métricas parciales." : "");
      $("adoption-chart").innerHTML=activityChart(data.daily);

    }
  } catch (e) {
    if(requests[view]===request&&isCurrent())message(e.message, true);
  }
}
export {
  loadMetrics
};

function feedbackCards(data){return metricCards([['Total',data.total,''],['👍 Útil',data.positive,''],['👎 Mejorable',data.negative,''],['% útil',data.positiveRate+'%',''],['Pendientes',data.pending,''],['Atendidos',data.resolved,'']].map(row=>[t(row[0]),row[1],row[2]]));}
async function loadFeedback(isCurrent){
  filters.feedback||=createRecordFilters('feedback',[['valoracion','Valoración',[['positive','👍 Útil'],['negative','👎 Mejorable']]],['estado','Estado',[['pendiente','pendiente'],['atendido','atendido']]],['edicion','Edición'],['correo','Correo']],()=>loadFeedback(isCurrent),{dates:true});
  const request=requests.feedback=(requests.feedback||0)+1;
  try{
    const data=await call('getAdminFeedback',filters.feedback.query());if(!isCurrent()||requests.feedback!==request)return;
    filters.feedback.options({...data.options,valoracion:[['positive','👍 Útil'],['negative','👎 Mejorable']]});filters.feedback.page(data);
    $('feedback-metrics').innerHTML=feedbackCards(data.filtered);
    $('feedback-body').innerHTML=data.items.map(row=>'<tr>'+[date(row.fecha),row.correo,row.nombre_edicion+' · '+row.edicion,row.fecha_envio?date(row.fecha_envio):'—',t(newsletterCadences[row.cadencia]?.label||row.cadencia),row.pais||'—',row.idioma,row.valoracion==='positive'?t('👍 Útil'):row.valoracion==='negative'?t('👎 Mejorable'):'—',row.comentario].map((value,index)=>'<td data-original>'+(index===2&&row.edicion?'<button class="text-button" data-open-edition="'+escape(row.edicion)+'">'+escape(value)+'</button><details data-newsletter-summary="'+escape(row.edicion)+'"><summary>'+escape(t('Resumen enviado'))+'</summary><div data-summary-content></div></details>':escape(value))+'</td>').join('')+'<td><select data-feedback="'+escape(row.id)+'" aria-label="'+escape(t('Estado'))+'">'+['pendiente','atendido'].map(state=>'<option value="'+state+'" '+(row.estado===state?'selected':'')+'>'+escape(t(state))+'</option>').join('')+'</select></td></tr>').join('')||'<tr><td colspan="10">'+t('Sin valoraciones.')+'</td></tr>';

  }catch(error){if(isCurrent()&&requests.feedback===request)message(error.message,true);}
}
$('feedback-body').addEventListener('change',async event=>{const input=event.target.closest('[data-feedback]');if(!input)return;input.disabled=true;try{await call('setNewsletterFeedbackState',{id:input.dataset.feedback,state:input.value});await loadFeedback(()=>!$('feedback-section').hidden&&!$('administration-section').hidden);}catch(error){message(error.message,true);}finally{input.disabled=false;}});
$('feedback-export').addEventListener('click',async()=>{const button=$('feedback-export');button.disabled=true;try{const data=await call('exportNewsletterFeedback',filters.feedback?.query()||{}),url=URL.createObjectURL(new Blob([data.csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='newsletter-feedback.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){message(error.message,true);}finally{button.disabled=false;}});

attachNewsletterSummaries($('feedback-body'));
