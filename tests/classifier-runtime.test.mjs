import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {storage} from './helpers/server.mjs';
test('assignment and admission use the real library without a second local decision engine',()=>{
 const {c}=storage();c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});
 const runtime=c.EDCCatalogClassifier,original=runtime.matchFunctionalEvidence;let decisions=0;runtime.matchFunctionalEvidence=(...args)=>{decisions++;return original(...args);};
 const result=c.taxonomyRecord_('Transferencias internacionales para empresas','');
 assert.ok(decisions>0);assert.ok(Array.isArray(result.ids));
 const originalContext=runtime.evaluateFunctionalContext;runtime.evaluateFunctionalContext=()=>{throw Error('library-context-unavailable');};assert.throws(()=>c.functionalContext('banking API'),/library-context-unavailable/);
 runtime.evaluateFunctionalContext=originalContext;runtime.matchFunctionalEvidence=()=>{throw Error('library-ranking-unavailable');};assert.throws(()=>c.taxonomyRecord_('Transferencias internacionales para empresas',''),/library-ranking-unavailable/);
});
test('the deployment and executable test dependency use the frozen runtime API',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../src/appsscript.json',import.meta.url))),dependency=manifest.dependencies.libraries.find(row=>row.userSymbol==='EDCCatalogClassifier');assert.equal(dependency.version,'5');assert.equal(dependency.developmentMode,false);assert.equal(globalThis.EDCCatalogClassifier.getFunctionalRuntimePolicy().algorithmVersion,'5.9.1-multilingual-runtime');
});

test('taxonomy checkpoints pin the shared algorithm without invalidating the LLM catalogue model',()=>{
 const {c}=storage();c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});const before=c.taxonomyRulesRevision_(),model=c.taxonomyModelRevision_(c.taxonomyCatalog_()),original=c.EDCCatalogClassifier.getFunctionalRuntimePolicy;c.EDCCatalogClassifier.getFunctionalRuntimePolicy=()=>({...original(),algorithmVersion:'synthetic-changed-algorithm'});assert.notEqual(c.taxonomyRulesRevision_(),before);assert.equal(c.taxonomyModelRevision_(c.taxonomyCatalog_()),model);
});
