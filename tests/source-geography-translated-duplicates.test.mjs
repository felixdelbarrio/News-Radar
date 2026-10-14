import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const spanish='Santander lanza una nueva plataforma digital de pagos para empresas';
const english='Santander launches a new digital payments platform for businesses';
function story(id,changes={}){return {id,fecha:'2026-10-09',titular:spanish,extracto:'Nueva oferta de pagos digitales para empresas y pymes',entidad:'Santander',pais:'Sin determinar',medio:'Editor',fuente:'Santander · Perú',url:'https://news.google.com/articles/'+id,capturada:'2026-10-10T00:00:00Z',clasificacion:JSON.stringify({digital:true,generalista:true,capacidades:['Empresas: Pagos']}),taxonomia:JSON.stringify({ids:['payments']}),...changes};}
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));}
function translate(c,row,title=english){c.LanguageApp={translate:()=>'<p>'+title+'</p><p>New digital payments for businesses</p>'};c.storeArticleTranslation_(row,'en');}
test('la geografía del RSS se conserva sin mención local y una edición identificada resuelve fuentes de Google News',()=>{
 const {c}=server(),raw={title:spanish,excerpt:'Nueva oferta digital para empresas',date:'2026-10-09T12:00:00Z',url:'https://news.google.com/articles/a'};
 const feed={name:'Google News RSS Perú',entity:'Santander',country:'Perú',domain:'news.google.com',url:'https://news.google.com/rss/search?gl=PE',kind:'rss'};
 const item=c.evaluate_(raw,feed,new Date('2026-10-10T12:00:00Z')).item;assert.equal(item.country,'Perú');const row=c.newsRecord_(item,feed,new Date());assert.equal(row[2],'Perú');assert.equal(row[9],feed.name);
 assert.equal(c.sourceCountry_({...feed,country:'Sin determinar'}),'Perú');assert.equal(c.sourceCountry_({...feed,country:'Sin determinar',url:'https://news.google.com/rss/search?q=bank'}),'Perú');
 assert.equal(c.sourceCountry_({...feed,name:'Google News RSS',country:'Sin determinar',url:'https://news.google.com/rss/search?q=bank'}),'');
 const global=c.evaluate_(raw,{...feed,name:'Global',country:'Sin determinar',url:'https://news.google.com/rss/search?q=bank'},new Date('2026-10-10T12:00:00Z'));assert.equal(global.item.country,'Sin determinar');
});
test('el histórico usa el origen para filtros y banderas y la clasificación persiste el país sin modificar origen ni URL',()=>{
 const s=server(),c=s.c,input=story('old');add(s,[input]);
 assert.equal(c.cachedNewsRecords_()[0].pais,'Perú');assert.equal(c.selectNews_([input],{country:'Perú'}).length,1);assert.equal(c.newsCsv_([input],{country:'Perú'}).count,1);
 c.requestNewsClassification_(true);c.newsClassificationBatch_();const stored=c.rows_('Noticias')[0];assert.equal(stored.pais,'Perú');assert.equal(stored.fuente,input.fuente);assert.equal(stored.url,input.url);assert.equal(c.classificationJob_().state,'Completada');
});
test('titulares equivalentes entre idiomas cuentan una vez en noticias, novedades, Radar, exportación y newsletter sin traductor durante lectura',()=>{
 const s=server(),c=s.c,a=story('es'),b=story('en',{titular:english,extracto:'New digital payments for businesses',fecha:'2026-10-10'});add(s,[a,b]);translate(c,a);c.LanguageApp.translate=()=>{throw Error('No se traduce durante lectura');};
 c.taxonomyCatalog_=()=>[{id:'payments',palanca:'Pagos y cobros',subpalanca:'Pagos empresariales'}];
 const query={from:'2026-10-08',to:'2026-10-11'};assert.equal(c.getDashboard({...query,view:'news'}).contextTotal,1);assert.equal(c.getDashboard({...query,view:'radar'}).stats.news,1);assert.equal(c.getDashboard({...query,view:'briefing'}).briefing.total,1);assert.equal(c.exportNews(query).count,1);assert.equal(c.newsletter_(c.rows_('Noticias'),query,'Resumen',new Date(),'sub').count,1);assert.equal(c.rows_('Noticias').length,2);
 const known=c.knownUrls_();assert.equal(c.duplicateTitle_(known,{title:english,date:new Date('2026-10-10'),publisher:'Otro editor'}),true);
 const reads=s.reads;c.annotateNews_([a,b]);assert.equal(s.reads,reads);
});
test('la identidad traducida conserva importes, fechas lejanas y titulares cortos y fusiona equivalencias transitivas',()=>{
 const {c}=server(),a=story('a',{identityTitles:[english]}),b=story('b',{titular:'Santander presenta una nueva oferta digital de cobros para empresas',identityTitles:['Santander introduces a new digital collections service for businesses']}),bridge=story('bridge',{titular:english,identityTitles:[b.identityTitles[0]]});
 assert.equal(c.uniqueNews_([a,b,bridge]).length,1);assert.equal(c.uniqueNews_([a,story('amount',{titular:english.replace('new','300 million euro')}),story('later',{titular:english,fecha:'2026-10-20'}),story('short-a',{titular:'Pagos',identityTitles:['Payments']}),story('short-b',{titular:'Payments'})]).length,5);
});
test('una traducción recién guardada invalida el recuento de Radar aunque se reutilice el caché de registros originales',()=>{
 const s=server(),c=s.c,a=story('es'),b=story('en',{titular:english,extracto:'New digital payments for businesses'});add(s,[a,b]);assert.equal(c.getDashboard({view:'radar'}).stats.news,2);translate(c,a);assert.equal(c.getDashboard({view:'radar'}).stats.news,1);
});
test('las tarjetas muestran el origen RSS escapado con estilos de identidad compartidos',async t=>{
 const a=await app(t,{configure({data}){data.briefing.items[0].fuente='Google News RSS Perú <script>';}});const source=a.find('#briefing-list .story-identity');assert.match(source.textContent,/Origen RSS: Google News RSS Perú <script>/);assert.equal(source.querySelector('script'),null);
});
