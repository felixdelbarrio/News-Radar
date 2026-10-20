function translationJob_(){const value=properties_().getProperty('TRANSLATION_JOB');return value?JSON.parse(value):null;}
function writeTranslationJob_(job){progressContextMemory_=undefined;properties_().setProperty('TRANSLATION_JOB',JSON.stringify(snapshotJob_('TRANSLATION_JOB',job)));}
function installTranslationSchedule(){authorize_(true);properties_().setProperty('TRANSLATION_ENABLED','true');return getTranslationStatus();}
function disableTranslationSchedule(){authorize_(true);properties_().setProperty('TRANSLATION_ENABLED','false');return getTranslationStatus();}
function requestTranslations_(priority=false){properties_().setProperty('TRANSLATION_REQUEST',new Date().toISOString());if(priority)properties_().setProperty('TRANSLATION_PRIORITY_REQUEST','true');ensureBackgroundWorker_();}
function startTranslations(){authorize_(true);requestTranslations_();return getTranslationStatus();}
function getTranslationStatus(){authorize_(true);return {newsRevision:publishedNewsRevision_(),scheduled:properties_().getProperty('TRANSLATION_ENABLED')!=='false',timezone:settings_().timezone,job:withJobProgress_('translation',translationJob_(),Boolean(properties_().getProperty('TRANSLATION_REQUEST'))),queued:Boolean(properties_().getProperty('TRANSLATION_REQUEST'))};}
function translationCandidates_(job){
  return businessNewsIndex_().rows.filter(row=>row.captured<=job.started&&(!job.cursor||row.fecha<job.cursor.fecha||row.fecha===job.cursor.fecha&&row.id<job.cursor.id)).sort((a,b)=>a.fecha===b.fecha?(a.id===b.id?0:a.id>b.id?-1:1):a.fecha>b.fecha?-1:1);
}
function translationBatch_(maxMs=TRANSLATION_WORK.maxMs){
  if(translationJob_()?.state==='Publicando')return;
  const started=Date.now(),now=new Date(started),today=recordDay(now,settings_().timezone);let job;
  try{
    const paused=Number(properties_().getProperty('TRANSLATION_PAUSED_UNTIL')||0);if(paused>started)return;
    job=translationJob_();const request=properties_().getProperty('TRANSLATION_REQUEST');
    if(!job||properties_().getProperty('TRANSLATION_PRIORITY_REQUEST')||request&&(job.state==='Completada'||recordDay(job.started,settings_().timezone)<today))job={state:'Pendiente',started:now.toISOString(),updated:now.toISOString(),total:0,processed:0,translated:0,errors:0,calls:job?.callDay===today?job.calls:0,callDay:today,cursor:null,error:'',pausedUntil:0};
    if(job.state==='Completada'&&!request)return;
    if(job.callDay!==today){job.callDay=today;job.calls=0;job.pausedUntil=0;job.error='';}
    const candidates=translationCandidates_(job);job.total=job.processed+candidates.length;job.businessPending=candidates.filter(row=>row.priority===0).length;
    writeTranslationJob_(job);if(request&&job.started>=request&&properties_().getProperty('TRANSLATION_REQUEST')===request){properties_().deleteProperty('TRANSLATION_REQUEST');properties_().deleteProperty('TRANSLATION_PRIORITY_REQUEST');}
    if(job.pausedUntil>started)return;
    if(translationCallsToday_()>=TRANSLATION_WORK.dailyCalls&&candidates.length){job.state='En pausa';job.pausedUntil=nextDailyReset(Date.now(),settings_().timezone);job.error='Límite diario de traducción alcanzado. Continuará en la siguiente ejecución diaria.';return;}
    job.state='En curso';job.error='';writeTranslationJob_(job);
    const feeds=new Set(configuration_().feeds.map(feed=>feed.name)),known=articleTranslationIndex_();let calls=0;
    outer:for(let offset=0;offset<Math.min(candidates.length,TRANSLATION_WORK.batchRows);offset+=TRANSLATION_WORK.readRows){
      if(backgroundPaused_()||Date.now()-started>=maxMs)break;
      const selected=candidates.slice(offset,offset+TRANSLATION_WORK.readRows),articles=new Map(rowsById_('Noticias',new Set(selected.map(row=>row.id))).map(row=>[row.id,row]));
      for(const candidate of selected){
        if(backgroundPaused_()||Date.now()-started>=maxMs||collectionRequests_().some(request=>request.kind==='daily'))break outer;
        const row=articles.get(candidate.id);
        if(row)for(const language of Object.keys(languageNames)){
          if(backgroundPaused_()||Date.now()-started>=maxMs||collectionRequests_().some(request=>request.kind==='daily'))break outer;
          if(nativeArticle_(row,language,feeds)||known.has(articleTranslationKey_(row,language)))continue;
          if(calls>=TRANSLATION_WORK.batchCalls||translationCallsToday_()>=TRANSLATION_WORK.dailyCalls)break outer;
          calls++;job.calls++;writeTranslationJob_(job);storeArticleTranslation_(row,language);job.translated++;
        }
        job.processed++;job.cursor={id:candidate.id,fecha:candidate.fecha,priority:candidate.priority};if(candidate.priority===0)job.businessPending--;job.updated=new Date().toISOString();writeTranslationJob_(job);
      }
    }
    job.state=job.processed===job.total?'Completada':translationCallsToday_()>=TRANSLATION_WORK.dailyCalls?'En pausa':'Pendiente';
    if(job.state==='En pausa'){job.pausedUntil=nextDailyReset(Date.now(),settings_().timezone);job.error='Límite diario de traducción alcanzado. Continuará en la siguiente ejecución diaria.';}
    if(job.state==='Completada')compactArticleTranslations_();
    SpreadsheetApp.flush();telemetry_('traduccion',Date.now()-started,'OK',job.processed+'/'+job.total+' noticias; '+calls+' llamadas; '+job.translated+' traducciones guardadas');
  }catch(error){
    if(!job)throw error;
    if(serviceQuotaPause_(error))properties_().setProperty('TRANSLATION_PAUSED_UNTIL',String(Date.now()+serviceQuotaPause_(error)));
    job.state='En pausa';job.errors++;job.error='Traducción temporalmente no disponible. Se reintentará automáticamente.';job.pausedUntil=Date.now()+(serviceQuotaPause_(error)||TRANSLATION_WORK.retryMs);
    telemetry_('traduccion',Date.now()-started,'Error',String(error.message).slice(0,180));
  }finally{if(job){job.updated=new Date().toISOString();writeTranslationJob_(job);if(job.state==='Completada')requestDashboardSnapshots_(true);}}
}
