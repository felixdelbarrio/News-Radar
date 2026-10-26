let configurationMemory_,configurationVersionMemory_;
function settings_(){return configuration_().settings;}
function configuration_(){
  if(configurationMemory_)return configurationMemory_;
  const cache=CacheService.getScriptCache(),key='configuration:'+(configurationVersionMemory_=String(properties_().getProperty('CONFIG_REVISION')||'0')),cached=cache.get(key);
  if(cached)return configurationMemory_=functionalConfiguration_(JSON.parse(cached));
  const sheet=book_().getSheetByName('Configuracion');
  if(!sheet)throw Error('Inicializa la configuración desde el editor: initializeConfiguration.');
  const count=sheet.getLastRow()-1,config=Object.fromEntries(count?sheet.getRange(2,1,count,2).getValues().map(([key,value])=>[key,JSON.parse(value)]):[]);
  const resolved=functionalConfiguration_(config);validateConfiguration_(resolved);cacheJson_(key,functionalConfigurationSettings_(resolved),21600);
  return configurationMemory_=resolved;
}
function invalidateConfiguration_(){invalidateDashboardSnapshots_();configurationMemory_=undefined;configurationVersionMemory_=undefined;properties_().setProperty('CONFIG_REVISION',Date.now()+'-'+Math.random().toString(36).slice(2));}
function configurationEdited_(event){const editedSheet=event?.range?.getSheet().getName();if(NEWSLETTER_ARCHIVE_TABLES.some(name=>editedSheet===newsletterStorageKey_(name))){markNewsletterArchiveEdited_();return;}const sheet=editedSheet===newsStorageKey_()?'Noticias':editedSheet;if(backgroundPaused_()&&['Configuracion','Noticias'].includes(sheet)){deferBackgroundWork_(sheet==='Configuracion'?'edited':'news');return;}if(sheet==='CatalogoFuncional'){properties_().deleteProperty('FUNCTIONAL_CATALOG_REVISION');functionalCatalogMemory_=undefined;invalidateConfiguration_();properties_().setProperty('TAXONOMY_REQUEST',recordDay(new Date(),settings_().timezone));ensureBackgroundWorker_();}else if(sheet==='Configuracion'){invalidateConfiguration_();requestNewsClassification_(true);}else if(sheet==='Noticias')invalidateNews_();else if(sheet==='Ejecuciones')CacheService.getScriptCache().remove('dashboard-runs:'+RADAR.version);}
function initializeConfiguration(){
  authorize_(true);return withForegroundWrite_(()=>{
    const refreshCatalog=properties_().getProperty('CATALOG_VERSION')!==CONFIGURATION_CATALOG_VERSION;
    for(const name of ['CategorizacionLLM','Candidatos','Cobertura','Configuracion','Suscripciones','NewsletterEnvios','NewsletterEdiciones','NewsletterContenido','NewsletterEventos','NewsletterFeedback','Noticias','Recopilacion','Recargas','Traducciones','CatalogoFuncional','Taxonomia','TaxonomiaTraducciones','Auditoria','Telemetria','Ejecuciones','Adopcion','DashboardSnapshots']){
      const physical=configurationStorageKey_(name);
      if(book_().getSheetByName(physical)){if(name!=='Configuracion')book_().getSheetByName(physical).getRange(1,1,1,RADAR.sheets[name].length).setValues([RADAR.sheets[name]]);continue;}
      const sheet=book_().insertSheet(physical);sheet.getRange(1,1,1,RADAR.sheets[name].length).setValues([RADAR.sheets[name]]).setFontWeight('bold').setBackground(SHEET_THEME.background).setFontColor(SHEET_THEME.foreground);sheet.setFrozenRows(1);
    }
    const sheet=book_().getSheetByName('Configuracion'),count=sheet.getLastRow()-1,keys=new Set(count?sheet.getRange(2,1,count,1).getValues().flat():[]);
    // Add only absent defaults when the catalog version changes; preserve existing edits and activations.
    if(refreshCatalog){
      const data=count?sheet.getRange(2,1,count,2).getValues():[];
      for(const key of ['geographies','segments','signals','feeds','entities','capabilities','applicationScope','relevanceRules','searchLanguages']){
        const index=data.findIndex(row=>row[0]===key);if(index<0)continue;
        const value=JSON.parse(data[index][1]),defaults=CONFIGURATION_DEFAULTS[key];
        if(key==='capabilities'){
          for(const segment of Object.keys(value))if(!Object.hasOwn(defaults,segment))delete value[segment];
          for(const segment of Object.keys(defaults)){
            for(const row of value[segment])if(['API bancarias','Asistentes digitales'].includes(row.name)){const seed=defaults[segment].find(item=>item.name===row.name);if(seed)row.terms=[...new Set([...row.terms,...seed.terms])];}
            const names=new Set(value[segment].map(row=>searchText_(row.name)));
            value[segment].push(...defaults[segment].filter(row=>!names.has(searchText_(row.name))).slice(0,Math.max(0,60-value[segment].length)));
          }
        }else{
          if(['segments','applicationScope'].includes(key))value.splice(0,value.length,...value.filter(row=>row.name===sectorNewsDefaults.segment));
          if(['relevanceRules','searchLanguages'].includes(key))for(const row of value){const seed=defaults.find(item=>key==='searchLanguages'?item.language===row.language:item.role===row.role);if(seed)row.terms=[...new Set([...row.terms,...seed.terms])];}
          if(key==='feeds')for(const row of value){const seed=defaults.find(item=>item.id===row.id);if(seed&&row.id==='bankinter-blog')Object.assign(row,{url:seed.url,domain:seed.domain,country:seed.country});}
          if(key==='signals')value.splice(0,value.length,...canonicalSignalRules_(value,defaults));
          const names=new Set(value.map(row=>key==='feeds'?canonicalUrl_(row.url):searchText_(row.name))),ids=new Set(value.map(row=>row.id));
          if(key==='geographies')for(const row of value){const seed=defaults.find(item=>item.code===row.code);if(seed)row.terms=[...new Set([...(row.terms||[]),...seed.terms])];}
          if(key==='segments')for(const row of value){const seed=defaults.find(item=>item.name===row.name);if(seed)row.terms=[...new Set([...row.terms,...seed.terms])];}
          if(key==='entities')for(const row of value){const seed=defaults.find(item=>searchText_(item.name)===searchText_(row.name));if(seed){row.headquartersCountry=row.headquartersCountry||seed.headquartersCountry;row.countries=[...new Set([...row.countries,...seed.countries])];row.aliases=[...new Set([...row.aliases,...seed.aliases])];}}
          value.push(...defaults.filter(row=>!names.has(key==='feeds'?canonicalUrl_(row.url):searchText_(row.name))&&(key!=='feeds'||!ids.has(row.id))));
        }
        sheet.getRange(index+2,2,1,1).setValues([[JSON.stringify(value)]]);
      }
    }
    if(keys.has('taxonomy')){
      const rows=sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues(),index=rows.findIndex(row=>row[0]==='taxonomy'),blocks=JSON.parse(rows[index][1]),defaults=new Map(CONFIGURATION_DEFAULTS.taxonomy.flatMap(block=>block.functions.map(row=>[row.id,row])));
      if(book_().getSheetByName('CatalogoFuncional').getLastRow()<2&&blocks.every(block=>block.functions.every(row=>typeof row.name==='string')))writeFunctionalCatalog_(blocks);
      if(refreshCatalog)for(const block of blocks){
        const seed=CONFIGURATION_DEFAULTS.taxonomy.find(row=>row.name===block.name);
        if(seed)block.terms=[...new Set([...(block.terms||[]),...(seed.terms||[])])];
        for(const concept of seed?.emerging||[]){const previous=block.emerging.find(row=>row.name===concept.name||concept.primaryTerms?.includes(taxonomyText(row.name)));if(previous)Object.assign(previous,concept,{terms:[...new Set([...previous.terms,...concept.terms])]});else block.emerging.push(concept);}
        for(const row of block.functions){const next=defaults.get(row.id);if(next){row.terms=next.name.startsWith('Landing')?next.terms:[...new Set([...row.terms,...next.terms])];for(const key of ['context','exclude'])if(next[key]?.length)row[key]=next[key];}}
      }
      sheet.getRange(index+2,2,1,1).setValues([[JSON.stringify(functionalRuleSettings(blocks))]]);
    }
    append_('Configuracion',Object.entries(functionalConfigurationSettings_(CONFIGURATION_DEFAULTS)).filter(([key])=>!keys.has(key)).map(([key,value])=>[key,JSON.stringify(value)]));
    const settingsRow=sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues().findIndex(row=>row[0]==='settings')+2,stored=JSON.parse(sheet.getRange(settingsRow,2,1,1).getValues()[0][0]);
    const settings=Object.fromEntries(Object.entries(CONFIGURATION_DEFAULTS.settings).map(([key,value])=>[key,key in stored?stored[key]:value]));
    settings.newsletterEnabled=true;
    if(refreshCatalog){
      const languages=JSON.parse(sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues().find(row=>row[0]==='searchLanguages')[1]),turkish=new Set((languages.find(row=>row.language==='tr')?.terms||[]).map(searchText_)),shared=new Set(languages.filter(row=>row.language!=='tr').flatMap(row=>row.terms.map(searchText_))),before=settings.searchTerms;
      settings.searchTerms=[...new Set([...before.filter(term=>!turkish.has(searchText_(term))||shared.has(searchText_(term))),...CONFIGURATION_DEFAULTS.settings.searchTerms])];
      if(before.some(term=>!settings.searchTerms.includes(term)))telemetry_('configuracion',0,'OK','Términos exclusivos de turco conservados en searchLanguages.tr y retirados de la búsqueda transversal.');
    }
    sheet.getRange(settingsRow,2,1,1).setValues([[JSON.stringify(settings)]]);
    if(!ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='configurationEdited_'))ScriptApp.newTrigger('configurationEdited_').forSpreadsheet(book_()).onEdit().create();
    const subscriptions=book_().getSheetByName('Suscripciones'),countSubscriptions=subscriptions.getLastRow()-1;
    if(countSubscriptions>0){const range=subscriptions.getRange(2,8,countSubscriptions,1);range.setValues(range.getValues().map(([value])=>[value||'es']));}
    invalidateConfiguration_();
    const retired=book_().getSheetByName('Enriquecimiento');if(retired)book_().deleteSheet(retired);
    for(const key of ['ENRICHMENT_ENABLED','ENRICHMENT_REQUEST','ENRICHMENT_JOB','ENRICHMENT_HTTP_USAGE','VOCABULARY_VERSION'])properties_().deleteProperty(key);
    if(refreshCatalog){upgradeCollectionQueries_();if(translationJob_())requestTranslations_(true);properties_().setProperty('CATALOG_VERSION',CONFIGURATION_CATALOG_VERSION);}
    requestNewsClassification_();
    if(refreshCatalog&&newsSheet_().getLastRow()>1)requestTaxonomy_();
    initializeCollectionQueue_();
    if(refreshCatalog&&(newsSheet_().getLastRow()>1||book_().getSheetByName('Telemetria')?.getLastRow()>1))maintenance_();
    initializeBackgroundSchedules_();refreshNewsletterStatus_();
    compactCollectionTasks_();persistCandidates_([]);const removed=pruneNewsGenerations_();
    telemetry_('initializeConfiguration',0,'OK','Pestañas obsoletas eliminadas: '+(removed.join(', ')||'ninguna'));
    return 'Configuración inicializada. Pestañas obsoletas eliminadas: '+(removed.join(', ')||'ninguna')+'.';
  });
}
function validateConfiguration_(config){
  const storage=config?.storage;
  if(!storage||['primaryFolderId','logFolderId','newsletterFolderId'].some(key=>typeof storage[key]!=='string'||!/^[-\w]{10,100}$/.test(storage[key]))||['logRows','logDays','newsletterDeliveries'].some(key=>!Number.isInteger(storage[key])||storage[key]<1||storage[key]>1000))throw Error('Configuración de almacenamiento no válida.');
  const numeric={windowDays:[1,90],pageSize:[1,100],maxCustomFeeds:[1,100],maxFeedBytes:[10000,2000000],maxItems:[1,1000],exportLimit:[1,10000],eventLimit:[100,20000],retentionDays:[1,90],trendPoints:[2,60],trendSeries:[1,6],collectionBatch:[1,5],retryMinutes:[1,60],pauseMinutes:[1,60],dailyHour:[0,23],briefingLimit:[1,100],newsletterBatch:[1,100],newsletterDailyLimit:[1,1500]};
  if(!config||typeof config.settings!=='object')throw Error('Falta configuración operativa.');
  for(const [name,[min,max]] of Object.entries(numeric)){const n=config.settings[name];if(!Number.isInteger(n)||n<min||n>max)throw Error(name+': requiere un entero entre '+min+' y '+max+'.');}
  for(const key of ['afternoonHour','eveningHour','newsletterHour','dailyMinute','afternoonMinute','eveningMinute','newsletterMinute']){const max=key.endsWith('Hour')?23:59;if(!Number.isInteger(config.settings[key])||config.settings[key]<0||config.settings[key]>max)throw Error(key+': requiere un entero entre 0 y '+max+'.');}
  if(![1,5,10,15,30].includes(config.settings.watchdogMinutes))throw Error('El supervisor admite intervalos de 1, 5, 10, 15 o 30 minutos.');
  if(['morningEnabled','afternoonEnabled','eveningEnabled'].some(key=>typeof config.settings[key]!=='boolean'))throw Error('Activación de recopilaciones no válida.');
  if(typeof config.settings.newsletterEnabled!=='boolean')throw Error('Configuración de newsletter no válida.');
  newsletterEmail_(config.settings.newsletterSender);
  if(typeof config.settings.newsletterAppUrl!=='string'||(config.settings.newsletterAppUrl&&!/^https:\/\/script\.google\.com\/(?:a\/macros\/bbva\.com\/|macros\/)s\/[A-Za-z0-9_-]+\/exec$/.test(config.settings.newsletterAppUrl)))throw Error('URL de newsletter no válida: indica la WebApp publicada en Apps Script.');
  if(typeof config.settings.newsletterSenderName!=='string'||!config.settings.newsletterSenderName.trim()||config.settings.newsletterSenderName.length>100||/[\r\n]/.test(config.settings.newsletterSenderName))throw Error('Nombre del remitente no válido.');
  try{new Intl.DateTimeFormat('es',{timeZone:config.settings.timezone});}catch(_){throw Error('Zona horaria no válida.');}
  for(const key of ['entities','geographies','segments','signals','feeds','searchLanguages','relevanceRules']){
    const list=config[key];if(!Array.isArray(list)||list.length>200)throw Error('Catálogo no válido: '+key);
    const names=new Set();
    for(const row of list){
      if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>100||names.has(row.name)||typeof row.enabled!=='boolean')throw Error('Nombre duplicado, vacío o activación no válida: '+key);
      names.add(row.name);
      for(const field of ['terms','context','aliases','countries','exclude'])if(field in row&&(!Array.isArray(row[field])||row[field].length>(['searchLanguages','segments'].includes(key)?160:key==='signals'?120:80)||row[field].some(value=>typeof value!=='string'||!value.trim()||value.length>100)))throw Error('Lista de términos no válida: '+row.name);
      if(['segments','signals'].includes(key)&&!row.terms?.length)throw Error('Añade términos a '+row.name);
      if(key==='signals'&&(!Array.isArray(row.context)||!Array.isArray(row.exclude)||!['headline','fullText'].includes(row.scope)))throw Error('Define el contexto de '+row.name+' (puede estar vacío).');
      if(key==='signals'&&!['Novedad','Problema'].includes(row.group))throw Error('Define el tipo de señal: '+row.name);
      if(key==='entities'&&(!row.type||!Array.isArray(row.aliases)||!Array.isArray(row.countries)))throw Error('Entidad incompleta: '+row.name);
      if(key==='geographies'&&(!row.searchName||!/^[A-Z]{2}$/.test(row.code)||!/^\d{3}$/.test(row.mapId)||!/^[a-z]{2}(?:-[A-Za-z0-9]{2,8})?$/.test(row.language)))throw Error('País: código ISO, identificador cartográfico o idioma incorrectos.');
      if(key==='feeds'&&row.language&&feedLanguage(row.language)!==row.language)throw Error('Idioma de fuente no válido.');
      if(key==='feeds'&&(!row.id||!canonicalUrl_(row.url)||!domainMatches_(row.url,row.domain)||!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(row.domain)||!row.entity))throw Error('Fuente RSS no válida: '+row.name);
    }
    if(JSON.stringify(list).length>40000)throw Error('El catálogo excede el tamaño de una celda: '+key);
  }
  if(config.segments.length!==1||config.segments[0].name!==sectorNewsDefaults.segment||!config.segments[0].enabled)throw Error('El ámbito de contenido es Empresas e instituciones.');
  validateCapabilities_(config.capabilities);
  validateTaxonomy_(config.taxonomy);
  if(typeof config.settings.taxonomyCatalogUrl!=='string'||(config.settings.taxonomyCatalogUrl&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+(?:\/edit(?:[?#].*)?)?$/.test(config.settings.taxonomyCatalogUrl)))throw Error('Fuente del catálogo funcional no válida.');
  for(const row of config.relevanceRules)if(!RELEVANCE_ROLES.includes(row.role)||!row.terms.length||Object.keys(row).sort().join(',')!=='enabled,name,role,terms'||row.terms.some(term=>/[\\^$+?(){}[\]|]/.test(term)||term.includes('**')||term.split(' ').some(word=>word.includes('*')&&word.indexOf('*')!==word.length-1)))throw Error('Criterio de relevancia no válido.');
  const languages=new Set();for(const row of config.searchLanguages){if(!/^[a-z]{2}$/.test(row.language)||languages.has(row.language)||!row.terms.length||row.terms.length>160||Object.keys(row).sort().join(',')!=='enabled,language,name,terms')throw Error('Perfil de búsqueda no válido.');languages.add(row.language);}
  if(Object.keys(config).sort().join(',')!=='applicationScope,capabilities,entities,feeds,geographies,relevanceRules,searchLanguages,segments,settings,signals,storage,taxonomy')throw Error('Claves de configuración no reconocidas.');
  for(const key of ['searchTerms','disabledSources'])if(!Array.isArray(config.settings[key])||config.settings[key].length>1000||config.settings[key].some(value=>typeof value!=='string'||value.length>160))throw Error('Lista operativa no válida: '+key);
  if(!config.settings.searchTerms.length||config.settings.searchTerms.length>80)throw Error('Define entre 1 y 80 términos de búsqueda.');
  if(encodeURIComponent(JSON.stringify(functionalConfigurationSettings_(config))).replace(/%[A-F\d]{2}/gi,'x').length>96000)throw Error('Configuración demasiado grande para la caché.');
  const countries=new Set(config.geographies.map(row=>row.name)),aliases=new Set();
  const scopes=config.applicationScope,scopeNames=applicationScopeSegments;
  if(!Array.isArray(scopes)||scopes.length!==scopeNames.length||new Set(scopes.map(row=>row?.name)).size!==scopeNames.length||scopes.some(row=>!row||!scopeNames.includes(row.name)||Object.keys(row).sort().join(',')!=='countries,name'||!Array.isArray(row.countries)||row.countries.some(country=>!countries.has(country))||new Set(row.countries).size!==row.countries.length))throw Error('Ámbito de aplicación no válido.');
  for(const row of config.entities){
    if(!countries.has(row.headquartersCountry)||row.countries.some(country=>!countries.has(country)))throw Error('País desconocido en '+row.name);
    for(const name of [row.name,...row.aliases]){const key=searchText_(name);if(aliases.has(key))throw Error('Alias compartido por varias entidades: '+name);aliases.add(key);}
  }
  if(new Set(config.geographies.map(row=>row.code)).size!==config.geographies.length||new Set(config.geographies.map(row=>row.mapId)).size!==config.geographies.length)throw Error('Código de país duplicado.');
  if(typeof config.settings.unknownCountry!=='string'||!config.settings.unknownCountry.trim()||config.settings.unknownCountry.length>100)throw Error('Define la geografía predeterminada de los RSS.');
  if(new Set(config.feeds.map(row=>row.id)).size!==config.feeds.length||new Set(config.feeds.map(row=>canonicalUrl_(row.url))).size!==config.feeds.length)throw Error('Fuente RSS duplicada.');
  return config;
}
function configurationRevision_(){configuration_();return configurationVersionMemory_;}
function getConfiguration(){authorize_(true);return {config:configuration_(),revision:configurationRevision_(),capabilityDefaults:CONFIGURATION_DEFAULTS.capabilities,storagePrimaryId:properties_().getProperty('SPREADSHEET_ID')};}
function saveConfiguration(payload){authorize_(true);if(JSON.stringify(payload.config.storage)!==JSON.stringify(configuration_().storage))validateStorageFolders_(payload.config.storage);return writeConfiguration_(payload.config,payload.revision);}
function writeConfiguration_(config,revision){
  validateConfiguration_(config);const canonical=functionalConfiguration_(config);if(JSON.stringify(config.taxonomy.map(block=>[block.name,block.functions.map(row=>[row.id,row.name])]))!==JSON.stringify(canonical.taxonomy.map(block=>[block.name,block.functions.map(row=>[row.id,row.name])])))throw Error('Los códigos y nombres oficiales se actualizan exclusivamente desde el catálogo maestro.');config=canonical;return withForegroundWrite_(()=>{
    if(revision!==String(properties_().getProperty('CONFIG_REVISION')||'0'))throw Error('La configuración ha cambiado en otra sesión. Recarga los catálogos antes de guardar.');
    const reclassify=classificationRulesRevision_()!==classificationRulesRevision_(config);
    const taxonomyChanged=JSON.stringify(configuration_().taxonomy)!==JSON.stringify(config.taxonomy)||configuration_().settings.taxonomyCatalogUrl!==config.settings.taxonomyCatalogUrl;
    const sheet=book_().getSheetByName('Configuracion'),rows=Object.entries(functionalConfigurationSettings_(config)).map(([key,value])=>[key,JSON.stringify(value)]);
    sheet.getRange(2,1,Math.max(rows.length,sheet.getLastRow()-1),2).clearContent();append_('Configuracion',rows);invalidateConfiguration_();if(reclassify)requestNewsClassification_(true);if(taxonomyChanged)requestTaxonomy_();initializeBackgroundSchedules_();refreshNewsletterStatus_();
    return 'Configuración guardada. Se aplicará a filtros, clasificación y próximas recopilaciones.';
  });
}

function validateCapabilities_(capabilities){
  if(!capabilities||Object.keys(capabilities).join(',')!=='Empresas')throw Error('Define capacidades digitales para Empresas e instituciones.');
  for(const [segment,rows] of Object.entries(capabilities)){
    if(!Array.isArray(rows)||rows.length>60)throw Error('Máximo 60 capacidades por segmento: '+segment);
    const names=new Set();
    for(const row of rows){
      const name=searchText_(row?.name);
      if(!row||typeof row.name!=='string'||!name||row.name.length>100||names.has(name)||typeof row.enabled!=='boolean'||Object.keys(row).sort().join(',')!=='enabled,name,terms')throw Error('Capacidad vacía, duplicada o no válida: '+segment);
      names.add(name);
      if(!Array.isArray(row.terms)||!row.terms.length||row.terms.length>24||row.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>80||/[";\r\n]/.test(term)))throw Error('Define entre 1 y 24 términos de hasta 80 caracteres: '+row.name);
    }
  }
  if(JSON.stringify(capabilities).length>40000)throw Error('El catálogo de capacidades excede el tamaño de una celda.');
}





function canonicalSignalRules_(rows,seeds){
 return seeds.map(seed=>{
  const saved=rows.find(row=>row.name===seed.name||seed.group==='Problema'&&row.group==='Problema');
  return {...saved,...seed,...Object.fromEntries(['terms','context','exclude'].map(key=>[key,[...new Map([...(saved?.[key]||[]),...(seed[key]||[])].map(term=>[searchText_(term),term])).values()]]))};
 });
}
