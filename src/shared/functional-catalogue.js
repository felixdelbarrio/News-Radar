// Official labels and descriptions come exclusively from the read-only catalogue mirror.
export function functionalCatalogRules(catalogue,rules){
 const aliases=new Map(rules.flatMap(block=>block.functions.map(row=>[row.id,row])));
 return catalogue.map(block=>{
  const ids=new Set(block.functions.map(row=>row.id)),rule=rules.find(row=>row.name===block.name)||rules.find(row=>row.functions.some(item=>ids.has(item.id)));
  return {...block,terms:rule?.terms||[],emerging:rule?.emerging||[],functions:block.functions.map(row=>{const alias=aliases.get(row.id);return {...row,terms:alias?.terms||[],context:alias?.context||[],exclude:alias?.exclude||[]};})};
 });
}
export function functionalRuleSettings(blocks){
 const key=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return blocks.map(({name,terms,emerging,functions})=>({name,terms,emerging:emerging.map(functionalConditions),functions:functions.map(({id,name,terms,context,exclude})=>functionalConditions({id,terms:terms.filter(term=>!name||key(term)!==key(name)),context,exclude}))}));
}
function functionalConditions({context,exclude,...row}){return {...row,...(context?.length?{context}:{}),...(exclude?.length?{exclude}:{})};}
