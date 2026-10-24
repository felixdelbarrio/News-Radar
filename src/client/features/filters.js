import {openDatePicker} from './date-picker.js';
import {newsletterComparisonLabels} from '../../shared/newsletter-cadences.js';
import {taxonomySubLabel,taxonomyDisplayLabel} from '../../shared/taxonomy-path.js';
import {syncTaxonomyControls} from './taxonomy-controls.js';
import {coverageOptions,BRIEFING_ALLOWED_SIGNALS,otherGeography} from '../../shared/selection-policy.js';
import {defaultView} from '../config.js';
import {t,language} from '../core/language.js';
import {formatCalendarDay} from '../../shared/locales.js';
import { $, escape } from "../core/dom.js";
function createFilters({ onInvalidate, onChange }) {
  const form = $("filters");
  let page = 0, view=defaultView, defaults={},edition='',newsGeography='',editionSelection={},taxonomy=[],applied={},dirty=false;
  const selections=new Map(),initialized=new Set();
  function options(name, values, selected) {
    const el = form.elements[name];if(!el)return;if(name==='country'&&view==='news')values=[...new Set([...values,otherGeography])];let current = selected ?? el.value;if(name==='signal'&&view==='briefing'){values=values.filter(value=>BRIEFING_ALLOWED_SIGNALS.includes(value));if(!values.includes(current))current='';}
    if(name!=='year'&&!(name==='signal'&&view==='briefing')&&current&&!values.includes(current))values=[...values,current];
    const signature = JSON.stringify(values);
    if (el.dataset.options === signature) return;
    el.dataset.options = signature;
    el.innerHTML = (name==='year'?'':'<option value="">Todos</option>') + values.map((x) => '<option value="'+escape(x)+'">' + escape(['palanca','subpalanca'].includes(name)?taxonomyDisplayLabel(x):name==='coverage'?coverageOptions[x]:name==='signal'&&x==='Incidencia operativa'?'Indisponibilidad / Incidencia operativa':x) + "</option>").join("");
    el.value = current || "";
  }
  function layout(){
      $('geography-filter').hidden=false;
      const radar=view==='radar';$('entity-filter').hidden=false;
      $('year-filter').hidden=!radar;
      $('advanced-filters').hidden=false;
      for(const name of ['search','type','signal','source'])$(name+'-filter').hidden=radar;
      if(view!=='news')$('advanced-filters').open=false;
      for(const id of ['from-filter','to-filter'])$(id).hidden=view==='radar';
      $('date-guidance').hidden=view==='radar';
      $('filter-description').textContent='Edita los criterios y pulsa Aplicar filtros para actualizar los resultados.';
  }
  layout();
  const chipLabels={benchmark:'Ámbito comparativo',search:'Búsqueda',country:'Geografía',entity:'Entidad',source:'Medio',type:'Tipo de entidad',signal:'Señal de negocio',palanca:"Bloque funcional",subpalanca:"Funcionalidad / Sub Operativa",from:'Fecha desde',to:'Fecha hasta'};
  function renderChips(){
    const target=$('active-filters');
    const values=Object.entries(chipLabels).filter(([name])=>applied[name]);
    target.hidden=!values.length;
    target.innerHTML=values.map(([name,label])=>{
      const raw=applied[name],value=name==='benchmark'?(raw==='international'?'Mirada internacional':newsletterComparisonLabels[raw]):name==='coverage'?coverageOptions[raw]:['from','to'].includes(name)?formatCalendarDay(raw,language):name==='subpalanca'?taxonomySubLabel(raw):name==='signal'&&raw==='Incidencia operativa'?'Indisponibilidad / Incidencia operativa':raw;
      const original=['search','entity','source'].includes(name),text=['palanca','subpalanca'].includes(name)?t(value):t(label)+': '+(original?value:t(value));
      if(view==='briefing'||view==='radar'&&['from','to'].includes(name))return '<span class="filter-chip" data-original>'+escape(text)+'</span>';
      if(['from','to'].includes(name))return '<button type="button" class="filter-chip" data-original data-edit-filter="'+name+'" aria-label="'+escape(t('Editar')+' '+text)+'"><span>'+escape(text)+'</span></button>';
      return '<button type="button" class="filter-chip" data-original data-remove-filter="'+name+'" aria-label="'+escape(t('Quitar'))+' '+escape(text)+'"><span>'+escape(text)+'</span><span aria-hidden="true">×</span></button>';
    }).join('');
  }
  $('active-filters').addEventListener('click',event=>{
    const edit=event.target.closest('[data-edit-filter]');if(edit?.dataset.editFilter){$('advanced-filters').open=true;$('filters-dialog').showModal();const input=form.elements[edit.dataset.editFilter];input.focus();openDatePicker(input);return;}
    const button=event.target.closest('[data-remove-filter]');if(!button)return;
    if(edition&&['from','to'].includes(button.dataset.removeFilter)){current();return;}
    for(const input of form.elements)if(input.name)input.value=applied[input.name]||'';
    if(button.dataset.removeFilter==='benchmark')delete applied.benchmark;else form.elements[button.dataset.removeFilter].value='';filterChanged({type:'change'});
  });
  let timer;
  function filterChanged(event) {
    if(edition&&['from','to'].includes(event.target?.name)&&!event.target.value){current();return;}
    if(event.type==="input"&&event.target?.name!=="search")return;
    syncTaxonomyControls(form,taxonomy,event.target?.name);
    const next=Object.fromEntries(new FormData(form));if(event.type==='submit'&&JSON.stringify(Object.entries(next).sort())===JSON.stringify(Object.entries(applied).filter(([key])=>form.elements[key]).sort()))return;
    clearTimeout(timer);
    page = 0;
    initialized.add(view);
    onInvalidate();
    const from = form.elements.from.value, to = form.elements.to.value;
    form.elements.to.setCustomValidity(from && to && from > to ? t("La fecha hasta debe ser posterior o igual a la fecha desde.") : "");
    $("message").hidden = true;
    dirty=false;applied={...(edition&&applied.benchmark?{benchmark:applied.benchmark}:{}),...Object.fromEntries(new FormData(form))};renderChips();
    if(event.notify===false)return;
    if (event.type === "input") timer = setTimeout(onChange, 250);
    else onChange();
  }
  function draftChanged(event){
    if(!event.target?.name)return;
    dirty=true;
    syncTaxonomyControls(form,taxonomy,event.target?.name);
    const {from,to}=form.elements;to.setCustomValidity(from.value&&to.value&&from.value>to.value?t('La fecha hasta debe ser posterior o igual a la fecha desde.'):'');
  }
  form.addEventListener("input", draftChanged);
  form.addEventListener("change", draftChanged);
  $('restore-filters').addEventListener('click',()=>{$('filters-dialog').close();if(edition){current();return;}dirty=false;initialized.delete(view);applied={};for(const input of form.elements)if(input.name)input.value='';page=0;form.elements.to.setCustomValidity('');onInvalidate();onChange();});
  form.addEventListener("reset", () => {
    $("filters-dialog").close();
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
    if(!form.reportValidity())return;
    filterChanged({ type: "submit" });$('filters-dialog').close();
  });
  function resetContext(nextEdition,notify=true){
    edition=nextEdition;dirty=false;applied={};newsGeography='';clearTimeout(timer);page=0;
    for(const name of ['news','briefing','radar']){initialized.delete(name);selections.delete(name);}
    for(const input of form.elements)if(input.name)input.value='';
    form.elements.to.setCustomValidity('');onInvalidate();if(notify)onChange();
  }
  function current(){resetContext('');}
  return {
    useEdition:(id,selection={},notify=true)=>{editionSelection=selection;resetContext(id,notify);},current,
    query: () => ({ ...applied, page,view,language,...(edition&&view==='news'?{edition,...(!initialized.has(view)?editionSelection:{})}:{}),...(view==='news'&&newsGeography?{newsGeography}:{}),initial:!initialized.has(view) }),
    show: next => {
      if(next===view)return false;
      clearTimeout(timer);onInvalidate();
      const selection={...applied};selections.set(view,selection);view=next;page=0;newsGeography='';layout();
      for(const input of form.elements)if(input.name)input.value=(selections.get(view)||defaults)[input.name]||'';
      dirty=false;applied={...(selections.get(view)||defaults)};form.elements.to.setCustomValidity('');
      renderChips();
      return true;
    },
    isValid: () => !applied.from||!applied.to||applied.from<=applied.to,
    set: (name, value) => {
      for(const input of form.elements)if(input.name)input.value=applied[input.name]||'';
      initialized.add(view);
      form.elements[name].value = value;
      filterChanged({ type: "change" });
    },
    apply:(query,notify=true)=>{initialized.add(view);if(Object.hasOwn(query,'newsGeography'))newsGeography=query.newsGeography;for(const input of form.elements)if(input.name){const value=query[input.name]||'';if(value&&input.tagName==='SELECT')options(input.name,[value]);input.value=value;}filterChanged({type:'change',notify});},
    setGeography:name=>{newsGeography=name;page=0;onInvalidate();onChange();},
    setPage: (value) => page = value,
    render: (data) => {
      const draft=dirty?Object.fromEntries(new FormData(form)):null;
      if(view==='radar')options('year',data.years||[],data.selection?.from?.slice(0,4));
      taxonomy=data.subpalanca||[];page = data.page;newsGeography=data.newsGeography||'';
      defaults=data.defaults||defaults;
      initialized.add(view);
      for (const [name, key] of [["country", "countries"], ["entity", "entities"], ["source", "sources"], ["type","types"], ["segment","segments"], ["signal","signals"], ["palanca","palanca"], ["subpalanca","subpalanca"]]) options(name, data[key]||[],data.selection?.[name]);
      if(data.selection)for(const input of form.elements)if(input.name)input.value=(input.name==='year'&&view==='radar'?data.selection.from?.slice(0,4):data.selection[input.name])||'';
      syncTaxonomyControls(form,taxonomy);applied=data.selection?{...data.selection}:Object.fromEntries(new FormData(form));renderChips();
      if(draft){for(const input of form.elements)if(input.name)input.value=draft[input.name]||'';syncTaxonomyControls(form,taxonomy);}
    }
  };
}
export {
  createFilters
};
