import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {read,readServerScript} from '../scripts/source.mjs';
const seed=()=>JSON.parse(read('assets/configuration-defaults.json'));
test('inicializa solo claves ausentes, persiste en Sheets y reutiliza e invalida la caché versionada',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();assert.equal(s.sheets.size,13);const config=c.getConfiguration().config,reads=s.reads;c.getConfiguration();assert.equal(s.reads,reads);
  config.settings.defaultEntity='Qonto';config.topics.push({name:'Prueba editorial',terms:['innovación verificable'],enabled:true});c.saveConfiguration({config,revision:c.getConfiguration().revision});assert.equal(c.getConfiguration().config.settings.defaultEntity,'Qonto');
  c.initializeConfiguration();assert.equal(c.getConfiguration().config.settings.defaultEntity,'Qonto');assert.ok(c.getConfiguration().config.topics.some(row=>row.name==='Prueba editorial'));
  const sheet=s.sheets.get('Configuracion'),index=sheet.grid.findIndex(row=>row[0]==='settings'),settings=JSON.parse(sheet.grid[index][1]);settings.defaultEntity='Revolut';sheet.grid[index][1]=JSON.stringify(settings);
  c.configurationEdited_({range:{getSheet:()=>sheet}});assert.equal(c.getConfiguration().config.settings.defaultEntity,'Revolut');assert.ok(s.cache.size>=2);
});
test('configuración deniega lectores y rechaza catálogos incoherentes antes de escribir',()=>{
  const s=storage();s.c.initializeConfiguration();const original=JSON.stringify(s.sheets.get('Configuracion').grid);s.setEmail('reader@bbva.com');assert.throws(()=>s.c.getConfiguration(),/administrador/);assert.throws(()=>s.c.saveConfiguration({config:seed(),revision:'0'}),/administrador/);assert.throws(()=>s.c.initializeConfiguration(),/administrador/);
  s.setEmail('owner@bbva.com');for(const edit of [config=>config.entities[1].aliases.push('BBVA'),config=>config.entities[0].countries.push('País inexistente'),config=>config.settings.trendSeries=99,config=>config.signals[0].context='invalid',config=>config.feeds[0].domain='evil.com']){const config=seed();edit(config);assert.throws(()=>s.c.saveConfiguration({config,revision:s.c.getConfiguration().revision}),/Alias|País|trendSeries|contexto|Fuente|términos/);assert.equal(JSON.stringify(s.sheets.get('Configuracion').grid),original);}
});
test('cambiar catálogos modifica clasificación, tipos, segmentos y filtros del histórico sin recompilar',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const rows=[{fecha:'2026-10-09',pais:'España',entidad:'Qonto',medio:'Editor',titular:'Qonto lanza una nueva cuenta para autónomos',extracto:'',url:'https://example.com/q'}, {fecha:'2026-10-09',pais:'España',entidad:'N26',medio:'Editor',titular:'N26 lanza tarjeta para particulares',extracto:'',url:'https://example.com/n'},{fecha:'2026-10-09',pais:'España',entidad:'Revolut',medio:'Editor',titular:'Nuevo director de Revolut',extracto:'',url:'https://example.com/r'}];
  assert.equal(c.selectNews_(rows,{type:'Fintech',segment:'Empresas e instituciones',signal:'Lanzamiento de producto'}).length,1);assert.equal(c.selectNews_(rows,{type:'Neobanco',segment:'Retail',signal:'Lanzamiento de producto'}).length,1);assert.equal(c.newsDashboard_(c.annotateNews_(rows),{},c.feeds_(),'briefing').briefing.total,2);
  const config=c.getConfiguration().config;config.signals[0].terms=['comunicado inexistente'];c.saveConfiguration({config,revision:c.getConfiguration().revision});assert.equal(c.newsDashboard_(c.annotateNews_(rows),{},c.feeds_(),'briefing').briefing.total,0);
  config.entities.find(row=>row.name==='Qonto').type='Categoría propia';c.saveConfiguration({config,revision:c.getConfiguration().revision});assert.equal(c.selectNews_(rows,{type:'Categoría propia'}).length,1);
});
test('desactivar entidades o países elimina consultas futuras sin borrar noticias históricas',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const config=c.getConfiguration().config;config.entities.find(row=>row.name==='Qonto').enabled=false;config.geographies.find(row=>row.name==='México').enabled=false;c.saveConfiguration({config,revision:c.getConfiguration().revision});
  assert.ok(!c.feeds_().some(row=>row.entity==='Qonto'||row.country==='México'));assert.ok(c.configuredFeeds_().some(row=>row.entity==='Qonto'&&!row.enabled));
});
test('selecciones personales impiden suplantación y acceso cruzado; newsletter conserva fuentes y escapa HTML',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();s.setEmail('a@bbva.com');c.saveSubscription({name:'Mi canal',periodicity:'monthly',email:'forged@bbva.com',filters:{entity:'Qonto',segment:'Empresas e instituciones'}});const own=c.getSubscriptions();assert.equal(own[0].correo,'a@bbva.com');
  c.rows_=name=>name==='Noticias'?[{fecha:c.subscriptionQuery_(own[0],new Date()).from,pais:'España',entidad:'Qonto',medio:'Editor',titular:'Qonto lanza cuenta para autónomos <script>',extracto:'Texto de la fuente',url:'https://example.com/product'}]:s.sheets.get(name).grid.slice(1).map(row=>Object.fromEntries(['id','correo','nombre','filtros','periodicidad','activa','actualizada'].map((key,i)=>[key,String(row[i])])));
  const result=c.newsletter_(c.rows_('Noticias'),c.subscriptionQuery_(own[0],new Date()),own[0].nombre,new Date(),own[0].id);assert.equal(result.count,1);assert.match(result.html,/href="https:\/\/example.com\/product"/);assert.match(result.html,/&lt;script&gt;/);assert.doesNotMatch(result.html,/<script>/);
  s.setEmail('b@bbva.com');assert.equal(c.getSubscriptions().length,0);assert.throws(()=>c.sendSubscriptionTest(own[0].id),/no encontrada/);assert.throws(()=>c.deleteSubscription(own[0].id),/no encontrada/);s.setEmail('a@bbva.com');c.deleteSubscription(own[0].id);assert.equal(c.getSubscriptions().length,0);
});

test('una edición antigua no sobrescribe cambios guardados desde otra sesión',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const old=JSON.parse(JSON.stringify(c.getConfiguration())),fresh=JSON.parse(JSON.stringify(old));fresh.config.settings.defaultEntity='Qonto';c.saveConfiguration(fresh);old.config.settings.defaultEntity='Revolut';assert.throws(()=>c.saveConfiguration(old),/otra sesión/);assert.equal(c.getConfiguration().config.settings.defaultEntity,'Qonto');
});
test('las señales de titular evitan confundir artículos educativos o promesas del extracto con novedades',()=>{
  const s=storage(),{c}=s;c.initializeConfiguration();const rows=[{titular:'Qué son las finanzas de género',extracto:'Buscan reducir barreras de acceso a la financiación',entidad:'BBVA'}, {titular:'La cuenta para empresas de Qonto',extracto:'Qonto lanza nueva tarjeta para empresas',entidad:'Qonto'}, {titular:'BBVA y el municipio acuerdan impulsar la financiación de empresas',extracto:'Convenio de colaboración',entidad:'BBVA'}];
  rows.push({titular:'BBVA gana un premio por formación tecnológica para colaboradores',extracto:'Colaboración con una universidad',entidad:'BBVA'});
  const result=c.annotateNews_(rows);assert.equal(result[3].senales.length,0);assert.equal(result[0].senales.length,0);assert.equal(result[1].senales.length,0);assert.ok(result[2].senales.includes('Alianza estratégica'));
  const config=JSON.parse(JSON.stringify(c.getConfiguration()));config.config.signals[0].scope='fullText';c.saveConfiguration(config);assert.ok(c.annotateNews_(rows)[1].senales.includes('Lanzamiento de producto'));
});

test('newsletter selecciona siete días y conserva cierres naturales en la zona configurada',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const q=c.subscriptionQuery_({periodicidad:'monthly',filtros:{entity:'BBVA'}},new Date('2026-10-25T23:30:00Z'));assert.equal(q.to,'2026-10-26');assert.equal(q.from,'2026-10-20');assert.equal(q.entity,'BBVA');
 const leap=c.newsletterPeriod_('monthly',new Date('2024-03-01T10:00:00Z'));assert.equal(leap.from,'2024-02-01');assert.equal(leap.to,'2024-02-29');const week=c.newsletterPeriod_('weekly',new Date('2026-10-12T10:00:00Z'));assert.equal(week.from,'2026-10-05');assert.equal(week.to,'2026-10-11');
});
test('administración da altas y edita suscripciones; lectores no acceden a otros usuarios',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();s.book.insertSheet('Noticias').grid.push([]);const defaults=c.getNewsletterOptions().defaults;assert.equal(defaults.periodicity,'monthly');assert.equal(defaults.filters.entity,undefined);assert.equal(defaults.filters.segment,'Empresas e instituciones');assert.equal(defaults.filters.country,undefined);
 c.saveAdminSubscription({email:'equipo@bbva.com',name:'Equipo',filters:defaults.filters});let rows=c.getAdminSubscriptions();assert.equal(rows.length,1);c.saveAdminSubscription({id:rows[0].id,email:'equipo@bbva.com',name:'Pausada',active:false,periodicity:'weekly',filters:defaults.filters});rows=c.getAdminSubscriptions();assert.equal(rows[0].activa,false);assert.equal(rows[0].periodicidad,'weekly');
 assert.throws(()=>c.saveAdminSubscription({email:'outside@example.com',name:'Fuera',filters:{}}),/dominio/);s.setEmail('equipo@bbva.com');assert.equal(c.getSubscriptions().length,1);assert.throws(()=>c.getAdminSubscriptions(),/administrador/);assert.throws(()=>c.saveAdminSubscription({}),/administrador/);c.saveSubscription({id:rows[0].id,name:'Mía',periodicity:'monthly',active:true,filters:{}});assert.equal(c.getSubscriptions()[0].nombre,'[bIA] Últimos 7 días');
});

test('la entrega registra cada período antes de enviar y no duplica ni reintenta envíos inciertos',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const defaults=c.getConfiguration();defaults.config.settings.newsletterEnabled=true;c.saveConfiguration(defaults);
 const period=c.recentNewsRange_(new Date());let sent=0;c.newsletterSender_=()=>({address:'news-radar.group@bbva.com',name:'News Radar'});c.sendNewsletterMail_=()=>{sent++;return 'gmail-'+sent;};
 c.subscriptionRows_=()=>[{id:'uno',correo:'equipo@bbva.com',nombre:'Canal',periodicidad:'monthly',activa:true,actualizada:'2020-01-01T00:00:00Z',filtros:{entity:'BBVA'}},{id:'pausada',activa:false}];
 s.book.insertSheet('Noticias').grid.push([]);c.rows_=name=>name==='Noticias'?[{fecha:period.from,pais:'España',entidad:'BBVA',medio:'BBVA',titular:'BBVA lanza cuenta para empresas',extracto:'Nueva cuenta',url:'https://example.com/product'}]:s.sheets.get(name).grid.slice(1).map(row=>Object.fromEntries(['id','suscripcion','correo','desde','hasta','estado','fecha','detalle','contenido'].map((key,i)=>[key,row[i]])));
 c.deliverNewsletters_();c.deliverNewsletters_();assert.equal(sent,1);assert.equal(s.sheets.get('NewsletterEnvios').grid[1][5],'Enviada');
 c.rows_=name=>name==='Noticias'?[{fecha:period.from,pais:'España',entidad:'BBVA',medio:'BBVA',titular:'BBVA lanza tarjeta para empresas',extracto:'Nueva tarjeta',url:'https://example.com/card'}]:s.sheets.get(name).grid.slice(1).map(row=>Object.fromEntries(['id','suscripcion','correo','desde','hasta','estado','fecha','detalle','contenido'].map((key,i)=>[key,row[i]])));
 c.subscriptionRows_=()=>[{id:'fallo',correo:'equipo@bbva.com',nombre:'Canal',periodicidad:'monthly',activa:true,actualizada:'2020-01-01T00:00:00Z',filtros:{entity:'BBVA'}}];c.sendNewsletterMail_=()=>{sent++;throw Error('Resultado incierto');};c.deliverNewsletters_();c.deliverNewsletters_();assert.equal(sent,2);assert.equal(s.sheets.get('NewsletterEnvios').grid[2][5],'Revisar');
 c.newsletterBudget_=()=>0;c.subscriptionRows_=()=>[{id:'quota',activa:true,filtros:{}}];c.deliverNewsletters_();assert.equal(sent,2);
});

test('la próxima entrega diferencia altas nuevas, pendientes, rechazos y suscripciones pausadas',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const now=new Date('2026-10-10T10:00:00Z'),row={activa:true,periodicidad:'monthly',actualizada:'2026-10-10T09:00:00Z'};
 assert.equal(c.newsletterNextDate_(row,now),'2026-11-01');row.actualizada='2026-09-01T09:00:00Z';assert.equal(c.newsletterNextDate_(row,now),'2026-10-10');
 assert.equal(c.newsletterNextDate_(row,now,{id:'undefined:monthly:2026-09-01',estado:'Enviada'}),'2026-11-01');assert.equal(c.newsletterNextDate_(row,now,{id:'undefined:monthly:2026-09-01',estado:'No enviado'}),'2026-10-10');
 assert.equal(c.newsletterNextDate_({...row,periodicidad:'weekly',actualizada:now.toISOString()},now),'2026-10-12');assert.equal(c.newsletterNextDate_({...row,periodicidad:'daily',actualizada:now.toISOString()},now),'2026-10-11');assert.equal(c.newsletterNextDate_({...row,activa:false},now),'');
});
test('un rechazo confirmado se puede reintentar y los mensajes de selecciones distintas conservan su nombre',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const cfg=c.getConfiguration();cfg.config.settings.newsletterEnabled=true;c.saveConfiguration(cfg);s.book.insertSheet('Noticias').grid.push([]);
 const names=[],rows=['Canal A','Canal B'].map((nombre,i)=>({id:String(i),nombre,correo:'user'+i+'@bbva.com',periodicidad:'monthly',activa:true,actualizada:'2020-01-01',filtros:{}}));c.subscriptionRows_=()=>rows;c.newsletterSender_=()=>({});
 c.newsletterContent_=(_rows,_query,title)=>{names.push(title);return {count:1,html:title,text:title,items:[]};};c.sendNewsletterMail_=()=>{const error=Error('Rechazado');error.rejected=true;throw error;};
 assert.equal(c.deliverNewsletters_().state,'error');assert.equal(s.sheets.get('NewsletterEnvios').grid[1][5],'No enviado');c.sendNewsletterMail_=(_s,_r,content)=>{assert.match(content.html,/Canal [AB]/);return 'accepted';};
 const result=c.deliverNewsletters_();assert.equal(result.accepted,2);assert.deepEqual(names,['Canal A','Canal A','Canal B']);assert.equal(c.deliverNewsletters_().state,'no_due');
});

function deliveryFixture(){
 const s=storage(),{c}=s;c.initializeConfiguration();const config=c.getConfiguration();config.config.settings.newsletterEnabled=true;c.saveConfiguration(config);
 const news=s.book.insertSheet('Noticias');news.grid.push(c.RADAR?.sheets?.Noticias||['id','fecha','pais','medio','entidad','titular','extracto','tema','url','capturada','fuente']);
 const period=c.recentNewsRange_(new Date()),add=(id,title='BBVA lanza cuenta para empresas',url='https://example.com/'+id)=>news.grid.push([id,period.from,'España','BBVA','BBVA',title,'Nueva cuenta','',url,'','BBVA']);
 const subscriptions=[{id:'a',correo:'equipo@bbva.com',nombre:'Canal',periodicidad:'monthly',activa:true,actualizada:'2020-01-01',filtros:{entity:'BBVA'}}],sent=[];
 c.subscriptionRows_=()=>subscriptions;c.newsletterSender_=()=>({});c.sendNewsletterMail_=(_sender,email,content)=>{const record=s.sheets.get('NewsletterEnvios').grid.at(-1);assert.equal(record[5],'Enviando');assert.ok(JSON.parse(record[8]).length);sent.push({email,content});return 'gmail-'+sent.length;};
 return {...s,period,add,subscriptions,sent};
}
test('el mismo correo no repite noticias entre suscripciones; otro correo sí puede recibirlas',()=>{
 const f=deliveryFixture();f.add('first');f.subscriptions.push({...f.subscriptions[0],id:'b'}, {...f.subscriptions[0],id:'c',correo:'otro@bbva.com'});
 const result=f.c.deliverNewsletters_();assert.equal(result.accepted,2);assert.equal(result.empty,1);assert.equal(result.duplicates,1);assert.equal(f.sent.length,2);
 const history=f.sheets.get('NewsletterEnvios').grid;assert.equal(history[2][5],'Sin novedades');assert.match(history[2][7],/repetidas/);assert.equal(JSON.parse(history[2][8]).length,0);
 f.c.deliverNewsletters_();assert.equal(f.sent.length,2);
});
test('cambiar suscripción o periodicidad conserva la memoria del destinatario y envía solo noticias nuevas',()=>{
 const f=deliveryFixture();f.add('first');f.c.deliverNewsletters_();f.add('second','BBVA lanza tarjeta para empresas');
 f.subscriptions[0]={...f.subscriptions[0],id:'replacement',periodicidad:'weekly'};f.c.newsletterPeriod_=()=>f.period;
 const result=f.c.deliverNewsletters_();assert.equal(result.accepted,1);assert.equal(result.duplicates,1);assert.equal(f.sent[1].content.count,1);assert.match(f.sent[1].content.html,/lanza tarjeta/);assert.doesNotMatch(f.sent[1].content.html,/lanza cuenta/);
});
test('las pruebas no consumen contenido, las URLs se normalizan y el texto identifica copias en otro enlace',()=>{
 const f=deliveryFixture();f.add('first');const rows=f.c.annotateNews_(f.c.rows_('Noticias')),keys=f.c.newsletterItemKeys_(rows[0]);
 assert.equal(f.c.newsletterSentContent_([{id:'prueba:x',suscripcion:'',correo:'equipo@bbva.com',estado:'Enviada',contenido:JSON.stringify(keys)}]).size,0);
 assert.equal(f.c.newsletterUnseen_([{...rows[0],url:rows[0].url+'?utm_source=test'}],new Set(keys)).length,0);
 assert.equal(f.c.newsletterUnseen_([{...rows[0],url:'https://another.example/copy',titular:'BBVA LANZA CUENTA PARA EMPRESAS'}],new Set(keys)).length,0);
 assert.equal(f.c.newsletterSentContent_([{suscripcion:'a',correo:'equipo@bbva.com',estado:'No enviado',contenido:JSON.stringify(keys)}]).size,0);
});
test('un resultado incierto reserva las noticias también para otra suscripción del mismo correo',()=>{
 const f=deliveryFixture();f.add('first');f.c.sendNewsletterMail_=()=>{throw Error('Sin confirmación');};assert.equal(f.c.deliverNewsletters_().state,'error');
 f.subscriptions[0]={...f.subscriptions[0],id:'new'};f.c.sendNewsletterMail_=()=>{throw Error('No debe enviar de nuevo');};const result=f.c.deliverNewsletters_();assert.equal(result.empty,1);assert.equal(result.accepted,0);assert.equal(result.duplicates,1);
});
test('solo se reservan las noticias incluidas; el límite no bloquea las que quedaron fuera',()=>{
 const f=deliveryFixture(),config=f.c.getConfiguration();config.config.settings.briefingLimit=1;f.c.saveConfiguration(config);
 f.add('first');f.add('second','BBVA lanza tarjeta para empresas');f.subscriptions.push({...f.subscriptions[0],id:'b'});
 const result=f.c.deliverNewsletters_();assert.equal(result.accepted,2);assert.equal(f.sent[0].content.count,1);assert.equal(f.sent[1].content.count,1);assert.notEqual(f.sent[0].content.items[0].url,f.sent[1].content.items[0].url);
 assert.equal(JSON.parse(f.sheets.get('NewsletterEnvios').grid[1][8]).length,2);
});
test('un rechazo permite reintentar el contenido y un registro dañado impide enviar sin control',()=>{
 const f=deliveryFixture();f.add('first');f.c.sendNewsletterMail_=()=>{const error=Error('Rechazado');error.rejected=true;throw error;};f.c.deliverNewsletters_();
 f.c.sendNewsletterMail_=(_s,_email,content)=>{assert.equal(content.count,1);return 'accepted';};assert.equal(f.c.deliverNewsletters_().accepted,1);
 assert.throws(()=>f.c.newsletterSentContent_([{id:'bad',suscripcion:'a',correo:'equipo@bbva.com',estado:'Enviada',contenido:'["broken"]'}]),/Registro de contenido/);
});
test('el envío exige persistir la reserva antes de Gmail y el bloqueo impide ejecuciones simultáneas',()=>{
 const f=deliveryFixture();f.add('first');let flushed=false;
 f.c.SpreadsheetApp.flush=()=>{flushed=true;};f.c.sendNewsletterMail_=()=>{assert.equal(flushed,true);return 'confirmed';};assert.equal(f.c.deliverNewsletters_().accepted,1);
 f.c.LockService={getScriptLock:()=>({tryLock:()=>false})};f.c.rows_=()=>{throw Error('No leer mientras otro envío tiene el bloqueo');};assert.equal(f.c.deliverNewsletters_().state,'busy');
});
test('el lote clasifica únicamente noticias de los últimos siete días',()=>{
 const f=deliveryFixture();f.add('current');const sheet=f.sheets.get('Noticias');sheet.grid.push(['old','2020-01-01','España','BBVA','BBVA','BBVA lanza tarjeta para empresas','Nueva tarjeta','','https://example.com/old','','BBVA']);
 const annotate=f.c.annotateNews_;let classified=0;f.c.annotateNews_=rows=>{classified+=rows.length;return annotate(rows);};assert.equal(f.c.deliverNewsletters_().accepted,1);assert.equal(classified,1);
});

test('los envíos reales vacíos se omiten sin validar alias ni contactar Gmail',()=>{
 const f=deliveryFixture();f.c.newsletterSender_=()=>{throw Error('No consultar Gmail sin novedades');};
 const result=f.c.deliverNewsletters_();assert.equal(result.empty,1);assert.equal(result.accepted,0);assert.equal(f.sent.length,0);assert.equal(f.sheets.get('NewsletterEnvios').grid[1][5],'Sin novedades');
});
test('newsletter incluye el límite de siete días y excluye noticias anteriores y futuras',()=>{
 const f=deliveryFixture(),sheet=f.sheets.get('Noticias'),range=f.c.recentNewsRange_(new Date());f.add('boundary');
 const date=new Date(range.from+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-1);
 for(const [id,day] of [['old',date.toISOString().slice(0,10)],['future','2099-01-01']])sheet.grid.push([id,day,'España','BBVA','BBVA','BBVA lanza tarjeta para empresas','Nueva tarjeta','','https://example.com/'+id,'','BBVA']);
 const result=f.c.deliverNewsletters_();assert.equal(result.accepted,1);assert.equal(f.sent[0].content.count,1);assert.equal(f.sent[0].content.items[0].fecha,range.from);
 assert.equal(f.sheets.get('NewsletterEnvios').grid[1][3],range.from);assert.equal(f.sheets.get('NewsletterEnvios').grid[1][4],range.to);
});

test('el idioma del destinatario cambia los literales del correo sin reiniciar el control de duplicados',()=>{
 const f=deliveryFixture();f.add('language');f.subscriptions[0].idioma='en';f.subscriptions.push({...f.subscriptions[0],id:'tr',idioma:'tr'});
 let result=f.c.deliverNewsletters_();assert.equal(result.accepted,1);assert.equal(result.empty,1);assert.match(f.sent[0].content.html,/lang="en"/);
 f.subscriptions[0]={...f.subscriptions[0],id:'changed',idioma:'tr'};result=f.c.deliverNewsletters_();assert.equal(result.accepted,0);assert.equal(f.sent.length,1);
 f.add('new-language','BBVA lanza tarjeta para empresas');f.subscriptions[0].id='new-tr';result=f.c.deliverNewsletters_();assert.equal(result.accepted,1);assert.match(f.sent[1].content.html,/lang="tr"/);assert.equal(f.sent[1].content.count,1);
});

test('la actualización explícita de idiomas conserva catálogos propios y fuentes desactivadas y es idempotente',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();let snapshot=c.getConfiguration();snapshot.config.feeds=snapshot.config.feeds.filter(row=>row.id!=='bbva-english');snapshot.config.topics[0].terms=['personalizado'];snapshot.config.topics.push({name:'Propio',terms:['propio'],enabled:true});snapshot.config.settings.searchTerms=['seguimiento propio'];snapshot.config.feeds[0].enabled=false;c.saveConfiguration(snapshot);
 c.initializeLanguages();const updated=c.getConfiguration();assert.ok(updated.config.topics[0].terms.includes('personalizado'));assert.ok(updated.config.topics[0].terms.includes('outage'));assert.ok(updated.config.topics.some(row=>row.name==='Propio'));assert.equal(updated.config.feeds[0].enabled,false);assert.equal(updated.config.feeds.filter(row=>row.id==='bbva-english').length,1);assert.ok(updated.config.settings.searchTerms.includes('seguimiento propio'));
 c.initializeLanguages();assert.equal(c.getConfiguration().revision,updated.revision);s.setEmail('reader@bbva.com');assert.throws(()=>c.initializeLanguages(),/administrador/);
});

test('inicializar prioridades conserva íntegra la recuperación anual que ya estaba en curso',()=>{
 const s=storage(),{c}=s;c.initializeConfiguration();const queue=s.sheets.get('Recopilacion');
 const old=['cycle','Fuente','https://news.google.com/rss/search?q=after%3A2025-10-01%20before%3A2025-10-09','Completada','1','2026-10-11',10,3,''];
 const recent=[...old];recent[2]='https://news.google.com/rss/search?q=after%3A2026-10-01%20before%3A2026-10-09';recent[3]='Pendiente';queue.grid.push([...old],[...recent]);
 c.initializeCollectionQueue_();assert.deepEqual(queue.grid[1].slice(0,9),old);assert.equal(queue.grid[1][9],'2025-10-08');assert.equal(queue.grid[2][9],'2026-10-08');
 c.initializeCollectionQueue_();assert.equal(queue.grid.length,3);queue.grid.push(['cycle','RSS','https://bbva.com/rss','Pendiente',0,'',0,0,'']);c.initializeCollectionQueue_();assert.equal(queue.grid[3][9],'2026-10-08');
});
