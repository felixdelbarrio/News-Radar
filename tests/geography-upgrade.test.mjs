import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();return s;}
test('country assignment follows content, publisher URL, RSS and regional fallback',()=>{
 const {c}=setup(),base={titular:'Nuevo servicio digital para empresas',entidad:'Revolut',url:'https://news.google.com/rss/articles/a',fuente:'Revolut · Italia'};
 const cases=[
  [{...base,titular:'Revolut lanza servicio en Colombia',sourceUrl:'https://editor.es/story'},'Colombia','headline'],
  [{...base,sourceUrl:'https://editor.co/story'},'Italia','rss_fallback'],
  [{...base,medio:'LaRepublica.co'},'Italia','rss_fallback'],
  [{...base,medio:'Portafolio.co'},'Italia','rss_fallback'],
  [{...base,medio:'Portafolio.co',titular:'Nuevo servicio digital en España'},'España','headline'],
  [{...base,medio:'Portafolio.co informa'},'Italia','rss_fallback'],
  [base,'Italia','rss_fallback'],
  [{...base,fuente:''},'Sin determinar','undetermined']
 ];
 for(const [row,country,reason] of cases){const result=c.newsCountryDecision_(row);assert.equal(result.country,country);assert.equal(result.reason,reason);}
 assert.equal(c.domainCountry_('https://bank.co.uk/story'),'Reino Unido');
 assert.equal(c.domainCountry_('https://dealroom.co/story'),'');
 assert.equal(c.domainCountry_('https://publisher.com/es/co/story'),'');
});
test('verified editorial editions use exact host and full path segments',()=>{
 const {c}=setup(),base={titular:'Nuevo servicio digital para empresas',entidad:'BBVA',fuente:'BBVA · Argentina',url:'https://news.google.com/rss/articles/a'};
 const cases=[
  ['https://www.infobae.com/peru/economia/noticia','Perú','edition'],
  ['https://infobae.com/peruano/noticia','Sin determinar','undetermined'],
  ['https://other.infobae.com/peru/noticia','Argentina','rss_fallback'],
  ['https://www.cronista.com/mexico/finanzas/noticia','México','edition'],
  ['https://www.bbva.com/es/co/noticia','Colombia','edition'],
  ['https://www.bbva.com/es/noticia','Sin determinar','undetermined'],
  ['https://app.dealroom.co/story','Sin determinar','undetermined']
 ];
 for(const [sourceUrl,country,reason] of cases){const result=c.newsCountryDecision_({...base,sourceUrl});assert.equal(result.country,country,sourceUrl);assert.equal(result.reason,reason,sourceUrl);}
 assert.deepEqual(Array.from(c.newsCountryDecision_({...base,manualGeografias:['EMEA']}).geographies),['EMEA']);
 assert.equal(c.newsCountryDecision_({...base,manualGeografias:['EMEA']}).type,'REGION');
});
test('editorial upgrade dry run preserves manual rows and applies once',()=>{
 const {c,sheets}=setup(),sheet=sheets.get('CatalogoMedios');
 sheet.grid.splice(0,sheet.grid.length,...sheet.grid.filter(([key])=>!String(key).includes('|v7_')));
 const generic=sheet.grid.find(([key])=>String(key).includes('seed_981653c20afac89d'));
 generic[1]=JSON.stringify({...JSON.parse(generic[1]),ruleType:'DOMINIO_GENERICO'});
 vm.runInContext('geographyCatalogMemory_.clear()',c);
 const baseline=JSON.stringify(sheet.grid),preview=c.verifiedEditorialCatalogUpgrade_(true);
 assert.ok(preview.count>10);assert.equal(JSON.stringify(sheet.grid),baseline);
 const applied=c.verifiedEditorialCatalogUpgrade_(false);assert.equal(applied.count,preview.count);
 assert.equal(c.verifiedEditorialCatalogUpgrade_(false).count,0);
 const rows=sheet.grid.slice(1).map(row=>JSON.parse(row[1]));
 assert.equal(rows.find(row=>row.seedId==='v7_infobae_com_peru')?.editionCountry,'Perú');
 assert.equal(rows.find(row=>row.seedId==='seed_981653c20afac89d')?.ruleType,'EDITOR_GLOBAL');
});
test('upgrade preserves published rows, installs headquarters and queues country repair',()=>{
 const s=setup(),{c}=s;
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),record={id:'n1',fecha:'2026-10-20',pais:'Sin determinar',medio:'Editor',entidad:'Revolut',titular:'Revolut amplía su plataforma digital para empresas',extracto:'Nuevas funciones para pymes',url:'https://news.google.com/rss/articles/a',capturada:'2026-10-20',fuente:'Revolut · Italia',idioma:'es',clasificacion:'{}',taxonomia:'{"ids":[]}'};s.sheets.get('Noticias').grid.push(keys.map(key=>record[key]||''));
 const config=s.sheets.get('Configuracion'),entries=config.grid.find(row=>row[0]==='entities'),entities=JSON.parse(entries[1]);entries[1]=JSON.stringify(entities.map(({headquartersCountry,...row})=>row));c.invalidateConfiguration_();
 s.book.copy=()=>({getId:()=> 'backup-geography',getUrl:()=> 'https://docs.google.com/spreadsheets/d/backup-geography/edit',getSheetByName:name=>s.book.getSheetByName(name)});
 const result=c.applyGeographyUpgrade();assert.equal(result.entities,vm.runInContext('CONFIGURATION_DEFAULTS.entities.length',c));assert.ok(result.backupId);assert.equal(c.configuration_().entities.find(row=>row.name==='Revolut').headquartersCountry,'Reino Unido');
 c.newsClassificationBatch_();assert.equal(c.classificationJob_().state,'Publicando');assert.equal(c.rows_('Noticias')[0].pais,'Italia');assert.equal(c.rows_('Noticias')[0].id,record.id);assert.equal(c.getGeographyUpgrade().classification.processed,1);
 s.properties.GEOGRAPHY_UPGRADE=JSON.stringify({...result,version:'3.28.0'});c.applyGeographyUpgrade();assert.equal(c.classificationJob_().next,2);
});
test('a geographic review keeps historical geography under weak evidence and honors a verified manual assignment',()=>{
 const {c}=setup(),base={id:'historic',pais:'Colombia',titular:'Nuevo servicio digital para empresas',url:'https://news.google.com/rss/articles/example',sourceUrl:'https://infobae.com/economia/example',fuente:'Revolut · Italia'};
 const legacy=c.newsCountryDecision_(base);
 assert.equal(legacy.country,'Colombia');
 assert.equal(legacy.reason,'historic_country');
 assert.equal(legacy.confidence,'low');
 const evidence=[{country:'Colombia',method:'content',value:'colombia',score:90}];
 const verified={...base,clasificacion:JSON.stringify({procedencia:{geografias:['Colombia','México'],paisMetodo:'content',paisConfianza:'medium',paisEvidencias:evidence}})};
 const editorial={...verified,sourceUrl:'https://infobae.com/peru/economia/example'};
 const retained=c.newsCountryDecision_(editorial);
 assert.deepEqual(Array.from(retained.geographies),['Colombia','México']);
 assert.deepEqual(JSON.parse(JSON.stringify(retained.countryEvidence)),evidence);
 assert.equal(c.newsCountryDecision_({...base,sourceUrl:editorial.sourceUrl}).country,'Perú');
 assert.equal(c.newsCountryDecision_({...verified,titular:'Banco lanza su plataforma en Perú'}).country,'Perú');
 const manual={...verified,titular:'Banco lanza su plataforma en Perú',clasificacion:JSON.stringify({procedencia:{paisMetodo:'manual_verified_content',paisEvidencias:evidence}})};
 const corrected=c.newsCountryDecision_(manual);
 assert.equal(corrected.country,'Colombia');
 assert.equal(corrected.reason,'manual_verified_content');
 assert.deepEqual(JSON.parse(JSON.stringify(corrected.countryEvidence)),evidence);
});
