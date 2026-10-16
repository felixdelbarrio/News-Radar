function newsletterQuotaReset_(deliveries,now=new Date()){
  const timestamps=deliveries.filter(row=>['Enviando','Enviada','Revisar'].includes(row.estado)).map(row=>Date.parse(row.fecha)).filter(value=>value>now.getTime()-86400000).sort((a,b)=>a-b),index=timestamps.length-settings_().newsletterDailyLimit;
  return index>=0?timestamps[index]+86400000:0;
}
function pauseNewsletterQuota_(error){
  if(error.quota||serviceQuotaPause_(error))properties_().setProperty('NEWSLETTER_QUOTA_UNTIL',String(Date.now()+(error.dailyQuota?86400000:serviceQuotaPause_(error)||settings_().pauseMinutes*60000)));
}
function newsletterDeliveryPlan_(now,deliveries){
  const periods=new Map(),attempts=new Map(),planned=[];
  for(const row of deliveries)if(!['Enviada','Sin novedades'].includes(attempts.get(row.id)?.estado))attempts.set(row.id,row);
  for(const subscription of subscriptionRows_().filter(row=>row.activa))for(const periodicity of Object.keys(newsletterCadences)){
    const row={...subscription,periodicidad:periodicity};
    if(!periods.has(periodicity))periods.set(periodicity,newsletterPeriod_(periodicity,now));
    const period=periods.get(periodicity);if(recordDay(now,settings_().timezone)<period.available||new Date(row.actualizada)>=new Date(period.cutoff))continue;
    const id=newsletterDeliveryId_(row,period);planned.push({row,id,attempt:attempts.get(id)});
  }
  return {periods,planned,due:planned.filter(item=>!item.attempt||['No enviado','Bloqueada'].includes(item.attempt.estado)).map(item=>({...item,query:subscriptionQuery_(item.row,now,true)}))};
}
function getNewsletterProgress(){
  authorize_(true);const cache=CacheService.getScriptCache(),cached=cache.get('newsletter-progress');if(cached)return JSON.parse(cached);
  const now=new Date(),p=properties_(),deliveries=rows_('NewsletterEnvios',undefined,8),{planned,due}=newsletterDeliveryPlan_(now,deliveries),completed=planned.filter(item=>['Enviada','Sin novedades'].includes(item.attempt?.estado)),review=planned.filter(item=>['Enviando','Revisar'].includes(item.attempt?.estado)).length,enabled=settings_().newsletterEnabled,queued=enabled&&Boolean(p.getProperty('NEWSLETTER_REQUEST')),pausedUntil=Number(p.getProperty('NEWSLETTER_NEXT')||0),running=Number(p.getProperty('NEWSLETTER_RUNNING_UNTIL')||0)>Date.now();
  const job={total:planned.length,processed:completed.length,pending:due.length,accepted:completed.filter(item=>item.attempt.estado==='Enviada').length,empty:completed.filter(item=>item.attempt.estado==='Sin novedades').length,review,pausedUntil,updated:planned.reduce((date,item)=>item.attempt?.fecha>date?item.attempt.fecha:date,''),error:p.getProperty('NEWSLETTER_LAST_ERROR')||'',state:running?'En curso':review?'En pausa':queued&&businessPipelinePending_()?'En cola':queued&&pausedUntil>Date.now()?'En pausa':due.length?queued?'En cola':'Pendiente':'Completada'};
  job.progress=jobProgressState_('newsletter',job,{queued,quotaUntil:Math.max(Number(p.getProperty('NEWSLETTER_QUOTA_UNTIL')||0),due.length?newsletterQuotaReset_(deliveries,now):0)});
  const result={enabled,queued,active:enabled&&(queued||running),job};cacheJson_('newsletter-progress',result,15);return result;
}
function requestNewsletterDelivery_(delay=0){properties_().setProperty('NEWSLETTER_REQUEST','true');properties_().setProperty('NEWSLETTER_NEXT',String(Date.now()+delay));ensureBackgroundWorker_(delay);}
function scheduledNewsletters_(){
  if(backgroundPaused_()){deferBackgroundWork_('newsletter');return;}
  if(dailyScheduleStatus_())requestDailyPipeline_();requestNewsletterDelivery_();
}
function newsletterReadyAt_(work){return properties_().getProperty('NEWSLETTER_REQUEST')&&settings_().newsletterEnabled&&!businessPipelinePending_(work)?Math.max(Date.now(),Number(properties_().getProperty('NEWSLETTER_NEXT')||0),Number(properties_().getProperty('NEWSLETTER_QUOTA_UNTIL')||0)):Infinity;}
function queueQuarterlyTaxonomy_(period){
  const p=properties_();if(!period||p.getProperty('TAXONOMY_PERIOD')===period.to)return;
  p.setProperty('TAXONOMY_PERIOD',period.to);
  if(p.getProperty('TAXONOMY_EVALUATED_CORPUS')===(p.getProperty('NEWS_CONTENT_REVISION')||'0')&&p.getProperty('TAXONOMY_APPLIED_RULES')===classificationRulesRevision_())return;
  p.setProperty('TAXONOMY_REQUEST',period.to);ensureBackgroundWorker_();
}
function deliverNewsletterBatch_(work,maxMs=BACKGROUND_WORK.sliceMs){
  const started=Date.now(),now=new Date(started),result={accepted:0,empty:0,duplicates:0,pending:0,state:'disabled'};
  if(backgroundPaused_()){deferBackgroundWork_('newsletter');return {...result,state:'configuration_pause'};}
  if(!settings_().newsletterEnabled){properties_().deleteProperty('NEWSLETTER_REQUEST');return result;}
  if(businessPipelinePending_(work)){ensureNewsletterContinuation_();return {...result,state:'collection_priority'};}
  const quotaPause=Number(properties_().getProperty('NEWSLETTER_QUOTA_UNTIL')||0);if(quotaPause>Date.now()){requestNewsletterDelivery_(quotaPause-Date.now());return {...result,state:'limit'};}
  try{
    properties_().deleteProperty('NEWSLETTER_LAST_ERROR');properties_().setProperty('JOB_LAST_EXECUTED:newsletter',new Date().toISOString());properties_().setProperty('NEWSLETTER_RUNNING_UNTIL',String(started+maxMs+BACKGROUND_WORK.activeGraceMs));CacheService.getScriptCache().remove('newsletter-progress');
    const deliveries=rows_('NewsletterEnvios'),{due,periods}=newsletterDeliveryPlan_(new Date(),deliveries);
    result.pending=due.length;result.state='no_due';const quarterlyDue=due.filter(item=>item.row.periodicidad==='quarterly').length;let quarterlyPending=quarterlyDue;
    const quarterly=periods.get('quarterly'),quarterlyBlocked=quarterly&&deliveries.some(row=>row.desde===quarterly.from&&row.hasta===quarterly.to&&['Enviando','Revisar'].includes(row.estado)),quarterlyFinished=quarterly&&!quarterlyBlocked&&deliveries.some(row=>row.desde===quarterly.from&&row.hasta===quarterly.to&&['Enviada','Sin novedades'].includes(row.estado));
    if(!due.length){properties_().deleteProperty('NEWSLETTER_REQUEST');if(quarterlyFinished)queueQuarterlyTaxonomy_(quarterly);return result;}
    let remaining=settings_().newsletterBatch,quota=newsletterBudget_(deliveries,now);
    if(!quota){requestNewsletterDelivery_(newsletterQuotaReset_(deliveries,now)-Date.now());return {...result,state:'limit'};}
    let sender;
    const history=newsletterSentContent_(deliveries),window={from:due.reduce((start,item)=>item.query.from<start?item.query.from:start,due[0].query.from),to:due.reduce((end,item)=>item.query.to>end?item.query.to:end,due[0].query.to)};
    const news=annotateNews_(rows_('Noticias',undefined,undefined,window).filter(row=>businessNews_(row)&&newsScope_(row,window,''))),prepared=new Map(),sheet=book_().getSheetByName('NewsletterEnvios');
    sheet.getRange(1,9,1,1).setValues([['contenido']]);
    result.state='processed';
    for(const {row,id,query} of due){
      if(!remaining||!quota||Date.now()-started>=maxMs)break;
      if(backgroundPaused_()){deferBackgroundWork_('newsletter');result.state='configuration_pause';break;}
      if(businessPipelinePending_(work)){result.state='collection_priority';break;}
      const selection=newsletterSelectionQuery_(query),key=JSON.stringify(selection);
      if(!prepared.has(key))prepared.set(key,selectAnnotatedNews_(news,selection));
      const email=newsletterEmail_(row.correo);if(!history.has(email))history.set(email,new Set());
      const known=history.get(email),selected=prepared.get(key),unseen=query.view==='briefing'?newsletterUnseen_(selected,known):selected,edition=Utilities.getUuid(),content=newsletterContent_(unseen,query,row.nombre,now,row.id,row.idioma,edition,known),keys=content.items.flatMap(newsletterItemKeys_);
      const skipped=selected.length-unseen.length;content.omitted=skipped;result.duplicates+=skipped;
      if(content.count&&!sender)try{sender=newsletterSender_();}catch(error){recordNewsletterBlock_(error,properties_().getProperty('OWNER_EMAIL'));throw error;}
      if(content.count)saveNewsletterEdition_(edition,id,row.correo,row.nombre,query,row.idioma,content.evidence,content.editorial);
      append_('NewsletterEnvios',[[id,row.id,row.correo,query.from,query.to,content.count?'Enviando':'Sin novedades',now.toISOString(),newsletterContentDetail_(content),JSON.stringify(keys)]]);
      remaining--;result.pending--;if(row.periodicidad==='quarterly')quarterlyPending--;
      if(!content.count){result.empty++;continue;}
      for(const key of keys)known.add(key);quota--;
      try{completeNewsletterDelivery_(sheet,sheet.getLastRow(),sender,row.correo,content);result.accepted++;}
      catch(error){pauseNewsletterQuota_(error);properties_().setProperty('NEWSLETTER_LAST_ERROR',String(error.message).slice(0,300));result.state='error';result.error=error.message;if(error.rejected){quota++;result.pending++;if(row.periodicidad==='quarterly')quarterlyPending++;}break;}
    }
    if(result.pending||result.state==='error')requestNewsletterDelivery_(quota?settings_().pauseMinutes*60000:86400000);else properties_().deleteProperty('NEWSLETTER_REQUEST');
    if(quarterly&&!quarterlyBlocked&&(quarterlyFinished||quarterlyDue>0)&&quarterlyPending===0&&result.state!=='error')queueQuarterlyTaxonomy_(quarterly);
    return result;
  }catch(error){pauseNewsletterQuota_(error);properties_().setProperty('NEWSLETTER_LAST_ERROR',String(error.message).slice(0,300));ensureNewsletterContinuation_();throw error;}
  finally{properties_().deleteProperty('NEWSLETTER_RUNNING_UNTIL');CacheService.getScriptCache().remove('newsletter-progress');}
}
