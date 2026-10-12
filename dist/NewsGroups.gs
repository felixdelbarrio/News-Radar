
function newsEntityGroups(items){
  const entities=new Map();
  for(const row of items){
    const name=row.entidad||'Entidad no identificada';
    if(!entities.has(name))entities.set(name,{name,total:0,items:[]});
    const group=entities.get(name);group.total++;group.items.push(row);
  }
  return [...entities.values()].sort(entityOrder);
}
function newsEntityPage(items,offset,limit){
  const page=[];
  for(const group of newsEntityGroups(items)){
    if(offset>=group.total){offset-=group.total;continue;}
    page.push(...group.items.slice(offset,offset+limit-page.length));offset=0;
    if(page.length===limit)break;
  }
  return page;
}
