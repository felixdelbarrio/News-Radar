import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {read,readClientScript,readServerScript} from '../scripts/source.mjs';

function client(responses={}){
  const elements=new Map(),timers=new Map(),requests=[],rpc=[];
  const element=id=>{
    if(!elements.has(id))elements.set(id,{value:'',dataset:{},listeners:{},hidden:false,disabled:false,textContent:'',innerHTML:'',children:[],appendChild(){},querySelectorAll:()=>[],setAttribute(){},removeAttribute(){},classList:{toggle(){}},
      addEventListener(type,fn){this.listeners[type]=fn;},setCustomValidity(value){this.validation=value;},reportValidity(){return !this.elements?.to.validation;}});
    return elements.get(id);
  };
  const form=element('filters');form.elements=Object.fromEntries(['search','country','entity','source','topic','from','to','type','segment','signal','coverage','palanca','subpalanca'].map(name=>[name,Object.assign(element(name),{name})]));
  Object.defineProperty(form.elements,Symbol.iterator,{value:function*(){yield* Object.values(this);}});
  for(const name of ['country','entity','source','topic']){
    const select=form.elements[name];let html='';
    Object.defineProperty(select,'innerHTML',{get:()=>html,set(value){html=value;select.value='';}});
  }
  const context=vm.createContext({document:{addEventListener(){},documentElement:{},body:{nodeType:0},title:"",getElementById:element,querySelector:element,querySelectorAll:()=>[],createElement:()=>({click(){}})},
    Blob,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},
    window:{addEventListener(){},scrollTo(){},matchMedia:()=>({matches:false,addEventListener(){}}),RADAR_PREVIEW:{call(method,query){rpc.push({method,query});if(method!=='getDashboard')return Promise.resolve(responses[method]||(method==='getNewsletterHistory'?{items:[],total:0,page:0,pageSize:30,options:{},limit:20000}:method==='getSubscriptions'?[]:method==='getNewsletterOptions'?{email:'reader@bbva.com',defaults:{name:'Mi canal',periodicity:'monthly',filters:{}},catalogs:{}}:method==='getConfiguration'?{config:JSON.parse(read('assets/configuration-defaults.json')),revision:'test'}:{saved:true}));return new Promise(resolve=>requests.push({query,resolve}));}}},
    FormData:class {constructor(){return Object.entries(form.elements).map(([name,input])=>[name,input.value]);}},
    MutationObserver:class {observe(){}disconnect(){}takeRecords(){return [];}},
    ResizeObserver:class {observe(){}},crypto:{randomUUID:()=> 'test-session'},performance:{now:()=>0},setInterval(){},queueMicrotask,
    setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(readClientScript(true),context);
  return {form,element,requests,rpc,change(name,value,type='change'){form.elements[name].value=value;form.listeners[type]({type,target:{name}});},
    debounce(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());}};
}
const server=vm.createContext({});vm.runInContext(readServerScript('dist',true),server);server.configuration_=()=>JSON.parse(read("assets/configuration-defaults.json"));
const radar=server.radarMetrics_([{fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País'}],{});
const dashboard=title=>({applicationScope:JSON.parse(read('assets/configuration-defaults.json')).applicationScope,items:[{titular:title,fecha:'2026-10-08',pais:'México',entidad:'Santander Empresas',medio:'El País',tema:'Financiación',url:'https://example.com/news'}],
  page:0,pageSize:30,total:1,countries:['España','México'],entities:['BBVA','Santander'],sources:['El País'],topics:['Financiación'],
  stats:radar.summary,radar,sourceCount:57,daily:false,admin:false});
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};

test('cambios de desplegable combinan los filtros y conservan sus selecciones',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'news'}})}});c.requests.at(-1).resolve(dashboard('Inicial'));await settle();
  c.change('country','México');const stale=c.requests.at(-1);c.change('entity','Santander');c.change('source','El País');
  const latest=c.requests.at(-1);assert.equal(latest.query.country,'México');assert.equal(latest.query.entity,'Santander');assert.equal(latest.query.source,'El País');
  latest.resolve(dashboard('Santander en México'));await settle();
  assert.match(c.element('news-list').innerHTML,/Santander en México/);assert.equal(c.form.elements.entity.value,'Santander');assert.equal(c.form.elements.source.value,'El País');
  stale.resolve(dashboard('Respuesta antigua'));await settle();assert.doesNotMatch(c.element('news-list').innerHTML,/Respuesta antigua/);
});
test('editar un filtro invalida la respuesta anterior antes de vencer el debounce',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'news'}})}});const pending=c.requests.at(-1);c.change('search','tesoreria','input');
  pending.resolve(dashboard('Obsoleta'));await settle();assert.equal(c.element('news-list').innerHTML,'');
  c.debounce();assert.equal(c.requests.at(-1).query.search,'tesoreria');c.requests.at(-1).resolve(dashboard('Actual'));await settle();assert.match(c.element('news-list').innerHTML,/Actual/);
});
test('fechas invertidas impiden la consulta y limpiar filtros elimina la validación',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();
  c.change('from','2026-10-09');const count=c.requests.length;c.change('to','2026-10-01');
  assert.equal(c.requests.length,count);assert.match(c.form.elements.to.validation,/posterior/);
  for(const input of Object.values(c.form.elements))input.value='';c.form.listeners.reset();await settle();
  assert.equal(c.form.elements.to.validation,'');assert.equal(c.requests.at(-1).query.from,'');assert.equal(c.requests.at(-1).query.to,'');
});


test('módulos administrativos renderizan fuentes y métricas sin depender del radar',async()=>{
  const c=client({getAdoption:{options:{},page:0,pageSize:30,total:1,dau:1,wau:1,mau:1,returning:0,sessions:1,events:2,users:[{correo:'owner@bbva.com',first:'2026-10-08',last:'2026-10-09',sessions:1,actions:2}],daily:[]}});
  c.requests[0].resolve({...dashboard('Inicial'),admin:true,feeds:[],configuredFeeds:[{id:'a',name:'Fuente activa',country:'México',kind:'profile',url:'https://example.com/rss',enabled:true}],runs:[],collection:{total:1,processed:1,pending:0,failed:0}});await settle();
  assert.match(c.element('configured-sources-body').innerHTML,/Fuente activa/);
  const edited='Edición sin guardar';c.element('source-fields').innerHTML=edited;
  c.change('entity','Santander');c.requests.at(-1).resolve({...dashboard('Filtrada'),admin:true,feeds:[],configuredFeeds:[{id:'a',name:'Fuente activa',country:'México',kind:'profile',url:'https://example.com/rss',enabled:true}],runs:[],collection:{total:1,processed:1,pending:0,failed:0}});await settle();
  assert.equal(c.element('source-fields').innerHTML,edited);
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'administration'}})}});await settle();
  await c.element('admin-tabs').listeners.click({target:{closest:()=>({dataset:{adminView:'adoption'}})}});await settle();
  assert.match(c.element('adoption-body').innerHTML,/owner@bbva.com/);assert.equal(c.element('news-section').hidden,true);
});


test('exportar no vuelve a consultar el dashboard ni reconstruye los formularios',async()=>{
  const c=client({exportNews:{csv:'fecha;entidad',count:1}});c.requests[0].resolve(dashboard('Inicial'));await settle();
  await c.element('export').listeners.click();await settle();assert.equal(c.requests.length,1);assert.match(c.element('message').textContent,/1 publicaciones exportadas/);
});


test('la selección inicial se obtiene del servidor',async()=>{
  const c=client();assert.equal(c.requests[0].query.view,'briefing');assert.equal(c.element('page-title').textContent,'Novedades');assert.equal(c.element('briefing-section').hidden,false);assert.equal(c.requests.length,1);assert.equal(c.requests[0].query.initial,true);c.requests[0].resolve({...dashboard('Inicial'),initial:true,selection:{entity:'Santander',segment:'Retail',topic:'',country:'México'},segments:['Retail']});await settle();
  assert.equal(c.form.elements.entity.value,'Santander');assert.equal(c.form.elements.segment.value,'Retail');assert.equal(c.form.elements.country.value,'México');
});
test('Radar y Noticias conservan selecciones independientes; administración deniega lectores',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();c.change('country','México');
  c.requests.at(-1).resolve(dashboard('México'));await settle();
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'news'}})}});await settle();
  assert.equal(c.element('radar-section').hidden,true);assert.equal(c.element('news-section').hidden,false);assert.equal(c.form.elements.country.value,'');
  assert.equal(c.requests.at(-1).query.view,'news');
  const count=c.requests.length;await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'administration'}})}});await settle();assert.equal(c.element('page-title').textContent,'Noticias');assert.equal(c.requests.length,count);
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'radar'}})}});await settle();assert.equal(c.element('radar-section').hidden,false);assert.equal(c.element('news-section').hidden,true);
});
test('seleccionar un ámbito en el mapa actualiza los filtros compartidos',async()=>{
  const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();c.element('map-panel').listeners.click({target:{closest:()=>({dataset:{country:'México'}})}});
  assert.equal(c.requests.at(-1).query.country,'México');assert.equal(c.requests.at(-1).query.entity,'');
});

test('el mapa refleja el volumen filtrado y comunica entidad y ausencia de noticias',async()=>{
  const c=client(),areas=['México','España'].map(country=>({dataset:{country},classList:{contains:()=>false},style:{setProperty(name,value){this[name]=value;}},setAttribute(name,value){this[name]=value;},title:{},querySelector(){return this.title;}}));
  c.element('world-map').querySelectorAll=selector=>selector==='[data-code]'?[]:areas;
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'radar'}})}});
  c.requests.at(-1).resolve(dashboard('Santander en México'));await settle();
  assert.equal(areas[0].style['--map-fill'],'var(--heat-4)');
  assert.match(areas[0].title.textContent,/Santander: 1/);
  assert.equal(areas[1].style['--map-fill'],'var(--heat-0)');
  assert.match(areas[1]['aria-label'],/0 publicaciones/);
});

test('el administrador transmite el período seleccionado al recuperar noticias',async()=>{
 const c=client({collectNow:{added:0,pending:1,errors:[],notice:'Recuperación anual en cola.'}});c.requests[0].resolve({...dashboard('Inicial'),admin:true,feeds:[],configuredFeeds:[],runs:[],collection:{total:0}});await settle();
 c.element('input[name="recovery-range"]:checked').value='year';const action=c.element('collect').listeners.click();await settle();c.requests.at(-1).resolve({...dashboard('Recuperada'),admin:true,feeds:[],configuredFeeds:[],runs:[],collection:{total:0}});await action;assert.equal(c.rpc.find(r=>r.method==='collectNow').query,'year');assert.match(c.element('message').textContent,/anual en cola/);
});

test('la activación de fuentes persiste al buscar y paginar antes de guardar',async()=>{
 const c=client(),feeds=Array.from({length:31},(_,i)=>({id:String(i),name:'Fuente '+i,country:'España',kind:'profile',url:'https://example.com/rss',enabled:true}));
 c.requests[0].resolve({...dashboard('Inicial'),admin:true,feeds:[],configuredFeeds:feeds,runs:[],collection:{}});await settle();
 c.element('configured-sources-body').listeners.change({target:{matches:()=>true,dataset:{id:'0'},checked:false}});c.element('source-pagination').listeners.click({target:{closest:()=>({dataset:{page:'1'}})}});assert.match(c.element('configured-sources-body').innerHTML,/Fuente 30/);
 c.element('source-search').value='Fuente 0';c.element('source-search').listeners.input();c.debounce();assert.doesNotMatch(c.element('configured-sources-body').innerHTML,/ checked/);
 c.element('save-source-settings').listeners.click();await settle();const saved=c.rpc.find(row=>row.method==='saveSourceSettings').query;assert.equal(saved.length,30);assert.ok(!saved.includes('0'));assert.ok(saved.includes('30'));
});

test('Radar permite explorar los filtros de la matriz y cambiar de vista conserva cada selección sin consultas duplicadas',async()=>{
  const c=client();await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'radar'}})}});c.requests.at(-1).resolve({...dashboard('Inicial'),initial:true,selection:{entity:'',segment:'Empresas e instituciones'}});await settle();
  assert.equal(c.element('geography-filter').hidden,false);assert.equal(c.element('advanced-filters').hidden,true);assert.equal(c.form.elements.segment.value,'Empresas e instituciones');
  c.change('entity','Santander');c.requests.at(-1).resolve({...dashboard('Radar'),selection:{entity:'Santander',segment:'Empresas e instituciones'}});await settle();
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'news'}})}});await settle();
  assert.equal(c.element('geography-filter').hidden,false);assert.equal(c.element('advanced-filters').hidden,false);
  c.requests.at(-1).resolve({...dashboard('Noticias'),initial:true,selection:{entity:'BBVA',from:'2026-10-01',to:'2026-10-31'}});await settle();
  assert.equal(c.form.elements.from.value,'2026-10-01');assert.equal(c.form.elements.to.value,'2026-10-31');
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'radar'}})}});await settle();
  assert.equal(c.form.elements.entity.value,'Santander');assert.equal(c.form.elements.from.value,'');
  const count=c.requests.length;c.element('map-panel').listeners.click({target:{closest:()=>({dataset:{country:'México'}})}});
  assert.equal(c.requests.length,count+1);assert.equal(c.requests.at(-1).query.view,'news');assert.equal(c.requests.at(-1).query.from,'2026-10-01');
  await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'briefing'}})}});await settle();
  assert.equal(c.element('from-filter').hidden,false);assert.equal(c.element('to-filter').hidden,false);
});

test('abrir Noticias desde el mapa conserva el ámbito del Radar sin imponer otro período',async()=>{
 const c=client();c.requests[0].resolve({...dashboard('Inicial'),initial:true,selection:{segment:'Empresas e instituciones'},defaults:{entity:'BBVA',segment:'Empresas e instituciones',from:'2026-10-01',to:'2026-10-31'}});await settle();
 const count=c.requests.length;c.element('map-panel').listeners.click({target:{closest:()=>({dataset:{country:'México'}})}});
 assert.equal(c.requests.length,count+1);assert.equal(c.requests.at(-1).query.country,'México');assert.equal(c.requests.at(-1).query.from,'');assert.equal(c.requests.at(-1).query.to,'');
});

test('cerrar un chip sincroniza panel, paginación y consulta e invalida respuestas anteriores',async()=>{
 const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();
 await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'news'}})}});
 c.change('entity','Santander');c.change('from','2026-10-01');c.change('to','2026-10-31');
 assert.match(c.element('active-filters').innerHTML,/Fecha hasta: 31\/10\/2026/);
 const previous=c.requests.at(-1);
 c.element('active-filters').listeners.click({target:{closest:()=>({dataset:{removeFilter:'entity'}})}});
 assert.equal(c.form.elements.entity.value,'');assert.equal(c.requests.at(-1).query.entity,'');assert.equal(c.requests.at(-1).query.page,0);assert.equal(c.requests.at(-1).query.to,'2026-10-31');
 previous.resolve(dashboard('Obsoleta'));await settle();assert.doesNotMatch(c.element('news-list').innerHTML,/Obsoleta/);
 c.requests.at(-1).resolve(dashboard('Actualizada'));await settle();assert.doesNotMatch(c.element('active-filters').innerHTML,/Entidad: Santander/);assert.match(c.element('news-list').innerHTML,/Actualizada/);
});

test('Radar y Novedades comparten chips cerrables y muestran solo sus filtros editables',async()=>{
 const c=client();await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'radar'}})}});c.requests.at(-1).resolve({...dashboard('Inicial'),selection:{entity:'BBVA',segment:'Empresas e instituciones'}});await settle();
 assert.match(c.element('active-filters').innerHTML,/Entidad: BBVA/);
 c.change('country','México');c.change('from','2026-10-01');assert.match(c.element('active-filters').innerHTML,/Geografía|Fecha desde/);
 c.element('active-filters').listeners.click({target:{closest:()=>({dataset:{removeFilter:'entity'}})}});assert.equal(c.requests.at(-1).query.entity,'');assert.equal(c.requests.at(-1).query.segment,'Empresas e instituciones');
 c.requests.at(-1).resolve({...dashboard('Radar actualizado'),selection:{entity:'',segment:'Empresas e instituciones'}});await settle();
 await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'briefing'}})}});
 c.change('country','España');c.change('entity','Santander');c.change('to','2026-10-31');assert.match(c.element('active-filters').innerHTML,/Geografía: España/);assert.match(c.element('active-filters').innerHTML,/Fecha hasta/);
 c.element('active-filters').listeners.click({target:{closest:()=>({dataset:{removeFilter:'country'}})}});assert.equal(c.requests.at(-1).query.country,'');assert.equal(c.requests.at(-1).query.view,'briefing');assert.equal(c.requests.at(-1).query.entity,'Santander');
 await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'radar'}})}});assert.equal(c.form.elements.entity.value,'');assert.equal(c.form.elements.segment.value,'Empresas e instituciones');
});

test('los desplegables no disparan una consulta por input y otra por change',async()=>{
 const c=client();c.requests[0].resolve(dashboard('Inicial'));await settle();const initial=c.requests.length;
 c.change('entity','Santander','input');c.debounce();assert.equal(c.requests.length,initial);c.change('entity','Santander','change');assert.equal(c.requests.length,initial+1);
});

test('filtros administrativos consultan sin recargar el dashboard y reinician la página',async()=>{
 const data={items:[{fecha:'2026-10-11T10:00:00Z',fuente:'BBVA',resultado:'Error',motivo:'HTTP 302'}],options:{fuente:['BBVA'],resultado:['Error'],ejecucion:['cycle']},total:45,page:0,pageSize:30,limit:20000};
 const c=client({getAudit:data});c.requests[0].resolve({...dashboard('Inicial'),admin:true,feeds:[],configuredFeeds:[],runs:[],collection:{}});await settle();
 await c.element('.nav').listeners.click({target:{closest:()=>({dataset:{view:'administration'}})}});await c.element('admin-tabs').listeners.click({target:{closest:()=>({dataset:{adminView:'audit'}})}});await settle();
 c.element('audit-fuente').value='BBVA';c.element('audit-fuente').listeners.change();await settle();assert.equal(c.rpc.filter(row=>row.method==='getAudit').at(-1).query.fuente,'BBVA');
 c.element('audit-pagination').listeners.click({target:{closest:()=>({dataset:{page:'1'}})}});await settle();assert.equal(c.rpc.filter(row=>row.method==='getAudit').at(-1).query.page,1);
 c.element('audit-resultado').value='Error';c.element('audit-resultado').listeners.change();await settle();assert.equal(c.rpc.filter(row=>row.method==='getAudit').at(-1).query.page,0);assert.equal(c.rpc.filter(row=>row.method==='getDashboard').length,1);
 c.element('audit-from').value='2026-10-12';c.element('audit-to').value='2026-10-11';const before=c.rpc.length;c.element('audit-to').listeners.change();await settle();assert.equal(c.rpc.length,before);assert.match(c.element('message').textContent,/anterior/);
});
test('filtrar Fuentes por estado conserva la selección de las filas ocultas',async()=>{
 const c=client(),feeds=[{id:'active',name:'BBVA',entity:'BBVA',country:'España',kind:'profile',url:'https://example.com/a',enabled:true},{id:'off',name:'Santander',entity:'Santander',country:'México',kind:'rss',url:'https://example.com/b',enabled:false}];
 c.requests[0].resolve({...dashboard('Inicial'),admin:true,feeds:[],configuredFeeds:feeds,runs:[],collection:{}});await settle();
 c.element('source-enabled').value='false';c.element('source-enabled').listeners.change();assert.match(c.element('configured-sources-body').innerHTML,/Santander/);assert.doesNotMatch(c.element('configured-sources-body').innerHTML,/data-id="active"/);
 c.element('configured-sources-body').listeners.change({target:{matches:()=>true,dataset:{id:'off'},checked:true}});assert.match(c.element('configured-sources-body').innerHTML,/No hay fuentes/);
 c.element('save-source-settings').listeners.click();await settle();const saved=c.rpc.find(row=>row.method==='saveSourceSettings').query;assert.equal(saved.length,2);assert.ok(saved.includes('active'));assert.ok(saved.includes('off'));
});
