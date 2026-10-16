import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const positive=[
 'Qonto lanza una API bancaria para integrar tesorería en ERP',
 'BBVA incorpora IA a su asistente digital para empresas',
 'N26 launches new online banking subscription management',
 'BBVA mejora la banca móvil con autenticación biométrica',
 'Qonto lanza API para pagos masivos con aprobaciones multinivel',
 'BBVA renueva banca online y firma electrónica',
 'Stripe launches AI for payments',
 'Bankinter estrena una nueva app con notificaciones y control de gastos'
];
const negative=[
 'BBVA reports record earnings and appoints an AI director',
 'Qonto anuncia resultados financieros de banca online',
 'BBVA obtiene un premio de innovación digital',
 'Banco tradicional presenta resultados trimestrales',
 'Festival presenta aplicaciones de IA para pintura'
];
test('canal digital empresarial reconoce API, IA y móvil con contexto explícito y excluye Retail',()=>{const {c}=server();for(const title of ['Qonto lanza una API de tesorería para empresas','BBVA incorpora IA a su asistente digital para empresas','BBVA mejora banca móvil con autenticación biométrica para pymes'])assert.equal(c.classification_(c.searchText_(title),c.searchText_(title)).labels.digital,true,title);for(const title of [...negative,'N26 launches online banking for personal customers','BBVA mejora su app para particulares'])assert.equal(c.classification_(c.searchText_(title),c.searchText_(title)).labels.digital,false,title);assert.deepEqual(JSON.parse(JSON.stringify(c.savedNewsLabels_('bad'))),{digital:false,capacidades:[]});});
test('ingesta persiste etiquetas empresariales y las consultas usan sus valores guardados',()=>{const {c}=server(),feed=c.feeds_().find(row=>row.entity==='BBVA'&&row.kind==='rss'),now=new Date('2026-10-12T12:00:00Z');const item=c.evaluate_({title:positive[1],excerpt:'Mejora para empresas',url:'https://www.bbva.com/es/ia/',date:'2026-10-11'},feed,now).item;assert.ok(item);c.append_('Noticias',[c.newsRecord_(item,feed,now)]);c.newsLabels_=()=>{throw Error('No recalcular etiquetas en lectura');};assert.equal(c.getDashboard({view:'news',from:'2026-01-01',to:'2026-12-31'}).total,1);assert.equal(c.exportNews({from:'2026-01-01',to:'2026-12-31'}).count,1);});
test('clasificación histórica guarda checkpoints por fecha y no vuelve a escribir etiquetas idénticas',()=>{const {c,sheets}=server(),sheet=sheets.get('Noticias');for(let i=0;i<205;i++)sheet.grid.push([String(i),'2026-10-10','España','Editor','BBVA',positive[1],'','https://example.com/'+i,'','Editor','es','']);c.requestNewsClassification_(true);c.newsClassificationBatch_();assert.equal(c.classificationJob_().next,102);assert.equal(c.rows_('Noticias').filter(row=>row.clasificacion).length,100);while(c.classificationPending_())c.newsClassificationBatch_();assert.equal(c.classificationJob_().state,'Completada');assert.equal(c.rows_('Noticias').filter(row=>JSON.parse(row.clasificacion).digital).length,205);c.requestNewsClassification_(true);while(c.classificationPending_())c.newsClassificationBatch_();assert.equal(c.classificationJob_().classified,0);});
test('todas las consultas actuales fijan digital y Empresas aunque se solicite un segmento retirado',()=>{const {c}=server(),now=new Date('2026-10-12T12:00:00Z');for(const view of ['news','briefing','radar'])for(const segment of ['', 'Retail']){const q=c.dashboardQuery_({view,segment,coverage:''},now);assert.equal(q.coverage,'digital');assert.equal(q.segment,'Empresas e instituciones');}assert.throws(()=>c.dashboardQuery_({coverage:'mobile'}),/cobertura/);});
test('las vistas actuales carecen de selectores de cobertura y segmento',async t=>{const a=await app(t);for(const view of ['news','briefing','radar']){await a.click('[data-view="'+view+'"]');assert.equal(a.w.document.querySelector('#filters [name="coverage"]'),null);assert.equal(a.w.document.querySelector('#filters [name="segment"]'),null);}});
test('migración conserva IDs históricos y personalizaciones empresariales',()=>{const {c,sheets,properties}=server(),sheet=sheets.get('Configuracion'),caps=sheet.grid.find(row=>row[0]==='capabilities'),old=JSON.parse(caps[1]);old.Empresas[0].enabled=false;old.Empresas[0].terms=['termino propio'];old.Retail=[];caps[1]=JSON.stringify(old);properties.CATALOG_VERSION='3.0.5';c.invalidateConfiguration_();c.initializeConfiguration();assert.equal(c.configuration_().capabilities.Empresas[0].enabled,false);assert.deepEqual(Array.from(c.configuration_().capabilities.Empresas[0].terms),['termino propio']);assert.equal(c.configuration_().capabilities.Retail,undefined);});
test('Novedades agrupa BBVA primero; newsletter limita a tres destacados recientes',()=>{
 const {c}=server(),rows=[];for(const [entity,total,date] of [['BBVA',1,'2026-10-08'],['Qonto',3,'2026-10-11'],['N26',2,'2026-10-10'],['Santander',1,'2026-10-09']])for(let i=0;i<total;i++)rows.push({clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id:entity+i,entidad:entity,fecha:date,titular:entity+' lanza una nueva cuenta para empresas '+i,extracto:'',url:'https://example.com/'+entity+i,pais:'España',medio:'Editor'});
 const selected=c.annotateNews_(rows),grouped=c.newsDashboard_(c.annotateNews_(rows),{},c.feeds_(),'briefing').briefing.items;assert.deepEqual(JSON.parse(JSON.stringify(grouped.map(row=>row.entidad))),['BBVA','Qonto','Qonto','Qonto','N26','N26','Santander']);
 const newsletter=c.newsletter_(rows,{},'Canal',new Date('2026-10-12T12:00:00Z'),'sub');assert.equal(newsletter.items[0].entidad,'Qonto');assert.equal(newsletter.count,3);assert.equal(newsletter.evidence.length,7);assert.equal(c.briefing_(selected).items[0].entidad,'BBVA');
});
