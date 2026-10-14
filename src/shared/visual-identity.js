const publisherIdentities=new Map();
export function identityMark(kind,name,escape,images){
 if(kind==='publishers'&&!publisherIdentities.size)for(const [name,asset] of Object.entries(IDENTITY_ASSETS.publishers))publisherIdentities.set(name.toLowerCase().trim(),asset);
 const asset=kind==='publishers'?publisherIdentities.get(String(name||'').toLowerCase().trim()):IDENTITY_ASSETS[kind]?.[name];
 if(!asset)return kind==='entities'&&name?'<span class="entity-monogram" title="'+escape(name)+'" aria-label="'+escape(name)+'">'+escape(name.split(/\s+/).map(word=>word[0]).join('').slice(0,2))+'</span>':'';
 if(images)images.set(asset.id,asset);
 const src=images?'cid:'+asset.id:'data:image/png;base64,'+asset.data;
 return '<img class="'+(kind==='countries'?'geography-flag':kind==='publishers'?'publisher-logo':'entity-logo')+'" src="'+src+'" width="'+asset.width+'" height="'+asset.height+'" alt="'+escape(name)+'" title="'+escape(name)+'"'+(images?'':' loading="lazy" decoding="async"')+'>';
}
export function storyIdentity(entity,country,escape,images){
 const marks=identityMark('entities',entity,escape,images)+identityMark('countries',country,escape,images);
 return marks?'<span class="story-identity">'+marks+'</span>':'';
}
