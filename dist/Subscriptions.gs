function newsletterEnabled_(){return settings_().newsletterEnabled&&ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='scheduledNewsletters_');}
function subscriptionRows_(email){
  const translators=new Map();
  return rows_('Suscripciones').filter(row=>!email||row.correo===email).map(row=>{
    const filters=subscriptionFilters_(JSON.parse(row.filtros)),language=row.idioma||'es';
    if(!translators.has(language))translators.set(language,taxonomyLanguage_(language));
    return {...row,filtros:filters,nombre:newsletterSubject_(filters,language,translators.get(language)),activa:String(row.activa)==='true'};
  });
}
function subscriptionFilters_(input){return {coverage:sectorNewsDefaults.coverage,...Object.fromEntries(subscriptionFilterKeys.filter(key=>Object.hasOwn(input,key)).map(key=>[key,input[key]]))};}
function subscriptionDefaults_(){return {periodicity:settings_().defaultPeriodicity,active:true,filters:{...sectorNewsDefaults}};}
function getSubscriptions(){const email=authorize_().email,deliveries=new Map(rows_('NewsletterEnvios',undefined,8).filter(row=>row.correo===email).map(row=>[row.suscripcion,row]));return subscriptionRows_(email).map(row=>({...row,query:subscriptionQuery_(row,new Date()),nextDelivery:newsletterNextDate_(row,new Date(),deliveries.get(row.id)),ultimaEntrega:deliveries.get(row.id)||null}));}
function getNewsletterOptions(){const session=authorize_(),c=configuration_();return {taxonomyTranslations:taxonomyTranslations_(),email:session.email,defaults:subscriptionDefaults_(),enabled:newsletterEnabled_(),catalogs:{...taxonomyOptions_(),coverage:Object.keys(coverageOptions),type:[...new Set(c.entities.filter(r=>r.enabled).map(r=>r.type))],entity:c.entities.filter(r=>r.enabled).map(r=>r.name),segment:c.segments.filter(r=>r.enabled).map(r=>r.name),country:c.geographies.filter(r=>r.enabled).map(r=>r.name),signal:c.signals.filter(r=>r.enabled).map(r=>r.name),source:[...new Set([...newsRecordIndex_().sources,...feeds_().map(r=>r.name)])].filter(Boolean).sort()}};}
function getAdminSubscriptions(){authorize_(true);const deliveries=new Map();for(const row of rows_('NewsletterEnvios',undefined,8))deliveries.set(row.suscripcion,row);return subscriptionRows_().map(row=>({...row,nextDelivery:newsletterNextDate_(row,new Date(),deliveries.get(row.id)),ultimaEntrega:deliveries.get(row.id)||null}));}
function subscriptionRecord_(input,email,id,now,count){
  const language=input.language||'es';if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const periodicity=input.periodicity||settings_().defaultPeriodicity;
  if(!Object.hasOwn(newsletterCadences,periodicity))throw Error('Periodicidad no válida.');
  if(count>=settings_().maxSubscriptions)throw Error('Máximo '+settings_().maxSubscriptions+' suscripciones por usuario.');
  const filters={...sectorNewsDefaults,coverage:sectorNewsDefaults.coverage};for(const key of subscriptionFilterKeys){if(!Object.hasOwn(input.filters||{},key))continue;const value=String(input.filters[key]||'');if(value.length>160)throw Error('Filtro demasiado largo.');filters[key]=value;}
  if(filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  const catalogs={entity:'entities',country:'geographies',segment:'segments',signal:'signals'};
  for(const [key,catalog] of Object.entries(catalogs))if(filters[key]&&!configuration_()[catalog].some(r=>r.enabled&&r.name===filters[key]))throw Error('Filtro no disponible: '+key);
  const taxonomy=taxonomyCatalog_();
  if(filters.palanca&&!taxonomy.some(row=>row.palanca===filters.palanca)||filters.subpalanca&&!taxonomy.some(row=>taxonomyPath(row)===filters.subpalanca&&(!filters.palanca||row.palanca===filters.palanca)))throw Error('Filtro de taxonomía no disponible.');
  const selection=filters;
  return {id,correo:email,nombre:newsletterSubject_(selection,language),filtros:selection,periodicidad:periodicity,activa:input.active!==false,actualizada:now.toISOString(),idioma:language};
}
function newsletterPeriod_(periodicity,now){return newsletterWindow(periodicity,recordDay(now,settings_().timezone),true);}
function subscriptionQuery_(subscription,now,closed=false){const periodicity=subscription.periodicidad||settings_().defaultPeriodicity,period=newsletterWindow(periodicity,recordDay(now,settings_().timezone),closed);return {...subscriptionFilters_(subscription.filtros),from:period.from,to:period.to,view:newsletterCadences[periodicity].view};}
function newsletterDeliveryId_(subscription,period){return subscription.id+':'+subscription.periodicidad+':'+period.from;}
function newsletterNextDate_(subscription,now,last){
  if(!subscription.activa)return '';
  const day=recordDay(now,settings_().timezone),period=newsletterPeriod_(subscription.periodicidad,now),completed=last?.id===newsletterDeliveryId_(subscription,period)&&!['No enviado','Bloqueada'].includes(last.estado);
  const available=completed||new Date(subscription.actualizada)>=new Date(period.cutoff)?newsletterWindow(subscription.periodicidad,day).available:period.available;
  return day>available?day:available;
}
function subscriptionIdentity_(row){
  const filters=subscriptionFilters_(row.filtros);
  if(filters.search)filters.search=searchText_(filters.search).trim().replace(/\s+/g,' ');
  return JSON.stringify([row.correo.trim().toLowerCase(),row.periodicidad,row.idioma||'es',subscriptionFilterKeys.filter(key=>filters[key]).map(key=>[key,filters[key]])]);
}
function assertUniqueSubscription_(record,rows){
  const identity=subscriptionIdentity_(record);
  if(rows.some(row=>row.id!==record.id&&subscriptionIdentity_(row)===identity))throw Error('Ya existe una suscripción con el mismo destinatario, periodicidad, idioma y filtros. Edita la existente.');
}
function writeSubscription_(input,admin){
  const session=authorize_(admin),email=admin?String(input.email||'').trim().toLowerCase():session.email;
  newsletterEmail_(email);
  return withForegroundWrite_(()=>{
    const rows=subscriptionRows_(),index=input.id?rows.findIndex(r=>r.id===input.id&&(admin||r.correo===email)):-1;
    if(input.id&&index<0)throw Error('Suscripción no encontrada.');
    const record=subscriptionRecord_(input,email,input.id||Utilities.getUuid(),new Date(),rows.filter(r=>r.correo===email&&r.id!==input.id).length),values=RADAR.sheets.Suscripciones.map(key=>key==='filtros'?JSON.stringify(record[key]):record[key]);
    assertUniqueSubscription_(record,rows);
    if(index<0)append_('Suscripciones',[values]);else book_().getSheetByName('Suscripciones').getRange(index+2,1,1,values.length).setValues([values]);
    properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());
    return 'Suscripción guardada'+(newsletterEnabled_()?'. Recibirás las novedades del período seleccionado.':'. La entrega está pendiente de activación por el administrador.');
  });
}
function saveSubscription(input){return writeSubscription_(input,false);}
function saveAdminSubscription(input){return writeSubscription_(input,true);}
function deleteSubscription(id){
  const session=authorize_();return withForegroundWrite_(()=>{const index=rows_('Suscripciones').findIndex(row=>row.id===id&&row.correo===session.email);if(index<0)throw Error('Suscripción no encontrada.');book_().getSheetByName('Suscripciones').deleteRow(index+2);properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());return 'Suscripción eliminada.';});
}

function initializeNewsletterCadences_(sheet,changes={}){
  const count=sheet.getLastRow()-1;if(!count)return;const keys=RADAR.sheets.Suscripciones,rows=sheet.getRange(2,1,count,keys.length).getValues();let changed=false;
  for(const values of rows){const filters=JSON.stringify(subscriptionFilters_(JSON.parse(values[3]))),cadence=changes[values[4]]||(Object.hasOwn(newsletterCadences,values[4])?values[4]:'fortnightly');if(filters!==values[3]||cadence!==values[4]){values[3]=filters;values[4]=cadence;changed=true;}}
  if(changed){sheet.getRange(2,1,count,keys.length).setValues(rows);properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());}
}
