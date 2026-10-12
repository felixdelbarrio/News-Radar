import {identityMark} from '../../shared/visual-identity.js';
import {taxonomySubLabel} from '../../shared/taxonomy-path.js';
import {language,t} from './language.js';
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const validUrl = (value) => /^https:\/\//i.test(value || "") ? value : "";
let dateFormat = new Intl.DateTimeFormat(language, {dateStyle:"short",timeStyle:"short"}),timezone,dateLanguage=language;
function setTimezone(value){if(value&&(value!==timezone||language!==dateLanguage)){timezone=value;dateLanguage=language;dateFormat=new Intl.DateTimeFormat(language,{dateStyle:"short",timeStyle:"short",timeZone:value});}}
const date = (value) => value ? dateFormat.format(new Date(value)) : "Sin ejecuciones";
function message(text, error = false) {
  $("message").textContent = text;
  $("message").classList.toggle("error", error);
  $("message").hidden = false;
}
function newsPublisher(row){return '<span class="identity-label">'+identityMark('publishers',row.medio,escape)+'Medio: '+(row.medio?'<span data-original>'+escape(row.medio)+'</span>':'No indicado')+'</span>';}
function newsTaxonomy(row,selection={}){const parents=new Set(),children=new Set();for(const item of row.taxonomia||[]){if(item.palanca!==selection.palanca)parents.add(item.palanca);if(item.subpalanca!==taxonomySubLabel(selection.subpalanca))children.add(item.subpalanca);}return [...parents].map(value=>'<span class="badge" data-original>'+escape(t('Palanca')+': '+t(value))+'</span>').join('')+[...children].map(value=>'<span class="badge" data-original>'+escape(t('Subpalanca')+': '+t(value))+'</span>').join('');}
function newsCoverage(row,selection={}){return [['generalista','Generalista'],['digital','Canal digital']].filter(([key])=>row.etiquetas?.[key]&&(!selection.coverage||key!==selection.coverage)&&!(selection.coverage==='digital'&&key==='generalista')).map(([,label])=>'<span class="badge">'+label+'</span>').join('');}
function metricCards(values) {
  return values.map(([label, value, note]) => `<article class="metric"><p class="eyebrow">${escape(label)}</p><strong>${escape(value ?? "—")}</strong><span class="small muted">${escape(note)}</span></article>`).join("");
}
export {
  $,
  date,
  setTimezone,
  escape,
  message,
  metricCards,
  newsPublisher,
  newsCoverage,
  newsTaxonomy,
  validUrl
};
