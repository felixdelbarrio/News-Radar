import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
function row(changes={}){return {id:'news',fecha:'2026-10-21',titular:'BBVA lanza pagos digitales para empresas',extracto:'',entidad:'BBVA',pais:'España',medio:'Editor',fuente:'BBVA · España',url:'https://news.google.com/articles/test',taxonomia:'{"ids":[]}',...changes};}
test('medios colombianos y Bre-B corrigen feeds españoles antes del fallback nacional',()=>{
 const {c}=server();for(const medio of ['Revista Semana','ABC Economía','Demócrata','EL PAÍS','Portafolio','La República','Caracol Radio','Blu Radio'])assert.equal(c.newsCountry_(row({medio,titular:'BBVA incorpora Bre-B para empresas'})),'Colombia',medio);
 for(const medio of ['Revista Semana','El Espectador','El Colombiano','Caracol Radio','Noticias Caracol','Blu Radio','RCN Radio','Noticias RCN','La FM','W Radio','Pulzo','RED+ Noticias','Más Colombia','Pluralidad Z','La Opinión Cúcuta','Vanguardia','Cambio Colombia','Dinero'])assert.equal(c.newsCountry_(row({medio})),'Colombia',medio);
 assert.equal(c.newsCountry_(row({medio:'ABC Economía',extracto:'El banco mejora pagos Bre-B para empresas.'})),'Colombia');
});
test('cabeceras homónimas respetan el mercado RSS y los dominios explícitos desambiguan',()=>{
 const {c}=server();for(const medio of ['El Economista','Expansión','Demócrata','EL PAÍS','Infobae','Bloomberg Línea','Yahoo','TradingView','CoinDesk','Unite.AI','DiarioBitcoin','CriptoNoticias'])for(const country of ['México','Colombia','Argentina','Brasil','Uruguay','Reino Unido'])assert.equal(c.newsCountry_(row({medio,fuente:'BBVA · '+country,pais:country})),country,medio+' '+country);
 assert.equal(c.newsCountry_(row({medio:'Expansión',fuente:'BBVA · México',clasificacion:JSON.stringify({procedencia:{medioUrl:'https://www.expansion.com.mx/'}})})),'México');
 assert.equal(c.newsCountry_(row({medio:'El Economista',fuente:'BBVA · México',sourceUrl:'https://www.eleconomista.es/'})),'España');
 assert.equal(c.newsCountry_(row({medio:'Editor',extracto:'La plataforma SPEI de pagos para empresas'})),'México');
 assert.equal(c.newsCountry_(row({titular:'BBVA presenta Bre-B en México'})),'México');
 assert.equal(c.newsCountry_(row({url:'https://editor.com.co/story',sourceUrl:'https://globalpublisher.com/'})),'Colombia');
});
test('RSS conserva source URL en noticias y candidatos y atribuye candidato rechazado por el medio real',()=>{
 const {c}=server(),source={getText:()=> 'Portafolio',getAttribute:name=>name==='url'?{getValue:()=> 'https://www.portafolio.co/'}:null},item={getChildText:key=>({title:'BBVA lanza pagos digitales para empresas',link:'https://news.google.com/articles/rss',pubDate:'2026-10-21',description:'Nueva plataforma digital para empresas.'})[key]||'',getChild:key=>key==='source'?source:null};
 c.XmlService={getNamespace:value=>value,parse:()=>({getRootElement:()=>({getChild:()=>({getChildren:()=>[item],getChildText:()=> 'es'})})})};const parsed=c.parseFeed_('<rss/>')[0];assert.equal(parsed.sourceUrl,'https://www.portafolio.co/');assert.equal(parsed.source,'Portafolio');
 const feed={name:'BBVA · España',entity:'BBVA',country:'España',domain:'news.google.com',url:'https://news.google.com/rss',kind:'profile'},result=c.evaluate_(parsed,feed,new Date('2026-10-22T12:00:00Z'));assert.equal(result.item.country,'Colombia');const record=c.newsRecord_(result.item,feed,new Date());assert.equal(JSON.parse(record[11]).procedencia.medioUrl,parsed.sourceUrl);
 const rejected=c.evaluate_({...parsed,title:'BBVA publica resultados financieros trimestrales'},feed,new Date('2026-10-22T12:00:00Z'));assert.equal(rejected.candidate.country,'Colombia');const candidate=c.candidateRecord_(rejected.candidate,feed,new Date(),rejected.reason),keys=vm.runInContext('RADAR.sheets.Candidatos',c);assert.equal(JSON.parse(candidate[keys.indexOf('procedencia')]).medioUrl,parsed.sourceUrl);
});
test('Santander regional se excluye sin expulsar banca legítima por ciudades compartidas',()=>{
 const {c}=server();for(const text of ['Norte de Santander anuncia pagos del PAE','Santander y Cesar investigan minería ilegal','En Santander capturados por granadas y disidencias','Santander anuncia renta ciudadana en Cúcuta','Veolia aguas del Socorro en Santander'])assert.equal(c.santanderExcluded_(c.searchText_(text)),true,text);
 for(const text of ['Banco Santander lanza pagos digitales para empresas en Colombia','Banco Santander mejora su banca móvil para empresas en Málaga','Santander Empresas incorpora transferencias en Cúcuta'])assert.equal(c.santanderExcluded_(c.searchText_(text)),false,text);
});
test('reclasifica país incorrecto aunque la revisión y el contenido de la noticia estén vigentes',()=>{
 const s=server(),c=s.c,input=row({medio:'Revista Semana'}),labels=c.classification_(c.searchText_(input.titular),c.searchText_(input.titular)).labels;input.clasificacion=JSON.stringify(labels);input.taxonomia=JSON.stringify(c.taxonomyRecord_(input.titular,''));const keys=vm.runInContext('RADAR.sheets.Noticias',c);Array.prototype.push.call(s.sheets.get('Noticias').grid,keys.map(key=>input[key]||''));
 c.requestNewsClassification_();c.newsClassificationBatch_();assert.equal(c.rows_('Noticias')[0].pais,'Colombia');assert.equal(JSON.parse(c.rows_('Noticias')[0].clasificacion).revision,labels.revision);
});
test('candidatos se actualizan por lotes acotados y mantenimiento no publica antes de terminar su cursor',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Candidatos',c);for(let i=0;i<205;i++){const value={...row({id:String(i),titular:'BBVA incorpora Bre-B para empresas',entidad:'BBVA Empresas'}),procedencia:JSON.stringify({medio:'ABC Economía'}),clasificacion:'{}'};Array.prototype.push.call(s.sheets.get('Candidatos').grid,keys.map(key=>value[key]||''));}
 c.maintenance_();c.dailyCollectionPending_=()=>false;let attempts=0;while(c.maintenanceJob_().state!=='Publicando'&&c.maintenanceJob_().state!=='Completada'&&attempts++<5)c.maintenanceBatch_();assert.ok(attempts>=3);assert.equal(c.maintenanceJob_().candidateNext,207);const rows=c.rows_('Candidatos');assert.equal(rows.length,205);assert.ok(rows.every(row=>row.pais==='Colombia'&&row.entidad==='BBVA'&&JSON.parse(row.clasificacion).version==='3.15.0'));
 const reads=s.reads;assert.equal(c.reclassifyCandidates_(207,100,8000).changed,0);assert.ok(s.reads-reads<=1);
});
test('el país del RSS resuelve alias empresariales aunque el país persistido sea incorrecto',()=>{
 const {c}=server();for(const medio of ['El Economista','Expansión','Demócrata'])assert.equal(c.newsCountry_(row({entidad:'Santander',medio,fuente:'Santander Empresas · México',pais:'España'})),'México');
});
test('La República y otras cabeceras homónimas conservan Perú y el mercado RSS salvo dominio concluyente',()=>{
 const {c}=server();for(const medio of ['La República','La Nación','La Opinión','El Universal','Vanguardia','El Heraldo'])assert.equal(c.newsCountry_(row({medio,fuente:'Interbank · Perú',pais:'Colombia'})),'Perú',medio);
 assert.equal(c.newsCountry_(row({medio:'La República',fuente:'Interbank · Perú',sourceUrl:'https://larepublica.co/'})),'Colombia');
 assert.equal(c.newsCountry_(row({medio:'La República',fuente:'BBVA · España',sourceUrl:'https://larepublica.pe/'})),'Perú');
});
