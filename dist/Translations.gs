let articleTranslationRows_,articleTranslationMemory_;
function articleTranslationKey_(row,language){return language+':'+sha256_(String(row.titular||'')+'\n'+String(row.extracto||''));}
function translationIdentityRows_(rows){
  if(!rows.length||!Object.keys(languageNames).some(language=>properties_().getProperty('TRANSLATIONS_REVISION:'+language)))return rows;
  const index=articleTranslationIndex_(),keys=rows.map(row=>Object.keys(languageNames).map(language=>articleTranslationKey_(row.original||row,language)).filter(key=>index.has(key))),values=cachedArticleTranslations_(keys.flat());
  rows.forEach((row,i)=>{row.identityTitles=[...new Set(keys[i].map(key=>values.get(key)?.titular).filter(Boolean))];});
  return rows;
}
function articleTranslationIndex_(){
  if(articleTranslationRows_)return articleTranslationRows_;
  const sheet=book_().getSheetByName('Traducciones'),count=sheet.getLastRow()-1;
  return articleTranslationRows_=new Map(count?sheet.getRange(2,1,count,1).getDisplayValues().map(([key],index)=>[key,index+2]):[]);
}
function cachedArticleTranslations_(keys){
  articleTranslationMemory_=articleTranslationMemory_||new Map();
  const missing=[...new Set(keys)].filter(key=>!articleTranslationMemory_.has(key));if(!missing.length)return articleTranslationMemory_;
  const cache=CacheService.getScriptCache(),cached=cache.getAll(missing.map(key=>'article:'+key)),uncached=[];
  for(const key of missing){const value=cached['article:'+key];if(value)articleTranslationMemory_.set(key,JSON.parse(value));else uncached.push(key);}
  if(!uncached.length)return articleTranslationMemory_;
  const index=articleTranslationIndex_(),positions=uncached.filter(key=>index.has(key)).map(key=>({key,row:index.get(key)})).sort((a,b)=>a.row-b.row),values={};
  for(const key of uncached)articleTranslationMemory_.set(key,null);
  let start=0;
  for(let end=1;end<=positions.length;end++){
    if(end<positions.length&&positions[end].row===positions[end-1].row+1)continue;
    const rows=book_().getSheetByName('Traducciones').getRange(positions[start].row,3,end-start,2).getDisplayValues();
    rows.forEach(([titular,extracto],offset)=>{const key=positions[start+offset].key,value={titular,extracto};articleTranslationMemory_.set(key,value);const encoded=cacheJsonValue_(value);if(encoded)values['article:'+key]=encoded;});start=end;
  }
  if(Object.keys(values).length)cache.putAll(values,21600);return articleTranslationMemory_;
}
function translateArticleText_(row,language){
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const input='<p id="headline">'+escape(row.titular)+'</p><p id="excerpt">'+escape(row.extracto)+'</p>';
  const html=LanguageApp.translate(input,'',language,{contentType:'html'});
  const blocks=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match=>plainText_(match[1]));
  if(blocks.length!==2||!blocks[0]||(row.extracto&&!blocks[1]))throw Error('Respuesta de traducción incompleta.');
  return {titular:blocks[0].slice(0,5000),extracto:blocks[1].slice(0,5000)};
}
function nativeArticle_(row,language,feeds){return feeds.has(row.fuente)&&String(row.idioma||'').toLowerCase().split(/[-_]/)[0]===language;}
function savedArticleTranslations_(rows,language){
  const feeds=new Set(configuration_().feeds.map(feed=>feed.name));
  const keys=rows.map(row=>nativeArticle_(row,language,feeds)?null:articleTranslationKey_(row,language)),values=cachedArticleTranslations_(keys.filter(Boolean));
  return rows.map((row,index)=>{
    if(nativeArticle_(row,language,feeds))return {...row,translation:{language,state:'native'}};
    const value=values.get(keys[index]);
    return {...row,...(value?{...value,original:{titular:row.titular,extracto:row.extracto}}:{}),translation:{language,state:value?'translated':'pending'}};
  });
}
function storeArticleTranslation_(row,language){
  const key=articleTranslationKey_(row,language),value=translateArticleText_(row,language),index=articleTranslationIndex_(),position=book_().getSheetByName('Traducciones').getLastRow()+1;
  append_('Traducciones',[[key,language,value.titular,value.extracto,new Date().toISOString()]]);index.set(key,position);
  articleTranslationMemory_=articleTranslationMemory_||new Map();articleTranslationMemory_.set(key,value);cacheJson_('article:'+key,value,21600);
  properties_().setProperty('TRANSLATIONS_REVISION:'+language,new Date().toISOString());return value;
}
