function newsletterCategories_(items,annual=false){
  const categories=new Map();
  for(const item of items){
    const labels=new Set((item.taxonomia||[]).map(annual?taxonomyPath:category=>category.palanca));
    if(!labels.size)labels.add('Sin clasificar');
    for(const name of labels){
      if(!categories.has(name))categories.set(name,{name,total:0,item});
      const category=categories.get(name);category.total++;
      const previous=category.item;
      if(item.fecha>previous.fecha||item.fecha===previous.fecha&&(entityOrder({name:item.entidad,total:0},{name:previous.entidad,total:0})||String(item.id).localeCompare(String(previous.id)))<0)category.item=item;
    }
  }
  return [...categories.values()].sort((a,b)=>Number(a.name==='Sin clasificar')-Number(b.name==='Sin clasificar')||b.total-a.total||a.name.localeCompare(b.name,'es'));
}
function newsletterDigest_(items,annual=false){
  const groups=noveltyGroups(items),featured=[],selections=new Map();
  for(const geography of groups){
    if(annual){
      for(const entity of geography.entities)selections.set(entity,{categories:newsletterCategories_(entity.items,true),total:entity.items.length});
    }else{
      const category=newsletterCategories_(geography.items)[0];
      featured.push(category.item);selections.set(geography,{item:category.item,category:category.name,occurrences:category.total,remaining:geography.items.length-1});
    }
  }
  return {groups,featured,selections};
}
function newsletterExcerpt_(value){
  const text=String(value||'').trim();if(text.length<=240)return text;
  const end=text.lastIndexOf(' ',240);return text.slice(0,end>160?end:240).trimEnd()+'…';
}
