import {articleTitle,articleTags,articleOriginal,articleDate} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape,newsPublisher} from '../core/dom.js';
import {newsEntityGroups} from '../../shared/news-groups.js';
import {identityMark} from '../../shared/visual-identity.js';
function renderNews(data,appended=null) {
  const list=$('news-list');
  const groups=items=>newsEntityGroups(items).filter(group=>!data.selection?.entity||group.name===data.selection.entity);
  const rows=items=>items.map(row=>`<tr class="news-row"><td>${articleTitle(row)}${row.extracto?`<p class="story-excerpt" data-original>${escape(row.extracto)}</p>`:''}${articleOriginal(row)}<div class="news-meta news-tags">${articleTags(row,data.selection)}</div></td><td>${articleDate(row)}</td><td>${newsPublisher(row)}</td></tr>`).join('');
  const marks=group=>[...new Set(group.items.map(row=>row.pais))].map(country=>identityMark('countries',country,escape)).join('');
  const groupHtml=group=>`<article class="panel news-entity-group" aria-label="${escape(group.name)}"><div class="news-entity-heading"><h2 data-original>${identityMark('entities',group.name,escape)}${escape(group.name)}</h2><span class="story-identity">${marks(group)}</span></div><div class="news-table"><table role="table"><thead><tr><th scope="col">Titular</th><th scope="col">Fecha de publicación</th><th scope="col">Medio</th></tr></thead><tbody>${rows(group.items)}</tbody></table></div></article>`;
  if(appended){
    const all=groups(data.items),order=new Map(all.map((group,index)=>[group.name,index]));
    for(const group of groups(appended)){
      const panel=[...list.children].find(node=>node.getAttribute('aria-label')===group.name);
      if(panel){panel.querySelector('tbody').insertAdjacentHTML('beforeend',rows(group.items));panel.querySelector('.story-identity').innerHTML=marks(all[order.get(group.name)]);}
      else{const next=[...list.children].find(node=>order.get(node.getAttribute('aria-label'))>order.get(group.name));if(next)next.insertAdjacentHTML('beforebegin',groupHtml(group));else list.insertAdjacentHTML('beforeend',groupHtml(group));}
    }
  }else list.innerHTML=data.items.length?groups(data.items).map(groupHtml).join(''):'<div class="panel empty"><p class="eyebrow">SIN RESULTADOS</p><h2>No hay noticias con estos filtros.</h2><p>Prueba otra entidad, cambia la geografía o pulsa «Ver todo» para ampliar la selección.</p></div>';
  $('result-count').textContent=t(data.contextTotal===1?'1 publicación':'{count} publicaciones',{count:data.contextTotal});
  $('page-label').textContent=data.total?t('{visible} de {total} publicaciones',{visible:data.items.length,total:data.total}):'Sin resultados';
  const complete=(data.page+1)*data.pageSize>=data.total;
  $('next').hidden=complete;$('next').disabled=complete;
}
export {renderNews};
