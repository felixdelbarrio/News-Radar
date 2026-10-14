import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const article={id:'news',fecha:'2026-10-11',titular:'BBVA lanza cuenta',extracto:'Para empresas',fuente:'Otro editor',idioma:'es',capturada:'2026-10-11T00:00:00Z'};
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);for(const row of rows)s.sheets.get('Noticias').grid.push(keys.map(key=>row[key]||''));}
function provider(c,log=[]){c.LanguageApp={translate(input,source,language,options){log.push({input,language});assert.equal(source,'');assert.equal(options.contentType,'html');return input.replace('BBVA lanza cuenta',language+' translated headline');}};return log;}
test('solo las traducciones guardadas se sirven a las tarjetas y conservan los originales',()=>{
 const s=server(),c=s.c,log=provider(c);const pending=c.savedArticleTranslations_([article],'tr')[0];assert.equal(pending.translation.state,'pending');assert.equal(log.length,0);
 c.storeArticleTranslation_(article,'tr');assert.equal(log.length,1);assert.equal(c.rows_('Traducciones').length,1);const translated=c.savedArticleTranslations_([article],'tr')[0];assert.equal(translated.titular,'tr translated headline');assert.equal(translated.original.titular,article.titular);
 vm.runInContext('articleTranslationMemory_=undefined;articleTranslationRows_=undefined;',c);s.cache.clear();assert.equal(c.savedArticleTranslations_([article],'tr')[0].translation.state,'translated');assert.equal(log.length,1);
 assert.equal(c.savedArticleTranslations_([{...article,titular:'Contenido actualizado'}],'tr')[0].translation.state,'pending');assert.equal(c.savedArticleTranslations_([article],'en')[0].translation.state,'pending');
});
test('el job nocturno traduce tres idiomas de más reciente a más antiguo, reutiliza guardadas y se completa',()=>{
 const s=server(),c=s.c;add(s,[{...article,id:'old',fecha:'2026-09-01',titular:'Older headline'},{...article,id:'new'}]);const log=provider(c);c.storeArticleTranslation_(article,'tr');log.length=0;
 c.nightlyTranslations_();assert.equal(log.length,5);assert.match(log[0].input,/BBVA lanza cuenta/);assert.match(log.at(-1).input,/Older headline/);assert.equal(c.translationJob_().state,'Completada');assert.equal(c.translationJob_().processed,2);assert.equal(c.translationJob_().translated,5);assert.equal(c.rows_('Traducciones').length,6);
 c.cachedArticleTranslations_=()=>{throw Error('El barrido consulta solo las claves de variantes guardadas');};c.nightlyTranslations_();assert.equal(log.length,5);assert.equal(c.translationJob_().calls,5);assert.ok(!c.ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='backgroundTick_'));
});
test('el lote guarda su cursor y continúa sin repetir llamadas ni superar veinte traducciones nuevas',()=>{
 const s=server(),c=s.c;add(s,Array.from({length:10},(_,i)=>({...article,id:String(i),titular:'Headline '+i})));const log=provider(c);c.nightlyTranslations_();assert.equal(log.length,20);assert.equal(c.translationJob_().processed,6);assert.equal(c.translationJob_().state,'Pendiente');assert.ok(c.ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='backgroundTick_'));
 vm.runInContext('articleTranslationMemory_=undefined;articleTranslationRows_=undefined;',c);c.backgroundTick_();assert.equal(log.length,30);assert.equal(c.translationJob_().state,'Completada');assert.equal(c.rows_('Traducciones').length,30);
});
test('la solicitud persiste durante una anual ocupada y no altera la cola ni los activadores de recopilación',()=>{
 const s=server(),c=s.c;add(s,[article]);provider(c);const lock=c.LockService;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.nightlyTranslations_();assert.ok(s.properties.TRANSLATION_REQUEST);assert.equal(c.translationJob_(),null);assert.equal(c.rows_('Traducciones').length,0);
 c.LockService=lock;c.backgroundTick_();assert.equal(s.properties.TRANSLATION_REQUEST,undefined);assert.equal(c.translationJob_().state,'Completada');assert.equal(c.rows_('Recopilacion').length,0);
});
test('un fallo del traductor pausa y conserva las traducciones ya escritas para el reintento',()=>{
 const s=server(),c=s.c;add(s,[article]);let calls=0;c.LanguageApp={translate:input=>{if(++calls===2)throw Error('Quota exhausted');return input;}};c.nightlyTranslations_();const job=c.translationJob_();assert.equal(job.state,'En pausa');assert.equal(job.processed,0);assert.equal(job.translated,1);assert.equal(job.errors,1);assert.equal(c.rows_('Traducciones').length,1);
 c.backgroundTick_();assert.equal(calls,2);job.pausedUntil=0;c.writeTranslationJob_(job);const log=provider(c);c.backgroundTick_();assert.equal(log.length,2);assert.equal(c.translationJob_().state,'Completada');
});
test('el límite diario conserva el cursor y el día siguiente prioriza nuevas publicaciones',()=>{
 const s=server(),c=s.c;add(s,[article]);provider(c);c.nightlyTranslations_();const job=c.translationJob_();job.state='Pendiente';job.calls=3000;job.processed=0;job.cursor=null;c.writeTranslationJob_(job);c.translationBatch_();c.backgroundTick_();assert.equal(c.translationJob_().state,'En pausa');assert.match(c.translationJob_().error,/Límite diario/);assert.ok(c.scheduledTriggers_('backgroundTick_')[0].delay>=86400000-1000);
 job.callDay='2026-01-01';job.started='2026-01-01T02:00:00Z';job.cursor={fecha:article.fecha,id:article.id};c.writeTranslationJob_(job);add(s,[{...article,id:'latest',titular:'Newest headline',fecha:'2026-10-12'}]);const log=provider(c);c.nightlyTranslations_();assert.match(log[0].input,/Newest headline/);assert.equal(c.translationJob_().calls,3);
});
test('la programación es idempotente, se instala a las dos y solo el administrador puede controlarla',()=>{
 const s=server(),c=s.c;assert.equal(c.getTranslationStatus().scheduled,true);c.initializeConfiguration();assert.equal(c.ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='nightlyTranslations_').length,1);
 c.disableTranslationSchedule();assert.equal(c.getTranslationStatus().scheduled,false);c.initializeConfiguration();assert.equal(c.getTranslationStatus().scheduled,false);c.installTranslationSchedule();assert.equal(c.getTranslationStatus().scheduled,true);assert.equal(c.getTranslationStatus().hour,2);
 c.startTranslations();assert.equal(c.getTranslationStatus().queued,true);s.setEmail('reader@bbva.com');for(const fn of [c.getTranslationStatus,c.startTranslations,c.installTranslationSchedule,c.disableTranslationSchedule])assert.throws(fn,/no autorizado/);
});
test('un RSS con idioma explícito evita traducir ese idioma y una respuesta incompleta no se guarda',()=>{
 const s=server(),c=s.c;add(s,[{...article,fuente:c.configuration_().feeds[0].name}]);const log=provider(c);c.nightlyTranslations_();assert.equal(log.length,2);assert.equal(c.savedArticleTranslations_([{...article,fuente:c.configuration_().feeds[0].name}],'es')[0].translation.state,'native');
 c.LanguageApp={translate:()=>'<p>Un único bloque</p>'};assert.throws(()=>c.storeArticleTranslation_({...article,titular:'Otro titular'},'tr'),/incompleta/);assert.equal(c.rows_('Traducciones').length,2);
});
test('seleccionar noticias para traducción lee IDs y solo los textos solicitados',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),sheet=s.sheets.get('Noticias');for(let i=0;i<2000;i++)sheet.grid.push(keys.map(key=>key==='id'?String(i):key==='titular'?'Título '+i:key==='extracto'?'Texto extenso'.repeat(100):''));
 const reads=[],get=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{reads.push(args);return get(...args);};const selected=c.rowsById_('Noticias',new Set(['2','3','1500']),2000);assert.equal(selected.length,3);assert.deepEqual(reads,[[2,1,2000,1],[4,1,2,13],[1502,1,1,13]]);assert.equal(c.rowsById_('Noticias',new Set(),2000).length,0);
});
test('el dashboard usa variantes guardadas sin traductor y conserva la clasificación y filtros originales',()=>{
 const s=server(),c=s.c;add(s,[{...article,entidad:'BBVA'}]);assert.equal(c.getDashboard({view:'news',entity:'BBVA',segment:'Empresas e instituciones',language:'tr'}).items[0].translation.state,'pending');provider(c);c.storeArticleTranslation_(article,'tr');c.LanguageApp={translate:()=>{throw Error('No se traduce al abrir una pantalla');}};
 const data=c.getDashboard({view:'news',entity:'BBVA',segment:'Empresas e instituciones',language:'tr'});assert.equal(data.total,1);assert.equal(data.items[0].titular,'tr translated headline');assert.equal(data.items[0].segmentos[0],'Empresas e instituciones');assert.equal(data.items[0].original.titular,article.titular);
 const english=c.getDashboard({view:'news',entity:'BBVA',segment:'Empresas e instituciones',language:'en'});assert.equal(english.items[0].translation.state,'pending');assert.equal(english.items[0].titular,article.titular);
});
test('el tiempo de lote limita llamadas lentas y conserva la noticia parcialmente traducida para continuar',()=>{
 const s=server(),c=s.c;add(s,[article]);let clock=Date.now(),calls=0;c.Date=class extends Date{constructor(value=clock){super(value);}static now(){return clock;}};
 c.LanguageApp={translate:html=>{calls++;clock+=50000;return html;}};c.nightlyTranslations_();assert.equal(calls,1);assert.equal(c.translationJob_().processed,0);assert.equal(c.translationJob_().state,'Pendiente');c.backgroundTick_();assert.equal(calls,2);c.backgroundTick_();assert.equal(calls,3);assert.equal(c.translationJob_().state,'Completada');
});
test('guardar traducciones invalida las tarjetas pero conserva la caché de gráficos del Radar',()=>{
 const s=server(),c=s.c;add(s,[{...article,entidad:'BBVA'}]);const query={entity:'BBVA',segment:'Empresas e instituciones'},feeds=c.feeds_();assert.equal(c.dashboardContent_(query,feeds,'radar','es').cacheHit,false);provider(c);c.storeArticleTranslation_(article,'tr');assert.equal(c.dashboardContent_(query,feeds,'radar','tr').cacheHit,true);
});
test('una solicitud diaria llegada durante una traducción cede el siguiente turno sin perder variantes ni cursor',()=>{
 const s=server(),c=s.c;add(s,[article]);let calls=0;c.LanguageApp={translate:html=>{calls++;c.requestDailyCollection_();return html;}};
 c.nightlyTranslations_();assert.equal(calls,1);assert.equal(c.translationJob_().processed,0);assert.equal(c.translationJob_().state,'Pendiente');assert.equal(c.rows_('Traducciones').length,1);assert.equal(c.collectionRequests_()[0].kind,'daily');
 c.collectionFeeds_=()=>[];const log=provider(c);c.backgroundTick_();assert.equal(log.length,2);assert.equal(c.translationJob_().state,'Completada');assert.equal(c.collectionJobs_()[0].tipo,'daily');
});
test('las traducciones de una página se consultan por lote y las pendientes se reutilizan sin RPC individuales',()=>{
 const s=server(),c=s.c,cache=c.CacheService.getScriptCache(),reads=[];let gets=0,puts=0;
 c.CacheService.getScriptCache=()=>({...cache,getAll(keys){gets++;return cache.getAll(keys);},putAll(values,seconds){puts++;cache.putAll(values,seconds);},get(key){if(key.startsWith('article:'))throw Error('No debe consultar una traducción por RPC individual');return cache.get(key);}});
 const rows=Array.from({length:30},(_,i)=>({...article,id:String(i),titular:'Headline '+i}));
 assert.ok(c.savedArticleTranslations_(rows,'en').every(row=>row.translation.state==='pending'));assert.equal(gets,1);c.savedArticleTranslations_(rows,'en');assert.equal(gets,1);
 const keys=rows.slice(0,3).map(row=>c.articleTranslationKey_(row,'en'));s.sheets.get('Traducciones').grid.push(...keys.map((key,i)=>[key,'en','Translated '+i,'Summary','2026-10-11']));
 vm.runInContext('articleTranslationMemory_=undefined;articleTranslationRows_=undefined;',c);const sheet=s.sheets.get('Traducciones'),range=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{reads.push(args);return range(...args);};
 const translated=c.savedArticleTranslations_(rows,'en');assert.equal(translated.filter(row=>row.translation.state==='translated').length,3);assert.deepEqual(reads,[[2,1,3,1],[2,3,3,2]]);assert.equal(puts,1);
 vm.runInContext('articleTranslationMemory_=undefined;articleTranslationRows_=undefined;',c);reads.length=0;c.savedArticleTranslations_(rows.slice(0,3),'en');assert.equal(reads.length,0);assert.equal(gets,3);
});
test('la limpieza de variantes invalida posiciones de filas antes de otro lote del mismo turno',()=>{
 const s=server(),c=s.c,rows=Array.from({length:3},(_,i)=>({...article,titular:'Headline '+i}));
 s.sheets.get('Traducciones').grid.push(...rows.map((row,i)=>[c.articleTranslationKey_(row,'en'),'en','Translated '+i,'Summary','2026-10-11']));
 c.articleTranslationIndex_();c.trim_('Traducciones',2);s.cache.clear();vm.runInContext('articleTranslationMemory_=undefined;',c);
 const result=c.savedArticleTranslations_(rows,'en');assert.equal(result[0].translation.state,'pending');assert.equal(result[1].titular,'Translated 1');assert.equal(result[2].titular,'Translated 2');
});

test('una pausa de configuración entre idiomas conserva la traducción y no repite la llamada al reanudar',()=>{
 const s=server(),c=s.c;add(s,[article]);const log=[];
 c.LanguageApp={translate:input=>{log.push(input);s.properties['WORK_INTENT:test']=String(Date.now()+600000);return input;}};
 c.nightlyTranslations_();assert.equal(log.length,1);assert.equal(c.rows_('Traducciones').length,1);assert.equal(c.translationJob_().processed,0);assert.equal(c.translationJob_().state,'Pendiente');
 delete s.properties['WORK_INTENT:test'];const remaining=provider(c);c.workWake_();c.backgroundTick_();
 assert.equal(remaining.length,2);assert.equal(c.rows_('Traducciones').length,3);assert.equal(c.translationJob_().state,'Completada');
});
