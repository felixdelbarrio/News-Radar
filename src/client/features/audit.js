import {$,escape,date,message,metricCards,validUrl} from '../core/dom.js';
import {call} from '../core/api.js';
import {createRecordFilters} from './record-filters.js';
import {attachNewsletterSummaries} from './newsletter-summary.js';
import {t} from '../core/language.js';
const labels={inicio:'Inicio',fin:'Fin',estado:'Estado',evaluadas:'Evaluadas',nuevas:'Nuevas',errores:'Errores',fecha:'Fecha',correo:'Correo',noticias:'Noticias incluidas',detalle:'Detalle',edition:'Edición',usuarios:'Usuarios',sesiones:'Sesiones',eventos:'Eventos',edicion:'Edición',cadencia:'Periodicidad',sesion:'Sesión',destino:'Destino',accesos:'Accesos',lecturas:'Lecturas',exportaciones:'Exportaciones',operacion:'Operación',duracion_ms:'Duración',fuente:'Fuente',resultado:'Resultado',motivo:'Motivo',url:'Enlace',id:'Recarga',suscripcion:'Suscripción',vista:'Vista',evento:'Evento',ejecucion:'Ejecución'};
let filters,view='',request=0;
export async function loadAudit(){
 const selected=$('logs-view').value,current=++request;
 try{
  if(view!==selected){view=selected;filters?.destroy();filters=null;}
  const data=await call('getAdminLogs',selected,filters?.query()||{});if(current!==request)return;
  filters||=createRecordFilters('logs',data.fields.map(key=>[key,labels[key]||key]),loadAudit,{dates:true});
  filters.options(data.options);filters.page(data);
  $('logs-metrics').innerHTML=metricCards((data.metrics.cards||[['Resultados',data.metrics.total,''],['Por revisar',data.metrics.errors,'']]).map(([label,value,note])=>[t(label),value,note]));
  $('logs-note').textContent=data.limited?t('Histórico limitado.')+' '+data.limit:'';
  $('logs-head').innerHTML='<tr>'+data.columns.map(key=>'<th>'+escape(t(labels[key]||key))+'</th>').join('')+'</tr>';
  $('logs-body').innerHTML=data.items.map(row=>'<tr>'+data.columns.map(key=>{
   let value=row[key]??'—',html=escape(value);
   if(['fecha','inicio','fin'].includes(key))html=escape(date(value));
   if(['edition','edicion'].includes(key)&&value&&value!=='—')html='<button class="text-button" data-open-edition="'+escape(value)+'">'+escape(value)+'</button><details data-newsletter-summary="'+escape(value)+'"><summary>'+t('Resumen enviado')+'</summary><div data-summary-content></div></details>';
   if(key==='url'&&validUrl(value))html='<a href="'+escape(value)+'" target="_blank" rel="noopener noreferrer">'+t('Fuente')+' ↗</a>';
   return '<td data-label="'+escape(t(labels[key]||key))+'" data-original>'+html+'</td>';
  }).join('')+'</tr>').join('')||'<tr><td colspan="'+data.columns.length+'">'+t('Sin entradas con estos filtros.')+'</td></tr>';
 }catch(error){if(current===request)message(error.message,true);}
}
$('logs-view').addEventListener('change',loadAudit);
attachNewsletterSummaries($('logs-body'));
$('logs-export').addEventListener('click',async()=>{
 const button=$('logs-export');button.disabled=true;
 try{const result=await call('exportAdminLogs',view||'runs',filters?.query()||{}),url=URL.createObjectURL(new Blob([result.csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='logs-'+view+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){message(error.message,true);}finally{button.disabled=false;}
});
