import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {storage} from './helpers/server.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('./fixtures/multilingual-functional.json',import.meta.url)));
function runtime(){const s=storage();s.c.initializeConfiguration();s.c.publishTaxonomy_({documents:0,candidates:{}});return s.c;}
function evaluate(c,row,title=row.title){const feed={name:row.entity+' · '+row.country,kind:'profile',entity:row.entity,country:row.country,language:row.language,domain:'news.google.com',url:'https://news.google.com/rss/search'},now=new Date('2026-11-22T12:00:00Z');return c.evaluate_({title,excerpt:'',url:'https://news.google.com/rss/articles/synthetic',date:'2026-11-21T12:00:00Z',language:row.language},feed,now);}
for(const row of cases)test('multilingual admission and functional assignment: '+row.language,()=>{
 const c=runtime(),result=evaluate(c,row);assert.ok(result.item,row.language+': '+result.reason);assert.equal(result.item.entity,row.entity);assert.equal(result.item.country,row.country);
 const assignment=c.taxonomyRecord_(result.item.title,result.item.excerpt,undefined,result.item.labels),items=new Map(c.taxonomyCatalog_().map(r=>[r.id,r]));assert(assignment.ids.some(id=>items.get(id).subpalanca.startsWith('03.13.')),row.language+' international transfer');
 if(row.retail)assert.equal(evaluate(c,row,row.retail).item,undefined,row.language+' retail');
 if(row.corporate)assert.equal(evaluate(c,row,row.corporate).item,undefined,row.language+' corporate incidental');
});
test('Portuguese PT/BR preserve the difference between business services and consumer offers',()=>{
 const c=runtime();for(const row of cases.filter(r=>r.language.startsWith('pt-'))){assert.equal(evaluate(c,row,row.entity+' lança empréstimo pessoal na banca online').item,undefined);assert.equal(evaluate(c,row,row.entity+' divulga relatório anual e menciona banca online para empresas').item,undefined);}
});

const reviewedTerms=[
 ['likidite yonetimi','capability','Tesorería y cash management'],['lansman','signal','Lanzamiento de producto'],
 ['firmenkundengeschaft','audience',''],['liquiditatsmanagement','capability','Tesorería y cash management'],['zahlungsverkehr','capability','Pagos'],['einfuhrung','signal','Lanzamiento de producto'],['partnerschaft','signal','Alianza estratégica'],
 ['banque en ligne','channel',''],['gestion de tresorerie','capability','Tesorería y cash management'],['gestion de liquidite','capability','Tesorería y cash management'],['paiements','capability','Pagos'],['lancement','signal','Lanzamiento de producto'],['partenariat','signal','Alianza estratégica'],
 ['gestione della liquidita','capability','Tesorería y cash management'],['lancio','signal','Lanzamiento de producto'],
 ['servicii bancare pentru companii','audience',''],['gestionarea lichiditatii','capability','Tesorería y cash management'],['plati','capability','Pagos'],['lansare','signal','Lanzamiento de producto'],['parteneriat','signal','Alianza estratégica'],
 ['cashmanagement','capability','Tesorería y cash management'],['liquiditeitsbeheer','capability','Tesorería y cash management'],['betalingen','capability','Pagos'],['lancering','signal','Lanzamiento de producto'],['samenwerking','signal','Alianza estratégica']
];
test('all 25 reviewed expressions supply their role only inside a complete business service context',()=>{
 const c=runtime(),base={language:'en',entity:'Qonto',country:'España',title:''};
 for(const [term,role,target] of reviewedTerms){
  const title=role==='audience'?'Qonto: '+term+' online banking':role==='channel'?'Qonto: '+term+' for businesses, payments':'Qonto: '+term+' online banking service for businesses';
  const result=evaluate(c,base,title);assert(result.item,term+': '+result.reason);
  if(role==='capability')assert(result.item.labels.capacidades.includes('Empresas: '+target),term+' capability');
  if(role==='signal')assert.equal(result.item.labels.evento,target,term+' signal');
  assert.equal(evaluate(c,base,'Qonto: '+term).item,undefined,term+' alone');
 }
});
test('shared language aliases respect disabled capability and signal rows',()=>{
 const c=runtime(),config=JSON.parse(JSON.stringify(c.configuration_()));config.capabilities.Empresas.find(r=>r.name==='Pagos').enabled=false;config.signals.find(r=>r.name==='Lanzamiento de producto').enabled=false;c.configuration_=()=>config;
 const result=evaluate(c,{language:'fr',entity:'Qonto',country:'Francia',title:'Qonto lancement: paiements via online banking for businesses'});assert(result.item);assert(!result.item.labels.capacidades.includes('Empresas: Pagos'));assert.notEqual(result.item.labels.evento,'Lanzamiento de producto');
});
test('Portuguese banking context does not turn the Santander municipality into the bank',()=>{
 const c=runtime(),row=cases.find(r=>r.language==='pt-BR');assert.equal(evaluate(c,row,'Prefeitura de Santander lança aplicativo para empresas com remessas internacionais').item,undefined);
});

test('native syndicated headlines deduplicate without merging different services or losing vowel marks',()=>{
 const c=runtime(),row=cases.find(r=>r.language==='zh-Hans'),item=evaluate(c,row).item,known={titles:new Map()};assert(item);c.rememberTitle_(known,item);assert(c.duplicateTitle_(known,{...item,url:item.url+'-syndicated'}));assert.ok(!c.duplicateTitle_(known,{...item,title:'中国工商银行推出企业网上银行流动性管理服务',url:item.url+'-different'}));
 const hindi=cases.find(r=>r.language==='hi');assert(c.titleKey_(hindi.title,'').includes('हस्तांतरण'));
});
