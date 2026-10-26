function newsletterEnabled_(){return settings_().newsletterEnabled&&scheduledTriggers_('scheduledNewsletters_').length>0;}
function newsletterCountries_(){return [...configuration_().applicationScope.find(row=>row.name===sectorNewsDefaults.segment).countries,otherGeography,...new Set(configuration_().geographies.map(row=>row.region).filter(Boolean))];}
function subscriptionFilters_(input={}){return {...sectorNewsDefaults,...(input.country?{country:input.country}:{})};}
function subscriptionRows_(email){
  return rows_('Suscripciones').filter(row=>row.id&&(!email||row.correo===email)).map(row=>{const filters=JSON.parse(row.filtros);return {...row,filtros:{...subscriptionFilters_(filters),...(filters.aliases?.length?{aliases:filters.aliases}:{})},activa:String(row.activa)==='true'};});
}
function subscriptionDefaults_(){return {active:true,filters:{},language:'es'};}
function getNewsletterOptions(){const session=authorize_();return {email:session.email,enabled:newsletterEnabled_(),countries:newsletterCountries_(),defaults:subscriptionDefaults_()};}
function subscriptionDates_(row,attempts,now=new Date()){
  return Object.keys(newsletterCadences).map(periodicidad=>{const subscription={...row,periodicidad},period=newsletterPeriod_(periodicidad,now);return newsletterNextDate_(subscription,now,newsletterDeliveryAttempt_(subscription,period,attempts));}).filter(Boolean).sort()[0]||'';
}
function getSubscriptions(){const email=authorize_().email,deliveries=rows_('NewsletterEnvios',undefined,8),attempts=newsletterDeliveryAttempts_(deliveries);return subscriptionRows_(email).map(row=>({...row,nextDelivery:subscriptionDates_(row,attempts),ultimaEntrega:deliveries.filter(item=>item.correo===email).at(-1)||null}));}
function getAdminSubscriptions(){authorize_(true);const deliveries=rows_('NewsletterEnvios',undefined,8),attempts=newsletterDeliveryAttempts_(deliveries);return subscriptionRows_().map(row=>({...row,nextDelivery:subscriptionDates_(row,attempts),ultimaEntrega:deliveries.filter(item=>item.correo===row.correo).at(-1)||null}));}
function subscriptionRecord_(input,email,id,now){
  const language=input.language||'es',country=String(input.country||'');
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  if(country&&!newsletterCountries_().includes(country))throw Error('Geografía no disponible para Empresas e instituciones.');
  return {id,correo:email,nombre:'Mi Newsletter'+(country?' · '+country:''),filtros:subscriptionFilters_({country}),periodicidad:'all',activa:input.active!==false,actualizada:now.toISOString(),idioma:language};
}
function newsletterPeriod_(periodicity,now){return newsletterWindow(periodicity,recordDay(now,settings_().timezone),true);}
function subscriptionQuery_(subscription,now,closed=false){const periodicity=subscription.periodicidad,period=newsletterWindow(periodicity,recordDay(now,settings_().timezone),closed);return {...subscriptionFilters_(subscription.filtros),from:period.from,to:period.to,view:newsletterCadences[periodicity].view};}
function newsletterDeliveryId_(subscription,period){return subscription.id+':'+subscription.periodicidad+':'+period.from;}
function newsletterSubscriptionIds_(subscription){return [subscription.id,...(subscription.filtros?.aliases||[])];}
function newsletterAttemptPriority_(row){return !row?0:row.estado==='Enviada'?4:row.estado==='Sin novedades'?3:['Enviando','Revisar'].includes(row.estado)?2:1;}
function newsletterDeliveryAttempts_(deliveries){
  const attempts=new Map();for(const row of deliveries)if(newsletterAttemptPriority_(row)>=newsletterAttemptPriority_(attempts.get(row.id)))attempts.set(row.id,row);return attempts;
}
function newsletterDeliveryAttempt_(subscription,period,attempts){
  let selected;for(const id of newsletterSubscriptionIds_(subscription)){const attempt=attempts.get(newsletterDeliveryId_({...subscription,id},period));if(newsletterAttemptPriority_(attempt)>newsletterAttemptPriority_(selected))selected=attempt;}return selected;
}
function newsletterNextDate_(subscription,now,last){
  if(!subscription.activa)return '';
  const day=recordDay(now,settings_().timezone),period=newsletterPeriod_(subscription.periodicidad,now),completed=newsletterSubscriptionIds_(subscription).some(id=>last?.id===newsletterDeliveryId_({...subscription,id},period))&&!['No enviado','Bloqueada'].includes(last.estado);
  const available=completed||new Date(subscription.actualizada)>=new Date(period.cutoff)?newsletterWindow(subscription.periodicidad,day).available:period.available;
  return day>available?day:available;
}
function writeSubscription_(input,admin){
  const session=authorize_(admin),email=admin?String(input.email||'').trim().toLowerCase():session.email;newsletterEmail_(email);
  return withForegroundWrite_(()=>{
    const rows=subscriptionRows_(),index=rows.findIndex(row=>admin&&input.id?row.id===input.id:row.correo===email);
    if(input.id&&(index<0||rows[index].id!==input.id))throw Error('Suscripción no encontrada.');
    if(rows.some((row,i)=>i!==index&&row.correo===email))throw Error('Ya existe una suscripción para ese correo.');
    const record=subscriptionRecord_(input,email,index>=0?rows[index].id:Utilities.getUuid(),new Date());if(index>=0){const original=JSON.parse(book_().getSheetByName('Suscripciones').getRange(index+2,4,1,1).getDisplayValues()[0][0]);if(original.aliases?.length)record.filtros.aliases=original.aliases;}const values=RADAR.sheets.Suscripciones.map(key=>key==='filtros'?JSON.stringify(record[key]):record[key]);
    if(index<0)append_('Suscripciones',[values]);else book_().getSheetByName('Suscripciones').getRange(index+2,1,1,values.length).setValues([values]);
    properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());refreshNewsletterStatus_();return 'Suscripción guardada. Recibirás las ediciones quincenal y trimestral.';
  });
}
function saveSubscription(input){return writeSubscription_(input,false);}
function saveAdminSubscription(input){return writeSubscription_(input,true);}
function deleteSubscription(id){
  const session=authorize_();return withForegroundWrite_(()=>{const rows=rows_('Suscripciones'),index=rows.findIndex(row=>row.correo===session.email&&(row.id===id||JSON.parse(row.filtros).aliases?.includes(id)));if(index<0)throw Error('Suscripción no encontrada.');book_().getSheetByName('Suscripciones').deleteRow(index+2);properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());refreshNewsletterStatus_();return 'Suscripción eliminada.';});
}
function deleteAdminSubscription(id){authorize_(true);return withForegroundWrite_(()=>{const index=rows_('Suscripciones').findIndex(row=>row.id===id);if(index<0)throw Error('Suscripción no encontrada.');book_().getSheetByName('Suscripciones').deleteRow(index+2);properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());refreshNewsletterStatus_();return 'Suscripción eliminada.';});}
