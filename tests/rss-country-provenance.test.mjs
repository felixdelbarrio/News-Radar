import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {readServerScript} from '../scripts/source.mjs';
function fixture(){let source=readServerScript('dist');for(const file of ['Rules.gs','Feeds.gs'])source=source.replace(fs.readFileSync('dist/'+file,'utf8'),()=>fs.readFileSync('src/server/news/'+file,'utf8'));const s=storage(source);s.c.initializeConfiguration();return s;}
function rss(c,{title='BBVA lanza pagos Bre-B digitales para empresas',publisher='BBVA',sourceUrl='https://www.bbva.com/es/co/innovacion/pagos',excerpt='Pagos digitales y transferencias para empresas'}={}){
 const values={title,link:'https://news.google.com/rss/articles/story',pubDate:'2026-10-20T12:00:00Z',description:excerpt,source:publisher};
 c.XmlService={getNamespace:value=>value,parse:()=>({getRootElement:()=>({getChild:()=>({getChildText:()=> 'es',getChildren:()=>[{getChildText:key=>values[key]||'',getChild:()=>({getText:()=>publisher,getAttribute:()=>sourceUrl?{getValue:()=>sourceUrl}:null})}]})})})};
 return c.parseFeed_('<rss/>')[0];
}
test('RSS source URL survives evaluation and persistence and repairs country independently of the Google link',()=>{
 const {c}=fixture(),raw=rss(c),feed={name:'BBVA · España',country:'España',entity:'BBVA',domain:'news.google.com',url:'https://news.google.com/rss/search?gl=ES',kind:'profile',language:'es'};assert.equal(raw.sourceUrl,'https://www.bbva.com/es/co/innovacion/pagos');
 const result=c.evaluate_(raw,feed,new Date('2026-10-21T12:00:00Z'));assert.ok(result.item,result.reason);assert.equal(result.item.country,'Colombia');assert.equal(result.item.sourceUrl,raw.sourceUrl);
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),record=Object.fromEntries(keys.map((key,i)=>[key,c.newsRecord_(result.item,feed,new Date())[i]]));assert.equal(record.url,raw.url);assert.equal(JSON.parse(record.clasificacion).procedencia.medioUrl,raw.sourceUrl);assert.equal(c.newsCountry_({...record,pais:'España'}),'Colombia');
 const withoutSource=rss(c,{sourceUrl:''});assert.equal(withoutSource.sourceUrl,'');assert.equal(c.evaluate_(withoutSource,feed,new Date('2026-10-21T12:00:00Z')).item.country,'Colombia');
});
test('historical Bre-B stories from Semana BBVA and ABC Economía map to Colombia without assigning all BBVA stories there',()=>{
 const {c}=fixture();for(const medio of ['Semana','BBVA','ABC Economía'])assert.equal(c.newsCountry_({titular:'Pagar por Bre-B sin tener saldo disponible será posible',extracto:'Transferencias y pagos inmediatos',medio,fuente:'BBVA · España',pais:'España',url:'https://news.google.com/articles/story'}),'Colombia',medio);
 assert.equal(c.newsCountry_({titular:'BBVA presenta nuevo canal digital',extracto:'Pagos empresariales mediante Bre‑B',medio:'BBVA',fuente:'BBVA · España',pais:'España'}),'Colombia');
 assert.equal(c.newsCountry_({titular:'BBVA presenta nuevo canal digital',medio:'BBVA',fuente:'BBVA · España',pais:'España'}),'España');
 assert.equal(c.newsCountry_({titular:'BBVA presenta Bre-B en México',medio:'BBVA',fuente:'BBVA · España',pais:'España'}),'México');
 assert.equal(c.newsCountry_({titular:'Bre-B y los pagos empresariales',url:'https://publisher.es/story',medio:'Editor',fuente:'BBVA · España',pais:'España'}),'Colombia');
});
test('publisher evidence uses ccTLD or BBVA regional path without interpreting language alone as country',()=>{
 const {c}=fixture();assert.equal(c.domainCountry_('https://www.bbva.com/es/co/innovacion/pagos','',''),'Colombia');assert.equal(c.domainCountry_('https://www.bbva.com/es/mx/empresas','',''),'México');assert.equal(c.domainCountry_('https://www.bbva.com/es/innovacion/pagos','',''),'');assert.equal(c.domainCountry_('https://www.bbva.com.tr/es/co/story','',''),'Turquía');
 const base={titular:'Nueva plataforma de pagos',medio:'Editor',fuente:'BBVA · España',pais:'España',url:'https://news.google.com/articles/story'};assert.equal(c.newsCountry_({...base,sourceUrl:'https://editor.co/story'}),'Colombia');assert.equal(c.newsCountry_({...base,sourceUrl:'javascript:alert(1)'}),'España');assert.equal(c.newsCountry_({...base,medio:'Semana'}),'Colombia');assert.equal(c.newsCountry_({...base,medio:'Semana Económica'}),'Perú');
});
