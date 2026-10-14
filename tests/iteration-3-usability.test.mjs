import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
import {storage} from './helpers/server.mjs';

test('KPIs informativos no añaden filtros y el panel cierra con sus tres acciones',async t=>{
 const a=await app(t),reads=a.calls.length;
 assert.equal(a.find('#briefing-signals').querySelectorAll('button,[tabindex],[data-signal]').length,0);
 await a.click('#briefing-signals .signal-card');assert.equal(a.calls.length,reads);
 assert.equal(a.find('.selection-toolbar').parentElement,a.find('#briefing-section .reading-hero'));
 for(const selector of ['#restore-filters','#all-filters','#apply-filters']){
  await a.click('#open-filters');assert.equal(a.find('#filters-dialog').open,true);
  await a.click(selector);assert.equal(a.find('#filters-dialog').open,false);
 }
 await a.click('#open-filters');await a.click('#filters-dialog');assert.equal(a.find('#filters-dialog').open,false);
});

test('desplegables añadidos cierran al pulsar fuera y los expansores reflejan su estado',async t=>{
 const a=await app(t),d=a.w.document;
 const select=d.createElement('select');select.innerHTML=Array.from({length:8},(_,i)=>`<option value="${i}">Opción ${i}</option>`).join('');d.querySelector('#filters').append(select);await tick();
 const details=select.closest('.searchable-select');assert.ok(details);
 details.open=true;d.querySelector('#panel-dialog-title').dispatchEvent(new a.w.Event('pointerdown',{bubbles:true}));assert.equal(details.open,false);
 const advanced=a.find('#advanced-filters');
 for(const open of [true,false]){advanced.open=open;advanced.dispatchEvent(new a.w.Event('toggle'));assert.equal(advanced.querySelector('summary').textContent,open?'Menos filtros':'Más filtros');}
 await a.click('#open-filters');assert.equal(advanced.open,false);assert.equal(advanced.querySelector('summary').textContent,'Más filtros');
});

test('Noticias conserva filas al ampliar, identifica publicación y oculta paginación agotada',async t=>{
 const a=await app(t),row={...a.data.briefing.items[0],id:'a',extracto:''};
 Object.assign(a.data,{items:[row],total:2,pageSize:1,newsRevision:'n'});await a.click('[data-view="news"]');
 const first=a.find('.news-row');assert.match(first.textContent,/Publicado:/);assert.doesNotMatch(first.textContent,/Consulta la fuente original/);
 assert.equal(a.find('#next').hidden,false);a.data.items=[{...row,id:'b'}];a.data.page=1;await a.click('#next');assert.equal(a.find('.news-row'),first);assert.equal(a.find('#news-list').querySelectorAll('tbody tr').length,2);assert.equal(a.find('#next').hidden,true);
 assert.equal(first.querySelector('.geography-flag,.publisher-logo'),null);
});

test('la franja de Radar muestra todas las series y el mapa vacío no se destaca',async t=>{
 const a=await app(t,{configure({data}){data.geographies=[{name:'España',mapId:724}];data.radar.trend={buckets:['2026-10-10','2026-10-11'],series:[{entity:'BBVA',values:[1,2]},{entity:'Santander',values:[0,3]}]};}});
 await a.click('[data-view="radar"]');const band=a.find('[data-bucket="1"]');band.dispatchEvent(new a.w.Event('pointerover',{bubbles:true}));
 assert.equal(band.classList.contains('is-highlighted'),true);assert.match(a.find('#trend-tooltip').textContent,/2026-10-11.*BBVA: 2.*Santander: 3/);
 a.find('#world-map [data-country="España"]').dispatchEvent(new a.w.Event('pointerover',{bubbles:true}));assert.equal(a.find('#world-map [data-country="España"]').classList.contains('is-highlighted'),false);
});

test('nuevas traducciones invalidan recuentos entre idiomas; los nombres conservan el contenido',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();let reads=0;
 c.cachedNewsRecords_=()=>[];c.newsDashboard_=()=>{reads++;return {items:[]};};c.savedArticleTranslations_=rows=>rows;
 const get=language=>c.dashboardContent_({},[],'news',language);
 assert.equal(get('es').cacheHit,false);assert.equal(get('en').cacheHit,false);
 s.properties['TRANSLATIONS_REVISION:en']='new';assert.equal(get('es').cacheHit,false);assert.equal(get('en').cacheHit,false);
 c.invalidateNews_(false,false);assert.equal(get('es').cacheHit,true);
 c.invalidateNews_();assert.equal(get('es').cacheHit,false);assert.equal(reads,5);
});

test('metadatos reutilizados respetan revisiones de configuración y nombres traducidos',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();let reads=0;c.taxonomyTranslations_=()=>{reads++;return {es:{nombre:String(reads)}};};
 const first=c.dashboardMetadata_();assert.deepEqual(JSON.parse(JSON.stringify(c.dashboardMetadata_())),JSON.parse(JSON.stringify(first)));assert.equal(reads,1);
 s.properties.TAXONOMY_TRANSLATIONS_REVISION='new';assert.equal(c.dashboardMetadata_().taxonomyTranslations.es.nombre,'2');
 c.invalidateConfiguration_();c.dashboardMetadata_();assert.equal(reads,3);
});
