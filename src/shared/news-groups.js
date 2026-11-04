import {entityOrder} from './selection-policy.js';
export function articleEntities(row){return row.entidades?.length?row.entidades:[row.entidad||'Entidad no identificada'];}
export function newsEntityGroups(items,primaryOnly=false){
  const entities=new Map();
  for(const row of items){
    for(const name of new Set(primaryOnly?[row.entidad||'Entidad no identificada']:articleEntities(row))){
      if(!entities.has(name))entities.set(name,{name,total:0,items:[]});
      const group=entities.get(name);group.total++;group.items.push(row);
    }
  }
  return [...entities.values()].sort(entityOrder);
}
export function newsEntityPage(items,offset,limit){
  const page=[];
  for(const group of newsEntityGroups(items,true)){
    if(offset>=group.total){offset-=group.total;continue;}
    page.push(...group.items.slice(offset,offset+limit-page.length));offset=0;
    if(page.length===limit)break;
  }
  return page;
}
