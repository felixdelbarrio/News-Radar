import {call} from '../core/api.js';
import {escape} from '../core/dom.js';
export function attachNewsletterSummaries(container){
 container.addEventListener('toggle',async event=>{const details=event.target;if(!details.matches('[data-newsletter-summary]')||!details.open||details.dataset.loaded)return;const content=details.querySelector('[data-summary-content]');content.textContent='Cargando resumen…';details.dataset.loaded='pending';
  try{const data=await call('getNewsletterSummary',details.dataset.newsletterSummary);content.innerHTML='<p class="small">'+escape(data.from)+' / '+escape(data.to)+' · '+data.count+' publicaciones · '+escape(data.country||'Sin personalizar')+'</p><ul>'+(data.cards?.length?data.cards.map(card=>'<li><strong>'+escape(card.category)+'</strong> · '+escape(card.scope)+'<br>'+(card.url?'<a href="'+escape(card.url)+'" target="_blank" rel="noopener">'+escape(card.title)+'</a>':escape(card.title))+'</li>'):data.topics.map(topic=>'<li>'+escape(topic)+'</li>')).join('')+'</ul>';details.dataset.loaded='true';}catch(error){content.textContent=error.message;delete details.dataset.loaded;}
 },true);
}
