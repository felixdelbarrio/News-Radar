import {REGION_CODES,otherGeography} from '../../shared/selection-policy.js';
import {$,escape,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
import {recordText} from '../../shared/record-filters.js';
import {createRecordFilters} from './record-filters.js';
import schema from '../../../assets/admin-schema.json';
const capabilityFields=[['name','Capacidad de detección','text'],['terms','Términos de búsqueda','list'],['enabled','Activa','boolean']];
export function createConfiguration({run}){
 let config,revision,category='entities',capabilityDefaults,storagePrimaryId;
 const entries=()=>config[category==='applicationScope'?'geographies':category],list=input=>input.value.split(/[;\n]/).map(value=>value.trim()).filter(Boolean),read=input=>input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.dataset.list==='true'?list(input):input.value.trim();
 const filters=createRecordFilters('configuration',[['enabled','Estado',[['true','Activa'],['false','Inactiva']]]],filterRows,{placeholder:'Nombre, código o término'});
 async function fetchConfig(){const snapshot=await call('getConfiguration');config=snapshot.config;revision=snapshot.revision;capabilityDefaults=snapshot.capabilityDefaults;storagePrimaryId=snapshot.storagePrimaryId;}
 function record(row){return Object.fromEntries([...row.querySelectorAll('[data-key]')].map(input=>[input.dataset.key,read(input)]));}
 function readFields(){
  if(!config)return;
  if(category==='applicationScope'){
   const countries=[...$('catalog-fields').querySelectorAll('[data-geography]')];
   config.geographies=countries.map(record);
   config.applicationScope=[{name:config.applicationScope[0].name,countries:countries.filter(row=>row.querySelector('[data-country]').checked).map(row=>record(row).name)}];
  }
  else if(category==='taxonomy'){
   config.settings.searchTerms=list($('catalog-search-terms'));
   config.capabilities.Empresas=[...$('catalog-fields').querySelectorAll('[data-capability]')].map(record);
   config.taxonomy=[...$('catalog-fields').querySelectorAll('[data-taxonomy-block]')].map(block=>({name:block.querySelector('[data-key="name"]').value.trim(),terms:list(block.querySelector('[data-key="terms"]')),emerging:[...block.querySelectorAll('[data-emerging]')].map(record),functions:[...block.querySelectorAll('[data-function]')].map(record)}));
  }else if(schema[category].groups){for(const group of $('catalog-fields').querySelectorAll('[data-config-section]'))for(const input of group.querySelectorAll('[data-key]'))config[group.dataset.configSection][input.dataset.key]=read(input);}
  else config[category]=[...$('catalog-fields').children].map(record);
 }
 function fields(definitions,row){return definitions.map(([key,label,type,choices])=>`<label class="${type==='list'?'catalog-terms':''}">${escape(t(label))}${type==='choice'?`<select data-key="${key}">${choices.map(([value,label])=>`<option value="${escape(value)}" ${row[key]===value?'selected':''}>${escape(t(label))}</option>`).join('')}</select>`:type==='boolean'?`<input type="checkbox" data-key="${key}" ${row[key]?'checked':''}>`:type==='list'?`<textarea data-key="${key}" data-list="true" rows="${Math.min(8,Math.max(3,(row[key]||[]).length))}" spellcheck="false">${escape((row[key]||[]).join('\n'))}</textarea><span class="small muted">${t('Un término por línea')} · ${(row[key]||[]).length}</span>`:`<input data-key="${key}" type="${type==='number'?'number':'text'}" ${type==='readonly'?'readonly':''} value="${escape(row[key]??'')}">`}</label>`).join('');}
 function filterRows(){
  const query=filters.query(),term=recordText(query.search),rows=[...$('catalog-fields').querySelectorAll(category==='applicationScope'?'[data-geography]':':scope > *')];let shown=0;
  for(const row of rows){const enabled=row.querySelector('[data-key="enabled"]');if(enabled)row.dataset.enabled=String(enabled.checked);const text=row.textContent+' '+[...row.querySelectorAll('input,textarea')].map(input=>input.value).join(' '),match=(!term||recordText(text).includes(term))&&(!query.enabled||!row.hasAttribute('data-enabled')||row.dataset.enabled===query.enabled);row.hidden=!match;if(match)shown++;}
  $('catalog-count').textContent=t('{shown} de {total} entradas',{shown,total:rows.length});
 }
 function render(){
  const meta=schema[category];$('capability-toolbar').hidden=category!=='taxonomy';$('catalog-help').textContent=t(meta.help)+(category==='storage'?' ID: '+storagePrimaryId:'');$('catalog-add').hidden=Boolean(meta.groups)||category==='taxonomy';
  let html;
  if(category==='taxonomy')html=`<details class="catalog-row" data-config-detection><summary><strong>${t('Detección de canal digital y búsquedas')}</strong></summary><p class="muted">${t('Estos criterios recuperan y seleccionan noticias antes de asignar funcionalidades del catálogo maestro.')}</p><label class="catalog-terms">${t('Términos de búsqueda de sector')}<textarea id="catalog-search-terms" rows="5">${escape(config.settings.searchTerms.join('\n'))}</textarea><span class="small muted">${t('Un término por línea')}</span></label><button class="button" type="button" data-add-capability>${t('Añadir capacidad de detección')}</button>${config.capabilities.Empresas.map(row=>`<details class="catalog-row" data-capability><summary><strong>${escape(row.name)}</strong><span>${t(row.enabled?'Activa':'Inactiva')}</span></summary><div class="catalog-grid">${fields(capabilityFields,row)}</div><div class="actions"><button class="button" type="button" data-remove-capability>${t('Eliminar')}</button></div></details>`).join('')}</details>`+config.taxonomy.map((block,index)=>`<details class="catalog-row" data-taxonomy-block><summary><strong>${escape(block.name)}</strong><span>${block.functions.length} ${t('funcionalidades')}</span></summary><div class="catalog-grid">${fields([['name','Bloque funcional','readonly'],['terms','Equivalencias del bloque','list']],block)}</div>${block.functions.map(row=>`<details class="catalog-function" data-function><summary><strong>${escape(row.id+' · '+row.name)}</strong><span>${row.terms.length} ${t('equivalencias')}</span></summary><div class="catalog-grid">${fields([['id','Código','readonly'],['name','Funcionalidad / Sub Operativa','readonly'],['terms','Equivalencias de búsqueda','list'],['context','Contexto operativo requerido','list'],['exclude','Excluir coincidencias','list']],row)}</div></details>`).join('')}<h3>${t('Conceptos emergentes admitidos')}</h3><button type="button" class="button" data-add-emerging="${index}">${t('Añadir concepto emergente')}</button>${block.emerging.map(row=>`<div class="catalog-grid" data-emerging>${fields([['name','Funcionalidad / Sub Operativa','text'],['terms','Equivalencias de búsqueda','list'],['context','Contexto operativo requerido','list'],['exclude','Excluir coincidencias','list'],['primaryTerms','Productos concretos de fuente oficial','list'],['primary','Producto concreto respaldado por fuente oficial','boolean']],row)}<button type="button" class="button" data-remove-emerging>${t('Eliminar')}</button></div>`).join('')}</details>`).join('');
  else if(category==='applicationScope'){
   const regions=new Map(REGION_CODES.map(region=>[region,[]]));
   for(const country of config.geographies){const region=country.region||otherGeography;if(!regions.has(region))regions.set(region,[]);regions.get(region).push(country);}
   const scope=config.applicationScope[0];
   html=[...regions].map(([region,countries])=>`<fieldset class="catalog-group scope-group"><legend>${escape(t(region))}</legend><div class="scope-countries">${countries.map(country=>`<details class="catalog-row" data-geography data-enabled="${country.enabled}" ${country.name?'':'open'}><summary><strong>${escape(country.name||t('Nueva entrada'))}</strong><span>${t(country.enabled?'Activa':'Inactiva')}</span></summary><label class="scope-country"><input type="checkbox" data-country="${escape(country.name)}" ${scope.countries.includes(country.name)?'checked':''}><span>${t('Pestaña propia')}</span></label><div class="catalog-grid">${fields(meta.fields,country)}</div><button type="button" class="button" data-remove>${t('Eliminar')}</button></details>`).join('')}</div></fieldset>`).join('');
  }else if(meta.groups)html=meta.groups.map(group=>{const section=group.section||category;return `<fieldset class="catalog-group" data-config-section="${section}"><legend>${escape(t(group.label))}</legend><div class="catalog-settings">${group.keys.map(key=>{const value=config[section][key];return fields([[key,meta.labels[key],Array.isArray(value)?'list':typeof value==='number'?'number':typeof value==='boolean'?'boolean':'text']],config[section]);}).join('')}</div></fieldset>`;}).join('');
  else html=entries().map(row=>`<details class="catalog-row" data-enabled="${row.enabled}" ${row.name?'':'open'}><summary><strong>${escape(row.name||t('Nueva entrada'))}</strong><span>${escape(row.type||'')}${row.type?' · ':''}${t(row.enabled?'Activa':'Inactiva')}</span></summary><div class="catalog-grid">${fields(meta.fields,row)}</div><div class="actions"><button type="button" class="button" data-move="-1">${t('Subir')}</button><button type="button" class="button" data-move="1">${t('Bajar')}</button><button type="button" class="button" data-remove>${t('Eliminar')}</button></div></details>`).join('');
  $('catalog-fields').innerHTML=html;filterRows();
 }
 $('catalog-category').innerHTML=Object.entries(schema).map(([key,meta])=>`<option value="${key}">${escape(t(meta.label))}</option>`).join('');
 $('catalog-category').addEventListener('change',()=>{readFields();category=$('catalog-category').value;render();});
 $('catalog-fields').addEventListener('click',event=>{
  if(event.target.closest('[data-add-capability]')){readFields();config.capabilities.Empresas.push({name:'',terms:[],enabled:true});render();return;}
  const removeCapability=event.target.closest('[data-remove-capability]');if(removeCapability){removeCapability.closest('[data-capability]').remove();return;}
  const add=event.target.closest('[data-add-emerging]');if(add){readFields();config.taxonomy[Number(add.dataset.addEmerging)].emerging.push({name:'',terms:[]});render();return;}
  const emerging=event.target.closest('[data-remove-emerging]');if(emerging){emerging.closest('[data-emerging]').remove();return;}
  const remove=event.target.closest('[data-remove]');if(remove){remove.closest('.catalog-row').remove();return;}
  const move=event.target.closest('[data-move]');if(move){const row=move.closest('.catalog-row'),index=[...$('catalog-fields').children].indexOf(row),target=index+Number(move.dataset.move);readFields();if(target>=0&&target<entries().length){[entries()[index],entries()[target]]=[entries()[target],entries()[index]];render();}}
 });
 $('capability-restore').addEventListener('click',()=>{readFields();config.capabilities.Empresas=capabilityDefaults.Empresas.map(row=>({...row,terms:row.terms.slice()}));render();});
 $('catalog-add').addEventListener('click',()=>{readFields();entries().push(Object.fromEntries(schema[category].fields.map(([key,,type,choices])=>[key,type==='list'?[]:type==='boolean'?true:type==='choice'?choices[0][0]:''])));render();});
 $('catalog-form').addEventListener('submit',event=>{event.preventDefault();readFields();run(async()=>{message(await call('saveConfiguration',{config,revision}));await fetchConfig();render();});});
 $('catalog-reload').addEventListener('click',()=>run(async()=>{await fetchConfig();render();},false));
 return {open:()=>config?Promise.resolve():fetchConfig().then(render)};
}
