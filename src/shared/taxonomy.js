// Sparse statistics and bounded evidence; article bodies are never retained.
export const TAXONOMY_POLICY=Object.freeze({version:'3.3.0',batchRows:100,maxMs:10000,maxCandidates:600,maxEmergingPerLever:3,minEmergingDocuments:3,minEmergingSources:2,maxTerms:24,checkpointRows:20,checkpointChars:40000,maxOverlapLinks:32,overlapContainment:.8,overlapSizeRatio:.5});
const definitionIndexes=new WeakMap(),taxonomyDefinitionMemory=new WeakMap();
export function taxonomyText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i');}
const words=value=>taxonomyText(value).match(/[a-z][a-z0-9]+/g)||[];
export function taxonomyDefinitions(blocks){
 if(taxonomyDefinitionMemory.has(blocks))return taxonomyDefinitionMemory.get(blocks);
 const definitions=blocks.flatMap(block=>[
  {key:block.name,palanca:block.name,subpalanca:'',segments:['Empresas'],terms:block.terms.map(taxonomyText),emerging:block.emerging},
  ...block.functions.map(row=>({key:row.id,palanca:block.name,subpalanca:row.id+'.'+row.name,segments:['Empresas'],terms:[...new Set([taxonomyText(row.name),...row.terms.map(taxonomyText)])]}))
 ]);taxonomyDefinitionMemory.set(blocks,definitions);return definitions;
}
export function taxonomySeed(state,definitions){state.catalog=definitions;}
function taxonomyIndex(definitions){
 let index=definitionIndexes.get(definitions);if(index)return index;
 const known=new Set(definitions.filter(row=>row.subpalanca).flatMap(row=>row.terms.map(taxonomyText)));
 index={known};definitionIndexes.set(definitions,index);return index;
}
export function taxonomyTermCounts(text,terms){
 const counts=new Map();
 for(const term of terms){if(!term)continue;let at=-1,count=0;while((at=text.indexOf(term,at+1))>=0)if((at===0||!/[a-z0-9]/.test(text[at-1]))&&(at+term.length===text.length||!/[a-z0-9]/.test(text[at+term.length])))count++;if(count)counts.set(term,count);}
 return counts;
}
export function taxonomyMatches(text,definitions){
 const matched=[];for(const row of definitions){const counts=taxonomyTermCounts(text,row.terms);if(counts.size)matched.push({row,count:[...counts.values()].reduce((a,b)=>a+b,0)});}
 const detailed=new Set(matched.filter(({row})=>row.subpalanca).map(({row})=>row.palanca));
 return matched.filter(({row})=>row.subpalanca||!detailed.has(row.palanca));
}
export function taxonomyObserve(state,text,definitions,excludedWords,evidence=''){
 taxonomySeed(state,definitions);
 const matched=taxonomyMatches(text,definitions);if(!matched.length)return false;
 state.documents++;state.size=Object.keys(state.candidates).length;
 const observed=[];
 const observe=(entry,count)=>{
  let stats=state.candidates[entry.key];
  if(!stats){if(state.size>=definitions.length+TAXONOMY_POLICY.maxCandidates)return;stats=state.candidates[entry.key]={...entry,df:0,tf:0,sources:[]};state.size++;}
  stats.df++;stats.tf+=1+Math.log(count);if(entry.origin==='tf-idf'){stats.terms=[...new Set([...stats.terms,...entry.terms])].slice(0,TAXONOMY_POLICY.maxTerms);if(evidence&&!stats.sources.includes(evidence)&&stats.sources.length<8)stats.sources.push(evidence);}observed.push(stats);
 };
 for(const {row,count}of matched)observe({...row,origin:'regla'},count);
 const {known}=taxonomyIndex(definitions);
 for(const block of definitions.filter(row=>!row.subpalanca))for(const concept of block.emerging){
  const terms=concept.terms.map(taxonomyText),name=taxonomyText(concept.name);
  if(known.has(name)||terms.some(term=>known.has(term))||words(name).some(word=>excludedWords.has(word)))continue;
  const counts=taxonomyTermCounts(text,terms);if(!counts.size)continue;
  observe({key:block.key+'|'+name,palanca:block.palanca,subpalanca:block.palanca.slice(0,2)+'.xx '+concept.name,terms,segments:['Empresas'],origin:'tf-idf'},[...counts.values()].reduce((a,b)=>a+b,0));
 }
 for(const a of observed)for(const b of observed){if(a===b)continue;a.overlap=a.overlap||{};if(Object.hasOwn(a.overlap,b.key)||Object.keys(a.overlap).length<TAXONOMY_POLICY.maxOverlapLinks)a.overlap[b.key]=(a.overlap[b.key]||0)+1;}
 return true;
}
export function taxonomyRedundant(a,b){
 const common=Math.max(a.overlap?.[b.key]||0,b.overlap?.[a.key]||0),small=Math.min(a.df,b.df),large=Math.max(a.df,b.df);
 return small>0&&common/small>=TAXONOMY_POLICY.overlapContainment&&small/large>=TAXONOMY_POLICY.overlapSizeRatio;
}
export function taxonomyBuild(state){
 const candidates=new Map((state.catalog||[]).map(row=>[row.key,{...row,origin:'regla',df:0,tf:0}]));
 for(const row of Object.values(state.candidates))candidates.set(row.key,row);
 const rows=[...candidates.values()].map(row=>({...row,peso:Number((row.tf/Math.max(1,state.documents)*(Math.log((1+state.documents)/(1+row.df))+1)).toFixed(6))}));
 const anchors=rows.filter(row=>row.origin==='regla'),blocks=new Set(anchors.map(row=>row.palanca)),counts=new Map();
 const emerging=rows.filter(row=>row.origin==='tf-idf'&&blocks.has(row.palanca)&&row.df>=TAXONOMY_POLICY.minEmergingDocuments&&(row.sources?.length||0)>=TAXONOMY_POLICY.minEmergingSources).sort((a,b)=>b.df-a.df||b.peso-a.peso||a.key.localeCompare(b.key));
 for(const row of emerging){
  if(anchors.some(anchor=>anchor.origin==='tf-idf'&&anchor.palanca===row.palanca&&taxonomyRedundant(row,anchor)))continue;
  const count=counts.get(row.palanca)||0;if(count>=TAXONOMY_POLICY.maxEmergingPerLever)continue;counts.set(row.palanca,count+1);anchors.push(row);
 }
 return anchors.sort((a,b)=>a.palanca.localeCompare(b.palanca,'es')||a.subpalanca.localeCompare(b.subpalanca,'es'));
}
