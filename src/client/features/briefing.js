import { $, escape, validUrl } from '../core/dom.js';
export function createBriefing(){
  return {render(data){
    const briefing=data.briefing||{total:0,bySignal:[],items:[]};
    $('briefing-count').textContent='Novedades detectadas: '+briefing.total;
    $('briefing-signals').innerHTML=briefing.bySignal.map(row=>`<button type="button" class="signal-card" data-signal="${escape(row.name)}"><strong>${row.total}</strong><span>${escape(row.name)}</span></button>`).join('');
    $('briefing-list').innerHTML=briefing.items.map(row=>`<article class="panel novelty-card"><div class="news-meta">${row.senales.map(signal=>`<span class="badge">${escape(signal)}</span>`).join('')}<time>${escape(row.fecha)}</time></div><h3><a href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">${escape(row.titular)}</a></h3><p class="novelty-context">${escape(row.entidad)} · ${escape(row.tipo)} · ${escape(row.pais)} · ${escape(row.medio)}</p><p>${escape(row.extracto||'Consulta la fuente original para conocer la oferta y sus condiciones.')}</p><div class="novelty-use"><span class="eyebrow">SEGMENTO Y TEMA</span><p>${escape(row.segmentos.length?row.segmentos.join(' · '):'Segmento no identificado')} · ${escape(row.tema)}</p></div><a class="button" href="${escape(validUrl(row.url))}" target="_blank" rel="noopener noreferrer">Consultar anuncio ↗</a></article>`).join('')||'<div class="panel empty"><h2>No hay novedades detectadas en esta selección.</h2><p>Amplía entidades o segmentos. Una noticia sin señales de producto permanece disponible en Noticias.</p></div>';
    $('briefing-limit').hidden=!briefing.limited;
  }};
}
