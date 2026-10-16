import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
import {storage} from './helpers/server.mjs';

test('opción vacía y respuesta sin resultados conservan Colombia, señal y chips',async t=>{
 const a=await app(t,{configure({data}){data.selection={country:'Colombia',signal:'Lanzamiento de producto'};data.countries=['Colombia'];data.briefing.items[0].pais='Colombia';data.briefing.bySignal.push({name:'Mejora de oferta',total:0});}});
 const before=a.calls.length,empty=a.find('#briefing-signals .signal-card:last-child');assert.equal(empty.tagName,'ARTICLE');empty.click();await tick();assert.equal(a.calls.length,before);assert.match(a.find('#active-filters').textContent,/Colombia/);
 a.data.countries=[];a.data.briefing.items=[];a.data.briefing.geographies=[];a.data.briefing.total=0;
 await a.click('#open-filters');await a.submit('#filters');assert.match(a.find('#active-filters').textContent,/Colombia/);assert.match(a.find('#active-filters').textContent,/Lanzamiento de producto/);assert.equal(a.find('#filters [name="country"]').value,'Colombia');
});
test('cargar más añade noticias sin perder las anteriores; cambiar filtros reinicia la lista',async t=>{
 const a=await app(t);const row={...a.data.briefing.items[0],id:'first'};Object.assign(a.data,{items:[row],page:0,pageSize:1,total:2,newsRevision:'stable'});await a.click('[data-view="news"]');
 const firstCard=a.find('#news-list .news-row');a.data.items=[{...row,id:'second',titular:'Segunda publicación'}];a.data.page=1;await a.click('#next');assert.equal(a.find('#news-list').querySelectorAll('.news-row').length,2);assert.equal(a.find('#news-list .news-row'),firstCard);assert.match(a.find('#news-list').textContent,/BBVA lanza cuenta/);assert.match(a.find('#news-list').textContent,/Segunda publicación/);assert.equal(a.find('#next').disabled,true);
 a.data.page=0;a.data.total=1;await a.change('#filters [name="search"]','segunda');assert.equal(a.find('#news-list').querySelectorAll('.news-row').length,1);
});
test('mapa y países se destacan juntos, el punto muestra detalle y el medio filtra',async t=>{
 const a=await app(t,{configure({data}){data.geographies=[{name:'España',mapId:724}];data.radar.publishers=[{publisher:'Editor',total:1}];data.radar.geographies=[{country:'España',total:1,entities:[]}];data.radar.trend={buckets:['2026-10-11'],series:[{entity:'BBVA',total:1,values:[1]}],from:'2026-10-11',to:'2026-10-11',intervalDays:1};}});await a.click('[data-view="radar"]');
 a.find('.geo-row').dispatchEvent(new a.w.Event('pointerover',{bubbles:true}));assert.ok(a.find('#world-map [data-country="España"]').classList.contains('is-highlighted'));
 a.find('.chart-point').dispatchEvent(new a.w.Event('focusin',{bubbles:true}));assert.equal(a.find('#trend-tooltip').hidden,false);assert.match(a.find('#trend-tooltip').textContent,/2026-10-11.*BBVA.*1 publicaciones/);
 await a.click('[data-source="Editor"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.source,'Editor');
});
test('suscripción espera con prioridad, confirma escritura y libera bloqueo incluso si flush falla',()=>{
 const s=storage();s.c.initializeConfiguration();let paused=false,released=0;
 s.c.LockService.getScriptLock=()=>({tryLock:wait=>{paused=s.c.backgroundPaused_();assert.equal(wait,60000);return true;},releaseLock:()=>released++});
 const result=s.c.saveSubscription({periodicity:'fortnightly',filters:{}});assert.match(result,/guardada/);assert.equal(paused,true);assert.equal(s.c.getSubscriptions().length,1);assert.equal(s.c.backgroundPaused_(),false);
 s.c.SpreadsheetApp.flush=()=>{throw Error('Flush failed');};assert.throws(()=>s.c.withForegroundWrite_(()=>{}),/Flush failed/);assert.equal(released,2);assert.equal(s.c.backgroundPaused_(),false);
});
test('una petición nueva durante la reanudación conserva el trabajo diferido',()=>{
 const s=storage();s.c.initializeConfiguration();s.c.deferBackgroundWork_('daily');s.c.requestDailyPipeline_=()=>{s.properties['WORK_INTENT:other']=String(Date.now()+600000);};s.c.workWake_();assert.equal(s.properties['WORK_PENDING:daily'],'true');assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='workWake_'));
});
test('el worker refresca configuración si otra escritura cambia su revisión entre lotes',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();const hours=[],lock=c.LockService.getScriptLock();
 c.collectionWork_=()=>({jobs:[],tasks:[],pending:[{ciclo:'test'}]});c.backgroundTask_=()=> 'collection';c.knownUrls_=()=>({});c.collectionStatus_=()=>({});c.collectionReadyAt_=()=>Infinity;
 c.collectionBatch_=()=>{hours.push(c.settings_().dailyHour);return {added:0,errors:[]};};
 c.LockService.getScriptLock=()=>({...lock,releaseLock(){const row=s.sheets.get('Configuracion').grid.find(row=>row[0]==='settings'),settings=JSON.parse(row[1]);settings.dailyHour=9;row[1]=JSON.stringify(settings);s.properties.CONFIG_REVISION='changed';}});
 const initial=c.settings_().dailyHour;c.processBackground_(2);assert.deepEqual(hours,[initial,9]);
});
