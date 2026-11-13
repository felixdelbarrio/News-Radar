import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();return s;}
function article(c,id,title,changes={}){const text=c.searchText_(title);return {id,fecha:'2026-10-21',entidad:'BBVA',pais:'España',medio:'Editor',fuente:'Editor',titular:title,extracto:'',url:'https://example.com/'+id,clasificacion:JSON.stringify(c.classification_(text,text).labels),taxonomia:JSON.stringify({ids:[]}),...changes};}
function append(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);for(const row of rows)Array.prototype.push.call(s.sheets.get('Noticias').grid,keys.map(key=>row[key]||''));}
test('un descarte de la revisión vigente se conserva y solo se archiva la copia duplicada',()=>{
 const s=setup(),c=s.c,noise=article(c,'noise','BBVA presenta sus resultados financieros trimestrales'),relevant=article(c,'relevant','BBVA lanza una plataforma de pagos digitales para empresas');
 assert.equal(JSON.parse(noise.clasificacion).digital,false);
 append(s,[noise,relevant,{...relevant,id:'duplicate'}]);assert.equal(c.deduplicateNews_(),1);
 const remaining=Array.from(c.rows_('Noticias'),row=>row.id);assert.equal(remaining.length,2);assert.ok(remaining.includes(noise.id));assert.equal(c.deduplicateNews_(),0);
});
test('el saneamiento conserva íntegros los artículos y UUID congelados de ediciones históricas',()=>{
 const s=setup(),c=s.c,noise=article(c,'archived-noise','BBVA presenta sus resultados financieros trimestrales'),frozen={...noise,taxonomia:[],entidad:'BBVA',segmentos:[],senales:[],etiquetas:{digital:true,capacidades:['Empresas: Pagos']}};append(s,[noise]);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Histórico',{},'es',[frozen]);c.completeNewsletterEdition_('edition','Enviada');
 const before=JSON.stringify(s.sheets.get('NewsletterContenido').grid);assert.equal(c.deduplicateNews_(),0);assert.equal(c.rows_('Noticias').length,1);assert.equal(JSON.stringify(s.sheets.get('NewsletterContenido').grid),before);assert.equal(c.newsletterEdition_('edition','owner@bbva.com').items[0].id,noise.id);assert.equal(c.newsletterEdition_('edition','owner@bbva.com').items[0].titular,noise.titular);
});
test('mantenimiento espera la clasificación, conserva descartes y solicita snapshots al terminar',()=>{
 const s=setup(),c=s.c;append(s,[article(c,'noise','BBVA presenta sus resultados financieros trimestrales')]);c.maintenance_();c.classificationPending_=()=>true;c.maintenanceBatch_();assert.equal(c.rows_('Noticias').length,1);assert.equal(c.maintenanceJob_().phase,'dedup');
 c.classificationPending_=()=>false;c.dailyCollectionPending_=()=>false;for(let i=0;i<20&&!['Publicando','Completada'].includes(c.maintenanceJob_().state);i++)c.maintenanceBatch_();assert.equal(c.rows_('Noticias').length,1);assert.equal(c.maintenanceJob_().removed,0);assert.ok(['Publicando','Completada'].includes(c.maintenanceJob_().state));
});
test('mantenimiento conserva país y procedencia aunque el titular sugiera otro mercado',()=>{
 const s=setup(),c=s.c,record=article(c,'geo','BBVA lanza una plataforma de pagos digitales para empresas en Colombia');
 const labels=JSON.parse(record.clasificacion),procedencia={geografias:['España'],scope:'single_country',paisMetodo:'content',paisConfianza:'medium'};
 record.clasificacion=JSON.stringify({...labels,procedencia});append(s,[record]);
 assert.equal(c.newsCountryDecision_(record).country,'Colombia');
 c.maintenance_();c.classificationPending_=()=>false;c.dailyCollectionPending_=()=>false;
 for(let i=0;i<20&&!['Publicando','Completada'].includes(c.maintenanceJob_().state);i++)c.maintenanceBatch_();
 assert.equal(c.maintenanceJob_().reviewed,1);
 const [stored]=c.rows_('Noticias');assert.equal(stored.pais,'España');assert.deepEqual(JSON.parse(stored.clasificacion).procedencia,procedencia);
});
