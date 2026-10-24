import {drainSnapshots} from './helpers/canonical-fixtures.mjs';
import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/delivery.mjs';
import {app,tick} from './helpers/app.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
function news(s,id='one',country='España',title='BBVA lanza pagos digitales para empresas'){
 return annotateFixtures(s.c,[{clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id,fecha:'2026-09-10',pais:country,entidad:'BBVA',medio:'Editor',titular:title,extracto:'El servicio permite gestionar pagos digitales, permisos y cobros desde la app para empresas.',url:'https://example.com/'+id,idioma:'es',fuente:'Editor',capturada:'2026-09-10T00:00:00Z'}])[0];
}
function edition(s,id='edition',items=[news(s)],view='news'){
 const c=s.c,query={view,from:'2026-09-01',to:'2026-09-30',segment:'Empresas e instituciones'},content=c.newsletterContent_(items,query,'Selección',new Date(),'subscription','es',id);
 c.saveNewsletterEdition_(id,'delivery','owner@bbva.com','Selección',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_(id,'Enviada');return content;
}
function add(s,name,row){const keys=vm.runInContext('RADAR.sheets.'+name,s.c);s.sheets.get(name).grid.push(keys.map(key=>row[key]??''));}
test('quincenal lunes tras el cierre y trimestral primer miércoles mantienen sus ventanas cerradas',()=>{
 const {c}=server();
 for(const [cadence,now,available,from,to] of [
  ['fortnightly','2026-10-13','2026-10-05','2026-09-16','2026-09-30'],
  ['quarterly','2026-10-01','2026-10-07','2026-07-01','2026-09-30'],
  ['quarterly','2026-04-01','2026-04-01','2026-01-01','2026-03-31']]){
   const period=c.newsletterPeriod_(cadence,new Date(now+'T12:00:00Z'));assert.deepEqual([period.available,period.from,period.to],[available,from,to]);
 }
 const row={activa:true,periodicidad:'quarterly',actualizada:'2026-09-01'};assert.equal(c.newsletterNextDate_(row,new Date('2026-10-02T12:00:00Z')),'2026-10-07');
});
test('no prepara ni envía una trimestral antes del miércoles; reintentar no duplica la edición',()=>{
 const s=server(),c=s.c;c.Date=class extends Date{constructor(value='2026-10-02T12:00:00Z'){super(value);}static now(){return new Date('2026-10-02T12:00:00Z').getTime();}};
 c.settings_().newsletterEnabled=true;c.subscriptionRows_=()=>[{id:'sub',correo:'owner@bbva.com',periodicidad:'quarterly',nombre:'Mes',filtros:{coverage:''},activa:true,actualizada:'2026-09-01'}];
 c.sendNewsletterMail_=()=>{throw Error('No debe enviar todavía');};assert.equal(c.deliverNewsletterBatch_().pending,0);assert.equal(c.rows_('NewsletterEdiciones').length,0);
});
test('narrativa y evidencias históricas de Noticias permanecen al cambiar noticias y configuración',()=>{
 const s=server(),c=s.c,content=edition(s,'edition',[news(s),news(s,'two','México','BBVA lanza onboarding digital para empresas')]);
 const before=clean(c.getDashboard({view:'news',edition:'edition',initial:true}));add(s,'Noticias',{...news(s,'later'),fecha:'2026-09-20'});c.configuration_().geographies=[];c.configuration_().applicationScope=[];c.entityKey_=()=> 'Entidad cambiada';c.invalidateNews_();
 const after=clean(c.getDashboard({view:'news',edition:'edition',initial:true}));assert.deepEqual(after.context.editorial,clean(content.editorial));assert.deepEqual(after.items,before.items);assert.deepEqual(after.applicationScope,before.applicationScope);assert.equal(after.context.count,2);
 s.setEmail('other@bbva.com');assert.throws(()=>c.getDashboard({view:'news',edition:'edition'}),/no disponible/);
});
test('feedback es opcional, propio, deduplicado y administrable; no lee el corpus histórico al guardarse',()=>{
 const s=server(),c=s.c;edition(s);const sheet=s.sheets.get('NewsletterContenido');sheet.getRange=()=>{throw Error('Solo se requiere autorización de cabecera');};
 assert.equal(c.saveNewsletterFeedback({edition:'edition',rating:'',comment:''}).feedback,null);
 const first=c.saveNewsletterFeedback({edition:'edition',rating:'positive',comment:'<b>Útil</b>'}).feedback;assert.equal(first.comentario,'Útil');
 c.saveNewsletterFeedback({edition:'edition',rating:'negative',comment:'Mejorar cobertura'});assert.equal(c.rows_('NewsletterFeedback').length,1);assert.equal(c.rows_('NewsletterFeedback')[0].id,first.id);
 c.setNewsletterFeedbackState({id:first.id,state:'atendido'});assert.equal(c.getAdminFeedback().items[0].estado,'atendido');assert.throws(()=>c.saveNewsletterFeedback({edition:'edition',rating:'positive',comment:'a'.repeat(1001)}),/no válido/);
 s.setEmail('reader@bbva.com');assert.throws(()=>c.saveNewsletterFeedback({edition:'edition',rating:'positive',comment:''}),/no disponible/);assert.throws(()=>c.setNewsletterFeedbackState({id:first.id,state:'pendiente'}),/no autorizado/);assert.throws(()=>c.getAdminFeedback(),/no autorizado/);
});
test('las visitas de newsletter usan identidad autenticada, IDs estables y deduplicación de reenvíos',()=>{
 const s=server(),c=s.c;edition(s);const input=[{id:'event-entry-123456',edition:'edition',session:'session-123456789',event:'acceso',view:'news',email:'spoof@bbva.com'},{id:'event-radar-123456',edition:'edition',session:'session-123456789',event:'vista',view:'radar'}];
 c.recordEvents(input);s.cache.clear();c.recordEvents(input);assert.equal(c.rows_('NewsletterEventos').length,2);assert.ok(c.rows_('NewsletterEventos').every(row=>row.correo==='owner@bbva.com'));
 const metrics=c.getAdminLogs('accesses');assert.equal(metrics.total,1);assert.equal(metrics.metrics.cards.find(row=>row[0]==='Usuarios')[1],1);assert.equal(metrics.items[0].correo,'owner@bbva.com');
 s.setEmail('reader@bbva.com');assert.throws(()=>c.recordEvents(input),/no disponible/);
});
test('el feedback actualizado conserva su retención mientras elimina otro registro antiguo',()=>{
 const s=server(),c=s.c;edition(s);c.saveNewsletterFeedback({edition:'edition',rating:'positive',comment:''});const sheet=s.sheets.get('NewsletterFeedback');sheet.grid.push(['old','edition','owner@bbva.com','negative','Antiguo','2000-01-01','pendiente']);s.properties.RETENTION_DATE='';const job={id:'retention',table:5,position:2,removed:0,state:'Pendiente'};c.compactOperationalLogs_();assert.equal(c.rows_('NewsletterFeedback').length,2);assert.ok(c.rows_('NewsletterFeedback').some(row=>row.id==='old'));
});
test('traducción y categorización de Empresas preceden a la recuperación anual; los demás trabajos ceden entre lotes',()=>{
 const s=server(),c=s.c,work={pending:[{ciclo:'annual'}],jobs:[{id:'annual',tipo:'annual'}]};c.classificationReadyAt_=()=>0;assert.equal(c.backgroundTask_(work,false),'classification');c.classificationReadyAt_=()=>Infinity;
 c.requestTranslations_(true);assert.equal(c.backgroundTask_(work,false),'translation');s.properties.TRANSLATION_PRIORITY_REQUEST='';c.translationReadyAt_=()=>Infinity;c.taxonomyReadyAt_=()=>0;assert.equal(c.backgroundTask_(work,false),'taxonomy');assert.equal(c.backgroundTask_(work,true),'collection');
});
test('la traducción prioriza Empresas digital antes de Retail más reciente sin repetir variantes guardadas',()=>{
 const s=server(),c=s.c,business=news(s,'business'),retail=news(s,'retail','España','BBVA lanza una app de ahorro y tarjeta para particulares');business.etiquetas={generalista:true,digital:true,capacidades:['Empresas: Pagos']};retail.etiquetas={generalista:true,digital:true,capacidades:['Retail: Ahorro']};business.clasificacion=JSON.stringify(business.etiquetas);retail.clasificacion=JSON.stringify(retail.etiquetas);retail.fecha='2026-09-20';add(s,'Noticias',retail);add(s,'Noticias',business);
 const calls=[];c.LanguageApp={translate:html=>{calls.push(html);return html;}};c.requestTranslations_(true);c.translationBatch_();assert.match(calls[0],/pagos digitales para empresas/);drainSnapshots(c);assert.equal(c.translationJob_().state,'Completada');c.requestTranslations_();c.translationBatch_();assert.equal(calls.length,3);
});
test('una cuota diaria suspende ambos traductores y no se pierde la solicitud prioritaria',()=>{
 const s=server(),c=s.c,row=news(s);row.clasificacion=JSON.stringify(row.etiquetas);add(s,'Noticias',row);let calls=0;c.LanguageApp={translate(){calls++;throw Error('Service invoked too many times for one day: translate');}};
 c.requestTranslations_(true);c.translationBatch_();c.requestTranslations_(true);c.translationBatch_();c.requestTaxonomyTranslations_();c.taxonomyTranslationBatch_();assert.equal(calls,1);assert.ok(c.translationReadyAt_()>Date.now());assert.ok(c.taxonomyTranslationReadyAt_()>Date.now());assert.ok(s.properties.TRANSLATION_PRIORITY_REQUEST);
});
test('una solicitud recibida durante la traducción persiste para incorporar el siguiente contenido',()=>{
 const s=server(),c=s.c;add(s,'Noticias',news(s));c.requestTranslations_();c.LanguageApp={translate:html=>{s.properties.TRANSLATION_REQUEST=new Date(Date.now()+1000).toISOString();return html;}};c.translationBatch_();assert.ok(s.properties.TRANSLATION_REQUEST);drainSnapshots(c);assert.equal(c.translationJob_().state,'Completada');
});
test('la cola lee estados solo de trabajos activos y conserva posiciones físicas discontinuas',()=>{
 const s=server(),c=s.c;add(s,'Recargas',{id:'done',tipo:'annual',estado:'Parcial',total:1000,pendientes:0});add(s,'Recargas',{id:'active',tipo:'daily',estado:'Pendiente',total:2,pendientes:2});
 for(let i=0;i<1000;i++)add(s,'Recopilacion',{ciclo:'done',estado:'Completada'});for(let i=0;i<2;i++)add(s,'Recopilacion',{ciclo:'active',estado:'Pendiente',fuente:'Fuente',url:'https://example.com/'+i,prioridad:'2026-10-12'});
 const sheet=s.sheets.get('Recopilacion'),range=sheet.getRange.bind(sheet),reads=[];sheet.getRange=(...args)=>{reads.push(args);return range(...args);};const work=c.collectionWork_(Date.now());assert.equal(work.tasks.length,2);assert.deepEqual(Array.from(work.pending,row=>row.row),[1002,1003]);assert.ok(reads.every(([,column,size])=>column!==4||size===2));
 c.collectionFeeds_=()=>[];c.requestDailyCollection_();c.drainCollectionRequests_();assert.equal(c.rows_('Recopilacion').length,1002);assert.equal(c.collectionWork_(Date.now()).tasks.length,2);assert.equal(c.collectionJobs_().find(row=>row.id==='done').total,'1000');
});
test('una cuota diaria de URL Fetch pausa la cola sin amplificar llamadas ni consumir intentos',()=>{
 const s=server(),c=s.c,feed=c.feeds_().find(row=>row.kind==='rss');add(s,'Recargas',{id:'daily',tipo:'daily',estado:'Pendiente',total:1,pendientes:1,desde:'2026-10-01',hasta:'2026-10-13',inicio:new Date().toISOString()});add(s,'Recopilacion',{ciclo:'daily',fuente:feed.name,url:feed.url,estado:'Pendiente',intentos:0,prioridad:'2026-10-13'});
 let calls=0;c.UrlFetchApp={fetchAll(){calls++;throw Error('Service invoked too many times for one day: urlfetch');},fetch(){throw Error('No debe amplificar llamadas');}};c.collectionBatch_(c.collectionWork_(Date.now()));const row=c.rows_('Recopilacion')[0];assert.equal(row.estado,'Reintento programado');assert.equal(row.intentos,'0');assert.equal(c.collectionWork_(Date.now()).pending.length,0);assert.equal(calls,1);
});
test('el enlace de valoración abre una modal y guarda la valoración propia al enviar',async t=>{
 const s=server();edition(s);const a=await app(t,{location:{edition:'edition',view:'news',feedback:'positive'},configure({w,data}){const base=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,payload)=>method==='getDashboard'?{...data,...clean(s.c.getDashboard(payload))}:method==='saveNewsletterFeedback'?clean(s.c.saveNewsletterFeedback(payload)):base(method,payload);}});
 assert.equal(a.w.document.querySelector('#edition-narrative'),null);assert.equal(a.find('#feedback-dialog').open,true);assert.equal(a.find('#edition-feedback').elements.rating.value,'positive');await a.change('#edition-feedback [name="comment"]','Más señales de pagos');await a.submit('#edition-feedback');assert.equal(s.c.rows_('NewsletterFeedback').length,1);assert.equal(s.c.rows_('NewsletterFeedback')[0].edicion,'edition');assert.equal(a.find('#feedback-dialog').open,false);
});
test('incorporar una noticia de Empresas digital solicita traducción automáticamente',()=>{
 const s=server(),c=s.c,feed=c.feeds_().find(row=>row.kind==='rss'),row=news(s);row.clasificacion=JSON.stringify({generalista:true,digital:true,capacidades:['Empresas: Pagos']});
 add(s,'Recargas',{id:'daily',tipo:'daily',estado:'Pendiente',total:1,pendientes:1,desde:'2026-10-01',hasta:'2026-10-13',inicio:new Date().toISOString()});add(s,'Recopilacion',{ciclo:'daily',fuente:feed.name,url:feed.url,estado:'Pendiente',intentos:0,prioridad:'2026-10-13'});
 c.fetchFeedBatch_=()=>[{response:{}}];c.ingestFeed_=()=>({news:[vm.runInContext('RADAR.sheets.Noticias',c).map(key=>row[key]??'')],audit:[],evaluated:1,relevant:1,digital:1});
 assert.equal(c.collectionBatch_(c.collectionWork_(Date.now())).added,1);assert.ok(s.properties.TRANSLATION_REQUEST);assert.equal(s.properties.TRANSLATION_PRIORITY_REQUEST,'true');
});
test('Otras geografías en ediciones archivadas usa el ámbito congelado también al exportar',()=>{
 const s=server(),c=s.c;
 const items=[
  news(s,'spain','España','BBVA presenta una plataforma de pagos para empresas españolas'),
  news(s,'mexico','México','BBVA incorpora nuevas funcionalidades de cobros en México'),
  news(s,'italy','Italia','BBVA desarrolla una solución de tesorería para empresas italianas')
 ];
 const queryEdition={view:'news',from:'2026-09-01',to:'2026-09-30',segment:'Empresas e instituciones'};
 const content=c.newsletterContent_(items,queryEdition,'Selección',new Date(),'subscription','es','frozen-geography');
 c.saveNewsletterEdition_('frozen-geography','delivery','owner@bbva.com','Selección',queryEdition,'es',items,content.editorial);
 c.completeNewsletterEdition_('frozen-geography','Enviada');
 const original=content.editorial.scope;
 assert.ok(original[0].countries.includes('México'),'La prueba requiere México dentro del ámbito original');
 c.configuration_().applicationScope[0].countries=['España','Italia'];
 c.invalidateNews_();
 const query={view:'news',edition:'frozen-geography',country:'Otras geografías',newsGeography:'Otras geografías'};
 const response=c.getDashboard(query);
 assert.deepEqual(Array.from(response.items,row=>row.id),['italy']);
 const exported=c.exportNews(query);
 assert.equal(exported.count,1);
 assert.match(exported.csv,/italy/);
 assert.doesNotMatch(exported.csv,/mexico/);
 assert.deepEqual(clean(response.applicationScope),clean(original));
});
