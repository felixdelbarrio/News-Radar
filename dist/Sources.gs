function collectionPeriod_(range){
  if(!range)return 'when:'+settings_().windowDays+'d';
  return 'after:'+new Date(Date.parse(range.from)-86400000).toISOString().slice(0,10)+' before:'+new Date(Date.parse(range.to)+86400000).toISOString().slice(0,10);
}
function profileFeed_(geo,entity,range,capabilitySearch=false) {
  const quote=value=>'"'+value.replace(/"/g,'')+'"';
  const period=collectionPeriod_(range);
  const terms=capabilitySearch?capabilitySearchTerms_(geo,entity):collectionSearchTerms_(geo);
  if(!terms.length)return null;
  const language=geo.language.split('-')[0],scopes=collectionLanguageMemory_.scopes;
  if(capabilitySearch&&!scopes.has(language))scopes.set(language,localizedSearchTerms_(configuration_().segments.filter(row=>row.enabled).flatMap(row=>row.terms),geo).slice(0,6));
  if(capabilitySearch&&!scopes.get(language).length)return null;
  const scope=capabilitySearch?' ('+scopes.get(language).map(quote).join(' OR ')+')':'';
  // Fechas al principio y OR agrupados: el proveedor no debe ampliar el período por una alternativa.
  const prefix=period+(geo.code==='UY'?' "Uruguay"':'')+' ('+[entity.name,...entity.aliases].slice(0,COLLECTION_POLICY.entityAliases+1).map(quote).join(' OR ')+') (',selected=[];let length=prefix.length+1+scope.length;
  for(const term of terms){const value=quote(term),size=value.length+(selected.length?4:0);if(length+size>COLLECTION_POLICY.queryChars)continue;selected.push(value);length+=size;}
  if(!selected.length)return null;const query=prefix+selected.join(' OR ')+')'+scope;
  // Google News no publica edición UY; su redirección legítima utiliza US en español latinoamericano.
  const code=geo.code==='UY'?'US':geo.code;
  const url=canonicalUrl_('https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl='+geo.language+'&gl='+code+'&ceid='+code+':'+geo.language);
  return {id:'profile/'+geo.code+'/'+entity.name,name:entity.name+' · '+geo.name,url,domain:'news.google.com',entity:entity.name,country:geo.name,kind:'profile',language:geo.language,capabilitySearch,enabled:entity.enabled&&geo.enabled};
}
let collectionLanguageMemory_;
function localizedSearchTerms_(terms,geo){
  const config=configuration_();if(collectionLanguageMemory_?.config!==config){
    const terms=new Map();
    for(const row of config.searchLanguages.filter(row=>row.enabled))for(const term of row.terms){const key=searchText_(term);if(!terms.has(key))terms.set(key,new Set());terms.get(key).add(row.language);}
    collectionLanguageMemory_={config,terms,scopes:new Map()};
  }
  const language=geo.language.split('-')[0],native=[],english=[],custom=[];
  for(const term of terms){const languages=collectionLanguageMemory_.terms.get(searchText_(term));if(!languages)custom.push(term);else if(languages.has(language))native.push(term);else if(languages.has('en'))english.push(term);}
  return ['it','de','fr','pt','tr'].includes(language)?native:[...native,...english,...custom];
}
function collectionSearchTerms_(geo){
  const local=(configuration_().searchLanguages.find(row=>row.enabled&&row.language===geo.language.split('-')[0])?.terms||[]).slice(0,COLLECTION_POLICY.localTerms),terms=localizedSearchTerms_([...new Set(settings_().searchTerms)],geo),count=Math.min(terms.length,Math.max(0,COLLECTION_POLICY.searchTerms-local.length));
  return [...new Set([...local,...Array.from({length:count},(_,i)=>terms[Math.floor(i*terms.length/count)])])];
}
let catalogueSearchMemory_;
function catalogueSearchRows_(){
  const config=configuration_(),revision=taxonomyMemory_?.revision||properties_().getProperty('TAXONOMY_REVISION')||'0';if(catalogueSearchMemory_?.config===config&&catalogueSearchMemory_.revision===revision)return catalogueSearchMemory_.rows;
  // Every catalogue ID participates; aliases improve recall without changing the canonical names.
  const rows=config.taxonomy.flatMap(block=>[
    ...block.functions.map(row=>({key:row.id,terms:[...new Set([...row.terms,row.name.replace(/^Landing(?: de)?\s*/i,'')])]})),
    ...block.emerging.map(row=>({key:block.name+'|'+row.name,terms:row.terms}))
  ]).filter(row=>row.terms.length);
  const admitted=new Map(config.taxonomy.flatMap(block=>block.emerging.map(row=>[block.name+'|'+taxonomyText(row.name),row])));
  for(const row of taxonomyCatalog_().filter(row=>row.origen==='tf-idf')){const key=row.palanca+'|'+taxonomyText(row.subpalanca.replace(/^\d{2}\.xx\s+/,'')),concept=admitted.get(key),entry=rows.find(item=>item.key===row.palanca+'|'+concept?.name);if(entry)entry.priority=Number(row.peso)||0;}
  catalogueSearchMemory_={config,revision,rows};return rows;
}
function capabilitySearchTerms_(geo,entity){
  const capabilities=businessIndex_().capabilities,catalogue=catalogueSearchRows_();
  if(!capabilities.length&&!catalogue.length)return [];
  const seed=[entity.name,geo.code].join('|'),day=Math.floor(Date.parse(recordDay(new Date(),settings_().timezone))/86400000),hash=[...seed].reduce((sum,char)=>sum*31+char.charCodeAt(0),0)>>>0;
  const terms=new Set(),base=new Set(collectionSearchTerms_(geo).map(searchText_)),limit=COLLECTION_POLICY.capabilityTerms,problems=configuration_().signals.filter(row=>row.enabled&&row.group==='Problema').map(row=>({terms:row.terms.map(term=>term.replace(/\*/g,''))})),reserve=problems.length?1:0;
  const add=(rows,budget)=>{
    if(!rows.length)return;const offset=(hash+day*budget)%rows.length;
    for(let i=0,added=0;i<rows.length&&added<budget;i++){
      const row=rows[(offset+i)%rows.length],choices=localizedSearchTerms_(row.terms,geo),term=choices.find(value=>!base.has(searchText_(value))&&!terms.has(value));
      if(term){terms.add(term);added++;}
    }
  };
  const priorities=catalogue.filter(row=>row.priority>0).sort((a,b)=>b.priority-a.priority||a.key.localeCompare(b.key));
  add(priorities,priorities.length?1:0);add(catalogue,Math.ceil((limit-reserve)/2)-terms.size);add(capabilities,limit-reserve-terms.size);add(problems,limit-terms.size);
  return [...terms];
}
function defaultFeeds_(range) {
  const config=configuration_(),disabled=new Set(config.settings.disabledSources);
  return config.feeds.map(feed=>countryScopedSource_({...feed,kind:'rss'})).concat(config.entities.flatMap(entity=>config.geographies.filter(geo=>entity.countries.includes(geo.name)).map(geo=>{const feed=profileFeed_(geo,entity,range);return {...feed,enabled:feed.enabled&&!disabled.has(feed.id)};})));
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
function disableDaily() {authorize_(true);ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dailyRadar_').forEach(t=>ScriptApp.deleteTrigger(t));properties_().setProperty('DAILY_ENABLED','false');CacheService.getScriptCache().remove('daily-schedule');}


function countryScopedSource_(feed){
 if(feed.country!=='Uruguay'||!domainMatches_(feed.url,'news.google.com'))return feed;
 return {...feed,url:feed.url.replace(/([?&](?:gl|ceid)=)UY(?=:|%3A|&|$)/gi,'$1US').replace(/([?&]q=)([^&]*)/,(_,prefix,value)=>{
  const query=decodeURIComponent(value.replace(/\+/g,' '));return prefix+encodeURIComponent(/\buruguay\b/i.test(query)?query:query+' "Uruguay"');
 })};
}
