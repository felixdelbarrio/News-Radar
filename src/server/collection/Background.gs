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
function collectionScheduleLabel_(){const config=settings_();return 'Banca digital: diaria · '+config.dailyHour+':00 · '+config.timezone;}
function replaceCollectionSchedule_(){replaceDailySchedule_('dailyRadar_',settings_().dailyHour);CacheService.getScriptCache().remove('daily-schedule');}
function ensureBackgroundWorker_(delay=60000){
  if(backgroundPaused_()){deferBackgroundWork_('background');return;}
  properties_().setProperty('BACKGROUND_PENDING','true');
  const triggers=scheduledTriggers_('backgroundTick_'),next=Date.now()+Math.max(60000,delay);
  if(triggers.length===1&&Number(properties_().getProperty('BACKGROUND_NEXT'))<=next)return;
  triggers.forEach(trigger=>ScriptApp.deleteTrigger(trigger));ScriptApp.newTrigger('backgroundTick_').timeBased().after(Math.max(60000,delay)).create();properties_().setProperty('BACKGROUND_NEXT',String(next));
}
function translationReadyAt_(){
  const job=translationJob_(),request=properties_().getProperty('TRANSLATION_REQUEST'),today=recordDay(new Date(),settings_().timezone);
  if(job?.state==='Publicando'||!request&&(!job||job.state==='Completada'))return Infinity;
  const paused=Number(properties_().getProperty('TRANSLATION_PAUSED_UNTIL')||0);if(paused>Date.now())return paused;
  if(translationCallsToday_()>=TRANSLATION_WORK.dailyCalls)return nextDailyReset(Date.now(),settings_().timezone);
  if(request&&(!job||job.state==='Completada'||recordDay(job.started,settings_().timezone)<today))return Date.now();
  return job&&job.state!=='Completada'?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;
}
function collectionReadyAt_(work){
  const jobs=new Map(work.jobs.map(job=>[job.id,job])),represented=new Set(),now=Date.now(),retryMs=settings_().retryMinutes*60000,fetchPausedUntil=Number(properties_().getProperty('FETCH_PAUSED_UNTIL')||0);let next=Infinity;
  for(const task of work.tasks){
    if(!['Pendiente','Reintento programado'].includes(task.estado)||!jobs.has(task.ciclo))continue;
    represented.add(task.ciclo);const retry=task.estado==='Reintento programado'?Date.parse(task.actualizada)+retryMs:0;
    next=Math.min(next,Math.max(now,Number(jobs.get(task.ciclo).pausa||0),fetchPausedUntil,retry));
  }
  for(const job of work.jobs)if(Number(job.pendientes)>0&&!represented.has(job.id))next=Math.min(next,Math.max(now,Number(job.pausa||0),fetchPausedUntil));
  return next;
}
function backgroundTick_(){return processBackground_();}
function businessTranslationPending_(){return Boolean(properties_().getProperty('TRANSLATION_PRIORITY_REQUEST')||translationJob_()?.businessPending>0);}
function requestDailyPipeline_(){
  if(backgroundPaused_()){deferBackgroundWork_('daily');return;}
  properties_().setProperty('DAILY_PIPELINE_REQUEST',recordDay(new Date(),settings_().timezone));ensureBackgroundWorker_();
}
function drainDailyPipeline_(){
  const p=properties_(),day=p.getProperty('DAILY_PIPELINE_REQUEST');if(!day)return;
  if(p.getProperty('DAILY_PIPELINE_DAY')!==day){
    queueScheduledCollection_('daily');p.setProperty('CLASSIFICATION_REQUEST',day);p.setProperty('DAILY_TRANSLATION_REQUEST',day);p.setProperty('DAILY_PIPELINE_DAY',day);
    if(newsletterEnabled_())requestNewsletterDelivery_();
  }
  if(p.getProperty('DAILY_PIPELINE_REQUEST')===day)p.deleteProperty('DAILY_PIPELINE_REQUEST');
}
function dailyCollectionPending_(work){return collectionRequests_().some(request=>request.kind==='daily')||(work?.jobs||collectionJobs_()).some(job=>job.tipo==='daily'&&(Number(job.pendientes)>0||job.estado==='Preparando'));}
function businessPipelinePending_(work){
  const p=properties_();return Boolean(snapshotJobsPending_()||p.getProperty('DAILY_PIPELINE_REQUEST')||dailyCollectionPending_(work)||p.getProperty('CLASSIFICATION_REQUEST')||classificationPending_()||p.getProperty('DAILY_TRANSLATION_REQUEST')||businessTranslationPending_());
}
function drainDailyTranslations_(work){
  const p=properties_(),day=p.getProperty('DAILY_TRANSLATION_REQUEST');
  if(!day||dailyCollectionPending_(work)||p.getProperty('CLASSIFICATION_REQUEST')||classificationPending_())return;
  if(p.getProperty('TRANSLATION_ENABLED')!=='false')requestTranslations_(true);
  if(p.getProperty('DAILY_TRANSLATION_REQUEST')===day)p.deleteProperty('DAILY_TRANSLATION_REQUEST');
}
function backgroundTask_(work,daily){
  if(daily)return 'collection';
  if(snapshotJobsPending_()||work.jobs?.some(job=>job.estado==='Publicando'))return 'snapshot';
  const blocked=dailyCollectionPending_(work)||properties_().getProperty('DAILY_PIPELINE_REQUEST');
  if(!blocked&&classificationReadyAt_()<=Date.now())return 'classification';
  if(!blocked&&!classificationPending_()&&dashboardSnapshotsDue_())return 'snapshot';
  if(!blocked&&!classificationPending_()&&!properties_().getProperty('CLASSIFICATION_REQUEST')){
    if(businessTranslationPending_()&&translationReadyAt_()<=Date.now())return 'translation';
    if(newsletterReadyAt_(work)<=Date.now())return 'newsletter';
    if(taxonomyReadyAt_()<=Date.now())return 'taxonomy';
    if(taxonomyTranslationReadyAt_()<=Date.now())return 'taxonomyTranslation';
  }
  const available={collection:work.pending.length>0,translation:!blocked&&!classificationPending_()&&translationReadyAt_()<=Date.now(),maintenance:!blocked&&!classificationPending_()&&maintenanceReadyAt_()<=Date.now()},order=['collection','translation','maintenance'],last=order.indexOf(properties_().getProperty('BACKGROUND_LAST'));
  for(let i=1;i<=order.length;i++){const task=order[(last+i)%order.length];if(available[task])return task;}return '';
}
function processBackground_(batchLimit=BACKGROUND_WORK.maxBatches){
  if(backgroundPaused_()){deferBackgroundWork_('background');return {added:0,errors:[],paused:true};}
  scheduledTriggers_('backgroundTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().deleteProperty('BACKGROUND_NEXT');
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){ensureBackgroundWorker_();return {added:0,errors:[],busy:true};}
  const started=Date.now(),runId=Utilities.getUuid(),errors=[];let work,known,knownRevision,completed=false,added=0,acquired=true;
  try{
    for(let batch=0;batch<batchLimit&&Date.now()-started<BACKGROUND_WORK.maxMs;batch++){
      if(backgroundPaused_()){deferBackgroundWork_('background');break;}
      if(batch){lock.releaseLock();acquired=false;if(backgroundPaused_()){deferBackgroundWork_('background');break;}if(!lock.tryLock(1000))break;acquired=true;dataGenerationMemory_=undefined;if(backgroundPaused_()){deferBackgroundWork_('background');break;}if(String(properties_().getProperty('CONFIG_REVISION')||'0')!==configurationVersionMemory_){configurationMemory_=undefined;configurationVersionMemory_=undefined;}}
      drainDailyPipeline_();drainCollectionRequests_();drainMaintenanceRequest_();work=collectionWork_(Date.now());
      const daily=Boolean(work.pending.length&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.tipo==='daily'));
      if(!work.pending.length&&batch===0)collectionBatch_(work);
      if(!daily&&!dailyCollectionPending_(work)){drainClassificationRequest_();drainDailyTranslations_(work);drainTaxonomyRequest_();}
      const collectionJob=work.pending[0]?.ciclo,task=backgroundTask_(work,daily);if(!task){if(dashboardSnapshotsReady_(work))dashboardSnapshotBatch_();break;}
      const remaining=Math.min(BACKGROUND_WORK.sliceMs,BACKGROUND_WORK.maxMs-(Date.now()-started));if(remaining<=0)break;
      progressContextMemory_=undefined;properties_().setProperty('BACKGROUND_RUN_ID',runId);const stage=task==='collection'?daily?'daily':'annual':task;properties_().setProperty('BACKGROUND_ACTIVE',stage);properties_().setProperty('BACKGROUND_ACTIVE_UNTIL',String(Date.now()+BACKGROUND_WORK.maxMs+BACKGROUND_WORK.activeGraceMs));properties_().setProperty('JOB_LAST_EXECUTED:'+stage,new Date().toISOString());
      if(task==='snapshot')dashboardSnapshotBatch_();
      else if(task==='maintenance')maintenanceBatch_(Math.min(MAINTENANCE_POLICY.maxMs,remaining));
      else if(task==='newsletter')deliverNewsletterBatch_(work,remaining);
      else if(task==='taxonomyTranslation')taxonomyTranslationBatch_(Math.min(TAXONOMY_POLICY.maxMs,remaining));
      else if(task==='taxonomy')taxonomyBatch_(Math.min(TAXONOMY_POLICY.maxMs,remaining));
      else if(task==='classification')newsClassificationBatch_(Math.min(CLASSIFICATION_WORK.maxMs,remaining));
      else if(task==='translation'){translationBatch_(Math.min(TRANSLATION_WORK.maxMs,remaining));known=undefined;}
      else{
        const revision=properties_().getProperty('NEWS_REVISION');if(!known||knownRevision!==revision)known=knownUrls_();const result=collectionBatch_({...work,known}),day=recordDay(new Date(),settings_().timezone);added+=result.added;errors.push(...result.errors);
        if(daily&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.estado==='Completada')&&properties_().getProperty('MAINTENANCE_DAY')!==day){maintenance_();properties_().setProperty('MAINTENANCE_DAY',day);}
      }
      if(task!=='snapshot'&&backgroundStageComplete_(task,work,collectionJob))requestDashboardSnapshots_(true);
      knownRevision=properties_().getProperty('NEWS_REVISION');properties_().setProperty('BACKGROUND_LAST',task);
    }
    completed=true;return {...collectionStatus_(null,work?.jobs),added,errors};
  }finally{
    try{
      const queued=backgroundQueued_(work),next=queued||!completed||dashboardSnapshotsReady_(work)?Date.now():Math.min(work?collectionReadyAt_(work):Date.now(),translationReadyAt_(),classificationReadyAt_(),taxonomyReadyAt_(),taxonomyTranslationReadyAt_(),newsletterReadyAt_(work),maintenanceReadyAt_());
      if(Number.isFinite(next))ensureBackgroundWorker_(next-Date.now());else properties_().deleteProperty('BACKGROUND_PENDING');
    }finally{if(acquired){if(properties_().getProperty('BACKGROUND_RUN_ID')===runId){properties_().deleteProperty('BACKGROUND_RUN_ID');properties_().deleteProperty('BACKGROUND_ACTIVE');properties_().deleteProperty('BACKGROUND_ACTIVE_UNTIL');}lock.releaseLock();}}
  }
}
function initializeBackgroundSchedules_(){
  const p=properties_();
  CacheService.getScriptCache().remove('daily-schedule');
  for(const handler of ['collectionTick_','collectionWake_','translationTick_','backgroundTick_','nightlyTranslations_','dailyClassification_','dailyTaxonomy_','newsletterTick_','deliverNewsletters_'])scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  p.deleteProperty('BACKGROUND_NEXT');
  if(!scheduledTriggers_('backgroundWatchdog_').length)ScriptApp.newTrigger('backgroundWatchdog_').timeBased().everyMinutes(BACKGROUND_WORK.watchdogMinutes).create();
  if(p.getProperty('DAILY_ENABLED')==='true')replaceCollectionSchedule_();else scheduledTriggers_('dailyRadar_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(p.getProperty('TRANSLATION_ENABLED')!=='false')p.setProperty('TRANSLATION_ENABLED','true');
  if(settings_().newsletterEnabled)replaceDailySchedule_('scheduledNewsletters_',settings_().dailyHour);else scheduledTriggers_('scheduledNewsletters_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(dashboardSnapshotsPending_()||Number.isFinite(taxonomyTranslationReadyAt_())||taxonomyPending_()||p.getProperty('TAXONOMY_REQUEST')||p.getProperty('TAXONOMY_QUARTER_REQUEST')||classificationPending_()||p.getProperty('CLASSIFICATION_REQUEST')||collectionRequests_().length||collectionJobs_().some(job=>Number(job.pendientes)>0)||Number.isFinite(translationReadyAt_())||Number.isFinite(newsletterReadyAt_()))ensureBackgroundWorker_();
}
function updateOperationalSchedule(){authorize_(true);return withForegroundWrite_(()=>{initializeBackgroundSchedules_();return 'Prioridades y programación actualizadas.';});}

function backgroundWatchdog_(){
  const p=properties_(),values=p.getProperties();if(backgroundPaused_())return;
  if(Object.entries(values).some(([key,value])=>key.startsWith('WORK_PENDING:')&&value==='true')){workWake_();return;}
  if(!dashboardSnapshotsPending_()&&!values.BACKGROUND_PENDING&&!['MAINTENANCE_REQUEST','DAILY_PIPELINE_REQUEST','CLASSIFICATION_REQUEST','DAILY_TRANSLATION_REQUEST','TRANSLATION_REQUEST','TAXONOMY_REQUEST','TAXONOMY_QUARTER_REQUEST','TAXONOMY_TRANSLATION_REQUEST'].some(key=>values[key])&&!(values.NEWSLETTER_REQUEST&&settings_().newsletterEnabled)&&!Number.isFinite(maintenanceReadyAt_()))return;
  if(scheduledTriggers_('backgroundTick_').length&&Number(p.getProperty('BACKGROUND_NEXT'))>Date.now()-BACKGROUND_WORK.maxMs*2)return;
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try{
    const now=Date.now(),fetchPause=Number(p.getProperty('FETCH_PAUSED_UNTIL')||0),jobs=collectionJobs_(),collection=jobs.filter(job=>Number(job.pendientes)>0||job.estado==='Preparando').map(job=>Math.max(now,fetchPause,Number(job.pausa||0))),queued=backgroundQueued_({jobs});
    const next=queued||dashboardSnapshotsReady_({jobs})?now:Math.min(...collection,classificationReadyAt_(),translationReadyAt_(),taxonomyReadyAt_(),taxonomyTranslationReadyAt_(),newsletterReadyAt_({jobs}),maintenanceReadyAt_());
    if(Number.isFinite(next)){p.deleteProperty('BACKGROUND_NEXT');ensureBackgroundWorker_(next-now);}else p.deleteProperty('BACKGROUND_PENDING');
  }finally{lock.releaseLock();}
}

function backgroundQueued_(work){
  const p=properties_();return Boolean(p.getProperty('MAINTENANCE_REQUEST')||p.getProperty('DAILY_PIPELINE_REQUEST')||collectionRequests_().length||!dailyCollectionPending_(work)&&!classificationPending_()&&(p.getProperty('CLASSIFICATION_REQUEST')||p.getProperty('DAILY_TRANSLATION_REQUEST'))||!businessPipelinePending_(work)&&(p.getProperty('TAXONOMY_REQUEST')&&!taxonomyPending_()||p.getProperty('TAXONOMY_QUARTER_REQUEST')&&(!taxonomyPending_()||taxonomyJob_().request!==p.getProperty('TAXONOMY_QUARTER_REQUEST'))));
}

function backgroundStageComplete_(task,work,collectionJob){
  if(task==='collection'&&collectionJob)return work.jobs.some(job=>job.id===collectionJob&&Number(job.pendientes)===0&&job.estado!=='Preparando');
  if(task==='collection')return !work.jobs.some(job=>Number(job.pendientes)>0||job.estado==='Preparando');
  const job={classification:classificationJob_,translation:translationJob_,taxonomy:taxonomyJob_,taxonomyTranslation:taxonomyTranslationJob_,maintenance:maintenanceJob_}[task];
  return task==='newsletter'||Boolean(job&&job()?.state==='Completada');
}
