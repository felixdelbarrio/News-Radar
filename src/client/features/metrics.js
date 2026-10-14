import { $, escape, date, message, metricCards } from "../core/dom.js";
import { call } from "../core/api.js";
import {createRecordFilters} from './record-filters.js';
import {activityChart} from './activity-chart.js';
import {t,language} from '../core/language.js';
import {newsletterCadences} from '../../shared/newsletter-cadences.js';
import {displayRecord} from '../../shared/locales.js';
const filters={},requests={};let insightRequest=0;
$('newsletter-feedback-body').addEventListener('click',async event=>{const button=event.target.closest('[data-feedback]');if(!button)return;button.disabled=true;try{await call('setNewsletterFeedbackState',{id:button.dataset.feedback,state:button.dataset.state});await loadInsights(()=>!$('adoption-section').hidden&&!$('administration-section').hidden);}catch(error){message(error.message,true);}finally{button.disabled=false;}});
async function loadInsights(isCurrent){
  const request=++insightRequest,insights=await call('getNewsletterInsights',{adoption:filters['newsletter-adoption'].query(),feedback:filters['newsletter-feedback'].query()});
  if(!isCurrent()||request!==insightRequest)return;
      filters['newsletter-adoption'].page(insights.adoption);filters['newsletter-feedback'].page(insights.feedback);
      $('newsletter-adoption-body').innerHTML=insights.adoption.items.map(row=>'<tr>'+[row.edition,t(row.cadence),row.users,row.recipients,row.sessions,row.entries,row.destinations.join(' · ')].map(value=>'<td>'+escape(value)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="7">'+t('Sin accesos atribuidos.')+'</td></tr>';
      $('newsletter-feedback-body').innerHTML=insights.feedback.items.map(row=>'<tr><td>'+escape(row.edicion)+'</td><td>'+escape(row.valoracion==='positive'?'👍':row.valoracion==='negative'?'👎':'—')+'</td><td>'+escape(row.comentario)+'</td><td>'+escape(date(row.fecha))+'</td><td><button type="button" class="button" data-feedback="'+escape(row.id)+'" data-state="'+(row.estado==='pendiente'?'atendido':'pendiente')+'">'+escape(t(row.estado))+'</button></td></tr>').join('')||'<tr><td colspan="5">'+t('Sin valoraciones.')+'</td></tr>';
}
async function loadMetrics(view, isCurrent) {
  filters[view]||=createRecordFilters(view,view==='adoption'?[['correo','Usuario'],['vista','Vista'],['evento','Evento']]:[['operacion','Operación'],['estado','Estado']],()=>loadMetrics(view,isCurrent),{dates:true});
  if(view==='adoption'){filters['newsletter-adoption']||=createRecordFilters('newsletter-adoption',[['edicion','Edición'],['cadencia','Periodicidad',Object.entries(newsletterCadences).map(([key,row])=>[key,row.label])]],()=>loadInsights(isCurrent),{dates:true});filters['newsletter-feedback']||=createRecordFilters('newsletter-feedback',[['estado','Estado',[['pendiente','pendiente'],['atendido','atendido']]]],()=>loadInsights(isCurrent),{dates:true});}
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
