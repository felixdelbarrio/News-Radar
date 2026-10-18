function businessNews_(row){
  const labels=row.etiquetas||savedNewsLabels_(row.clasificacion);
  return labels.digital&&labels.capacidades.some(name=>name.startsWith('Empresas: '));
}
function newsLabels_(assessment){
  const state=assessment.relevant?'relevante':assessment.excluded||assessment.editorial?'no relevante':'indeterminado';
  return {digital:assessment.relevant,capacidades:[...new Set(assessment.capabilities.map(row=>row.segment+': '+row.name))],schema:1,version:CLASSIFICATION_WORK.rulesVersion,revision:newsClassificationRevision_(),estado:state,segmento:assessment.business?sectorNewsDefaults.segment:'indeterminado',segmentos:assessment.relevant||assessment.business?[sectorNewsDefaults.segment]:[],canal:assessment.channel?'digital':'indeterminado',evento:assessment.signals.includes(INCIDENT_SIGNAL)?INCIDENT_SIGNAL:assessment.signals[0]||'indeterminado',senales:assessment.excluded?[]:assessment.signals,score:assessment.score,evidencia:assessment.evidence};
}
function savedNewsLabels_(value){
  if(!value)return {digital:false,capacidades:[]};
  try{const labels=JSON.parse(value);return {...labels,digital:labels.digital===true,capacidades:Array.isArray(labels.capacidades)?labels.capacidades:[],...(typeof labels.canonicalId==='string'?{canonicalId:labels.canonicalId}:{})};}
  catch(_){return {digital:false,capacidades:[]};}
}
let classificationRevisionMemory_;
function newsClassificationRevision_(){const config=configuration_();if(classificationRevisionMemory_?.config===config)return classificationRevisionMemory_.revision;const revision=classificationRulesRevision_(config);classificationRevisionMemory_={config,revision};return revision;}
function classificationRulesRevision_(config=configuration_()){return sha256_(JSON.stringify([CLASSIFICATION_WORK.rulesVersion,config.capabilities,config.taxonomy.flatMap(block=>block.functions),config.relevanceRules,config.signals,config.entities,config.segments,config.geographies,config.feeds.map(({name,country,url})=>({name,country,url}))]));}
function classificationJob_(){const raw=properties_().getProperty('CLASSIFICATION_JOB');return raw?JSON.parse(raw):null;}
function classificationPending_(){const job=classificationJob_();return Boolean(job&&job.state!=='Completada');}
function classificationReadyAt_(){const job=classificationJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeClassificationJob_(job){progressContextMemory_=undefined;properties_().setProperty('CLASSIFICATION_JOB',JSON.stringify(snapshotJob_('CLASSIFICATION_JOB',job)));}
function requestNewsClassification_(force=false){
  const job=classificationJob_();if(!force&&job?.version===CLASSIFICATION_WORK.rulesVersion)return;
  pruneNewsGenerations_();
  const now=new Date(),source=newsStorageKey_(),target='Noticias_class_'+Utilities.getUuid(),total=Math.max(0,newsSheet_().getLastRow()-1);
  if(total)generationSheet_(target,RADAR.sheets.Noticias);
  writeClassificationJob_({source,taxonomySource:taxonomyStorageKey_(),target:total?target:null,corpus:properties_().getProperty('NEWS_CONTENT_REVISION')||'0',next:2,cursor:null,total,revision:classificationRulesRevision_(),version:CLASSIFICATION_WORK.rulesVersion,state:total?'Pendiente':'Completada',started:now.toISOString(),updated:now.toISOString(),day:recordDay(now,settings_().timezone),classified:0,digital:0});
  if(total)ensureBackgroundWorker_();
}
function drainClassificationRequest_(){
  const p=properties_(),day=p.getProperty('CLASSIFICATION_REQUEST');if(!day)return;
  const job=classificationJob_();if(job?.day===day&&job.total===Math.max(0,newsSheet_().getLastRow()-1)){p.deleteProperty('CLASSIFICATION_REQUEST');return;}
  if(classificationPending_())return;
  requestNewsClassification_(true);p.deleteProperty('CLASSIFICATION_REQUEST');
}
function getClassificationStatus(){
  authorize_(true);const job=classificationJob_(),queued=Boolean(properties_().getProperty('CLASSIFICATION_REQUEST'));
  return {newsRevision:publishedNewsRevision_(),queued,scheduled:dailyScheduleStatus_(),timezone:settings_().timezone,job:withJobProgress_('classification',job?{...job,processed:Math.min(job.total,job.next-2)}:null,queued)};
}
function startClassification(){
  authorize_(true);return withForegroundWrite_(()=>{
    if(!classificationPending_())requestNewsClassification_(true);
    else{const job=classificationJob_();if(job.state==='En pausa'){job.state='Pendiente';job.pausedUntil=0;writeClassificationJob_(job);}ensureBackgroundWorker_();}
    return getClassificationStatus();
  });
}
function newsClassificationBatch_(maxMs=CLASSIFICATION_WORK.maxMs){
  const job=classificationJob_();if(!job||['Completada','Publicando'].includes(job.state))return;
  const started=Date.now();let read=0,classified=0,digital=0;
  try{
    const keys=RADAR.sheets.Noticias,revision=classificationRulesRevision_();
    if(job.revision!==revision||job.taxonomySource!==taxonomyStorageKey_()||job.source!==newsStorageKey_()||job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')){requestNewsClassification_(true);return;}
    const rows=newsWorkRows_(job,CLASSIFICATION_WORK.batchRows),staged=[];let countriesChanged=0,cursor=job.cursor;
    for(const row of rows){
      if(Date.now()-started>=maxMs||backgroundPaused_(true)||read%20===0&&properties_().getProperty('DAILY_PIPELINE_REQUEST'))break;
      const saved=savedNewsLabels_(row.clasificacion),labels={...classification_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).labels,...(saved.canonicalId?{canonicalId:saved.canonicalId}:{}),...(saved.procedencia?{procedencia:saved.procedencia}:{})},value=JSON.stringify(labels),country=newsCountry_(row);
      if(value!==row.clasificacion)classified++;
      if(country!==row.pais)countriesChanged++;
      staged.push({row:row._sheetRow,values:keys.map(key=>key==='clasificacion'?value:key==='pais'?country:key==='taxonomia'?JSON.stringify(taxonomyRecord_(row.titular,row.extracto)):row[key])});
      if(labels.digital)digital++;cursor=newsWorkCursor_(row);read++;
    }
    const targetSheet=book_().getSheetByName(job.target);writeStagedNewsRows_(targetSheet,staged);
    job.cursor=cursor;job.next+=read;
    if(job.next>job.total+1){if(targetSheet.getLastRow()-1!==job.total)throw Error('Generación de clasificación incompleta.');invalidateNews_(false);}
    Object.assign(job,{state:job.next>job.total+1?'Completada':'En curso',updated:new Date().toISOString(),countriesChanged:(job.countriesChanged||0)+countriesChanged,classified:job.classified+classified,digital:job.digital+digital,error:'',pausedUntil:0});writeClassificationJob_(job);if(job.state==='Completada')requestDashboardSnapshots_(true);
    telemetry_('clasificacion',Date.now()-started,'OK',read+' leídas; '+classified+' clasificadas; '+digital+' digitales; '+Math.min(job.total,job.next-2)+'/'+job.total+' revisadas');
  }catch(error){
    Object.assign(job,{state:'En pausa',error:String(error.message).slice(0,180),updated:new Date().toISOString(),pausedUntil:Date.now()+(serviceQuotaPause_(error)||settings_().retryMinutes*60000)});writeClassificationJob_(job);telemetry_('clasificacion',Date.now()-started,'Error',job.error);
  }
}
