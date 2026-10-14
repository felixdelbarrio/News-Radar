import {articleContent} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape} from '../core/dom.js';
import {newsEntityGroups} from '../../shared/news-groups.js';
import {identityMark} from '../../shared/visual-identity.js';
function renderNews(data,appended=null) {
  const list=$('news-list');let index=appended?data.items.length-appended.length:0;
  const articles=items=>items.map(n=>`<article class="news-item"><span class="news-index" aria-hidden="true">${String(++index).padStart(2,'0')}</span><div>${articleContent(n,data.selection)}</div></article>`).join('');
  const groupHtml=group=>`<section class="news-entity-group" aria-label="${escape(group.name)}"><h2 class="news-entity-heading" data-original>${identityMark('entities',group.name,escape)}${escape(group.name)}</h2>${articles(group.items)}</section>`;
  if(appended){
    for(const group of newsEntityGroups(appended)){
      const last=list.lastElementChild;
      if(last?.getAttribute('aria-label')===group.name)last.insertAdjacentHTML('beforeend',articles(group.items));
      else list.insertAdjacentHTML('beforeend',groupHtml(group));
    }
  }else list.innerHTML=data.items.length?newsEntityGroups(data.items).map(groupHtml).join(''):'<div class="panel empty"><p class="eyebrow">SIN RESULTADOS</p><h2>No hay noticias con estos filtros.</h2><p>Prueba otra entidad, cambia la geografía o pulsa «Ver todo» para ampliar la selección.</p></div>';
  $("result-count").textContent = data.total + " publicaciones";
  $("page-label").textContent = data.total ? t('{visible} de {total} publicaciones',{visible:data.items.length,total:data.total}) : "Sin resultados";
  $("next").disabled = (data.page + 1) * data.pageSize >= data.total;
}
export {
  renderNews
};
