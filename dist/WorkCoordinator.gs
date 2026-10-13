const WORK_COORDINATION=Object.freeze({waitMs:60000,leaseMs:600000,resumeMs:60000,pollMs:1000});
let workPauseCheck_;
function backgroundPaused_(cached=false){
  const now=Date.now();
  if(!cached||!workPauseCheck_||now-workPauseCheck_.checked>=WORK_COORDINATION.pollMs){
    const values=properties_().getProperties();
    workPauseCheck_={checked:now,until:Math.max(0,...Object.entries(values).filter(([key])=>key.startsWith('WORK_INTENT:')).map(([,value])=>Number(value)||0))};
  }
  return workPauseCheck_.until>now;
}
function deferBackgroundWork_(name){properties_().setProperty('WORK_PENDING:'+name,'true');}
function scheduleWorkWake_(delay){
  scheduledTriggers_('workWake_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('workWake_').timeBased().after(delay).create();
}
function withForegroundWrite_(operation){
  const properties=properties_(),intent='WORK_INTENT:'+Utilities.getUuid(),lock=LockService.getScriptLock();let acquired=false;
  try{
    properties.setProperty(intent,String(Date.now()+WORK_COORDINATION.leaseMs));
    scheduleWorkWake_(WORK_COORDINATION.leaseMs);
    for(const [handler,name] of [['backgroundTick_','background'],['newsletterTick_','newsletter']])if(scheduledTriggers_(handler).length)deferBackgroundWork_(name);
    if(!lock.tryLock(WORK_COORDINATION.waitMs))throw Error('El trabajo activo aún no ha liberado el bloqueo. Vuelve a intentarlo cuando termine su llamada en curso.');
    acquired=true;return operation();
  }finally{
    try{if(acquired){try{SpreadsheetApp.flush();}finally{lock.releaseLock();}}}
    finally{
      properties.deleteProperty(intent);workPauseCheck_=undefined;
      scheduleWorkWake_(WORK_COORDINATION.resumeMs);
    }
  }
}
function workWake_(){
  if(backgroundPaused_()){scheduleWorkWake_(WORK_COORDINATION.resumeMs);return;}
  const lock=LockService.getScriptLock();let acquired=false;
  try{
    if(!lock.tryLock(1000)){scheduleWorkWake_(WORK_COORDINATION.resumeMs);return;}acquired=true;
    if(backgroundPaused_()){scheduleWorkWake_(WORK_COORDINATION.resumeMs);return;}
    scheduledTriggers_('workWake_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
    for(const [key,value] of Object.entries(properties_().getProperties()))if(key.startsWith('WORK_INTENT:')&&Number(value)<=Date.now())properties_().deleteProperty(key);
    workPauseCheck_=undefined;
    const pending=Object.keys(properties_().getProperties()).filter(key=>key.startsWith('WORK_PENDING:'));
    for(const key of pending){
      if(backgroundPaused_()){scheduleWorkWake_(WORK_COORDINATION.resumeMs);return;}
      const name=key.slice('WORK_PENDING:'.length);
      if(name==='daily')queueScheduledCollection_(name);
      else if(name==='classification')dailyClassification_();
      else if(name==='taxonomy')dailyTaxonomy_();
      else if(name==='edited'){invalidateConfiguration_();requestNewsClassification_(true);}
      else if(name==='news')invalidateNews_();
      else if(name==='newsletter')ensureNewsletterContinuation_(WORK_COORDINATION.resumeMs);
      else if(name==='background'){scheduledTriggers_('backgroundTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().deleteProperty('BACKGROUND_NEXT');}
      if(backgroundPaused_()){scheduleWorkWake_(WORK_COORDINATION.resumeMs);return;}
      properties_().deleteProperty(key);
    }
    if(pending.includes('WORK_PENDING:background'))ensureBackgroundWorker_();
  }catch(error){scheduleWorkWake_(WORK_COORDINATION.resumeMs);throw error;}
  finally{if(acquired)lock.releaseLock();}
}
