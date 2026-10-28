import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
export function createReadingContext({run}){
 let edition='',iconsRequested=false;const form=$('edition-feedback'),dialog=$('feedback-dialog');
 $('close-feedback').addEventListener('click',()=>dialog.close());
 form.addEventListener('submit',event=>{event.preventDefault();run(async()=>{await call('saveNewsletterFeedback',{edition,rating:form.elements.rating.value,comment:form.elements.comment.value});dialog.close();message(t('Valoración guardada.'));},false);});
 return {render(data){edition=data.context?.mode==='edition'?data.context.id:'';if(data.context?.commentLimit)form.elements.comment.maxLength=data.context.commentLimit;},open(id,rating){edition=id;form.elements.rating.value=rating;dialog.showModal();if(!iconsRequested){iconsRequested=true;call('getNewsletterFeedbackIcons').then(icons=>{for(const value of ['positive','negative'])if(icons[value]){const image=document.createElement('img');image.src=icons[value];image.alt=t(value==='positive'?'Útil':'Mejorable');image.width=32;image.height=32;form.querySelector('[data-rating-icon="'+value+'"]').replaceChildren(image);}}).catch(()=>{iconsRequested=false;});}}};
}
