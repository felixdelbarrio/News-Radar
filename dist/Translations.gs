let articleTranslationRows_,articleTranslationMemory_;
function articleFingerprint_(row){return sha256_(String(row.titular||'')+'\n'+String(row.extracto||''));}
function articleTranslationKey_(row,language){return language+':'+articleFingerprint_(row);}
let articleIdentityTitlesMemory_;
function articleIdentityTitles_(){
  const revisions=Object.keys(languageNames).map(language=>properties_().getProperty('TRANSLATIONS_REVISION:'+language)||'0'),revision=JSON.stringify(revisions);
  if(articleIdentityTitlesMemory_?.revision===revision)return articleIdentityTitlesMemory_.values;
  const key='news-records:translation-titles:'+sha256_(revision),cache=CacheService.getScriptCache(),cached=readDashboardCache_(cache,key);
  if(cached){const values=new Map(cached);articleIdentityTitlesMemory_={revision,values};return values;}
  const sheet=book_().getSheetByName('Traducciones'),count=sheet.getLastRow()-1,variants=new Map();
  // Deduplication needs titles only; never fetch or cache translated excerpts here.
  for(let offset=0;offset<count;offset+=2000)for(const [key,language,title] of sheet.getRange(offset+2,1,Math.min(2000,count-offset),3).getDisplayValues()){
    if(!supportedLanguage(language)||!key.startsWith(language+':'))continue;
    const fingerprint=key.slice(language.length+1),titles=variants.get(fingerprint)||new Map();titles.set(language,title);variants.set(fingerprint,titles);
  }
  const values=new Map([...variants].map(([fingerprint,titles])=>[fingerprint,[...new Set(Object.keys(languageNames).map(language=>titles.get(language)).filter(Boolean))]]));
  writeDashboardCache_(cache,key,[...values]);articleIdentityTitlesMemory_={revision,values};return values;
}
function translationIdentityRows_(rows){
  if(!rows.length||!Object.keys(languageNames).some(language=>properties_().getProperty('TRANSLATIONS_REVISION:'+language)))return rows;
  const titles=articleIdentityTitles_();
  rows.forEach(row=>{row.identityTitles=titles.size?(titles.get(articleFingerprint_(row.original||row))||[]):[];});
  return rows;
}
function articleTranslationIndexKey_(){return 'article-index:'+sha256_(JSON.stringify([book_().getSheetByName('Traducciones').getLastRow(),properties_().getProperty('TRANSLATIONS_INDEX_REVISION')||'0',Object.keys(languageNames).map(language=>properties_().getProperty('TRANSLATIONS_REVISION:'+language)||'0')]));}
function articleTranslationIndex_(){
  if(articleTranslationRows_)return articleTranslationRows_;
  const key=articleTranslationIndexKey_(),cache=CacheService.getScriptCache(),cached=readDashboardCache_(cache,key);if(cached)return articleTranslationRows_=new Map(cached);
  const sheet=book_().getSheetByName('Traducciones'),count=sheet.getLastRow()-1,entries=count?sheet.getRange(2,1,count,1).getDisplayValues().map(([key],index)=>[key,index+2]):[];
  writeDashboardCache_(cache,key,entries);return articleTranslationRows_=new Map(entries);
}
function cachedArticleTranslations_(keys){
  articleTranslationMemory_=articleTranslationMemory_||new Map();
  const missing=[...new Set(keys)].filter(key=>!articleTranslationMemory_.has(key));if(!missing.length)return articleTranslationMemory_;
  const cache=CacheService.getScriptCache(),cached=cache.getAll(missing.map(key=>'article:'+key)),uncached=[];
  for(const key of missing){const value=cached['article:'+key];if(value)articleTranslationMemory_.set(key,JSON.parse(value));else uncached.push(key);}
  if(!uncached.length)return articleTranslationMemory_;
  const index=articleTranslationIndex_(),positions=uncached.filter(key=>index.has(key)).map(key=>({key,row:index.get(key)})).sort((a,b)=>a.row-b.row),values={};
  for(const key of uncached)articleTranslationMemory_.set(key,null);
  const byRow=new Map(positions.map(({key,row})=>[row,key]));
  for(const [first,last] of sheetRowRanges_(positions.map(item=>item.row),64)){
    const rows=book_().getSheetByName('Traducciones').getRange(first,3,last-first+1,2).getDisplayValues();
    rows.forEach(([titular,extracto],offset)=>{const key=byRow.get(first+offset);if(!key)return;const value={titular:plainText_(titular),extracto:plainText_(extracto)};articleTranslationMemory_.set(key,value);const encoded=cacheJsonValue_(value);if(encoded)values['article:'+key]=encoded;});
  }
  if(Object.keys(values).length)try{cache.putAll(values,21600);}catch(_){}return articleTranslationMemory_;
}
function translateArticleText_(row,language){
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const title=plainText_(row.titular).slice(0,5000),excerpt=plainText_(row.extracto).slice(0,5000),hasExcerpt=Boolean(excerpt),input='<p id="headline">'+escape(title)+'</p>'+(hasExcerpt?'<p id="excerpt">'+escape(excerpt)+'</p>':'');
  const html=LanguageApp.translate(input,'',language,{contentType:'html'});
  const blocks=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match=>plainText_(match[1]));
  if(blocks.length!==(hasExcerpt?2:1)||!blocks[0]||(hasExcerpt&&!blocks[1]))throw Error('Respuesta de traducción incompleta.');
  return {titular:blocks[0].slice(0,5000),extracto:hasExcerpt?blocks[1].slice(0,5000):''};
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
  const key=articleTranslationKey_(row,language),value=translateArticleText_(row,language),index=articleTranslationIndex_(),sheet=book_().getSheetByName('Traducciones'),position=index.get(key)||sheet.getLastRow()+1,values=[[key,language,value.titular,value.extracto,new Date().toISOString()]];
  if(index.has(key))sheet.getRange(position,1,1,5).setNumberFormat('@').setValues(values.map(row=>row.map(safeCell_)));else append_('Traducciones',values);index.set(key,position);
  articleTranslationMemory_=articleTranslationMemory_||new Map();articleTranslationMemory_.set(key,value);cacheJson_('article:'+key,value,21600);
  const revision=Date.now()+'-'+Math.random().toString(36).slice(2);
  properties_().setProperties({['TRANSLATIONS_REVISION:'+language]:revision,NEWS_REVISION:revision});return value;
}

function compactArticleTranslations_(){
  const sheet=book_().getSheetByName('Traducciones'),count=Math.max(0,sheet.getLastRow()-1);if(!count)return;
  const fingerprints=new Set();
  const source=newsSheet_(),total=source.getLastRow()-1;
  for(let offset=0;offset<total;offset+=1000)for(const [titular,extracto] of source.getRange(offset+2,6,Math.min(1000,total-offset),2).getDisplayValues())fingerprints.add(articleFingerprint_({titular,extracto}));
  const rows=sheet.getRange(2,1,count,5).getDisplayValues(),unique=new Map();
  for(const row of rows)if(supportedLanguage(row[1])&&row[0].startsWith(row[1]+':')&&fingerprints.has(row[0].slice(row[1].length+1)))unique.set(row[0],row);
  if(unique.size===rows.length)return;
  const kept=[...unique.values()];
  if(kept.length)sheet.getRange(2,1,kept.length,5).setNumberFormat('@').setValues(kept.map(row=>row.map(safeCell_)));
  sheet.getRange(kept.length+2,1,count-kept.length,5).clearContent();
  properties_().setProperty('TRANSLATIONS_INDEX_REVISION',Utilities.getUuid());articleTranslationRows_=undefined;articleTranslationMemory_=undefined;articleIdentityTitlesMemory_=undefined;
  const revision=Utilities.getUuid();for(const language of Object.keys(languageNames))properties_().setProperty('TRANSLATIONS_REVISION:'+language,revision);
}
