import test from 'node:test';
import assert from 'node:assert/strict';
import {app,tick} from './helpers/app.mjs';
const items=[{id:'pay',palanca:'Pagos y cobros',subpalanca:'Pagos biométricos',segmentos:['Empresas','Retail'],terminos:['pagos biometricos'],noticias:10,peso:1.2,origen:'tf-idf'}, {id:'api',palanca:'Integración y automatización',subpalanca:'APIs',segmentos:['Empresas'],terminos:['api'],noticias:4,peso:1,origen:'regla'}];
test('Taxonomía muestra jerarquía, paginación, progreso único y lanzamiento administrativo; abandona el sondeo al salir',async t=>{
  const timers=new Map();let id=0;
  const a=await app(t,{configure({w,replies}){
    const set=w.setTimeout.bind(w),clear=w.clearTimeout.bind(w);w.setTimeout=(fn,ms)=>{if(ms<30000)return set(fn,ms);timers.set(++id,{fn,ms});return id;};w.clearTimeout=value=>{timers.delete(value);clear(value);};
    replies.getTaxonomyStatus={scheduled:true,hour:7,minute:45,timezone:'Europe/Madrid',items,job:null};
  }});
  await a.click('[data-view="administration"]');await a.click('[data-admin-view="taxonomy"]');
  assert.equal(a.find('#taxonomy-section').hidden,false);assert.match(a.find('#taxonomy-schedule').textContent,/07:45/);assert.match(a.find('#taxonomy-count').textContent,/2 palancas · 2 subpalancas/);
  assert.equal(a.find('#taxonomy-body').querySelectorAll('tr').length,2);assert.match(a.find('#taxonomy-body').textContent,/Pagos biométricos/);assert.match(a.find('#taxonomy-body').textContent,/Empresas · Retail/);
  await a.change('#taxonomy-palanca','Pagos y cobros');assert.equal(a.find('#taxonomy-body').querySelectorAll('tr').length,1);
  a.replies.getTaxonomyStatus.job={total:100,processed:30,tagged:0,state:'En curso',updated:'2026-10-12T06:00:00Z'};await a.click('#taxonomy-start');
  assert.equal(a.find('#taxonomy-progress progress').max,200);assert.equal(a.find('#taxonomy-progress progress').value,30);assert.equal(a.find('#taxonomy-start').disabled,true);assert.equal(a.find('#taxonomy-section').querySelectorAll('progress').length,1);assert.equal(a.calls.filter(row=>row.method==='startTaxonomy').length,1);
  await a.click('[data-admin-view="sources"]');assert.equal(timers.size,0);
  a.replies.getTaxonomyStatus.job={total:100,processed:200,tagged:10,state:'Completada',updated:'2026-10-12T07:00:00Z'};await a.click('[data-admin-view="taxonomy"]');assert.equal(a.find('#taxonomy-start').disabled,false);assert.equal(a.find('#taxonomy-progress progress').value,200);
  await a.click('#taxonomy-start');assert.equal(a.find('#taxonomy-section').querySelectorAll('progress').length,1);
  a.replies.getTaxonomyStatus.job.state='En pausa';a.replies.getTaxonomyStatus.job.error='<script>fallo</script>';await a.click('[data-admin-view="sources"]');await a.click('[data-admin-view="taxonomy"]');assert.equal(a.find('#taxonomy-progress').querySelector('script'),null);assert.match(a.find('#taxonomy-progress').textContent,/fallo/);assert.equal(a.find('#taxonomy-start').disabled,false);
  await a.click('[data-view="news"]');assert.equal(timers.size,0);await tick();
});
test('los filtros de Noticias y las suscripciones personales y administrativas envían palanca y subpalanca',async t=>{
  const path='Pagos y cobros › Pagos biométricos';
  const a=await app(t,{configure({data,replies}){data.palanca=['Pagos y cobros'];data.subpalanca=[path];replies.getNewsletterOptions.catalogs={...replies.getNewsletterOptions.catalogs,palanca:['Pagos y cobros'],subpalanca:[path]};}});
  await a.click('[data-view="news"]');await a.change('#filters [name="palanca"]','Pagos y cobros');await a.change('#filters [name="subpalanca"]',path);
  const query=a.calls.filter(row=>row.method==='getDashboard').at(-1).query;assert.equal(query.palanca,'Pagos y cobros');assert.equal(query.subpalanca,path);
  await a.click('[data-view="subscriptions"]');await a.click('#new-subscription');await a.change('#personal-editor [name="palanca"]','Pagos y cobros');await a.change('#personal-editor [name="subpalanca"]',path);await a.submit('#personal-editor form');
  assert.equal(a.calls.find(row=>row.method==='saveSubscription').query.filters.subpalanca,path);
  await a.click('[data-view="administration"]');await a.click('[data-admin-view="subscribers"]');await a.click('#new-admin-subscription');await a.change('#admin-subscription-editor [name="palanca"]','Pagos y cobros');await a.change('#admin-subscription-editor [name="subpalanca"]',path);await a.submit('#admin-subscription-editor form');assert.equal(a.calls.find(row=>row.method==='saveAdminSubscription').query.filters.palanca,'Pagos y cobros');
});

test('volver a Noticias después de etiquetar refresca una sola vez el contenido y los filtros vigentes',async t=>{
 const a=await app(t,{configure({data,replies}){data.newsRevision='old';replies.getTaxonomyStatus.newsRevision='old';}});await a.click('[data-view="news"]');
 await a.click('[data-view="administration"]');a.data.newsRevision='new';a.data.palanca=['Pagos y cobros'];a.replies.getTaxonomyStatus.newsRevision='new';await a.click('[data-admin-view="taxonomy"]');const calls=a.calls.filter(row=>row.method==='getDashboard').length;
 await a.click('[data-view="news"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,calls+1);assert.match(a.find('#filters [name="palanca"]').textContent,/Pagos y cobros/);
 await a.click('[data-view="administration"]');await a.click('[data-view="news"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,calls+1);
});

test('nombres multilingües visibles conservan valores canónicos de filtros y suscripciones',async t=>{
 const path='Pagos y cobros › Pagos biométricos',taxonomyTranslations={en:{'Pagos y cobros':'Payments and collections','Pagos biométricos':'Biometric payments',[path]:'Payments and collections › Biometric payments'},tr:{'Pagos y cobros':'Ödemeler','Pagos biométricos':'Biyometrik ödemeler',[path]:'Ödemeler › Biyometrik ödemeler'}};
 const a=await app(t,{language:'en-US',configure({data,replies}){
  data.taxonomyTranslations=taxonomyTranslations;data.palanca=['Pagos y cobros'];data.subpalanca=[path];data.items=[{titular:'News',fecha:'2026-10-11',url:'https://example.com',taxonomia:[items[0]]}];
  replies.getNewsletterOptions.taxonomyTranslations=taxonomyTranslations;Object.assign(replies.getNewsletterOptions.catalogs,{palanca:data.palanca,subpalanca:data.subpalanca});replies.getTaxonomyStatus.items=items;replies.getTaxonomyStatus.taxonomyTranslations=taxonomyTranslations;
 }});
 await a.click('[data-view="news"]');assert.match(a.find('#news-list').textContent,/Payments and collections › Biometric payments/);
 const option=a.find('#filters [name="subpalanca"] option:nth-child(2)');assert.equal(option.value,path);assert.equal(option.textContent,taxonomyTranslations.en[path]);
 await a.change('#filters [name="subpalanca"]',path);assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.subpalanca,path);assert.match(a.find('#active-filters').textContent,/Biometric payments/);
 await a.click('[data-view="subscriptions"]');await a.click('#new-subscription');const sub=a.find('#personal-editor [name="subpalanca"] option:nth-child(2)');assert.equal(sub.value,path);assert.equal(sub.textContent,taxonomyTranslations.en[path]);
 await a.change('#personal-editor [name="subpalanca"]',path);await a.submit('#personal-editor form');assert.equal(a.calls.find(row=>row.method==='saveSubscription').query.filters.subpalanca,path);
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="taxonomy"]');assert.match(a.find('#taxonomy-body').textContent,/Biometric payments/);await a.change('#preview-language','tr');assert.match(a.find('#taxonomy-body').textContent,/Biyometrik ödemeler/);
});
test('Idiomas reutiliza una sola barra de taxonomía, reanuda manualmente y detiene el sondeo al salir',async t=>{
 const timers=new Map();let id=0;
 const a=await app(t,{configure({w,replies}){
  const set=w.setTimeout.bind(w),clear=w.clearTimeout.bind(w);w.setTimeout=(fn,ms)=>{if(ms<30000)return set(fn,ms);timers.set(++id,{fn,ms});return id;};w.clearTimeout=value=>{timers.delete(value);clear(value);};
  Object.defineProperty(w.document,'hidden',{value:false});
  replies.getTaxonomyTranslationStatus={job:{state:'En pausa',total:9,processed:3,translated:3,error:'Traducción temporalmente no disponible. Se reintentará automáticamente.'},queued:false,newsRevision:'new'};
 }});
 await a.click('[data-view="administration"]');await a.click('[data-admin-view="language"]');assert.equal(a.find('#taxonomy-translation-progress progress').value,3);assert.equal(timers.size,1);assert.equal(a.find('#taxonomy-translation-start').disabled,false);
 a.replies.getTaxonomyTranslationStatus.job={state:'Pendiente',total:9,processed:3,translated:3};await a.click('#taxonomy-translation-start');assert.ok(a.calls.some(row=>row.method==='startTaxonomyTranslations'));assert.equal(a.w.document.querySelectorAll('#taxonomy-translation-progress progress').length,1);assert.equal(a.find('#taxonomy-translation-start').disabled,true);assert.equal(timers.size,1);
 a.replies.getTaxonomyTranslationStatus.job={state:'Completada',total:9,processed:9,translated:6};await [...timers.values()][0].fn();await tick();assert.equal(a.find('#taxonomy-translation-progress progress').value,9);assert.equal(timers.size,0);
 await a.click('[data-admin-view="runs"]');assert.equal(timers.size,0);
});
