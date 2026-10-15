import {t} from '../core/language.js';
import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {createRecordFilters} from './record-filters.js';
import {filterRecords,recordOptions,recordPage} from '../../shared/record-filters.js';
import {subscriptionForm,subscriptionCards,newsletterHistoryCards} from './subscription-templates.js';
import {attachNewsletterSummaries} from './newsletter-summary.js';
export function createSubscriptions({run}){
 let options,own=[],all=[],request=0,historyPage=0;const filters={};
 const editorId=admin=>admin?'admin-subscription-editor':'personal-editor';
 function edit(admin,row){const target=$(editorId(admin));target.hidden=false;target.innerHTML=subscriptionForm(options,admin,row);}
 function render(admin){if(!admin){$('subscriptions-list').innerHTML=subscriptionCards(own,false);return;}const id='subscribers',rows=all;
  filters[id]||=createRecordFilters(id,[...(admin?[['correo','Suscriptor']]:[]),['activa','Estado',[['true','Activa'],['false','Pausada']]]],()=>render(admin),{placeholder:'Correo o geografía'});
  filters[id].options(recordOptions(rows,admin?['correo']:[]));const selected=filterRecords(rows,filters[id].query(),admin?['correo','activa']:['activa'],['correo','nombre']),page=recordPage(selected,filters[id].query());
  $(admin?'admin-subscriptions-list':'subscriptions-list').innerHTML=subscriptionCards(page.items,admin);filters[id].page(page);
 }
 async function open(admin=false){const current=++request,[settings,rows,history]=await Promise.all([call('getNewsletterOptions'),call(admin?'getAdminSubscriptions':'getSubscriptions'),admin?null:call('getMyNewsletterHistory',{page:historyPage})]);if(current!==request)return;options=settings;
  if(admin){all=rows;$('subscribers-count').textContent=t('{subscribers} suscriptores · {subscriptions} suscripciones',{subscribers:rows.length,subscriptions:rows.length});}
  else{own=rows;$('subscriptions-count').textContent=rows.length?'Tu suscripción':'Sin suscripción';$('newsletter-delivery-status').textContent=settings.enabled?'Entrega automática activa.':'Las entregas comenzarán cuando la programación esté activada.';renderHistory(history);}
  render(admin);if(admin||rows.length)$(editorId(admin)).hidden=true;else edit(false);
 }
 for(const admin of [false,true]){
  const target=$(editorId(admin));target.addEventListener('click',event=>{if(event.target.closest('[data-close-editor]'))target.hidden=true;});
  target.addEventListener('submit',event=>{event.preventDefault();const form=event.target,data=new FormData(form),row=(admin?all:own).find(row=>row.id===form.dataset.id);run(async()=>{message(await call(admin?'saveAdminSubscription':'saveSubscription',{id:row?.id,email:data.get('email'),country:data.get('country'),language:data.get('language'),active:row?.activa!==false}));await open(admin);},false);});
  if(admin)$('new-admin-subscription').addEventListener('click',()=>edit(true));
  $(admin?'admin-subscriptions-list':'subscriptions-list').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const row=(admin?all:own).find(row=>row.id===button.dataset.id);if(!row)return;if(button.dataset.action==='edit')edit(admin,row);else run(async()=>{message(await call(button.dataset.action==='delete'?(admin?'deleteAdminSubscription':'deleteSubscription'):(admin?'saveAdminSubscription':'saveSubscription'),button.dataset.action==='delete'?row.id:{id:row.id,email:row.correo,country:row.filtros.country,language:row.idioma,active:!row.activa}));await open(admin);},false);});
 }
 function renderHistory(history){historyPage=history.page;$('personal-history').innerHTML=newsletterHistoryCards(history.items);const pages=Math.ceil(history.total/history.pageSize);$('personal-history-pages').innerHTML=pages>1?'<button class="button" data-history-page="-1" '+(historyPage===0?'disabled':'')+'>Anterior</button><span>'+t('Página {page} de {pages}',{page:historyPage+1,pages})+'</span><button class="button" data-history-page="1" '+(historyPage>=pages-1?'disabled':'')+'>Siguiente</button>':'';}
 $('personal-history-pages').addEventListener('click',event=>{const button=event.target.closest('[data-history-page]');if(!button||button.disabled)return;run(async()=>{const data=await call('getMyNewsletterHistory',{page:historyPage+Number(button.dataset.historyPage)});renderHistory(data);},false);});
 attachNewsletterSummaries($('personal-history'));
 return {open};
}
