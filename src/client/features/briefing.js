import {browserCountry} from '../core/browser-country.js';
import {geographyLabel,applicationGeography} from '../../shared/selection-policy.js';
import {createGeographyTabs} from './geography-tabs.js';
import {noveltyGroups,noveltyCount} from '../../shared/novelty-groups.js';
import {articleContent} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape} from '../core/dom.js';
export function createBriefing({onExplore}){
  let briefing,groups=[],active='',selection={},problemSignals=new Set();
  const tabs=createGeographyTabs('briefing-geographies','briefing-list',name=>{active=name;paint();});
  function paint(){
    const group=groups.find(row=>row.name===active),stats=group||briefing;
    tabs.render(groups,active);
    $('briefing-geography-summary').textContent=group?t('{geography} · {updates} · {entities}',{geography:t(geographyLabel(group.name)),updates:noveltyCount(stats.total,'novedad','novedades',t),entities:noveltyCount(group.entityCount,'entidad','entidades',t)}):'';

    $('briefing-count').textContent=t('{count} publicaciones',{count:briefing.total});
    $('briefing-signals').innerHTML=stats.bySignal.map(row=>`<button type="button" class="signal-card" ${row.total?'':'disabled'} data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(t(row.name))}</span></button>`).join('');
    const rows=group?.entities.flatMap(entity=>entity.items)||[],problem=row=>row.senales.some(name=>problemSignals.has(name)),cards=items=>items.map(row=>`<article class="panel novelty-card">${articleContent(row,selection,true)}</article>`).join(''),issues=rows.filter(problem),updates=rows.filter(row=>!problem(row));
    $('briefing-list').innerHTML=cards(updates)||'<div class="panel empty"><h3>'+t('No hay novedades de producto en esta selección.')+'</h3></div>';
    $('briefing-problems').innerHTML=cards(issues)||'<div class="panel empty"><p>'+t('No se han detectado noticias de problemas de servicio en esta selección.')+'</p></div>';
    $('briefing-limit').hidden=!group||stats.total<=group.items.length;
  }
  $('briefing-signals').addEventListener('click',event=>{const button=event.target.closest('[data-signal]');if(button)onExplore({...selection,country:'',newsGeography:active,signal:button.dataset.signal,page:0});});
  return {render(data){
    selection=data.selection||{};problemSignals=new Set(data.problemSignals||[]);briefing=data.briefing||{total:0,bySignal:[],geographies:[],items:[]};
    const stats=new Map(briefing.geographies.map(row=>[row.name,row]));groups=noveltyGroups(briefing.items,applicationGeography(data.applicationScope,data.selection?.segment)).map(group=>({...group,...stats.get(group.name)}));
    if(!groups.some(row=>row.name===active))active=browserCountry(groups.map(row=>row.name))||groups[0]?.name||'';
    paint();
  }};
}
