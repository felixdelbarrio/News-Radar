import {attachNewsletterSummaries} from './newsletter-summary.js';
import {$,escape,date} from '../core/dom.js';
import {call} from '../core/api.js';
import {createRecordFilters} from './record-filters.js';
import {t} from '../core/language.js';
import {createJobMonitor,jobProgressHtml} from './job-monitor.js';
export function createNewsletterDelivery({run,isActive}){
  function feedback(text,error=false){const target=$('newsletter-test-result');target.hidden=false;target.textContent=text;target.classList.toggle('error',error);}
  const monitor=createJobMonitor({id:'newsletter-delivery',get:'getNewsletterProgress',isActive,render({job}){
    $('newsletter-delivery-progress').innerHTML=jobProgressHtml(job,{total:job.total,done:job.processed,label:'Progreso de envíos planificados',summary:t('{done}/{total} entregas; {accepted} aceptadas; {empty} sin novedades; {pending} pendientes; {review} por revisar.',{...job,done:job.processed})});
  }});
  let historyFilters,historyRequest=0;
  async function history(){
    historyFilters||=createRecordFilters('delivery',[['correo','Suscriptor'],['estado','Estado'],['suscripcion','Suscripción']],history,{dates:true,placeholder:'Gmail ID, correo o motivo'});
    const request=++historyRequest,data=await call('getNewsletterHistory',historyFilters.query());if(request!==historyRequest)return;
    historyFilters.options(data.options);historyFilters.page(data);
    $('delivery-history-body').innerHTML=data.items.map(row=>`<tr><td>${escape(date(row.fecha))}</td><td>${escape(row.correo)}</td><td>${escape(row.estado)}</td><td>${row.noticias??'Sin detalle'}</td><td>${escape(row.detalle)}${row.edition?`<details data-newsletter-summary="${escape(row.edition)}"><summary>Resumen enviado</summary><div data-summary-content></div></details>`:''}</td></tr>`).join('')||'<tr><td colspan="5">Sin envíos con estos filtros.</td></tr>';
    $('delivery-history-note').textContent=data.total+' coincidencias.'+(data.limited?' Histórico visible limitado a '+data.limit+' registros; el control de duplicados conserva el historial completo.':'');
  }
  async function open(){
    const [status,options]=await Promise.all([call('getNewsletterDeliveryStatus'),call('getNewsletterOptions'),history(),monitor.open()]);
    const form=$('newsletter-test-form'),selected=form.elements.country.value;form.elements.email.placeholder=options.email;form.elements.country.innerHTML='<option value="">Sin personalizar</option>'+options.countries.map(name=>'<option>'+escape(name)+'</option>').join('');form.elements.country.value=selected;
    $('newsletter-sender').textContent=status.name+' <'+status.address+'>';
    $('newsletter-checks').innerHTML=[['Remitente',status.available?'Configurado':'Pendiente'],['Entrega',status.enabled?'Activada':'Desactivada'],['Programación',status.scheduled?'Instalada':'Sin activador']].map(([name,value])=>`<div class="delivery-check"><strong>${name}</strong><span>${value}</span></div>`).join('');
    $('newsletter-sender-status').textContent=status.available?'El remitente se utiliza en los envíos automáticos y las pruebas.':status.error;
    $('newsletter-budget').textContent=status.remaining+' envíos disponibles dentro del límite configurado de 24 horas.';
    $('newsletter-content-note').textContent=status.untracked?status.untracked+' envíos anteriores no registraron las noticias incluidas. El control de contenido se aplica a los envíos con inventario; los anteriores requieren contrastar los correos originales.':'El contenido de los nuevos envíos queda registrado por suscriptor. Las pruebas se excluyen del control de duplicados.';
    const last=status.last;
    $('newsletter-history').innerHTML=last?`<strong>Último intento · ${escape(date(last.fecha))}</strong><span>${escape(last.estado)} · ${escape(last.correo)}</span><span>${escape(last.detalle)}</span>`:'<span>No hay intentos de envío registrados.</span>';
  }
  attachNewsletterSummaries($('delivery-history-body'));
  $('newsletter-test-form').addEventListener('submit',event=>{event.preventDefault();const form=event.target;if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));run(async()=>{feedback('Procesando solicitud…');try{const result=await call('sendNewsletterTest',data);feedback(result.accepted?t('Gmail ha aceptado la prueba para {recipient} · {count} novedades.',result):'No hay noticias para esta edición y geografía.');}catch(error){feedback(error.message,true);}await open();},false);});
  return {open,close:monitor.close};
}
