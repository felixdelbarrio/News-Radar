import {taxonomyPath} from '../../shared/taxonomy-path.js';
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
function newsPublisher(row){return '<span>Medio: '+(row.medio?'<span data-original>'+escape(row.medio)+'</span>':'No indicado')+'</span>';}
function newsTaxonomy(row){return (row.taxonomia||[]).map(item=>'<span class="badge" data-original>'+escape(t(taxonomyPath(item)))+'</span>').join('');}
function newsCoverage(row){return [['generalista','Generalista'],['digital','Canal digital']].filter(([key])=>row.etiquetas?.[key]).map(([,label])=>'<span class="badge">'+label+'</span>').join('');}
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
