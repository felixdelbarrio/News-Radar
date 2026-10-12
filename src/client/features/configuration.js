import { $, escape, message, date } from '../core/dom.js';
import { call } from '../core/api.js';
import {t} from '../core/language.js';
import schema from '../../../assets/admin-schema.json';
export function createConfiguration({run,isActive}){
  let timer,request=0;
  let config,revision,category='entities',segment='Empresas',capabilityDefaults;
  function close(){request++;clearTimeout(timer);}
  function renderProgress(data){
    const job=data.job,total=Number(job?.total||0),done=Number(job?.processed||0),active=Boolean(data.queued||job&&job.state!=='Completada');
    $('classification-start').disabled=active&&job?.state!=='En pausa';
    $('classification-schedule').textContent=t('Clasificación diaria: {hour} · {timezone} · {state}. La recuperación diaria tiene prioridad.',{hour:String(data.hour).padStart(2,'0')+':'+String(data.minute).padStart(2,'0'),timezone:data.timezone,state:t(data.scheduled?'Activada':'Desactivada')});
    $('classification-progress').innerHTML=job?`<div class="panel-header"><span>${escape(t(data.queued?'En cola':job.state))}</span><span>${done}/${total}</span></div><progress max="${Math.max(1,total)}" value="${done}" aria-label="${escape(t('Progreso de clasificación'))}"></progress><p>${escape(t('{done}/{total} noticias revisadas; {classified} etiquetas actualizadas; {digital} digitales.',{done,total,classified:job.classified,digital:job.digital}))}</p><p class="small muted">${escape(t('Última actividad'))}: ${escape(date(job.updated))}</p>${job.error?'<p>'+escape(job.error)+'</p>':''}`:'<p class="muted">'+t(data.queued?'En cola':'Sin clasificaciones ejecutadas.')+'</p>';
    return active;
  }
  async function refreshProgress(){
    close();const current=request;
    try{const data=await call('getClassificationStatus');if(current!==request)return;if(renderProgress(data)&&isActive())timer=setTimeout(poll,30000);}
    catch(error){if(current===request){message(error.message,true);if(isActive())timer=setTimeout(poll,60000);}}
  }
  async function poll(){if(!isActive())return;if(document.hidden){timer=setTimeout(poll,30000);return;}await refreshProgress();}
  $('classification-start').addEventListener('click',()=>run(async()=>{await call('startClassification');await refreshProgress();},false));
  const entries=()=>category==='capabilities'?config.capabilities[segment]:config[category];
  const setEntries=rows=>{if(category==='capabilities')config.capabilities[segment]=rows;else config[category]=rows;};
  async function fetchConfig(){const snapshot=await call('getConfiguration');config=snapshot.config;revision=snapshot.revision;capabilityDefaults=snapshot.capabilityDefaults;}
  function readFields(){
    if(!config)return;
    if(category==='settings'){
      for(const input of $('catalog-fields').querySelectorAll('[data-key]'))config.settings[input.dataset.key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.dataset.list==='true'?input.value.split(';').map(value=>value.trim()).filter(Boolean):input.value;
    }else setEntries([...$('catalog-fields').children].map(row=>Object.fromEntries([...row.querySelectorAll('[data-key]')].map(input=>[input.dataset.key,input.type==='checkbox'?input.checked:input.dataset.list==='true'?input.value.split(';').map(value=>value.trim()).filter(Boolean):input.value]))));
  }
  function fields(fields,row){return fields.map(([key,label,type])=>`<label>${escape(label)}${type==='boolean'?`<input type="checkbox" data-key="${key}" ${row[key]?'checked':''}>`:`<input data-key="${key}" ${type==='list'?'data-list="true"':''} type="${type==='number'?'number':'text'}" value="${escape(type==='list'?(row[key]||[]).join('; '):row[key]??'')}">`}</label>`).join('');}
  function render(){
    const meta=schema[category];$('capability-toolbar').hidden=category!=='capabilities';$('capability-segment').value=segment;$('catalog-help').textContent=meta.help;$('catalog-add').hidden=category==='settings';
    $('catalog-fields').innerHTML=category==='settings'?schema.settings.groups.map(group=>`<fieldset class="catalog-group"><legend>${escape(group.label)}</legend><div class="catalog-settings">${group.keys.map(key=>{const value=config.settings[key];return fields([[key,schema.settings.labels[key],Array.isArray(value)?'list':typeof value==='number'?'number':typeof value==='boolean'?'boolean':'text']],config.settings);}).join('')}</div></fieldset>`).join(''):entries().map(row=>`<details class="catalog-row" ${row.name?"":"open"}><summary><strong>${escape(row.name||"Nueva entrada")}</strong><span>${escape(row.type||"")} · ${row.enabled?"Activa":"Inactiva"}</span></summary><div class="catalog-grid">${fields(meta.fields,row)}</div><div class="actions"><button type="button" class="button" data-move="-1">Subir</button><button type="button" class="button" data-move="1">Bajar</button><button type="button" class="button" data-remove>Eliminar</button></div></details>`).join('');
  }
  $('catalog-category').innerHTML=Object.entries(schema).map(([key,meta])=>`<option value="${key}">${escape(meta.label)}</option>`).join('');
  $('catalog-category').addEventListener('change',()=>{readFields();category=$('catalog-category').value;render();});
  $('catalog-fields').addEventListener('click',event=>{const remove=event.target.closest('[data-remove]');if(remove)remove.closest('.catalog-row').remove();const move=event.target.closest('[data-move]');if(move){const row=move.closest('.catalog-row'),index=[...$('catalog-fields').children].indexOf(row),target=index+Number(move.dataset.move);readFields();if(target>=0&&target<entries().length){[entries()[index],entries()[target]]=[entries()[target],entries()[index]];render();}}});
  $('capability-segment').addEventListener('change',()=>{readFields();segment=$('capability-segment').value;render();});
  $('capability-restore').addEventListener('click',()=>{readFields();config.capabilities[segment]=JSON.parse(JSON.stringify(capabilityDefaults[segment]));render();});
  $('catalog-add').addEventListener('click',()=>{readFields();entries().push(Object.fromEntries(schema[category].fields.map(([key,,type])=>[key,type==='list'?[]:type==='boolean'?true:''])));render();});
  $('catalog-form').addEventListener('submit',event=>{event.preventDefault();readFields();run(async()=>{message(await call('saveConfiguration',{config,revision}));await fetchConfig();render();await refreshProgress();});});
  $('catalog-reload').addEventListener('click',()=>run(async()=>{await fetchConfig();render();},false));
  return {async open(){if(!config){await fetchConfig();render();}await refreshProgress();},close};
}
