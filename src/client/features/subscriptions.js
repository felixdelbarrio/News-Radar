import {syncSegmentCoverage} from './segment-controls.js';
import {syncTaxonomyControls} from './taxonomy-controls.js';
import {t} from '../core/language.js';
import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {filterRecords,recordOptions,recordPage} from '../../shared/record-filters.js';
import {createRecordFilters} from './record-filters.js';
import {periods,subscriptionForm,subscriptionCards} from './subscription-templates.js';
export function createSubscriptions({run,onApply}){
  let options,own=[],all=[],request=0;
  const filters={};
  function render(admin){
    const id=admin?'subscribers':'subscriptions',rows=admin?all:own;
    filters[id]||=createRecordFilters(id,[...(admin?[['correo','Suscriptor']]:[]),['activa','Estado',[['true','Activa'],['false','Pausada']]],['periodicidad','Periodicidad',Object.entries(periods)]],()=>render(admin),{placeholder:'Correo, nombre o selección'});
    filters[id].options(recordOptions(rows,admin?['correo']:[]));
    const query=filters[id].query(),selected=filterRecords(rows.map(row=>({...row,selection:Object.values(row.filtros).join(' ')})),query,admin?['correo','activa','periodicidad']:['activa','periodicidad'],['correo','nombre','selection']),page=recordPage(selected,query);
    $(admin?'admin-subscriptions-list':'subscriptions-list').innerHTML=subscriptionCards(page.items,admin);filters[id].page(page);
  }
  const editorId=admin=>admin?'admin-subscription-editor':'personal-editor';
  function edit(admin,row){const target=$(editorId(admin));target.hidden=false;target.innerHTML=subscriptionForm(options,admin,row);}
  async function open(admin=false){
    const current=++request;
    const [settings,rows]=await Promise.all([call('getNewsletterOptions'),call(admin?'getAdminSubscriptions':'getSubscriptions')]);if(current!==request)return;options=settings;
    if(admin){all=rows;$('subscribers-count').textContent=t('{subscribers} suscriptores · {subscriptions} suscripciones',{subscribers:new Set(rows.map(r=>r.correo)).size,subscriptions:rows.length});render(true);}
    else{own=rows;$('subscriptions-count').textContent=t('{subscriptions} suscripciones · {active} activas',{subscriptions:rows.length,active:rows.filter(row=>row.activa).length});render(false);$('newsletter-delivery-status').textContent=options.enabled?'Entrega periódica activa. Recibirás el contenido de tu selección según su periodicidad.':'Puedes guardar tu suscripción. El administrador todavía debe activar la entrega.';}
    edit(admin);if(admin)$(editorId(admin)).hidden=true;if(!admin)$('newsletter-default-period').textContent=periods[options.defaults.periodicity]+' por defecto';
  }
  for(const admin of [false,true]){
    const target=$(editorId(admin));
    target.addEventListener('click',event=>{if(event.target.closest('[data-close-editor]'))target.hidden=true;});
    target.addEventListener('change',event=>{syncSegmentCoverage(event.target.form,event.target.name);if(['palanca','subpalanca'].includes(event.target.name))syncTaxonomyControls(event.target.form,options.catalogs.subpalanca||[],event.target.name);});
    target.addEventListener('submit',event=>{event.preventDefault();const form=event.target,data=new FormData(form),filters={};for(const key of [...Object.keys(options.catalogs),'search'])filters[key]=String(data.get(key)||'');run(async()=>{message(await call(admin?'saveAdminSubscription':'saveSubscription',{id:form.dataset.id||undefined,email:data.get('email'),periodicity:data.get('periodicity'),language:data.get('language'),active:data.has('active'),filters}));await open(admin);},false);});
    $(admin?'new-admin-subscription':'new-subscription').addEventListener('click',()=>edit(admin));
    $(admin?'admin-subscriptions-list':'subscriptions-list').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const row=(admin?all:own).find(r=>r.id===button.dataset.id);if(!row)return;if(button.dataset.action==='edit')edit(admin,row);if(button.dataset.action==='apply')onApply(row.query);if(button.dataset.action==='test')run(async()=>{const result=await call('sendSubscriptionTest',row.id);message(result.accepted?t('Gmail ha aceptado la prueba para {recipient} · {count} novedades.',result):t('No se ha enviado la prueba: no hay noticias disponibles con estos filtros en el período.'));},false);if(button.dataset.action==='delete')run(async()=>{message(await call('deleteSubscription',row.id));await open();},false);});
  }
  return {open};
}
