// Sparse statistics and bounded evidence; article bodies are never retained.
const TAXONOMY_POLICY=Object.freeze({version:'3.38.0',batchRows:100,maxMs:10000,maxCandidates:600,maxEmergingPerLever:3,minEmergingDocuments:3,minEmergingSources:2,maxTerms:24,checkpointRows:20,checkpointChars:40000,maxAssignments:3,maxOverlapLinks:32,overlapContainment:.8,overlapSizeRatio:.5});
const taxonomyDefinitionMemory=new WeakMap();
// Functional decisions are provided by the fixed Apps Script library version.
function taxonomyText(value){return EDCCatalogClassifier.normalizeFunctionalText(value);}
function functionalContext(value){return EDCCatalogClassifier.evaluateFunctionalContext(value);}
function taxonomyDefinitions(blocks){
 if(taxonomyDefinitionMemory.has(blocks))return taxonomyDefinitionMemory.get(blocks);
 const definitions=blocks.flatMap(block=>[
  {key:block.name,palanca:block.name,subpalanca:'',segments:['Empresas'],terms:block.terms.map(taxonomyText),emerging:block.emerging},
  {key:block.name+'|Otros',palanca:block.name,subpalanca:block.name.slice(0,2)+'.xx Otros',segments:['Empresas'],terms:[],context:[],exclude:[],description:'Operativa del bloque sin suboperativa específica demostrada.',origin:'local'},
  ...block.functions.map(row=>({key:row.id,palanca:block.name,subpalanca:row.id+'.'+row.name,segments:['Empresas'],description:row.description||'',context:(row.context||[]).map(taxonomyText),exclude:(row.exclude||[]).map(taxonomyText),terms:[...new Set([taxonomyText(row.name),...row.terms.map(taxonomyText)])]}))
 ]);taxonomyDefinitionMemory.set(blocks,definitions);return definitions;
}
function taxonomySeed(state,definitions){state.catalog=definitions;}
function taxonomyTermCounts(text,terms){return EDCCatalogClassifier.countFunctionalTerms(text,terms);}
function functionalPrimary(value){return EDCCatalogClassifier.getFunctionalPrimary(value);}
function taxonomyDecision(text,definitions,headline=''){return EDCCatalogClassifier.matchFunctionalEvidence(text,definitions,headline);}
function taxonomyIndependentEvidence(evidence,used){return EDCCatalogClassifier.isIndependentFunctionalEvidence(evidence,used);}
function taxonomyMatches(text,definitions,headline=''){return taxonomyDecision(text,definitions,headline).matches;}
function taxonomyObserve(state,text,definitions,excludedWords,evidence='',options={}){
 taxonomySeed(state,definitions);
 const matched=taxonomyMatches(text,definitions,options.headline);if(!matched.length&&!definitions.some(row=>!row.subpalanca&&(taxonomyTermCounts(text,row.terms).size||row.emerging.some(concept=>taxonomyTermCounts(text,concept.terms.map(taxonomyText)).size))))return false;
 state.documents++;state.size=Object.keys(state.candidates).length;
 const observed=[];
 const observe=(entry,count)=>{
  let stats=state.candidates[entry.key];
  if(!stats){if(state.size>=definitions.length+TAXONOMY_POLICY.maxCandidates)return;stats=state.candidates[entry.key]={...entry,df:0,tf:0,sources:[]};state.size++;}
  stats.primaryEvidence=Boolean(stats.primaryEvidence||entry.primaryEvidence);stats.df++;stats.tf+=1+Math.log(count);observed.push(stats);
 };
 for(const {row,count}of matched)observe({...row,origin:'regla'},count);
 for(const a of observed)for(const b of observed){if(a===b)continue;a.overlap=a.overlap||{};if(Object.hasOwn(a.overlap,b.key)||Object.keys(a.overlap).length<TAXONOMY_POLICY.maxOverlapLinks)a.overlap[b.key]=(a.overlap[b.key]||0)+1;}
 return true;
}
function taxonomyBuild(state){
 const candidates=new Map((state.catalog||[]).map(row=>[row.key,{...row,origin:'regla',df:0,tf:0}]));
 for(const row of Object.values(state.candidates))candidates.set(row.key,row);
 const rows=[...candidates.values()].map(row=>({...row,peso:Number((row.tf/Math.max(1,state.documents)*(Math.log((1+state.documents)/(1+row.df))+1)).toFixed(6))}));
 const anchors=rows.filter(row=>row.origin==='regla');
 return anchors.sort((a,b)=>a.palanca.localeCompare(b.palanca,'es')||a.subpalanca.localeCompare(b.subpalanca,'es'));
}

function taxonomyEvidenceSupports(text,terms){return EDCCatalogClassifier.hasFunctionalEvidence(text,terms);}
