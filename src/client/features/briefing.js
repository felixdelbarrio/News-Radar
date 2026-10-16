import {browserCountry} from '../core/browser-country.js';
import {geographyLabel,applicationGeography} from '../../shared/selection-policy.js';
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

    $('briefing-count').textContent=t('{count} publicaciones',{count:briefing.total});
    $('briefing-signals').innerHTML=stats.bySignal.map(row=>`<article class="signal-card"><strong>${row.total}</strong><span>${escape(row.name)}</span></article>`).join('');
    $('briefing-list').innerHTML=(group?.entities.flatMap(entity=>entity.items)||[]).map(row=>`<article class="panel novelty-card">${articleContent(row,selection,true)}</article>`).join('')||'<div class="panel empty"><h2>No hay novedades detectadas en esta selección.</h2><p>Amplía la entidad, la geografía o el período. Las noticias sin novedades de producto están disponibles en Noticias.</p></div>';
    $('briefing-limit').hidden=!group||stats.total<=group.items.length;
  }
  return {render(data){
    selection=data.selection||{};briefing=data.briefing||{total:0,bySignal:[],geographies:[],items:[]};
    const stats=new Map(briefing.geographies.map(row=>[row.name,row]));groups=noveltyGroups(briefing.items,applicationGeography(data.applicationScope,data.selection?.segment)).map(group=>({...group,...stats.get(group.name)}));
    if(!groups.some(row=>row.name===active))active=browserCountry(groups.map(row=>row.name))||groups[0]?.name||'';
    paint();
  }};
}
