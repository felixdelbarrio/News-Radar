function initializeLanguages(){
  const snapshot=getConfiguration(),config=JSON.parse(JSON.stringify(snapshot.config)),merge=(current,extra)=>[...new Set([...current,...extra])];
  config.settings.searchTerms=merge(config.settings.searchTerms,CONFIGURATION_DEFAULTS.settings.searchTerms);
  for(const key of ['topics','segments','signals']){
    const defaults=new Map(CONFIGURATION_DEFAULTS[key].map(row=>[row.name,row]));
    for(const row of config[key]){const preset=defaults.get(row.name);if(!preset)continue;for(const field of ['terms','context','exclude'])if(Array.isArray(row[field])&&Array.isArray(preset[field]))row[field]=merge(row[field],preset[field]);}
  }
  const ids=new Set(config.feeds.map(row=>row.id));
  config.feeds.push(...CONFIGURATION_DEFAULTS.feeds.filter(row=>!ids.has(row.id)&&row.language==='en'));
  if(JSON.stringify(config)===JSON.stringify(snapshot.config))return 'Catálogo multiidioma actualizado.';
  return writeConfiguration_(config,snapshot.revision);
}
