import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import {taxonomyDefinitions,taxonomyMatches,taxonomyText} from '../src/shared/taxonomy.js';
import {taxonomyPath,taxonomyDisplayLabel} from '../src/shared/taxonomy-path.js';
const config=JSON.parse(fs.readFileSync(new URL('../assets/configuration-defaults.json',import.meta.url))),definitions=taxonomyDefinitions(config.taxonomy);
test('la evidencia específica del titular produce una única pareja, incluso ante varios bloques en el resumen',()=>{
 const title='BBVA mejora pagos VOSTRO para empresas',text=taxonomyText(title+' con financiación, cuentas, crédito virtual, deep links y un login biométrico');
 const matches=taxonomyMatches(text,definitions,title);assert.equal(matches.length,1);assert.equal(matches[0].row.key,'03.09');assert.equal(matches[0].row.palanca,'03.Pagos - Transf. y traspasos');
 assert.equal(taxonomyMatches('sin evidencia funcional',definitions).length,0);
});
test('cada nombre y código del catálogo conserva su identidad original en español',()=>{
 const s=storage(),c=s.c;c.initializeConfiguration();c.startTaxonomy();for(let i=0;i<5&&c.taxonomyPending_();i++)c.taxonomyBatch_();
 const names=c.taxonomyTranslations_().es;for(const block of config.taxonomy){assert.equal(names[block.name],block.name);for(const row of block.functions)assert.equal(names[row.id+'.'+row.name],row.id+'.'+row.name);}
 assert.equal(c.taxonomyLanguage_('es',{'16.Security Experience & Onboarding':'Seguridad'})('16.Security Experience & Onboarding'),'16.Security Experience & Onboarding');
});
test('los filtros muestran nombres sin índices, en orden alfabético y con valores canónicos relacionados',async t=>{
 const blocks=['20.Venta Digital','02.Cuentas','08.Financiación'],rows=[{palanca:blocks[0],subpalanca:'20.04.Quantum'},{palanca:blocks[1],subpalanca:'02.01.Landing de cuentas'},{palanca:blocks[2],subpalanca:'08.02.Crédito Virtual'}];
 const a=await app(t,{configure({data}){data.palanca=blocks;data.subpalanca=rows.map(taxonomyPath);data.taxonomyTranslations={es:{'20.Venta Digital':'Incorrecto'}};data.items=[{id:'a',fecha:'2026-10-10',titular:'Titular',url:'https://example.com/a',medio:'Editor',fuente:'RSS',taxonomia:[rows[0]]}];}});
 await a.click('[data-view="news"]');const parent=a.find('#filters [name="palanca"]'),child=a.find('#filters [name="subpalanca"]');
 assert.deepEqual([...parent.options].map(o=>o.textContent),['Todos','Cuentas','Financiación','Venta Digital']);assert.deepEqual([...child.options].map(o=>o.textContent),['Todos','Crédito Virtual','Landing de cuentas','Quantum']);
 assert.match(a.find('#news-list').textContent,/20.Venta Digital/);assert.doesNotMatch(a.find('#news-list').textContent,/Bloque funcional:|Funcionalidad \/ Sub Operativa:|Incorrecto/);
 assert.match(a.find('#news-list').textContent,/Editor Origen RSS: RSS/);
 await a.change('#filters [name="palanca"]','02.Cuentas');assert.deepEqual([...child.options].map(o=>o.textContent),['Todos','Landing de cuentas']);assert.equal(child.options[1].value,taxonomyPath(rows[1]));
 assert.equal(taxonomyDisplayLabel('03.xx Pagos con stablecoins'),'Pagos con stablecoins');
});
test('las nuevas funciones entran en la búsqueda acotada sin un despliegue y el contexto empresarial permanece',()=>{
 const {c}=storage();c.initializeConfiguration();const rows=c.catalogueSearchRows_();assert.ok(rows.some(row=>row.key==='20.04'&&row.terms.includes('Quantum')));assert.ok(rows.some(row=>row.key==='03.09'&&row.terms.includes('vostro payments')));
 const current=c.getConfiguration();current.config.taxonomy.find(row=>row.name.startsWith('20.')).functions.push({id:'20.99',name:'NovaFleet',terms:[]});c.saveConfiguration(current);assert.ok(c.catalogueSearchRows_().some(row=>row.key==='20.99'));
 const geo=c.configuration_().geographies[0],entity=c.configuration_().entities[0],feed=c.profileFeed_(geo,entity,undefined,true),query=new URL(feed.url).searchParams.get('q');assert.match(query,/"(?:empresa|empresas|business)"/);assert.ok(query.length<1800);assert.ok(c.capabilitySearchTerms_(geo,entity).length<=6);
});

test('TF-IDF admite agentes y depósitos tokenizados solo tras evidencia recurrente y conserva un ganador',async()=>{
 const {taxonomyObserve,taxonomyBuild}=await import('../src/shared/taxonomy.js');
 for(const [phrase,code] of [['DBS rolls out agentic AI to corporate clients','17.xx Agentes de IA'],['ANZ completes tokenised deposit transactions','02.xx Depósitos tokenizados']]){
  const state={documents:0,candidates:{}};for(let i=0;i<2;i++)taxonomyObserve(state,taxonomyText(phrase),definitions,new Set(),'Medio '+i);assert.ok(!taxonomyBuild(state).some(row=>row.subpalanca===code));
  taxonomyObserve(state,taxonomyText(phrase),definitions,new Set(),'Medio 2');const model=taxonomyBuild(state);assert.ok(model.some(row=>row.subpalanca===code));const matches=taxonomyMatches(taxonomyText(phrase),model,phrase);assert.equal(matches.length,1);assert.equal(matches[0].row.subpalanca,code);
 }
});
test('equivalencias operativas cubren pago singular, Getnet, MCP, seguros y custodia',()=>{
 for(const [headline,code]of [['Getnet permitirá a las empresas una única solución de pago','11.01'],['Qonto lancia MCP nel conto business','17.16'],['Banco de Bogotá lanza seguro para transacciones Bre-B','14.01'],['Standard Chartered launches institutional custody','12.10']])assert.equal(taxonomyMatches(taxonomyText(headline),definitions,headline)[0]?.row.key,code,headline);
});
test('el catálogo amplía admisión sin recalcular 322 capacidades cuando una capacidad habitual ya basta',()=>{
 const {c}=storage();c.initializeConfiguration();const title='BBVA launches digital payments for businesses',known=c.digitalAssessment_(c.searchText_(title),c.searchText_(title));assert.ok(known.relevant);assert.ok(known.capabilities.every(row=>!/^\d{2}\./.test(row.name)));
 const snapshot=c.getConfiguration();snapshot.config.taxonomy.find(row=>row.name.startsWith('20.')).functions.push({id:'20.99',name:'NovaFleet',terms:[]});c.saveConfiguration(snapshot);const discovery='BBVA launches NovaFleet in its digital channel for businesses';assert.ok(c.digitalAssessment_(c.searchText_(discovery),c.searchText_(discovery)).relevant);
});
test('cambiar propuestas emergentes no obliga a reclasificar la admisión de todo el histórico',()=>{
 const {c}=storage();c.initializeConfiguration();const before=c.classificationRulesRevision_(),config=structuredClone(c.configuration_());config.taxonomy[0].emerging.push({name:'Función nueva',terms:['funcion nueva']});assert.equal(c.classificationRulesRevision_(config),before);config.taxonomy[0].functions[0].terms.push('nuevo termino operativo');assert.notEqual(c.classificationRulesRevision_(config),before);
});

test('una noticia sin evidencia permanece visible con una marca distinta de las funciones .xx',async t=>{
 const a=await app(t,{configure({data}){data.items=[{id:'unknown',fecha:'2026-10-10',titular:'Encuentro empresarial de IA',url:'https://example.com/unknown',taxonomia:[]}];}});await a.click('[data-view="news"]');assert.match(a.find('#news-list').textContent,/Encuentro empresarial de IA/);assert.match(a.find('#news-list').textContent,/Sin clasificación funcional justificable/);assert.doesNotMatch(a.find('#news-list').textContent,/\.xx/);
});
