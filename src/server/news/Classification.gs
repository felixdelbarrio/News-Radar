function newsLabels_(assessment,title){
  const digital=Boolean(assessment.capabilities.length&&assessment.channel&&assessment.score>0&&!assessment.excluded&&!assessment.editorial&&(assessment.change||assessment.capabilities.some(row=>row.terms.some(term=>phraseMatch_(title,term)))));
  return {generalista:true,digital,capacidades:[...new Set(assessment.capabilities.map(row=>row.segment+': '+row.name))]};
}
function savedNewsLabels_(value){
  if(!value)return {generalista:false,digital:false,capacidades:[]};
  try{const labels=JSON.parse(value);return {generalista:labels.generalista===true,digital:labels.digital===true,capacidades:Array.isArray(labels.capacidades)?labels.capacidades:[]};}
  catch(_){return {generalista:false,digital:false,capacidades:[]};}
}
function classificationRulesRevision_(config=configuration_()){return sha256_(JSON.stringify([RADAR.version,config.capabilities,config.entities]));}
function classificationJob_(){const raw=properties_().getProperty('CLASSIFICATION_JOB');return raw?JSON.parse(raw):null;}
function classificationPending_(){const job=classificationJob_();return Boolean(job&&job.state!=='Completada');}
function classificationReadyAt_(){const job=classificationJob_();return job&&job.state!=='Completada'?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeClassificationJob_(job){properties_().setProperty('CLASSIFICATION_JOB',JSON.stringify(job));}
function requestNewsClassification_(force=false){
  const job=classificationJob_();if(!force&&job?.version===RADAR.version)return;
  const now=new Date(),total=Math.max(0,book_().getSheetByName('Noticias').getLastRow()-1);
  writeClassificationJob_({next:2,total,revision:classificationRulesRevision_(),version:RADAR.version,state:total?'Pendiente':'Completada',started:now.toISOString(),updated:now.toISOString(),day:recordDay(now,settings_().timezone),classified:0,digital:0});
  if(total)ensureBackgroundWorker_();
}
function dailyClassification_(){properties_().setProperty('CLASSIFICATION_REQUEST',recordDay(new Date(),settings_().timezone));ensureBackgroundWorker_();}
function drainClassificationRequest_(){
  const p=properties_(),day=p.getProperty('CLASSIFICATION_REQUEST');if(!day)return;
  const job=classificationJob_();if(job?.day===day){p.deleteProperty('CLASSIFICATION_REQUEST');return;}
  if(classificationPending_())return;
  requestNewsClassification_(true);p.deleteProperty('CLASSIFICATION_REQUEST');
}
function getClassificationStatus(){
  authorize_(true);const job=classificationJob_();return {newsRevision:properties_().getProperty('NEWS_REVISION')||'0',queued:Boolean(properties_().getProperty('CLASSIFICATION_REQUEST')),scheduled:scheduledTriggers_('dailyClassification_').length>0,hour:settings_().dailyHour,minute:CLASSIFICATION_WORK.dailyMinute,timezone:settings_().timezone,job:job?{...job,processed:Math.min(job.total,job.next-2)}:null};
}
function startClassification(){
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    if(!classificationPending_())requestNewsClassification_(true);
    else{const job=classificationJob_();if(job.state==='En pausa'){job.state='Pendiente';job.pausedUntil=0;writeClassificationJob_(job);}ensureBackgroundWorker_();}
    return getClassificationStatus();
  }
  finally{lock.releaseLock();}
}
function newsClassificationBatch_(maxMs=CLASSIFICATION_WORK.maxMs){
  const job=classificationJob_();if(!job||job.state==='Completada')return;
  const started=Date.now();let read=0,classified=0,digital=0;
  try{
    const sheet=book_().getSheetByName('Noticias'),keys=RADAR.sheets.Noticias,column=keys.indexOf('clasificacion'),revision=classificationRulesRevision_();
    if(job.revision!==revision){requestNewsClassification_(true);return;}
    const count=Math.min(CLASSIFICATION_WORK.batchRows,Math.max(0,job.total-job.next+2));
    if(count){
      const rows=sheet.getRange(job.next,1,count,keys.length).getDisplayValues(),values=[];
      for(const row of rows){
        const title=searchText_(row[5]),text=searchText_(row[5]+' '+row[6]),labels=classification_(title,text).labels,value=JSON.stringify(labels);
        values.push([value]);if(row[column]!==value)classified++;if(labels.digital)digital++;
        if(Date.now()-started>=maxMs)break;
      }
      if(classified){sheet.getRange(job.next,column+1,values.length,1).setNumberFormat('@').setValues(values);SpreadsheetApp.flush();invalidateNews_();}
      read=values.length;job.next+=read;
    }
    Object.assign(job,{state:job.next>job.total+1?'Completada':'En curso',updated:new Date().toISOString(),classified:job.classified+classified,digital:job.digital+digital,error:'',pausedUntil:0});writeClassificationJob_(job);
    telemetry_('clasificacion',Date.now()-started,'OK',read+' leídas; '+classified+' clasificadas; '+digital+' digitales; '+Math.min(job.total,job.next-2)+'/'+job.total+' revisadas');
  }catch(error){
    Object.assign(job,{state:'En pausa',error:String(error.message).slice(0,180),updated:new Date().toISOString(),pausedUntil:Date.now()+settings_().retryMinutes*60000});writeClassificationJob_(job);telemetry_('clasificacion',Date.now()-started,'Error',job.error);
  }
}
