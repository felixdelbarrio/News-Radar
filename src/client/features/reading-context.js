import {$,escape} from '../core/dom.js';
import {t} from '../core/language.js';
export function createReadingContext({onPreference,onCurrent}){
  $('reading-preference').addEventListener('change',event=>onPreference(event.target.value));
  $('reading-current').addEventListener('click',onCurrent);
  return {render(data,view){
    const context=data.context||{mode:'current'},personal=data.personalization||{options:[],active:'default'};
    $('reading-context').hidden=!['news','briefing','radar'].includes(view);
    const select=$('reading-preference'),signature=JSON.stringify(personal.options);
    if(select.dataset.options!==signature){select.dataset.options=signature;select.innerHTML='<option value="default">'+t('Selección predeterminada')+'</option>'+personal.options.map(row=>'<option value="'+escape(row.id)+'">'+escape(row.name)+'</option>').join('');}
    select.value=personal.active;select.disabled=context.mode==='edition';
    $('reading-title').textContent=context.mode==='edition'?t('Continúa tu newsletter'):context.mode==='personal'?t('Tu selección personal'):t('Actualidad del sector');
    $('reading-detail').textContent=context.mode==='edition'?t('{name} · {from} / {to} · {count} noticias enviadas',{name:context.title,from:context.from,to:context.to,count:context.count}):context.mode==='personal'?context.title:t('Personaliza tu seguimiento con tus suscripciones.');
    $('reading-current').hidden=context.mode!=='edition';
  }};
}
