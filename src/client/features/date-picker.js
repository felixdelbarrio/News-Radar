import {language,t} from '../core/language.js';
import {escape} from '../core/dom.js';
let dialog,input,month,focused;
const iso=date=>date.toISOString().slice(0,10),day=value=>new Date(value+'T12:00:00Z');
function paint(){
 const title=new Intl.DateTimeFormat(language,{month:'long',year:'numeric',timeZone:'UTC'}).format(month),weekday=new Intl.DateTimeFormat(language,{weekday:'short',timeZone:'UTC'}),label=new Intl.DateTimeFormat(language,{dateStyle:'full',timeZone:'UTC'}),start=new Date(month);start.setUTCDate(1-(month.getUTCDay()+6)%7);
 dialog.innerHTML='<div class="calendar-heading"><button type="button" class="button" data-month="-1" aria-label="'+escape(t('Mes anterior'))+'">‹</button><h2 id="calendar-title" aria-live="polite">'+escape(title)+'</h2><button type="button" class="button" data-month="1" aria-label="'+escape(t('Mes siguiente'))+'">›</button></div><div class="calendar-grid" role="grid" aria-labelledby="calendar-title"><div role="row">'+Array.from({length:7},(_,i)=>{const date=new Date(start);date.setUTCDate(date.getUTCDate()+i);return '<span role="columnheader">'+escape(weekday.format(date))+'</span>';}).join('')+'</div>'+Array.from({length:6},(_,week)=>'<div role="row">'+Array.from({length:7},(_,weekday)=>{const date=new Date(start);date.setUTCDate(date.getUTCDate()+week*7+weekday);const value=iso(date);return '<button type="button" role="gridcell" data-day="'+value+'" aria-label="'+escape(label.format(date))+'" aria-selected="'+(value===input.value)+'" tabindex="'+(value===focused?0:-1)+'" class="'+(date.getUTCMonth()!==month.getUTCMonth()?'calendar-adjacent':'')+'">'+date.getUTCDate()+'</button>';}).join('')+'</div>').join('')+'</div><div class="actions"><button type="button" class="button" data-calendar-close>'+escape(t('Cancelar'))+'</button></div>';
 dialog.querySelector('[data-day="'+focused+'"]')?.focus();
}
export function openDatePicker(target){
 input=target;focused=input.value||new Date().toLocaleDateString('sv-SE');month=day(focused);month.setUTCDate(1);
 if(!dialog){
  dialog=document.createElement('dialog');dialog.className='calendar-dialog';dialog.setAttribute('aria-labelledby','calendar-title');document.body.append(dialog);
  dialog.addEventListener('click',event=>{const date=event.target.closest('[data-day]');if(date){input.value=date.dataset.day;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));dialog.close();input.focus();}else if(event.target.closest('[data-calendar-close]')||event.target===dialog){dialog.close();input.focus();}else{const button=event.target.closest('[data-month]');if(button){month.setUTCMonth(month.getUTCMonth()+Number(button.dataset.month));focused=iso(month);paint();}}});
  dialog.addEventListener('keydown',event=>{const cell=event.target.closest('[data-day]');if(!cell)return;const date=day(cell.dataset.day),offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-(date.getUTCDay()+6)%7,End:6-(date.getUTCDay()+6)%7};if(Object.hasOwn(offsets,event.key))date.setUTCDate(date.getUTCDate()+offsets[event.key]);else if(['PageUp','PageDown'].includes(event.key)){const desired=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+(event.key==='PageUp'?-1:1)*(event.shiftKey?12:1));date.setUTCDate(Math.min(desired,new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()));}else return;event.preventDefault();focused=iso(date);month=day(focused);month.setUTCDate(1);paint();});
 }
 paint();dialog.showModal();dialog.querySelector('[data-day="'+focused+'"]')?.focus();
}
export function initializeDatePickers(){
 document.addEventListener('click',event=>{if(event.target.matches('input[type=date]')){event.preventDefault();openDatePicker(event.target);}});
 document.addEventListener('keydown',event=>{if(event.target.matches('input[type=date]')&&event.altKey&&event.key==='ArrowDown'){event.preventDefault();openDatePicker(event.target);}});
}
