import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
const article={id:'news',titular:'BBVA lanza cuenta',extracto:'Para empresas',fuente:'Otro editor',idioma:'es'};
test('traduce titular y extracto con una llamada, conserva originales y reutiliza caché y persistencia',()=>{
 const s=server(),c=s.c;let calls=0;c.LanguageApp={translate(input,source,target,options){calls++;assert.equal(source,'');assert.equal(target,'tr');assert.equal(options.contentType,'html');assert.match(input,/id="headline"/);return '<p id="headline">BBVA yeni hesap sunuyor</p><p id="excerpt">İşletmeler için</p>';}};
 const first=c.articleTranslations_([article],'tr')[0];assert.equal(first.titular,'BBVA yeni hesap sunuyor');assert.equal(first.original.titular,article.titular);assert.equal(first.translation.state,'translated');assert.equal(c.rows_('Traducciones').length,1);
 c.articleTranslations_([article],'tr');assert.equal(calls,1);vm.runInContext('articleTranslationMemory_=undefined;articleTranslationRows_=undefined;',c);s.cache.clear();assert.equal(c.articleTranslations_([article],'tr')[0].extracto,'İşletmeler için');assert.equal(calls,1);
 c.articleTranslations_([{...article,titular:'Contenido actualizado'}],'tr');assert.equal(calls,2);
});
test('limita traducciones nuevas, sirve aciertos sin consumir cupo y separa idiomas',()=>{
 const s=server(),c=s.c;let calls=0;c.LanguageApp={translate:(html,_source,language)=>{calls++;return html.replace('BBVA lanza cuenta',language==='en'?'BBVA launches an account':'BBVA hesap sunuyor');}};
 const rows=Array.from({length:8},(_,i)=>({...article,id:String(i),extracto:'Texto '+i}));
 const first=c.articleTranslations_(rows,'en');assert.equal(calls,5);assert.equal(first.filter(row=>row.translation.state==='pending').length,3);
 c.articleTranslations_(rows,'en');assert.equal(calls,8);assert.equal(c.articleTranslations_([article],'tr')[0].translation.language,'tr');assert.equal(calls,9);
});
test('los fallos del proveedor conservan el original, limitan reintentos y no bloquean el listado',()=>{
 const s=server(),c=s.c;let calls=0;c.LanguageApp={translate:()=>{calls++;throw Error('Quota exhausted');}};
 const rows=c.articleTranslations_([article,{...article,id:'other',titular:'Otra noticia'}],'en');assert.equal(calls,1);assert.ok(rows.every(row=>row.translation.state==='unavailable'));assert.equal(rows[0].titular,article.titular);assert.equal(c.rows_('Traducciones').length,0);
 c.articleTranslations_([article],'tr');assert.equal(calls,1);
});
test('no traduce textos ya en el idioma pedido de un RSS propio y valida respuestas incompletas',()=>{
 const s=server(),c=s.c;c.LanguageApp={translate:()=>'<p>Un único bloque</p>'};const native={...article,fuente:c.configuration_().feeds[0].name};assert.equal(c.articleTranslations_([native],'es')[0].translation.state,'native');
 const missing=c.articleTranslations_([article],'en')[0];assert.equal(missing.translation.state,'unavailable');assert.throws(()=>c.articleTranslations_([article],'fr'),/Idioma/);
});
test('la API solo traduce noticias guardadas, valida entradas y se aplaza si el trabajador tiene el bloqueo',()=>{
 const s=server(),c=s.c;s.sheets.get('Noticias').grid.push(vm.runInContext('RADAR.sheets.Noticias',c).map(key=>article[key]||''));c.LanguageApp={translate:html=>html};
 const result=c.translateNews({ids:['news','missing'],language:'en'});assert.equal(result.items.length,1);assert.equal(result.items[0].id,'news');assert.equal(result.pending.length,0);
 for(const value of [null,{ids:['news'],language:'fr'},{ids:[{}],language:'en'},{ids:Array(101).fill('news'),language:'en'}])assert.throws(()=>c.translateNews(value),/Solicitud/);
 const locks=c.LockService,read=c.rowsById_;c.LockService={getScriptLock:()=>({tryLock:()=>false})};c.rowsById_=()=>{throw Error('El trabajador ocupado no debe leer noticias');};assert.equal(c.translateNews({ids:['news'],language:'tr'}).busy,true);c.LockService=locks;c.rowsById_=read;
 s.setEmail('reader@example.com');assert.throws(()=>c.translateNews({ids:['news'],language:'tr'}),/Accede con tu cuenta/);
});
test('seleccionar noticias para traducción lee IDs y solo los textos solicitados',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),sheet=s.sheets.get('Noticias');
 for(let i=0;i<2000;i++)sheet.grid.push(keys.map(key=>key==='id'?String(i):key==='titular'?'Título '+i:key==='extracto'?'Texto extenso'.repeat(100):''));
 const reads=[],get=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{reads.push(args);return get(...args);};
 const selected=c.rowsById_('Noticias',new Set(['2','3','1500']),2000);assert.equal(selected.length,3);assert.deepEqual(reads,[[2,1,2000,1],[4,1,2,12],[1502,1,1,12]]);assert.equal(c.rowsById_('Noticias',new Set(),2000).length,0);
});
