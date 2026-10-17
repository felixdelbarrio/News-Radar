import {taxonomyChoices,taxonomySubLabel,taxonomyDisplayLabel} from '../../shared/taxonomy-path.js';
import {escape} from '../core/dom.js';
import {t,language} from '../core/language.js';
export function syncTaxonomyControls(form,paths,changed){
  const parent=form.elements.palanca,child=form.elements.subpalanca;if(!parent||!child)return;
  let subpalanca=child.value;
  if(changed==='palanca'&&subpalanca){const allowed=taxonomyChoices(paths,{palanca:parent.value}).subpalanca;subpalanca=allowed.find(value=>taxonomySubLabel(value)===taxonomySubLabel(subpalanca))||'';}
  if(changed==='subpalanca'&&parent.value&&!taxonomyChoices(paths,{subpalanca:child.value}).palanca.includes(parent.value))parent.value='';
  const choices=taxonomyChoices(paths,{palanca:parent.value,subpalanca});
  for(const [name,values] of Object.entries(choices)){
    const label=value=>taxonomyDisplayLabel(t(name==='subpalanca'?taxonomySubLabel(value):value));values.sort((a,b)=>label(a).localeCompare(label(b),language));
    const input=form.elements[name],current=name==='subpalanca'?subpalanca:input.value,signature=JSON.stringify([language,values]);
    if(input.dataset.options!==signature){input.dataset.options=signature;input.innerHTML='<option value="">'+t('Todos')+'</option>'+values.map(value=>'<option data-catalog-name="'+escape(name==='subpalanca'?taxonomySubLabel(value):value)+'" value="'+escape(value)+'">'+escape(label(value))+'</option>').join('');}input.value=values.includes(current)?current:'';
  }
}
