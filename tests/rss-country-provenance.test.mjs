import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s.c;}
test('country precedence persists RSS provenance and repairs historic records',()=>{
 const c=fixture(),feed={name:'BBVA · España',country:'España',entity:'BBVA',domain:'news.google.com',url:'https://news.google.com/rss/search?gl=ES',kind:'profile',language:'es'};
 const base={titular:'BBVA lanza pagos digitales para empresas',extracto:'Servicio digital para pymes',url:'https://news.google.com/rss/articles/a',entidad:'BBVA',fuente:feed.name,sourceUrl:'https://publisher.co/story',rssCountry:feed.country};
 assert.deepEqual(JSON.parse(JSON.stringify(c.newsCountryDecision_(base))),{country:'Colombia',reason:'domain',evidence:'https://publisher.co/story'});
 assert.equal(c.newsCountry_({...base,titular:'BBVA lanza pagos en México'}),'México');
 assert.equal(c.newsCountry_({...base,sourceUrl:''}),'España');
 assert.equal(c.newsCountry_({...base,sourceUrl:'',rssCountry:'',fuente:''}),'España');
 const item={date:new Date('2026-10-20T12:00:00Z'),title:base.titular,excerpt:base.extracto,url:base.url,labels:c.classification_(c.searchText_(base.titular),c.searchText_(base.titular+' '+base.extracto)).labels,entity:'BBVA',country:'Colombia',language:'es',publisher:'Editor',sourceUrl:base.sourceUrl};
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),record=Object.fromEntries(keys.map((key,i)=>[key,c.newsRecord_(item,feed,new Date())[i]]));
 assert.equal(record.pais,'Colombia');assert.equal(JSON.parse(record.clasificacion).procedencia.paisRSS,'España');assert.equal(c.newsCountry_(record),'Colombia');
});
test('only the article host identifies its country; paths and publisher names do not',()=>{
 const c=fixture(),base={titular:'Nueva plataforma de pagos',entidad:'BBVA',fuente:'BBVA · España',url:'https://news.google.com/rss/articles/a'};
 assert.equal(c.domainCountry_('https://www.bbva.com/es/co/story'),'');
 assert.equal(c.domainCountry_('https://www.bbva.com.tr/es/co/story'),'Turquía');
 assert.equal(c.domainCountry_('https://bank.co.uk/a'),'Reino Unido');
 assert.equal(c.newsCountry_({...base,medio:'Portafolio',extracto:'Bre-B para empresas'}),'España');
 assert.equal(c.newsCountry_({...base,sourceUrl:'https://editor.co/story'}),'Colombia');
});
