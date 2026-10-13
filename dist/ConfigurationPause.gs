const CONFIGURATION_PAUSE=Object.freeze({waitMs:60000,leaseMs:600000,resumeMs:60000,pollMs:1000});
let configurationPauseCheck_;
function configurationPaused_(cached=false){
  const now=Date.now();
  if(!cached||!configurationPauseCheck_||now-configurationPauseCheck_.checked>=CONFIGURATION_PAUSE.pollMs)configurationPauseCheck_={checked:now,until:Number(properties_().getProperty('CONFIGURATION_PAUSED_UNTIL')||0)};
  return configurationPauseCheck_.until>now;
}
function deferConfigurationWork_(name){properties_().setProperty('CONFIGURATION_PENDING:'+name,'true');}
function scheduleConfigurationWake_(delay){
  scheduledTriggers_('configurationWake_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('configurationWake_').timeBased().after(delay).create();
}
function withConfigurationPause_(operation){
  const coordinator=LockService.getUserLock();if(!coordinator.tryLock(1000))throw Error('Ya hay una configuración en curso. Espera a que termine.');
  const lock=LockService.getScriptLock();let acquired=false;
  try{
    properties_().setProperty('CONFIGURATION_PAUSED_UNTIL',String(Date.now()+CONFIGURATION_PAUSE.leaseMs));
    scheduleConfigurationWake_(CONFIGURATION_PAUSE.leaseMs);
    for(const [handler,name] of [['backgroundTick_','background'],['newsletterTick_','newsletter']])if(scheduledTriggers_(handler).length)deferConfigurationWork_(name);
    if(!lock.tryLock(CONFIGURATION_PAUSE.waitMs))throw Error('La configuración ha solicitado la pausa, pero el trabajo activo aún no ha liberado el bloqueo. Vuelve a iniciar la configuración cuando termine su llamada en curso.');
    acquired=true;return operation();
  }finally{
    try{
      if(acquired)lock.releaseLock();
      properties_().deleteProperty('CONFIGURATION_PAUSED_UNTIL');
      configurationPauseCheck_=undefined;
      if(Object.keys(properties_().getProperties()).some(key=>key.startsWith('CONFIGURATION_PENDING:')))scheduleConfigurationWake_(CONFIGURATION_PAUSE.resumeMs);
      else scheduledTriggers_('configurationWake_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
    }finally{coordinator.releaseLock();}
  }
}
function configurationWake_(){
  if(configurationPaused_()){scheduleConfigurationWake_(Math.max(CONFIGURATION_PAUSE.resumeMs,Number(properties_().getProperty('CONFIGURATION_PAUSED_UNTIL'))-Date.now()));return;}
  const coordinator=LockService.getUserLock();if(!coordinator.tryLock(1000)){scheduleConfigurationWake_(CONFIGURATION_PAUSE.resumeMs);return;}
  const lock=LockService.getScriptLock();let acquired=false;
  try{
    if(!lock.tryLock(1000)){scheduleConfigurationWake_(CONFIGURATION_PAUSE.resumeMs);return;}acquired=true;
    properties_().deleteProperty('CONFIGURATION_PAUSED_UNTIL');
    configurationPauseCheck_=undefined;
    const pending=Object.keys(properties_().getProperties()).filter(key=>key.startsWith('CONFIGURATION_PENDING:'));
    for(const key of pending){
      const name=key.slice('CONFIGURATION_PENDING:'.length);
      if(name==='daily'||name==='projectFinance')queueScheduledCollection_(name);
      else if(name==='classification')dailyClassification_();
      else if(name==='taxonomy')dailyTaxonomy_();
      else if(name==='edited'){invalidateConfiguration_();requestNewsClassification_(true);}
      else if(name==='news')invalidateNews_();
      else if(name==='newsletter')ensureNewsletterContinuation_(CONFIGURATION_PAUSE.resumeMs);
      else if(name==='background'){scheduledTriggers_('backgroundTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().deleteProperty('BACKGROUND_NEXT');}
      properties_().deleteProperty(key);
    }
    ensureBackgroundWorker_();scheduledTriggers_('configurationWake_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  }catch(error){scheduleConfigurationWake_(CONFIGURATION_PAUSE.resumeMs);throw error;}
  finally{try{if(acquired)lock.releaseLock();}finally{coordinator.releaseLock();}}
}
