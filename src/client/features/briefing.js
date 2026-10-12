import {noveltyGroups,noveltyCount} from '../../shared/novelty-groups.js';
import {articleTranslationNote,articleOriginal} from './article-text.js';
import {formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import { $, escape, validUrl, newsPublisher, newsCoverage, newsTaxonomy } from '../core/dom.js';
export function createBriefing(){
  let briefing,groups=[],active='';
  const tabs=$('briefing-geographies');
  function select(name,focus=false){active=name;paint();if(focus)tabs.querySelector('[aria-selected="true"]').focus();}
  tabs.addEventListener('click',event=>{const button=event.target.closest('[data-geography]');if(button)select(button.dataset.geography,true);});
  tabs.addEventListener('keydown',event=>{
    const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key)||!event.target.closest('[role="tab"]'))return;
    event.preventDefault();const index=groups.findIndex(row=>row.name===active),next=event.key==='Home'?0:event.key==='End'?groups.length-1:(index+(event.key==='ArrowRight'?1:-1)+groups.length)%groups.length;select(groups[next].name,true);
  });
  function paint(){
    const group=groups.find(row=>row.name===active),stats=group||briefing;
    tabs.hidden=!groups.length;
    tabs.innerHTML=groups.map((row,index)=>`<button type="button" class="button" role="tab" id="briefing-geography-${index}" aria-controls="briefing-list" aria-selected="${row.name===active}" tabindex="${row.name===active?0:-1}" data-geography="${escape(row.name)}">${escape(t(row.name))}<span class="geography-count">${row.total}</span></button>`).join('');
    const panel=$('briefing-list');if(group)panel.setAttribute('aria-labelledby','briefing-geography-'+groups.indexOf(group));else panel.removeAttribute('aria-labelledby');
    $('briefing-geography-summary').textContent=group?t('{geography} · {updates} · {entities}',{geography:t(group.name),updates:noveltyCount(stats.total,'novedad','novedades',t),entities:noveltyCount(group.entityCount,'entidad','entidades',t)}):'';

    $('briefing-count').textContent='Novedades detectadas: '+stats.total;
    $('briefing-signals').innerHTML=stats.bySignal.map(row=>`<button type="button" class="signal-card" data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(row.name)}</span></button>`).join('');
    $('briefing-list').innerHTML=(group?.entities.flatMap(entity=>entity.items)||[]).map(row=>`<article class="panel novelty-card"><div class="news-meta">${newsCoverage(row)}${newsTaxonomy(row)}${row.senales.map(signal=>`<span class="badge">${escape(signal)}</span>`).join('')}<time datetime="${escape(row.fecha)}">${escape(formatCalendarDay(row.fecha,language))}</time>${newsPublisher(row)}</div>${articleTranslationNote(row)}<h3 data-original><a href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">${escape(row.titular)}</a></h3><p class="novelty-context">${escape(row.entidad)} · ${escape(row.tipo)} · ${escape(row.pais)}</p><p ${row.extracto?'data-original':''}>${escape(row.extracto||'Consulta la fuente original para conocer la oferta y sus condiciones.')}</p>${articleOriginal(row)}<div class="novelty-use"><span class="eyebrow">SEGMENTO Y TEMA</span><p>${escape(row.segmentos.length?row.segmentos.join(' · '):'Segmento no identificado')} · ${escape(row.tema)}</p></div><a class="button" href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">Consultar anuncio ↗</a></article>`).join('')||'<div class="panel empty"><h2>No hay novedades detectadas en esta selección.</h2><p>Amplía entidades o segmentos. Una noticia sin señales de producto permanece disponible en Noticias.</p></div>';
    $('briefing-limit').hidden=!group||stats.total<=group.items.length;
  }
  return {get geography(){return active;},render(data){
    briefing=data.briefing||{total:0,bySignal:[],geographies:[],items:[]};
    const stats=new Map(briefing.geographies.map(row=>[row.name,row]));groups=noveltyGroups(briefing.items).map(group=>({...group,...stats.get(group.name)})).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'es'));
    if(!groups.some(row=>row.name===active))active=groups[0]?.name||'';
    paint();
  }};
}
