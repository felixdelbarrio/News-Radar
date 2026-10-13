function collectionPeriod_(range){
  if(!range)return 'when:'+settings_().windowDays+'d';
  return 'after:'+new Date(Date.parse(range.from)-86400000).toISOString().slice(0,10)+' before:'+new Date(Date.parse(range.to)+86400000).toISOString().slice(0,10);
}
function profileFeed_(geo,entity,range,capabilitySearch=false,projectFinance=false) {
  if(projectFinance&&!configuration_().segments.some(row=>row.name==='Project Finance'&&row.enabled))return null;
  const quote=value=>'"'+value.replace(/"/g,'')+'"';
  const period=collectionPeriod_(range);
  const terms=projectFinance?localizedSearchTerms_(projectFinanceTerms_(),geo):capabilitySearch?capabilitySearchTerms_(geo,entity):collectionSearchTerms_(geo);
  if(!terms.length)return null;
  // Fechas al principio y OR agrupados: el proveedor no debe ampliar el período por una alternativa.
  const prefix=period+' ('+[entity.name,...entity.aliases].slice(0,COLLECTION_POLICY.entityAliases+1).map(quote).join(' OR ')+') (',selected=[];let length=prefix.length+1;
  for(const term of terms){const value=quote(term),size=value.length+(selected.length?4:0);if(length+size>COLLECTION_POLICY.queryChars)continue;selected.push(value);length+=size;}
  if(!selected.length)return null;const query=prefix+selected.join(' OR ')+')';
  // Google News no publica edición UY; su redirección legítima utiliza US en español latinoamericano.
  const code=geo.code==='UY'||projectFinance&&geo.language.startsWith('en')?'US':geo.code;
  const url=canonicalUrl_('https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl='+geo.language+'&gl='+code+'&ceid='+code+':'+geo.language);
  return {id:'profile/'+geo.code+'/'+entity.name,name:entity.name+' · '+geo.name,url,domain:'news.google.com',entity:entity.name,country:geo.name,kind:'profile',language:geo.language,capabilitySearch,projectFinance,enabled:entity.enabled&&geo.enabled};
}
function projectFinanceTerms_(){return configuration_().segments.find(row=>row.name==='Project Finance')?.terms||[];}
function projectFinanceSource_(feed){
  const query=searchText_(decodeURIComponent((feed.url.match(/[?&]q=([^&]*)/)||[])[1]||'')+' '+feed.name);
  return projectFinanceTerms_().some(term=>phraseMatch_(query,searchText_(term)));
}
let collectionLanguageMemory_;
function localizedSearchTerms_(terms,geo){
  if(!collectionLanguageMemory_){
    collectionLanguageMemory_=new Map();
    for(const [language,values] of Object.entries(COLLECTION_QUERY_LANGUAGES))for(const term of values){const key=searchText_(term);if(!collectionLanguageMemory_.has(key))collectionLanguageMemory_.set(key,new Set());collectionLanguageMemory_.get(key).add(language);}
  }
  const language=geo.language.split('-')[0],native=[],english=[],custom=[];
  for(const term of terms){const languages=collectionLanguageMemory_.get(searchText_(term));if(!languages)custom.push(term);else if(languages.has(language))native.push(term);else if(languages.has('en'))english.push(term);}
  return [...native,...english,...custom];
}
function collectionSearchTerms_(geo){
  const project=new Set(projectFinanceTerms_().map(searchText_)),local=(COLLECTION_LANGUAGE_TERMS[geo.language.split('-')[0]]||[]).slice(0,COLLECTION_POLICY.localTerms),terms=localizedSearchTerms_([...new Set(settings_().searchTerms)].filter(term=>!project.has(searchText_(term))),geo),count=Math.min(terms.length,Math.max(0,COLLECTION_POLICY.searchTerms-local.length));
  return [...new Set([...local,...Array.from({length:count},(_,i)=>terms[Math.floor(i*terms.length/count)])])];
}
function capabilitySearchTerms_(geo,entity){
  const rows=businessIndex_().capabilities;if(!rows.length)return [];
  const seed=[entity.name,geo.code].join('|');
  const offset=[...seed].reduce((sum,char)=>sum+char.charCodeAt(0),0)%rows.length,terms=new Set(),base=new Set(collectionSearchTerms_(geo).map(searchText_));
  const project=new Set(projectFinanceTerms_().map(searchText_)),ordered=rows.slice(offset).concat(rows.slice(0,offset)),count=Math.min(rows.length,COLLECTION_POLICY.capabilityTerms),preferred=Array.from({length:count},(_,i)=>ordered[Math.floor(i*rows.length/count)]);
  for(const row of preferred.concat(ordered)){
    const choices=localizedSearchTerms_(row.terms,geo).filter(term=>!base.has(searchText_(term))&&!project.has(searchText_(term))),term=choices[0];if(term)terms.add(term);if(terms.size===COLLECTION_POLICY.capabilityTerms)break;
  }
  return [...terms];
}
function defaultFeeds_(range) {
  const config=configuration_(),disabled=new Set(config.settings.disabledSources);
  return config.feeds.map(feed=>({...feed,kind:'rss'})).concat(config.entities.flatMap(entity=>config.geographies.filter(geo=>entity.countries.includes(geo.name)).map(geo=>{const feed=profileFeed_(geo,entity,range);return {...feed,enabled:feed.enabled&&!disabled.has(feed.id)};})));
}
function customFeeds_(){return configuration_().feeds;}
let configuredFeedMemory_;
function configuredFeeds_(){const config=configuration_();if(configuredFeedMemory_?.config!==config)configuredFeedMemory_={config,feeds:defaultFeeds_()};return configuredFeedMemory_.feeds;}
function feeds_(){return configuredFeeds_().filter(feed=>feed.enabled);}
function saveSourceSettings(enabledIds){
  authorize_(true);const config=JSON.parse(JSON.stringify(configuration_())),all=configuredFeeds_(),known=new Set(all.map(feed=>feed.id));
  if(!Array.isArray(enabledIds)||enabledIds.length>all.length||enabledIds.some(id=>!known.has(id)))throw Error('Configuración de fuentes no válida.');
  const enabled=new Set(enabledIds);config.feeds.forEach(feed=>feed.enabled=enabled.has(feed.id));config.settings.disabledSources=all.filter(feed=>feed.kind==='profile'&&!enabled.has(feed.id)).map(feed=>feed.id);
  writeConfiguration_(config,configurationRevision_());return enabled.size+' fuentes seleccionadas. Entidades y países desactivados permanecen desactivados.';
}
function saveFeeds(feeds){
  authorize_(true);const config=JSON.parse(JSON.stringify(configuration_()));
  if(!Array.isArray(feeds)||feeds.length>settings_().maxCustomFeeds)throw Error('Máximo '+settings_().maxCustomFeeds+' fuentes RSS.');
  config.feeds=feeds.map(feed=>({id:'rss/'+canonicalUrl_(feed.url),name:plainText_(feed.name).slice(0,100),url:canonicalUrl_(feed.url),domain:String(feed.domain||'').toLowerCase().trim(),entity:plainText_(feed.entity).slice(0,80),country:plainText_(feed.country||settings_().unknownCountry).slice(0,60),language:String(feed.language||'').trim(),enabled:feed.enabled!==false}));
  return writeConfiguration_(config,configurationRevision_());
}
function enableDaily() {
  authorize_(true);disableDaily();
  replaceCollectionSchedule_();
  properties_().setProperty('DAILY_ENABLED','true');
  return 'Recopilación activada. '+collectionScheduleLabel_()+'.';
}
function disableDaily() {authorize_(true);ScriptApp.getProjectTriggers().filter(t=>['dailyRadar_','projectFinanceRadar_'].includes(t.getHandlerFunction())).forEach(t=>ScriptApp.deleteTrigger(t));properties_().setProperty('DAILY_ENABLED','false');CacheService.getScriptCache().remove('daily-schedule');}
