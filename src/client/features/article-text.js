import {storyIdentity} from '../../shared/visual-identity.js';
import {escape} from '../core/dom.js';
export function articleTranslationNote(row){
  const state=row.translation?.state;if(state==='native')return '';
  return '<p class="small muted">'+(state==='translated'?'Traducción automática':'Pendiente de traducción nocturna. Se muestra el original.')+'</p>';
}
export function articleOriginal(row){
  return row.original?'<details class="article-original"><summary>Ver original</summary><p data-original><strong>'+escape(row.original.titular)+'</strong></p>'+(row.original.extracto?'<p data-original>'+escape(row.original.extracto)+'</p>':'')+'</details>':'';
}

export function articleHeader(row,meta){return '<div class="story-topline"><div class="news-meta">'+meta+'</div>'+storyIdentity(row.entidad,row.pais,escape)+'</div>';}
