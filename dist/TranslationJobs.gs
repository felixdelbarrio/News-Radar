function translationJob_(){const value=properties_().getProperty('TRANSLATION_JOB');return value?JSON.parse(value):null;}
function writeTranslationJob_(job){properties_().setProperty('TRANSLATION_JOB',JSON.stringify(job));}
function ensureTranslationSchedule_(){
  if(!scheduledTriggers_('nightlyTranslations_').length)replaceDailySchedule_('nightlyTranslations_',TRANSLATION_WORK.hour);
  properties_().setProperty('TRANSLATION_ENABLED','true');
}
function installTranslationSchedule(){authorize_(true);scheduledTriggers_('nightlyTranslations_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));ensureTranslationSchedule_();return getTranslationStatus();}
function disableTranslationSchedule(){authorize_(true);scheduledTriggers_('nightlyTranslations_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));properties_().setProperty('TRANSLATION_ENABLED','false');return getTranslationStatus();}
function requestTranslations_(){properties_().setProperty('TRANSLATION_REQUEST',new Date().toISOString());ensureBackgroundWorker_();}
function startTranslations(){authorize_(true);requestTranslations_();return getTranslationStatus();}
function nightlyTranslations_(){requestTranslations_();backgroundTick_();}
function getTranslationStatus(){authorize_(true);return {scheduled:scheduledTriggers_('nightlyTranslations_').length>0,hour:TRANSLATION_WORK.hour,timezone:settings_().timezone,job:translationJob_(),queued:Boolean(properties_().getProperty('TRANSLATION_REQUEST'))};}
function translationCandidates_(job){
  const sheet=book_().getSheetByName('Noticias'),count=Math.min(Math.max(0,sheet.getLastRow()-1),settings_().newsReadLimit);if(!count)return [];
  const first=sheet.getLastRow()-count+1,dates=sheet.getRange(first,1,count,2).getDisplayValues(),captured=sheet.getRange(first,10,count,1).getDisplayValues();
  return dates.map(([id,fecha],index)=>({id,fecha,captured:captured[index][0]}))
    .filter(row=>row.id&&row.captured<=job.started&&(!job.cursor||row.fecha<job.cursor.fecha||(row.fecha===job.cursor.fecha&&row.id<job.cursor.id)))
    .sort((a,b)=>a.fecha===b.fecha?(a.id===b.id?0:a.id>b.id?-1:1):a.fecha>b.fecha?-1:1);
}
function translationBatch_(maxMs=TRANSLATION_WORK.maxMs){
  const started=Date.now(),now=new Date(started),today=recordDay(now,settings_().timezone);let job;
  try{
    job=translationJob_();const request=properties_().getProperty('TRANSLATION_REQUEST');
    if(!job||(request&&(job.state==='Completada'||recordDay(job.started,settings_().timezone)<today)))job={state:'Pendiente',started:now.toISOString(),updated:now.toISOString(),total:0,processed:0,translated:0,errors:0,calls:job?.callDay===today?job.calls:0,callDay:today,cursor:null,error:'',pausedUntil:0};
    if(job.state==='Completada'&&!request)return;
    if(job.callDay!==today){job.callDay=today;job.calls=0;job.pausedUntil=0;job.error='';}
    const candidates=translationCandidates_(job);job.total=job.processed+candidates.length;
    writeTranslationJob_(job);if(request&&properties_().getProperty('TRANSLATION_REQUEST')===request)properties_().deleteProperty('TRANSLATION_REQUEST');
    if(job.pausedUntil>started)return;
    if(job.calls>=TRANSLATION_WORK.dailyCalls&&candidates.length){job.state='En pausa';job.error='Límite diario de traducción alcanzado. Continuará en la siguiente ejecución diaria.';return;}
    job.state='En curso';job.error='';writeTranslationJob_(job);
    const feeds=new Set(configuration_().feeds.map(feed=>feed.name)),known=articleTranslationIndex_();let calls=0;
    outer:for(let offset=0;offset<Math.min(candidates.length,TRANSLATION_WORK.batchRows);offset+=TRANSLATION_WORK.readRows){
      if(Date.now()-started>=maxMs)break;
      const selected=candidates.slice(offset,offset+TRANSLATION_WORK.readRows),articles=new Map(rowsById_('Noticias',new Set(selected.map(row=>row.id)),settings_().newsReadLimit).map(row=>[row.id,row]));
      for(const candidate of selected){
        if(Date.now()-started>=maxMs||collectionRequests_().some(request=>request.kind==='daily'))break outer;
        const row=articles.get(candidate.id);
        if(row)for(const language of Object.keys(languageNames)){
          if(Date.now()-started>=maxMs||collectionRequests_().some(request=>request.kind==='daily'))break outer;
          if(nativeArticle_(row,language,feeds)||known.has(articleTranslationKey_(row,language)))continue;
          if(calls>=TRANSLATION_WORK.batchCalls||job.calls>=TRANSLATION_WORK.dailyCalls)break outer;
          calls++;job.calls++;writeTranslationJob_(job);storeArticleTranslation_(row,language);job.translated++;
        }
        job.processed++;job.cursor={id:candidate.id,fecha:candidate.fecha};job.updated=new Date().toISOString();writeTranslationJob_(job);
      }
    }
    job.state=job.processed===job.total?'Completada':job.calls>=TRANSLATION_WORK.dailyCalls?'En pausa':'Pendiente';
    if(job.state==='En pausa')job.error='Límite diario de traducción alcanzado. Continuará en la siguiente ejecución diaria.';
    SpreadsheetApp.flush();telemetry_('traduccion',Date.now()-started,'OK',job.processed+'/'+job.total+' noticias; '+calls+' llamadas; '+job.translated+' traducciones guardadas');
  }catch(error){
    if(!job)throw error;
    job.state='En pausa';job.errors++;job.error='Traducción temporalmente no disponible. Se reintentará automáticamente.';job.pausedUntil=Date.now()+TRANSLATION_WORK.retryMs;
    telemetry_('traduccion',Date.now()-started,'Error',String(error.message).slice(0,180));
  }finally{if(job){job.updated=new Date().toISOString();writeTranslationJob_(job);}}
}
