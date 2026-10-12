function installNewsletterSchedule(){
  authorize_(true);newsletterSender_();
  for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='deliverNewsletters_')ScriptApp.deleteTrigger(trigger);
  ScriptApp.newTrigger('deliverNewsletters_').timeBased().everyDays(1).atHour(settings_().dailyHour).inTimezone(settings_().timezone).create();
  return 'Programación instalada. Activa la entrega en Configuración de negocio → Newsletter.';
}
function sendPendingNewsletters(){
  authorize_(true);
  if(!settings_().newsletterEnabled)throw Error('La entrega está desactivada. Actívala en Configuración de negocio → Newsletter.');
  return deliverNewsletters_();
}
function deliverNewsletters_(){
  const result={accepted:0,empty:0,duplicates:0,pending:0,state:'disabled'};
  if(!settings_().newsletterEnabled)return result;
  const now=new Date(),lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {...result,state:'busy'};
  try{
    if(newsletterCollectionPriority_()){ensureNewsletterContinuation_();return {...result,state:'collection_priority'};}
    const deliveries=rows_('NewsletterEnvios'),sent=new Set(deliveries.filter(row=>!['No enviado','Bloqueada'].includes(row.estado)).map(row=>row.id)),periods=new Map();
    const due=subscriptionRows_().filter(row=>row.activa).flatMap(row=>{
      if(!periods.has(row.periodicidad))periods.set(row.periodicidad,newsletterPeriod_(row.periodicidad,now));
      const period=periods.get(row.periodicidad),id=newsletterDeliveryId_(row,period);
      return sent.has(id)||new Date(row.actualizada)>=new Date(period.cutoff)?[]:[{row,id}];
    });
    result.pending=due.length;result.state='no_due';if(!due.length)return result;
    let remaining=settings_().newsletterBatch,quota=newsletterBudget_(deliveries,now);
    if(!quota)return {...result,state:'limit'};
    let sender;
    const history=newsletterSentContent_(deliveries),window=recentNewsRange_(now);
    const news=annotateNews_(rows_('Noticias',settings_().newsReadLimit).filter(row=>newsScope_(row,window,''))).filter(row=>row.senales.length),prepared=new Map(),sheet=book_().getSheetByName('NewsletterEnvios');
    sheet.getRange(1,9,1,1).setValues([['contenido']]);
    result.state='processed';
    for(const {row,id} of due){
      if(!remaining||!quota)break;
      if(newsletterCollectionPriority_()){result.state='collection_priority';break;}
      const query={...row.filtros,...window},key=JSON.stringify(query);
      if(!prepared.has(key))prepared.set(key,selectAnnotatedNews_(news,query));
      const email=newsletterEmail_(row.correo);if(!history.has(email))history.set(email,new Set());
      const known=history.get(email),selected=prepared.get(key),unseen=newsletterUnseen_(selected,known),edition=Utilities.getUuid(),content=newsletterContent_(unseen,query,row.nombre,now,row.id,row.idioma,edition),keys=content.items.flatMap(newsletterItemKeys_);
      const skipped=selected.length-unseen.length;content.omitted=skipped;result.duplicates+=skipped;
      if(content.count&&!sender)try{sender=newsletterSender_();}catch(error){recordNewsletterBlock_(error,properties_().getProperty('OWNER_EMAIL'));throw error;}
      if(content.count)saveNewsletterEdition_(edition,id,row.correo,row.nombre,query,row.idioma,content.items);
      append_('NewsletterEnvios',[[id,row.id,row.correo,window.from,window.to,content.count?'Enviando':'Sin novedades',now.toISOString(),newsletterContentDetail_(content),JSON.stringify(keys)]]);
      remaining--;result.pending--;
      if(!content.count){result.empty++;continue;}
      for(const key of keys)known.add(key);quota--;
      try{completeNewsletterDelivery_(sheet,sheet.getLastRow(),sender,row.correo,row.nombre+' · '+window.from+' / '+window.to,content);result.accepted++;}
      catch(error){result.state='error';result.error=error.message;if(error.rejected)result.pending++;break;}
    }
    if(result.state!=='error'&&quota&&result.pending)ensureNewsletterContinuation_();
    return result;
  }finally{lock.releaseLock();}
}
function newsletterTick_(){for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='newsletterTick_')ScriptApp.deleteTrigger(trigger);deliverNewsletters_();}
