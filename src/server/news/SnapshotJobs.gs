// Persist the completion barrier with the job; publication failure leaves it visibly incomplete.
function snapshotJob_(key,job){
  if(job.state!=='Completada'&&job.state!=='Publicando'){const pending=JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]').filter(value=>value!==key);if(pending.length)properties_().setProperty('SNAPSHOT_JOBS',JSON.stringify(pending));else properties_().deleteProperty('SNAPSHOT_JOBS');}
  if(job.state!=='Completada'||job.total===0&&!(key==='TAXONOMY_JOB'&&job.model)||!dashboardSnapshotsPending_()&&!job.target)return job;
  const pending=JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]');if(!pending.includes(key))pending.push(key);
  properties_().setProperty('SNAPSHOT_JOBS',JSON.stringify(pending));requestDashboardSnapshots_(true);return {...job,state:'Publicando'};
}
function snapshotJobsPending_(){return llmJob_()?.state==='Publicando'||JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]').length>0;}
function completeSnapshotJobs_(publishedJob=null){
  const p=properties_(),pending=JSON.parse(p.getProperty('SNAPSHOT_JOBS')||'[]');
  const remaining=[];
  for(const key of pending){const job=JSON.parse(p.getProperty(key)||'null');if(job?.target&&job.target!==publishedJob?.target){remaining.push(key);continue;}if(job?.state==='Publicando')p.setProperty(key,JSON.stringify({...job,state:'Completada',error:'',published:new Date().toISOString()}));}
  if(remaining.length){p.setProperty('SNAPSHOT_JOBS',JSON.stringify(remaining));invalidateDashboardSnapshots_();}else p.deleteProperty('SNAPSHOT_JOBS');
  for(const job of collectionJobs_())if(job.estado==='Publicando'){if(job.tipo==='daily'&&p.getProperty('MAINTENANCE_DAY')!==recordDay(new Date(),settings_().timezone))p.setProperty('MAINTENANCE_REQUEST',recordDay(new Date(),settings_().timezone));job.estado=Number(job.fallidas)>0?'Parcial':'Completada';job.fin=new Date().toISOString();writeCollectionJob_(job);}
  CacheService.getScriptCache().remove('collection-status');
}

function recordSnapshotFailure_(error){
  const p=properties_(),message=String(error.message||error).slice(0,180),keys=JSON.parse(p.getProperty('SNAPSHOT_JOBS')||'[]');
  for(const key of keys){const job=JSON.parse(p.getProperty(key)||'null');if(job?.state==='Publicando')p.setProperty(key,JSON.stringify({...job,error:message}));}
  telemetry_('dashboard-snapshot',0,'Error',message);
}

function assertSnapshotJobSource_(job){
  const changed=job.source!==(dataGeneration_().newsSheet||'Noticias')||job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')||job.total!==Math.max(0,book_().getSheetByName(job.source)?.getLastRow()-1)||job.taxonomySource&&job.taxonomySource!==(dataGeneration_().taxonomySheet||'Taxonomia')||job.rules&&job.rules!==taxonomyRulesRevision_()||job.target.startsWith('Noticias_class_')&&job.revision!==classificationRulesRevision_();
  if(changed){const error=Error('El origen o las reglas de la generación han cambiado; reiniciando el job.');error.restartJob=true;throw error;}
}
// A durable, bounded validation pass precedes construction of all three snapshots.
function validateSnapshotJob_(job){
  assertSnapshotJobSource_(job);
  const key=job.modelTarget?'TAXONOMY_JOB':job.target.startsWith('Noticias_class_')?'CLASSIFICATION_JOB':'MAINTENANCE_JOB',sheet=book_().getSheetByName(job.target);
  if(!sheet||sheet.getLastRow()-1!==job.total)throw Error('Generación incompleta.');
  taxonomySheetOverride_=job.modelTarget;let items;try{items=taxonomyCatalog_();}finally{taxonomySheetOverride_=undefined;}
  const model=taxonomyValidationIndex_(items).model;
  if(job.model&&job.model!==model)throw Error('El catálogo preparado ha cambiado.');
  const validation=job.integrity||{next:2,model,checked:0};
  if(validation.model!==model)throw Error('Generaciones mixtas durante la validación.');
  const size=Math.min(1000,job.total+2-validation.next),keys=RADAR.sheets.Noticias;
  if(size>0){
    const rows=sheet.getRange(validation.next,1,size,keys.length).getDisplayValues();
    for(const values of rows){const row=Object.fromEntries(keys.map((name,i)=>[name,values[i]]));validateTaxonomyAssignment_(taxonomySaved_(row.taxonomia),items,row.id,true,row);}
    validation.next+=rows.length;validation.checked+=rows.length;job.integrity=validation;job.error='';properties_().setProperty(key,JSON.stringify(job));
  }
  return validation.checked===job.total;
}
