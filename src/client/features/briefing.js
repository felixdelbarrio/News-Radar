import {geographyLabel} from '../../shared/selection-policy.js';
import {createGeographyTabs} from './geography-tabs.js';
import {noveltyGroups,noveltyCount} from '../../shared/novelty-groups.js';
import {articleTranslationNote,articleOriginal,articleHeader} from './article-text.js';
import {formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import { $, escape, validUrl, newsPublisher, newsCoverage, newsTaxonomy } from '../core/dom.js';
export function createBriefing(){
  let briefing,groups=[],active='';
  const tabs=createGeographyTabs('briefing-geographies','briefing-list',name=>{active=name;paint();});
  function paint(){
    const group=groups.find(row=>row.name===active),stats=group||briefing;
    tabs.render(groups,active);
    $('briefing-geography-summary').textContent=group?t('{geography} · {updates} · {entities}',{geography:t(geographyLabel(group.name)),updates:noveltyCount(stats.total,'novedad','novedades',t),entities:noveltyCount(group.entityCount,'entidad','entidades',t)}):'';

    $('briefing-count').textContent='Novedades detectadas: '+stats.total;
    $('briefing-signals').innerHTML=stats.bySignal.map(row=>`<button type="button" class="signal-card" data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(row.name)}</span></button>`).join('');
    $('briefing-list').innerHTML=(group?.entities.flatMap(entity=>entity.items)||[]).map(row=>`<article class="panel novelty-card">${articleHeader(row,`${newsCoverage(row)}${newsTaxonomy(row)}${row.senales.map(signal=>`<span class="badge">${escape(signal)}</span>`).join('')}<time datetime="${escape(row.fecha)}">${escape(formatCalendarDay(row.fecha,language))}</time>${newsPublisher(row)}`)}${articleTranslationNote(row)}<h3 data-original><a href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">${escape(row.titular)}</a></h3><p class="novelty-context">${escape(row.entidad)} · ${escape(row.tipo)} · ${escape(row.pais)}</p><p ${row.extracto?'data-original':''}>${escape(row.extracto||'Consulta la fuente original para conocer la oferta y sus condiciones.')}</p>${articleOriginal(row)}<div class="novelty-use"><span class="eyebrow">SEGMENTO Y TEMA</span><p>${escape(row.segmentos.length?row.segmentos.join(' · '):'Segmento no identificado')} · ${escape(row.tema)}</p></div><a class="button" href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">Consultar anuncio ↗</a></article>`).join('')||'<div class="panel empty"><h2>No hay novedades detectadas en esta selección.</h2><p>Amplía entidades o segmentos. Una noticia sin señales de producto permanece disponible en Noticias.</p></div>';
    $('briefing-limit').hidden=!group||stats.total<=group.items.length;
  }
  return {get geography(){return active;},render(data){
    briefing=data.briefing||{total:0,bySignal:[],geographies:[],items:[]};
    const stats=new Map(briefing.geographies.map(row=>[row.name,row]));groups=noveltyGroups(briefing.items).map(group=>({...group,...stats.get(group.name)}));
    if(!groups.some(row=>row.name===active))active=groups[0]?.name||'';
    paint();
  }};
}
