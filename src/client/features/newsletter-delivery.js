import {$,escape,date} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function createNewsletterDelivery({run}){
  function feedback(text,error=false){const target=$('newsletter-test-result');target.hidden=false;target.textContent=text;target.classList.toggle('error',error);}
  async function open(){
    const [status,options]=await Promise.all([call('getNewsletterDeliveryStatus'),call('getNewsletterOptions')]);
    const form=$('newsletter-test-form'),selected=form.elements.country.value;form.elements.email.placeholder=options.email;form.elements.country.innerHTML='<option value="">Sin personalizar</option>'+options.countries.map(name=>'<option>'+escape(name)+'</option>').join('');form.elements.country.value=selected;
    $('newsletter-sender').textContent=status.name+' <'+status.address+'>';
    $('newsletter-checks').innerHTML=[['Remitente',status.available?'Configurado':'Pendiente'],['Entrega',status.enabled?'Activada':'Desactivada'],['Programación',status.scheduled?'Instalada':'Sin activador']].map(([name,value])=>`<div class="delivery-check"><strong>${name}</strong><span>${value}</span></div>`).join('');
    $('newsletter-sender-status').textContent=status.available?'El remitente se utiliza en los envíos automáticos y las pruebas.':status.error;
    $('newsletter-budget').textContent=status.remaining+' envíos disponibles dentro del límite configurado de 24 horas.';
    $('newsletter-content-note').textContent=status.untracked?status.untracked+' envíos anteriores no registraron las noticias incluidas. El control de contenido se aplica a los envíos con inventario; los anteriores requieren contrastar los correos originales.':'El contenido de los nuevos envíos queda registrado por suscriptor. Las pruebas se excluyen del control de duplicados.';
    const last=status.last;
    $('newsletter-history').innerHTML=last?`<strong>Último intento · ${escape(date(last.fecha))}</strong><span>${escape(last.estado)} · ${escape(last.correo)}</span><span>${escape(last.detalle)}</span>`:'<span>No hay intentos de envío registrados.</span>';
  }
  $('newsletter-test-form').addEventListener('submit',event=>{event.preventDefault();const form=event.target;if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));run(async()=>{feedback('Procesando solicitud…');try{const result=await call('sendNewsletterTest',data);feedback(result.accepted?t('Gmail ha aceptado la prueba para {recipient} · {count} novedades.',result):'No hay noticias para esta edición y geografía.');}catch(error){feedback(error.message,true);}await open();},false);});
  return {open};
}
