import {drainSnapshots} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
function labels(c,title,excerpt=''){return c.classification_(c.searchText_(title),c.searchText_(title+' '+excerpt)).labels;}
test('señales MECE priorizan incidencia, alianza y lanzamiento; alcance sin evento recibe mejora',()=>{
 const {c}=server();
 for(const [title,expected] of [
 ['BBVA lanza nueva app para empresas con una alianza estratégica','Alianza estratégica'],
 ['BBVA lanza nueva app para empresas: caída del sistema y problemas de acceso','Indisponibilidad / Incidencia operativa'],
 ['Qonto lanza una nueva API de tesorería para empresas','Lanzamiento de producto'],
 ['Qonto ofrece API de tesorería para empresas','Mejora de oferta']]){
 const result=labels(c,title);assert.equal(result.digital,true,title);assert.deepEqual(Array.from(result.senales),[expected],title);
 }
});
test('incidencia digital con entidad monitorizada es relevante incluso sin referencia a empresas',()=>{
 const {c}=server(),result=labels(c,'BBVA: problemas de acceso a la app y error al iniciar sesión');
 assert.equal(result.digital,true);assert.equal(result.segmento,'Empresas e instituciones');assert.deepEqual(Array.from(result.senales),['Indisponibilidad / Incidencia operativa']);
 for(const title of ['BBVA mejora su app para empresas para prevenir caídas','BBVA guía: qué hacer si la app no funciona'])assert.notEqual(labels(c,title).evento,'Indisponibilidad / Incidencia operativa');
});
test('normalización elimina etiquetas rotas y codificadas antes de traducir sin truncar marcado',()=>{
 const {c}=server();assert.equal(c.plainText_('le> Caída del servicio <h\n3>BBVA</h3>'),'Caída del servicio BBVA');assert.equal(c.plainText_('&lt;article&gt;Titular&lt;/article&gt;'),'Titular');
 let input;c.LanguageApp.translate=(value)=>{input=value;return value;};
 const result=c.translateArticleText_({titular:'<h\n3>Banco</h3>',extracto:'<article>'+('texto '.repeat(1200))+'</article>'},'en');
 assert.equal(result.titular,'Banco');assert.equal(result.extracto.length,5000);assert.ok(input.endsWith('</p>'));assert.ok(!input.includes('&lt;article'));
});
test('país único del titular domina dominio; extracto incidental no suplanta dominio colombiano',()=>{
 const {c}=server();assert.equal(c.newsCountry_({titular:'BBVA renueva pagos',extracto:'La matriz está en España',url:'https://abceconomia.co/noticia',pais:'España'}),'Colombia');assert.equal(c.newsCountry_({titular:'BBVA renueva pagos en México',url:'https://abceconomia.co/noticia',pais:'España'}),'México');
});
test('patrones funcionales de auditoría asignan operativas específicas del catálogo',()=>{
 const {c}=server(),definitions=c.taxonomyDefinitions(c.configuration_().taxonomy);
 for(const [title,id] of [['Citi y Coinbase lanzan pagos con stablecoins para empresas','03.13'],['KB Kookmin lanza parking account para fondos B2B','02.17'],['Getnet y Nayax estrenan SoftPOS para comercios','11.02'],['Mercado Pago incorpora impuestos provinciales en su app','05.23'],['BBVA presenta problemas de acceso a la app','16.01']]){
 const text=c.searchText_(title),matches=c.taxonomyDecision(text,definitions,text).matches;assert.ok(matches.some(match=>match.row.key===id),title);assert.equal(labels(c,title).digital,true,title);
 }
});

test('prevención o caídas ajenas no son incidencias; un evento real separado sí prevalece',()=>{
 const {c}=server();
 for(const title of ['BBVA mejora su app para empresas: riesgo de caída del servicio','BBVA app para empresas. Caída de ingresos del banco','BBVA ofrece API para empresas. Podría fallar el sistema'])assert.notEqual(labels(c,title).evento,'Indisponibilidad / Incidencia operativa',title);
 const result=labels(c,'BBVA: prevención de caídas en la app; pero hoy la app no funciona');assert.equal(result.evento,'Indisponibilidad / Incidencia operativa');
});
test('clasificación completada con mismos datos no crea otro lote; edición y fuerza lo reactivan',()=>{
 const {c,sheets}=server(),sheet=sheets.get('Noticias'),keys=vm.runInContext('RADAR.sheets.Noticias',c),row={id:'same',titular:'Qonto ofrece API de tesorería para empresas',fecha:'2026-10-22',entidad:'Qonto',url:'https://example.com/same'};sheet.grid.push(keys.map(key=>row[key]||''));
 c.requestNewsClassification_(true);c.newsClassificationBatch_();drainSnapshots(c);assert.equal(c.classificationJob_().state,'Completada');const first=JSON.stringify(c.classificationJob_());c.requestNewsClassification_();assert.equal(JSON.stringify(c.classificationJob_()),first);
 c.properties_().setProperty('NEWS_RECORDS_REVISION','manual-change');c.requestNewsClassification_();assert.equal(c.classificationJob_().state,'Pendiente');c.newsClassificationBatch_();drainSnapshots(c);c.requestNewsClassification_(true);assert.equal(c.classificationJob_().state,'Pendiente');
});
