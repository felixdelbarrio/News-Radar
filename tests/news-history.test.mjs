import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(count=0){
 const s=storage(),c=s.c;c.initializeConfiguration();
 for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),grid=s.sheets.get('Noticias').grid;
 for(let i=0;i<count;i++)grid.push(keys.map(key=>article(i)[key]||''));
 return s;
}
function article(i,changes={}){return {id:'id-'+i,fecha:'2025-10-16',pais:'España',medio:'Editor',entidad:'BBVA',titular:'BBVA lanza plataforma digital de pagos para empresas producto '+i,extracto:'Pagos digitales y tesorería para pymes.',url:'https://editor.test/'+i,fuente:'Editor',idioma:'es',capturada:'2026-10-15T00:00:00Z',clasificacion:'{"digital":true,"generalista":true,"capacidades":["Empresas: Pagos"]}',taxonomia:'{"ids":[]}',...changes};}
const query={from:'2025-10-16',to:'2026-10-15'};
const plain=value=>JSON.parse(JSON.stringify(value));
test('50.000 noticias siguen consultables y paginar reutiliza selección, métricas y orden sin transformar el histórico',()=>{
 const s=server(50000),c=s.c,first=c.dashboardContent_(query,[],'news');
 assert.equal(first.data.total,50000);assert.equal(first.data.items[0].id,'id-0');assert.equal(first.data.items.length,c.settings_().pageSize);
 const annotate=c.annotateNews_;let processed=0;c.annotateNews_=rows=>{processed+=rows.length;return annotate(rows);};
 const next=c.dashboardContent_({...query,page:1},[],'news');assert.equal(next.cacheHit,true);assert.equal(processed,c.settings_().pageSize);assert.equal(next.data.items[0].id,'id-'+c.settings_().pageSize);
 const last=c.dashboardContent_({...query,page:1e9},[],'news');assert.equal(last.data.items.at(-1).id,'id-49999');assert.equal(last.data.total,50000);
 assert.equal(c.translationCandidates_({started:'2026-10-16T00:00:00Z'}).length,50000);
 assert.equal(c.rowsById_('Noticias',new Set(['id-0','id-49999'])).length,2);
 s.cache.clear();const uncached=c.dashboardContent_({...query,page:1},[],'news');assert.deepEqual(plain(uncached.data),plain(next.data));
});
test('el índice incluye períodos antiguos y filas desordenadas; filtra antes de clasificar y conserva catálogos globales',()=>{
 const s=server(10001),c=s.c,grid=s.sheets.get('Noticias').grid;
 grid[1][1]='2024-01-01';grid[1][3]='Editor histórico';grid[1][4]='Santander';grid[500][1]='2024-01-01';
 const annotate=c.annotateNews_;let processed=0;c.annotateNews_=rows=>{processed+=rows.length;return annotate(rows);};
 const data=c.dashboardContent_({from:'2024-01-01',to:'2024-01-01',entity:'Santander'},[],'news').data;
 assert.equal(data.total,1);assert.equal(data.items[0].id,'id-0');assert.equal(processed,2);assert.ok(data.sources.includes('Editor histórico'));assert.ok(data.sources.includes('Editor'));assert.ok(data.entities.includes('BBVA'));
 assert.equal(c.exportNews({from:'2024-01-01',to:'2024-01-01'}).count,2);
 assert.equal(c.dashboardContent_({from:'2024-01-01',to:'2024-01-01'},[],'radar').data.radar.available.limited,false);
});
test('caché vacía o incompleta reconstruye resultados; inserción, clasificación, configuración y traducciones invalidan planes',()=>{
 const s=server(65),c=s.c,first=c.dashboardContent_(query,[],'news').data;
 for(const key of [...s.cache.keys()])if(key.startsWith('dashboard-fragments:'))s.cache.delete(key);
 const recordPart=[...s.cache.keys()].find(key=>key.startsWith('news-records:')&&!key.endsWith(':index')&&key.split(':').length>3);assert.ok(recordPart);s.cache.delete(recordPart);
 assert.deepEqual(plain(c.dashboardContent_(query,[],'news').data),plain(first));
 for(const invalidate of [()=>c.invalidateNews_(),()=>c.invalidateNews_(false),()=>c.invalidateConfiguration_(),()=>{s.properties['TRANSLATIONS_REVISION:en']='changed';}]){
  invalidate();assert.equal(c.dashboardContent_(query,[],'news').cacheHit,false);
 }
 const keys=vm.runInContext('RADAR.sheets.Noticias',c);s.sheets.get('Noticias').grid.push(keys.map(key=>article(100)[key]||''));c.invalidateNews_();assert.equal(c.dashboardContent_(query,[],'news').data.total,66);
});
test('precalienta solo valores predeterminados en reposo y cede ante trabajos de ingesta y traducción',()=>{
 const s=server(),c=s.c;let views=[];c.dashboardContent_=(query,feeds,view)=>{views.push(view);};
 c.invalidateNews_();assert.equal(c.warmDefaultDashboard_({jobs:[{pendientes:1}]}),false);assert.equal(views.length,0);
 s.properties.TRANSLATION_REQUEST='pending';assert.equal(c.warmDefaultDashboard_({jobs:[]}),false);delete s.properties.TRANSLATION_REQUEST;
 for(let i=0;i<3;i++)assert.equal(c.warmDefaultDashboard_({jobs:[]}),true);
 assert.deepEqual(views,['radar','briefing','news']);assert.equal(s.properties.DASHBOARD_WARMUP,undefined);assert.equal(c.warmDefaultDashboard_({jobs:[]}),false);
});
test('identidad canónica y similitud acotada conservan importes, productos, negaciones y fechas distintas',()=>{
 const {c}=server(),base=article(1,{titular:'BBVA lanza una plataforma digital de financiacion empresarial para nuevas empresas'}),typo={...base,id:'typo',url:'https://editor.test/typo',titular:base.titular.replace('financiacion','financiacoin')};
 assert.equal(c.uniqueNews_([base,typo]).length,1);
 for(const title of [base.titular.replace('nuevas','otras'),base.titular.replace('BBVA lanza','BBVA no lanza'),base.titular.replace('empresarial','internacional')])assert.equal(c.uniqueNews_([base,{...typo,titular:title}]).length,2);
 assert.equal(c.uniqueNews_([base,{...typo,fecha:'2025-10-20'}]).length,2);
 assert.equal(c.uniqueNews_([base,{...typo,medio:'Otro'}]).length,2);
 assert.equal(c.newsUrlIdentity_('https://news.google.com/rss/articles/token?oc=5'),c.newsUrlIdentity_('https://news.google.com/articles/token'));
 const amount=article(2,{titular:'Santander moviliza 300 millones de euros para financiar pymes'});assert.equal(c.uniqueNews_([amount,{...amount,id:'new',url:'https://editor.test/new',titular:amount.titular.replace('300','400')}]).length,2);
});
test('plan de consolidación conserva originales y referencias de newsletters sin escrituras ni borrados',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),a=article(1),b={...a,id:'copy',url:'https://other.test/duplicate'};
 s.sheets.get('Noticias').grid.push(...[a,b].map(row=>keys.map(key=>row[key]||'')));
 const frozen=c.annotateNews_([b]);c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Histórico',query,'es',frozen);c.completeNewsletterEdition_('edition','Enviada');
 const before=JSON.stringify([...s.sheets].map(([name,sheet])=>[name,sheet.grid])),plan=c.previewNewsDeduplication();assert.equal(plan.duplicates,1);assert.equal(plan.groups.length,1);assert.equal(plan.groups[0].duplicates.length,1);assert.ok(plan.groups[0].duplicates[0].url);assert.equal(JSON.stringify([...s.sheets].map(([name,sheet])=>[name,sheet.grid])),before);
 assert.equal(c.newsletterEdition_('edition','owner@bbva.com').items[0].id,'copy');
 s.setEmail('reader@bbva.com');assert.throws(()=>c.previewNewsDeduplication(),/no autorizado/);
});
test('casos de la hoja real separan la sindicación próxima, la reedición lejana y productos financieros diferentes',()=>{
 const {c}=server(),pairs=[
  ["BBVA Colombia lanza 'Blue Diamond', una nueva tarjeta de crédito para clientes de altos ingresos",'BBVA Colombia lanza Blue Diamond, una nueva tarjeta de crédito para clientes de altos ingresos','2026-02-09','2026-02-11',1],
  ['Mastercard y BBVA lanzan en Perú la primera tarjeta de débito de la UEFA Champions League','Mastercard y BBVA lanzan en Perú la primera tarjeta de débito de la UEFA Champions League','2026-03-12','2026-03-26',2],
  ['KAP *** YAPI KREDİ PORTFÖY ÜÇÜNCÜ PARA PİYASASI (TL) FONU *** KCP *** Portföy Dağılım Raporu','KAP *** YAPI KREDİ PORTFÖY İKİNCİ PARA PİYASASI (TL) FONU *** KCP *** Portföy Dağılım Raporu','2026-10-07','2026-10-07',2],
  ['Commonwealth Bank of Australia (CBA.AX) stock price, news, quote and history','Commonwealth Bank of Australia (CBAPJ.AX) stock price, news, quote and history','2026-10-10','2026-10-10',2],
  ['El BCE empuja al Sabadell y al francés BPCE para fusionarse y crear un gigante bancario ibero-francés','El BCE empuja al Sabadell y al francés BPCE para fusionarse y crear un gigante bancario ibero-galo','2026-10-09','2026-10-09',2]
 ];
 for(const [a,b,dayA,dayB,count] of pairs)assert.equal(c.uniqueNews_([article(1,{titular:a,fecha:dayA}),article(2,{titular:b,fecha:dayB})]).length,count,a);
});
test('URLs editoriales equivalentes son idempotentes entre fuentes y reintentos sin alterar claves de newsletters previas',()=>{
 const s=server(),c=s.c,a=article(1,{fecha:'2026-10-09',url:'https://news.google.com/rss/articles/token?oc=5'}),keys=vm.runInContext('RADAR.sheets.Noticias',c);s.sheets.get('Noticias').grid.push(keys.map(key=>a[key]||''));
 const oldKey='url:'+c.sha256_(a.url);assert.ok(c.newsletterItemKeys_(a).includes(oldKey));
 const known=c.knownUrls_();assert.ok(known.has(c.newsUrlIdentity_('https://news.google.com/articles/token')));
 c.parseFeed_=()=>[{title:a.titular,source:a.medio,date:'2026-10-09',url:'https://news.google.com/articles/token',excerpt:a.extracto}];
 const feed={name:'RSS',entity:'BBVA',country:'España',domain:'news.google.com',kind:'profile',range:{from:'2026-10-09',to:'2026-10-10'}};
 for(let i=0;i<2;i++){const result=c.ingestFeed_(feed,c.knownUrls_(),'retry-'+i,new Date('2026-10-10T12:00:00Z'),{getResponseCode:()=>200,getContentText:()=>'<rss/>'});assert.equal(result.news.length,0);assert.equal(result.duplicated,1);}
 assert.equal(c.rows_('Noticias').length,1);
});
test('la paginación con entidades intercaladas agrupa lecturas y mantiene idénticos filtros, orden y variantes traducidas',()=>{
 const s=server(100),c=s.c,grid=s.sheets.get('Noticias').grid;grid.slice(1).forEach((row,index)=>{if(index%2)row[4]='Santander';});
 const first=c.dashboardContent_(query,[],'news');assert.equal(first.data.total,100);
 const reads=s.reads,page=c.dashboardContent_({...query,page:1},[],'news');assert.ok(s.reads-reads<=2);assert.equal(page.data.items[0].entidad,'BBVA');assert.ok(page.data.items.every(row=>!('_sheetRow' in row)&&!('identityTitles' in row)));
 const filtered=c.dashboardContent_({...query,entity:'Santander',search:'producto',page:1},[],'news');assert.equal(filtered.data.total,50);assert.ok(filtered.data.items.every(row=>row.entidad==='Santander'));assert.equal(filtered.data.items[0].id,'id-61');
 s.cache.clear();assert.deepEqual(plain(c.dashboardContent_({...query,page:1},[],'news').data),plain(page.data));
 c.LanguageApp={translate:()=>'<p>Translated headline for digital business payments</p><p>Translated excerpt</p>'};c.storeArticleTranslation_(article(0),'en');
 c.dashboardContent_(query,[],'news','en');const translated=c.dashboardContent_({...query,page:1},[],'news','en').data;s.cache.clear();assert.deepEqual(plain(c.dashboardContent_({...query,page:1},[],'news','en').data),plain(translated));
});
test('la previsualización contabiliza copias persistidas que repiten también su UUID',()=>{
 const s=server(1),grid=s.sheets.get('Noticias').grid;grid.push([...grid[1]]);const plan=s.c.previewNewsDeduplication();assert.equal(plan.total,2);assert.equal(plan.unique,1);assert.equal(plan.duplicates,1);assert.equal(plan.groups[0].duplicates[0].id,plan.groups[0].representative.id);
});
