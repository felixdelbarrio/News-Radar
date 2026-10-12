let configurationMemory_,configurationVersionMemory_;
function settings_(){return configuration_().settings;}
function configuration_(){
  if(configurationMemory_)return configurationMemory_;
  const cache=CacheService.getScriptCache(),key='configuration:'+(configurationVersionMemory_=String(properties_().getProperty('CONFIG_REVISION')||'0')),cached=cache.get(key);
  if(cached)return configurationMemory_=JSON.parse(cached);
  const sheet=book_().getSheetByName('Configuracion');
  if(!sheet)throw Error('Inicializa la configuración desde el editor: initializeConfiguration.');
  const count=sheet.getLastRow()-1,config=Object.fromEntries(count?sheet.getRange(2,1,count,2).getValues().map(([key,value])=>[key,JSON.parse(value)]):[]);
  validateConfiguration_(config);cacheJson_(key,config,21600);
  return configurationMemory_=config;
}
function invalidateConfiguration_(){configurationMemory_=undefined;configurationVersionMemory_=undefined;properties_().setProperty('CONFIG_REVISION',Date.now()+'-'+Math.random().toString(36).slice(2));}
function configurationEdited_(event){const sheet=event?.range?.getSheet().getName();if(sheet==='Configuracion'){invalidateConfiguration_();requestNewsClassification_(true);}else if(sheet==='Noticias')invalidateNews_();else if(sheet==='Ejecuciones')CacheService.getScriptCache().remove('dashboard-runs:'+RADAR.version);}
function initializeConfiguration(){
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    for(const name of ['Configuracion','Suscripciones','NewsletterEnvios','Noticias','Recopilacion','Recargas','Traducciones']){
      if(book_().getSheetByName(name)){if(name!=='Configuracion')book_().getSheetByName(name).getRange(1,1,1,RADAR.sheets[name].length).setValues([RADAR.sheets[name]]);continue;}
      const sheet=book_().insertSheet(name);sheet.getRange(1,1,1,RADAR.sheets[name].length).setValues([RADAR.sheets[name]]).setFontWeight('bold').setBackground(SHEET_THEME.background).setFontColor(SHEET_THEME.foreground);sheet.setFrozenRows(1);
    }
    const sheet=book_().getSheetByName('Configuracion'),count=sheet.getLastRow()-1,keys=new Set(count?sheet.getRange(2,1,count,1).getValues().flat():[]);
    // Add only absent defaults when the catalog version changes; preserve existing edits and activations.
    if(properties_().getProperty('CATALOG_VERSION')!==CONFIGURATION_CATALOG_VERSION){
      const data=count?sheet.getRange(2,1,count,2).getValues():[];
      for(const key of ['feeds','entities','capabilities']){
        const index=data.findIndex(row=>row[0]===key);if(index<0)continue;
        const value=JSON.parse(data[index][1]),defaults=CONFIGURATION_DEFAULTS[key];
        if(key==='capabilities'){
          for(const segment of Object.keys(defaults)){
            const names=new Set(value[segment].map(row=>searchText_(row.name)));
            value[segment].push(...defaults[segment].filter(row=>!names.has(searchText_(row.name))).slice(0,Math.max(0,60-value[segment].length)));
          }
        }else{
          const names=new Set(value.map(row=>key==='feeds'?canonicalUrl_(row.url):searchText_(row.name))),ids=new Set(value.map(row=>row.id));
          value.push(...defaults.filter(row=>!names.has(key==='feeds'?canonicalUrl_(row.url):searchText_(row.name))&&(key!=='feeds'||!ids.has(row.id))));
        }
        sheet.getRange(index+2,2,1,1).setValues([[JSON.stringify(value)]]);
      }
    }
    append_('Configuracion',Object.entries(CONFIGURATION_DEFAULTS).filter(([key])=>!keys.has(key)).map(([key,value])=>[key,JSON.stringify(value)]));
    const settingsRow=sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues().findIndex(row=>row[0]==='settings')+2,stored=JSON.parse(sheet.getRange(settingsRow,2,1,1).getValues()[0][0]);
    const settings=Object.fromEntries(Object.entries(CONFIGURATION_DEFAULTS.settings).map(([key,value])=>[key,key in stored?stored[key]:value]));
    sheet.getRange(settingsRow,2,1,1).setValues([[JSON.stringify(settings)]]);
    if(!ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='configurationEdited_'))ScriptApp.newTrigger('configurationEdited_').forSpreadsheet(book_()).onEdit().create();
    const subscriptions=book_().getSheetByName('Suscripciones'),countSubscriptions=subscriptions.getLastRow()-1;
    if(countSubscriptions>0){const range=subscriptions.getRange(2,8,countSubscriptions,1);range.setValues(range.getValues().map(([value])=>[value||'es']));}
    invalidateConfiguration_();
    if(properties_().getProperty('CATALOG_VERSION')!==CONFIGURATION_CATALOG_VERSION){upgradeCollectionQueries_();properties_().setProperty('CATALOG_VERSION',CONFIGURATION_CATALOG_VERSION);}
    properties_().deleteProperty('CLASSIFICATION_VERSION');
    requestNewsClassification_();
    initializeCollectionQueue_();
    initializeBackgroundSchedules_();
    return 'Configuración inicializada en Sheets. Los valores existentes se han conservado.';
  }finally{lock.releaseLock();}
}
function validateConfiguration_(config){
  const numeric={windowDays:[1,90],pageSize:[1,100],maxCustomFeeds:[1,100],maxFeedBytes:[10000,2000000],maxItems:[1,1000],exportLimit:[1,10000],newsReadLimit:[1,10000],eventLimit:[100,20000],retentionDays:[1,90],trendPoints:[2,60],trendSeries:[1,6],collectionBatch:[1,5],retryMinutes:[1,60],pauseMinutes:[1,60],dailyHour:[0,23],briefingLimit:[1,100],maxSubscriptions:[1,100],newsletterBatch:[1,100],newsletterDailyLimit:[1,1500]};
  if(!config||typeof config.settings!=='object')throw Error('Falta configuración operativa.');
  for(const [name,[min,max]] of Object.entries(numeric)){const n=config.settings[name];if(!Number.isInteger(n)||n<min||n>max)throw Error(name+': requiere un entero entre '+min+' y '+max+'.');}
  if(!['monthly','weekly','daily'].includes(config.settings.defaultPeriodicity)||typeof config.settings.newsletterEnabled!=='boolean')throw Error('Configuración de newsletter no válida.');
  if(typeof config.settings.defaultNewsletterName!=='string'||!config.settings.defaultNewsletterName.trim()||config.settings.defaultNewsletterName.length>100)throw Error('Nombre inicial de newsletter no válido.');
  newsletterEmail_(config.settings.newsletterSender);
  if(typeof config.settings.newsletterAppUrl!=='string'||(config.settings.newsletterAppUrl&&!/^https:\/\/script\.google\.com\/(?:a\/macros\/bbva\.com\/|macros\/)s\/[A-Za-z0-9_-]+\/exec$/.test(config.settings.newsletterAppUrl)))throw Error('URL de newsletter no válida: indica la WebApp publicada en Apps Script.');
  if(typeof config.settings.newsletterSenderName!=='string'||!config.settings.newsletterSenderName.trim()||config.settings.newsletterSenderName.length>100||/[\r\n]/.test(config.settings.newsletterSenderName))throw Error('Nombre del remitente no válido.');
  try{new Intl.DateTimeFormat('es',{timeZone:config.settings.timezone});}catch(_){throw Error('Zona horaria no válida.');}
  for(const key of ['entities','geographies','topics','segments','signals','feeds']){
    const list=config[key];if(!Array.isArray(list)||list.length>200)throw Error('Catálogo no válido: '+key);
    const names=new Set();
    for(const row of list){
      if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>100||names.has(row.name)||typeof row.enabled!=='boolean')throw Error('Nombre duplicado, vacío o activación no válida: '+key);
      names.add(row.name);
      for(const field of ['terms','context','aliases','countries','exclude'])if(field in row&&(!Array.isArray(row[field])||row[field].length>80||row[field].some(value=>typeof value!=='string'||!value.trim()||value.length>100)))throw Error('Lista de términos no válida: '+row.name);
      if(['topics','segments','signals'].includes(key)&&!row.terms?.length)throw Error('Añade términos a '+row.name);
      if(key==='signals'&&(!Array.isArray(row.context)||!Array.isArray(row.exclude)||!['headline','fullText'].includes(row.scope)))throw Error('Define el contexto de '+row.name+' (puede estar vacío).');
      if(key==='entities'&&(!row.type||!Array.isArray(row.aliases)||!Array.isArray(row.countries)))throw Error('Entidad incompleta: '+row.name);
      if(key==='geographies'&&(!row.searchName||!/^[A-Z]{2}$/.test(row.code)||!/^\d{3}$/.test(row.mapId)||!/^[a-z]{2}(?:-[A-Za-z0-9]{2,8})?$/.test(row.language)))throw Error('País: código ISO, identificador cartográfico o idioma incorrectos.');
      if(key==='feeds'&&row.language&&feedLanguage(row.language)!==row.language)throw Error('Idioma de fuente no válido.');
      if(key==='feeds'&&(!row.id||!canonicalUrl_(row.url)||!domainMatches_(row.url,row.domain)||!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(row.domain)||!row.entity))throw Error('Fuente RSS no válida: '+row.name);
    }
    if(JSON.stringify(list).length>40000)throw Error('El catálogo excede el tamaño de una celda: '+key);
  }
  validateCapabilities_(config.capabilities);
  if(Object.keys(config).sort().join(',')!=='capabilities,entities,feeds,geographies,segments,settings,signals,topics')throw Error('Claves de configuración no reconocidas.');
  for(const key of ['searchTerms','disabledSources'])if(!Array.isArray(config.settings[key])||config.settings[key].length>1000||config.settings[key].some(value=>typeof value!=='string'||value.length>160))throw Error('Lista operativa no válida: '+key);
  if(!config.settings.searchTerms.length||config.settings.searchTerms.length>80)throw Error('Define entre 1 y 80 términos de búsqueda.');
  if(encodeURIComponent(JSON.stringify(config)).replace(/%[A-F\d]{2}/gi,'x').length>90000)throw Error('Configuración demasiado grande para la caché.');
  const countries=new Set(config.geographies.map(row=>row.name)),aliases=new Set();
  for(const row of config.entities){
    if(row.countries.some(country=>!countries.has(country)))throw Error('País desconocido en '+row.name);
    for(const name of [row.name,...row.aliases]){const key=searchText_(name);if(aliases.has(key))throw Error('Alias compartido por varias entidades: '+name);aliases.add(key);}
  }
  for(const [setting,key] of [['defaultEntity','entities'],['defaultSegment','segments'],['defaultTopic','topics'],['defaultCountry','geographies']]){
    const value=config.settings[setting];if(typeof value!=='string'||(value&&!config[key].some(row=>row.name===value&&row.enabled)))throw Error('Selección inicial no válida: '+setting);
  }
  if(typeof config.settings.unclassifiedTopic!=='string'||!config.settings.unclassifiedTopic.trim())throw Error('Indica la etiqueta para noticias sin tema.');
  if(new Set(config.geographies.map(row=>row.code)).size!==config.geographies.length||new Set(config.geographies.map(row=>row.mapId)).size!==config.geographies.length)throw Error('Código de país duplicado.');
  if(typeof config.settings.unknownCountry!=='string'||!config.settings.unknownCountry.trim()||config.settings.unknownCountry.length>100)throw Error('Define la geografía predeterminada de los RSS.');
  if(new Set(config.feeds.map(row=>row.id)).size!==config.feeds.length||new Set(config.feeds.map(row=>canonicalUrl_(row.url))).size!==config.feeds.length)throw Error('Fuente RSS duplicada.');
  return config;
}
function configurationRevision_(){configuration_();return configurationVersionMemory_;}
function getConfiguration(){authorize_(true);return {config:configuration_(),revision:configurationRevision_(),capabilityDefaults:CONFIGURATION_DEFAULTS.capabilities};}
function saveConfiguration(payload){authorize_(true);return writeConfiguration_(payload.config,payload.revision);}
function writeConfiguration_(config,revision){
  validateConfiguration_(config);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    if(revision!==String(properties_().getProperty('CONFIG_REVISION')||'0'))throw Error('La configuración ha cambiado en otra sesión. Recarga los catálogos antes de guardar.');
    const reclassify=classificationRulesRevision_()!==classificationRulesRevision_(config);
    const sheet=book_().getSheetByName('Configuracion'),rows=Object.entries(config).map(([key,value])=>[key,JSON.stringify(value)]);
    sheet.getRange(2,1,Math.max(rows.length,sheet.getLastRow()-1),2).clearContent();append_('Configuracion',rows);invalidateConfiguration_();if(reclassify)requestNewsClassification_(true);initializeBackgroundSchedules_();
    return 'Configuración guardada. Se aplicará a filtros, clasificación y próximas recopilaciones.';
  }finally{lock.releaseLock();}
}

function testGmailAuthorization() {
  authorize_(true);
  const token = ScriptApp.getOAuthToken();

  const response = UrlFetchApp.fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs',
    {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + token
      },
      muteHttpExceptions: true
    }
  );

  Logger.log('HTTP: ' + response.getResponseCode());
  Logger.log(response.getContentText());
}

function validateCapabilities_(capabilities){
  if(!capabilities||Object.keys(capabilities).sort().join(',')!=='Empresas,Retail')throw Error('Define capacidades digitales para Empresas y Retail.');
  for(const [segment,rows] of Object.entries(capabilities)){
    if(!Array.isArray(rows)||rows.length>60)throw Error('Máximo 60 capacidades por segmento: '+segment);
    const names=new Set();
    for(const row of rows){
      const name=searchText_(row?.name);
      if(!row||typeof row.name!=='string'||!name||row.name.length>100||names.has(name)||typeof row.enabled!=='boolean'||Object.keys(row).sort().join(',')!=='enabled,name,terms')throw Error('Capacidad vacía, duplicada o no válida: '+segment);
      names.add(name);
      if(!Array.isArray(row.terms)||!row.terms.length||row.terms.length>12||row.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>80||/[";\r\n]/.test(term)))throw Error('Define entre 1 y 12 términos de hasta 80 caracteres: '+row.name);
    }
  }
  if(JSON.stringify(capabilities).length>40000)throw Error('El catálogo de capacidades excede el tamaño de una celda.');
}
