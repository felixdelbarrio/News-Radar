import {t,language} from '../core/language.js';
import {taxonomyDisplayLabel} from '../../shared/taxonomy-path.js';
import {displayRecord} from '../../shared/locales.js';
import {$,escape,message} from '../core/dom.js';
import {recordQuery} from '../../shared/record-filters.js';
export function createRecordFilters(id,fields,onChange,{dates=false,placeholder='Buscar'}={}){
  let page=0,timer;
  const keys=['search',...fields.map(([key])=>key),...(dates?['from','to']:[])];
  $(id+'-filters').innerHTML='<button type="button" class="button" id="'+id+'-open-filters">'+t('Filtros')+'<span class="filter-count" id="'+id+'-filter-count"></span></button><dialog class="filter-dialog admin-record-dialog" id="'+id+'-dialog" aria-label="'+t('Filtros')+'"><div class="panel-header"><h2>'+t('Filtros')+'</h2><button type="button" class="button" id="'+id+'-close-filters">'+t('Cerrar')+'</button></div><div class="record-filters"><label>Buscar<input type="search" id="'+id+'-search" placeholder="'+escape(placeholder)+'"></label>'+fields.map(([key,label,values])=>'<label>'+escape(label)+'<select id="'+id+'-'+key+'"><option value="">Todos</option>'+options(values||[])+'</select></label>').join('')+(dates?['from','to'].map((key,i)=>'<label>'+['Desde','Hasta'][i]+'<input type="date" id="'+id+'-'+key+'"></label>').join(''):'')+'<button class="button" type="button" id="'+id+'-clear">Limpiar filtros</button></div></dialog>';
  const dialog=$(id+'-dialog');
  $(id+'-open-filters').addEventListener('click',()=>dialog.showModal());
  $(id+'-close-filters').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  function options(values){return values.map(value=>{const [key,label]=Array.isArray(value)?value:[value,value];return '<option'+(/^\d{2}\./.test(label)?' data-catalog-name="'+escape(label)+'"':'')+' value="'+escape(key)+'">'+escape(/^\d{2}\./.test(label)?taxonomyDisplayLabel(t(label)):displayRecord(label,language))+'</option>';}).join('');}
  function change(){clearTimeout(timer);page=0;const active=keys.filter(key=>$(id+'-'+key).value).length;$(id+'-filter-count').textContent=active?' · '+active:'';try{query();Promise.resolve(onChange()).catch(error=>message(error.message,true));}catch(error){message(error.message,true);}}
  function query(){return recordQuery(Object.fromEntries([...keys.map(key=>[key,$(id+'-'+key).value]),['page',page]]),fields.map(([key])=>key));}
  for(const key of keys)$(id+'-'+key).addEventListener(key==='search'?'input':'change',()=>{if(key==='search'){clearTimeout(timer);timer=setTimeout(change,250);}else change();});
  $(id+'-clear').addEventListener('click',()=>{keys.forEach(key=>$(id+'-'+key).value='');change();});
  const pagination=$(id+'-pagination'),paginate=event=>{const button=event.target.closest('[data-page]');if(!button||button.disabled)return;page+=Number(button.dataset.page);Promise.resolve(onChange()).catch(error=>message(error.message,true));};pagination?.addEventListener('click',paginate);
  return {query,destroy(){clearTimeout(timer);pagination?.removeEventListener?.('click',paginate);dialog.close();},reset(){clearTimeout(timer);page=0;},options(values){for(const [key,list] of Object.entries(values)){if(!fields.some(([field])=>field===key))continue;const input=$(id+'-'+key),value=input.value;input.innerHTML='<option value="">Todos</option>'+options([...list].sort((a,b)=>taxonomyDisplayLabel(t(String(Array.isArray(a)?a[1]:a))).localeCompare(taxonomyDisplayLabel(t(String(Array.isArray(b)?b[1]:b))),language)));input.value=list.some(item=>String(Array.isArray(item)?item[0]:item)===value)?value:'';}},page(data){if(!$(id+'-pagination'))return;page=data.page;const pages=Math.max(1,Math.ceil(data.total/data.pageSize));$(id+'-pagination').innerHTML='<button class="button" type="button" data-page="-1" '+(page===0?'disabled':'')+'>Anterior</button><span class="small muted" role="status">'+t('{total} resultados · página {page} de {pages}',{total:data.total,page:page+1,pages})+'</span><button class="button" type="button" data-page="1" '+(page>=pages-1?'disabled':'')+'>'+t('Ver más')+'</button>';}};
}
