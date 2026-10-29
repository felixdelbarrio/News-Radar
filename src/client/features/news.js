import {articleTitle,articleTags,articleOriginal,articleDate} from './article-text.js';
import {t} from '../core/language.js';
import {$,escape,newsPublisher} from '../core/dom.js';
import {newsEntityGroups} from '../../shared/news-groups.js';
import {identityMark} from '../../shared/visual-identity.js';
function renderNews(data,appended=null) {
  const list=$('news-list');
  if(!list.dataset.links){list.dataset.links='true';list.addEventListener('click',event=>{if(event.target.closest('a,button,details,input')||window.getSelection()?.toString())return;event.target.closest('.news-row')?.querySelector('.story-link')?.click();});}
  const rows=items=>items.map(row=>`<tr class="news-row"><td>${articleTitle(row)}${row.extracto?`<p class="story-excerpt" data-original>${escape(row.extracto)}</p>`:''}${articleOriginal(row)}<div class="news-meta">${articleTags(row,data.selection)}</div></td><td>${articleDate(row)}</td><td>${newsPublisher(row)}</td></tr>`).join('');
  const marks=group=>[...new Set(group.items.map(row=>row.pais))].map(country=>identityMark('countries',country,escape)).join('');
  const groupHtml=group=>`<article class="panel news-entity-group" aria-label="${escape(group.name)}"><div class="news-entity-heading"><h2 data-original>${identityMark('entities',group.name,escape)}${escape(group.name)}</h2><span class="story-identity">${marks(group)}</span></div><div class="news-table"><table role="table"><thead><tr><th scope="col">Titular</th><th scope="col">Fecha de publicación</th><th scope="col">Medio</th></tr></thead><tbody>${rows(group.items)}</tbody></table></div></article>`;
  if(appended){
    for(const group of newsEntityGroups(appended)){
      const last=list.lastElementChild;
      if(last?.getAttribute('aria-label')===group.name){last.querySelector('tbody').insertAdjacentHTML('beforeend',rows(group.items));last.querySelector('.story-identity').innerHTML=marks(newsEntityGroups(data.items).find(row=>row.name===group.name));}
      else list.insertAdjacentHTML('beforeend',groupHtml(group));
    }
  }else list.innerHTML=data.items.length?newsEntityGroups(data.items).map(groupHtml).join(''):'<div class="panel empty"><p class="eyebrow">SIN RESULTADOS</p><h2>No hay noticias con estos filtros.</h2><p>Prueba otra entidad, cambia la geografía o pulsa «Ver todo» para ampliar la selección.</p></div>';
  $('result-count').textContent=t(data.contextTotal===1?'1 publicación':'{count} publicaciones',{count:data.contextTotal});
  $('page-label').textContent=data.total?t('{visible} de {total} publicaciones',{visible:data.items.length,total:data.total}):'Sin resultados';
  const complete=(data.page+1)*data.pageSize>=data.total;
  $('next').hidden=complete;$('next').disabled=complete;
}
export {renderNews};
