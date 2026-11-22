// Execute the real, commit-pinned library package; never emulate its decisions.
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../node_modules/edc-catalog-classifier/',import.meta.url);
const modules=['LanguageLexicon.gs','Classifier.gs','EvidenceRanking.gs','EvidenceBatch.gs','FunctionalRuntime.gs'];
const exports=['getFunctionalLanguageLexicon','getFunctionalRuntimePolicy','normalizeFunctionalText','evaluateFunctionalContext','getFunctionalFinancingPurpose','getFunctionalPrimary','matchFunctionalEvidence','countFunctionalTerms','isIndependentFunctionalEvidence','hasFunctionalEvidence','getFunctionalFallback'];
export function classifierRuntimeSource(){return 'var EDCCatalogClassifier=(function(){'+modules.map(name=>fs.readFileSync(new URL(name,root),'utf8')).join('\n')+';return {'+exports.join(',')+'};})();\n';}
export function classifierRuntime(){
 const context=vm.createContext({});
 for(const name of modules)vm.runInContext(fs.readFileSync(new URL(name,root),'utf8'),context,{filename:'EDCCatalogClassifier/'+name});
 return context;
}
globalThis.EDCCatalogClassifier=classifierRuntime();
