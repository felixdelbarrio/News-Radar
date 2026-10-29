import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
const days=Array.from({length:30},(_,i)=>({date:'2026-10-'+String(i+1).padStart(2,'0'),users:i%9}));
async function chart(t){
 const observers=new Map(),a=await app(t,{configure({w,replies}){
  replies.getAdoption.daily=days;
  w.ResizeObserver=class{constructor(callback){this.callback=callback;}observe(target){observers.set(target.id,this.callback);}};
  const media=w.matchMedia;w.matchMedia=query=>query.includes('prefers-reduced-motion')?{matches:true}:media(query);
 }});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="adoption"]');
 const viewport=a.find('.activity-chart'),columns=[...viewport.children];let width=288;
 Object.defineProperties(viewport,{clientWidth:{get:()=>width},scrollWidth:{get:()=>days.length*72-8}});
 columns.forEach((column,i)=>{column.getBoundingClientRect=()=>({left:i*72,width:64});});
 const moves=[];viewport.scrollTo=options=>{moves.push(options);viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,options.left));viewport.dispatchEvent(new a.w.Event('scroll'));};
 const resize=value=>{width=value;observers.get('adoption-chart')();};resize(width);
 return {...a,viewport,resize,moves};
}
test('la cronología conserva todos los días y sus valores; navega localmente desde los más recientes',async t=>{
 const a=await chart(t),rpc=a.calls.filter(row=>row.method==='getAdoption').length;
 assert.equal(a.w.document.querySelectorAll('.activity-column').length,30);assert.equal(a.viewport.children[0].dataset.date,'2026-10-01');assert.equal(a.viewport.children[29].dataset.date,'2026-10-30');
 assert.equal(a.find('[data-activity-step="1"]').disabled,true);assert.equal(a.find('[data-activity-step="-1"]').disabled,false);assert.match(a.find('.activity-range').textContent,/30\/10\/2026/);
 const end=a.viewport.scrollLeft;await a.click('[data-activity-step="-1"]');assert.ok(a.viewport.scrollLeft<end);assert.equal(a.find('[data-activity-step="1"]').disabled,false);assert.equal(a.moves.at(-1).behavior,'instant');
 await a.click('[data-activity-end]');assert.equal(a.viewport.scrollLeft,end);assert.equal(a.find('[data-activity-end]').disabled,true);
 assert.equal(a.calls.filter(row=>row.method==='getAdoption').length,rpc);assert.equal(a.find('.activity-column .activity-value').textContent,'0');
});
test('teclado, desplazamiento táctil, límites y cambio de ancho mantienen una ventana coherente',async t=>{
 const a=await chart(t),key=value=>a.viewport.dispatchEvent(new a.w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
 key('Home');assert.equal(a.viewport.scrollLeft,0);assert.equal(a.find('[data-activity-step="-1"]').disabled,true);
 key('ArrowRight');assert.ok(a.viewport.scrollLeft>0);key('PageUp');assert.equal(a.viewport.scrollLeft,0);
 a.viewport.scrollLeft=144;a.viewport.dispatchEvent(new a.w.Event('scroll'));const earlier=a.find('.activity-range').textContent;
 a.resize(216);assert.equal(a.viewport.scrollLeft,144);assert.notEqual(a.find('.activity-range').textContent,earlier);
 key('End');a.resize(144);assert.equal(a.viewport.scrollLeft,a.viewport.scrollWidth-144);assert.equal(a.find('[data-activity-step="1"]').disabled,true);
 a.resize(3000);assert.equal(a.viewport.scrollLeft,0);assert.equal(a.find('[data-activity-step="-1"]').disabled,true);assert.equal(a.find('[data-activity-step="1"]').disabled,true);
 assert.ok(a.viewport.hasAttribute('tabindex'));assert.equal(a.find('.activity-range').getAttribute('aria-live'),'polite');
});
test('un cambio de filtros con datos vacíos retira la cronología y deja un estado claro',async t=>{
 const a=await chart(t);a.replies.getAdoption.daily=[];await a.change('#adoption-search','sin actividad');
 assert.match(a.find('#adoption-chart').textContent,/No hay actividad diaria/);assert.equal(a.w.document.querySelector('.activity-chart'),null);
});
test('los meses y años tienen un solo rótulo y color alterno; cada día conserva su fecha accesible',async t=>{
 const values=['2026-12-30','2026-12-31','2027-01-01','2027-01-02'],a=await app(t,{language:'en-US',configure({replies}){replies.getAdoption.daily=values.map((date,i)=>({date,users:i+1}));}});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="adoption"]');
 assert.deepEqual([...a.w.document.querySelectorAll('.activity-date')].map(x=>x.textContent),['30','31','01','02']);
 assert.deepEqual([...a.w.document.querySelectorAll('.activity-month')].map(x=>x.textContent),['December 2026','January 2027']);
 const columns=[...a.w.document.querySelectorAll('.activity-column')];assert.notEqual(columns[0].className,columns[2].className);assert.equal(columns[0].className,columns[1].className);assert.ok(columns.every(x=>x.getAttribute('aria-label').includes(x.dataset.date.slice(0,4))));
});
test('volver a renderizar reutiliza el observer y los listeners del controlador',async t=>{
 let adoptionObservers=0;const a=await app(t,{configure({w,replies}){replies.getAdoption.daily=days;w.ResizeObserver=class{observe(target){if(target.id==='adoption-chart')adoptionObservers++;}};}});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="adoption"]');await a.change('#adoption-search','fixture');await a.change('#adoption-search','');
 assert.equal(adoptionObservers,1);assert.equal(a.w.document.querySelectorAll('.activity-column').length,days.length);assert.equal(a.w.document.querySelectorAll('.activity-month').length,1);
});
