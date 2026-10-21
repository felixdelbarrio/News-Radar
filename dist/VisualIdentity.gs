const identityIndexes=new Map();
function identityKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/^https?:\/\/(?:www\.)?|^www\./,'').replace(/\/$/,'');}
function identityAsset(kind,name){
 if(!identityIndexes.has(kind)){
  const index=new Map();
  for(const [label,asset] of Object.entries(IDENTITY_ASSETS[kind]||{}))for(const alias of [label,...(asset.aliases||[])])index.set(identityKey(alias),asset);
  identityIndexes.set(kind,index);
 }
 const canonical=kind==='entities'&&typeof entityKey_==='function'?entityKey_(name):kind==='publishers'&&typeof publisherKey_==='function'?publisherKey_(name):name;
 return identityIndexes.get(kind).get(identityKey(canonical))||identityIndexes.get(kind).get(identityKey(name));
}
function identityMark(kind,name,escape,images){
 const asset=identityAsset(kind,name);
 if(!asset)return kind==='entities'&&name?'<span class="entity-monogram" title="'+escape(name)+'" aria-label="'+escape(name)+'">'+escape(name.split(/\s+/).map(word=>word.replace(/^[^\p{L}\p{N}]+/u,'')[0]||'').join('').slice(0,2))+'</span>':'';
 if(images)images.set(asset.id,asset);
 const src=images?'cid:'+asset.id:'data:image/png;base64,'+asset.data;
 return '<img class="'+(kind==='countries'?'geography-flag':kind==='publishers'?'publisher-logo':'entity-logo')+'" src="'+src+'" width="'+asset.width+'" height="'+asset.height+'" alt="'+escape(name)+'" title="'+escape(name)+'"'+(images?'':' loading="lazy" decoding="async"')+'>';
}
function storyIdentity(entity,country,escape,images){
 const marks=identityMark('entities',entity,escape,images)+identityMark('countries',country,escape,images);
 return marks?'<span class="story-identity">'+marks+'</span>':'';
}
