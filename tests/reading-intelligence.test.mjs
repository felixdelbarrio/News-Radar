import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {heatmapPage,heatmapValue,HEATMAP_PAGE} from '../src/client/features/heatmap-model.js';
function server(){
 const s=storage(),c=s.c;c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;
}
function raw(id,entity='BBVA',date='2026-02-12'){return {id,entidad:entity,fecha:date,titular:entity+' lanza pagos digitales para empresas',extracto:'Nueva plataforma de pagos y cobros para empresas',url:'https://example.com/'+id,medio:'Editor',pais:'España',fuente:'Editor',idioma:'es',clasificacion:JSON.stringify({digital:true,generalista:true,capacidades:[]}),taxonomia:''};}
function add(s,rows){const keys=vm.runInContext('RADAR.sheets.Noticias',s.c);s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));}
function own(s,id='one',filters={entity:'BBVA'}){s.c.saveSubscription({id:undefined,name:'Mi selección '+id,periodicity:'weekly',active:true,filters});const rows=s.c.subscriptionRows_('owner@bbva.com');return rows.at(-1);}
function edition(s,id='edition-one',items){const rows=items||s.c.annotateNews_([raw('one'),raw('two','Santander')]);s.c.saveNewsletterEdition_(id,'delivery-one','owner@bbva.com','Pagos de febrero',{from:'2026-02-01',to:'2026-02-28'},'en',rows);s.c.completeNewsletterEdition_(id,'Enviada');return rows;}
test('la edición abre solo lo enviado, conserva período y etiquetas tras eliminar noticias y cambiar configuración; protege la identidad',()=>{
 const s=server(),c=s.c,rows=c.annotateNews_([raw('one'),raw('two','Santander')]);rows[0].taxonomia=[{id:'old',palanca:'Pagos y cobros',subpalanca:'Pagos archivados'}];edition(s,'edition-one',rows);
 add(s,[raw('new','BBVA',new Date().toISOString().slice(0,10))]);const data=c.getDashboard({view:'briefing',edition:'edition-one',initial:true,language:'en'});
 assert.equal(data.briefing.total,2);assert.equal(data.context.count,2);assert.equal(data.selection.from,'2026-02-01');assert.equal(data.selection.to,'2026-02-28');assert.equal(data.briefing.items[0].id,'one');assert.equal(data.subpalanca.includes('Pagos y cobros › Pagos archivados'),true);
 s.sheets.get('Noticias').grid.splice(1);c.invalidateNews_();const news=c.getDashboard({view:'news',edition:'edition-one',initial:true});assert.equal(news.total,2);assert.equal(news.items[0].taxonomia[0].id,'old');assert.ok(news.items.every(row=>row.id!=='new'));
 const refined=c.getDashboard({view:'news',edition:'edition-one',initial:false,from:'2026-02-01',to:'2026-02-28',entity:'Santander'});assert.equal(refined.total,1);assert.equal(refined.items[0].entidad,'Santander');assert.equal(c.exportNews({view:'news',edition:'edition-one',from:'2026-02-01',to:'2026-02-28'}).count,2);
 s.setEmail('other@bbva.com');assert.throws(()=>c.getDashboard({view:'news',edition:'edition-one',initial:true}),/no disponible/);assert.throws(()=>c.exportNews({view:'news',edition:'edition-one'}),/no disponible/);assert.throws(()=>c.newsletterEdition_('../invalid','owner@bbva.com'),/no disponible/);
});
test('los enlaces incluyen la edición y la gestión y baja conservan su destino; una edición sin envío aceptado no se muestra',()=>{
 const s=server(),c=s.c;c.configuration_().settings.newsletterAppUrl='https://script.google.com/macros/s/test/exec';const content=c.newsletter_( [raw('one')],{from:'2026-02-01',to:'2026-02-28'},'Canal',new Date(),'subscription','en','edition-one');
 assert.match(content.html,/\?edition=edition-one/);assert.match(content.text,/\?edition=edition-one/);assert.match(content.html,/\?view=subscriptions/);assert.match(content.html,/unsubscribe=subscription/);
 c.saveNewsletterEdition_('pending','delivery','owner@bbva.com','Pendiente',{},'es',content.items);assert.throws(()=>c.newsletterEdition_('pending','owner@bbva.com'),/no disponible/);c.completeNewsletterEdition_('pending','No enviado');assert.throws(()=>c.newsletterEdition_('pending','owner@bbva.com'),/no disponible/);
});
test('preferencias persistentes por usuario, alternativa predeterminada y suscripciones pausadas o eliminadas no contaminan otra cuenta',()=>{
 const s=server(),c=s.c,a=own(s,'BBVA'),b=own(s,'Santander',{entity:'Santander',palanca:''});
 const data=c.saveNewsPreference({preference:a.id,view:'briefing',language:'es'});assert.equal(data.personalization.active,a.id);assert.equal(data.selection.entity,'BBVA');assert.equal(c.rows_('Preferencias').length,1);assert.equal(c.getDashboard({view:'news',initial:true}).selection.entity,'BBVA');
 c.saveNewsPreference({preference:'default',view:'briefing'});assert.equal(c.getDashboard({view:'briefing',initial:true,preference:'default'}).selection.coverage,'digital');assert.equal(c.getDashboard({view:'briefing',initial:true,preference:'default'}).selection.segment,'Empresas e instituciones');
 c.saveNewsPreference({preference:b.id,view:'briefing'});assert.equal(c.getDashboard({view:'radar',initial:true,preference:b.id}).selection.entity,'Santander');c.deleteSubscription(b.id);assert.equal(c.getDashboard({view:'briefing',initial:true}).selection.entity,'BBVA');
 s.setEmail('other@bbva.com');assert.throws(()=>c.saveNewsPreference({preference:a.id,view:'news'}),/no disponible/);assert.equal(c.getDashboard({view:'briefing',initial:true}).context.mode,'current');assert.equal(c.getDashboard({view:'briefing',initial:true}).personalization.options.length,0);
});
test('entrega real guarda únicamente noticias no repetidas y el flujo aceptado habilita su lectura sin duplicar envíos',()=>{
 const s=server(),c=s.c,row=own(s),today=c.newsletterPeriod_('weekly',new Date()).to;s.sheets.get('Suscripciones').grid[1][6]='2000-01-01';c.configuration_().settings.newsletterEnabled=true;c.newsletterSender_=()=>({address:'sender@bbva.com',name:'Radar'});let content;
 c.sendNewsletterMail_=(_sender,_email,value)=>{content=value;return 'gmail-id';};add(s,[raw('new','BBVA',today)]);const result=c.deliverNewsletters_();assert.equal(result.accepted,1);assert.equal(c.rows_('NewsletterEdiciones').length,1);assert.equal(c.rows_('NewsletterEdiciones')[0].estado,'Enviada');assert.equal(c.rows_('NewsletterContenido').length,1);assert.equal(c.newsletterEdition_(content.editionId,'owner@bbva.com').items[0].id,'new');assert.equal(c.deliverNewsletters_().accepted,0);assert.equal(c.rows_('NewsletterEdiciones').length,1);
});
test('la prioridad diaria aplaza newsletters y evita preparar corpus o enviar correos; una solicitud llegada durante el envío cede entre destinatarios',()=>{
 const s=server(),c=s.c;c.configuration_().settings.newsletterEnabled=true;c.requestDailyCollection_();c.sendNewsletterMail_=()=>{throw Error('No se debe enviar');};assert.equal(c.deliverNewsletters_().state,'collection_priority');assert.equal(c.rows_('NewsletterEdiciones').length,0);assert.equal(c.ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='newsletterTick_').length,1);
 const other=server(),d=other.c;own(other,'first');d.saveAdminSubscription({email:'other@bbva.com',name:'Otro canal',periodicity:'weekly',filters:{entity:'BBVA'}});for(const row of other.sheets.get('Suscripciones').grid.slice(1))row[6]='2000-01-01';d.configuration_().settings.newsletterEnabled=true;add(other,[raw('new','BBVA',d.newsletterPeriod_('weekly',new Date()).to)]);d.newsletterSender_=()=>({address:'sender@bbva.com',name:'Radar'});d.sendNewsletterMail_=()=>{d.requestDailyCollection_();return 'gmail-id';};const result=d.deliverNewsletters_();assert.equal(result.accepted,1);assert.equal(result.pending,1);assert.equal(result.state,'collection_priority');
});
test('clasificación compartida en caché evita lecturas entre filtros, mantiene pesos y recupera una parte expulsada',()=>{
 const s=server(),c=s.c;add(s,Array.from({length:90},(_,i)=>({...raw(String(i)),extracto:'Texto '.repeat(400)})));c.cachedNewsRecords_();const reads=s.reads;const calls=[],range=s.sheets.get('Noticias').getRange.bind(s.sheets.get('Noticias'));s.sheets.get('Noticias').getRange=(...args)=>{calls.push(args);return range(...args);};
 const data=c.dashboardContent_({entity:'Santander'},[],'news');assert.equal(data.data.total,0);assert.equal(s.reads,reads);const restored=c.cachedNewsRecords_();assert.equal(restored.length,90);assert.equal('relevance' in restored[0],false);assert.ok(c.briefing_(restored).total>0);
 const part=[...s.cache.keys()].find(key=>key.startsWith('news-records:')&&/:\d+$/.test(key));s.cache.delete(part);assert.equal(c.cachedNewsRecords_().length,90);assert.ok(calls.length>0);const count=calls.length;c.invalidateNews_(false,false);c.cachedNewsRecords_();assert.equal(calls.length,count);c.invalidateNews_();c.cachedNewsRecords_();assert.ok(calls.length>count);
 assert.ok([...s.cache].filter(([key])=>key.startsWith('news-records:')).every(([,value])=>Buffer.byteLength(value)<=90000));
});
test('mapa disperso cuenta una vez por noticia y palanca, incluye todas las geografías y sus totales; paginación y porcentajes son acotados',()=>{
 const s=server(),c=s.c,p={id:'one',palanca:'Pagos y cobros',subpalanca:'Biometría'},q={id:'two',palanca:'Pagos y cobros',subpalanca:'Instantáneos'},rows=[{entidad:'BBVA',pais:'España',taxonomia:[p,q]},{entidad:'Santander',pais:'México',taxonomia:[p]},{entidad:'Santander',pais:'México',taxonomia:[]}];const data=c.taxonomyHeatmap_(rows);
 assert.equal(data.tagged,2);assert.equal(data.total,3);assert.equal(data.nodes.find(node=>node.level==='palanca').count,2);assert.equal(data.nodes.find(node=>node.subpalanca==='Biometría').count,2);assert.equal(data.entities[0].name,'BBVA');assert.equal(data.countries.find(row=>row.name==='México').total,2);
 const page=heatmapPage(data,'countries','palanca',20,20);assert.equal(page.rowPage,0);assert.equal(page.columns.length,1);assert.equal(heatmapValue(1,2,'share',2).share,50);assert.equal(heatmapValue(0,0,'count',1).level,0);assert.equal(heatmapValue(1,0,'count',1).share,0);assert.equal(heatmapValue(100,100,'share',1).level,4);
 const large={...data,nodes:Array.from({length:80},(_,i)=>({...data.nodes[0],id:String(i)})),entities:Array.from({length:80},()=>data.entities[0])},bounded=heatmapPage(large,'entities','palanca',1,1);assert.equal(bounded.rows.length,HEATMAP_PAGE.rows);assert.equal(bounded.columns.length,HEATMAP_PAGE.columns);
});

test('Novedades y newsletter predeterminadas priorizan canales digitales de todas las entidades de la última semana cuando no hay suscripciones',()=>{
 const s=server(),c=s.c,range=c.recentNewsRange_(),old=new Date(range.from+'T00:00:00Z');old.setUTCDate(old.getUTCDate()-1);
 c.configuration_().settings.defaultEntity='BBVA';c.configuration_().settings.defaultCountry='México';c.configuration_().settings.defaultTopic='Financiación';
 const general={...raw('general','Santander',range.from),titular:'Santander lanza financiación para empresas',extracto:'Nueva oferta de crédito para pymes',clasificacion:JSON.stringify({digital:false,generalista:true,capacidades:[]})};
 const digital=raw('digital','BBVA',range.to),expired={...general,id:'old',fecha:old.toISOString().slice(0,10)},retail={...general,id:'retail',titular:'Santander lanza una cuenta para particulares',extracto:'Oferta para particulares'};
 add(s,[general,digital,expired,retail]);
 const dashboard=c.getDashboard({view:'briefing',initial:true});assert.deepEqual(JSON.parse(JSON.stringify(dashboard.selection)),{segment:'Empresas e instituciones',coverage:'digital',...JSON.parse(JSON.stringify(range))});assert.equal(dashboard.context.mode,'current');assert.equal(dashboard.personalization.active,'default');assert.deepEqual(Array.from(dashboard.briefing.items,row=>row.id),['digital']);
 const defaults=c.subscriptionDefaults_();assert.deepEqual(JSON.parse(JSON.stringify(defaults.filters)),{segment:'Empresas e instituciones',coverage:'digital'});
 c.saveSubscription({name:defaults.name,periodicity:defaults.periodicity,filters:defaults.filters});const subscription=c.subscriptionRows_('owner@bbva.com').at(-1),query=c.subscriptionQuery_(subscription,new Date());assert.deepEqual(Object.fromEntries(Object.entries(query).filter(([,value])=>value)),{segment:'Empresas e instituciones',coverage:'digital',...JSON.parse(JSON.stringify(c.currentMonth_())),view:'news'});
 c.newsletterSender_=()=>({address:'sender@bbva.com',name:'Radar'});let mailed;c.sendNewsletterMail_=(_sender,_recipient,content)=>{mailed=content;return 'gmail-defaults';};const testMail=c.sendNewsletterTest();assert.equal(testMail.count,1);assert.deepEqual(Array.from(mailed.items,row=>row.id),['digital']);
 assert.equal(c.getDashboard({view:'briefing',coverage:'digital',from:range.from,to:range.to}).briefing.total,1);
});

test('la entrada directa usa la primera newsletter activa por orden de creación, incluso después de editarla o elegir otra; sin activas recupera los filtros comunes',()=>{
 const s=server(),c=s.c,first=own(s,'primera',{entity:'Santander',country:'España'}),second=own(s,'segunda',{entity:'BBVA'}),range=c.recentNewsRange_();
 add(s,[raw('santander','Santander',range.to),raw('bbva','BBVA',range.to)]);
 c.saveSubscription({id:first.id,name:'Primera editada',periodicity:'weekly',filters:first.filtros});
 const manual=c.saveNewsPreference({preference:second.id,view:'briefing'});assert.equal(manual.selection.entity,'BBVA');
 for(let i=0;i<2;i++){const direct=c.getDashboard({view:'briefing',initial:true});assert.equal(direct.personalization.active,first.id);assert.deepEqual(Array.from(direct.personalization.options,row=>row.id),[first.id,second.id]);assert.equal(direct.selection.entity,'Santander');assert.equal(direct.selection.country,'España');assert.equal(direct.selection.from,range.from);assert.equal(direct.selection.to,range.to);assert.deepEqual(Array.from(direct.briefing.items,row=>row.id),['santander']);}
 c.saveSubscription({id:first.id,name:'Primera pausada',periodicity:'weekly',active:false,filters:first.filtros});assert.equal(c.getDashboard({view:'briefing',initial:true}).personalization.active,second.id);
 c.deleteSubscription(second.id);const defaults=c.getDashboard({view:'briefing',initial:true});assert.equal(defaults.personalization.active,'default');assert.equal(defaults.selection.segment,'Empresas e instituciones');assert.equal(defaults.selection.from,range.from);assert.equal(defaults.selection.to,range.to);assert.equal(defaults.selection.entity,undefined);
 s.setEmail('other@bbva.com');assert.equal(c.getDashboard({view:'briefing',initial:true}).personalization.options.length,0);
});

test('la primera newsletter empresarial no impone el tema Empresas y pymes; ignora todos los temas obsoletos y conserva las ediciones enviadas',()=>{
 const s=server(),c=s.c,range=c.recentNewsRange_(),filters={segment:'Empresas e instituciones',topic:'Empresas y pymes'};
 const first=own(s,'empresas',filters);assert.equal(first.filtros.topic,undefined);
 s.sheets.get('Suscripciones').grid[1][3]=JSON.stringify(filters);
 const news={...raw('financiacion','Santander',range.to),titular:'Santander lanza financiación para empresas',extracto:'Nueva oferta de crédito para pymes',tema:'Financiación'};add(s,[news]);
 const dashboard=c.getDashboard({view:'briefing',initial:true});assert.equal(dashboard.selection.segment,'Empresas e instituciones');assert.equal(dashboard.selection.topic,undefined);assert.equal(dashboard.selection.from,range.from);assert.deepEqual(Array.from(dashboard.briefing.items,row=>row.id),['financiacion']);
 assert.equal(c.subscriptionQuery_(c.subscriptionRows_('owner@bbva.com')[0],new Date()).topic,undefined);assert.equal(JSON.parse(s.sheets.get('Suscripciones').grid[1][3]).topic,'Empresas y pymes');
 c.saveSubscription({id:first.id,name:'Empresas guardada',periodicity:'weekly',filters});assert.equal(JSON.parse(s.sheets.get('Suscripciones').grid[1][3]).topic,undefined);
 c.saveSubscription({id:first.id,name:'Financiación',periodicity:'weekly',filters:{...filters,topic:'Financiación'}});assert.equal(c.getDashboard({view:'briefing',initial:true}).selection.topic,undefined);
 const rows=c.annotateNews_([news]);rows[0].tema='Empresas y pymes';c.saveNewsletterEdition_('edition-business','delivery-business','owner@bbva.com','Empresas archivadas',{...filters,...range},'es',rows);c.completeNewsletterEdition_('edition-business','Enviada');const archived=c.getDashboard({view:'briefing',initial:true,edition:'edition-business'});assert.equal(archived.selection.topic,undefined);assert.equal(archived.briefing.total,1);
});
