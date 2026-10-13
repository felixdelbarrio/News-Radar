function taxonomyHeatmap_(rows,entityName=entityKey_){
  const nodes=[],indices=new Map(),entities=new Map(),countries=new Map();let tagged=0;
  function node(category,level){
    const key=level==='palanca'?'p:'+category.palanca:'s:'+category.id;
    if(!indices.has(key)){indices.set(key,nodes.length);nodes.push({id:key,level,palanca:category.palanca,subpalanca:level==='palanca'?'':category.subpalanca,count:0});}
    return indices.get(key);
  }
  function group(map,name,labels){
    if(!map.has(name))map.set(name,{name,total:0,counts:new Map()});const row=map.get(name);row.total++;
    for(const index of labels)row.counts.set(index,(row.counts.get(index)||0)+1);
  }
  for(const row of rows){
    const labels=new Set();for(const category of row.taxonomia){labels.add(node(category,'palanca'));labels.add(node(category,'subpalanca'));}
    if(labels.size)tagged++;for(const index of labels)nodes[index].count++;
    group(entities,entityName(row.entidad),labels);group(countries,row.pais||settings_().unknownCountry,labels);
  }
  const groups=map=>[...map.values()].sort((a,b)=>Number(b.name==='BBVA')-Number(a.name==='BBVA')||b.total-a.total||a.name.localeCompare(b.name,'es')).map(row=>({...row,counts:[...row.counts]}));
  return {nodes,entities:groups(entities),countries:groups(countries),total:rows.length,tagged};
}
