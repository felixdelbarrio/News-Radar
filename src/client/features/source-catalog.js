import {identityMark} from '../../shared/visual-identity.js';
import {$,escape,validUrl} from '../core/dom.js';
import {createRecordFilters} from './record-filters.js';
import {filterRecords,recordOptions,recordPage} from '../../shared/record-filters.js';
const sourceTypes={profile:'Google News RSS',rss:'RSS del editor'};
export function createSourceCatalog(){
  let groups={all:[],profile:[],rss:[]},byId=new Map(),enabled=new Set(),pageSize=30,kind='all';
  const filters=createRecordFilters('source',[
    ['entity','Entidad'],['country','Geografía'],
    ['enabled','Estado',[['true','Activa'],['false','Inactiva']]]
  ],render,{placeholder:'Entidad, geografía o editor'});
  function render(){
    const query=filters.query(),
      rows=filterRecords(groups[kind],query,['entity','country','enabled'],['name','entity','country','url']),
      page=recordPage(rows,query,pageSize);
    $('configured-sources-body').innerHTML=page.items.map(feed=>`<tr><td><input type="checkbox" class="source-enabled" data-id="${escape(feed.id)}" aria-label="Activar ${escape(feed.name)}" ${feed.enabled?'checked':''}></td><td><span class="identity-label">${identityMark('entities',feed.entity,escape)}${escape(feed.name)}</span></td><td><span class="identity-label">${identityMark('countries',feed.country,escape)}${escape(feed.country)}</span></td><td>${sourceTypes[feed.kind]}</td><td><a href="${escape(validUrl(feed.url))}" target="_blank" rel="noopener noreferrer">Abrir feed ↗</a></td></tr>`).join('')||'<tr><td colspan="5">No hay fuentes con este criterio.</td></tr>';
    filters.page(page);
    $('configured-source-count').textContent=groups.all.length+' fuentes configuradas · '+enabled.size+' activas';
  }
  function select(next){
    if(!Object.hasOwn(groups,next)||next===kind)return;
    kind=next;
    $('source-tabs').querySelectorAll('[data-source-kind]').forEach(button=>{
      const active=button.dataset.sourceKind===kind;
      button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    $('source-panel').setAttribute('aria-labelledby','source-tab-'+kind);
    $('source-rss-editor').hidden=kind!=='rss';
    filters.reset();filters.options(recordOptions(groups[kind],['entity','country']));render();
  }
  $('source-tabs').addEventListener('click',event=>{
    const button=event.target.closest('[data-source-kind]');if(button)select(button.dataset.sourceKind);
  });
  $('source-tabs').addEventListener('keydown',event=>{
    if(!event.target.closest('[data-source-kind]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const kinds=Object.keys(groups),index=kinds.indexOf(kind),next=event.key==='Home'?0:event.key==='End'?kinds.length-1:(index+(event.key==='ArrowRight'?1:-1)+kinds.length)%kinds.length;
    select(kinds[next]);$('source-tab-'+kind).focus();
  });
  $('configured-sources-body').addEventListener('change',event=>{
    const input=event.target;if(!input.matches('.source-enabled'))return;
    byId.get(input.dataset.id).enabled=input.checked;
    if(input.checked)enabled.add(input.dataset.id);else enabled.delete(input.dataset.id);render();
  });
  return {
    update(rows,size){
      const feeds=rows.map(row=>({...row}));
      groups={all:feeds,profile:[],rss:[]};for(const feed of feeds)groups[feed.kind].push(feed);
      byId=new Map(feeds.map(feed=>[feed.id,feed]));pageSize=size;
      enabled=new Set(feeds.filter(feed=>feed.enabled).map(feed=>feed.id));
      filters.options(recordOptions(groups[kind],['entity','country']));render();
    },
    selected:()=>[...enabled]
  };
}
