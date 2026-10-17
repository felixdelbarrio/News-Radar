import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {read,readServerScript} from '../scripts/source.mjs';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
function custom(c){const snapshot=clone(c.getConfiguration());snapshot.config.capabilities={Empresas:[{name:'Flujo propio',terms:['flujo exclusivo'],enabled:true}]};c.saveConfiguration(snapshot);return snapshot;}
const now=new Date('2026-10-12T10:00:00Z'),range={from:'2026-10-02',to:'2026-10-12'};
const raw={title:'Qonto lanza flujo exclusivo en su canal digital para empresas',excerpt:'Nuevo autoservicio para empresas',date:'2026-10-09T10:00:00Z',url:'https://news.google.com/rss/articles/flow'};
test('51 capacidades empresariales, validación acotada y persistencia sin catálogo Retail',()=>{const {c,sheets,setEmail}=server(),snapshot=clone(c.getConfiguration());assert.equal(snapshot.config.capabilities.Empresas.length,51);assert.deepEqual(Object.keys(snapshot.config.capabilities),['Empresas']);snapshot.config.capabilities.Empresas[0].enabled=false;c.saveConfiguration(snapshot);assert.deepEqual(JSON.parse(sheets.get('Configuracion').grid.find(row=>row[0]==='capabilities')[1]),snapshot.config.capabilities);for(const edit of [x=>x.Empresas.push({...x.Empresas[0]}),x=>x.Empresas[0].terms=[],x=>x.Empresas[0].terms=['" OR evil'],x=>x.Empresas[0].enabled='true',x=>x.Retail=[]]){const invalid=clone(snapshot);edit(invalid.config.capabilities);assert.throws(()=>c.saveConfiguration(invalid));}setEmail('reader@bbva.com');assert.throws(()=>c.getConfiguration(),/administrador/);});
test('editar, desactivar y eliminar capacidades modifica consultas y puntuación sin despliegue',()=>{
 const {c}=server();custom(c);const config=c.configuration_(),geo=config.geographies[0],entity=config.entities.find(row=>row.name==='Qonto'),feed=c.profileFeed_(geo,entity,range,true);
 assert.match(decodeURIComponent(feed.url),/flujo exclusivo/);const score=c.digitalAssessment_('qonto lanza flujo exclusivo en su canal digital para empresas','qonto lanza flujo exclusivo en su canal digital para empresas').score;assert.ok(score>2);assert.ok(c.evaluate_(raw,feed,now).item);
 let snapshot=clone(c.getConfiguration());snapshot.config.capabilities.Empresas[0].enabled=false;c.saveConfiguration(snapshot);assert.doesNotMatch(decodeURIComponent(c.profileFeed_(geo,entity,range,true).url),/flujo exclusivo/);assert.equal(c.digitalAssessment_('qonto lanza flujo exclusivo en su canal digital para empresas','qonto lanza flujo exclusivo en su canal digital para empresas').score,0);assert.match(c.evaluate_(raw,feed,now).reason,/canal digital/);
 snapshot=clone(c.getConfiguration());snapshot.config.capabilities.Empresas[0].enabled=true;snapshot.config.capabilities.Empresas[0].terms=['nuevo flujo'];c.saveConfiguration(snapshot);assert.match(decodeURIComponent(c.profileFeed_(geo,entity,range,true).url),/nuevo flujo/);assert.doesNotMatch(decodeURIComponent(c.profileFeed_(geo,entity,range,true).url),/flujo exclusivo/);
 const record=c.annotateNews_([{entidad:'Qonto',titular:'Qonto lanza nuevo flujo digital para empresas',extracto:''}])[0];assert.ok(record.segmentos.includes('Empresas e instituciones'));assert.ok(record.senales.length);
 snapshot=clone(c.getConfiguration());snapshot.config.capabilities.Empresas=[];c.saveConfiguration(snapshot);assert.doesNotMatch(decodeURIComponent(c.profileFeed_(geo,entity,range,true).url),/flujo exclusivo/);
});
test('consultas acotadas y sin producto cartesiano; idioma, país y fechas se validan localmente',()=>{
 const {c}=server(),profiles=c.feeds_().filter(feed=>feed.kind==='profile'),feeds=c.collectionFeeds_(range);assert.ok(feeds.length<=profiles.length*2+c.configuration_().feeds.length);assert.equal(new Set(feeds.map(feed=>feed.url)).size,feeds.length);
 for(const feed of feeds.filter(row=>row.kind==='profile')){const q=new URL(feed.url).searchParams.get('q');assert.ok(q.startsWith('after:'));assert.ok(q.length<1800);assert.doesNotMatch(q,/"España"|"México"/);assert.equal(c.collectionTaskFeed_({fuente:feed.name,url:feed.url},c.collectionFeedIndex_()).url,feed.url);}
 const profile=profiles.find(row=>row.entity==='Santander'&&row.country==='España'),item={...raw,title:'Santander lanza nueva app para empresas en México'};assert.match(c.evaluate_(item,profile,now).reason,/Geografía/);
 const unlocated=c.evaluate_({...raw,title:'Santander lanza nueva app para empresas'},profile,now).item;assert.equal(unlocated.country,'España');assert.equal(c.profileFeed_(c.configuration_().geographies.find(row=>row.code==='UY'),c.configuration_().entities[0]).url.includes('gl=US'),true);
 assert.equal(c.collectionQueryRange_('https://news.google.com/rss/search?q=%ZZ'),null);assert.equal(c.collectionQueryRange_('https://news.google.com/rss/search?q=after%3A2026-02-30%20before%3A2026-03-05'),null);
 const annual=c.collectionRange_('year',now),windows=c.collectionWindows_(annual);assert.equal(windows.length,14);for(let i=1;i<windows.length;i++)assert.equal(Date.parse(windows[i-1].from)-Date.parse(windows[i].to),86400000);
});
test('saturación exige fechas útiles y la subdivisión no añade tareas repetidas tras una interrupción',()=>{
 const {c,sheets}=server();custom(c);const config=c.configuration_(),feed=c.profileFeed_(config.geographies[0],config.entities.find(row=>row.name==='Qonto'),range,true);feed.range=range;
 const response={getResponseCode:()=>200,getContentText:()=>'<rss/>'};c.parseFeed_=()=>Array.from({length:100},(_,i)=>({...raw,url:raw.url+i,date:i<1?raw.date:'2020-01-01'}));assert.equal(c.ingestFeed_(feed,new Set(),'cycle',now,response).saturated,false);
 c.parseFeed_=()=>Array.from({length:100},(_,i)=>({...raw,title:raw.title+' '+i,url:raw.url+i}));assert.equal(c.ingestFeed_(feed,new Set(),'cycle',now,response).saturated,true);
 const children=c.splitCollectionFeed_(feed);for(const child of children)assert.equal(c.collectionTaskFeed_({fuente:child.name,url:child.url},c.collectionFeedIndex_()).url,child.url);
 const queue=sheets.get('Recopilacion');queue.grid.push(['cycle',feed.name,feed.url,'Pendiente',0,'',0,0,'',range.to],...children.map(child=>['cycle',child.name,child.url,'Pendiente',0,'',0,0,'',child.range.to]));
 const keys=vm.runInContext('RADAR.sheets.Recargas',c),job={id:'cycle',tipo:'annual',desde:range.from,hasta:range.to,inicio:now.toISOString(),estado:'Pendiente',row:2};sheets.get('Recargas').grid.push(keys.map(key=>job[key]||''));
 c.UrlFetchApp={fetchAll:()=>[response]};c.ingestFeed_=()=>({news:[],audit:[],evaluated:100,saturated:true});const work=c.collectionWork_(Date.now());work.pending=work.pending.filter(task=>task.url===feed.url);c.collectionBatch_(work);assert.equal(queue.grid.length,4);
});
test('redirecciones HTTPS relativas y de idioma; destinos externos y credenciales permanecen bloqueados',()=>{
 const {c}=server();for(const location of ['/rss/final','//news.google.com/rss/final','final','?q=changed']){
  const calls=[];c.UrlFetchApp={fetchAll:requests=>{calls.push(requests);return requests.map(()=>calls.length===1?{getResponseCode:()=>302,getAllHeaders:()=>({Location:location})}:{getResponseCode:()=>200});}};
  assert.equal(c.fetchFeedBatch_([{url:'https://news.google.com/rss/first',domain:'news.google.com'}])[0].response.getResponseCode(),200);assert.equal(calls.length,2);assert.ok(calls[1][0].url.startsWith('https://news.google.com/'));
 }
 for(const location of ['//evil.test/rss','https://news.google.com.evil.test/rss','https://user@news.google.com/rss','http://news.google.com/rss','javascript:alert(1)']){
  let count=0;c.UrlFetchApp={fetchAll:requests=>{count++;return requests.map(()=>({getResponseCode:()=>302,getAllHeaders:()=>({Location:location})}));}};assert.ok(c.fetchFeedBatch_([{url:'https://news.google.com/rss/first',domain:'news.google.com'}])[0].error);assert.equal(count,1);
 }
});
test('deduplicación exacta y ligera persiste entre ejecuciones entre mercados sin mezclar fechas o eventos diferentes',()=>{
 const {c}=server();custom(c);const config=c.configuration_(),feed={...c.profileFeed_(config.geographies[0],config.entities.find(row=>row.name==='Qonto'),range,true),range};const response={getResponseCode:()=>200,getContentText:()=>'<rss/>'};let items=[raw,{...raw,url:raw.url+'-copy',title:'Qonto lanza flujo exclusivo en su canal digital para empresas!'}];c.parseFeed_=()=>items;
 const first=c.ingestFeed_(feed,c.knownUrls_(),'cycle',now,response);assert.equal(first.news.length,1);assert.equal(first.duplicated,1);c.append_('Noticias',first.news);assert.equal(c.ingestFeed_(feed,c.knownUrls_(),'retry',now,response).news.length,0);
 for(const change of [{title:raw.title+' versión 2'},{date:'2026-10-03T10:00:00Z'}]){items=[{...raw,...change,url:raw.url+JSON.stringify(change)}];assert.equal(c.ingestFeed_(feed,c.knownUrls_(),'new',now,response).news.length,1);}
 const known=c.knownUrls_();assert.equal(c.duplicateTitle_(known,{...raw,title:raw.title,date:new Date(raw.date),entity:'Qonto',country:'México'},feed),true);
 const included=first.news[0];assert.equal(included.length,13);assert.ok(included[7].startsWith('https://'));assert.equal(included[9],feed.name);assert.equal(included[3],'');
});
test('inicialización incorpora capacidades y RSS una vez, conserva catálogos y repara solo consultas pendientes',()=>{
 const {c,sheets,properties}=server(),sheet=sheets.get('Configuracion');delete properties.CATALOG_VERSION;sheet.grid.splice(sheet.grid.findIndex(row=>row[0]==='capabilities'),1);const feeds=sheet.grid.find(row=>row[0]==='feeds');feeds[1]=JSON.stringify(JSON.parse(feeds[1]).filter(row=>!row.id.startsWith('finextra-')).map(row=>({...row,enabled:false})));
 const source=c.configuredFeeds_().find(row=>row.kind==='profile'),url='https://news.google.com/rss/search?q=old%20after%3A2026-10-01%20before%3A2026-10-13';sheets.get('Recopilacion').grid.push(['cycle',source.name,url,'Pendiente',0,'',0,0,'',range.to],['cycle',source.name,url,'Completada',1,now.toISOString(),10,1,'',range.to]);
 c.invalidateConfiguration_();c.initializeConfiguration();const config=c.getConfiguration().config;assert.equal(config.capabilities.Empresas.length,51);assert.equal(config.feeds.filter(row=>row.id.startsWith('finextra-')).length,2);assert.equal(config.feeds[0].enabled,false);assert.notEqual(sheets.get('Recopilacion').grid[1][2],url);assert.equal(sheets.get('Recopilacion').grid[2][2],url);
 c.initializeConfiguration();assert.equal(c.getConfiguration().config.feeds.length,7);assert.equal(sheets.get('Recopilacion').grid.length,3);
});
test('el formulario empresarial permite añadir, editar, desactivar, eliminar y restaurar capacidades',async t=>{const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');await a.change('#catalog-category','capabilities');assert.equal(a.w.document.querySelector('#capability-segment'),null);a.find('#catalog-fields [data-key="name"]').value='Móvil propio';a.find('#catalog-fields [data-key="enabled"]').checked=false;await a.click('#catalog-add');const row=a.find('#catalog-fields .catalog-row:last-child');row.querySelector('[data-key="name"]').value='Flujo propio';row.querySelector('[data-key="terms"]').value='flujo propio; digital';await a.submit('#catalog-form');const saved=a.calls.find(r=>r.method==='saveConfiguration').query.config;assert.equal(saved.capabilities.Empresas.length,52);assert.equal(saved.capabilities.Empresas[0].enabled,false);await a.click('#capability-restore');assert.equal(a.w.document.querySelectorAll('#catalog-fields .catalog-row').length,51);});
test('la comparación congelada conserva trazabilidad y limita el plan de recuperación',async()=>{const {compareCollection}=await import('../scripts/compare-collection.mjs'),comparison=compareCollection();assert.ok(comparison.plans.annual.after<comparison.plans.annual.before);assert.ok(comparison.metrics.after.retrieved<comparison.metrics.before.retrieved);assert.equal(comparison.precision.after.accepted,0);});
test('relevancia distingue capacidades, novedades y ruido; conserva el contrato de reporting y newsletter',()=>{
 const {c}=server(),config=c.configuration_(),feed={...c.profileFeed_(config.geographies[0],config.entities.find(row=>row.name==='Qonto'),range),range};
 const useful=c.evaluate_({...raw,title:'Qonto launches digital KYB for businesses',excerpt:''},feed,now);assert.ok(useful.item);assert.ok(useful.relevant);
 const unrelated=c.evaluate_({...raw,title:'Qonto reports record earnings and appoints a new director',excerpt:'Financial results for its digital bank'},feed,now);assert.equal(unrelated.item,undefined);assert.match(unrelated.reason,/canal digital/);
 const rows=c.annotateNews_([{clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id:'kyb',entidad:'Qonto',fecha:'2026-10-09',titular:'Qonto launches digital KYB for businesses',extracto:'',url:raw.url,pais:'España',medio:'Editor'}, {clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id:'account',entidad:'Qonto',fecha:'2026-10-10',titular:'Qonto lanza cuenta para autónomos',extracto:'',url:raw.url+'-account',pais:'España',medio:'Editor'}]);
 const briefing=c.briefing_(rows);assert.equal(briefing.items[0].titular,'Qonto launches digital KYB for businesses');assert.ok(rows[0].segmentos.includes('Empresas e instituciones'));const result=c.newsletter_(rows,{},'Novedades',now,'sub');assert.equal(result.count,2);assert.equal(result.total,2);assert.ok(c.newsRelevance_(rows[0])>c.newsRelevance_(rows[1]));assert.equal(result.items[0].titular,rows[0].titular);assert.ok(result.evidence.some(row=>/digital KYB/.test(row.titular)));assert.equal(c.radarMetrics_(rows,{}).summary.news,2);assert.equal(c.newsCsv_(rows,{}).count,2);assert.equal('relevance' in rows[0],false);
});
test('un fallo de transporte aislado no bloquea fuentes sanas y cada reintento sigue acotado',()=>{
 const {c}=server(),calls=[];c.UrlFetchApp={fetchAll:requests=>{calls.push(requests);if(requests.some(row=>row.url.endsWith('/bad')))throw Error('TLS error');return requests.map(()=>({getResponseCode:()=>200}));}};
 const results=c.fetchFeedBatch_(['good','bad','other'].map(name=>({url:'https://news.google.com/rss/'+name,domain:'news.google.com'})));assert.equal(results[0].response.getResponseCode(),200);assert.equal(results[1].error.retryable,true);assert.equal(results[2].response.getResponseCode(),200);assert.equal(calls.length,4);
});
test('medios multientidad atribuyen el titular al sujeto publicado y evitan coincidencias dentro de palabras',()=>{
 const {c}=server(),feed={...c.configuration_().feeds.find(row=>row.entity==='Sector'),kind:'rss',range},sample={...raw,title:'Wise launches digital payments integration with Santander',excerpt:'New cross-border payments for businesses',url:'https://www.finextra.com/newsarticle/sample'};
 assert.equal(c.evaluate_(sample,feed,now).item.entity,'Wise');assert.equal(c.phraseMatch_('annual revenue','nu'),false);assert.equal(c.phrasePosition_('annual update by nu','nu'),17);
});
test('el trabajador reutiliza el índice de noticias entre lotes y no ordena si no hubo altas',()=>{
 const {c,sheets}=server(),feed=c.feeds_().find(row=>row.kind==='rss'),keys=vm.runInContext('RADAR.sheets.Recargas',c),job={id:'annual',tipo:'annual',desde:'2025-10-12',hasta:'2026-10-12',inicio:now.toISOString(),estado:'Pendiente',total:30,pendientes:30};
 sheets.get('Recargas').grid.push(keys.map(key=>job[key]||''));for(let i=0;i<30;i++)sheets.get('Recopilacion').grid.push([job.id,feed.name,feed.url,'Pendiente',0,'',0,0,'',range.to]);
 c.UrlFetchApp={fetchAll:requests=>requests.map(()=>({getResponseCode:()=>200,getContentText:()=>'<rss/>'}))};c.parseFeed_=()=>[];const known=c.knownUrls_;let builds=0,sorts=0;c.knownUrls_=()=>{builds++;return known();};const sheet=sheets.get('Noticias'),getRange=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{const value=getRange(...args);value.sort=()=>{sorts++;};return value;};
 c.processBackground_();assert.equal(builds,1);assert.equal(sorts,0);assert.equal(c.collectionJobs_()[0].estado,'Completada');assert.equal(c.rows_('Ejecuciones').length,3);assert.match(c.rows_('Telemetria').find(row=>row.operacion==='recopilacion').detalle,/recuperadas.*relevantes.*duplicadas.*saturadas/);
});
test('términos extensos válidos mantienen acotado el tamaño de las consultas',()=>{
 const {c}=server(),snapshot=clone(c.getConfiguration());snapshot.config.settings.searchTerms=Array.from({length:80},(_,i)=>String(i)+' '.repeat(1)+'x'.repeat(120));snapshot.config.entities[0].aliases=Array.from({length:80},(_,i)=>'alias '+i+'x'.repeat(90));c.saveConfiguration(snapshot);
 const feed=c.profileFeed_(c.configuration_().geographies[0],c.configuration_().entities[0],range);assert.ok(new URL(feed.url).searchParams.get('q').length<=1500);
});
