import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
const title='Banco Santander y el BEI lanzan una plataforma de financiación digital para movilizar 300 millones de euros para financiar a pymes del sector de defensa y seguridad';
function server(){const s=storage();s.c.Date=class extends Date{constructor(...args){super(...(args.length?args:['2026-10-09T12:00:00Z']));}};s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
function row(id,changes={}){return {id,fecha:'2026-10-09',entidad:'Santander',pais:'España',titular:title,extracto:'',medio:'El Cronista',fuente:'RSS',url:'https://news.google.com/articles/'+id,clasificacion:JSON.stringify({digital:true,generalista:true,capacidades:["Empresas: Pagos"]}),taxonomia:JSON.stringify({ids:['finance']}),...changes};}
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));}
test('ocho copias guardadas cuentan como una en Noticias, Novedades, mapa, Radar, CSV y newsletter; las fuentes siguen consultables',()=>{
 const s=server(),c=s.c;c.taxonomyCatalog_=()=>[{id:'finance',palanca:'Financiación',subpalanca:'Financiación empresarial'}];
 const copies=Array.from({length:8},(_,i)=>row(String(i),{entidad:i%2?'Santander Empresas':'Santander',titular:i%2?title.toUpperCase()+' — El Cronista':title+'!',extracto:i===3?'Nueva oferta de financiación empresarial para pymes':'',medio:i===7?'Otro editor':'El Cronista'}));copies[7].titular=title;
 add(s,copies);const query={from:'2026-10-06',to:'2026-10-12'},news=c.getDashboard({view:'news',...query}),radar=c.getDashboard({view:'radar',...query}),briefing=c.getDashboard({view:'briefing',...query});assert.equal(news.total,1);assert.equal(news.items[0].id,'3');assert.equal(briefing.briefing.total,1);assert.equal(radar.stats.news,1);assert.equal(radar.heatmap.total,1);assert.equal(radar.heatmap.tagged,1);assert.deepEqual(Array.from(radar.heatmap.entities[0].counts,pair=>pair[1]),[1,1]);assert.equal(c.exportNews(query).count,1);
 assert.equal(c.getDashboard({view:'news',source:'Otro editor',...query}).items[0].id,'7');assert.equal(newsletterFixture(c,copies,query,'Únicas',new Date(),'subscription').count,1);assert.equal(c.rows_('Noticias').length,8);
 assert.equal(c.uniqueNews_(annotateFixtures(c,copies.slice().reverse()))[0].id,'3');
});
test('se conservan cifras y eventos diferentes; las atribuciones de país o entidad no multiplican publicaciones y titulares insuficientes; URL canónica evita copias con seguimiento',()=>{
 const {c}=server(),rows=[row('base'),row('amount',{titular:title.replace('300','400')}),row('country',{pais:'México'}),row('entity',{entidad:'BBVA'}),row('later',{fecha:'2026-10-24'}),row('short1',{titular:'Resultados',url:''}),row('short2',{titular:'Resultados',url:''})];assert.equal(c.uniqueNews_(rows).length,5);
 assert.equal(c.uniqueNews_([row('base',{url:'https://editor.test/article'}),row('tracking',{titular:'Otra forma de titular esta noticia',url:'https://editor.test/article?utm_source=rss'})]).length,1);
 const direct=row('direct',{url:'https://editor.test/article'});assert.equal(c.uniqueNews_([row('google'),direct])[0].id,'direct');
});
test('la recuperación detecta alias y sufijo del editor contra las noticias guardadas y en el mismo lote, aunque las fuentes atribuyan países distintos',()=>{
 const s=server(),c=s.c;add(s,[row('stored',{entidad:'Santander Empresas',titular:title+' - El Cronista'})]);const feed={entity:'Santander',country:'España',domain:'news.google.com',name:'Santander RSS',kind:'profile',range:{from:'2026-10-06',to:'2026-10-12'}};
 const item={title:title.toUpperCase(),date:new Date('2026-10-09T12:00:00Z'),entity:'Santander',country:'España',publisher:'El Cronista'};assert.equal(c.duplicateTitle_(c.knownUrls_(),item,feed),true);assert.equal(c.duplicateTitle_(c.knownUrls_(),{...item,country:'México'},feed),true);
 c.parseFeed_=()=>[{title,source:'El Cronista',url:'https://news.google.com/articles/new',date:'2026-10-09T12:00:00Z',excerpt:'Nueva financiación digital para empresas y pymes en España'}];const result=c.ingestFeed_(feed,c.knownUrls_(),'cycle',new Date('2026-10-12T12:00:00Z'),{getResponseCode:()=>200,getContentText:()=>'<rss/>'});assert.equal(result.news.length,0);assert.equal(result.duplicated,1);
 const empty=new Set();empty.titles=new Map();c.rememberTitle_(empty,item);assert.equal(c.duplicateTitle_(empty,item,feed),true);assert.equal(c.duplicateTitle_(empty,{...item,date:new Date('2026-10-24T12:00:00Z')},feed),false);
});

test('titulares con erratas que superan el umbral léxico se consolidan entre países y medios en vistas, CSV, newsletter e ingesta',()=>{
 const s=server(),c=s.c,title='Banco Santander lanza una plataforma digital de financiacion empresarial para nuevas empresas',base=row('base',{titular:title,extracto:'Pagos digitales para empresas',taxonomia:JSON.stringify({ids:[]})}),typo=row('typo',{titular:title.replace('financiacion','financiacoin'),extracto:'Pagos digitales para empresas',taxonomia:JSON.stringify({ids:[]})}),foreign={...typo,id:'foreign',url:'https://editor.test/foreign',pais:'México',medio:'Otro editor'};
 assert.equal(c.uniqueNews_([base,typo]).length,1);assert.equal(c.uniqueNews_([base,foreign]).length,1);
 add(s,[base,foreign]);const query={from:'2026-10-06',to:'2026-10-12'};
 assert.equal(c.getDashboard({...query,view:'radar'}).stats.news,1);assert.equal(c.getDashboard({...query,view:'briefing'}).contextTotal,1);assert.equal(c.getDashboard({...query,view:'news'}).contextTotal,1);assert.equal(c.exportNews(query).count,1);const newsletter=newsletterFixture(c,[base,foreign],query,'Países',new Date(),'subscription');assert.equal(newsletter.count,1);assert.equal(newsletter.total,1);assert.equal(newsletter.editorial.cards[0].relatedCount,1);
 const historical=server();add(historical,[base]);const known=historical.c.knownUrls_(),candidate={title:typo.titular,date:'2026-10-09',publisher:'El Cronista',entity:'Santander',country:'España'};
 assert.equal(c.duplicateTitle_(known,candidate),true);assert.equal(c.duplicateTitle_(known,{...candidate,country:'Perú',publisher:'Otro editor'}),true);
 c.parseFeed_=()=>[{title:typo.titular,source:'El Cronista',url:'https://editor.test/peru',date:'2026-10-09T12:00:00Z',excerpt:'Pagos digitales para empresas en Perú'}];
 const feed={name:'Santander Perú',entity:'Santander',country:'Perú',domain:'editor.test',range:{from:'2026-10-06',to:'2026-10-12'}};
 assert.equal(c.ingestFeed_(feed,known,'test',new Date('2026-10-12T12:00:00Z'),{getResponseCode:()=>200,getContentText:()=>'<rss/>'}).news.length,0);
});
