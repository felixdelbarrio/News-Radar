import {annotateFixtures,newsletterFixture,canonicalFixtures} from './helpers/canonical-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage as createStorage} from './helpers/delivery.mjs';
import {TestDate as Date} from './helpers/clock.mjs';
function storage(){const s=createStorage();s.c.Date=Date;return s;}
import {heatmapPage,heatmapValue,HEATMAP_PAGE} from '../src/client/features/heatmap-model.js';
function server(){
 const s=storage(),c=s.c;c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;
}
function raw(id,entity='BBVA',date='2026-02-12'){return {id,entidad:entity,fecha:date,titular:(entity==='Santander'?'Banco Santander':entity)+' lanza pagos digitales para empresas',extracto:'Nueva plataforma de pagos y cobros para empresas',url:'https://example.com/'+id,medio:'Editor',pais:'España',fuente:'Editor',idioma:'es',clasificacion:JSON.stringify({digital:true,generalista:true,capacidades:["Empresas: Pagos"]}),taxonomia:''};}
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));}
function own(s,id='one',filters={entity:'BBVA'}){s.c.saveSubscription({id:undefined,name:'Mi selección '+id,periodicity:'fortnightly',active:true,filters});const rows=s.c.subscriptionRows_('owner@bbva.com');return rows.at(-1);}
function edition(s,id='edition-one',items){const rows=items||annotateFixtures(s.c,[raw('one'),raw('two','Santander')]);s.c.saveNewsletterEdition_(id,'delivery-one','owner@bbva.com','Pagos de febrero',{from:'2026-02-01',to:'2026-02-28'},'en',rows);s.c.completeNewsletterEdition_(id,'Enviada');return rows;}
test('una edición conserva el bloque sin suboperativa sin ofrecerlo como funcionalidad ni corromper su traducción',()=>{
 const s=server(),c=s.c,rows=annotateFixtures(c,[raw('child'),raw('parent','Santander')]),block='01.Home',child='01.01.Dashboard';
 rows[0].taxonomia=[{id:'child',palanca:block,subpalanca:child}];rows[1].taxonomia=[{id:'parent',palanca:block,subpalanca:''}];
 c.taxonomyTranslations_=()=>({en:{[block]:'Home',[child]:'Dashboard'}});edition(s,'parent-only',rows);
 const saved=c.newsletterEdition_('parent-only','owner@bbva.com');assert.equal(saved.names.en[block],'Home');assert.equal(saved.names.en[block+' › '+child],'Home › Dashboard');assert.equal(Object.hasOwn(saved.names.en,''),false);
 const query={view:'news',edition:'parent-only',initial:true},data=c.getDashboard(query);
 assert.deepEqual([...data.palanca],[block]);assert.deepEqual([...data.subpalanca],[block+' › '+child]);assert.equal(data.total,2);
 assert.equal(c.getDashboard({...query,palanca:block}).total,2);const filtered=c.getDashboard({...query,subpalanca:data.subpalanca[0]});assert.equal(filtered.total,1);assert.equal(filtered.items[0].id,'child');
});
test('la edición abre solo lo enviado, conserva período y etiquetas tras eliminar noticias y cambiar configuración; protege la identidad',()=>{
 const s=server(),c=s.c,rows=annotateFixtures(c,[raw('one'),raw('two','Santander')]);rows[0].taxonomia=[{id:'old',palanca:'Pagos y cobros',subpalanca:'Pagos archivados'}];edition(s,'edition-one',rows);
 add(s,[raw('new','BBVA',new Date().toISOString().slice(0,10))]);const data=c.getDashboard({view:'news',edition:'edition-one',initial:true,language:'en'});
 assert.equal(data.total,2);assert.equal(data.context.count,2);assert.equal(data.selection.from,'2026-02-01');assert.equal(data.selection.to,'2026-02-28');assert.equal(data.items[0].id,'one');assert.equal(data.subpalanca.includes('Pagos y cobros › Pagos archivados'),true);
 s.sheets.get('Noticias').grid.splice(1);c.invalidateNews_();const news=c.getDashboard({view:'news',edition:'edition-one',initial:true});assert.equal(news.total,2);assert.equal(news.items[0].taxonomia[0].id,'old');assert.ok(news.items.every(row=>row.id!=='new'));
 const refined=c.getDashboard({view:'news',edition:'edition-one',initial:false,from:'2026-02-01',to:'2026-02-28',entity:'Santander'});assert.equal(refined.total,1);assert.equal(refined.items[0].entidad,'Santander');assert.equal(c.exportNews({view:'news',edition:'edition-one',from:'2026-02-01',to:'2026-02-28'}).count,2);
 s.setEmail('other@bbva.com');assert.throws(()=>c.getDashboard({view:'news',edition:'edition-one',initial:true}),/no disponible/);assert.throws(()=>c.exportNews({view:'news',edition:'edition-one'}),/no disponible/);assert.throws(()=>c.newsletterEdition_('../invalid','owner@bbva.com'),/no disponible/);
});
test('los enlaces incluyen la edición y la gestión y baja conservan su destino; una edición sin envío aceptado no se muestra',()=>{
 const s=server(),c=s.c;c.configuration_().settings.newsletterAppUrl='https://script.google.com/macros/s/test/exec';const content=newsletterFixture(c, [raw('one')],{from:'2026-02-01',to:'2026-02-28'},'Canal',new Date(),'subscription','en','edition-one');
 assert.match(content.html,/\?edition=edition-one/);assert.match(content.text,/\?edition=edition-one/);assert.match(content.html,/\?view=subscriptions/);assert.match(content.html,/unsubscribe=subscription/);
 c.saveNewsletterEdition_('pending','delivery','owner@bbva.com','Pendiente',{},'es',content.items);assert.throws(()=>c.newsletterEdition_('pending','owner@bbva.com'),/no disponible/);c.completeNewsletterEdition_('pending','No enviado');assert.throws(()=>c.newsletterEdition_('pending','owner@bbva.com'),/no disponible/);
});
test('la suscripción no personaliza la entrada de ninguna vista',()=>{const s=server(),c=s.c;own(s);for(const view of ['briefing','news','radar']){const data=c.getDashboard({view,initial:true});assert.equal(data.selection.entity,undefined);assert.ok(!data.selection.country);}});
test('entrega real guarda únicamente noticias no repetidas y el flujo aceptado habilita su lectura sin duplicar envíos',()=>{
 const s=server(),c=s.c,row=own(s),today=c.newsletterPeriod_('fortnightly',new Date()).to;s.sheets.get('Suscripciones').grid[1][6]='2000-01-01';c.configuration_().settings.newsletterEnabled=true;c.newsletterSender_=()=>({address:'sender@bbva.com',name:'Radar'});let content;
 c.sendNewsletterMail_=(_sender,_email,value)=>{content=value;return 'gmail-id';};add(s,[raw('new','BBVA',today)]);const result=c.deliverNewsletterBatch_();assert.equal(result.accepted,1);assert.equal(c.rows_('NewsletterEdiciones').length,1);assert.equal(c.rows_('NewsletterEdiciones')[0].estado,'Enviada');assert.equal(c.rows_('NewsletterContenido').length,1);assert.equal(c.newsletterEdition_(content.editionId,'owner@bbva.com').items[0].id,'new');assert.equal(c.deliverNewsletterBatch_().accepted,0);assert.equal(c.rows_('NewsletterEdiciones').length,1);
});
test('la prioridad diaria aplaza newsletters y evita preparar corpus o enviar correos; una solicitud llegada durante el envío cede entre destinatarios',()=>{
 const s=server(),c=s.c;c.configuration_().settings.newsletterEnabled=true;c.requestDailyCollection_();c.sendNewsletterMail_=()=>{throw Error('No se debe enviar');};assert.equal(c.deliverNewsletterBatch_().state,'collection_priority');assert.equal(c.rows_('NewsletterEdiciones').length,0);assert.equal(c.ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='backgroundTick_').length,1);
 const other=server(),d=other.c;own(other,'first');d.saveAdminSubscription({email:'other@bbva.com',name:'Otro canal',periodicity:'fortnightly',filters:{entity:'BBVA'}});for(const row of other.sheets.get('Suscripciones').grid.slice(1))row[6]='2000-01-01';d.configuration_().settings.newsletterEnabled=true;add(other,[raw('new','BBVA',d.newsletterPeriod_('fortnightly',new Date()).to)]);d.newsletterSender_=()=>({address:'sender@bbva.com',name:'Radar'});d.sendNewsletterMail_=()=>{d.requestDailyCollection_();return 'gmail-id';};const result=d.deliverNewsletterBatch_();assert.equal(result.accepted,1);assert.equal(result.pending,1);assert.equal(result.state,'collection_priority');
});
test('clasificación compartida en caché evita lecturas entre filtros, mantiene pesos y recupera una parte expulsada',()=>{
 const s=server(),c=s.c;add(s,Array.from({length:90},(_,i)=>({...raw(String(i)),extracto:'Texto '.repeat(400)})));c.cachedNewsRecords_();const reads=s.reads;const calls=[],range=s.sheets.get('Noticias').getRange.bind(s.sheets.get('Noticias'));s.sheets.get('Noticias').getRange=(...args)=>{calls.push(args);return range(...args);};
 const data=c.dashboardContent_({entity:'Santander'},[],'news');assert.equal(data.data.total,0);assert.equal(s.reads,reads);const restored=c.cachedNewsRecords_();assert.equal(restored.length,90);assert.equal('relevance' in restored[0],false);assert.ok(c.briefing_(restored).total>0);
 const part=[...s.cache.keys()].find(key=>key.startsWith('news-records:')&&!key.includes(':index:')&&key.split(':').length===5&&/:\d+$/.test(key));s.cache.delete(part);assert.equal(c.cachedNewsRecords_().length,90);assert.ok(calls.length>0);const count=calls.length;c.invalidateNews_(false,false);c.cachedNewsRecords_();assert.equal(calls.length,count);c.invalidateNews_();c.cachedNewsRecords_();assert.ok(calls.length>count);
 assert.ok([...s.cache].filter(([key])=>key.startsWith('news-records:')).every(([,value])=>Buffer.byteLength(value)<=90000));
});
test('mapa disperso cuenta una vez por noticia y palanca, incluye todas las geografías y sus totales; paginación y porcentajes son acotados',()=>{
 const s=server(),c=s.c,p={id:'one',palanca:'Pagos y cobros',subpalanca:'Biometría'},q={id:'two',palanca:'Pagos y cobros',subpalanca:'Instantáneos'},rows=[{entidad:'BBVA',pais:'España',taxonomia:[p,q]},{entidad:'Santander',pais:'México',taxonomia:[p]},{entidad:'Santander',pais:'México',taxonomia:[]}];const data=c.taxonomyHeatmap_(rows);
 assert.equal(data.tagged,2);assert.equal(data.total,3);assert.equal(data.nodes.find(node=>node.level==='palanca').count,2);assert.equal(data.nodes.find(node=>node.subpalanca==='Biometría').count,2);assert.equal(data.entities[0].name,'BBVA');assert.equal(data.countries.find(row=>row.name==='México').total,2);
 const page=heatmapPage(data,'countries','palanca',20,20);assert.equal(page.rowPage,0);assert.equal(page.columns.length,1);assert.equal(heatmapValue(1,2,'share',2).share,50);assert.equal(heatmapValue(0,0,'count',1).level,0);assert.equal(heatmapValue(1,0,'count',1).share,0);assert.equal(heatmapValue(100,100,'share',1).level,4);
 const large={...data,nodes:Array.from({length:80},(_,i)=>({...data.nodes[0],id:String(i)})),entities:Array.from({length:80},()=>data.entities[0])},bounded=heatmapPage(large,'entities','palanca',1,1);assert.equal(bounded.rows.length,HEATMAP_PAGE.rows*2);assert.equal(bounded.columns.length,HEATMAP_PAGE.columns);
});

test('Novedades y newsletter predeterminadas priorizan canales digitales de todas las entidades de la quincena en curso cuando no hay suscripciones',()=>{
 const s=server(),c=s.c,range=c.dashboardPeriod_('briefing'),old=new Date(range.from+'T00:00:00Z');old.setUTCDate(old.getUTCDate()-1);
 const general={...raw('general','Santander',range.from),titular:'Banco Santander lanza financiación para empresas',extracto:'Nueva oferta de crédito para pymes',clasificacion:JSON.stringify({digital:false,generalista:true,capacidades:["Empresas: Pagos"]})};
 const digital=raw('digital','BBVA',range.to),expired={...general,id:'old',fecha:old.toISOString().slice(0,10)},retail={...general,id:'retail',titular:'Banco Santander lanza una cuenta para particulares',extracto:'Oferta para particulares'};
 add(s,[general,digital,expired,retail]);
 const dashboard=c.getDashboard({view:'briefing',initial:true});assert.deepEqual(JSON.parse(JSON.stringify(dashboard.selection)),{segment:'Empresas e instituciones',coverage:'digital',...JSON.parse(JSON.stringify(range))});assert.equal(dashboard.context.mode,'current');assert.equal(dashboard.personalization,undefined);assert.deepEqual(Array.from(dashboard.briefing.items,row=>row.id),['digital']);
 const defaults=c.subscriptionDefaults_();assert.deepEqual(JSON.parse(JSON.stringify(defaults.filters)),{});
 c.saveSubscription({name:defaults.name,periodicity:defaults.periodicity,filters:defaults.filters});const subscription=c.subscriptionRows_('owner@bbva.com').at(-1),query=c.subscriptionQuery_({...subscription,periodicidad:'quarterly'},new Date());assert.deepEqual(Object.fromEntries(Object.entries(query).filter(([,value])=>value)),{segment:'Empresas e instituciones',coverage:'digital',from:c.newsletterWindow('quarterly',c.recordDay(new Date(),'Europe/Madrid')).from,to:c.newsletterWindow('quarterly',c.recordDay(new Date(),'Europe/Madrid')).to,view:'news'});
 c.newsletterSender_=()=>({address:'sender@bbva.com',name:'Radar'});let mailed;c.sendNewsletterMail_=(_sender,_recipient,content)=>{mailed=content;return 'gmail-defaults';};const testMail=c.sendNewsletterTest({cadence:'fortnightly'});assert.equal(testMail.count,0);assert.equal(mailed,undefined);
 assert.equal(c.getDashboard({view:'briefing',coverage:'digital',from:range.from,to:range.to}).briefing.total,1);
});

test('alta, pausa y baja no cambian las selecciones iniciales de lectura',()=>{const s=server(),c=s.c,range=c.dashboardPeriod_('briefing');add(s,[raw('s','Santander',range.to),raw('b','BBVA',range.to)]);for(const active of [true,false]){c.saveSubscription({country:'España',active,filters:{entity:'Santander'}});const direct=c.getDashboard({view:'briefing',initial:true});assert.equal(direct.selection.entity,undefined);assert.equal(direct.briefing.total,2);}c.deleteSubscription(c.getSubscriptions()[0].id);assert.equal(c.getDashboard({view:'briefing',initial:true}).briefing.total,2);});

test('la primera newsletter empresarial no impone el tema Empresas y pymes; ignora todos los temas obsoletos y conserva las ediciones enviadas',()=>{
 const s=server(),c=s.c,range=c.dashboardPeriod_('briefing'),filters={segment:'Empresas e instituciones',topic:'Empresas y pymes'};
 const first=own(s,'empresas',filters);assert.equal(first.filtros.topic,undefined);
 s.sheets.get('Suscripciones').grid[1][3]=JSON.stringify(filters);
 const news={...raw('financiacion','Santander',range.to),titular:'Banco Santander lanza financiación para empresas',extracto:'Nueva oferta de crédito para pymes',tema:'Financiación'};add(s,[news]);
 const dashboard=c.getDashboard({view:'briefing',initial:true});assert.equal(dashboard.selection.segment,'Empresas e instituciones');assert.equal(dashboard.selection.topic,undefined);assert.equal(dashboard.selection.from,c.newsletterWindow('fortnightly',c.recordDay(new Date(),'Europe/Madrid')).from);assert.deepEqual(Array.from(dashboard.briefing.items,row=>row.id),['financiacion']);
 assert.equal(c.subscriptionQuery_({...c.subscriptionRows_('owner@bbva.com')[0],periodicidad:'fortnightly'},new Date()).topic,undefined);assert.equal(JSON.parse(s.sheets.get('Suscripciones').grid[1][3]).topic,'Empresas y pymes');
 c.saveSubscription({id:first.id,name:'Empresas guardada',periodicity:'fortnightly',filters});assert.equal(JSON.parse(s.sheets.get('Suscripciones').grid[1][3]).topic,undefined);
 c.saveSubscription({id:first.id,name:'Financiación',periodicity:'fortnightly',filters:{...filters,topic:'Financiación'}});assert.equal(c.getDashboard({view:'briefing',initial:true}).selection.topic,undefined);
 const rows=annotateFixtures(c,[news]);rows[0].tema='Empresas y pymes';c.saveNewsletterEdition_('edition-business','delivery-business','owner@bbva.com','Empresas archivadas',{...filters,...range},'es',rows);c.completeNewsletterEdition_('edition-business','Enviada');const archived=c.getDashboard({view:'briefing',initial:true,edition:'edition-business'});assert.equal(archived.selection.topic,undefined);assert.equal(archived.briefing.total,1);
});
