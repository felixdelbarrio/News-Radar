
function noveltyOverview(items,signalNames=[],country=row=>geographyLabel(row.pais)){
  const signals=new Map(signalNames.map(name=>[name,0])),geographies=new Map(),entities=new Set();
  for(const row of items){
    const name=country(row);
    if(!geographies.has(name))geographies.set(name,{name,total:0,entities:new Set(),signals:new Map(signalNames.map(name=>[name,0]))});
    const geography=geographies.get(name);geography.total++;geography.entities.add(row.entidad||'Entidad no identificada');entities.add(row.entidad||'Entidad no identificada');
    for(const signal of new Set(row.senales||[])){signals.set(signal,(signals.get(signal)||0)+1);geography.signals.set(signal,(geography.signals.get(signal)||0)+1);}
  }
  const counts=values=>[...values].map(([name,total])=>({name,total}));
  return {total:items.length,entities:entities.size,bySignal:counts(signals),geographies:[...geographies.values()].map(({signals,entities,...row})=>({...row,entityCount:entities.size,bySignal:counts(signals)})).sort(geographyOrder)};
}
function noveltyGroups(items,country=row=>geographyLabel(row.pais)){
  const geographies=new Map();
  for(const row of items){
    const name=country(row),entity=row.entidad||'Entidad no identificada',segment=[...new Set(row.segmentos||[])].sort((a,b)=>a.localeCompare(b,'es')).join(' · ')||'Segmento no identificado';
    if(!geographies.has(name))geographies.set(name,{name,items:[],entities:new Map()});
    const geography=geographies.get(name);geography.items.push(row);
    if(!geography.entities.has(entity))geography.entities.set(entity,{name:entity,items:[],segments:new Map()});
    const group=geography.entities.get(entity);group.items.push(row);
    if(!group.segments.has(segment))group.segments.set(segment,{name:segment,items:[]});
    group.segments.get(segment).items.push(row);
  }
  return [...geographies.values()].map(row=>({...row,entities:[...row.entities.values()].map(entity=>({...entity,total:entity.items.length,segments:[...entity.segments.values()]})).sort(entityVolumeOrder)})).sort(geographyOrder);
}
function noveltyCount(count,singular,plural,translate=value=>value){return count+' '+translate(count===1?singular:plural);}
