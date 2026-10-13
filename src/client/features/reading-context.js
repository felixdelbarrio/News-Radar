import {$,escape,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function createReadingContext({onCurrent,run}){
  let edition='',signature='';
  $('reading-current').addEventListener('click',onCurrent);
  const form=$('edition-feedback');
  form.addEventListener('submit',event=>{event.preventDefault();run(async()=>{const result=await call('saveNewsletterFeedback',{edition,rating:form.elements.rating.value,comment:form.elements.comment.value});signature='';paintFeedback(result.feedback);message(t('Valoración guardada.'));},false);});
  function paintFeedback(feedback){form.elements.rating.value=feedback?.valoracion||'';form.elements.comment.value=feedback?.comentario||'';}
  return {render(data,view){
    const context=data.context||{mode:'current'},available=context.mode==='edition';edition=available?context.id:'';
    $('reading-context').dataset.available=String(available);$('reading-context').hidden=!available||!['news','briefing','radar'].includes(view);
    $('reading-detail').textContent=available?t('{name} · {from} / {to} · {count} noticias en esta edición',{name:context.title,from:context.from,to:context.to,count:context.count}):'';$('reading-current').hidden=!available;
    if(!available)return;
    const next=JSON.stringify([edition,data.feedback]);if(next===signature)return;signature=next;paintFeedback(data.feedback);form.elements.comment.maxLength=context.commentLimit;
    $('edition-narrative').hidden=!context.editorial;
    $('edition-summary').innerHTML=context.editorial?'<p>'+escape(context.editorial.intro)+'</p>'+context.editorial.cards.map(card=>'<article><strong>'+escape(card.title)+'</strong><p>'+escape(card.fact)+'</p><p class="muted">'+escape(card.relevance)+'</p></article>').join(''):'';
  }};
}
