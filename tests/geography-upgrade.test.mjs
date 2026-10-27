import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();return s;}
test('country assignment follows content, publisher URL, RSS and regional fallback',()=>{
 const {c}=setup(),base={titular:'Nuevo servicio digital para empresas',entidad:'Revolut',url:'https://news.google.com/rss/articles/a',fuente:'Revolut · Italia'};
 const cases=[
  [{...base,titular:'Revolut lanza servicio en Colombia',sourceUrl:'https://editor.es/story'},'Colombia','headline'],
  [{...base,sourceUrl:'https://editor.co/story'},'Colombia','domain'],
  [{...base,medio:'LaRepublica.co'},'Colombia','domain'],
  [{...base,medio:'Portafolio.co'},'Colombia','domain'],
  [{...base,medio:'Portafolio.co',titular:'Nuevo servicio digital en España'},'España','headline'],
  [{...base,medio:'Portafolio.co informa'},'Italia','rss_fallback'],
  [base,'Italia','rss_fallback'],
  [{...base,fuente:''},'Sin determinar','undetermined']
 ];
 for(const [row,country,reason] of cases){const result=c.newsCountryDecision_(row);assert.equal(result.country,country);assert.equal(result.reason,reason);}
 assert.equal(c.domainCountry_('https://bank.co.uk/story'),'Reino Unido');
 assert.equal(c.domainCountry_('https://publisher.com/es/co/story'),'');
});
test('upgrade preserves published rows, installs headquarters and queues country repair',()=>{
 const s=setup(),{c}=s;
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),record={id:'n1',fecha:'2026-10-20',pais:'Sin determinar',medio:'Editor',entidad:'Revolut',titular:'Revolut amplía su plataforma digital para empresas',extracto:'Nuevas funciones para pymes',url:'https://news.google.com/rss/articles/a',capturada:'2026-10-20',fuente:'Revolut · Italia',idioma:'es',clasificacion:'{}',taxonomia:'{"ids":[]}'};s.sheets.get('Noticias').grid.push(keys.map(key=>record[key]||''));
 const config=s.sheets.get('Configuracion'),entries=config.grid.find(row=>row[0]==='entities'),entities=JSON.parse(entries[1]);entries[1]=JSON.stringify(entities.map(({headquartersCountry,...row})=>row));c.invalidateConfiguration_();
 s.book.copy=()=>({getId:()=> 'backup-geography',getUrl:()=> 'https://docs.google.com/spreadsheets/d/backup-geography/edit',getSheetByName:name=>s.book.getSheetByName(name)});
 const result=c.applyGeographyUpgrade();assert.equal(result.entities,89);assert.ok(result.backupId);assert.equal(c.configuration_().entities.find(row=>row.name==='Revolut').headquartersCountry,'Reino Unido');
 c.newsClassificationBatch_();assert.equal(c.classificationJob_().state,'Publicando');assert.equal(c.rows_('Noticias')[0].pais,'Italia');assert.equal(c.rows_('Noticias')[0].id,record.id);assert.equal(c.getGeographyUpgrade().classification.processed,1);
 s.properties.GEOGRAPHY_UPGRADE=JSON.stringify({...result,version:'3.28.0'});c.applyGeographyUpgrade();assert.equal(c.classificationJob_().next,2);
});
