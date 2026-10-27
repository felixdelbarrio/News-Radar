import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {applicationGeography,articleGeographies,geographyMatches,regionalGeographies} from '../src/shared/selection-policy.js';
const setup=()=>{const s=storage();s.c.initializeConfiguration();return s;};
const base={titular:'Nueva plataforma de pagos empresariales',extracto:'',url:'https://news.google.com/rss/articles/a',fuente:'Google News RSS',entidad:'BBVA',medio:'Editor'};
test('locale exacta, idioma base y APAC operan solo tras contenido y país RSS',()=>{
 const {c}=setup();for(const [hl,country,type] of [['es-ES','España','PAIS'],['es-CO','Colombia','PAIS'],['en-GB','Reino Unido','PAIS'],['en-UK','Reino Unido','PAIS'],['es','EMEA','REGION'],['en-US','AMER','REGION'],['es-419','AMER','REGION'],['en','AMER','REGION'],['xx-YY','APAC','REGION']]){
  const actual=c.newsCountryDecision_({...base,feedUrl:'https://news.google.com/rss/search?hl='+hl});assert.equal(actual.country,country,hl);assert.equal(actual.type,type,hl);assert.equal(actual.reason,country==='APAC'?'apac_fallback':'locale_fallback',hl);
 }
 assert.equal(c.newsCountryDecision_(base).country,'APAC');
 assert.equal(c.newsCountryDecision_({...base,feedUrl:'https://news.google.com/rss/search?gl=CO&hl=es-ES'}).country,'Colombia');
 assert.equal(c.newsCountryDecision_({...base,feedUrl:'https://news.google.com/rss/search?ceid=CO:es&hl=en-US'}).country,'Colombia');
 assert.equal(c.newsCountryDecision_({...base,rssCountry:'Colombia',feedUrl:'https://news.google.com/rss/search?gl=ES&hl=en-US'}).country,'AMER');
 assert.equal(c.newsCountryDecision_({...base,feedUrl:'https://news.google.com/rss/search?gl=CO&ceid=ES:es&hl=en-US'}).country,'AMER');
});
test('países protagonistas se conservan, el actor explícito prima y la editorial queda separada',()=>{
 const {c}=setup(),multiple=c.newsCountryDecision_({...base,titular:'México y Colombia firman un acuerdo de pagos',feedUrl:'https://news.google.com/rss/search?hl=en-US'});
 assert.deepEqual([...multiple.geographies],['Colombia','México']);assert.equal(multiple.scope,'multicountry');assert.equal(multiple.confidence,'medium');
 const actor=c.newsCountryDecision_({...base,titular:'BBVA México y España conectan empresas',sourceUrl:'https://semana.com/story',rssCountry:'Colombia'});assert.equal(actor.country,'México');assert.deepEqual([...actor.geographies],['México','España']);
 assert.deepEqual([...c.newsCountryDecision_({...base,titular:'Revolut outage in UK, France and Spain'}).geographies],['España','Francia','Reino Unido']);
 assert.deepEqual([...c.newsCountryDecision_({...base,titular:'Sistema cashless en el México vs. Portugal'}).geographies],['México']);
 assert.equal(c.newsCountryDecision_({...base,titular:'BBVA México lanza pagos',extracto:'Servicio también citado en Colombia',sourceUrl:'https://semana.com/story'}).geographies.length,1);
 assert.equal(c.newsCountryDecision_({...base,sourceUrl:'https://publisher.co/story',rssCountry:'España'}).country,'Colombia');
 const manual=c.newsCountryDecision_({...base,clasificacion:JSON.stringify({procedencia:{manualGeografias:['Perú','Colombia']}})});assert.deepEqual([...manual.geographies],['Perú','Colombia']);assert.equal(manual.reason,'manual');
});
test('catálogos separados e importación conservan ediciones manuales',()=>{
 const {c}=setup(),snapshot=c.getConfiguration(),config=snapshot.config;
 assert.equal(config.mediaCatalog.length,80);assert.equal(config.localeRules.length,46);assert.ok(config.mediaCatalog.every(row=>!row.enabled&&row.status==='PENDIENTE'));
 config.mediaCatalog[0].status='VERIFICADO';config.mediaCatalog[0].enabled=true;c.saveConfiguration({config,revision:snapshot.revision});
 const csv='nombreRSS,dominio,paisEditorialPropuesto,iso2Propuesto,estadoVerificacion,activo,tipoRegla,paisEdicion,patronEdicion,noticiasHistoricas,urlReferencia,observaciones\nNuevo Medio,nuevo-medio.com,España,ES,PENDIENTE,False,DOMINIO_GENERICO,,,1,https://nuevo-medio.com,Prueba';
 assert.match(c.importGeographyCatalog({category:'mediaCatalog',csv}),/1 entradas/);assert.match(c.importGeographyCatalog({category:'mediaCatalog',csv}),/0 entradas/);
 const saved=c.getConfiguration().config;assert.equal(saved.mediaCatalog.length,81);assert.equal(saved.mediaCatalog[0].status,'VERIFICADO');assert.equal(saved.localeRules.length,46);
 const renamed=saved.mediaCatalog[0];renamed.name='Nombre editorial corregido';c.saveConfiguration({config:saved,revision:c.getConfiguration().revision});
 const repeated='idSemilla,nombreRSS,dominio,paisEditorialPropuesto,iso2Propuesto,estadoVerificacion,activo,tipoRegla,paisEdicion,patronEdicion,noticiasHistoricas,urlReferencia,observaciones\n'+[renamed.seedId,'Nombre original',renamed.domain,'Estados Unidos','US','PENDIENTE','False','DOMINIO_GENERICO','','','1','https://'+renamed.domain,'Prueba'].join(',');
 assert.match(c.importGeographyCatalog({category:'mediaCatalog',csv:repeated}),/0 entradas/);assert.equal(c.getConfiguration().config.mediaCatalog[0].name,'Nombre editorial corregido');
});
test('filtros OR y regiones suman subtotales sin duplicar el total de noticias',()=>{
 const {c}=setup(),config=c.configuration_(),geography=applicationGeography(config.applicationScope,'Empresas e instituciones',config.geographies),row={pais:'Colombia',geografias:['Colombia','España']};
 assert.deepEqual(articleGeographies(row),['Colombia','España']);assert.equal(geographyMatches(row,'España',geography),true);assert.equal(geographyMatches(row,'Colombia',geography),true);
 const region=geography.region('Colombia');assert.equal(regionalGeographies([row],geography).find(item=>item.name===region).total,geography.own('Colombia')?0:1);
});
test('una noticia empresarial sin país ni locale se admite y persiste como región APAC',()=>{
 const {c}=setup(),feed={name:'BBVA pruebas',country:'',entity:'BBVA',domain:'news.google.com',url:'https://news.google.com/rss/search?hl=xx-YY',kind:'profile'},item={title:'BBVA lanza plataforma digital de pagos para empresas',url:'https://news.google.com/rss/articles/a',date:'Mon, 26 Oct 2026 10:00:00 GMT',excerpt:'Permite realizar pagos empresariales en la banca online.',language:''},result=c.evaluate_(item,feed,new Date('2026-10-26T12:00:00Z'));
 assert.equal(result.reason,undefined);assert.equal(result.item.country,'APAC');const record=c.newsRecord_(result.item,feed,new Date('2026-10-26T12:00:00Z')),provenance=JSON.parse(record[11]).procedencia;
 assert.equal(record[2],'APAC');assert.deepEqual([...provenance.geografias],['APAC']);assert.equal(provenance.tipoGeografia,'REGION');assert.equal(provenance.paisMetodo,'apac_fallback');assert.equal(provenance.paisMedioVerificado,false);
});
test('el panel conserva la ejecución de las 06:00 mientras avanza la de las 13:00',()=>{
 const s=setup(),{c}=s,keys=vm.runInContext('RADAR.sheets.Recargas',c),jobs=[{id:'morning',tipo:'daily',desde:'2026-10-25',hasta:'2026-10-26',inicio:'2026-10-26T06:00:00Z',estado:'Completada',total:10,procesadas:10,pendientes:0,omitidas:0,fallidas:0,nuevas:6,actualizada:'2026-10-26T06:15:00Z'},{id:'afternoon',tipo:'daily',desde:'2026-10-25',hasta:'2026-10-26',inicio:'2026-10-26T13:00:00Z',estado:'Pendiente',total:8,procesadas:0,pendientes:8,omitidas:0,fallidas:0,nuevas:0,actualizada:'2026-10-26T13:00:00Z'}];
 for(const job of jobs)s.sheets.get('Recargas').grid.push(keys.map(key=>job[key]??''));s.properties.DAILY_PIPELINE_JOB='morning';s.properties.COLLECTION_AFTERNOON_JOB='afternoon';
 const status=c.collectionStatus_();assert.equal(status.jobs.length,1);assert.equal(status.slotJobs.length,2);assert.equal(Number(status.slotJobs.find(job=>job.id==='morning').nuevas),6);
});
test('informe completo recorre lotes acotados y agrega sin saltar filas',()=>{
 const {c}=setup(),offsets=[];c.getGeographyMigrationStatus=()=>({version:'test'});c.auditGeographyMigration=({offset,limit})=>{offsets.push(offset);assert.equal(limit,200);return {total:450,next:Math.min(offset+limit,450),changed:1,multicountry:2,missing:0,byMethod:{domain:1},samples:[]};};const result=c.reportGeographyMigration();assert.deepEqual(offsets,[0,200,400]);assert.equal(result.changed,3);assert.equal(result.byMethod.domain,3);
});
test('continuación exige backup verificado y conserva el coordinador de prioridades',()=>{
 const {c}=setup();c.getGeographyMigrationStatus=()=>({});assert.throws(()=>c.continueGeographyMigration(),/copia verificada/);let called=0;c.getGeographyMigrationStatus=()=>({version:vm.runInContext('RADAR.version',c),backupId:'verified'});c.processBackground_=()=>{called++;return {added:0};};assert.equal(c.continueGeographyMigration().added,0);assert.equal(called,1);
});
