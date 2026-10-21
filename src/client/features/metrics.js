import { $, escape, date, message, metricCards } from "../core/dom.js";
import { call } from "../core/api.js";
import {createRecordFilters} from './record-filters.js';
import {activityChart} from './activity-chart.js';
import {t,language} from '../core/language.js';
import {newsletterCadences} from '../../shared/newsletter-cadences.js';
import {displayRecord} from '../../shared/locales.js';
const filters={},requests={};let insightRequest=0;
async function loadInsights(isCurrent){
  const request=++insightRequest,insights=await call('getNewsletterInsights',{adoption:filters['newsletter-adoption'].query()});
  if(!isCurrent()||request!==insightRequest)return;
      filters['newsletter-adoption'].page(insights.adoption);
      $('newsletter-adoption-body').innerHTML=insights.adoption.items.map(row=>'<tr>'+[row.edition,t(row.cadence),row.users,row.recipients,row.sessions,row.entries,row.destinations.join(' · ')].map(value=>'<td>'+escape(value)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="7">'+t('Sin accesos atribuidos.')+'</td></tr>';

}
async function loadMetrics(view, isCurrent) {
  if(view==='feedback')return loadFeedback(isCurrent);
  filters[view]||=createRecordFilters(view,view==='adoption'?[['correo','Usuario'],['vista','Vista'],['evento','Evento']]:[['operacion','Operación'],['estado','Estado']],()=>loadMetrics(view,isCurrent),{dates:true});
  if(view==='adoption'){filters['newsletter-adoption']||=createRecordFilters('newsletter-adoption',[['edicion','Edición'],['cadencia','Periodicidad',Object.entries(newsletterCadences).map(([key,row])=>[key,row.label])]],()=>loadInsights(isCurrent),{dates:true});}
  const request=requests[view]=(requests[view]||0)+1;
  try {
    const [data]=await Promise.all([call(view==='adoption'?'getAdoption':'getTelemetry',filters[view].query()),view==='adoption'?loadInsights(isCurrent):null]);
    if (!isCurrent()||requests[view]!==request) return;
    filters[view].options(data.options);filters[view].page(data);
    if (view === "adoption") {
      $("adoption-metrics").innerHTML = metricCards([["DAU", data.dau, "Usuarios · 24 horas"], ["WAU", data.wau, "Usuarios · 7 días"], ["MAU", data.mau, "Usuarios · 30 días"], ["Recurrentes", data.returning, "Más de una sesión · 30 días"]]);
      $("adoption-note").textContent = t('{sessions} sesiones y {events} eventos que cumplen los filtros en los últimos 30 días. Incluye al administrador; sesiones identificadas por apertura del navegador.',data)+' ' + (data.limited ? "Límite de eventos alcanzado; métricas parciales." : "");
      $("adoption-body").innerHTML = data.users.map((u) => `<tr><td>${escape(u.correo)}</td><td>${escape(date(u.first))}</td><td>${escape(date(u.last))}</td><td>${u.sessions}</td><td>${u.actions}</td></tr>`).join("") || '<tr><td colspan="5">Sin actividad registrada.</td></tr>';
      $("adoption-daily").innerHTML = data.daily.map((d) => `<tr><td>${escape(d.date)}</td><td>${d.users}</td><td>${d.sessions}</td></tr>`).join("") || '<tr><td colspan="3">Sin actividad diaria registrada.</td></tr>';
      $("adoption-chart").innerHTML=activityChart(data.daily);

    } else {
      $("telemetry-note").textContent=data.total+" coincidencias en las últimas "+data.limit+" operaciones disponibles."+(data.limited?" Histórico limitado.":"");
      $("telemetry-metrics").innerHTML = metricCards([["Latencia p95", data.latencyP95 == null ? "—" : data.latencyP95 + " ms", "Cargas · 30 días, todos los usuarios"], ["Errores cliente", data.clientErrors, "Eventos · 30 días, todos los usuarios"], ["Fuentes consultadas", data.collection.processed, "Recopilación actual"], ["Pendientes", data.collection.pending, "Fuentes por consultar"]]);
      $("telemetry-body").innerHTML = data.rows.map((r) => `<tr><td>${escape(date(r.fecha))}</td><td>${escape(displayRecord(r.operacion,language))}</td><td>${escape(r.duracion_ms)} ms</td><td>${escape(r.estado)}</td><td>${escape(r.detalle)}</td></tr>`).join("") || '<tr><td colspan="5">Sin telemetría de operación.</td></tr>';
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
    $('feedback-global').innerHTML=feedbackCards(data.global);$('feedback-metrics').innerHTML=feedbackCards(data.filtered);
    $('feedback-body').innerHTML=data.items.map(row=>'<tr>'+[date(row.fecha),row.correo,row.nombre_edicion+' · '+row.edicion,row.fecha_envio?date(row.fecha_envio):'—',t(row.cadencia),row.pais||'—',row.idioma,row.valoracion==='positive'?t('👍 Útil'):row.valoracion==='negative'?t('👎 Mejorable'):'—',row.comentario].map(value=>'<td data-original>'+escape(value)+'</td>').join('')+'<td><select data-feedback="'+escape(row.id)+'" aria-label="'+escape(t('Estado'))+'">'+['pendiente','atendido'].map(state=>'<option value="'+state+'" '+(row.estado===state?'selected':'')+'>'+escape(t(state))+'</option>').join('')+'</select></td></tr>').join('')||'<tr><td colspan="10">'+t('Sin valoraciones.')+'</td></tr>';
    $('feedback-interactions').innerHTML=data.interactions.map(row=>'<tr>'+[row.edicion,row.accesses,row.reads,row.exports].map(value=>'<td data-original>'+escape(value)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="4">'+t('Sin accesos atribuidos.')+'</td></tr>';
  }catch(error){if(isCurrent()&&requests.feedback===request)message(error.message,true);}
}
$('feedback-body').addEventListener('change',async event=>{const input=event.target.closest('[data-feedback]');if(!input)return;input.disabled=true;try{await call('setNewsletterFeedbackState',{id:input.dataset.feedback,state:input.value});await loadFeedback(()=>!$('feedback-section').hidden&&!$('administration-section').hidden);}catch(error){message(error.message,true);}finally{input.disabled=false;}});
$('feedback-export').addEventListener('click',async()=>{const button=$('feedback-export');button.disabled=true;try{const data=await call('exportNewsletterFeedback',filters.feedback?.query()||{}),url=URL.createObjectURL(new Blob([data.csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='newsletter-feedback.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){message(error.message,true);}finally{button.disabled=false;}});
