function businessNews_(row){
  const labels=row.etiquetas||savedNewsLabels_(row.clasificacion);
  return labels.digital&&labels.capacidades.some(name=>name.startsWith('Empresas: '));
}
function newsLabels_(assessment,title,businessContext=false){
  const digital=Boolean(businessContext&&assessment.capabilities.length&&assessment.channel&&assessment.score>0&&!assessment.excluded&&!assessment.editorial&&(assessment.change||assessment.capabilities.some(row=>row.terms.some(term=>phraseMatch_(title,term)))));
  return {digital,capacidades:[...new Set(assessment.capabilities.map(row=>row.segment+': '+row.name))]};
}
function savedNewsLabels_(value){
  if(!value)return {digital:false,capacidades:[]};
  try{const labels=JSON.parse(value);return {digital:labels.digital===true,capacidades:Array.isArray(labels.capacidades)?labels.capacidades:[],...(typeof labels.canonicalId==='string'?{canonicalId:labels.canonicalId}:{})};}
  catch(_){return {digital:false,capacidades:[]};}
}
function classificationRulesRevision_(config=configuration_()){return sha256_(JSON.stringify([CLASSIFICATION_WORK.rulesVersion,config.capabilities,config.entities,config.segments,config.geographies,config.feeds.map(({name,country,url})=>({name,country,url}))]));}
function classificationJob_(){const raw=properties_().getProperty('CLASSIFICATION_JOB');return raw?JSON.parse(raw):null;}
function classificationPending_(){const job=classificationJob_();return Boolean(job&&job.state!=='Completada');}
function classificationReadyAt_(){const job=classificationJob_();return job&&job.state!=='Completada'?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeClassificationJob_(job){progressContextMemory_=undefined;properties_().setProperty('CLASSIFICATION_JOB',JSON.stringify(job));}
function requestNewsClassification_(force=false){
  const job=classificationJob_();if(!force&&job?.version===CLASSIFICATION_WORK.rulesVersion)return;
  const now=new Date(),total=Math.max(0,book_().getSheetByName('Noticias').getLastRow()-1);
  writeClassificationJob_({next:2,cursor:null,total,revision:classificationRulesRevision_(),version:CLASSIFICATION_WORK.rulesVersion,state:total?'Pendiente':'Completada',started:now.toISOString(),updated:now.toISOString(),day:recordDay(now,settings_().timezone),classified:0,digital:0});
  if(total)ensureBackgroundWorker_();
}
function drainClassificationRequest_(){
  const p=properties_(),day=p.getProperty('CLASSIFICATION_REQUEST');if(!day)return;
  const job=classificationJob_();if(job?.day===day&&job.total===Math.max(0,book_().getSheetByName('Noticias').getLastRow()-1)){p.deleteProperty('CLASSIFICATION_REQUEST');return;}
  if(classificationPending_())return;
  requestNewsClassification_(true);p.deleteProperty('CLASSIFICATION_REQUEST');
}
function getClassificationStatus(){
  authorize_(true);const job=classificationJob_(),queued=Boolean(properties_().getProperty('CLASSIFICATION_REQUEST'));
  return {newsRevision:properties_().getProperty('NEWS_REVISION')||'0',queued,scheduled:dailyScheduleStatus_(),timezone:settings_().timezone,job:withJobProgress_('classification',job?{...job,processed:Math.min(job.total,job.next-2)}:null,queued)};
}
function startClassification(){
  authorize_(true);return withForegroundWrite_(()=>{
    if(!classificationPending_())requestNewsClassification_(true);
    else{const job=classificationJob_();if(job.state==='En pausa'){job.state='Pendiente';job.pausedUntil=0;writeClassificationJob_(job);}ensureBackgroundWorker_();}
    return getClassificationStatus();
  });
}
function newsClassificationBatch_(maxMs=CLASSIFICATION_WORK.maxMs){
  const job=classificationJob_();if(!job||job.state==='Completada')return;
  const started=Date.now();let read=0,classified=0,digital=0;
  try{
    const sheet=book_().getSheetByName('Noticias'),keys=RADAR.sheets.Noticias,column=keys.indexOf('clasificacion'),revision=classificationRulesRevision_();
    if(job.revision!==revision){requestNewsClassification_(true);return;}
    const rows=newsWorkRows_(job,CLASSIFICATION_WORK.batchRows),updates=[];let countriesChanged=0,cursor=job.cursor;
    for(const row of rows){
      if(Date.now()-started>=maxMs||backgroundPaused_(true)||read%20===0&&properties_().getProperty('DAILY_PIPELINE_REQUEST'))break;
      const labels={...classification_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).labels,...(savedNewsLabels_(row.clasificacion).canonicalId?{canonicalId:savedNewsLabels_(row.clasificacion).canonicalId}:{})},value=JSON.stringify(labels),country=newsCountry_(row);
      if(value!==row.clasificacion){updates.push({row:row._sheetRow,column:column+1,value});classified++;}
      if(country!==row.pais){updates.push({row:row._sheetRow,column:3,value:country});countriesChanged++;}
      if(labels.digital)digital++;cursor=newsWorkCursor_(row);read++;
    }
    writeNewsCells_(updates);if(updates.length){SpreadsheetApp.flush();invalidateNews_(false);}
    job.cursor=cursor;job.next+=read;
    Object.assign(job,{state:job.next>job.total+1?'Completada':'En curso',updated:new Date().toISOString(),classified:job.classified+classified,digital:job.digital+digital,error:'',pausedUntil:0});writeClassificationJob_(job);
    telemetry_('clasificacion',Date.now()-started,'OK',read+' leídas; '+classified+' clasificadas; '+digital+' digitales; '+Math.min(job.total,job.next-2)+'/'+job.total+' revisadas');
  }catch(error){
    Object.assign(job,{state:'En pausa',error:String(error.message).slice(0,180),updated:new Date().toISOString(),pausedUntil:Date.now()+(serviceQuotaPause_(error)||settings_().retryMinutes*60000)});writeClassificationJob_(job);telemetry_('clasificacion',Date.now()-started,'Error',job.error);
  }
}
