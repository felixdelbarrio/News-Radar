function serviceQuotaPause_(error){return /for one day|daily quota|quota exceeded|limit exceeded/i.test(String(error?.message||error))?86400000:0;}
function scheduledTriggers_(handler){return ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()===handler);}
function dailyScheduleStatus_(){
  const cache=CacheService.getScriptCache(),key='daily-schedule',cached=cache.get(key);
  if(cached!==null&&cached!==undefined)return cached==='true';
  const enabled=scheduledTriggers_('dailyRadar_').length>0;cache.put(key,String(enabled),300);return enabled;
}
function replaceDailySchedule_(handler,hour,minute=0){
  scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger(handler).timeBased().atHour(hour).nearMinute(minute).everyDays(1).inTimezone(settings_().timezone).create();
}
function collectionScheduleLabel_(){const config=settings_();return 'Banca digital: diaria · '+config.dailyHour+':00 · Project Finance: cada '+config.projectFinanceIntervalHours+' horas · desde '+config.projectFinanceHour+':00 · '+config.timezone;}
function replaceCollectionSchedule_(){
  const config=settings_();replaceDailySchedule_('dailyRadar_',config.dailyHour);
  scheduledTriggers_('projectFinanceRadar_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  for(let offset=0;offset<24;offset+=config.projectFinanceIntervalHours)ScriptApp.newTrigger('projectFinanceRadar_').timeBased().atHour((config.projectFinanceHour+offset)%24).nearMinute(0).everyDays(1).inTimezone(config.timezone).create();
  CacheService.getScriptCache().remove('daily-schedule');
}
function ensureBackgroundWorker_(delay=60000){
  const triggers=scheduledTriggers_('backgroundTick_'),next=Date.now()+Math.max(60000,delay);
  if(triggers.length===1&&Number(properties_().getProperty('BACKGROUND_NEXT'))<=next)return;
  triggers.forEach(trigger=>ScriptApp.deleteTrigger(trigger));ScriptApp.newTrigger('backgroundTick_').timeBased().after(Math.max(60000,delay)).create();properties_().setProperty('BACKGROUND_NEXT',String(next));
}
function translationReadyAt_(){
  const job=translationJob_(),request=properties_().getProperty('TRANSLATION_REQUEST'),today=recordDay(new Date(),settings_().timezone);
  if(!request&&(!job||job.state==='Completada'))return Infinity;
  const paused=Number(properties_().getProperty('TRANSLATION_PAUSED_UNTIL')||0);if(paused>Date.now())return paused;
  if(translationCallsToday_()>=TRANSLATION_WORK.dailyCalls)return Date.now()+86400000;
  if(request&&(!job||job.state==='Completada'||recordDay(job.started,settings_().timezone)<today))return Date.now();
  return job&&job.state!=='Completada'?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;
}
function collectionReadyAt_(work){
  const jobs=new Map(work.jobs.map(job=>[job.id,job])),represented=new Set();let next=Infinity;
  for(const task of work.tasks){
    if(!['Pendiente','Reintento programado'].includes(task.estado)||!jobs.has(task.ciclo))continue;
    represented.add(task.ciclo);const retry=task.estado==='Reintento programado'?Date.parse(task.actualizada)+settings_().retryMinutes*60000:0;
    next=Math.min(next,Math.max(Date.now(),Number(jobs.get(task.ciclo).pausa||0),Number(properties_().getProperty('FETCH_PAUSED_UNTIL')||0),retry));
  }
  for(const job of work.jobs)if(Number(job.pendientes)>0&&!represented.has(job.id))next=Math.min(next,Math.max(Date.now(),Number(job.pausa||0),Number(properties_().getProperty('FETCH_PAUSED_UNTIL')||0)));
  return next;
}
function backgroundTick_(){return processBackground_();}
function businessTranslationPending_(){return Boolean(properties_().getProperty('TRANSLATION_PRIORITY_REQUEST')||translationJob_()?.businessPending>0);}
function businessPipelinePending_(){return newsletterCollectionPriority_()||classificationReadyAt_()<=Date.now()||businessTranslationPending_()&&translationReadyAt_()<=Date.now()||taxonomyReadyAt_()<=Date.now();}
function backgroundTask_(work,daily){
  if(daily)return 'collection';
  if(classificationReadyAt_()<=Date.now())return 'classification';
  if(businessTranslationPending_()&&translationReadyAt_()<=Date.now())return 'translation';
  if(taxonomyReadyAt_()<=Date.now())return 'taxonomy';
  const available={collection:work.pending.length>0,translation:translationReadyAt_()<=Date.now(),taxonomyTranslation:!work.pending.length&&taxonomyTranslationReadyAt_()<=Date.now()},order=['collection','translation','taxonomyTranslation'],last=order.indexOf(properties_().getProperty('BACKGROUND_LAST'));
  for(let i=1;i<=order.length;i++){const task=order[(last+i)%order.length];if(available[task])return task;}return '';
}
function processBackground_(batchLimit=BACKGROUND_WORK.maxBatches){
  scheduledTriggers_('backgroundTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().deleteProperty('BACKGROUND_NEXT');
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){ensureBackgroundWorker_();return {added:0,errors:[],busy:true};}
  const started=Date.now(),errors=[];let work,known,completed=false,added=0;
  try{
    for(let batch=0;batch<batchLimit&&Date.now()-started<BACKGROUND_WORK.maxMs;batch++){
      drainCollectionRequests_();work=collectionWork_(Date.now());
      const daily=Boolean(work.pending.length&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.tipo==='daily'));
      if(!work.pending.length&&batch===0)collectionBatch_(work);
      if(!daily){drainClassificationRequest_();drainTaxonomyRequest_();}
      const task=backgroundTask_(work,daily);if(!task)break;
      const remaining=BACKGROUND_WORK.maxMs-(Date.now()-started);if(remaining<=0)break;
      if(task==='taxonomyTranslation')taxonomyTranslationBatch_(Math.min(TAXONOMY_POLICY.maxMs,remaining));
      else if(task==='taxonomy')taxonomyBatch_(Math.min(TAXONOMY_POLICY.maxMs,remaining));
      else if(task==='classification')newsClassificationBatch_(Math.min(CLASSIFICATION_WORK.maxMs,remaining));
      else if(task==='translation')translationBatch_(Math.min(TRANSLATION_WORK.maxMs,remaining));
      else{
        known=known||knownUrls_();const result=collectionBatch_({...work,known}),day=recordDay(new Date(),settings_().timezone);added+=result.added;errors.push(...result.errors);
        if(daily&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.estado==='Completada')&&properties_().getProperty('MAINTENANCE_DAY')!==day){maintenance_();properties_().setProperty('MAINTENANCE_DAY',day);}
      }
      properties_().setProperty('BACKGROUND_LAST',task);
    }
    completed=true;return {...collectionStatus_(null,work?.jobs),added,errors};
  }finally{
    try{
      const queued=collectionRequests_().length||(properties_().getProperty('CLASSIFICATION_REQUEST')&&!classificationPending_())||(properties_().getProperty('TAXONOMY_REQUEST')&&!taxonomyPending_()),next=queued||!completed?Date.now():Math.min(work?collectionReadyAt_(work):Date.now(),translationReadyAt_(),classificationReadyAt_(),taxonomyReadyAt_(),taxonomyTranslationReadyAt_());
      if(Number.isFinite(next))ensureBackgroundWorker_(next-Date.now());
    }finally{lock.releaseLock();}
  }
}
function initializeBackgroundSchedules_(){
  CacheService.getScriptCache().remove('daily-schedule');
  for(const handler of ['collectionTick_','collectionWake_','translationTick_','backgroundTick_'])scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  properties_().deleteProperty('BACKGROUND_NEXT');
  if(properties_().getProperty('DAILY_ENABLED')==='true')replaceCollectionSchedule_();else for(const handler of ['dailyRadar_','projectFinanceRadar_'])scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(properties_().getProperty('TRANSLATION_ENABLED')!=='false'){replaceDailySchedule_('nightlyTranslations_',TRANSLATION_WORK.hour);properties_().setProperty('TRANSLATION_ENABLED','true');}
  else scheduledTriggers_('nightlyTranslations_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  replaceDailySchedule_('dailyClassification_',settings_().dailyHour,CLASSIFICATION_WORK.dailyMinute);
  replaceDailySchedule_('dailyTaxonomy_',settings_().dailyHour,TAXONOMY_POLICY.dailyMinute);
  if(Number.isFinite(taxonomyTranslationReadyAt_())||taxonomyPending_()||properties_().getProperty('TAXONOMY_REQUEST')||classificationPending_()||properties_().getProperty('CLASSIFICATION_REQUEST')||collectionRequests_().length||collectionJobs_().some(job=>Number(job.pendientes)>0)||Number.isFinite(translationReadyAt_()))ensureBackgroundWorker_();
}
