import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {TestDate} from './helpers/clock.mjs';
import {app,tick} from './helpers/app.mjs';
const plain=value=>JSON.parse(JSON.stringify(value));
function migrated(){
 const s=storage(),c=s.c;c.Date=TestDate;c.initializeConfiguration();c.saveSubscription({country:'España'});const sheet=s.sheets.get('Suscripciones'),first=sheet.grid[1];first[6]='2020-01-01T00:00:00Z';const removed=[...first];removed[0]='removed';removed[3]=JSON.stringify({country:'España',aliases:['nested']});sheet.grid.push(removed);c.initializeSubscriptions_(sheet);return s;
}
for(const state of ['Enviada','Sin novedades','Enviando','Revisar','No enviado','Bloqueada'])test('el historial consolidado respeta '+state+' bajo cualquiera de sus IDs',()=>{
 const {c}=migrated(),row=c.subscriptionRows_()[0],now=new TestDate();assert.deepEqual(plain(row.filtros.aliases),['removed','nested']);
 const deliveries=['fortnightly','quarterly','yearly'].map(periodicidad=>{const period=c.newsletterPeriod_(periodicidad,now);return {id:c.newsletterDeliveryId_({...row,id:'nested',periodicidad},period),suscripcion:'nested',correo:row.correo,estado:state,desde:period.from,hasta:period.to};});
 const plan=c.newsletterDeliveryPlan_(now,deliveries);assert.equal(plan.planned.length,3);assert.equal(plan.due.length,['No enviado','Bloqueada'].includes(state)?3:0);for(const item of plan.planned)assert.equal(item.attempt.estado,state);
 const otherPeriod=deliveries.map(item=>({...item,id:item.id.replace(/\d{4}-\d{2}-\d{2}$/,'2001-01-01')}));assert.equal(c.newsletterDeliveryPlan_(now,otherPeriod).due.length,3);
});
test('un envío completado bajo un alias domina reintentos de otros IDs y no se vuelve a preparar ni enviar',()=>{
 const s=migrated(),c=s.c,row=c.subscriptionRows_()[0],now=new TestDate(),deliveries=[];c.settings_().newsletterEnabled=true;
 for(const periodicidad of ['fortnightly','quarterly','yearly']){const period=c.newsletterPeriod_(periodicidad,now);for(const [id,estado] of [['nested','Enviada'],[row.id,'No enviado'],['removed','Sin novedades'],['removed','Bloqueada'],['nested','Revisar']])deliveries.push({id:c.newsletterDeliveryId_({...row,id,periodicidad},period),suscripcion:id,correo:row.correo,estado,desde:period.from,hasta:period.to,fecha:'2026-10-01'});}
 c.append_('NewsletterEnvios',deliveries.map(row=>vm.runInContext('RADAR.sheets.NewsletterEnvios',c).map(key=>row[key]||'')));c.newsletterSender_=()=>{throw Error('No debe preparar correo');};c.newsletterContent_=()=>{throw Error('No debe preparar contenido');};const count=c.rows_('NewsletterEnvios').length;
 assert.equal(c.newsletterDeliveryPlan_(now,deliveries).due.length,0);assert.equal(c.deliverNewsletterBatch_().state,'no_due');assert.equal(c.rows_('NewsletterEnvios').length,count);const progress=c.getNewsletterProgress();assert.equal(progress.job.accepted,3);assert.equal(progress.job.pending,0);assert.equal(c.getSubscriptions()[0].nextDelivery,'2026-10-19');
});
test('el administrador cambia el destinatario por ID conservando identidad y alias, y rechaza colisiones sin escribir',()=>{
 const s=migrated(),c=s.c,row=c.subscriptionRows_()[0];c.saveAdminSubscription({id:row.id,email:'replacement@bbva.com',country:'México',language:'en'});const edited=c.subscriptionRows_()[0];assert.equal(edited.id,row.id);assert.equal(edited.correo,'replacement@bbva.com');assert.deepEqual(plain(edited.filtros.aliases),['removed','nested']);assert.equal(edited.idioma,'en');assert.equal(edited.filtros.country,'México');
 c.saveAdminSubscription({email:'other@bbva.com'});const before=JSON.stringify(s.sheets.get('Suscripciones').grid);for(const input of [{id:row.id,email:'other@bbva.com'},{id:'missing',email:'new@bbva.com'}])assert.throws(()=>c.saveAdminSubscription(input),/existe|no encontrada/);assert.equal(JSON.stringify(s.sheets.get('Suscripciones').grid),before);s.setEmail('other@bbva.com');assert.throws(()=>c.saveSubscription({id:row.id}),/no encontrada/);assert.equal(JSON.stringify(s.sheets.get('Suscripciones').grid),before);
});
test('la caché caduca al navegar, conserva la pantalla abierta y renueva las demás selecciones al cambiar revisiones',async t=>{
 let clock=0;const a=await app(t,{configure({w,data}){Object.defineProperty(w.performance,'now',{value:()=>clock});data.newsRevision='news-1';data.configurationRevision='config-1';}}),count=()=>a.calls.filter(row=>row.method==='getDashboard').length;
 await a.click('[data-view="radar"]');const first=count();await a.click('[data-view="briefing"]');assert.equal(count(),first);clock=59999;await a.click('[data-view="radar"]');assert.equal(count(),first);
 clock=60000;a.replies.getDashboard.newsRevision='news-2';a.replies.getDashboard.configurationRevision='config-2';a.replies.getDashboard.radar.summary.news=5;await tick();assert.equal(count(),first);assert.match(a.find('#radar-count').textContent,/0 publicaciones/);
 await a.click('[data-view="briefing"]');assert.equal(count(),first+1);await a.click('[data-view="radar"]');assert.equal(count(),first+2);assert.match(a.find('#radar-count').textContent,/5 publicaciones/);await a.click('[data-view="briefing"]');assert.equal(count(),first+2);
});
