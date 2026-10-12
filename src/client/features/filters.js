import {defaultView} from '../config.js';
import {t,language} from '../core/language.js';
import {formatCalendarDay} from '../../shared/locales.js';
import { $, escape } from "../core/dom.js";
function createFilters({ onInvalidate, onChange }) {
  const form = $("filters");
  let page = 0, view=defaultView, defaults={},edition='',preference='',savePreference=false,newsGeography='',editionSelection={};
  const selections=new Map(),initialized=new Set();
  function options(name, values) {
    const el = form.elements[name], current = el.value;
    if(current&&!values.includes(current))values=[...values,current];
    const signature = JSON.stringify(values);
    if (el.dataset.options === signature) return;
    el.dataset.options = signature;
    el.innerHTML = '<option value="">Todos</option>' + values.map((x) => '<option value="'+escape(x)+'">' + escape(x) + "</option>").join("");
    el.value = current || "";
  }
  function layout(){
      $(view+'-filter-chips').appendChild($('active-filters'));
      $('geography-filter').hidden=false;
      $('coverage-filter').hidden=!['news','briefing'].includes(view);
      $('advanced-filters').hidden=false;
      for(const id of ['from-filter','to-filter'])$(id).hidden=false;
      $('filter-description').textContent='Selección de noticias y período de consulta.';
  }
  layout();
  const chipLabels={coverage:'Cobertura',search:'Búsqueda',country:'Geografía',entity:'Entidad',source:'Medio',topic:'Tema',type:'Tipo de entidad',segment:'Segmento',signal:'Novedad',palanca:'Palanca',subpalanca:'Subpalanca',from:'Fecha desde',to:'Fecha hasta'};
  function renderChips(){
    const target=$('active-filters');
    const values=Object.entries(chipLabels).filter(([name])=>form.elements[name].value);
    target.hidden=!values.length;
    target.innerHTML=values.map(([name,label])=>{
      const raw=form.elements[name].value,value=name==='coverage'?{digital:'Canal digital',generalista:'Generalista'}[raw]:['from','to'].includes(name)?formatCalendarDay(raw,language):raw;
      const original=['search','entity','source'].includes(name),text=t(label)+': '+(original?value:t(value));
      return '<button type="button" class="filter-chip" data-original data-remove-filter="'+name+'" aria-label="'+escape(t('Quitar'))+' '+escape(text)+'"><span>'+escape(text)+'</span><span aria-hidden="true">×</span></button>';
    }).join('');
  }
  $('active-filters').addEventListener('click',event=>{
    const button=event.target.closest('[data-remove-filter]');if(!button)return;
    if(edition&&['from','to'].includes(button.dataset.removeFilter)){current();return;}
    form.elements[button.dataset.removeFilter].value='';filterChanged({type:'change'});
  });
  let timer;
  function filterChanged(event) {
    if(edition&&['from','to'].includes(event.target?.name)&&!event.target.value){current();return;}
    if(event.type==="input"&&event.target?.name!=="search")return;
    clearTimeout(timer);
    page = 0;
    initialized.add(view);
    onInvalidate();
    const from = form.elements.from.value, to = form.elements.to.value;
    form.elements.to.setCustomValidity(from && to && from > to ? t("La fecha hasta debe ser posterior o igual a la fecha desde.") : "");
    $("message").hidden = true;
    renderChips();
    if (event.type === "input") timer = setTimeout(onChange, 250);
    else onChange();
  }
  form.addEventListener("input", filterChanged);
  form.addEventListener("change", filterChanged);
  form.addEventListener("reset", () => {
    if(edition){queueMicrotask(current);return;}
    clearTimeout(timer);
    onInvalidate();
    queueMicrotask(() => {
      for (const name of [...form.elements].filter(input=>input.name).map(input=>input.name)) form.elements[name].value = "";
      filterChanged({ type: "reset" });
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filterChanged({ type: "submit" });
  });
  function resetContext(nextEdition,nextPreference){
    edition=nextEdition;preference=nextPreference;newsGeography='';savePreference=Boolean(nextPreference);clearTimeout(timer);page=0;
    for(const name of ['news','briefing','radar']){initialized.delete(name);selections.delete(name);}
    for(const input of form.elements)if(input.name)input.value='';
    form.elements.to.setCustomValidity('');onInvalidate();onChange();
  }
  function current(){resetContext('','');}
  return {
    useEdition:(id,selection={})=>{editionSelection=selection;resetContext(id,'');},usePreference:id=>resetContext('',id),current,
    query: () => ({ ...Object.fromEntries(new FormData(form)), page,view,language,...(edition?{edition,...(!initialized.has(view)?editionSelection:{})}:{}),...(view==='news'&&newsGeography?{newsGeography}:{}),...(preference?{preference}:{}),...(savePreference?{savePreference:true}:{}),initial:!initialized.has(view) }),
    show: next => {
      if(next===view)return false;
      clearTimeout(timer);onInvalidate();
      const selection=Object.fromEntries(new FormData(form));selections.set(view,selection);if(edition){selections.set(next,selection);initialized.add(next);}view=next;page=0;newsGeography='';layout();
      for(const input of form.elements)if(input.name)input.value=(selections.get(view)||defaults)[input.name]||'';
      form.elements.to.setCustomValidity('');
      renderChips();
      return true;
    },
    isValid: () => form.reportValidity(),
    set: (name, value) => {
      initialized.add(view);
      form.elements[name].value = value;
      filterChanged({ type: "change" });
    },
    apply:query=>{initialized.add(view);for(const input of form.elements)if(input.name){const value=query[input.name]||'';if(value&&input.tagName==='SELECT')options(input.name,[value]);input.value=value;}filterChanged({type:'change'});},
    setGeography:name=>{newsGeography=name;page=0;onInvalidate();onChange();},
    setPage: (value) => page = value,
    render: (data) => {
      page = data.page;newsGeography=data.newsGeography||'';savePreference=false;preference=data.personalization?.active||preference;
      defaults=data.defaults||defaults;
      initialized.add(view);
      for (const [name, key] of [["country", "countries"], ["entity", "entities"], ["source", "sources"], ["topic", "topics"], ["type","types"], ["segment","segments"], ["signal","signals"], ["palanca","palanca"], ["subpalanca","subpalanca"]]) options(name, data[key]||[]);
      if(data.selection)for(const input of form.elements)if(input.name)input.value=data.selection[input.name]||'';
      renderChips();
    }
  };
}
export {
  createFilters
};
