import {browserCountry} from '../core/browser-country.js';
import {geographyLabel,applicationGeography,REGION_CODES,regionalGeographies,geographyMatches,BRIEFING_ALLOWED_SIGNALS,briefingAllowed} from '../../shared/selection-policy.js';
import {createGeographyTabs} from './geography-tabs.js';
import {noveltyGroups,noveltyOverview,noveltyCount} from '../../shared/novelty-groups.js';
import {articleContent} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape} from '../core/dom.js';
export function createBriefing({onExplore,onGeography=()=>{}}){
  let briefing,groups=[],active='',selection={},scope=[];
  const tabs=createGeographyTabs('briefing-geographies','briefing-list',name=>{active=name;onGeography(name);paint();});
  function paint(){
    const geography=applicationGeography(scope,selection.segment);let group=groups.find(row=>row.name===active);
    if(REGION_CODES.includes(active)){
      const items=briefing.items.filter(row=>geographyMatches(row,active,geography)),overview=briefing.regions?.find(row=>row.name===active)||noveltyOverview(items,BRIEFING_ALLOWED_SIGNALS,()=>active).geographies[0];
      group={total:0,entityCount:0,bySignal:BRIEFING_ALLOWED_SIGNALS.map(name=>({name,total:0})),...overview,name:active,items};
    }
    const stats=group||briefing;
    tabs.render(groups,active,regionalGeographies(briefing.items,geography).map(row=>briefing.regions?.find(region=>region.name===row.name)||row));
    $('briefing-geography-summary').textContent=group?t('{geography} · {updates} · {entities}',{geography:t(geographyLabel(group.name)),updates:noveltyCount(stats.total,'novedad','novedades',t),entities:noveltyCount(group.entityCount,'entidad','entidades',t)}):'';

    $('briefing-count').textContent=t('{count} publicaciones',{count:briefing.total});
    $('briefing-signals').innerHTML=stats.bySignal.map(row=>`<button type="button" class="signal-card" ${row.total?'':'disabled'} data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(t(row.name==='Incidencia operativa'?'Indisponibilidad / Incidencia operativa':row.name))}</span></button>`).join('');
    const rows=group?.items||[];
    $('briefing-list').innerHTML=rows.map(row=>`<article class="panel novelty-card">${articleContent(row,selection,true)}</article>`).join('')||'<div class="panel empty"><h3>'+t('No hay novedades de producto en esta selección.')+'</h3></div>';
    $('briefing-limit').hidden=!group||stats.total<=group.items.length;
    $('briefing-explore').hidden=$('briefing-limit').hidden;
  }
  $('briefing-explore-news').addEventListener('click',()=>onExplore({...selection,country:active,newsGeography:active,page:0}));
  $('briefing-signals').addEventListener('click',event=>{const button=event.target.closest('[data-signal]');if(button)onExplore({...selection,country:'',newsGeography:active,signal:button.dataset.signal,page:0});});
  return {render(data){
    scope=data.applicationScope;selection=data.selection||{};briefing=data.briefing||{total:0,bySignal:[],geographies:[],items:[]};briefing={...briefing,items:briefing.items.filter(briefingAllowed),bySignal:briefing.bySignal.filter(row=>BRIEFING_ALLOWED_SIGNALS.includes(row.name))};
    const stats=new Map(briefing.geographies.map(row=>[row.name,row]));groups=noveltyGroups(briefing.items,applicationGeography(data.applicationScope,data.selection?.segment)).map(group=>({...group,...stats.get(group.name)}));
    if(selection.country)active=REGION_CODES.includes(selection.country)?selection.country:applicationGeography(scope,selection.segment)({pais:selection.country});
    if(!REGION_CODES.includes(active)&&!groups.some(row=>row.name===active))active=browserCountry(groups.map(row=>row.name))||groups[0]?.name||'';
    paint();
  }};
}
