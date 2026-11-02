import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
import {storage} from './helpers/server.mjs';
test('incidencias conserva los meses del filtro y navega sin RPC en móvil, teclado y cambio de ancho',async t=>{
 const {c}=storage();c.initializeConfiguration();
 const outage=JSON.parse(JSON.stringify(c.radarOutages_([],[],{from:'2025-11-03',to:'2026-11-02'}))),observers=new Map();
 const a=await app(t,{entry:'radar',location:{view:'radar'},configure({w,data}){data.radar.outages=outage;w.ResizeObserver=class{constructor(callback){this.callback=callback;}observe(target){observers.set(target.id,this.callback);}};}});
 await tick();const host=a.find('#radar-outage-timeline'),viewport=host.querySelector('.activity-chart'),columns=[...viewport.children];let width=192;
 Object.defineProperties(viewport,{clientWidth:{get:()=>width},scrollWidth:{get:()=>columns.length*64}});
 columns.forEach((node,i)=>node.getBoundingClientRect=()=>({left:i*64,width:64}));
 viewport.scrollTo=options=>{viewport.scrollLeft=options.left;viewport.dispatchEvent(new a.w.Event('scroll'));};
 const resize=value=>{width=value;observers.get(host.id)();};resize(width);
 const previous=host.querySelector('[data-activity-step="-1"]'),next=host.querySelector('[data-activity-step="1"]'),calls=a.calls.length;
 assert.equal(columns.length,13);assert.equal(columns[0].dataset.date,'2025-11-01');assert.equal(columns.at(-1).dataset.date,'2026-11-01');assert.equal(next.disabled,true);assert.equal(previous.disabled,false);
 await a.click('#radar-outage-timeline [data-activity-step="-1"]');assert.equal(next.disabled,false);
 const key=key=>viewport.dispatchEvent(new a.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));key('Home');assert.equal(viewport.scrollLeft,0);assert.equal(previous.disabled,true);key('ArrowRight');assert.ok(viewport.scrollLeft>0);key('End');resize(128);assert.equal(viewport.scrollLeft,viewport.scrollWidth-width);assert.equal(next.disabled,true);
 resize(1000);assert.equal(viewport.scrollLeft,0);assert.equal(previous.disabled,true);assert.equal(next.disabled,true);assert.equal(a.calls.length,calls);assert.match(host.querySelector('.activity-range').textContent,/25.*26/);
});
