import {$,escape,validUrl} from '../core/dom.js';
import {createRecordFilters} from './record-filters.js';
import {filterRecords,recordOptions,recordPage} from '../../shared/record-filters.js';
export function createSourceCatalog(){
  let feeds=[],enabled=new Set(),pageSize=30;
  const filters=createRecordFilters('source',[['entity','Entidad'],['country','Geografía'],['kind','Tipo',[['profile','Google News RSS'],['rss','RSS del editor']]],['enabled','Estado',[['true','Activa'],['false','Inactiva']]]],render,{placeholder:'Entidad, geografía o editor'});
  function render(){
    const query=filters.query(),rows=filterRecords(feeds.map(feed=>({...feed,enabled:enabled.has(feed.id)})),query,['entity','country','kind','enabled'],['name','entity','country','url']),page=recordPage(rows,query,pageSize);
    $('configured-sources-body').innerHTML=page.items.map(feed=>`<tr><td><input type="checkbox" class="source-enabled" data-id="${escape(feed.id)}" aria-label="Activar ${escape(feed.name)}" ${enabled.has(feed.id)?'checked':''}></td><td>${escape(feed.name)}</td><td>${escape(feed.country)}</td><td>${feed.kind==='profile'?'Google News RSS':'RSS del editor'}</td><td><a href="${escape(validUrl(feed.url))}" target="_blank" rel="noopener noreferrer">Abrir feed ↗</a></td></tr>`).join('')||'<tr><td colspan="5">No hay fuentes con este criterio.</td></tr>';
    filters.page(page);
    $('configured-source-count').textContent=feeds.length+' fuentes configuradas · '+enabled.size+' activas';
  }
  $('configured-sources-body').addEventListener('change',event=>{const input=event.target;if(!input.matches('.source-enabled'))return;if(input.checked)enabled.add(input.dataset.id);else enabled.delete(input.dataset.id);render();});
  return {update(rows,size){feeds=rows;pageSize=size;enabled=new Set(rows.filter(row=>row.enabled).map(row=>row.id));filters.options(recordOptions(rows,['entity','country']));render();},selected:()=>[...enabled]};
}
