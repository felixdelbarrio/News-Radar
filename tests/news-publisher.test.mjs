import {identityAssets} from '../scripts/identity.mjs';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newsPublisher} from '../src/client/core/dom.js';
import {renderNews} from '../src/client/features/news.js';
import {createBriefing} from '../src/client/features/briefing.js';
test('Noticias y Novedades identifican el medio y escapan su nombre sin sustituirlo por la consulta RSS',()=>{
 const assets=globalThis.IDENTITY_ASSETS;globalThis.IDENTITY_ASSETS=identityAssets();
 const elements=new Map(),previous=globalThis.document;globalThis.document={getElementById:id=>{if(!elements.has(id))elements.set(id,{addEventListener(){},setAttribute(){},removeAttribute(){}});return elements.get(id);}};
 try{
  const row={medio:'Diario <editor>',fuente:'BBVA · España',titular:'Una novedad',fecha:'2026-10-11',url:'https://example.com',senales:['Producto'],segmentos:[],entidad:'BBVA',pais:'España'};
  renderNews({items:[row],page:0,pageSize:30,total:1});createBriefing().render({briefing:{...noveltyOverview([row]),items:[row]}});
  for(const id of ['news-list','briefing-list']){assert.match(elements.get(id).innerHTML,/Medio: <span data-original>Diario &lt;editor&gt;<\/span>/);assert.doesNotMatch(elements.get(id).innerHTML,/BBVA · España/);}
  assert.match(newsPublisher({fuente:'Consulta RSS'}),/Medio: No indicado/);
 }finally{if(assets===undefined)delete globalThis.IDENTITY_ASSETS;else globalThis.IDENTITY_ASSETS=assets;if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
