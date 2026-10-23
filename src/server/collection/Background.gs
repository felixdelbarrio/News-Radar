function serviceQuotaPause_(error){return /for one day|daily quota|quota exceeded|limit exceeded/i.test(String(error?.message||error))?86400000:0;}
function scheduledTriggers_(handler){return ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()===handler);}
function dailyScheduleStatus_(){
  const cache=CacheService.getScriptCache(),key='daily-schedule',cached=cache.get(key);
  if(cached!==null&&cached!==undefined)return cached==='true';
  const enabled=scheduledTriggers_('dailyRadar_').length>0;cache.put(key,String(enabled),300);return enabled;
}
const MADRID_COLLECTIONS=Object.freeze([{handler:'afternoonRadar_',slot:'afternoon',hour:13,timezone:'Europe/Madrid'},{handler:'eveningRadar_',slot:'evening',hour:21,timezone:'Europe/Madrid'}].map(Object.freeze));
function collectionPipelineSlots_(){return ['daily',...MADRID_COLLECTIONS.map(job=>job.slot)];}
function collectionPipelineKey_(slot,suffix){return slot==='daily'?'DAILY_PIPELINE_'+suffix:'COLLECTION_'+slot.toUpperCase()+'_'+suffix;}
function collectionHandlers_(){return ['dailyRadar_',...MADRID_COLLECTIONS.map(job=>job.handler)];}
function replaceDailySchedule_(handler,hour,minute=0,timezone=settings_().timezone){
  scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger(handler).timeBased().atHour(hour).nearMinute(minute).everyDays(1).inTimezone(timezone).create();
}
function collectionScheduleLabel_(){const config=settings_();return 'Banca digital: diaria · '+config.dailyHour+':00 · '+config.timezone+MADRID_COLLECTIONS.map(job=>' · '+String(job.hour).padStart(2,'0')+':00 · '+job.timezone).join('');}
function replaceCollectionSchedule_(){
  replaceDailySchedule_('dailyRadar_',settings_().dailyHour);
  for(const job of MADRID_COLLECTIONS){scheduledTriggers_(job.handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));if(settings_().dailyHour!==job.hour||settings_().timezone!==job.timezone)replaceDailySchedule_(job.handler,job.hour,0,job.timezone);}
  CacheService.getScriptCache().remove('daily-schedule');
}
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
function requestDailyPipeline_(slot='daily'){
  if(!collectionPipelineSlots_().includes(slot))throw Error('Franja de recopilación no válida.');
  if(backgroundPaused_()){deferBackgroundWork_(slot);return;}
  const timezone=slot==='daily'?settings_().timezone:'Europe/Madrid';
  properties_().setProperty(collectionPipelineKey_(slot,'REQUEST'),recordDay(new Date(),timezone));ensureBackgroundWorker_();
}
function dailyPipelineRequested_(){const p=properties_();return collectionPipelineSlots_().some(slot=>p.getProperty(collectionPipelineKey_(slot,'REQUEST')));}
function drainDailyPipeline_(){
  const p=properties_();
  for(const slot of collectionPipelineSlots_()){
    const request=collectionPipelineKey_(slot,'REQUEST'),completed=collectionPipelineKey_(slot,'DAY'),day=p.getProperty(request);if(!day)continue;
    if(p.getProperty(completed)!==day){
      if(slot!=='daily'&&dailyCollectionPending_())continue;
      queueScheduledCollection_('daily');p.setProperty('CLASSIFICATION_REQUEST',day);p.setProperty('DAILY_TRANSLATION_REQUEST',day);p.setProperty(completed,day);p.setProperty('CATALOG_SYNC_REQUEST',day);
      if(newsletterEnabled_())requestNewsletterDelivery_();
    }
    if(p.getProperty(request)===day)p.deleteProperty(request);
  }
}
function dailyCollectionPending_(work){return collectionRequests_().some(request=>request.kind==='daily')||(work?.jobs||collectionJobs_()).some(job=>job.tipo==='daily'&&(Number(job.pendientes)>0||job.estado==='Preparando'));}
function businessPipelinePending_(work){
  const p=properties_();return Boolean(snapshotJobsPending_()||dailyPipelineRequested_()||dailyCollectionPending_(work)||p.getProperty('CLASSIFICATION_REQUEST')||classificationPending_()||p.getProperty('DAILY_TRANSLATION_REQUEST')||businessTranslationPending_());
}
function drainDailyTranslations_(work){
  const p=properties_(),day=p.getProperty('DAILY_TRANSLATION_REQUEST');
  if(!day||dailyCollectionPending_(work)||p.getProperty('CLASSIFICATION_REQUEST')||classificationPending_())return;
  if(p.getProperty('TRANSLATION_ENABLED')!=='false')requestTranslations_(true);
  if(p.getProperty('DAILY_TRANSLATION_REQUEST')===day)p.deleteProperty('DAILY_TRANSLATION_REQUEST');
}
function snapshotPublicationPending_(work,includeDue=true){return snapshotJobsPending_()||(work?.jobs||collectionJobs_()).some(job=>job.estado==='Publicando')||Boolean(properties_().getProperty('DASHBOARD_SNAPSHOT_BUILD'))||includeDue&&dashboardSnapshotsDue_();}
function backgroundTask_(work,daily){
  if(daily)return 'collection';
  const blocked=dailyCollectionPending_(work)||dailyPipelineRequested_();
  if(!blocked&&classificationReadyAt_()<=Date.now())return 'classification';
  if(!blocked&&!taxonomyPublicationReady_()&&snapshotPublicationPending_(work)&&taxonomyReadyAt_()<=Date.now()&&(!classificationPending_()||classificationJob_()?.state==='Publicando'))return 'taxonomy';
  if(!blocked&&taxonomyPublicationReady_()&&(!classificationPending_()||snapshotJobsPending_())&&snapshotPublicationPending_(work))return 'snapshot';
  if(!blocked&&!classificationPending_()&&!properties_().getProperty('CLASSIFICATION_REQUEST')){
    if(newsletterReadyAt_(work)<=Date.now())return 'newsletter';
    if(translationReadyAt_()<=Date.now())return 'translation';
    if(properties_().getProperty('CATALOG_SYNC_REQUEST'))return 'catalogSync';
    if(taxonomyReadyAt_()<=Date.now())return 'taxonomy';
    if(taxonomyTranslationReadyAt_()<=Date.now())return 'taxonomyTranslation';
    if(logArchiveReadyAt_()<=Date.now()&&!work.pending.length)return 'archive';
    if(maintenanceReadyAt_()<=Date.now())return 'maintenance';
  }
  return work.pending.length?'collection':'';
}
// Wake only for runnable work; lower queues cannot poll while their prerequisites are paused.
function backgroundNextAt_(work,completed=true){
  const now=Date.now(),p=properties_();if(!work||!completed||backgroundQueued_(work))return now;
  const collection=work.tasks?collectionReadyAt_(work):Math.min(...(work.jobs||[]).filter(job=>Number(job.pendientes)>0||job.estado==='Preparando').map(job=>Math.max(now,Number(p.getProperty('FETCH_PAUSED_UNTIL')||0),Number(job.pausa||0))));
  if(dailyCollectionPending_(work)||dailyPipelineRequested_())return collection;
  if(classificationJob_()?.state==='Publicando'&&!taxonomyPublicationReady_())return Math.min(collection,taxonomyReadyAt_());
  if(classificationPending_())return snapshotJobsPending_()?now:Math.min(collection,classificationReadyAt_());
  if(dashboardSnapshotsReady_(work))return now;
  return Math.min(logArchiveReadyAt_(),collection,translationReadyAt_(),taxonomyReadyAt_(),taxonomyTranslationReadyAt_(),newsletterReadyAt_(work),maintenanceReadyAt_());
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
      else if(task==='archive')operationalArchiveBatch_();
      else if(task==='maintenance')maintenanceBatch_(Math.min(MAINTENANCE_POLICY.maxMs,remaining));
      else if(task==='newsletter')deliverNewsletterBatch_(work,remaining);
      else if(task==='catalogSync'){const synced=refreshFunctionalCatalog_();if(synced.changed&&!taxonomyPending_())requestTaxonomy_('catalog-change');properties_().deleteProperty('CATALOG_SYNC_REQUEST');}
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
      const next=backgroundNextAt_(work,completed);
      if(Number.isFinite(next))ensureBackgroundWorker_(next-Date.now());else properties_().deleteProperty('BACKGROUND_PENDING');
    }finally{if(acquired){if(properties_().getProperty('BACKGROUND_RUN_ID')===runId){properties_().deleteProperty('BACKGROUND_RUN_ID');properties_().deleteProperty('BACKGROUND_ACTIVE');properties_().deleteProperty('BACKGROUND_ACTIVE_UNTIL');}lock.releaseLock();}}
  }
}
function initializeBackgroundSchedules_(){
  const p=properties_();
  cancelAnnualRecovery_();
  scheduledTriggers_('additionalRadar_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  for(const key of ['ADDITIONAL_COLLECTION_REQUEST','ADDITIONAL_COLLECTION_DAY','WORK_PENDING:additional'])p.deleteProperty(key);
  CacheService.getScriptCache().remove('daily-schedule');
  for(const handler of ['collectionTick_','collectionWake_','translationTick_','backgroundTick_','nightlyTranslations_','dailyClassification_','dailyTaxonomy_','newsletterTick_','deliverNewsletters_'])scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  p.deleteProperty('BACKGROUND_NEXT');
  if(scheduledTriggers_('backgroundWatchdog_').length!==1){scheduledTriggers_('backgroundWatchdog_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));ScriptApp.newTrigger('backgroundWatchdog_').timeBased().everyMinutes(BACKGROUND_WORK.watchdogMinutes).create();}
  if(p.getProperty('DAILY_ENABLED')==='true')replaceCollectionSchedule_();else for(const handler of collectionHandlers_())scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(p.getProperty('TRANSLATION_ENABLED')!=='false')p.setProperty('TRANSLATION_ENABLED','true');
  if(settings_().newsletterEnabled)replaceDailySchedule_('scheduledNewsletters_',settings_().dailyHour);else scheduledTriggers_('scheduledNewsletters_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(dashboardSnapshotsPending_()||Number.isFinite(taxonomyTranslationReadyAt_())||taxonomyPending_()||p.getProperty('TAXONOMY_REQUEST')||p.getProperty('CATALOG_SYNC_REQUEST')||classificationPending_()||p.getProperty('CLASSIFICATION_REQUEST')||collectionRequests_().length||collectionJobs_().some(job=>Number(job.pendientes)>0)||Number.isFinite(translationReadyAt_())||Number.isFinite(newsletterReadyAt_()))ensureBackgroundWorker_();
}
function updateOperationalSchedule(){authorize_(true);return withForegroundWrite_(()=>{initializeBackgroundSchedules_();return 'Prioridades y programación actualizadas.';});}

function backgroundWatchdog_(){
  const p=properties_(),values=p.getProperties();if(backgroundPaused_())return;
  if(Object.entries(values).some(([key,value])=>key.startsWith('WORK_PENDING:')&&value==='true')){workWake_();return;}
  if(!dashboardSnapshotsPending_()&&!values.BACKGROUND_PENDING&&!dailyPipelineRequested_()&&!['LOG_ARCHIVE_PENDING','MAINTENANCE_REQUEST','CLASSIFICATION_REQUEST','DAILY_TRANSLATION_REQUEST','TRANSLATION_REQUEST','TAXONOMY_REQUEST','CATALOG_SYNC_REQUEST','TAXONOMY_TRANSLATION_REQUEST'].some(key=>values[key])&&!(values.NEWSLETTER_REQUEST&&settings_().newsletterEnabled)&&!Number.isFinite(maintenanceReadyAt_()))return;
  if(scheduledTriggers_('backgroundTick_').length&&Number(p.getProperty('BACKGROUND_NEXT'))>Date.now()-BACKGROUND_WORK.maxMs*2)return;
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try{
    const now=Date.now(),jobs=collectionJobs_(),next=backgroundNextAt_({jobs});
    if(Number.isFinite(next)){p.deleteProperty('BACKGROUND_NEXT');ensureBackgroundWorker_(next-now);}else p.deleteProperty('BACKGROUND_PENDING');
  }finally{lock.releaseLock();}
}

function backgroundQueued_(work){
  const p=properties_();return Boolean(p.getProperty('MAINTENANCE_REQUEST')||dailyPipelineRequested_()||collectionRequests_().length||!dailyCollectionPending_(work)&&!classificationPending_()&&(p.getProperty('CLASSIFICATION_REQUEST')||p.getProperty('DAILY_TRANSLATION_REQUEST')||p.getProperty('CATALOG_SYNC_REQUEST'))||!businessPipelinePending_(work)&&(p.getProperty('TAXONOMY_REQUEST')&&!taxonomyPending_()));
}

function backgroundStageComplete_(task,work,collectionJob){
  if(task==='collection'&&collectionJob)return work.jobs.some(job=>job.id===collectionJob&&Number(job.pendientes)===0&&job.estado!=='Preparando');
  if(task==='collection')return !work.jobs.some(job=>Number(job.pendientes)>0||job.estado==='Preparando');
  const job={classification:classificationJob_,translation:translationJob_,taxonomy:taxonomyJob_,taxonomyTranslation:taxonomyTranslationJob_,maintenance:maintenanceJob_}[task];
  return task==='newsletter'||Boolean(job&&job()?.state==='Completada');
}

function getOperationalSchedule(){
 authorize_(true);const config=settings_(),enabled=properties_().getProperty('DAILY_ENABLED')==='true';
 const jobs=[{label:'Recopilación principal',handler:'dailyRadar_',hour:config.dailyHour,timezone:config.timezone,expected:enabled?1:0},...MADRID_COLLECTIONS.map(job=>({label:'Recopilación diaria',...job,expected:enabled&&(config.dailyHour!==job.hour||config.timezone!==job.timezone)?1:0})),{label:'Entrega de newsletters',handler:'scheduledNewsletters_',hour:config.dailyHour,timezone:config.timezone,expected:config.newsletterEnabled?1:0},{label:'Supervisión de colas',handler:'backgroundWatchdog_',minutes:BACKGROUND_WORK.watchdogMinutes,expected:1}];
 const counts=new Map();for(const trigger of ScriptApp.getProjectTriggers()){const handler=trigger.getHandlerFunction();counts.set(handler,(counts.get(handler)||0)+1);}
 for(const job of jobs){job.installed=counts.get(job.handler)||0;job.valid=job.installed===job.expected;}
 return {jobs,valid:jobs.every(job=>job.valid),archive:{attempts:Number(properties_().getProperty('LOG_ARCHIVE_ATTEMPTS')||0),error:properties_().getProperty('LOG_ARCHIVE_ERROR')||'',next:Number(properties_().getProperty('LOG_ARCHIVE_NEXT')||0)},workerTriggers:counts.get('backgroundTick_')||0,queued:dailyPipelineRequested_()||Boolean(properties_().getProperty('BACKGROUND_PENDING'))};
}
