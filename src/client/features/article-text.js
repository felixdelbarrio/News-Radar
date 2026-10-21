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
  const values=[...(row.tipo?[row.tipo]:[]),...(row.segmentos||[]),...(row.senales||[])];
  return newsCoverage(row)+newsTaxonomy(row)+[...new Set(values)].map(value=>'<span class="badge" data-original>'+escape(t(value==='Incidencia operativa'?'Indisponibilidad / Incidencia operativa':value))+'</span>').join('');
}
export function articleDate(row){return '<time datetime="'+escape(row.fecha)+'">'+escape(t('Publicado'))+': '+escape(formatCalendarDay(row.fecha,language))+'</time>';}
export function articleTitle(row){return '<h3 class="story-title" data-original><a class="story-link" href="'+escape(validUrl(row.url))+'" target="_blank" rel="noopener noreferrer">'+escape(row.titular)+'</a></h3>';}
export function articleEvidence(row){const evidence=row.functionalEvidence;return evidence?.terms?.length?'<details class="article-original"><summary>'+escape(t('Por qué está clasificada aquí'))+'</summary><p>'+escape(t(evidence.method==='external'?'Evidencia web aportada':evidence.method==='literal'?'Coincidencia operativa directa':'Contexto descriptivo del catálogo'))+' · '+escape(t(evidence.location==='web'?'Texto del editor':evidence.location==='headline'?'Titular':'Titular y extracto'))+'</p><p data-original>'+evidence.terms.map(escape).join(' · ')+'</p>'+(evidence.url?'<p><a href="'+escape(evidence.url)+'" target="_blank" rel="noopener noreferrer">'+escape(evidence.url)+'</a> · '+escape(evidence.retrievedAt)+'</p>':'')+'</details>':'';}
export function articleContent(row,selection={},novelty=false){
  return articleHeader(row,articleTitle(row))+(row.extracto?'<p data-original>'+escape(row.extracto)+'</p>':'')+articleOriginal(row)+articleEvidence(row)+'<div class="article-metadata"><div class="news-meta">'+articleTags(row,selection,novelty)+'</div><div class="news-meta">'+articleDate(row)+newsPublisher(row)+'</div></div>';
}
