import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const clean=value=>JSON.parse(JSON.stringify(value));
test('cada vista conserva su rango al aplicar la primera newsletter y respeta fechas editadas',()=>{
 const {c}=server(),now=new Date('2026-10-12T12:00:00Z'),subscription={filtros:{entity:'Santander',segment:'Empresas e instituciones',range:'year'}};
 for(const [view,from,to] of [['briefing','2026-10-06','2026-10-12'],['news','2026-10-01','2026-10-31'],['radar','2026-01-01','2026-12-31']]){const query=c.personalDashboardQuery_(subscription,view,now);assert.equal(query.from,from);assert.equal(query.to,to);assert.equal(query.entity,'Santander');assert.equal(query.range,undefined);}
 c.saveSubscription({name:'No debe usarse',filters:subscription.filtros});
 const selected=c.getDashboard({view:'news',initial:true});assert.deepEqual({from:selected.selection.from,to:selected.selection.to},clean(c.currentMonth_()));
 const radar=c.getDashboard({view:'radar',initial:true});assert.deepEqual({from:radar.selection.from,to:radar.selection.to},clean(c.newsRange_('year')));
 const edited=c.getDashboard({view:'news',from:'2026-02-01',to:'2026-02-28',initial:false});assert.equal(edited.selection.from,'2026-02-01');assert.equal(edited.selection.to,'2026-02-28');
 assert.deepEqual(clean(c.newsRange_('week',new Date('2026-01-01T12:00:00Z'))),{from:'2025-12-26',to:'2026-01-01'});assert.throws(()=>c.newsRange_('unknown'),/Período/);
});
test('la periodicidad define el ámbito, el período y el asunto sin aceptar un período independiente',()=>{
 const {c}=server(),now=new Date('2026-10-12T12:00:00Z');
 for(const [periodicity,view,range] of [['weekly','briefing','week'],['monthly','news','month'],['yearly','radar','year']]){
  const row=c.subscriptionRecord_({name:'Asunto arbitrario',periodicity,language:'en',filters:{entity:'BBVA',segment:'Empresas e instituciones',range:'year'}},'owner@bbva.com','id',now,0);
  assert.equal(row.filtros.range,undefined);assert.match(row.nombre,/^\[bIA\] Entity: BBVA · Segment: /);assert.doesNotMatch(row.nombre,/arbitrario/);
  assert.deepEqual(clean(c.subscriptionQuery_(row,now)),{entity:'BBVA',segment:'Empresas e instituciones',coverage:'digital',...clean(c.newsRange_(range,now)),view});
  const closed=c.subscriptionQuery_(row,now,true),period=c.newsletterPeriod_(periodicity,now);assert.equal(closed.from,period.from);assert.equal(closed.to,period.to);assert.equal(closed.view,view);
 }
 for(const periodicity of ['daily','invalid','constructor'])assert.throws(()=>c.subscriptionRecord_({periodicity,filters:{}},'owner@bbva.com','id',now,0),/Periodicidad/);
 const yearly=c.newsletterPeriod_('yearly',new Date('2027-01-01T12:00:00Z'));assert.equal(yearly.from,'2026-01-01');assert.equal(yearly.to,'2026-12-31');
});
test('el lote prepara una sola vez los períodos completos necesarios y excluye la semana en curso',()=>{
 const s=server(),{c}=s;c.configuration_().settings.newsletterEnabled=true;
 for(const [email,periodicity] of [['week@bbva.com','weekly'],['year@bbva.com','yearly']])c.saveAdminSubscription({email,periodicity,filters:{entity:'BBVA',coverage:''}});
 for(const row of s.sheets.get('Suscripciones').grid.slice(1))row[6]='2000-01-01';
 const week=c.newsletterPeriod_('weekly',new Date()),year=c.newsletterPeriod_('yearly',new Date()),keys=vm.runInContext('RADAR.sheets.Noticias',c);
 const rows=[{id:'old',fecha:year.from,titular:'BBVA lanza tarjeta para empresas',url:'https://example.com/old'},{id:'new',fecha:week.from,titular:'BBVA lanza cuenta para empresas',url:'https://example.com/new'},{id:'future',fecha:'2099-01-01',titular:'BBVA lanza crédito para empresas',url:'https://example.com/future'}].map(row=>({...row,entidad:'BBVA',pais:'España',medio:'Editor',extracto:'Nueva oferta para empresas'}));
 s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));
 let classified=0;const annotate=c.annotateNews_;c.annotateNews_=rows=>{classified+=rows.length;return annotate(rows);};c.newsletterSender_=()=>({});const sent=[];c.sendNewsletterMail_=(_sender,email,content)=>{sent.push({email,content});return 'gmail';};
 const result=c.deliverNewsletters_();assert.equal(result.accepted,2);assert.equal(classified,2);assert.equal(sent.find(row=>row.email==='week@bbva.com').content.count,1);assert.equal(sent.find(row=>row.email==='year@bbva.com').content.count,1);
 const log=c.rows_('NewsletterEnvios');assert.equal(log[0].desde,week.from);assert.equal(log[1].desde,year.from);
});
for(const count of [0,1,2])test('No hay selector de newsletters en el panel lateral: '+count+' newsletters activas',async t=>{
 const a=await app(t,{configure({data}){data.personalization={active:'default',options:Array.from({length:count},(_,i)=>({id:'channel-'+i,name:'Canal '+i}))};}});
 assert.equal(a.find('#reading-context').closest('#desktop-filters')!==null,true);assert.equal(a.find('#reading-context').hidden,true);assert.equal(a.w.document.querySelector('#reading-choice'),null);
 for(const view of ['news','radar','briefing']){await a.click('[data-view="'+view+'"]');assert.equal(a.find('#reading-context').hidden,true);}
 await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('#personal-editor [name="name"]'),null);assert.equal(a.w.document.querySelector('#personal-editor [name="range"]'),null);assert.equal(a.find('#personal-editor [name="periodicity"]').value,'monthly');assert.equal(a.find('#filters-section').hidden,true);
});
