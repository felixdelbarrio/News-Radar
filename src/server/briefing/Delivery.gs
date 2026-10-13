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
  if(configurationPaused_()){deferConfigurationWork_('newsletter');return {...result,state:'configuration_pause'};}
  if(!settings_().newsletterEnabled)return result;
  const now=new Date(),lock=LockService.getScriptLock();if(!lock.tryLock(1000)){
    if(configurationPaused_()){deferConfigurationWork_('newsletter');return {...result,state:'configuration_pause'};}
    return {...result,state:'busy'};
  }
  try{
    if(configurationPaused_()){deferConfigurationWork_('newsletter');return {...result,state:'configuration_pause'};}
    if(businessPipelinePending_()){ensureNewsletterContinuation_();return {...result,state:'collection_priority'};}
    const deliveries=rows_('NewsletterEnvios'),sent=new Set(deliveries.filter(row=>!['No enviado','Bloqueada'].includes(row.estado)).map(row=>row.id)),periods=new Map();
    const due=subscriptionRows_().filter(row=>row.activa).flatMap(row=>{
      if(!periods.has(row.periodicidad))periods.set(row.periodicidad,newsletterPeriod_(row.periodicidad,now));
      const period=periods.get(row.periodicidad),id=newsletterDeliveryId_(row,period);
      return recordDay(now,settings_().timezone)<period.available||sent.has(id)||new Date(row.actualizada)>=new Date(period.cutoff)?[]:[{row,id,query:subscriptionQuery_(row,now,true)}];
    });
    result.pending=due.length;result.state='no_due';if(!due.length)return result;
    let remaining=settings_().newsletterBatch,quota=newsletterBudget_(deliveries,now);
    if(!quota)return {...result,state:'limit'};
    let sender;
    const history=newsletterSentContent_(deliveries),window={from:due.reduce((start,item)=>item.query.from<start?item.query.from:start,due[0].query.from),to:due.reduce((end,item)=>item.query.to>end?item.query.to:end,due[0].query.to)};
    const news=annotateNews_(rows_('Noticias',settings_().newsReadLimit).filter(row=>newsScope_(row,window,''))),prepared=new Map(),sheet=book_().getSheetByName('NewsletterEnvios');
    sheet.getRange(1,9,1,1).setValues([['contenido']]);
    result.state='processed';
    for(const {row,id,query} of due){
      if(!remaining||!quota)break;
      if(configurationPaused_()){deferConfigurationWork_('newsletter');result.state='configuration_pause';break;}
      if(businessPipelinePending_()){result.state='collection_priority';break;}
      const selection=newsletterSelectionQuery_(query),key=JSON.stringify(selection);
      if(!prepared.has(key))prepared.set(key,selectAnnotatedNews_(news,selection));
      const email=newsletterEmail_(row.correo);if(!history.has(email))history.set(email,new Set());
      const known=history.get(email),selected=prepared.get(key),unseen=query.view==='briefing'?newsletterUnseen_(selected,known):selected,edition=Utilities.getUuid(),content=newsletterContent_(unseen,query,row.nombre,now,row.id,row.idioma,edition,known),keys=content.items.flatMap(newsletterItemKeys_);
      const skipped=selected.length-unseen.length;content.omitted=skipped;result.duplicates+=skipped;
      if(content.count&&!sender)try{sender=newsletterSender_();}catch(error){recordNewsletterBlock_(error,properties_().getProperty('OWNER_EMAIL'));throw error;}
      if(content.count)saveNewsletterEdition_(edition,id,row.correo,row.nombre,query,row.idioma,content.evidence,content.editorial);
      append_('NewsletterEnvios',[[id,row.id,row.correo,query.from,query.to,content.count?'Enviando':'Sin novedades',now.toISOString(),newsletterContentDetail_(content),JSON.stringify(keys)]]);
      remaining--;result.pending--;
      if(!content.count){result.empty++;continue;}
      for(const key of keys)known.add(key);quota--;
      try{completeNewsletterDelivery_(sheet,sheet.getLastRow(),sender,row.correo,content);result.accepted++;}
      catch(error){result.state='error';result.error=error.message;if(error.rejected)result.pending++;break;}
    }
    if(result.state!=='error'&&quota&&result.pending)ensureNewsletterContinuation_();
    return result;
  }finally{lock.releaseLock();}
}
function newsletterTick_(){for(const trigger of ScriptApp.getProjectTriggers())if(trigger.getHandlerFunction()==='newsletterTick_')ScriptApp.deleteTrigger(trigger);deliverNewsletters_();}
