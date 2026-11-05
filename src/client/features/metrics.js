import {attachNewsletterSummaries} from './newsletter-summary.js';
import { $, escape, date, message, metricCards } from "../core/dom.js";
import { call } from "../core/api.js";
import {createRecordFilters} from './record-filters.js';
import {createActivityChart} from './activity-chart.js';
import {newsletterCadences} from '../../shared/newsletter-cadences.js';
import {t} from '../core/language.js';
const filters={},requests={},usagePanels={};
const adoptionCohorts=[['dau','DAU','Usuarios · 24 horas'],['wau','WAU','Usuarios · 7 días'],['mau','MAU','Usuarios · 30 días'],['returning','Recurrentes','Más de una sesión · 30 días'],['total','Total usuarios','Usuarios · período filtrado']];
const userColumns=['Usuario','Último acceso','Sesiones','Eventos','Primer acceso'];
function usagePanel(view,isCurrent){
  const newsletter=view==='newsletterAccess',element=name=>$(view+'-'+name);
  const fields=newsletter?[['correo','Usuario'],['edicion','Edición'],['cadencia','Periodicidad']]:[['correo','Usuario'],['vista','Vista'],['evento','Evento']];
  const chart=createActivityChart(element('chart'));
  const panel={cohort:'dau',filters:createRecordFilters(view,fields,()=>loadMetrics(view,isCurrent),{dates:true}),chart,element};
  element('metrics').addEventListener('click',event=>{
    const cohort=event.target.closest('[data-cohort]')?.dataset.cohort;
    if(!cohort||cohort===panel.cohort)return;
    panel.cohort=cohort;panel.filters.reset();loadMetrics(view,isCurrent);
  });
  return panel;
}
async function loadMetrics(view,isCurrent) {
  if(view==='sourceQuality')return loadSourceQuality(isCurrent);
  if(view==='feedback')return loadFeedback(isCurrent);
  const panel=usagePanels[view]||=usagePanel(view,isCurrent);
  const {cohort,filters,chart,element}=panel,request=requests[view]=(requests[view]||0)+1;
  try{
    const data=await call('getAdoption',{...filters.query(),source:view,cohort});
    if(!isCurrent()||requests[view]!==request)return;
    const options=view==='newsletterAccess'?{...data.options,cadencia:(data.options?.cadencia||[]).map(key=>[key,t(newsletterCadences[key]?.label||key)])}:data.options;
    filters.options(options);filters.page(data);
    element('metrics').innerHTML=adoptionCohorts.map(([key,label,hint])=>'<button type="button" class="metric" data-cohort="'+key+'" aria-pressed="'+(key===cohort)+'"><span>'+escape(t(label))+'</span><strong>'+Number(data[key==='total'?'totalUsers':key]||0)+'</strong><span class="small">'+escape(t(hint))+'</span></button>').join('');
    element('users-label').textContent=t(adoptionCohorts.find(([key])=>key===cohort)[1])+' · '+t('{count} usuarios',{count:data.total});
    element('body').innerHTML=data.users.map(row=>'<tr>'+[row.correo,date(row.last),row.sessions,row.actions,date(row.first)].map((value,index)=>'<td data-label="'+escape(t(userColumns[index]))+'">'+escape(value)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="5">'+t('No hay usuarios en este grupo.')+'</td></tr>';
    element('note').textContent=t('{sessions} sesiones y {events} eventos que cumplen los filtros en los últimos 30 días. Incluye al administrador; sesiones identificadas por apertura del navegador.',data)+' '+(data.limited?t('Límite de eventos alcanzado; métricas parciales.'):'');
    chart.render(data.daily);
  }catch(error){if(isCurrent()&&requests[view]===request)message(error.message,true);}
}
export {
  loadMetrics
};

$('sourceQuality-days').addEventListener('change',()=>{filters.sourceQuality?.reset();loadSourceQuality(()=>!$('sourceQuality-section').hidden&&!$('administration-section').hidden);});
$('sourceQuality-metrics').addEventListener('click',event=>{const button=event.target.closest('[data-source-status]');if(button)filters.sourceQuality?.set('status',button.dataset.sourceStatus);});
async function loadSourceQuality(isCurrent){
 const view='sourceQuality';filters[view]||=createRecordFilters(view,[['source','Fuente'],['status','Estado',[['never','Sin noticias'],['errors','Con errores'],['news','Con noticias']]]],()=>loadSourceQuality(isCurrent));const request=requests[view]=(requests[view]||0)+1;
 try{
  const data=await call('getSourceQuality',{...filters[view].query(),days:$('sourceQuality-days').value});if(!isCurrent()||requests[view]!==request)return;filters[view].options(data.options);filters[view].page(data);
  const status=filters[view].query().status||'';$('sourceQuality-metrics').innerHTML=[['','Fuentes',data.metrics.sources],['never','Sin noticias',data.metrics.never],['errors','Con errores',data.metrics.withErrors],['news','Noticias',data.metrics.news]].map(([key,label,value])=>'<button type="button" class="metric" data-source-status="'+key+'" aria-pressed="'+(key===status)+'"><span class="eyebrow">'+escape(t(label))+'</span><strong>'+value+'</strong></button>').join('');
  const overview=data.overview||[],top=Math.max(1,...overview.map(row=>row.news));$('sourceQuality-overview').innerHTML='<h3>'+t('Canales que aportan noticias')+'</h3>'+overview.map(row=>'<div class="source-quality-row"><span>'+escape(row.source)+'</span><span class="source-quality-track"><span style="width:'+Math.round(row.news/top*100)+'%"></span></span><strong>'+row.news+'</strong><small>'+escape(row.lastNews?date(row.lastNews):t('Nunca'))+'</small></div>').join('');
  const percent=value=>value==null?'—':value+'%',headers=[...$('sourceQuality-body').closest('table').querySelectorAll('th')].map(cell=>cell.textContent);
  $('sourceQuality-body').innerHTML=data.items.map(row=>'<tr>'+[row.source,row.country||'—',percent(row.availability),row.queries,row.errors,row.retrieved,row.relevant,Object.entries(row.reasons).map(([reason,count])=>reason+': '+count).join('; ')||(row.discarded?row.discarded:'—'),row.duplicates,row.lastNews?date(row.lastNews):'—',row.lastQuery?date(row.lastQuery):'—',row.publishers,percent(row.localPercent),percent(row.unknownPercent),percent(row.saturationPercent)].map((value,index)=>'<td data-label="'+escape(headers[index])+'">'+escape(value)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="15">'+t('Sin datos retenidos para esta selección.')+'</td></tr>';
  $('sourceQuality-note').textContent=t('Ventana: {days} días. Disponibilidad: tareas completadas / intentos de ingesta registrados; errores: intentos sin completar. Consultas válidas y motivos: resúmenes RSS retenidos. No se cuentan redirecciones HTTP. Diversidad y porcentajes geográficos: noticias retenidas; local exige país de la fuente y evidencia alta/media. Saturación: consultas saturadas / consultas con cobertura registrada. — indica ausencia de denominador. Límite: {limit} filas por tabla y caché de hasta 120 segundos.',{days:data.days,limit:data.limit})+' '+(data.limited?t('Límite de eventos alcanzado; métricas parciales.'):'')+' '+t('Retención: {days} días; primer registro disponible: {date}.',{days:data.retentionDays,date:data.retainedFrom?date(data.retainedFrom):'—'});
 }catch(error){if(isCurrent()&&requests[view]===request)message(error.message,true);}
}

function feedbackCards(data){return metricCards([['Total',data.total,''],['Útil',data.positive,''],['Mejorable',data.negative,''],['% útil',data.positiveRate+'%',''],['Pendientes',data.pending,''],['Atendidos',data.resolved,'']].map(row=>[t(row[0]),row[1],row[2]]));}
async function loadFeedback(isCurrent){
  filters.feedback||=createRecordFilters('feedback',[['valoracion','Valoración',[['positive','Útil'],['negative','Mejorable']]],['estado','Estado',[['pendiente','pendiente'],['atendido','atendido']]],['edicion','Edición'],['correo','Correo']],()=>loadFeedback(isCurrent),{dates:true});
  const request=requests.feedback=(requests.feedback||0)+1;
  try{
    const data=await call('getAdminFeedback',filters.feedback.query());if(!isCurrent()||requests.feedback!==request)return;
    filters.feedback.options({...data.options,valoracion:[['positive','Útil'],['negative','Mejorable']]});filters.feedback.page(data);
    $('feedback-metrics').innerHTML=feedbackCards(data.filtered);
    $('feedback-body').innerHTML=data.items.map(row=>'<tr>'+[date(row.fecha),row.correo,row.nombre_edicion+' · '+row.edicion,row.fecha_envio?date(row.fecha_envio):'—',t(newsletterCadences[row.cadencia]?.label||row.cadencia),row.pais||'—',row.idioma,row.valoracion==='positive'?t('Útil'):row.valoracion==='negative'?t('Mejorable'):'—',row.comentario].map((value,index)=>'<td data-original>'+(index===2&&row.edicion?'<button class="text-button" data-open-edition="'+escape(row.edicion)+'">'+escape(value)+'</button><details data-newsletter-summary="'+escape(row.edicion)+'"><summary>'+escape(t('Resumen enviado'))+'</summary><div data-summary-content></div></details>':escape(value))+'</td>').join('')+'<td><select data-feedback="'+escape(row.id)+'" aria-label="'+escape(t('Estado'))+'">'+['pendiente','atendido'].map(state=>'<option value="'+state+'" '+(row.estado===state?'selected':'')+'>'+escape(t(state))+'</option>').join('')+'</select></td></tr>').join('')||'<tr><td colspan="10">'+t('Sin valoraciones.')+'</td></tr>';

  }catch(error){if(isCurrent()&&requests.feedback===request)message(error.message,true);}
}
$('feedback-body').addEventListener('change',async event=>{const input=event.target.closest('[data-feedback]');if(!input)return;input.disabled=true;try{await call('setNewsletterFeedbackState',{id:input.dataset.feedback,state:input.value});await loadFeedback(()=>!$('feedback-section').hidden&&!$('administration-section').hidden);}catch(error){message(error.message,true);}finally{input.disabled=false;}});
$('feedback-export').addEventListener('click',async()=>{const button=$('feedback-export');button.disabled=true;try{const data=await call('exportNewsletterFeedback',filters.feedback?.query()||{}),url=URL.createObjectURL(new Blob([data.csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='newsletter-feedback.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){message(error.message,true);}finally{button.disabled=false;}});

attachNewsletterSummaries($('feedback-body'));
