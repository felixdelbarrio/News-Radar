import {articleTranslationNote,articleOriginal,articleHeader} from './article-text.js';
import {formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import { $, escape, validUrl, newsPublisher, newsCoverage, newsTaxonomy } from "../core/dom.js";
import {newsEntityGroups} from '../../shared/news-groups.js';
import {identityMark} from '../../shared/visual-identity.js';
function renderNews(data) {
  let index=0;
  $("news-list").innerHTML = data.items.length ? newsEntityGroups(data.items).map(group=>`<section class="news-entity-group" aria-label="${escape(group.name)}"><h2 class="news-entity-heading" data-original>${identityMark('entities',group.name,escape)}${escape(group.name)}</h2>${group.items.map(n=>`<article class="news-item"><span class="news-index" aria-hidden="true">${String(data.page*data.pageSize+(++index)).padStart(2,"0")}</span><div>${articleHeader(n,`<span class="badge">${escape(n.tema)}</span>${newsCoverage(n)}${newsTaxonomy(n)}<time datetime="${escape(n.fecha)}">${escape(formatCalendarDay(n.fecha,language))}</time><span>${escape(n.pais)}</span>${newsPublisher(n)}<span>${escape(n.tipo||"")}</span>`)}${articleTranslationNote(n)}<h3 data-original><a href="${escape(validUrl(n.url))}" target="_blank" rel="noopener noreferrer">${escape(n.titular)}</a></h3><p ${n.extracto?'data-original':''}>${escape(n.extracto || "El feed no proporciona un extracto. Consulta la publicación original.")}</p>${articleOriginal(n)}<div class="news-footer"><span class="muted">${escape([n.entidad,...(n.segmentos||[])].filter(Boolean).join(" · "))}</span><a href="${escape(validUrl(n.url))}" target="_blank" rel="noopener noreferrer">Abrir noticia ↗</a></div></div></article>`).join('')}</section>`).join('') : '<div class="panel empty"><p class="eyebrow">SIN RESULTADOS</p><h2>No hay noticias con estos filtros.</h2><p>Prueba otra entidad, cambia la geografía o pulsa «Ver todo» para ampliar la selección.</p></div>';
  $("result-count").textContent = data.total + " publicaciones";
  $("page-label").textContent = data.total ? t('Página {page} de {pages}',{page:data.page+1,pages:Math.ceil(data.total/data.pageSize)}) : "Sin resultados";
  $("previous").disabled = data.page === 0;
  $("next").disabled = (data.page + 1) * data.pageSize >= data.total;
}
export {
  renderNews
};
