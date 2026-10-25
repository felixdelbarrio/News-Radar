function serviceQuotaPause_(error){return /for one day|daily quota|quota exceeded|limit exceeded/i.test(String(error?.message||error))?86400000:0;}
function scheduledTriggers_(handler){return ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()===handler);}
let operationalTriggersMemory_;
function dailyScheduleStatus_(){
  const cache=CacheService.getScriptCache(),key='daily-schedule',cached=cache.get(key);
  if(cached!==null&&cached!==undefined)return cached==='true';
  const enabled=(operationalTriggersMemory_||ScriptApp.getProjectTriggers()).some(trigger=>collectionHandlers_().includes(trigger.getHandlerFunction()));cache.put(key,String(enabled),300);return enabled;
}
const COLLECTION_SLOTS=Object.freeze([{handler:'dailyRadar_',slot:'daily',prefix:'daily',enabled:'morningEnabled'},{handler:'afternoonRadar_',slot:'afternoon',prefix:'afternoon',enabled:'afternoonEnabled'},{handler:'eveningRadar_',slot:'evening',prefix:'evening',enabled:'eveningEnabled'}].map(Object.freeze));
function collectionSchedules_(){const config=settings_();return COLLECTION_SLOTS.map(job=>({...job,hour:config[job.prefix+'Hour'],minute:config[job.prefix+'Minute'],enabled:config[job.enabled],timezone:config.timezone}));}
function collectionPipelineSlots_(){return COLLECTION_SLOTS.map(job=>job.slot);}
function collectionPipelineKey_(slot,suffix){return slot==='daily'?'DAILY_PIPELINE_'+suffix:'COLLECTION_'+slot.toUpperCase()+'_'+suffix;}
function collectionHandlers_(){return COLLECTION_SLOTS.map(job=>job.handler);}
function replaceDailySchedule_(handler,hour,minute=0,timezone=settings_().timezone){
  CacheService.getScriptCache().remove('operational-trigger-counts');
  scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger(handler).timeBased().atHour(hour).nearMinute(minute).everyDays(1).inTimezone(timezone).create();
}
function scheduleTime_(job){return String(job.hour).padStart(2,'0')+':'+String(job.minute||0).padStart(2,'0');}
function collectionScheduleLabel_(){return 'Banca digital: '+collectionSchedules_().filter(job=>job.enabled).map(scheduleTime_).join(' · ')+' · '+settings_().timezone;}
function replaceCollectionSchedule_(){
  CacheService.getScriptCache().remove('operational-trigger-counts');
  const installed=new Set();
  for(const job of collectionSchedules_()){
    scheduledTriggers_(job.handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
    const key=scheduleTime_(job)+'|'+job.timezone;
    if(job.enabled&&!installed.has(key)){replaceDailySchedule_(job.handler,job.hour,job.minute,job.timezone);installed.add(key);}
  }
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
  const timezone=settings_().timezone;
  properties_().setProperty(collectionPipelineKey_(slot,'REQUEST'),recordDay(new Date(),timezone));ensureBackgroundWorker_();
}
function dailyPipelineRequested_(){const p=properties_();return collectionPipelineSlots_().some(slot=>p.getProperty(collectionPipelineKey_(slot,'REQUEST')));}
function drainDailyPipeline_(){
  const p=properties_();
  for(const slot of collectionPipelineSlots_()){
    const request=collectionPipelineKey_(slot,'REQUEST'),completed=collectionPipelineKey_(slot,'DAY'),day=p.getProperty(request);if(!day)continue;
    if(p.getProperty(completed)!==day){
      if(dailyCollectionPending_())continue;
      const id=queueScheduledCollection_('daily');if(id)p.setProperty(collectionPipelineKey_(slot,'JOB'),id);p.setProperty('CLASSIFICATION_REQUEST',day);p.setProperty('DAILY_TRANSLATION_REQUEST',day);p.setProperty(completed,day);
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
  requestTranslations_(true);
  if(p.getProperty('DAILY_TRANSLATION_REQUEST')===day)p.deleteProperty('DAILY_TRANSLATION_REQUEST');
}
function snapshotPublicationPending_(work,includeDue=true){return snapshotJobsPending_()||(work?.jobs||collectionJobs_()).some(job=>job.estado==='Publicando')||Boolean(properties_().getProperty('DASHBOARD_SNAPSHOT_BUILD'))||includeDue&&dashboardSnapshotsDue_();}
function backgroundTask_(work,daily){
  if(daily)return 'collection';
  const blocked=dailyCollectionPending_(work)||dailyPipelineRequested_(),candidates=[];
  const offer=(task,ready,priority=PROCESS_PRIORITY[task])=>{if(ready)candidates.push({task,priority});};
  if(!blocked){
    offer('classification',classificationReadyAt_()<=Date.now());
    const publishing=snapshotPublicationPending_(work),classifying=classificationPending_();
    offer('taxonomy',!taxonomyPublicationReady_()&&publishing&&taxonomyReadyAt_()<=Date.now()&&(!classifying||classificationJob_()?.state==='Publicando'),PROCESS_PRIORITY.classification);
    offer('snapshot',taxonomyPublicationReady_()&&(!classifying||snapshotJobsPending_())&&publishing);
    if(!classifying&&!properties_().getProperty('CLASSIFICATION_REQUEST')){
      offer('newsletter',newsletterReadyAt_(work)<=Date.now());offer('translation',translationReadyAt_()<=Date.now());
      offer('catalogSync',catalogSyncReadyAt_()<=Date.now());offer('taxonomy',taxonomyReadyAt_()<=Date.now());offer('taxonomyTranslation',taxonomyTranslationReadyAt_()<=Date.now());
      offer('archive',logArchiveReadyAt_()<=Date.now()&&!work.pending.length);offer('maintenance',maintenanceReadyAt_()<=Date.now());
    }
  }
  offer('collection',work.pending.length>0,daily?PROCESS_PRIORITY.daily:PROCESS_PRIORITY.maintenance+1);
  return candidates.sort((a,b)=>a.priority-b.priority)[0]?.task||'';
}
// Wake only for runnable work; lower queues cannot poll while their prerequisites are paused.
function backgroundNextAt_(work,completed=true){
  const now=Date.now(),p=properties_();if(!work||!completed||backgroundQueued_(work))return now;
  const collection=work.tasks?collectionReadyAt_(work):Math.min(...(work.jobs||[]).filter(job=>Number(job.pendientes)>0||job.estado==='Preparando').map(job=>Math.max(now,Number(p.getProperty('FETCH_PAUSED_UNTIL')||0),Number(job.pausa||0))));
  if(dailyCollectionPending_(work)||dailyPipelineRequested_())return collection;
  if(classificationJob_()?.state==='Publicando'&&!taxonomyPublicationReady_())return Math.min(collection,taxonomyReadyAt_());
  if(classificationPending_())return snapshotJobsPending_()?now:Math.min(collection,classificationReadyAt_());
  if(dashboardSnapshotsReady_(work))return now;
  return Math.min(catalogSyncReadyAt_(),logArchiveReadyAt_(),collection,translationReadyAt_(),taxonomyReadyAt_(),taxonomyTranslationReadyAt_(),newsletterReadyAt_(work),maintenanceReadyAt_());
}
function processBackground_(batchLimit=BACKGROUND_WORK.maxBatches){return withScriptProperties_(()=>processBackground_Request_(batchLimit));}
function processBackground_Request_(batchLimit=BACKGROUND_WORK.maxBatches){
  if(backgroundPaused_()){deferBackgroundWork_('background');return {added:0,errors:[],paused:true};}
  scheduledTriggers_('backgroundTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().deleteProperty('BACKGROUND_NEXT');
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000)){ensureBackgroundWorker_();return {added:0,errors:[],busy:true};}
  const started=Date.now(),runId=Utilities.getUuid(),errors=[];let work,known,knownRevision,completed=false,added=0,acquired=true;
  try{
    for(let batch=0;batch<batchLimit&&Date.now()-started<BACKGROUND_WORK.maxMs;batch++){
      if(backgroundPaused_()){deferBackgroundWork_('background');break;}
      if(batch){lock.releaseLock();acquired=false;if(backgroundPaused_()){deferBackgroundWork_('background');break;}if(!lock.tryLock(1000))break;acquired=true;refreshScriptProperties_();dataGenerationMemory_=undefined;if(backgroundPaused_()){deferBackgroundWork_('background');break;}if(String(properties_().getProperty('CONFIG_REVISION')||'0')!==configurationVersionMemory_){configurationMemory_=undefined;configurationVersionMemory_=undefined;}}
      drainDailyPipeline_();drainCollectionRequests_();drainMaintenanceRequest_();work=collectionWork_(Date.now());
      const daily=Boolean(work.pending.length&&work.jobs.some(job=>job.id===work.pending[0].ciclo&&job.tipo==='daily'));
      if(!work.pending.length&&batch===0)collectionBatch_(work);
      if(!daily&&!dailyCollectionPending_(work)){drainClassificationRequest_();drainDailyTranslations_(work);drainTaxonomyRequest_();}
      const collectionJob=work.pending[0]?.ciclo,task=backgroundTask_(work,daily);if(!task){if(dashboardSnapshotsReady_(work))dashboardSnapshotBatch_();break;}
      const remaining=Math.min(BACKGROUND_WORK.sliceMs,BACKGROUND_WORK.maxMs-(Date.now()-started));if(remaining<=0)break;
      progressContextMemory_=undefined;properties_().setProperty('SUPERVISOR_DISPATCH',JSON.stringify({task,at:new Date().toISOString()}));properties_().setProperty('BACKGROUND_RUN_ID',runId);const stage=task==='collection'?'daily':task;properties_().setProperty('BACKGROUND_ACTIVE',stage);if(task==='collection')properties_().setProperty('BACKGROUND_COLLECTION_JOB',collectionJob||'');else properties_().deleteProperty('BACKGROUND_COLLECTION_JOB');properties_().setProperty('BACKGROUND_ACTIVE_UNTIL',String(Date.now()+BACKGROUND_WORK.maxMs+BACKGROUND_WORK.activeGraceMs));properties_().setProperty('JOB_LAST_EXECUTED:'+stage,new Date().toISOString());
      if(task==='snapshot')dashboardSnapshotBatch_();
      else if(task==='archive')operationalArchiveBatch_();
      else if(task==='maintenance')maintenanceBatch_(Math.min(MAINTENANCE_POLICY.maxMs,remaining));
      else if(task==='newsletter')deliverNewsletterBatch_(work,remaining);
      else if(task==='catalogSync'){const synced=refreshFunctionalCatalog_();if(synced.error)properties_().setProperty('CATALOG_SYNC_RETRY_AT',String(Date.now()+settings_().retryMinutes*60000));else{properties_().deleteProperty('CATALOG_SYNC_REQUEST');properties_().deleteProperty('CATALOG_SYNC_RETRY_AT');if(synced.changed&&!taxonomyPending_())requestTaxonomy_('catalog-change',false);}}
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
    }finally{if(acquired){if(properties_().getProperty('BACKGROUND_RUN_ID')===runId){properties_().deleteProperty('BACKGROUND_RUN_ID');properties_().deleteProperty('BACKGROUND_ACTIVE');properties_().deleteProperty('BACKGROUND_ACTIVE_UNTIL');properties_().deleteProperty('BACKGROUND_COLLECTION_JOB');}lock.releaseLock();}}
  }
}
function initializeBackgroundSchedules_(){
  CacheService.getScriptCache().remove('operational-trigger-counts');
  const p=properties_();
  installFunctionalCatalogWatcher_();
  CacheService.getScriptCache().remove('daily-schedule');
  p.deleteProperty('BACKGROUND_NEXT');
  const watchdogMinutes=settings_().watchdogMinutes;if(scheduledTriggers_('backgroundWatchdog_').length!==1||Number(p.getProperty('WATCHDOG_INTERVAL'))!==watchdogMinutes){scheduledTriggers_('backgroundWatchdog_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));ScriptApp.newTrigger('backgroundWatchdog_').timeBased().everyMinutes(watchdogMinutes).create();p.setProperty('WATCHDOG_INTERVAL',String(watchdogMinutes));}
  if(p.getProperty('DAILY_ENABLED')===null)p.setProperty('DAILY_ENABLED','true');
  if(p.getProperty('DAILY_ENABLED')==='true')replaceCollectionSchedule_();else for(const handler of collectionHandlers_())scheduledTriggers_(handler).forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(settings_().newsletterEnabled)replaceDailySchedule_('scheduledNewsletters_',settings_().newsletterHour,settings_().newsletterMinute);else scheduledTriggers_('scheduledNewsletters_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  if(dashboardSnapshotsPending_()||Number.isFinite(taxonomyTranslationReadyAt_())||taxonomyPending_()||p.getProperty('TAXONOMY_REQUEST')||p.getProperty('CATALOG_SYNC_REQUEST')||classificationPending_()||p.getProperty('CLASSIFICATION_REQUEST')||collectionRequests_().length||collectionJobs_().some(job=>Number(job.pendientes)>0)||Number.isFinite(translationReadyAt_())||Number.isFinite(newsletterReadyAt_()))ensureBackgroundWorker_();
}
function updateOperationalSchedule(){authorize_(true);return withForegroundWrite_(()=>{initializeBackgroundSchedules_();return 'Prioridades y programación actualizadas.';});}

function backgroundWatchdog_(){
  const p=properties_(),values=p.getProperties();p.setProperty('SUPERVISOR_LAST',new Date().toISOString());if(backgroundPaused_()){p.setProperty('SUPERVISOR_DECISION','Edición administrativa: trabajos en espera');return;}
  if(Object.entries(values).some(([key,value])=>key.startsWith('WORK_PENDING:')&&value==='true')){workWake_();return;}
  if(!dashboardSnapshotsPending_()&&!values.BACKGROUND_PENDING&&!dailyPipelineRequested_()&&!['LOG_ARCHIVE_PENDING','MAINTENANCE_REQUEST','CLASSIFICATION_REQUEST','DAILY_TRANSLATION_REQUEST','TRANSLATION_REQUEST','TAXONOMY_REQUEST','CATALOG_SYNC_REQUEST','TAXONOMY_TRANSLATION_REQUEST'].some(key=>values[key])&&!(values.NEWSLETTER_REQUEST&&settings_().newsletterEnabled)&&!Number.isFinite(maintenanceReadyAt_())){p.setProperty('SUPERVISOR_DECISION','Sin trabajos pendientes');return;}
  if(scheduledTriggers_('backgroundTick_').length&&Number(p.getProperty('BACKGROUND_NEXT'))>Date.now()-BACKGROUND_WORK.maxMs*2)return;
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try{
    recoverBackgroundJobs_();
    const now=Date.now(),jobs=collectionJobs_(),next=backgroundNextAt_({jobs});
    if(Number.isFinite(next)){p.setProperty('SUPERVISOR_DECISION',next>now?'Esperando disponibilidad de cuota o reintento':'Continuación de la cola autorizada');p.deleteProperty('BACKGROUND_NEXT');ensureBackgroundWorker_(next-now);}else{p.setProperty('SUPERVISOR_DECISION','Sin trabajos pendientes');p.deleteProperty('BACKGROUND_PENDING');}
  }finally{lock.releaseLock();}
}

function backgroundQueued_(work){
  const p=properties_();return Boolean(p.getProperty('MAINTENANCE_REQUEST')||dailyPipelineRequested_()||collectionRequests_().length||!dailyCollectionPending_(work)&&!classificationPending_()&&(p.getProperty('CLASSIFICATION_REQUEST')||p.getProperty('DAILY_TRANSLATION_REQUEST'))||!businessPipelinePending_(work)&&(p.getProperty('TAXONOMY_REQUEST')&&!taxonomyPending_()));
}

function backgroundStageComplete_(task,work,collectionJob){
  if(task==='collection'&&collectionJob)return work.jobs.some(job=>job.id===collectionJob&&Number(job.pendientes)===0&&job.estado!=='Preparando');
  if(task==='collection')return !work.jobs.some(job=>Number(job.pendientes)>0||job.estado==='Preparando');
  const job={classification:classificationJob_,translation:translationJob_,taxonomy:taxonomyJob_,taxonomyTranslation:taxonomyTranslationJob_,maintenance:maintenanceJob_}[task];
  return task==='newsletter'||Boolean(job&&job()?.state==='Completada');
}

function getOperationalSchedule(){
 authorize_(true);const config=settings_(),enabled=properties_().getProperty('DAILY_ENABLED')==='true';
 const times=new Set(),jobs=[...collectionSchedules_().map((job,index)=>{const key=scheduleTime_(job)+'|'+job.timezone,expected=enabled&&job.enabled&&!times.has(key)?1:0;if(expected)times.add(key);return {...job,label:'Recopilación '+(index+1),expected};}),{label:'Envíos planificados',handler:'scheduledNewsletters_',hour:config.newsletterHour,minute:config.newsletterMinute,timezone:config.timezone,expected:config.newsletterEnabled?1:0},{label:'Supervisor de colas',handler:'backgroundWatchdog_',minutes:config.watchdogMinutes,expected:1}];
 const cache=CacheService.getScriptCache(),cached=cache.get('operational-trigger-counts'),counts=new Map(cached?JSON.parse(cached):[]);
 if(!cached){operationalTriggersMemory_=ScriptApp.getProjectTriggers();for(const trigger of operationalTriggersMemory_){const handler=trigger.getHandlerFunction();counts.set(handler,(counts.get(handler)||0)+1);}cache.put('operational-trigger-counts',JSON.stringify([...counts]),90);}
 for(const job of jobs){job.installed=counts.get(job.handler)||0;job.valid=job.installed===job.expected;}
 return {jobs,valid:jobs.every(job=>job.valid),archive:{attempts:Number(properties_().getProperty('LOG_ARCHIVE_ATTEMPTS')||0),error:properties_().getProperty('LOG_ARCHIVE_ERROR')||'',next:Number(properties_().getProperty('LOG_ARCHIVE_NEXT')||0)},workerTriggers:counts.get('backgroundTick_')||0,queued:dailyPipelineRequested_()||Boolean(properties_().getProperty('BACKGROUND_PENDING'))};
}

function operationalProcesses_(){
 const p=properties_().getProperties(),definitions=[['classification','CLASSIFICATION_JOB','CLASSIFICATION_REQUEST'],['translation','TRANSLATION_JOB','TRANSLATION_REQUEST'],['taxonomy','TAXONOMY_JOB','TAXONOMY_REQUEST'],['taxonomyTranslation','TAXONOMY_TRANSLATION_JOB','TAXONOMY_TRANSLATION_REQUEST'],['maintenance','MAINTENANCE_JOB','MAINTENANCE_REQUEST']];
 const jobs=definitions.map(([stage,key,request])=>controlProcess_(stage,p[key]?JSON.parse(p[key]):null,Boolean(p[request]||stage==='translation'&&p.DAILY_TRANSLATION_REQUEST)));
 const pending=snapshotJobsPending_()||Boolean(p.DASHBOARD_SNAPSHOT_BUILD)||dashboardSnapshotsPending_();jobs.push(controlProcess_('snapshot',{state:pending?'Pendiente':'Completada',updated:p['JOB_LAST_EXECUTED:snapshot']||''},pending));return jobs;
}
