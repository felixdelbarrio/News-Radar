import {storyIdentity} from '../../shared/visual-identity.js';
import {formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import {escape,validUrl,newsCoverage,newsTaxonomy,newsPublisher} from '../core/dom.js';
export function articleOriginal(row){
  const original=row.original;
  return original&&(original.titular!==row.titular||(original.extracto||'')!==(row.extracto||''))?'<details class="article-original"><summary>Ver original</summary><p data-original><strong>'+escape(original.titular)+'</strong></p>'+(original.extracto?'<p data-original>'+escape(original.extracto)+'</p>':'')+'</details>':'';
}
export function articleHeader(row,content){return '<div class="story-topline"><div class="story-heading">'+content+'</div>'+storyIdentity(row.entidad,row.pais,escape)+'</div>';}
export function articleTags(row,selection={},novelty=false){
  const values=[...(!selection.type&&row.tipo?[row.tipo]:[]),...(row.segmentos||[]).filter(value=>value!==selection.segment),...(novelty?row.senales||[]:[]).filter(value=>value!==selection.signal)];
  return newsCoverage(row,selection)+newsTaxonomy(row,selection)+[...new Set(values)].map(value=>'<span class="badge" data-original>'+escape(t(value))+'</span>').join('');
}
export function articleDate(row){return '<time datetime="'+escape(row.fecha)+'">'+escape(t('Publicado'))+': '+escape(formatCalendarDay(row.fecha,language))+'</time>';}
export function articleTitle(row){return '<h3 data-original><a class="story-link" href="'+escape(validUrl(row.url))+'" target="_blank" rel="noopener noreferrer">'+escape(row.titular)+'</a></h3>';}
export function articleContent(row,selection={},novelty=false){
  return articleHeader(row,articleTitle(row))+(row.extracto?'<p data-original>'+escape(row.extracto)+'</p>':'')+articleOriginal(row)+'<div class="article-metadata"><div class="news-meta">'+articleTags(row,selection,novelty)+'</div><div class="news-meta">'+articleDate(row)+newsPublisher(row)+(!selection.country&&row.pais&&row.pais!=='Sin determinar'?'<span>'+escape(row.pais)+'</span>':'')+'</div></div>';
}
