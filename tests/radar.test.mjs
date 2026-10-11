import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {readServerScript,renderIncludes,read,files} from '../scripts/source.mjs';
const source=readServerScript();
function context(email='felix.delbarrio@bbva.com'){
  const c=vm.createContext({console}),properties={OWNER_EMAIL:'felix.delbarrio@bbva.com',SPREADSHEET_ID:'book'},cache=new Map();
  c.PropertiesService={getScriptProperties:()=>({getProperty:key=>properties[key]||null,setProperty:(key,value)=>properties[key]=value,deleteProperty:key=>delete properties[key]})};
  c.Session={getActiveUser:()=>({getEmail:()=>email}),getEffectiveUser:()=>({getEmail:()=> 'felix.delbarrio@bbva.com'})};
  c.CacheService={getScriptCache:()=>({get:key=>cache.get(key),put:(key,value)=>cache.set(key,value),remove:key=>cache.delete(key)})};
  c.LockService={getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})};
  c.Utilities={getUuid:()=> 'id',formatDate:date=>date.toISOString().slice(0,10)};
  vm.runInContext(source,c);let config=JSON.parse(read('assets/configuration-defaults.json'));c.configuration_=()=>config;c.configurationRevision_=()=>'test';c.writeConfiguration_=value=>{c.authorize_(true);c.validateConfiguration_(value);config=value;};return c;
}
const feed={name:'BBVA',domain:'bbva.com',entity:'BBVA',country:'Sin determinar',kind:'rss'},now=new Date('2026-10-09T12:00:00Z'),item={title:'BBVA financia a empresas',excerpt:'Operación de financiación corporativa',url:'https://www.bbva.com/es/noticia/?utm_source=rss',date:'2026-10-08T11:00:00Z'};
test('extrae texto sin scripts, estilos ni comentarios y no recompone etiquetas',()=>{
  const c=context();assert.equal(c.plainText_('Antes<!-- <script>oculto</script> --><SCRIPT>x()</SCRIPT><style>css</style><p>Después</p>'),'Antes Después');
  assert.equal(c.plainText_('Visible<script>sin cierre'),'Visible');assert.equal(c.plainText_('<scr<script>ipt>oculto</scr</script>ipt>'),'ipt>oculto ipt>');assert.equal(c.plainText_('A<br>B &amp; &#243;'),'A B & ó');
});
test('clasifica fecha y dominio, rechaza ruido y no genera estados ni puntuaciones',()=>{
  const c=context(),result=c.evaluate_(item,feed,now);assert.equal(result.item.topic,'Financiación');assert.equal(result.item.url,'https://www.bbva.com/es/noticia/');
  for(const change of [{date:''},{url:'https://bbva.com.evil.net/a'},{date:'2026-10-10'},{date:'2026-09-01'}])assert.ok(c.evaluate_({...item,...change},feed,now).reason);
  assert.equal(c.classify_('Cómo ahorrar en vacaciones',''),'');assert.equal(c.classify_('Incidencia en BBVA Net Cash para empresas',''),'Continuidad de servicio');assert.equal(c.classify_('Akbank KOBİ finansman',''),'Financiación');
  assert.equal(result.item.impacto,undefined);assert.equal(result.item.estado,undefined);
});
test('canonicalización y exportación protegen URLs y fórmulas',()=>{
  const c=context();assert.equal(c.canonicalUrl_('https://BBVA.com/a?z=1&utm_source=x&id=2#x'),'https://bbva.com/a?id=2&z=1');assert.equal(c.canonicalUrl_('javascript:alert(1)'),'');assert.equal(c.canonicalUrl_('https://user:pass@bbva.com/a'),'');assert.equal(c.domainMatches_('https://evilbbva.com/a','bbva.com'),false);assert.equal(c.safeCell_('=IMPORTXML("x")'),'\'=IMPORTXML("x")');
  c.rows_=()=>[{...item,fecha:'2026-10-08',titular:'=HYPERLINK("x")',extracto:'texto',entidad:'BBVA',url:item.url}];const csv=c.exportNews({}).csv;assert.match(csv,/'=HYPERLINK/);assert.doesNotMatch(csv,/impacto|evidencia|criterio/);
});
test('autoriza con identidad activa y restringe administración y métricas',()=>{
  for(const email of ['reader@bbva.com','felix.delbarrio@bbva.com'])assert.doesNotThrow(()=>context(email).authorize_());
  for(const email of ['','reader@evilbbva.com','reader@bbva.com.evil'])assert.throws(()=>context(email).authorize_());
  const reader=context('reader@bbva.com');for(const name of ['getAudit','getAdoption','getTelemetry','collectNow','retryCollectionErrors','setupRadar'])assert.throws(()=>reader[name](),/no autorizado/);assert.throws(()=>reader.saveFeeds([]),/no autorizado/);
});
test('dashboard de lector no expone fuentes configurables, hoja ni datos de otros usuarios',()=>{
  const c=context('reader@bbva.com');c.rows_=()=>[];c.book_=()=>{throw Error('No debe leer URL de hoja');};const result=c.getDashboard({});
  for(const key of ['sheetUrl','runs','feeds','configuredFeeds','collection','email'])assert.equal(key in result,false);assert.equal(result.sourceCount,c.feeds_().length);assert.equal(result.admin,false);
});
test('las entidades, alias, países y términos configurados generan fuentes sin consultas redundantes por alias',()=>{
  const c=context(),feeds=c.defaultFeeds_(),config=c.configuration_();assert.equal(new Set(feeds.map(feed=>feed.url)).size,feeds.length);assert.equal(feeds.filter(feed=>feed.kind==='rss').length,2);
  for(const entity of config.entities)for(const country of entity.countries){
    const geo=config.geographies.find(row=>row.name===country),feed=feeds.find(feed=>feed.country===country&&feed.entity===entity.name);assert.ok(feed);
    const query=new URL(feed.url).searchParams.get('q');for(const alias of [entity.name,...entity.aliases])assert.ok(query.includes(alias));for(const term of config.settings.searchTerms)assert.ok(query.includes(term));assert.equal(new URL(feed.url).searchParams.get('gl'),geo.code);
  }
  assert.ok(feeds.some(feed=>feed.entity==='Revolut'));assert.ok(feeds.some(feed=>feed.entity==='Qonto'));
});
test('todas las fuentes RSS son editables y rechazan duplicados o dominios falsos',()=>{
  const c=context(),count=c.feeds_().length;c.saveFeeds([{...feed,url:'https://bbva.com/extra'}]);assert.equal(c.feeds_().length,count-1);c.saveFeeds([]);assert.equal(c.feeds_().length,count-2);
  assert.throws(()=>c.saveFeeds([{...feed,url:'https://evilbbva.com/a'}]));assert.throws(()=>c.saveFeeds([{...feed,url:'https://bbva.com/a'},{...feed,url:'https://bbva.com/a'}]));
});
test('noticias agregadas se integran sin intervención y mantienen medio y enlace de Google News',()=>{
  const c=context(),profile=c.defaultFeeds_().find(feed=>feed.entity==='Santander'&&feed.country==='España');
  const raw={title:'Santander financia empresas - Diario',source:'Diario',excerpt:'Santander financia empresas Diario',date:'2026-10-08',url:'https://news.google.com/rss/articles/123'};
  const result=c.evaluate_(raw,profile,now);assert.equal(result.item.title,'Santander financia empresas');assert.equal(result.item.publisher,'Diario');assert.equal(result.item.excerpt,'');assert.equal(result.item.url,raw.url);
  const record=c.newsRecord_(result.item,profile,now);assert.equal(record.length,11);assert.equal(record[3],'Diario');assert.equal(record[10],profile.name);
});
test('recopila por lotes, integra automáticamente, deduplica y conserva reintentos parciales',()=>{
  const c=context(),saved={},writes=[];let released=false;
  c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released=true})};
  c.rows_=()=>[{ciclo:'cycle',fuente:'BBVA',url:'good',estado:'Pendiente',intentos:'0'},{ciclo:'cycle',fuente:'Error',url:'bad',estado:'Pendiente',intentos:'0'}];
  c.feeds_=()=>[{...feed,url:'good'},{...feed,url:'bad'}];c.knownUrls_=()=>new Set();c.book_=()=>({getSheetByName:()=>({getLastRow:()=>1,getRange:()=>({setNumberFormat(){return this;},setValues:rows=>writes.push(rows)})})});
  c.UrlFetchApp={fetchAll:requests=>requests.map(({url})=>url==='good'?{getResponseCode:()=>200,getContentText:()=>'<rss/>'}:{getResponseCode:()=>503})};
  c.parseFeed_=()=>[{...item,date:new Date(Date.now()-86400000).toISOString()},{...item,date:new Date(Date.now()-86400000).toISOString()}];c.append_=(name,rows)=>saved[name]=rows;c.telemetry_=()=>{};
  const result=c.collectionTick_();assert.equal(result.added,1);assert.equal(result.errors.length,1);assert.equal(saved.Noticias[0].length,11);assert.equal(writes.length,1);assert.equal(writes[0][1][0],'Reintento programado');assert.equal(saved.Ejecuciones[0][3],'Parcial');assert.ok(saved.Auditoria.some(row=>row[4]==='Duplicada'));assert.equal(released,true);
});
test('agotados tres intentos registra error y la recuperación escribe un único lote',()=>{
  const c=context(),tasks=[{ciclo:'cycle',fuente:'Error',url:'bad',estado:'Pendiente',intentos:'2',actualizada:'2026-10-09',evaluadas:'0',nuevas:'0',error:''}];let rows,writes=0;
  c.rows_=()=>tasks;c.feeds_=()=>[{...feed,url:'bad'}];c.knownUrls_=()=>new Set();c.book_=()=>({getSheetByName:()=>({getLastRow:()=>1,getRange:()=>({setNumberFormat(){return this;},setValues:value=>{rows=value;writes++;}})})});c.UrlFetchApp={fetchAll:requests=>requests.map(()=>({getResponseCode:()=>503}))};c.append_=()=>{};c.telemetry_=()=>{};c.collectionTick_();assert.equal(rows[0][0],'Error');
  tasks[0].estado='Error';writes=0;c.ScriptApp={getProjectTriggers:()=>[{getHandlerFunction:()=> 'collectionTick_'}]};assert.match(c.retryCollectionErrors(),/^1 fuentes/);assert.equal(writes,1);assert.equal(rows[0][0],'Pendiente');assert.equal(rows[0][1],0);
});
test('adopción calcula ventanas y sesiones y obtiene el correo exclusivamente del servidor',()=>{
  const c=context(),events=[{fecha:'2026-10-09T10:00:00Z',correo:'a@bbva.com',sesion:'1',evento:'vista',vista:'radar'},{fecha:'2026-10-07T10:00:00Z',correo:'a@bbva.com',sesion:'2',evento:'rendimiento',duracion_ms:'100'},{fecha:'2026-09-15T10:00:00Z',correo:'b@bbva.com',sesion:'3',evento:'error'}],metrics=c.metrics_(events,now.getTime());assert.equal(metrics.dau,1);assert.equal(metrics.wau,1);assert.equal(metrics.mau,2);assert.equal(metrics.returning,1);assert.equal(metrics.sessions,3);assert.equal(metrics.latencyP95,100);
  let saved;c.append_=(name,rows)=>saved=rows;c.trim_=()=>{};c.pruneEvents_=()=>{};c.recordEvents([{session:'test-session-123456',event:'acceso',view:'radar',email:'forged@bbva.com'}]);assert.equal(saved[0][1],'felix.delbarrio@bbva.com');assert.throws(()=>context('reader@bbva.com').recordEvents([{session:'test-session-123456',event:'vista',view:'adoption'}]),/restringida/);
});
test('distribución no contiene flujo manual, estilos obsoletos ni permisos de lectura de correo',()=>{
  const c=context();for(const name of ['verifyNews','score_','getCandidates','startSearch','searchTick_','articleDate_'])assert.equal(typeof c[name],'undefined');
  const html=renderIncludes(read('dist/Index.html'));assert.doesNotMatch(html,/verify-form|verification-form|candidates-body|Verificar|puntuar|puntuación/);assert.ok(files('src/server').every(file=>!file.endsWith('/Search.gs')));
  const manifest=JSON.parse(fs.readFileSync('src/appsscript.json'));assert.equal(manifest.oauthScopes.length,6);assert.ok(!manifest.oauthScopes.some(scope=>/gmail\.(?:readonly|modify|compose)|mail.google.com|drive|admin.directory/.test(scope)));
});

test('filtros combinan entidad normalizada, ámbito y medio sin mezclar otras noticias',()=>{
  const c=context(),rows=[{fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',titular:'Financiación de empresas',extracto:''},{fecha:'2026-10-08',pais:'España',entidad:'Santander Empresas',medio:'El País',titular:'Otra noticia',extracto:''},{fecha:'2026-10-08',pais:'México',entidad:'BBVA Net Cash',medio:'Otro diario',titular:'Otra noticia',extracto:''}];
  const selected=c.selectNews_(rows,{entity:'Santander',country:'México',source:'El País'});assert.equal(selected.length,1);assert.equal(selected[0].medio,'El País');assert.equal(c.entityKey_('BBVA Net Cash'),'BBVA');assert.equal(c.selectNews_(rows,{entity:'BBVA',source:'Otro diario'}).length,1);
});
test('todas las fuentes nacen activas y la configuración desactiva solo las seleccionadas',()=>{
  const c=context(),all=c.configuredFeeds_();assert.equal(all.filter(feed=>feed.enabled).length,all.length);
  c.saveSourceSettings(all.slice(1).map(feed=>feed.id));assert.equal(c.feeds_().length,all.length-1);assert.equal(c.configuredFeeds_()[0].enabled,false);
  c.saveSourceSettings(all.map(feed=>feed.id));assert.equal(c.feeds_().length,all.length);assert.throws(()=>c.saveSourceSettings(['unknown']));assert.throws(()=>context('reader@bbva.com').saveSourceSettings([]),/no autorizado/);
});

test('filtros y CSV coinciden para banco, país, medio, tema y fechas inclusivas',()=>{
  const c=context(),rows=[{fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',titular:'Financiación y tesorería corporativa',extracto:''},
    {fecha:'2026-10-07',pais:'España',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',titular:'España',extracto:''},
    {fecha:'2026-10-09',pais:'México',entidad:'BBVA Business',medio:'El País',tema:'Financiación',titular:'BBVA',extracto:''}];
  const query={entity:'Santander',country:'México',source:'El País',topic:'Financiación',from:'2026-10-08',to:'2026-10-08',search:'  tesoreria  '};
  const result=c.newsDashboard_(rows,query,c.defaultFeeds_()),csv=c.newsCsv_(rows,query);assert.equal(result.total,1);assert.equal(csv.count,1);assert.match(csv.csv,/tesorería corporativa/);assert.doesNotMatch(csv.csv,/"España"/);
  assert.throws(()=>c.selectNews_(rows,{from:'2026-10-09',to:'2026-10-01'}),/fecha desde/);
});
test('opciones incluyen el perfil sin noticias y la paginación se ajusta al resultado',()=>{
  const c=context(),empty=c.newsDashboard_([],{page:99},c.defaultFeeds_());assert.equal(empty.page,0);assert.ok(empty.entities.includes('Santander'));assert.ok(empty.countries.includes('México'));
  const row={fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',titular:'Santander',extracto:''};
  const result=c.newsDashboard_(Array.from({length:31},()=>row),{page:99},[]);assert.equal(result.page,1);assert.equal(result.items.length,1);
});

test('entrada web evalúa la plantilla y limita los fragmentos internos',()=>{
  const c=context();let evaluated=false;
  const output={setTitle(){return this;},addMetaTag(){return this;}};
  c.HtmlService={createTemplateFromFile:name=>{assert.equal(name,'Index');return {evaluate(){evaluated=true;return output;}};},createHtmlOutputFromFile:name=>({getContent:()=>read('dist/'+name+'.html')})};
  assert.equal(c.doGet(),output);assert.equal(evaluated,true);assert.match(c.include_('Tokens'),/:root/);assert.throws(()=>c.include_('Config'),/desconocido/);
  assert.equal(fs.existsSync('dist/Core.gs'),false);assert.equal(fs.existsSync('src/Client.html'),false);
  const html=renderIncludes(read('dist/Index.html'));assert.doesNotMatch(html,/<\?!=|\{\{/);assert.match(html,/<script id="radar-client">/);
});


test('el cuadro de mando agrega toda la selección, incluye días sin noticias y no geolocaliza lo desconocido',()=>{
  const c=context(),rows=Array.from({length:61},(_,i)=>({fecha:i<30?'2026-10-01':'2026-10-03',pais:i<40?'México':'Sin determinar',entidad:i<50?'BBVA Business':'Santander Empresas',medio:'El País',titular:'Empresas',extracto:'',tema:'Empresas y pymes'}));
  const result=c.newsDashboard_(rows,{page:1},[]);assert.equal(result.items.length,30);assert.equal(result.stats.news,61);assert.equal(result.stats.entities,2);assert.equal(result.radar.unlocated,21);assert.equal(result.radar.geographies[0].total,40);
  assert.equal(result.radar.trend.buckets.length,3);assert.ok(result.radar.trend.series.every(row=>row.values[1]===0));assert.equal(result.radar.trend.series.flatMap(row=>row.values).reduce((a,b)=>a+b,0),61);
  const selected=c.newsDashboard_(rows,{entity:'Santander',country:'México'},[]);assert.equal(selected.total,0);assert.equal(selected.radar.trend.buckets.length,0);assert.equal(selected.radar.trend.intervalDays,1);
});
test('la evolución mantiene todas las publicaciones agrupando entidades y limita el número de puntos',()=>{
  const c=context(),rows=Array.from({length:10},(_,i)=>({fecha:'2026-10-01',pais:'España',entidad:'Entidad '+i,medio:'Diario'})),result=c.radarMetrics_(rows,{from:'2020-01-01',to:'2026-10-09'});
  assert.ok(result.trend.buckets.length<=60);assert.equal(result.trend.series.length,6);assert.equal(result.trend.series.at(-1).entity,'Otras entidades');assert.equal(result.trend.series.flatMap(row=>row.values).reduce((a,b)=>a+b,0),10);
});

test('recuperación manual predetermina Hoy, respeta la zona y consulta el año por intervalos semanales',()=>{
 const c=context(),today=c.collectionRange_('today',new Date('2026-10-09T22:30:00Z'));assert.equal(today.from,'2026-10-10');assert.equal(today.to,'2026-10-10');
 const year=c.collectionRange_('year',now),windows=c.collectionWindows_(year);assert.equal(year.from,'2025-10-09');assert.equal(year.to,'2026-10-09');assert.equal(windows.length,53);assert.equal(windows[0].from,year.from);assert.equal(windows.at(-1).to,year.to);
 for(let i=1;i<windows.length;i++)assert.equal(Date.parse(windows[i].from)-Date.parse(windows[i-1].to),86400000);
 const feeds=c.collectionFeeds_(year);assert.equal(new Set(feeds.map(f=>f.url)).size,feeds.length);assert.equal(feeds.filter(f=>f.kind==='rss').length,2);
 const historic=feeds.find(f=>f.kind==='profile'&&f.range.from===year.from),query=new URL(historic.url).searchParams.get('q');assert.match(query,/after:2025-10-08 before:2025-10-16/);assert.doesNotMatch(query,/when:/);
 const old={...item,date:'2025-10-12'};assert.ok(c.evaluate_(old,{...feed,range:year},now).item);assert.match(c.evaluate_(old,{...feed,range:today},now).reason,/período/);
 const leap=c.collectionRange_('year',new Date('2024-02-29T12:00:00Z'));assert.equal(leap.from,'2023-02-28');
 let range;c.startCollection_=value=>range=value;c.collectionTick_=()=>({added:0});c.collectNow();assert.equal(range.from,range.to);assert.throws(()=>c.collectNow('invalid'),/Selecciona/);assert.throws(()=>context('reader@bbva.com').collectNow('year'),/no autorizado/);
});

test('la recuperación escribe solo los estados cambiados sin reescribir toda la cola anual',()=>{
 const c=context(),writes=[];c.book_=()=>({getSheetByName:()=>({getRange:(row,column,size)=>({setNumberFormat(){return this;},setValues:values=>writes.push({row,size,values})})})});
 const updates=Array.from({length:600},()=>['Pendiente',0,'',0,0,'']);updates[0]=['Completada',1,'',0,0,''];updates[1]=['Completada',1,'',0,0,''];updates[10]=['Error',1,'',0,0,''];c.writeCollectionTasks_([{row:2},{row:3},{row:12}],updates);assert.equal(writes.length,2);assert.equal(writes.reduce((n,w)=>n+w.size,0),3);assert.equal(writes[1].row,12);
});

test('Radar descarta filtros ocultos y usa Empresas e instituciones por defecto',()=>{
  const c=context(),now=new Date('2026-10-10T12:00:00Z');
  const initial=c.dashboardQuery_({view:'radar',initial:true,country:'México',topic:'Financiación',segment:'Retail',from:'2026-01-01'},now);
  assert.deepEqual(JSON.parse(JSON.stringify(initial)),{entity:'',segment:'Empresas e instituciones'});
  const selected=c.dashboardQuery_({view:'radar',entity:'BBVA',segment:'Retail',country:'México',source:'Editor',search:'cuenta'},now);
  assert.deepEqual(JSON.parse(JSON.stringify(selected)),{entity:'BBVA',segment:'Retail'});
});
test('Novedades impone el mes en curso y Noticias lo utiliza solo al abrir por primera vez',()=>{
  const c=context(),now=new Date('2026-10-31T23:30:00Z');
  const novelty=c.dashboardQuery_({view:'briefing',entity:'BBVA',from:'2026-01-01',to:'2026-01-31'},now);
  assert.equal(novelty.from,'2026-11-01');assert.equal(novelty.to,'2026-11-30');assert.equal(novelty.entity,'BBVA');
  const news=c.dashboardQuery_({view:'news',initial:true},now);
  assert.equal(news.from,'2026-11-01');assert.equal(news.to,'2026-11-30');
  const edited=c.dashboardQuery_({view:'news',from:'2026-02-01',to:'2026-02-28'},now);
  assert.equal(edited.from,'2026-02-01');assert.equal(edited.to,'2026-02-28');
  assert.equal(c.currentMonth_(new Date('2024-02-15T12:00:00Z')).to,'2024-02-29');
  assert.equal(c.currentMonth_(new Date('2026-12-31T23:30:00Z')).to,'2027-01-31');
});

test('consultas saturadas se dividen sin huecos y las tareas derivadas mantienen fuente y fechas',()=>{
 const c=context(),range={from:'2025-10-09',to:'2025-10-15'},feed={...c.defaultFeeds_(range).find(row=>row.kind==='profile'),range};
 const children=c.splitCollectionFeed_(feed);assert.equal(children.length,2);assert.equal(children[0].range.from,range.from);assert.equal(children[1].range.to,range.to);assert.equal(Date.parse(children[1].range.from)-Date.parse(children[0].range.to),86400000);
 for(const child of children){const restored=c.collectionTaskFeed_({fuente:child.name,url:child.url},c.collectionFeedIndex_());assert.equal(restored.url,child.url);assert.equal(restored.range.from,child.range.from);}
 assert.equal(c.splitCollectionFeed_({...feed,range:{from:range.from,to:range.from}}).length,0);
 assert.equal(c.collectionTaskFeed_({fuente:feed.name,url:'https://evil.example/rss'},new Map()),null);
});

test('el extracto agregado se clasifica antes de ocultar el titular repetido',()=>{
 const c=context(),profile=c.defaultFeeds_().find(row=>row.kind==='profile');
 const result=c.evaluate_({title:'Resultados de BBVA - Diario',source:'Diario',excerpt:'Resultados de BBVA: financiación para empresas',url:'https://news.google.com/rss/articles/test',date:now.toISOString()},profile,now);
 assert.ok(result.item);assert.equal(result.item.excerpt,'');assert.equal(result.item.topic,'Financiación');
});

test('exportación de telemetría incluye exclusiones, límites y cola; exige administración',()=>{
 const c=context();c.rows_=name=>name==='Auditoria'?[{resultado:'Excluida',motivo:'Sin coincidencia'}]:[];
 const report=c.exportTelemetry();assert.equal(report.schemaVersion,1);assert.equal(report.exclusionReasons['Sin coincidencia'],1);assert.equal(report.collection.tasks.length,0);assert.equal(report.limits.newsReadLimit,10000);
 assert.throws(()=>context('reader@bbva.com').exportTelemetry(),/no autorizado/);
});

test('el lote saturado persiste consultas hijas y evita finalizar una cola con trabajo nuevo',()=>{
 const c=context(),range={from:'2025-10-09',to:'2025-10-15'},feed={...c.defaultFeeds_(range).find(row=>row.kind==='profile'),range},saved={};let sorted=false;
 c.rows_=()=>[{ciclo:'cycle',fuente:feed.name,url:feed.url,estado:'Pendiente',intentos:0}];c.collectionFeeds_=()=>{throw Error('No reconstruir la cola anual en cada lote');};c.knownUrls_=()=>new Set();
 c.UrlFetchApp={fetchAll:requests=>requests.map(()=>({getResponseCode:()=>200}))};c.ingestFeed_=()=>({news:[],audit:[],evaluated:100,saturated:true});c.append_=(name,rows)=>saved[name]=rows;c.telemetry_=()=>{};
 c.book_=()=>({getSheetByName:()=>({getLastRow:()=>3,getRange:()=>({setNumberFormat(){return this;},setValues(){},sort(){sorted=true;}})})});
 c.collectionTick_();assert.equal(saved.Recopilacion.length,2);assert.ok(saved.Recopilacion.every(row=>row[3]==='Pendiente'));assert.equal(sorted,false);assert.ok(saved.Auditoria.some(row=>row[4]==='Cobertura parcial'));
});

test('la caché de dashboard evita leer y clasificar Noticias otra vez y se invalida con datos o configuración',()=>{
 const c=context(),rows=[{fecha:'2026-10-08',pais:'España',entidad:'BBVA',medio:'Diario',titular:'Financiación para empresas',extracto:'',url:'https://bbva.com/a'}];let reads=0,revision='first';
 c.configurationRevision_=()=>revision;c.rows_=()=>{reads++;return rows;};
 const query={entity:'BBVA'},first=c.dashboardContent_(query,c.feeds_());assert.equal(first.cacheHit,false);assert.equal(first.data.total,1);
 assert.equal(c.dashboardContent_(query,c.feeds_()).cacheHit,true);assert.equal(reads,1);
 rows.push({...rows[0],url:'https://bbva.com/b'});c.invalidateNews_();const changed=c.dashboardContent_(query,c.feeds_());assert.equal(changed.cacheHit,false);assert.equal(changed.data.total,2);assert.equal(reads,2);
 revision='second';assert.equal(c.dashboardContent_(query,c.feeds_()).cacheHit,false);assert.equal(reads,3);
 assert.equal(c.dashboardContent_({country:'México'},c.feeds_()).data.total,0);
});

test('la caché respeta el límite en bytes UTF-8 y nunca recorta el resultado',()=>{
 const c=context();let reads=0;c.rows_=()=>{reads++;return [];};c.newsDashboard_=()=>({items:['€'.repeat(31000)]});
 assert.equal(c.dashboardContent_({},[]).data.items[0].length,31000);assert.equal(c.dashboardContent_({},[]).cacheHit,false);assert.equal(reads,2);
});

test('el estado de una cola grande lee solo estado y contadores una vez',()=>{
 const c=context();let reads=0;c.rows_=()=>{throw Error('No cargar URLs de la cola');};c.book_=()=>({getSheetByName:()=>({getLastRow:()=>2555,getRange:(row,column,height,width)=>{assert.deepEqual([row,column,height,width],[2,4,2554,5]);return {getDisplayValues:()=>{reads++;return Array.from({length:2554},(_,i)=>[i<9?'Completada':'Pendiente',0,'',0,i<9?1:0]);}};}})});
 const status=c.collectionStatus_();assert.equal(status.total,2554);assert.equal(status.pending,2545);assert.equal(status.added,9);assert.equal(reads,1);c.collectionStatus_();assert.equal(reads,1);
});

test('el lote consulta todas las fuentes juntas y sigue el 302 de Google sin repetir las otras',()=>{
 const c=context(),calls=[],response=(code,text,headers={})=>({getResponseCode:()=>code,getContentText:()=>text,getAllHeaders:()=>headers});
 c.UrlFetchApp={fetchAll(requests){calls.push(requests);return requests.map(({url})=>url.endsWith('/one')?response(200,'one'):url.endsWith('/two')?response(302,'',{Location:'https://news.google.com/rss/redirected'}):url.endsWith('/three')?response(503,'error'):response(200,'redirected'));}};
 const feeds=['one','two','three'].map(name=>({url:'https://news.google.com/rss/'+name,domain:'news.google.com'})),results=c.fetchFeedBatch_(feeds);
 assert.equal(calls.length,2);assert.equal(calls[0].length,3);assert.equal(calls[1].length,1);assert.equal(results[0].response.getContentText(),'one');assert.equal(results[1].response.getContentText(),'redirected');assert.equal(results[2].response.getResponseCode(),503);
 assert.ok(calls.flat().every(request=>request.followRedirects===false&&request.muteHttpExceptions));
});

test('las redirecciones externas, inseguras y los bucles se bloquean sin acceder al destino',()=>{
 for(const location of ['https://evil.example/rss','http://news.google.com/rss','https://news.google.com/rss/loop']){
  const c=context();let calls=0;c.UrlFetchApp={fetchAll:requests=>{calls++;return requests.map(()=>({getResponseCode:()=>302,getAllHeaders:()=>({location})}));}};
  const results=c.fetchFeedBatch_([{url:'https://news.google.com/rss/original',domain:'news.google.com'}]);assert.match(results[0].error.message,/redirección/);assert.equal(calls,location.endsWith('loop')?4:1);
 }
});

test('los fallos de transporte del lote conservan un error reintentable',()=>{
 const c=context();c.UrlFetchApp={fetchAll:()=>{throw Error('Network timeout');}};const results=c.fetchFeedBatch_([{url:'https://news.google.com/rss/one',domain:'news.google.com'}]);assert.equal(results[0].error.retryable,true);
});

test('descarte repetido conserva ejemplos acotados y totales completos en el JSON',()=>{
 const c=context();c.parseFeed_=()=>Array.from({length:100},(_,i)=>({...item,url:'https://bbva.com/'+i,date:'2025-01-01'}));const result=c.ingestFeed_(feed,new Set(),'cycle',now,{getResponseCode:()=>200,getContentText:()=>'<rss/>'});
 assert.equal(result.evaluated,100);assert.equal(result.audit.length,4);assert.equal(result.news.length,0);
 const audit=result.audit.map(values=>Object.fromEntries(['ejecucion','fecha','fuente','url','resultado','motivo'].map((key,i)=>[key,values[i]]))),reasons=c.exclusionReasons_(audit);assert.equal(reasons['Fuera de la ventana de 10 días'],100);
});

test('filtrado previo clasifica solo las filas del ámbito elegido sin alterar el resultado',()=>{
 const c=context(),rows=[{fecha:'2026-10-08',pais:'España',entidad:'BBVA',medio:'Diario',titular:'Financiación para empresas',extracto:''},{fecha:'2026-10-08',pais:'México',entidad:'BBVA',medio:'Diario',titular:'Financiación para empresas',extracto:''}];
 const annotate=c.annotateNews_;let classified;c.annotateNews_=items=>{classified=items.length;return annotate(items);};const query={entity:'BBVA',country:'España',from:'2026-10-01',topic:'Financiación'};
 const result=c.selectNews_(rows,query);assert.equal(classified,1);assert.deepEqual(JSON.parse(JSON.stringify(result)),JSON.parse(JSON.stringify(c.selectAnnotatedNews_(annotate(rows),query))));
});

test('la selección habitual de Noticias usa caché aunque el formulario envíe todos los campos vacíos',()=>{
 const c=context();let reads=0;c.configurationRevision_=()=> '1760175510000-configuration-version';c.properties_().setProperty('NEWS_REVISION','1760175510000-news-version');c.rows_=()=>{reads++;return [];};
 const query={entity:'BBVA',segment:'Empresas e instituciones',from:'2026-10-01',to:'2026-10-31',source:'',type:'',country:'',signal:'',search:'',topic:'',page:0};
 assert.equal(c.dashboardContent_(query,c.feeds_()).cacheHit,false);assert.equal(c.dashboardContent_(query,c.feeds_()).cacheHit,true);assert.equal(reads,1);
});

test('los tiempos de dashboard se guardan con los eventos sin otro RPC ni nuevas columnas',()=>{
 const c=context(),saved={};c.pruneEvents_=()=>{};c.trim_=()=>{};c.append_=(name,rows)=>saved[name]=rows;
 c.recordEvents([{session:'test-session-123456',event:'rendimiento',view:'radar',duration:1800,performance:{serverMs:300,newsMs:50,rpcMs:1700,renderMs:100,cacheHit:true}}]);
 assert.equal(saved.Telemetria[0].length,5);assert.equal(saved.Telemetria[0][1],'dashboard');assert.equal(saved.Telemetria[0][2],1800);assert.match(saved.Telemetria[0][4],/RPC 1700 ms; servidor 300 ms; noticias 50 ms; render 100 ms; caché hit/);assert.equal(saved.Adopcion.length,1);
});
