function newsletterDigest_(items){
  const groups=noveltyGroups(items),featured=[],selections=new Map();
  for(const geography of groups)for(const entity of geography.entities){
    const categories=new Map();
    for(const item of entity.items){
      const paths=new Set((item.taxonomia||[]).map(taxonomyPath));
      if(!paths.size)paths.add('Sin clasificar');
      for(const path of paths){if(!categories.has(path))categories.set(path,{name:path,items:[]});categories.get(path).items.push(item);}
    }
    const ranked=[...categories.values()].sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name,'es')),chosen=[],seen=new Set();
    for(const category of ranked){
      const item=category.items.find(row=>!seen.has(row));if(!item)continue;
      seen.add(item);chosen.push({item,category:category.name,occurrences:category.items.length});featured.push(item);if(chosen.length===2)break;
    }
    selections.set(entity,{chosen,categories:ranked,total:entity.items.length,remaining:entity.items.length-chosen.length});
  }
  return {groups,featured,selections};
}
