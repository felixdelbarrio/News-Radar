import {articleContent} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape} from '../core/dom.js';
import {newsEntityGroups} from '../../shared/news-groups.js';
import {identityMark} from '../../shared/visual-identity.js';
function renderNews(data) {
  let index=0;
  $("news-list").innerHTML = data.items.length ? newsEntityGroups(data.items).map(group=>`<section class="news-entity-group" aria-label="${escape(group.name)}"><h2 class="news-entity-heading" data-original>${identityMark('entities',group.name,escape)}${escape(group.name)}</h2>${group.items.map(n=>`<article class="news-item"><span class="news-index" aria-hidden="true">${String(data.page*data.pageSize+(++index)).padStart(2,'0')}</span><div>${articleContent(n,data.selection)}</div></article>`).join('')}</section>`).join('') : '<div class="panel empty"><p class="eyebrow">SIN RESULTADOS</p><h2>No hay noticias con estos filtros.</h2><p>Prueba otra entidad, cambia la geografía o pulsa «Ver todo» para ampliar la selección.</p></div>';
  $("result-count").textContent = data.total + " publicaciones";
  $("page-label").textContent = data.total ? t('Página {page} de {pages}',{page:data.page+1,pages:Math.ceil(data.total/data.pageSize)}) : "Sin resultados";
  $("previous").disabled = data.page === 0;
  $("next").disabled = (data.page + 1) * data.pageSize >= data.total;
}
export {
  renderNews
};
