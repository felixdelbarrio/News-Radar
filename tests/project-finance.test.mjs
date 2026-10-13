import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));}
const headline='Solar developer reaches financial close for a new project financing in Australia';
const story=(id,changes={})=>({id,fecha:'2026-10-10',pais:'Australia',medio:'Europa Press',entidad:'Sector',titular:headline,extracto:'A non-recourse financing package for renewable energy.',url:'https://europapress.es/projects/'+id,clasificacion:JSON.stringify({generalista:true,digital:false,capacidades:[]}),...changes});
test('APAC y países europeos generan consultas con bancos y términos locales, sin productos cartesianos',()=>{
 const {c}=server(),config=c.configuration_(),feeds=c.feeds_();assert.equal(config.geographies.length,31);assert.equal(config.entities.length,86);assert.ok(feeds.length<200);
 for(const name of ['China','Hong Kong','Japón','Singapur','India','Australia','Indonesia','Corea del Sur','Vietnam','Filipinas','Malasia','Tailandia'])assert.ok(feeds.some(feed=>feed.country===name&&feed.kind==='profile'),name);
 for(const [entity,country,term] of [['BBVA','Italia','conto corrente'],['BBVA','Alemania','girokonto'],['Intesa Sanpaolo','Italia','banca digitale'],['Commerzbank','Alemania','digitales banking']]){const feed=feeds.find(feed=>feed.entity===entity&&feed.country===country),query=new URL(feed.url).searchParams.get('q');assert.ok(query.includes(term));assert.ok(!query.includes('project finance'));}
 for(const feed of feeds.filter(feed=>feed.kind==='profile'))assert.ok(config.entities.find(row=>row.name===feed.entity).countries.includes(feed.country));
});
test('RSS gratuitos recuperan operaciones sin banco identificado, delimitan fechas y subdividen saturaciones',()=>{
 const {c}=server(),feed=c.feeds_().find(row=>row.id==='project-finance-apac'),range={from:'2026-10-01',to:'2026-10-12'},bounded=c.collectionProfile_(feed,range);
 const result=c.evaluate_({title:headline,date:'2026-10-10T12:00:00Z',url:'https://news.google.com/rss/articles/project',excerpt:'New non-recourse financing.',source:'Project editor'},bounded,new Date('2026-10-12T12:00:00Z'));assert.equal(result.item.entity,'Sector');assert.equal(result.item.country,'Australia');assert.equal(result.item.publisher,'Project editor');assert.equal(result.item.labels.digital,false);
 assert.ok(c.annotateNews_([story('project')])[0].segmentos.includes('Project Finance'));assert.ok(c.annotateNews_([story('project')])[0].senales.includes('Operación de Project Finance'));
 assert.match(c.evaluate_({title:headline,date:'2026-09-29',url:'https://news.google.com/rss/articles/old'},bounded,new Date('2026-10-12')).reason,/período/);
 const query=new URL(bounded.url).searchParams.get('q');assert.ok(query.startsWith('after:2026-09-30 before:2026-10-13'));assert.doesNotMatch(query,/when:/);assert.equal(c.collectionTaskFeed_({fuente:feed.name,url:bounded.url},c.collectionFeedIndex_()).url,bounded.url);
 const children=c.splitCollectionFeed_(bounded);assert.equal(children.length,2);for(const child of children)assert.equal(c.collectionTaskFeed_({fuente:feed.name,url:child.url},c.collectionFeedIndex_()).url,child.url);
 const response={getResponseCode:()=>200,getContentText:()=>'<rss/>'};c.parseFeed_=()=>Array.from({length:100},(_,i)=>({title:headline+' '+i,date:'2026-10-10',url:'https://news.google.com/rss/articles/'+i}));assert.equal(c.ingestFeed_(bounded,new Set(),'cycle',new Date('2026-10-12'),response).saturated,true);
});
test('titulares sindicados entre bancos y países conservan un original y métricas únicas, con cifras y fechas distintas separadas',()=>{
 const s=server(),c=s.c,rows=[story('original'),story('bank',{entidad:'DBS',pais:'Singapur',medio:'DBS',url:'https://dbs.com/copy',extracto:'A much longer syndicated copy of the announcement.'}),story('agency',{entidad:'BBVA',pais:'España',medio:'Otro editor',titular:headline.toUpperCase()+' — Otro editor',url:'https://other.test/copy'})];add(s,rows);
 const result=c.uniqueNews_(rows);assert.equal(result.length,1);assert.equal(result[0].id,'original');assert.equal(c.uniqueNews_(rows.slice().reverse())[0].id,'original');assert.equal(c.knownUrls_().has('https://dbs.com/copy'),true);
 const dashboard=c.getDashboard({view:'radar',segment:'Project Finance',coverage:'generalista',from:'2026-10-01',to:'2026-10-12'});assert.equal(dashboard.stats.news,1);assert.equal(dashboard.heatmap.total,1);assert.equal(dashboard.radar.available.total,1);assert.equal(c.exportNews({segment:'Project Finance',coverage:'generalista'}).count,1);
 assert.equal(c.uniqueNews_([story('base'),story('other',{titular:headline.replace('new','second')}),story('later',{fecha:'2026-10-13'})]).length,3);
});
test('taxonomía de Project Finance usa documentos únicos incluso entre lotes y etiqueta todo el histórico',()=>{
 const s=server(),c=s.c;add(s,Array.from({length:130},(_,i)=>story(String(i),{medio:i%2?'Bank copy':'Europa Press',entidad:i%2?'DBS':'Sector'})));c.startTaxonomy();for(let i=0;i<20&&c.taxonomyPending_();i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Completada',c.taxonomyJob_().error);assert.equal(c.taxonomyJob_().documents,1);
 const model=c.taxonomyCatalog_().find(row=>row.palanca==='Project Finance');assert.ok(model);assert.equal(model.noticias,1);assert.ok(c.rows_('Noticias').every(row=>c.taxonomySaved_(row.taxonomia).ids.includes(model.id)));
 const radar=c.getDashboard({view:'radar',segment:'Project Finance',coverage:'generalista'});assert.equal(radar.heatmap.tagged,1);assert.equal(radar.heatmap.nodes.find(row=>row.palanca==='Project Finance').count,1);
});
test('banca digital diaria y Project Finance independiente mantienen horarios, ventanas y colas sin solapamiento',()=>{
 const s=server(),c=s.c;c.enableDaily();const hours=handler=>Array.from(c.ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===handler),t=>t.hour).sort((a,b)=>a-b);
 assert.deepEqual(hours('dailyRadar_'),[7]);assert.deepEqual(hours('projectFinanceRadar_'),[4,10,16,22]);c.initializeBackgroundSchedules_();assert.deepEqual(hours('dailyRadar_'),[7]);assert.deepEqual(hours('projectFinanceRadar_'),[4,10,16,22]);
 const config=c.getConfiguration();config.config.settings.projectFinanceIntervalHours=4;c.saveConfiguration(config);assert.equal(hours('projectFinanceRadar_').length,6);assert.deepEqual(hours('dailyRadar_'),[7]);config.config.settings.projectFinanceIntervalHours=5;assert.throws(()=>c.saveConfiguration(config),/Frecuencia/);
 c.backgroundTick_=()=>({});c.dailyRadar_();c.projectFinanceRadar_();const requests=c.collectionRequests_();assert.equal(requests.length,2);c.dailyRadar_();c.projectFinanceRadar_();assert.deepEqual(Array.from(c.collectionRequests_(),r=>r.id),Array.from(requests,r=>r.id));
 for(const {key} of requests)delete s.properties[key];s.properties['COLLECTION_SCHEDULED_AT:daily']=new Date(Date.now()-24*3600000).toISOString();s.properties['COLLECTION_SCHEDULED_AT:projectFinance']=new Date(Date.now()-6*3600000).toISOString();c.dailyRadar_();c.projectFinanceRadar_();for(const request of c.collectionRequests_())assert.ok(Date.parse(request.range.to)-Date.parse(request.range.from)<=3*86400000);
 c.disableDaily();assert.equal(hours('dailyRadar_').length,0);assert.equal(hours('projectFinanceRadar_').length,0);
});
test('consultas digitales y Project Finance se separan y la recuperación anual conserva ambas',()=>{
 const {c}=server(),range={from:'2026-10-01',to:'2026-10-12'},digital=c.collectionFeeds_(range,'daily'),project=c.collectionFeeds_(range,'projectFinance'),annual=c.collectionFeeds_(range,'annual');
 assert.equal(digital.filter(f=>f.kind==='rss').length,7);assert.equal(project.filter(f=>f.kind==='rss').length,3);assert.ok(project.filter(f=>f.kind==='profile').length>100);
 const digitalUrls=new Set(digital.map(f=>f.url)),annualUrls=new Set(annual.map(f=>f.url));for(const feed of project){assert.ok(!digitalUrls.has(feed.url));assert.ok(annualUrls.has(feed.url));assert.equal(c.collectionTaskFeed_({fuente:feed.name,url:feed.url},c.collectionFeedIndex_()).url,feed.url);if(feed.kind==='profile')assert.ok(new URL(feed.url).searchParams.get('q').includes('project finance'));}
 for(const feed of digital)assert.ok(annualUrls.has(feed.url));assert.equal(new Set(annual.map(f=>f.url)).size,annual.length);
});
test('una solicitud digital interrumpe Project Finance entre lotes sin duplicar ni perder su trabajo',()=>{
 const {c}=server(),range={from:'2026-10-01',to:'2026-10-12'};c.requestCollection_('projectFinance',range);c.drainCollectionRequests_();const project=c.collectionWork_(Date.now());assert.equal(project.jobs.find(j=>j.id===project.pending[0].ciclo).tipo,'projectFinance');
 c.requestCollection_('daily',range);c.drainCollectionRequests_();const digital=c.collectionWork_(Date.now());assert.equal(digital.jobs.find(j=>j.id===digital.pending[0].ciclo).tipo,'daily');assert.equal(c.backgroundTask_(digital,true),'collection');assert.equal(digital.jobs.find(j=>j.tipo==='projectFinance').pendientes,project.jobs[0].pendientes);
 c.backgroundTick_=()=>({});c.projectFinanceRadar_();assert.equal(c.collectionRequests_().length,0);
});
test('actualización amplía catálogos existentes sin perder ediciones, desactivaciones ni países personalizados',()=>{
 const s=server(),c=s.c,sheet=s.sheets.get('Configuracion'),put=(key,value)=>sheet.grid.find(row=>row[0]===key)[1]=JSON.stringify(value),config=c.getConfiguration().config;
 put('geographies',config.geographies.slice(0,7));put('entities',config.entities.slice(0,38).map(row=>({...row,countries:row.countries.filter(country=>config.geographies.slice(0,7).some(g=>g.name===country)),enabled:row.name!=='BBVA'})));put('segments',config.segments.slice(0,2));put('signals',config.signals.slice(0,3));put('feeds',config.feeds.slice(0,7));put('capabilities',{...config.capabilities,Retail:config.capabilities.Retail.slice(0,-1)});const settings={...config.settings};delete settings.projectFinanceIntervalHours;delete settings.projectFinanceHour;settings.dailyHour=9;settings.defaultEntity='';put('settings',settings);s.properties.CATALOG_VERSION='previous';c.invalidateConfiguration_();c.initializeConfiguration();
 const next=c.getConfiguration().config;assert.equal(next.geographies.length,31);assert.equal(next.entities.find(e=>e.name==='BBVA').enabled,false);assert.ok(next.entities.find(e=>e.name==='BBVA').countries.includes('Alemania'));assert.equal(next.settings.dailyHour,9);assert.equal(next.settings.projectFinanceIntervalHours,6);assert.equal(next.segments.length,3);assert.equal(next.signals.length,4);assert.ok(next.capabilities.Retail.some(row=>row.name==='Cuentas digitales europeas'));const stored=JSON.stringify(sheet.grid);c.initializeConfiguration();assert.equal(JSON.stringify(sheet.grid),stored);
});
test('Project Finance mantiene formularios existentes y elige cobertura generalista también en suscripciones',async t=>{
 const a=await app(t,{configure({data,replies}){data.segments=['Empresas e instituciones','Retail','Project Finance'];replies.getNewsletterOptions.catalogs.segment=data.segments;replies.getNewsletterOptions.catalogs.coverage=['digital','generalista'];replies.getNewsletterOptions.defaults.filters={segment:'Empresas e instituciones',coverage:'digital'};}});
 await a.change('#filters [name="coverage"]','digital');await a.change('#filters [name="segment"]','Project Finance');assert.equal(a.find('#filters [name="coverage"]').value,'generalista');assert.equal(a.calls.filter(c=>c.method==='getDashboard').at(-1).query.segment,'Project Finance');
 await a.click('[data-view="subscriptions"]');await a.click('#new-subscription');await a.change('#personal-editor [name="segment"]','Project Finance');assert.equal(a.find('#personal-editor [name="coverage"]').value,'generalista');await a.submit('#personal-editor form');const payload=a.calls.find(c=>c.method==='saveSubscription').query;assert.equal(payload.filters.segment,'Project Finance');assert.equal(payload.filters.coverage,'generalista');
 const {c}=server();c.saveSubscription({periodicity:'quarterly',active:true,filters:{segment:'Project Finance'}});assert.equal(c.getSubscriptions()[0].filtros.coverage,'generalista');
});
test('checkpoints de titulares acotan cada celda y conservan corpus grandes sin guardar textos completos',()=>{
 const s=server(),c=s.c,titles=Object.fromEntries(Array.from({length:1500},(_,i)=>[c.sha256_('headline'+i),[20000+i]])),job={id:'chunked'};
 c.writeTaxonomyCheckpoint_(job,{next:1502,documents:1500,size:0,candidates:{},titles});const cells=s.sheets.get('TaxonomiaTrabajo').grid.slice(1).map(row=>row[0]);assert.ok(cells.length>2);assert.ok(cells.every(value=>value.length<=40000));assert.equal(Object.keys(c.taxonomyCheckpoint_(job).titles).length,1500);
});
test('banca digital alemana e italiana conserva el país nativo y la clasificación retail sin traducción remota',()=>{
 const {c}=server();for(const [country,title] of [['Alemania','BBVA startet ein neues Girokonto in Deutschland'],['Italia','BBVA lancia un nuovo conto corrente in Italia']]){const feed=c.feeds_().find(row=>row.entity==='BBVA'&&row.country===country),result=c.evaluate_({title,date:'2026-10-10',url:'https://news.google.com/rss/articles/local'},feed,new Date('2026-10-12'));assert.equal(result.item.country,country);assert.equal(result.item.labels.digital,true);assert.ok(c.annotateNews_([{titular:title,extracto:'',entidad:'BBVA'}])[0].segmentos.includes('Retail'));}
});

test('desactivar el segmento Project Finance elimina sus consultas y conserva las digitales',()=>{
 const {c}=server(),range={from:'2026-10-01',to:'2026-10-12'};c.configuration_().segments.find(row=>row.name==='Project Finance').enabled=false;
 assert.equal(c.collectionFeeds_(range,'projectFinance').length,0);assert.ok(c.collectionFeeds_(range,'daily').length>100);assert.equal(c.collectionFeeds_(range,'daily').filter(feed=>feed.kind==='rss').length,7);
});
test('restaurar y actualizar colas mantiene consultas Project Finance y de capacidades sin convertirlas en generales',()=>{
 const {c,sheets}=server(),range={from:'2026-10-01',to:'2026-10-12'};
 for(const kind of ['daily','projectFinance']){c.requestCollection_(kind,range);c.drainCollectionRequests_();}
 const before=sheets.get('Recopilacion').grid.map(row=>row[2]);c.upgradeCollectionQueries_();assert.deepEqual(sheets.get('Recopilacion').grid.map(row=>row[2]),before);
 const index=c.collectionFeedIndex_(),feed=c.collectionFeeds_(range,'projectFinance').find(feed=>feed.kind==='profile'),task={fuente:feed.name,url:feed.url};assert.equal(c.collectionTaskFeed_(task,index,range,'daily'),null);assert.equal(c.collectionTaskFeed_(task,index,range,'projectFinance').url,feed.url);
});

test('recuperación manual de Project Finance tiene bloqueo propio, deja disponible banca digital y reutiliza su cola',()=>{
 const {c}=server(),result=c.collectNow('projectFinance');assert.equal(result.blocked.projectFinance,true);assert.equal(result.blocked.today,false);assert.equal(result.jobs[0].tipo,'projectFinance');assert.match(result.notice,/Project Finance/);assert.throws(()=>c.collectNow('projectFinance'),/Project Finance en curso/);
 c.collectNow('today');c.drainCollectionRequests_();const jobs=c.collectionJobs_();assert.equal(jobs.length,2);assert.equal(Number(jobs.find(j=>j.tipo==='projectFinance').total),140);assert.equal(Number(jobs.find(j=>j.tipo==='daily').total),331);
});
test('el botón de Project Finance y su barra funcionan por separado y reflejan la cola sin bloquear la recuperación digital',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="runs"]');assert.equal(a.find('[data-collection-kind="projectFinance"] progress').value,0);await a.click('#collect-project-finance');assert.equal(a.calls.findLast(call=>call.method==='collectNow').query,'projectFinance');
 const status={total:165,pending:115,processed:48,failed:2,blocked:{today:false,year:false,projectFinance:true},jobs:[{tipo:'projectFinance',desde:'2026-10-03',hasta:'2026-10-13',estado:'Pendiente',total:165,procesadas:48,fallidas:2,pendientes:115,nuevas:9}]};a.data.collection=status;a.replies.getRuns.collection=status;await a.click('[data-admin-view="runs"]');assert.equal(a.find('#collect-project-finance').disabled,true);assert.equal(a.find('#collect').disabled,false);const progress=a.find('[data-collection-kind="projectFinance"] progress');assert.equal(progress.max,165);assert.equal(progress.value,50);assert.match(progress.getAttribute('aria-label'),/Project Finance/);
});
test('contratos y licitaciones útiles sin banco pertenecen exclusivamente a Project Finance y conservan el país del proyecto',()=>{
 const {c}=server(),feed=c.feeds_().find(feed=>feed.id==='project-finance-sector');
 for(const title of ['Solar developer signs power purchase agreement for project in Australia','Vietnam launches infrastructure tender for a transport concession','Renewable energy auction awarded in India']){
  const result=c.evaluate_({title,url:'https://news.google.com/rss/articles/useful',date:'2026-10-10',excerpt:'New infrastructure projects for business and retail customers.'},feed,new Date('2026-10-12'));assert.ok(result.item,title);assert.equal(result.item.entity,'Sector');const row=c.annotateNews_([{titular:title,extracto:'infrastructure for empresas, pymes y particulares',entidad:'Sector',pais:result.item.country}])[0];assert.deepEqual(Array.from(row.segmentos),['Project Finance']);assert.equal(c.selectAnnotatedNews_([row],{segment:'Empresas e instituciones'}).length,0);assert.equal(c.selectAnnotatedNews_([row],{segment:'Retail'}).length,0);
 }
 const bank=c.feeds_().find(feed=>feed.entity==='DBS'&&feed.country==='Singapur'),result=c.evaluate_({title:'DBS closes project financing for solar park in Australia',excerpt:'The lender is headquartered in Singapore.',url:'https://news.google.com/rss/articles/cross-border',date:'2026-10-10'},bank,new Date('2026-10-12'));assert.equal(result.item.country,'Australia');
});
test('Project Finance utiliza pestañas de países con totales propios y conserva Transversal para ubicaciones sin evidencia',()=>{
 const {c}=server(),rows=c.annotateNews_([story('au'),story('in',{pais:'India',titular:'India awards renewable energy auction'}),story('global',{pais:'Sin determinar',titular:'Project debt markets outlook'})]);
 const result=c.newsDashboard_(rows,{segment:'Project Finance',coverage:'generalista',newsGeography:'India'},[],'news');assert.equal(result.newsGeographies.length,3);assert.equal(result.total,1);assert.equal(result.items[0].id,'in');assert.ok(result.newsGeographies.some(row=>row.name==='Sin determinar'));
});
test('las vistas administrativas evitan leer y clasificar el corpus de noticias',()=>{
 const {c}=server();c.cachedNewsRecords_=()=>{throw Error('Lectura innecesaria del corpus');};for(const view of ['runs','sources','configuration','telemetry']){const result=c.getDashboard({view});assert.equal('items' in result,false);assert.equal(result.performance.newsMs,0);assert.equal(result.performance.version,'2.7.0');}
});

test('recuperar desde Ejecuciones pide solo metadatos administrativos y actualiza la lectura al cambiar su revisión',async t=>{
 const a=await app(t);await a.click('[data-view="news"]');await a.click('[data-view="administration"]');await a.click('[data-admin-view="runs"]');
 a.replies.getDashboard={preferences:a.data.preferences,configurationRevision:'changed',newsRevision:'new',collection:{total:165,pending:165,jobs:[{tipo:'projectFinance',estado:'Pendiente',total:165,pendientes:165}]},admin:true,context:{mode:'current'}};
 await a.click('#collect-project-finance');const query=a.calls.findLast(call=>call.method==='getDashboard').query;assert.equal(query.view,'runs');assert.equal(query.edition,undefined);assert.equal(a.find('[data-collection-kind="projectFinance"] progress').max,165);
 const before=a.calls.filter(call=>call.method==='getDashboard').length;a.replies.getDashboard=a.data;await a.click('[data-view="news"]');assert.equal(a.calls.filter(call=>call.method==='getDashboard').length,before+1);
});
