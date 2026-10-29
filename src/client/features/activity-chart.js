import {escape} from '../core/dom.js';
import {t,language} from '../core/language.js';
import {formatCalendarDay} from '../../shared/locales.js';
const arrow=direction=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${direction<0?'M15 6l-6 6 6 6':'M9 6l6 6-6 6'}"/></svg>`;
export function activityChart(days){
 if(!days.length)return '<div class="note">'+t('No hay actividad diaria registrada en este período.')+'</div>';
 const maximum=Math.max(1,...days.map(day=>day.users));
 return `<section class="activity-timeline" aria-label="${escape(t('Usuarios activos por día'))}"><div class="activity-heading"><div><strong>${t('Actividad diaria')}</strong><p class="activity-range" aria-live="polite" aria-atomic="true"></p></div><button type="button" class="activity-latest" data-activity-end title="${escape(t('Ir al día más reciente'))}">${t('Últimos días')}</button></div><div class="activity-navigation"><button type="button" class="activity-control" data-activity-step="-1" aria-label="${escape(t('Ver días anteriores'))}">${arrow(-1)}</button><ul class="activity-chart" tabindex="0" aria-label="${escape(t('Usuarios activos por día'))}">${days.map(day=>`<li class="activity-column" data-date="${escape(day.date)}" aria-label="${escape(formatCalendarDay(day.date,language)+' · '+t('{count} usuarios',{count:day.users}))}"><span class="activity-value">${day.users}</span><div class="activity-bar" style="--bar-height:calc(var(--activity-chart-height) * ${day.users/maximum})"></div><span class="activity-date">${escape(day.date.slice(5))}</span></li>`).join('')}</ul><button type="button" class="activity-control" data-activity-step="1" aria-label="${escape(t('Ver días siguientes'))}">${arrow(1)}</button></div></section>`;
}
export function createActivityChart(container){
 let viewport,columns=[],previous,next,latest,range,atEnd=true;
 const step=()=>columns.length>1?columns[1].getBoundingClientRect().left-columns[0].getBoundingClientRect().left:columns[0]?.getBoundingClientRect().width||0;
 function update(){
  if(!viewport||!viewport.clientWidth)return;
  const end=Math.max(0,viewport.scrollWidth-viewport.clientWidth),left=Math.max(0,viewport.scrollLeft),width=step();
  previous.disabled=left<=1;next.disabled=latest.disabled=left>=end-1;atEnd=next.disabled;
  if(!width)return;
  const first=Math.min(columns.length-1,Math.floor((left+1)/width)),last=Math.min(columns.length-1,Math.ceil((left+viewport.clientWidth-1)/width)-1),text=formatCalendarDay(columns[first].dataset.date,language)+' — '+formatCalendarDay(columns[last].dataset.date,language);
  if(range.textContent!==text)range.textContent=text;
 }
 function move(direction){
  if(!viewport)return;
  const width=step(),page=Math.max(1,Math.ceil(viewport.clientWidth/(width||1))-1)*(width||viewport.clientWidth),left=direction==='start'?0:direction==='end'?viewport.scrollWidth:viewport.scrollLeft+direction*page;
  viewport.scrollTo({left:Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,left)),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 container.addEventListener('click',event=>{const button=event.target.closest('[data-activity-step],[data-activity-end]');if(button&&!button.disabled)move(button.hasAttribute('data-activity-end')?'end':Number(button.dataset.activityStep));});
 container.addEventListener('keydown',event=>{if(event.target!==viewport)return;const direction={ArrowLeft:-1,ArrowRight:1,PageUp:-1,PageDown:1,Home:'start',End:'end'}[event.key];if(direction!==undefined){event.preventDefault();move(direction);}});
 function layout(){
  if(!viewport||!viewport.clientWidth)return;
  const styles=window.getComputedStyle(viewport),minimum=parseFloat(styles.getPropertyValue('--activity-column-width'))||columns[0].getBoundingClientRect().width,gap=parseFloat(styles.columnGap)||0,width=viewport.clientWidth,visible=Math.max(1,Math.min(columns.length,Math.floor((width+gap)/(minimum+gap)))),first=step()?Math.round(viewport.scrollLeft/step()):0;
  viewport.style.setProperty('--activity-column-size',(width-gap*(visible-1))/visible+'px');
  viewport.scrollLeft=atEnd?Math.max(0,viewport.scrollWidth-width):first*step();update();
 }
 new ResizeObserver(layout).observe(container);
 return {render(days){
  atEnd=true;container.innerHTML=activityChart(days);viewport=container.querySelector('.activity-chart');if(!viewport)return;
  columns=Array.from(viewport.children);previous=container.querySelector('[data-activity-step="-1"]');next=container.querySelector('[data-activity-step="1"]');latest=container.querySelector('[data-activity-end]');range=container.querySelector('.activity-range');
  viewport.addEventListener('scroll',update,{passive:true});layout();
 }};
}
