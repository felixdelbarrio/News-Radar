import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
import {storage} from './helpers/server.mjs';

test('la pestaña activa conserva sus nodos y volver a una selección vigente reutiliza sus datos',async t=>{
 const a=await app(t,{configure({data}){data.newsRevision='news-1';data.configurationRevision='config-1';}});
 const card=a.find('#briefing-list').firstElementChild,count=a.calls.length;
 await a.click('[data-view="briefing"]');assert.equal(a.calls.length,count);assert.equal(a.find('#briefing-list').firstElementChild,card);
 await a.click('[data-view="radar"]');await a.click('[data-view="news"]');
 const dashboards=a.calls.filter(row=>row.method==='getDashboard').length;
 await a.click('[data-view="radar"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,dashboards);
 // Applying filters is an explicit refresh, even when a navigation snapshot exists.
 await a.change('#filters [name="entity"]','BBVA');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,dashboards+1);
});

test('cambios rápidos de vista comparten el RPC pendiente y solo presentan la última selección',async t=>{
 const pending=[];
 const a=await app(t,{configure({w,data}){
  const backend=w.RADAR_PREVIEW.call;
  w.RADAR_PREVIEW.call=(method,query)=>method==='getDashboard'&&query.view!=='briefing'?new Promise(resolve=>pending.push({query,resolve:()=>resolve(structuredClone(data))})):backend(method,query);
 }});
 a.find('[data-view="radar"]').click();a.find('[data-view="news"]').click();a.find('[data-view="radar"]').click();
 assert.equal(pending.filter(row=>row.query.view==='radar').length,1);assert.equal(pending.length,2);
 for(const row of pending)row.resolve();await tick();
 assert.equal(a.find('#radar-section').hidden,false);assert.equal(a.find('#news-section').hidden,true);assert.equal(a.find('#loading').hidden,true);assert.equal(a.find('.content').getAttribute('aria-busy'),'false');
});

test('la navegación de lectura no sondea progreso de recopilación',async t=>{const a=await app(t);for(const view of ['news','radar','briefing','subscriptions'])await a.click('[data-view="'+view+'"]');assert.ok(!a.calls.some(r=>r.method==='getCollectionProgress'));});

test('caché fragmentada conserva Unicode, respeta bytes y se recupera si se pierde un fragmento',()=>{
 const s=storage(),cache=s.c.CacheService.getScriptCache(),data={items:['€😀\\"'.repeat(18000)]};
 s.c.writeDashboardCache_(cache,'large',data);
 for(const value of s.cache.values())assert.ok(Buffer.byteLength(value)<90000);
 assert.equal(JSON.stringify(s.c.readDashboardCache_(cache,'large')),JSON.stringify(data));
 const fragment=[...s.cache.keys()].find(key=>key.startsWith('large:'));s.cache.delete(fragment);
 assert.equal(s.c.readDashboardCache_(cache,'large'),null);
 s.c.writeDashboardCache_(cache,'large',data);assert.equal(JSON.stringify(s.c.readDashboardCache_(cache,'large')),JSON.stringify(data));
 s.c.writeDashboardCache_(cache,'oversize',{items:['x'.repeat(12000*65)]});assert.equal(s.cache.has('oversize'),false);
});

test('las tablas adaptables conservan sus encabezados y etiquetas al cambiar el idioma',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="sources"]');
 const table=a.find('#configured-sources-body').closest('table');assert.equal(table.getAttribute('role'),'table');
 const row=a.find('#configured-sources-body').rows[0];
 a.replies.getAdminLogs.items=[{fecha:'2026-10-24',estado:'OK',detalle:'Detalle'}];await a.click('[data-admin-view="audit"]');
 const subscriptionTable=a.find('#logs-body').closest('table');
 assert.equal(subscriptionTable.getAttribute('role'),'table');
 assert.deepEqual([...a.find('#logs-body').rows[0].cells].map(cell=>cell.dataset.label),[...subscriptionTable.tHead.rows[0].cells].map(cell=>cell.textContent));
 assert.ok(row);
 await a.change('#preview-language','en');
 assert.deepEqual([...a.find('#logs-body').rows[0].cells].map(cell=>cell.dataset.label),[...subscriptionTable.tHead.rows[0].cells].map(cell=>cell.textContent));
});

test('la caché reutiliza contenido y comprueba revisiones tras un minuto',async t=>{
 let now=0;
 const a=await app(t,{configure({w,data}){const epoch=w.Date.now();w.Date.now=()=>epoch+now;w.performance.now=()=>now;data.newsRevision='news-1';data.configurationRevision='config-1';}});
 await a.click('[data-view="radar"]');now=10;await a.click('[data-view="news"]');
 const count=a.calls.filter(row=>row.method==='getDashboard').length;
 now=50000;await a.click('[data-view="radar"]');now=55000;await a.click('[data-view="news"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,count);
 now=61000;await a.click('[data-view="radar"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,count);assert.ok(a.calls.some(row=>row.method==='getReadingRevision'));
});

test('el spinner y los skeletons pertenecen al panel activo; una respuesta abandonada no prolonga su carga',async t=>{
 const pending=[];
 const a=await app(t);a.w.RADAR_PREVIEW.call=method=>method==='getDashboard'?new Promise((resolve,reject)=>pending.push({resolve,reject})):Promise.resolve({});
 await a.click('[data-view="news"]');assert.equal(a.find('#loading').parentElement.id,'news-section');assert.equal(a.find('#loading-skeleton').hidden,false);
 await a.click('[data-view="radar"]');assert.equal(a.find('#loading').parentElement.id,'radar-section');
 pending[1].resolve(a.data);await tick();assert.equal(a.find('#loading').hidden,true);assert.equal(a.find('#loading-skeleton').hidden,true);assert.equal(a.find('.content').getAttribute('aria-busy'),'false');
 pending[0].reject(Error('Respuesta abandonada'));await tick();assert.equal(a.find('#loading').hidden,true);assert.equal(a.find('#message').hidden,true);
});

test('la telemetría distingue caché de navegador y acepta Taxonomía solo para administradores',()=>{
 const s=storage();s.c.initializeConfiguration();
 const saved={};s.c.pruneEvents_=()=>{};s.c.trim_=()=>{};s.c.recordNewsletterEvents_=()=>{};s.c.append_=(name,rows)=>saved[name]=rows;
 const event={session:'test-session-123456',event:'rendimiento',view:'taxonomy',duration:10,performance:{clientCacheHit:true,cacheHit:true,serverMs:0,rpcMs:0,renderMs:10}};
 s.c.recordEvents([event]);assert.match(saved.Telemetria[0][4],/RPC 0 ms; servidor 0 ms/);assert.match(saved.Telemetria[0][4],/caché cliente hit/);
 s.setEmail('reader@bbva.com');assert.throws(()=>s.c.recordEvents([event]),/Vista restringida/);
});

test('Configuración solicita únicamente el catálogo y la pestaña activa no repite las lecturas',async t=>{
 const pending=[];
 const a=await app(t,{configure({w,replies}){
  const backend=w.RADAR_PREVIEW.call;
  w.RADAR_PREVIEW.call=(method,query)=>method==='getConfiguration'?new Promise(resolve=>pending.push({method,resolve:()=>resolve(structuredClone(replies[method]))})):backend(method,query);
 }});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');assert.deepEqual(pending.map(row=>row.method).sort(),['getConfiguration']);
 pending[0].resolve();await tick();assert.equal(a.find('#loading').hidden,true);
 await a.click('[data-admin-view="configuration"]');assert.equal(pending.length,1);
});

test('una revisión publicada reemplaza la selección cacheada en segundo plano',async t=>{
 let now=0;
 const a=await app(t,{configure({w,data}){const epoch=w.Date.now();w.Date.now=()=>epoch+now;w.performance.now=()=>now;data.newsRevision='revision-1';data.configurationRevision='config-1';data.readingDay='2026-10-26';}});
 await a.click('[data-view="radar"]');await a.click('[data-view="news"]');
 const count=a.calls.filter(row=>row.method==='getDashboard').length;
 a.data.newsRevision='revision-2';now=61000;await a.click('[data-view="radar"]');await tick();
 assert.ok(a.calls.some(row=>row.method==='getReadingRevision'));
 assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,count+1);
 assert.equal(a.find('#radar-section').hidden,false);
 assert.equal(a.find('#loading').hidden,true);
});
