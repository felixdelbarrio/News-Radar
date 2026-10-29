import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function setup(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.LanguageApp={translate(){throw Error('Buscar no debe invocar el traductor');}};return s;}
const story=(id,extra={})=>({id,fecha:'2026-10-20',pais:'Reino Unido',entidad:'HSBC',medio:'English publisher',fuente:'English feed',idioma:'en',titular:'Business treasury platform '+id,extracto:'Digital cash management for businesses.',url:'https://example.com/'+id,tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:['Mejora de oferta'],etiquetas:{digital:true},taxonomia:[{palanca:'Cuentas',subpalanca:'Gestión'}],...extra});
const query={view:'news',from:'2026-10-01',to:'2026-10-31',search:'tesorería',language:'es',coverage:'digital',segment:'Empresas e instituciones'};
function translation(s,row,language,title,excerpt=''){
 s.sheets.get('Traducciones').grid.push([s.c.articleTranslationKey_(row,language),language,title,excerpt,'2026-10-29T10:00:00Z']);s.properties['TRANSLATIONS_REVISION:'+language]=String(s.sheets.get('Traducciones').grid.length);vm.runInContext('articleTranslationRows_=undefined;articleTranslationMemory_=undefined;',s.c);
}
function select(c,rows,q=query){return c.selectAnnotatedNews_(rows,q,undefined,false,undefined,c.newsSearchMatcher_(rows,q));}
test('tesorería y tesoreria encuentran originales y traducciones de titular y extracto en cualquier idioma guardado',()=>{
 const s=setup(),c=s.c,rows=[story('title'),story('excerpt'),story('literal',{titular:'Tesorería digital para empresas'}),story('none')];
 translation(s,rows[0],'es','HSBC presenta tesorería digital');translation(s,rows[1],'es','Nueva plataforma empresarial','Gestión de TESORERÍA corporativa.');
 for(const search of ['tesorería','tesoreria','TESORERÍA'])assert.deepEqual(Array.from(select(c,rows,{...query,search,language:'tr'}),row=>row.id).sort(),['excerpt','literal','title']);
 assert.equal(select(c,rows,{...query,search:'treasury'}).length,3);
});
test('las traducciones no amplían país, entidad, fechas, señal, tipo, canal ni funcionalidad',()=>{
 const s=setup(),c=s.c,rows=[story('ok'),story('country',{pais:'España'}),story('entity',{entidad:'BBVA'}),story('date',{fecha:'2026-09-30'}),story('signal',{senales:['Alianza estratégica']}),story('type',{tipo:'Fintech'}),story('digital',{etiquetas:{digital:false}}),story('function',{taxonomia:[{palanca:'Pagos',subpalanca:'Transferencias'}]})];
 for(const row of rows)translation(s,row,'es','Tesorería '+row.id);
 const filtered={...query,country:'Reino Unido',entity:'HSBC',signal:'Mejora de oferta',type:'Banco tradicional',palanca:'Cuentas',subpalanca:'Cuentas › Gestión'};
 assert.deepEqual(Array.from(select(c,rows,filtered),row=>row.id),['ok']);
 const matcher=c.newsSearchMatcher_(rows,filtered);assert.equal(c.newsCsv_(rows,filtered,'es',true,undefined,undefined,undefined,matcher).count,1);
});
test('la búsqueda no recupera una traducción obsoleta ni necesita leer traducciones sin texto de búsqueda',()=>{
 const s=setup(),c=s.c,row=story('old');translation(s,row,'es','Tesorería del texto anterior');
 assert.equal(select(c,[{...row,titular:'A completely different headline'}]).length,0);
 c.articleTranslationIndex_=()=>{throw Error('Lectura innecesaria');};assert.equal(c.newsSearchMatcher_([row],{...query,search:''}),null);
 assert.equal(c.newsSearchMatcher_([row],{...query,search:'treasury'})(row),true);
 assert.equal(c.newsSearchMatcher_([row],{...query,from:'2027-01-01',to:'2027-12-31'})(row),false);
});
test('pantalla y exportación comparten resultados; una nueva traducción invalida la selección cacheada',()=>{
 const s=setup(),c=s.c,rows=[story('pending')];c.cachedNewsRecords_=()=>rows;
 const first=c.dashboardContent_(query,[],'news','es');assert.equal(first.data.contextTotal,0);
 translation(s,rows[0],'es','Nueva tesorería empresarial');
 const next=c.dashboardContent_(query,[],'news','es');assert.equal(next.data.contextTotal,1);assert.equal(next.data.items[0].id,'pending');assert.equal(next.data.items[0].titular,'Nueva tesorería empresarial');
 assert.equal(c.exportNews(query).count,1);
 assert.equal(c.dashboardContent_(query,[],'news','es').cacheHit,true);
});
test('el acceso a traducciones se agrupa y descarta primero las noticias fuera del filtro',()=>{
 const {c}=setup(),rows=Array.from({length:300},(_,i)=>story('batch-'+i)),excluded=story('outside',{fecha:'2020-01-01'}),keys=new Map(rows.map(row=>[c.articleTranslationKey_(row,'es'),1])),batches=[];
 c.articleTranslationIndex_=()=>keys;c.cachedArticleTranslations_=batch=>{batches.push(batch);return new Map(batch.map(key=>[key,{titular:'Tesorería digital',extracto:''}]));};
 const matches=c.newsSearchMatcher_([...rows,excluded],query);assert.ok(rows.every(matches));assert.equal(matches(excluded),false);assert.ok(batches.length<rows.length);assert.ok(batches.every(batch=>batch.length<=128));
});
