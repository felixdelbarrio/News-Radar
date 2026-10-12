import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const clean=value=>JSON.parse(JSON.stringify(value));
test('cada vista conserva su rango al aplicar la primera newsletter y respeta fechas editadas',()=>{
 const {c}=server(),now=new Date('2026-10-12T12:00:00Z'),subscription={filtros:{entity:'Santander',segment:'Empresas e instituciones',range:'year'}};
 for(const [view,from,to] of [['briefing','2026-01-01','2026-12-31'],['news','2026-10-01','2026-10-31'],['radar','2026-01-01','2026-12-31']]){const query=c.personalDashboardQuery_(subscription,view,now);assert.equal(query.from,from);assert.equal(query.to,to);assert.equal(query.entity,'Santander');assert.equal(query.range,undefined);}
 c.saveSubscription({name:'No debe usarse',filters:subscription.filtros});
 const selected=c.getDashboard({view:'news',initial:true});assert.deepEqual({from:selected.selection.from,to:selected.selection.to},clean(c.currentMonth_()));
 const radar=c.getDashboard({view:'radar',initial:true});assert.deepEqual({from:radar.selection.from,to:radar.selection.to},clean(c.newsRange_('year')));
 const edited=c.getDashboard({view:'news',from:'2026-02-01',to:'2026-02-28',initial:false});assert.equal(edited.selection.from,'2026-02-01');assert.equal(edited.selection.to,'2026-02-28');
 assert.deepEqual(clean(c.newsRange_('week',new Date('2026-01-01T12:00:00Z'))),{from:'2025-12-26',to:'2026-01-01'});assert.throws(()=>c.newsRange_('unknown'),/Período/);
});
test('las newsletters guardan períodos válidos y generan un asunto traducido sin aceptar nombres editables',()=>{
 const {c}=server(),now=new Date('2026-10-12T12:00:00Z');
 for(const range of ['week','month','year']){const row=c.subscriptionRecord_({name:'Asunto arbitrario',language:'en',filters:{entity:'BBVA',segment:'Empresas e instituciones',range}},'owner@bbva.com','id',now,0);assert.equal(row.filtros.range,range);assert.match(row.nombre,/^\[bIA\] Entity: BBVA · Segment: /);assert.doesNotMatch(row.nombre,/arbitrario/);assert.deepEqual(clean(c.subscriptionQuery_(row,now)),{entity:'BBVA',country:'',source:'',topic:'',type:'',segment:'Empresas e instituciones',signal:'',search:'',palanca:'',subpalanca:'',...clean(c.newsRange_(range,now))});}
 assert.throws(()=>c.subscriptionRecord_({filters:{range:'invalid'}},'owner@bbva.com','id',now,0),/Período/);
 c.saveSubscription({name:'Título antiguo',filters:{entity:'BBVA',range:'month'}});assert.match(c.getSubscriptions()[0].nombre,/^\[bIA\] Entidad: BBVA · Mes en curso$/);
 const content=c.newsletter_([],{segment:'Empresas e instituciones',from:'2026-10-01',to:'2026-10-31'},'Título interno',now,'id');assert.equal(content.subject,'[bIA] Segmento: Empresas e instituciones · Desde: 2026-10-01 · Hasta: 2026-10-31');
});
test('el lote prepara una sola vez el intervalo necesario para newsletters semanales y anuales',()=>{
 const s=server(),{c}=s;c.configuration_().settings.newsletterEnabled=true;
 for(const [email,range] of [['week@bbva.com','week'],['year@bbva.com','year']])c.saveAdminSubscription({email,periodicity:'daily',filters:{entity:'BBVA',range}});
 for(const row of s.sheets.get('Suscripciones').grid.slice(1))row[6]='2000-01-01';
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),today=c.recentNewsRange_().to,year=today.slice(0,4);
 const rows=[{id:'old',fecha:year+'-01-01',titular:'BBVA lanza tarjeta para empresas',url:'https://example.com/old'},{id:'new',fecha:today,titular:'BBVA lanza cuenta para empresas',url:'https://example.com/new'},{id:'expired',fecha:'2020-01-01',titular:'BBVA lanza crédito para empresas',url:'https://example.com/expired'}].map(row=>({...row,entidad:'BBVA',pais:'España',medio:'Editor',extracto:'Nueva oferta para empresas'}));
 s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));
 let classified=0;const annotate=c.annotateNews_;c.annotateNews_=rows=>{classified+=rows.length;return annotate(rows);};c.newsletterSender_=()=>({});const sent=[];c.sendNewsletterMail_=(_sender,email,content)=>{sent.push({email,content});return 'gmail';};
 const result=c.deliverNewsletters_();assert.equal(result.accepted,2);assert.equal(classified,2);assert.equal(sent.find(row=>row.email==='week@bbva.com').content.count,1);assert.equal(sent.find(row=>row.email==='year@bbva.com').content.count,2);assert.match(sent[1].content.subject,new RegExp('Desde: '+year+'-01-01'));
 const log=c.rows_('NewsletterEnvios');assert.equal(log[0].desde,c.recentNewsRange_().from);assert.equal(log[1].desde,year+'-01-01');
});
for(const count of [0,1,2])test('Mi selección en el panel lateral: '+count+' newsletters activas',async t=>{
 const a=await app(t,{configure({data}){data.personalization={active:'default',options:Array.from({length:count},(_,i)=>({id:'channel-'+i,name:'Canal '+i}))};}});
 assert.equal(a.find('#reading-context').closest('#desktop-filters')!==null,true);assert.equal(a.find('#reading-context').hidden,count<=1);assert.equal(a.find('#reading-choice').hidden,count<=1);
 for(const view of ['news','radar','briefing']){await a.click('[data-view="'+view+'"]');assert.equal(a.find('#reading-context').hidden,count<=1);}
 await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('#personal-editor [name="name"]'),null);assert.equal(a.find('#personal-editor [name="range"]').value,'week');assert.equal(a.find('#filters-section').hidden,true);
});
