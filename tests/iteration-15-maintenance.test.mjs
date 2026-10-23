import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();return s;}
function article(c,id,title,changes={}){const text=c.searchText_(title);return {id,fecha:'2026-10-21',entidad:'BBVA',pais:'España',medio:'Editor',fuente:'Editor',titular:title,extracto:'',url:'https://example.com/'+id,clasificacion:JSON.stringify(c.classification_(text,text).labels),taxonomia:JSON.stringify({ids:[]}),...changes};}
function append(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);for(const row of rows)Array.prototype.push.call(s.sheets.get('Noticias').grid,keys.map(key=>row[key]||''));}
test('compacta sólo descartes de la revisión vigente y conserva noticias pendientes o modificadas',()=>{
 const s=setup(),c=s.c,noise=article(c,'noise','BBVA presenta sus resultados financieros trimestrales'),stale=article(c,'stale','BBVA publica sus resultados financieros anuales'),modified=article(c,'modified','BBVA anuncia sus resultados financieros semestrales');
 const labels=JSON.parse(stale.clasificacion);labels.revision='old';stale.clasificacion=JSON.stringify(labels);modified.titular='BBVA lanza una app de pagos digitales para empresas';
 const relevant=article(c,'relevant','BBVA lanza una plataforma de pagos digitales para empresas'),santander=article(c,'municipal','Banco Santander informa del ayuntamiento de Santander y sus vecinos',{entidad:'Santander'}),forced=JSON.parse(santander.clasificacion);forced.digital=true;santander.clasificacion=JSON.stringify(forced);
 append(s,[noise,stale,modified,relevant,santander]);assert.equal(c.deduplicateNews_(),3);assert.deepEqual(Array.from(c.rows_('Noticias'),row=>row.id),['stale','modified']);assert.equal(c.deduplicateNews_(),0);
});
test('el saneamiento conserva íntegros los artículos y UUID congelados de ediciones históricas',()=>{
 const s=setup(),c=s.c,noise=article(c,'archived-noise','BBVA presenta sus resultados financieros trimestrales'),frozen={...noise,taxonomia:[],entidad:'BBVA',segmentos:[],senales:[],etiquetas:{digital:true,capacidades:['Empresas: Pagos']}};append(s,[noise]);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Histórico',{},'es',[frozen]);c.completeNewsletterEdition_('edition','Enviada');
 const before=JSON.stringify(s.sheets.get('NewsletterContenido').grid);assert.equal(c.deduplicateNews_(),1);assert.equal(c.rows_('Noticias').length,0);assert.equal(JSON.stringify(s.sheets.get('NewsletterContenido').grid),before);assert.equal(c.newsletterEdition_('edition','owner@bbva.com').items[0].id,noise.id);assert.equal(c.newsletterEdition_('edition','owner@bbva.com').items[0].titular,noise.titular);
});
test('mantenimiento espera la clasificación antes de purgar y solicita snapshots al terminar',()=>{
 const s=setup(),c=s.c;append(s,[article(c,'noise','BBVA presenta sus resultados financieros trimestrales')]);c.maintenance_();c.classificationPending_=()=>true;c.maintenanceBatch_();assert.equal(c.rows_('Noticias').length,1);assert.equal(c.maintenanceJob_().phase,'dedup');
 c.classificationPending_=()=>false;c.dailyCollectionPending_=()=>false;c.maintenanceBatch_();assert.equal(c.rows_('Noticias').length,0);assert.equal(c.maintenanceJob_().removed,1);assert.ok(['Publicando','Completada'].includes(c.maintenanceJob_().state));
});
