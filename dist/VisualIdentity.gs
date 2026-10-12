function identityMark(kind,name,escape,images){
 const asset=IDENTITY_ASSETS[kind][name];
 if(!asset)return kind==='entities'&&name?'<span class="entity-monogram" title="'+escape(name)+'" aria-label="'+escape(name)+'">'+escape(name.split(/\s+/).map(word=>word[0]).join('').slice(0,2))+'</span>':'';
 if(images)images.set(asset.id,asset);
 const src=images?'cid:'+asset.id:'data:image/png;base64,'+asset.data;
 return '<img class="'+(kind==='entities'?'entity-logo':'geography-flag')+'" src="'+src+'" width="'+asset.width+'" height="'+asset.height+'" alt="'+escape(name)+'" title="'+escape(name)+'"'+(images?'':' loading="lazy" decoding="async"')+'>';
}
function storyIdentity(entity,country,escape,images){
 const marks=identityMark('entities',entity,escape,images)+identityMark('countries',country,escape,images);
 return marks?'<span class="story-identity">'+marks+'</span>':'';
}
