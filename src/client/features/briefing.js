import {geographyLabel} from '../../shared/selection-policy.js';
import {createGeographyTabs} from './geography-tabs.js';
import {noveltyGroups,noveltyCount} from '../../shared/novelty-groups.js';
import {articleContent} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape} from '../core/dom.js';
export function createBriefing(){
  let briefing,groups=[],active='',selection={};
  const tabs=createGeographyTabs('briefing-geographies','briefing-list',name=>{active=name;paint();});
  function paint(){
    const group=groups.find(row=>row.name===active),stats=group||briefing;
    tabs.render(groups,active);
    $('briefing-geography-summary').textContent=group?t('{geography} · {updates} · {entities}',{geography:t(geographyLabel(group.name)),updates:noveltyCount(stats.total,'novedad','novedades',t),entities:noveltyCount(group.entityCount,'entidad','entidades',t)}):'';

    $('briefing-count').textContent='Novedades detectadas: '+briefing.total;
    $('briefing-signals').innerHTML=stats.bySignal.map(row=>`<button type="button" class="signal-card" data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(row.name)}</span></button>`).join('');
    $('briefing-list').innerHTML=(group?.entities.flatMap(entity=>entity.items)||[]).map(row=>`<article class="panel novelty-card">${articleContent(row,selection,true)}</article>`).join('')||'<div class="panel empty"><h2>No hay novedades detectadas en esta selección.</h2><p>Amplía entidades o segmentos. Una noticia sin señales de producto permanece disponible en Noticias.</p></div>';
    $('briefing-limit').hidden=!group||stats.total<=group.items.length;
  }
  return {get geography(){return active;},render(data){
    selection=data.selection||{};briefing=data.briefing||{total:0,bySignal:[],geographies:[],items:[]};
    const stats=new Map(briefing.geographies.map(row=>[row.name,row]));groups=noveltyGroups(briefing.items).map(group=>({...group,...stats.get(group.name)}));
    if(!groups.some(row=>row.name===active))active=groups[0]?.name||'';
    paint();
  }};
}
