// Official labels and descriptions come exclusively from the read-only catalogue mirror.
function functionalCatalogRules(catalogue,rules){
 const aliases=new Map(rules.flatMap(block=>block.functions.map(row=>[row.id,row])));
 return catalogue.map(block=>{
  const ids=new Set(block.functions.map(row=>row.id)),rule=rules.find(row=>row.name===block.name)||rules.find(row=>row.functions.some(item=>ids.has(item.id)));
  return {...block,terms:rule?.terms||[],emerging:rule?.emerging||[],functions:block.functions.map(row=>({...row,terms:aliases.get(row.id)?.terms||[]}))};
 });
}
function functionalRuleSettings(blocks){
 return blocks.map(({name,terms,emerging,functions})=>({name,terms,emerging,functions:functions.map(({id,terms})=>({id,terms}))}));
}
