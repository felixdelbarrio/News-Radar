function scheduledTriggers_(handler){return ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()===handler);}
function replaceDailySchedule_(handler,hour){
  scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger(handler).timeBased().atHour(hour).nearMinute(0).everyDays(1).inTimezone(settings_().timezone).create();
}
function ensureBackgroundWorker_(delay=60000){
  const triggers=scheduledTriggers_('backgroundTick_'),next=Date.now()+Math.max(60000,delay);
  if(triggers.length===1&&Number(properties_().getProperty('BACKGROUND_NEXT'))<=next)return;
  triggers.forEach(trigger=>ScriptApp.deleteTrigger(trigger));ScriptApp.newTrigger('backgroundTick_').timeBased().after(Math.max(60000,delay)).create();properties_().setProperty('BACKGROUND_NEXT',String(next));
}
function translationReadyAt_(){
  const job=translationJob_(),request=properties_().getProperty('TRANSLATION_REQUEST'),today=recordDay(new Date(),settings_().timezone);
  if(job?.callDay===today&&job.calls>=TRANSLATION_WORK.dailyCalls)return Infinity;
  if(request&&(!job||job.state==='Completada'||recordDay(job.started,settings_().timezone)<today))return Date.now();
  return job&&job.state!=='Completada'?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;
}
function collectionReadyAt_(work){
  const jobs=new Map(work.jobs.map(job=>[job.id,job])),represented=new Set();let next=Infinity;
  for(const task of work.tasks){
    if(!['Pendiente','Reintento programado'].includes(task.estado)||!jobs.has(task.ciclo))continue;
    represented.add(task.ciclo);const retry=task.estado==='Reintento programado'?Date.parse(task.actualizada)+settings_().retryMinutes*60000:0;
    next=Math.min(next,Math.max(Date.now(),Number(jobs.get(task.ciclo).pausa||0),retry));
  }
  for(const job of work.jobs)if(Number(job.pendientes)>0&&!represented.has(job.id))next=Math.min(next,Math.max(Date.now(),Number(job.pausa||0)));
  return next;
}
function backgroundTick_(){
  scheduledTriggers_('backgroundTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().deleteProperty('BACKGROUND_NEXT');
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){ensureBackgroundWorker_();return {added:0,errors:[],busy:true};}
  let work,completed=false;
  try{
    drainCollectionRequests_();work=collectionWork_(Date.now());
    const daily=work.pending.length&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.tipo==='daily'),translation=translationReadyAt_()<=Date.now();
    if(!daily&&translation&&(!work.pending.length||properties_().getProperty('BACKGROUND_LAST')==='collection')){
      translationBatch_();completed=true;properties_().setProperty('BACKGROUND_LAST','translation');return {...collectionStatus_(),added:0,errors:[]};
    }
    const result=collectionBatch_(work),day=recordDay(new Date(),settings_().timezone);
    if(daily&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.estado==='Completada')&&properties_().getProperty('MAINTENANCE_DAY')!==day){maintenance_();properties_().setProperty('MAINTENANCE_DAY',day);}
    completed=true;if(work.pending.length)properties_().setProperty('BACKGROUND_LAST','collection');return result;
  }finally{
    try{
      const queued=collectionRequests_().length,next=queued||!completed?Date.now():Math.min(work?collectionReadyAt_(work):Date.now(),translationReadyAt_());
      if(Number.isFinite(next))ensureBackgroundWorker_(next-Date.now());
    }finally{lock.releaseLock();}
  }
}
function initializeBackgroundSchedules_(){
  for(const handler of ['collectionTick_','collectionWake_','translationTick_','backgroundTick_'])scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  properties_().deleteProperty('BACKGROUND_NEXT');
  if(properties_().getProperty('DAILY_ENABLED')==='true')replaceDailySchedule_('dailyRadar_',settings_().dailyHour);else scheduledTriggers_('dailyRadar_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(properties_().getProperty('TRANSLATION_ENABLED')!=='false'){replaceDailySchedule_('nightlyTranslations_',TRANSLATION_WORK.hour);properties_().setProperty('TRANSLATION_ENABLED','true');}
  else scheduledTriggers_('nightlyTranslations_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(collectionRequests_().length||collectionJobs_().some(job=>Number(job.pendientes)>0)||Number.isFinite(translationReadyAt_()))ensureBackgroundWorker_();
}
