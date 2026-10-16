function newsletterEnabled_(){return settings_().newsletterEnabled&&scheduledTriggers_('scheduledNewsletters_').length>0;}
function newsletterCountries_(){return configuration_().applicationScope.find(row=>row.name===sectorNewsDefaults.segment).countries;}
function subscriptionFilters_(input={}){return {...sectorNewsDefaults,...(input.country?{country:input.country}:{})};}
function subscriptionRows_(email){
  return rows_('Suscripciones').filter(row=>row.id&&(!email||row.correo===email)).map(row=>({...row,filtros:subscriptionFilters_(JSON.parse(row.filtros)),activa:String(row.activa)==='true'}));
}
function subscriptionDefaults_(){return {active:true,filters:{},language:'es'};}
function getNewsletterOptions(){const session=authorize_();return {email:session.email,enabled:newsletterEnabled_(),countries:newsletterCountries_(),defaults:subscriptionDefaults_()};}
function subscriptionDates_(row,deliveries,now=new Date()){
  return Object.keys(newsletterCadences).map(periodicity=>newsletterNextDate_({...row,periodicidad:periodicity},now,deliveries.filter(item=>item.suscripcion===row.id).at(-1))).filter(Boolean).sort()[0]||'';
}
function getSubscriptions(){const email=authorize_().email,deliveries=rows_('NewsletterEnvios',undefined,8).filter(row=>row.correo===email);return subscriptionRows_(email).map(row=>({...row,nextDelivery:subscriptionDates_(row,deliveries),ultimaEntrega:deliveries.at(-1)||null}));}
function getAdminSubscriptions(){authorize_(true);const deliveries=rows_('NewsletterEnvios',undefined,8);return subscriptionRows_().map(row=>({...row,nextDelivery:subscriptionDates_(row,deliveries),ultimaEntrega:deliveries.filter(item=>item.correo===row.correo).at(-1)||null}));}
function subscriptionRecord_(input,email,id,now){
  const language=input.language||'es',country=String(input.country||'');
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  if(country&&!newsletterCountries_().includes(country))throw Error('Geografía no disponible para Empresas e instituciones.');
  return {id,correo:email,nombre:'Mi Newsletter'+(country?' · '+country:''),filtros:subscriptionFilters_({country}),periodicidad:'all',activa:input.active!==false,actualizada:now.toISOString(),idioma:language};
}
function newsletterPeriod_(periodicity,now){return newsletterWindow(periodicity,recordDay(now,settings_().timezone),true);}
function subscriptionQuery_(subscription,now,closed=false){const periodicity=subscription.periodicidad,period=newsletterWindow(periodicity,recordDay(now,settings_().timezone),closed);return {...subscriptionFilters_(subscription.filtros),from:period.from,to:period.to,view:newsletterCadences[periodicity].view};}
function newsletterDeliveryId_(subscription,period){return subscription.id+':'+subscription.periodicidad+':'+period.from;}
function newsletterNextDate_(subscription,now,last){
  if(!subscription.activa)return '';
  const day=recordDay(now,settings_().timezone),period=newsletterPeriod_(subscription.periodicidad,now),completed=last?.id===newsletterDeliveryId_(subscription,period)&&!['No enviado','Bloqueada'].includes(last.estado);
  const available=completed||new Date(subscription.actualizada)>=new Date(period.cutoff)?newsletterWindow(subscription.periodicidad,day).available:period.available;
  return day>available?day:available;
}
function writeSubscription_(input,admin){
  const session=authorize_(admin),email=admin?String(input.email||'').trim().toLowerCase():session.email;newsletterEmail_(email);
  return withForegroundWrite_(()=>{
    const rows=subscriptionRows_(),index=rows.findIndex(row=>row.correo===email);
    if(input.id&&(index<0||rows[index].id!==input.id))throw Error('Suscripción no encontrada.');
    const record=subscriptionRecord_(input,email,index>=0?rows[index].id:Utilities.getUuid(),new Date());if(index>=0){const original=JSON.parse(book_().getSheetByName('Suscripciones').getRange(index+2,4,1,1).getDisplayValues()[0][0]);if(original.aliases?.length)record.filtros.aliases=original.aliases;}const values=RADAR.sheets.Suscripciones.map(key=>key==='filtros'?JSON.stringify(record[key]):record[key]);
    if(index<0)append_('Suscripciones',[values]);else book_().getSheetByName('Suscripciones').getRange(index+2,1,1,values.length).setValues([values]);
    properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());return 'Suscripción guardada. Recibirás las ediciones quincenal, trimestral y anual.';
  });
}
function saveSubscription(input){return writeSubscription_(input,false);}
function saveAdminSubscription(input){return writeSubscription_(input,true);}
function deleteSubscription(id){
  const session=authorize_();return withForegroundWrite_(()=>{const rows=rows_('Suscripciones'),index=rows.findIndex(row=>row.correo===session.email&&(row.id===id||JSON.parse(row.filtros).aliases?.includes(id)));if(index<0)throw Error('Suscripción no encontrada.');book_().getSheetByName('Suscripciones').deleteRow(index+2);properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());return 'Suscripción eliminada.';});
}
function initializeSubscriptions_(sheet){
  const count=sheet.getLastRow()-1;if(!count)return;const keys=RADAR.sheets.Suscripciones,rows=sheet.getRange(2,1,count,keys.length).getDisplayValues().filter(row=>row[0]),groups=new Map();
  for(const values of rows){const email=values[1];if(!groups.has(email))groups.set(email,[]);groups.get(email).push(Object.fromEntries(keys.map((key,i)=>[key,values[i]])));}
  const result=[];
  for(const [email,items] of groups){
    const active=items.filter(row=>row.activa==='true'),countries=[...new Set(active.map(row=>JSON.parse(row.filtros).country||''))],first=items[0],country=countries.length===1&&newsletterCountries_().includes(countries[0])?countries[0]:'',aliases=[...new Set(items.flatMap(row=>[row.id,...(JSON.parse(row.filtros).aliases||[])]))].filter(id=>id!==first.id);
    const record=subscriptionRecord_({country,active:active.length>0,language:first.idioma||'es'},email,first.id,new Date(first.actualizada));record.filtros.aliases=aliases;
    result.push(keys.map(key=>key==='filtros'?JSON.stringify(record[key]):record[key]));
  }
  if(JSON.stringify(rows)===JSON.stringify(result.map(row=>row.map(String))))return;
  append_('Auditoria',[['migration:'+RADAR.version,new Date().toISOString(),'Suscripciones','','Migración','Consolidadas por usuario; IDs originales: '+rows.map(row=>row[0]).join(', ')]]);
  sheet.getRange(2,1,result.length,keys.length).setNumberFormat('@').setValues(result);if(count>result.length)sheet.getRange(result.length+2,1,count-result.length,keys.length).clearContent();
  properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());
}
function deleteAdminSubscription(id){authorize_(true);return withForegroundWrite_(()=>{const index=rows_('Suscripciones').findIndex(row=>row.id===id);if(index<0)throw Error('Suscripción no encontrada.');book_().getSheetByName('Suscripciones').deleteRow(index+2);properties_().setProperty('SUBSCRIPTIONS_REVISION',Utilities.getUuid());return 'Suscripción eliminada.';});}
