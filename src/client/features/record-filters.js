import {$,escape,message} from '../core/dom.js';
import {recordQuery} from '../../shared/record-filters.js';
export function createRecordFilters(id,fields,onChange,{dates=false,placeholder='Buscar'}={}){
  let page=0,timer;
  const keys=['search',...fields.map(([key])=>key),...(dates?['from','to']:[])];
  $(id+'-filters').innerHTML='<div class="record-filters"><label>Buscar<input type="search" id="'+id+'-search" placeholder="'+escape(placeholder)+'"></label>'+fields.map(([key,label,values])=>'<label>'+escape(label)+'<select id="'+id+'-'+key+'"><option value="">Todos</option>'+options(values||[])+'</select></label>').join('')+(dates?['from','to'].map((key,i)=>'<label>'+['Desde','Hasta'][i]+'<input type="date" id="'+id+'-'+key+'"></label>').join(''):'')+'<button class="button" type="button" id="'+id+'-clear">Limpiar filtros</button></div>';
  function options(values){return values.map(value=>{const [key,label]=Array.isArray(value)?value:[value,value];return '<option value="'+escape(key)+'">'+escape(label)+'</option>';}).join('');}
  function change(){clearTimeout(timer);page=0;try{query();Promise.resolve(onChange()).catch(error=>message(error.message,true));}catch(error){message(error.message,true);}}
  function query(){return recordQuery(Object.fromEntries([...keys.map(key=>[key,$(id+'-'+key).value]),['page',page]]),fields.map(([key])=>key));}
  for(const key of keys)$(id+'-'+key).addEventListener(key==='search'?'input':'change',()=>{if(key==='search'){clearTimeout(timer);timer=setTimeout(change,250);}else change();});
  $(id+'-clear').addEventListener('click',()=>{keys.forEach(key=>$(id+'-'+key).value='');change();});
  $(id+'-pagination').addEventListener('click',event=>{const button=event.target.closest('[data-page]');if(!button||button.disabled)return;page+=Number(button.dataset.page);Promise.resolve(onChange()).catch(error=>message(error.message,true));});
  return {query,options(values){for(const [key,list] of Object.entries(values)){if(!fields.some(([field])=>field===key))continue;const input=$(id+'-'+key),value=input.value;input.innerHTML='<option value="">Todos</option>'+options(list);input.value=list.some(item=>String(Array.isArray(item)?item[0]:item)===value)?value:'';}},page(data){page=data.page;const pages=Math.max(1,Math.ceil(data.total/data.pageSize));$(id+'-pagination').innerHTML='<button class="button" type="button" data-page="-1" '+(page===0?'disabled':'')+'>Anterior</button><span class="small muted" role="status">'+data.total+' resultados · página '+(page+1)+' de '+pages+'</span><button class="button" type="button" data-page="1" '+(page>=pages-1?'disabled':'')+'>Siguiente</button>';}};
}
