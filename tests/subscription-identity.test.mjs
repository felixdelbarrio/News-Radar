import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);return s;}
test('altas personales y administrativas bloquean duplicados efectivos sin escribir ni invalidar la caché',()=>{
 const {c}=server(),input={periodicity:'weekly',language:'es',filters:{entity:'BBVA'}};
 c.saveSubscription(input);const first=c.subscriptionRows_()[0],revision=c.properties_().getProperty('SUBSCRIPTIONS_REVISION');
 for(const candidate of [input,{...input,name:'Otro nombre',active:false,filters:{source:'',coverage:'digital',segment:'Empresas e instituciones',entity:'BBVA'}},{...input,email:' OWNER@BBVA.COM '}]){
  assert.throws(()=>candidate.email?c.saveAdminSubscription(candidate):c.saveSubscription(candidate),/Ya existe una suscripción/);
  assert.equal(c.subscriptionRows_().length,1);assert.equal(c.properties_().getProperty('SUBSCRIPTIONS_REVISION'),revision);
 }
 assert.doesNotThrow(()=>c.saveSubscription({...input,id:first.id,active:false}));
 assert.throws(()=>c.saveSubscription(input),/Ya existe una suscripción/);
 assert.equal(c.subscriptionRows_().length,1);
});
test('se conservan suscripciones con distinto destinatario, periodicidad, idioma o filtros y una edición no puede duplicar otra',()=>{
 const {c}=server(),input={periodicity:'weekly',language:'es',filters:{entity:'BBVA'}};
 for(const candidate of [input,{...input,periodicity:'monthly'},{...input,language:'en'},{...input,filters:{entity:'Santander'}},{...input,filters:{entity:'BBVA',coverage:''}}])c.saveSubscription(candidate);
 c.saveAdminSubscription({...input,email:'other@bbva.com'});assert.equal(c.subscriptionRows_().length,6);
 const second=c.subscriptionRows_()[1];assert.throws(()=>c.saveSubscription({...input,id:second.id}),/Ya existe una suscripción/);
 assert.equal(c.subscriptionRows_()[1].periodicidad,'monthly');
 c.saveSubscription({...input,id:second.id,periodicity:'yearly'});assert.equal(c.subscriptionRows_()[1].periodicidad,'yearly');
});
test('la identidad ignora orden, campos vacíos y normaliza la búsqueda como las noticias',()=>{
 const {c}=server(),input={periodicity:'weekly',filters:{search:'Pagos móviles',entity:'BBVA'}};
 c.saveSubscription(input);assert.throws(()=>c.saveSubscription({...input,filters:{source:'',entity:'BBVA',search:' PAGOS   MOVILES '}}),/Ya existe una suscripción/);
 c.saveSubscription({...input,filters:{entity:'BBVA',search:'Pagos instantáneos'}});assert.equal(c.subscriptionRows_().length,2);
 c.saveSubscription({periodicity:'monthly',filters:{}});assert.throws(()=>c.saveSubscription({periodicity:'monthly',filters:{search:'   '}}),/Ya existe una suscripción/);
});
test('la inicialización cachea solo la primera activa sin traducir asuntos; refinar filtros no vuelve a consultar suscripciones',()=>{
 const s=server(),{c}=s;c.saveSubscription({periodicity:'weekly',filters:{entity:'BBVA'}});
 c.subscriptionRows_=()=>{throw Error('No debe calcular asuntos ni construir el catálogo');};
 const rows=c.rows_;let reads=0;c.rows_=(name,...args)=>{if(name==='Suscripciones')reads++;return rows(name,...args);};
 for(const view of ['briefing','news','radar'])assert.equal(c.getDashboard({view,initial:true}).selection.entity,'BBVA');
 assert.equal(reads,1);c.getDashboard({view:'news',entity:'Santander'});assert.equal(reads,1);
 s.setEmail('other@bbva.com');assert.equal(c.getDashboard({view:'briefing',initial:true}).selection.entity,undefined);assert.equal(reads,2);
 c.getDashboard({view:'news',initial:true});assert.equal(reads,2);
});
