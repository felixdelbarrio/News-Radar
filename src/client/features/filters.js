import {t} from '../core/language.js';
import { $, escape } from "../core/dom.js";
function createFilters({ onInvalidate, onChange }) {
  const form = $("filters");
  let page = 0, view="radar", defaults={};
  const selections=new Map(),initialized=new Set();
  function options(name, values) {
    const el = form.elements[name], current = el.value;
    if(current&&!values.includes(current))values=[...values,current];
    const signature = JSON.stringify(values);
    if (el.dataset.options === signature) return;
    el.dataset.options = signature;
    el.innerHTML = '<option value="">Todos</option>' + values.map((x) => "<option>" + escape(x) + "</option>").join("");
    el.value = current || "";
  }
  function layout(){
      $(view+'-filter-chips').appendChild($('active-filters'));
      $('geography-filter').hidden=view==='radar';
      $('advanced-filters').hidden=view==='radar';
      for(const id of ['from-filter','to-filter'])$(id).hidden=view==='briefing';
      $('filter-description').textContent=view==='radar'?'Entidad y segmento del Radar.':view==='briefing'?'Novedades de los últimos 7 días.':'Selección de noticias y período de consulta.';
  }
  layout();
  const chipLabels={search:'Búsqueda',country:'Geografía',entity:'Entidad',source:'Medio',topic:'Tema',type:'Tipo de entidad',segment:'Segmento',signal:'Novedad',from:'Fecha desde',to:'Fecha hasta'};
  function renderChips(){
    const target=$('active-filters');
    const allowed=name=>view==='radar'?['entity','segment'].includes(name):view==='briefing'?!['from','to'].includes(name):true;
    const values=Object.entries(chipLabels).filter(([name])=>allowed(name)&&form.elements[name].value);
    target.hidden=!values.length;
    target.innerHTML=values.map(([name,label])=>{
      const raw=form.elements[name].value,value=['from','to'].includes(name)?raw.split('-').reverse().join('/'):raw;
      const text=label+': '+value;
      return '<button type="button" class="filter-chip" data-remove-filter="'+name+'" aria-label="Quitar '+escape(text)+'"><span>'+escape(text)+'</span><span aria-hidden="true">×</span></button>';
    }).join('');
  }
  $('active-filters').addEventListener('click',event=>{
    const button=event.target.closest('[data-remove-filter]');if(!button)return;
    form.elements[button.dataset.removeFilter].value='';filterChanged({type:'change'});
  });
  let timer;
  function filterChanged(event) {
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
  return {
    query: () => ({ ...Object.fromEntries(new FormData(form)), page,view,initial:!initialized.has(view) }),
    show: next => {
      if(next===view)return false;
      clearTimeout(timer);onInvalidate();
      selections.set(view,Object.fromEntries(new FormData(form)));view=next;page=0;layout();
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
    setPage: (value) => page = value,
    render: (data) => {
      page = data.page;
      defaults=data.defaults||defaults;
      initialized.add(view);
      for (const [name, key] of [["country", "countries"], ["entity", "entities"], ["source", "sources"], ["topic", "topics"], ["type","types"], ["segment","segments"], ["signal","signals"]]) options(name, data[key]||[]);
      if(data.selection)for(const input of form.elements)if(input.name)input.value=data.selection[input.name]||'';
      renderChips();
    }
  };
}
export {
  createFilters
};
