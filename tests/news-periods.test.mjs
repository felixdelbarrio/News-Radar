import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/delivery.mjs';
import {app} from './helpers/app.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
const clean=value=>JSON.parse(JSON.stringify(value));
test('cada vista conserva su ventana propia y respeta fechas explícitas sin leer suscripciones',()=>{const {c}=server();c.saveSubscription({country:'México'});for(const view of ['briefing','news','radar']){const selected=c.getDashboard({view,initial:true});assert.deepEqual({from:selected.selection.from,to:selected.selection.to},clean(c.dashboardPeriod_(view)));}const edited=c.getDashboard({view:'news',from:'2026-02-01',to:'2026-02-28'});assert.equal(edited.selection.from,'2026-02-01');assert.equal(edited.selection.to,'2026-02-28');});
test('el plan traduce cada cadencia a su vista y a un período cerrado sin filtros personales',()=>{const {c}=server(),now=new Date('2026-10-12T12:00:00Z');for(const [periodicidad,view] of [['fortnightly','briefing'],['monthly','news'],['yearly','radar']]){const q=c.subscriptionQuery_({periodicidad,filtros:{country:'España',entity:'BBVA'}},now,true),period=c.newsletterPeriod_(periodicidad,now);assert.equal(q.view,view);assert.equal(q.from,period.from);assert.equal(q.to,period.to);assert.equal(q.entity,undefined);assert.equal(q.country,'España');}assert.throws(()=>c.newsletterWindow('invalid','2026-10-12'),/Periodicidad/);});
test('el lote prepara una sola vez los períodos completos necesarios y excluye la semana en curso',()=>{
 const s=server(),{c}=s;c.configuration_().settings.newsletterEnabled=true;
 for(const [email,periodicity] of [['week@bbva.com','fortnightly'],['year@bbva.com','yearly']])c.saveAdminSubscription({email,periodicity,filters:{entity:'BBVA',coverage:''}});
 for(const row of s.sheets.get('Suscripciones').grid.slice(1))row[6]='2000-01-01';
 const week=c.newsletterPeriod_('fortnightly',new Date()),year=c.newsletterPeriod_('yearly',new Date()),keys=vm.runInContext('RADAR.sheets.Noticias',c);
 const rows=[{clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id:'old',fecha:year.from,titular:'BBVA lanza tarjeta para empresas',url:'https://example.com/old'},{clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id:'new',fecha:week.from,titular:'BBVA lanza cuenta para empresas',url:'https://example.com/new'},{clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"]}',id:'future',fecha:'2099-01-01',titular:'BBVA lanza crédito para empresas',url:'https://example.com/future'}].map(row=>({...row,entidad:'BBVA',pais:'España',medio:'Editor',extracto:'Nueva oferta para empresas'}));
 s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));
 let classified=0;const annotate=c.annotateNews_;c.annotateNews_=rows=>{classified+=rows.length;return annotate(rows);};c.newsletterSender_=()=>({});const sent=[];c.sendNewsletterMail_=(_sender,email,content)=>{sent.push({email,content});return 'gmail';};
 const result=c.deliverNewsletterBatch_();assert.equal(result.accepted,2);assert.equal(classified,2);assert.equal(sent.find(row=>row.email==='week@bbva.com').content.count,1);assert.equal(sent.find(row=>row.email==='year@bbva.com').content.count,1);
 const log=c.rows_('NewsletterEnvios');assert.equal(log[0].desde,week.from);assert.equal(log[1].desde,year.from);
});
for(const count of [0,1,2])test('No hay selector de newsletters en el panel lateral: '+count+' newsletters activas',async t=>{
 const a=await app(t,{configure({data,replies}){replies.getSubscriptions=[];data.personalization={active:'default',options:Array.from({length:count},(_,i)=>({id:'channel-'+i,name:'Canal '+i}))};}});
 assert.equal(a.find('#reading-context').closest('#mobile-filters')!==null,true);assert.equal(a.find('#reading-context').hidden,true);assert.equal(a.w.document.querySelector('#reading-choice'),null);
 for(const view of ['news','radar','briefing']){await a.click('[data-view="'+view+'"]');assert.equal(a.find('#reading-context').hidden,true);}
 await a.click('[data-view="subscriptions"]');assert.equal(a.w.document.querySelector('#personal-editor [name="name"]'),null);assert.equal(a.w.document.querySelector('#personal-editor [name="range"]'),null);assert.equal(a.w.document.querySelector('#personal-editor [name="periodicity"]'),null);assert.equal(a.find('#filters-section').hidden,true);
});

test('los valores iniciales y la restauración de cada vista coinciden con las newsletters en límites de quincena, trimestre y año',()=>{
 const {c}=server();
 for(const day of ['2024-02-15','2024-02-16','2024-02-29','2026-03-31','2026-04-01','2026-10-15','2026-10-16','2026-12-31','2027-01-01']){
  const now=new Date(day+'T12:00:00Z');
  for(const [view,cadence] of [['briefing','fortnightly'],['news','monthly'],['radar','yearly']]){
   const {from,to}=c.newsletterWindow(cadence,day);
   for(const initial of [true,false]){
    const selected=c.dashboardQuery_({view,initial},now);assert.equal(selected.from,from);assert.equal(selected.to,to);
   }
   const explicit=c.dashboardQuery_({view,from:'2025-01-02',to:'2025-02-03'},now);assert.equal(explicit.from,'2025-01-02');assert.equal(explicit.to,'2025-02-03');
  }
 }
});
