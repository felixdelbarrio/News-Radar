import {configurationDefaults} from '../scripts/configuration-defaults.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {identityAssets} from '../scripts/identity.mjs';
import {read,readServerScript} from '../scripts/source.mjs';
import {app} from './helpers/app.mjs';
import {noveltyOverview} from '../src/shared/novelty-groups.js';
const row=(id,entidad='BBVA',pais='España')=>({id,entidad,pais,fecha:'2026-10-10',titular:entidad+' lanza pagos digitales para empresas '+id,extracto:'Una solución digital para cobros.',url:'https://example.com/'+id,medio:'Editor',tema:'Pagos',tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],etiquetas:{digital:true},taxonomia:[{palanca:'Pagos y cobros',subpalanca:'Pagos'}]});
test('el inventario cubre entidades y países, mantiene proporciones y acota el peso total',()=>{
 const assets=identityAssets(),config=configurationDefaults();
 for(const [kind,names] of [['entities',Object.keys(assets.entities)],['countries',config.geographies.map(row=>row.name)]])for(const name of names){const image=assets[kind][name];assert.ok(image,name);assert.equal(Buffer.from(image.data,'base64').readUInt32BE(0),0x89504e47);assert.ok(image.width<=48&&image.height<=28);}
 assert.ok(Object.values(assets).flatMap(Object.values).reduce((sum,row)=>sum+Buffer.from(row.data,'base64').length,0)<100000);
});
test('Novedades y Noticias identifican cada tarjeta sin depender de imágenes externas, y las noticias sin país no reciben una bandera ficticia',async t=>{
 const rows=[row('a'),row('b','Santander','México'),row('c','Entidad <nueva>','Sin determinar')],a=await app(t,{configure({data}){data.briefing={...noveltyOverview(rows),items:rows};data.items=rows;}});
 const identity=selector=>a.find(selector+' .story-identity');assert.equal(identity('#briefing-list').querySelector('.entity-logo').alt,'BBVA');assert.equal(identity('#briefing-list').querySelector('.geography-flag').alt,'España');await a.click('#briefing-geographies [data-geography="Otras geografías"]');assert.equal(identity('#briefing-list').querySelector('.geography-flag'),null);assert.match(identity('#briefing-list').textContent,/E</);assert.equal(identity('#briefing-list').querySelector('nueva'),null);
 await a.click('[data-view="news"]');assert.equal(a.w.document.querySelectorAll('#news-list .story-identity').length,3);for(const img of a.w.document.querySelectorAll('#news-list .story-identity img')){assert.match(img.src,/^data:image\/png;base64,/);assert.equal(img.getAttribute('loading'),'lazy');assert.ok(img.hasAttribute('width')&&img.hasAttribute('height'));}
});
test('los tres ámbitos del correo comparten identidad y cada CID tiene un único adjunto MIME aunque se repita en artículos',()=>{
 const calls=[],c=vm.createContext({Utilities:{Charset:{UTF_8:'UTF-8'},getUuid:()=> 'identity-boundary',base64Encode:value=>Buffer.from(value).toString('base64'),base64EncodeWebSafe:value=>Buffer.from(value).toString('base64url')}});vm.runInContext(readServerScript(),c);const config=configurationDefaults();config.settings.newsletterAppUrl='https://script.google.com/macros/s/test/exec';c.configuration_=()=>config;c.taxonomyCatalog_=()=>[];c.taxonomyTranslations_=()=>({});c.savedArticleTranslations_=rows=>rows;c.gmailRequest_=(_url,payload)=>{calls.push(payload);return {id:'mock-mail'};};
 const rows=[row('a'),row('b'),row('c','Santander','México')];
 for(const view of ['briefing','news','radar']){const content=c.newsletterContent_(rows,{view},'Mi selección',new Date(),'subscription','es','edition');assert.match(content.html,/class="entity-logo"/);assert.match(content.html,/class="geography-flag"/);assert.doesNotMatch(content.html,/data:image|src="https:/);assert.equal(new Set(content.images.map(row=>row.id)).size,content.images.length);if(view!=='radar')assert.match(content.html,/newsletter-identity-cell/);
  c.sendNewsletterMail_({name:'News Radar',address:'sender@bbva.com'},'user@bbva.com',content);const mime=Buffer.from(calls.at(-1).raw,'base64url').toString('utf8'),ids=[...mime.matchAll(/Content-ID: <([^>]+)>/g)].map(match=>match[1]),used=[...content.html.matchAll(/src="cid:([^" ]+)"/g)].map(match=>match[1]);assert.deepEqual(ids,Array.from(content.images,row=>row.id));for(const id of used)assert.equal(ids.filter(value=>value===id).length,1);assert.match(mime,/multipart\/related/);assert.match(mime,/multipart\/alternative/);assert.ok(content.images.reduce((size,image)=>size+image.data.length,0)<20000);
 }
});

test('medios especializados y multilaterales usan logotipos locales también con variaciones de mayúsculas',()=>{
 const assets=identityAssets();for(const name of ['The Asset','Asian Banking & Finance','ADB','AIIB','Asian Development Bank'])assert.ok(assets.publishers[name],name);
 const c=vm.createContext({});vm.runInContext(readServerScript(),c);assert.match(c.identityMark('publishers','THE ASSET',value=>value),/data:image\/png;base64/);
});
