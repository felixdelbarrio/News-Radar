import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';

test('las pestañas agrupan las fuentes y conservan la activación entre tipos y páginas sin consultas',async t=>{
  const a=await app(t,{configure({data}){
    data.pageSize=2;
    data.configuredFeeds=[...Array.from({length:3},(_,i)=>({id:'p'+i,name:'Búsqueda '+i,entity:'BBVA',country:'España',kind:'profile',url:'https://example.com/p'+i,enabled:true})),
      ...Array.from({length:3},(_,i)=>({id:'r'+i,name:'Editor '+i,entity:'Sector',country:'Global',kind:'rss',url:'https://example.com/r'+i,enabled:i===0}))];
  }});
  await a.click('[data-view="administration"]');await a.click('[data-admin-view="sources"]');
  assert.equal(a.find('#source-tab-all').getAttribute('aria-selected'),'true');
  assert.equal(a.find('#source-rss-editor').hidden,true);assert.equal(a.w.document.querySelector('#source-kind'),null);
  const calls=a.calls.length;
  await a.click('#source-tab-profile');
  assert.match(a.find('#source-pagination').textContent,/3 resultados/);
  assert.doesNotMatch(a.find('#configured-sources-body').textContent,/Editor/);
  await a.click('[data-id="p0"]');
  await a.click('#source-pagination [data-page="1"]');assert.match(a.find('#configured-sources-body').textContent,/Búsqueda 2/);
  await a.click('#source-tab-rss');
  assert.match(a.find('#source-pagination').textContent,/página 1 de 2/);
  assert.match(a.find('#configured-sources-body').textContent,/Editor 0/);
  assert.doesNotMatch(a.find('#configured-sources-body').textContent,/Búsqueda/);
  assert.equal(a.find('#source-rss-editor').hidden,false);
  assert.equal(a.find('#source-panel').getAttribute('aria-labelledby'),'source-tab-rss');
  assert.equal(a.find('#source-tab-profile').tabIndex,-1);assert.equal(a.find('#source-tab-rss').tabIndex,0);
  await a.change('#source-enabled','false');await a.click('[data-id="r1"]');
  assert.doesNotMatch(a.find('#configured-sources-body').textContent,/Editor 1/);
  await a.click('#source-tab-profile');assert.match(a.find('#configured-sources-body').textContent,/Búsqueda 0/);
  assert.equal(a.find('[data-id="p0"]').checked,false);
  assert.equal(a.calls.length,calls);
  await a.click('#save-source-settings');
  assert.deepEqual([...a.calls.find(call=>call.method==='saveSourceSettings').query].sort(),['p1','p2','r0','r1']);
});

test('las pestañas admiten teclado y conservan los feeds editados y los filtros comunes',async t=>{
  const a=await app(t,{configure({data}){
    data.configuredFeeds=[{id:'p',name:'BBVA búsqueda',entity:'BBVA',country:'España',kind:'profile',url:'https://example.com/p',enabled:true},
      {id:'r',name:'BBVA editor',entity:'BBVA',country:'España',kind:'rss',url:'https://example.com/r',enabled:true}];
  }});
  await a.click('[data-view="administration"]');await a.click('[data-admin-view="sources"]');
  await a.change('#source-entity','BBVA');
  const key=(id,value)=>a.find(id).dispatchEvent(new a.w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  key('#source-tab-all','End');assert.equal(a.w.document.activeElement.id,'source-tab-rss');
  assert.equal(a.find('#source-rss-editor').hidden,false);assert.equal(a.find('#source-entity').value,'BBVA');
  a.find('#source-fields [data-key="name"]').value='Feed editado';await a.click('#add-source');
  key('#source-tab-rss','ArrowRight');assert.equal(a.w.document.activeElement.id,'source-tab-all');
  assert.equal(a.find('#source-rss-editor').hidden,true);
  key('#source-tab-all','ArrowLeft');assert.equal(a.w.document.activeElement.id,'source-tab-rss');
  assert.equal(a.find('#source-fields [data-key="name"]').value,'Feed editado');assert.equal(a.find('#source-fields').children.length,2);
  key('#source-tab-rss','Home');assert.equal(a.w.document.activeElement.id,'source-tab-all');
  key('#source-tab-all','ArrowRight');assert.equal(a.w.document.activeElement.id,'source-tab-profile');
  assert.match(a.find('#configured-sources-body').textContent,/BBVA búsqueda/);
  assert.doesNotMatch(a.find('#configured-sources-body').textContent,/BBVA editor/);
});
