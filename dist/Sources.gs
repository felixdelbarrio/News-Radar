function profileFeed_(geo,entity,range,capabilitySearch=false) {
  const quote=value=>'"'+value.replace(/"/g,'')+'"';
  const before=range?new Date(range.to+'T00:00:00Z'):null;if(before)before.setUTCDate(before.getUTCDate()+1);
  const after=range?new Date(range.from+'T00:00:00Z'):null;if(after)after.setUTCDate(after.getUTCDate()-1);
  const period=range?'after:'+after.toISOString().slice(0,10)+' before:'+before.toISOString().slice(0,10):'when:'+settings_().windowDays+'d';
  const terms=capabilitySearch?capabilitySearchTerms_(geo,entity):collectionSearchTerms_();
  if(!terms.length)return null;
  // Fechas al principio y OR agrupados: el proveedor no debe ampliar el período por una alternativa.
  const prefix=period+' ('+[entity.name,...entity.aliases].slice(0,COLLECTION_POLICY.entityAliases+1).map(quote).join(' OR ')+') (',selected=[];let length=prefix.length+1;
  for(const term of terms){const value=quote(term),size=value.length+(selected.length?4:0);if(length+size>COLLECTION_POLICY.queryChars)continue;selected.push(value);length+=size;}
  if(!selected.length)return null;const query=prefix+selected.join(' OR ')+')';
  // Google News no publica edición UY; su redirección legítima utiliza US en español latinoamericano.
  const code=geo.code==='UY'?'US':geo.code;
  const url=canonicalUrl_('https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl='+geo.language+'&gl='+code+'&ceid='+code+':'+geo.language);
  return {id:'profile/'+geo.code+'/'+entity.name,name:entity.name+' · '+geo.name,url,domain:'news.google.com',entity:entity.name,country:geo.name,kind:'profile',language:geo.language,capabilitySearch,enabled:entity.enabled&&geo.enabled};
}
function collectionSearchTerms_(){
  const terms=[...new Set(settings_().searchTerms)],count=Math.min(terms.length,COLLECTION_POLICY.searchTerms);
  return Array.from({length:count},(_,i)=>terms[Math.floor(i*terms.length/count)]);
}
function capabilitySearchTerms_(geo,entity){
  const rows=businessIndex_().capabilities;if(!rows.length)return [];
  const seed=[entity.name,geo.code].join('|');
  const offset=[...seed].reduce((sum,char)=>sum+char.charCodeAt(0),0)%rows.length,terms=new Set(),base=new Set(collectionSearchTerms_().map(searchText_));
  const ordered=rows.slice(offset).concat(rows.slice(0,offset)),count=Math.min(rows.length,COLLECTION_POLICY.capabilityTerms),preferred=Array.from({length:count},(_,i)=>ordered[Math.floor(i*rows.length/count)]);
  for(const row of preferred.concat(ordered)){
    const choices=row.terms.filter(term=>!base.has(term)),term=choices[geo.language.startsWith('en')?Math.min(1,choices.length-1):0];if(term)terms.add(term);if(terms.size===COLLECTION_POLICY.capabilityTerms)break;
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
  replaceDailySchedule_('dailyRadar_',settings_().dailyHour);
  properties_().setProperty('DAILY_ENABLED','true');
  return 'Recopilación diaria activada a partir de las '+settings_().dailyHour+':00 ('+settings_().timezone+').';
}
function disableDaily() {authorize_(true);ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dailyRadar_').forEach(t=>ScriptApp.deleteTrigger(t));properties_().setProperty('DAILY_ENABLED','false');}
