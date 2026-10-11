import {escape} from '../core/dom.js';
export function articleTranslationNote(row){
  const state=row.translation?.state;if(state==='native')return '';
  return '<p class="small muted">'+(state==='translated'?'Traducción automática':state==='unavailable'?'Traducción no disponible. Se muestra el original.':'Traduciendo…')+'</p>';
}
export function articleOriginal(row){
  return row.original?'<details class="article-original"><summary>Ver original</summary><p data-original><strong>'+escape(row.original.titular)+'</strong></p>'+(row.original.extracto?'<p data-original>'+escape(row.original.extracto)+'</p>':'')+'</details>':'';
}
