import {$} from '../core/dom.js';
import {t} from '../core/language.js';
export function createReadingContext({onCurrent}){
  $('reading-current').addEventListener('click',onCurrent);
  return {render(data,view){
    const context=data.context||{mode:'current'},available=context.mode==='edition';
    $('reading-context').dataset.available=String(available);
    $('reading-context').hidden=!available||!['news','briefing','radar'].includes(view);
    $('reading-detail').textContent=available?t('{name} · {from} / {to} · {count} noticias en esta edición',{name:context.title,from:context.from,to:context.to,count:context.count}):'';
    $('reading-current').hidden=!available;
  }};
}
