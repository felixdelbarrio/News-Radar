
function noveltyOverview(items,signalNames=[],country=row=>articleGeographies(row).map(geographyLabel)){
  const signals=new Map(signalNames.map(name=>[name,0])),geographies=new Map(),entities=new Set();
  for(const row of items){
    const names=new Set(country.members?.(row)||[country(row)].flat());entities.add(row.entidad||'Entidad no identificada');
    for(const signal of new Set(row.senales||[]))signals.set(signal,(signals.get(signal)||0)+1);
    for(const name of names){if(!geographies.has(name))geographies.set(name,{name,total:0,entities:new Set(),signals:new Map(signalNames.map(name=>[name,0]))});const geography=geographies.get(name);geography.total++;geography.entities.add(row.entidad||'Entidad no identificada');for(const signal of new Set(row.senales||[]))geography.signals.set(signal,(geography.signals.get(signal)||0)+1);}
  }
  const counts=values=>[...values].map(([name,total])=>({name,total}));
  return {total:items.length,entities:entities.size,bySignal:counts(signals),geographies:[...geographies.values()].map(({signals,entities,...row})=>({...row,entityCount:entities.size,bySignal:counts(signals)})).sort(geographyOrder)};
}
// Publication dates are stored as ISO calendar dates; identity makes ties deterministic.
function publicationOrder(a,b){return String(b.fecha||'').localeCompare(String(a.fecha||''))||String(a.id||a.url||a.titular||'').localeCompare(String(b.id||b.url||b.titular||''),'es');}
function noveltyGroups(items,country=row=>articleGeographies(row).map(geographyLabel)){
  const geographies=new Map();
  for(const row of items)for(const name of new Set(country.members?.(row)||[country(row)].flat())){if(!geographies.has(name))geographies.set(name,{name,items:[]});geographies.get(name).items.push(row);}
  return [...geographies.values()].map(group=>({...group,items:group.items.sort(publicationOrder)})).sort(geographyOrder);
}
function noveltyCount(count,singular,plural,translate=value=>value){return count+' '+translate(count===1?singular:plural);}
