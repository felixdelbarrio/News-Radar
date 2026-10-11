let articleTranslationRows_,articleTranslationMemory_;
function articleTranslationKey_(row,language){return language+':'+sha256_(String(row.titular||'')+'\n'+String(row.extracto||''));}
function articleTranslationIndex_(){
  if(articleTranslationRows_)return articleTranslationRows_;
  const sheet=book_().getSheetByName('Traducciones'),count=sheet.getLastRow()-1;
  return articleTranslationRows_=new Map(count?sheet.getRange(2,1,count,1).getDisplayValues().map(([key],index)=>[key,index+2]):[]);
}
function cachedArticleTranslation_(key){
  articleTranslationMemory_=articleTranslationMemory_||new Map();if(articleTranslationMemory_.has(key))return articleTranslationMemory_.get(key);
  const cache=CacheService.getScriptCache(),cached=cache.get('article:'+key);let value=cached?JSON.parse(cached):null;
  if(!value){const row=articleTranslationIndex_().get(key);if(row){const [title,excerpt]=book_().getSheetByName('Traducciones').getRange(row,3,1,2).getDisplayValues()[0];value={titular:title,extracto:excerpt};}}
  if(value){cacheJson_('article:'+key,value,21600);articleTranslationMemory_.set(key,value);}return value;
}
function translateArticleText_(row,language){
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const input='<p id="headline">'+escape(row.titular)+'</p><p id="excerpt">'+escape(row.extracto)+'</p>';
  const html=LanguageApp.translate(input,'',language,{contentType:'html'});
  const blocks=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match=>plainText_(match[1]));
  if(blocks.length!==2||!blocks[0]||(row.extracto&&!blocks[1]))throw Error('Respuesta de traducción incompleta.');
  return {titular:blocks[0].slice(0,5000),extracto:blocks[1].slice(0,5000)};
}
function articleTranslations_(rows,language){
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const nativeFeeds=new Set(configuration_().feeds.map(feed=>feed.name));
  const cache=CacheService.getScriptCache();let translated=0,unavailable=Boolean(cache.get('article-translation-pause'));
  return rows.map(row=>{
    if(nativeFeeds.has(row.fuente)&&String(row.idioma||'').toLowerCase().split(/[-_]/)[0]===language)return {...row,translation:{language,state:'native'}};
    const key=articleTranslationKey_(row,language);let value=cachedArticleTranslation_(key),state='pending';
    if(!value&&!unavailable&&translated<5){
      translated++;
      try{
        value=translateArticleText_(row,language);const index=articleTranslationIndex_(),position=book_().getSheetByName('Traducciones').getLastRow()+1;
        append_('Traducciones',[[key,language,value.titular,value.extracto,new Date().toISOString()]]);index.set(key,position);cacheJson_('article:'+key,value,21600);articleTranslationMemory_.set(key,value);
      }catch{unavailable=true;cache.put('article-translation-pause','1',300);}
    }
    if(value)state='translated';else if(unavailable)state='unavailable';
    return {...row,...(value?{...value,original:{titular:row.titular,extracto:row.extracto}}:{}),translation:{language,state}};
  });
}
function translateNews(request){
  authorize_();if(!request||!supportedLanguage(request.language)||!Array.isArray(request.ids)||request.ids.length>100||request.ids.some(id=>typeof id!=='string'||!id||id.length>100))throw Error('Solicitud de traducción no válida.');
  const ids=new Set(request.ids),lock=LockService.getScriptLock();
  if(!lock.tryLock(1000))return {items:[],pending:[...ids],busy:true};
  try{const items=articleTranslations_(rowsById_('Noticias',ids,settings_().newsReadLimit),request.language);SpreadsheetApp.flush();return {items:items.map(({id,titular,extracto,original,translation})=>({id,titular,extracto,original,translation})),pending:items.filter(row=>row.translation.state==='pending').map(row=>row.id)};}
  finally{lock.releaseLock();}
}
