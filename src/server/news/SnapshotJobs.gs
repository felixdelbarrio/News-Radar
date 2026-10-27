// Persist the completion barrier with the job; publication failure leaves it visibly incomplete.
function snapshotJob_(key,job){
  if(job.state!=='Completada'&&job.state!=='Publicando'){const pending=JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]').filter(value=>value!==key);if(pending.length)properties_().setProperty('SNAPSHOT_JOBS',JSON.stringify(pending));else properties_().deleteProperty('SNAPSHOT_JOBS');}
  if(job.state!=='Completada'||job.total===0&&!(key==='TAXONOMY_JOB'&&job.model))return job;
  const pending=JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]');if(!pending.includes(key))pending.push(key);
  properties_().setProperty('SNAPSHOT_JOBS',JSON.stringify(pending));requestDashboardSnapshots_(true);return {...job,state:'Publicando'};
}
function snapshotJobsPending_(){return llmJob_()?.state==='Publicando'||JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]').length>0;}
function completeSnapshotJobs_(){
  const p=properties_(),pending=JSON.parse(p.getProperty('SNAPSHOT_JOBS')||'[]');
  for(const key of pending){const job=JSON.parse(p.getProperty(key)||'null');if(job?.state==='Publicando')p.setProperty(key,JSON.stringify({...job,state:'Completada',error:'',published:new Date().toISOString()}));}
  p.deleteProperty('SNAPSHOT_JOBS');
  for(const job of collectionJobs_())if(job.estado==='Publicando'){p.deleteProperty('PUBLICATION_RETRY:'+job.id);if(job.tipo==='daily'&&p.getProperty('MAINTENANCE_DAY')!==recordDay(new Date(),settings_().timezone))p.setProperty('MAINTENANCE_REQUEST',recordDay(new Date(),settings_().timezone));job.estado=Number(job.fallidas)>0?'Parcial':'Completada';job.fin=new Date().toISOString();writeCollectionJob_(job);}
  compactCollectionTasks_();CacheService.getScriptCache().remove('collection-status');

}

function recordSnapshotFailure_(error){
  const p=properties_(),message=String(error.message||error).slice(0,180),keys=JSON.parse(p.getProperty('SNAPSHOT_JOBS')||'[]');
  for(const key of keys){const job=JSON.parse(p.getProperty(key)||'null');if(job?.state==='Publicando')p.setProperty(key,JSON.stringify({...job,error:message}));}
  telemetry_('dashboard-snapshot',0,'Error',message);
}


// Retry only the publication phase. Durable processing cursors and isolated tables survive.
function recoverBackgroundJobs_(now=Date.now()){
 const p=properties_(),values=p.getProperties(),build=JSON.parse(values.DASHBOARD_SNAPSHOT_BUILD||'null');let recovered=false;
 const validPause=value=>Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=now+86400000;
 for(const [key,value] of Object.entries(values)){
  if(!/_JOB$/.test(key))continue;
  let job;try{job=JSON.parse(value);}catch(_){continue;}if(!job||typeof job!=='object')continue;
  let changed=false;
  if(job.pausedUntil!=null&&!validPause(job.pausedUntil)){job.pausedUntil=0;changed=true;}
  const progress=Date.parse([build?.updated,job.publicationRetriedAt,job.updated,job.started].filter(Boolean).sort().at(-1)||'');
  if(job.state==='Publicando'&&(!Number.isFinite(progress)||now-progress>600000)){
   if(Number(job.publicationRetries||0)>=3){const error='Publicación sin progreso tras tres recuperaciones; revisión necesaria.';if(job.error!==error){job.error=error;p.setProperty(key,JSON.stringify(job));}continue;}
   job.publicationRetries=Number(job.publicationRetries||0)+1;job.publicationRetriedAt=new Date(now).toISOString();changed=true;recovered=true;
   telemetry_('supervisor',0,'Recuperación',key+': publicación sin progreso; reintento desde los cursores guardados');
  }
  if(changed)p.setProperty(key,JSON.stringify(job));
 }
 for(const job of collectionJobs_()){
  let changed=false;if(job.pausa&&!validPause(job.pausa)){job.pausa=0;changed=true;}
  const retryKey='PUBLICATION_RETRY:'+job.id,retry=JSON.parse(values[retryKey]||'{}'),progress=Date.parse([build?.updated,retry.at,job.actualizada,job.inicio].filter(Boolean).sort().at(-1)||'');
  if(job.estado==='Publicando'&&(!Number.isFinite(progress)||now-progress>600000)){if(Number(retry.count||0)>=3){if(!retry.error){retry.error='Publicación sin progreso tras tres recuperaciones; revisión necesaria.';p.setProperty(retryKey,JSON.stringify(retry));telemetry_('supervisor',0,'Error',job.id+': '+retry.error);}continue;}p.setProperty(retryKey,JSON.stringify({count:Number(retry.count||0)+1,at:new Date(now).toISOString()}));job.actualizada=new Date(now).toISOString();changed=true;recovered=true;telemetry_('supervisor',0,'Recuperación',job.id+': reintento de publicación');}
  if(changed)writeCollectionJob_(job);
 }
 for(const key of ['CATALOG_SYNC_RETRY_AT','FETCH_PAUSED_UNTIL','NEWSLETTER_NEXT','TRANSLATION_PAUSED_UNTIL'])if(values[key]&&!validPause(values[key]))p.deleteProperty(key);
 if(recovered){p.deleteProperty('DASHBOARD_SNAPSHOT_BUILD');p.setProperty('DASHBOARD_SNAPSHOT_REQUEST','ready');p.setProperty('DASHBOARD_SNAPSHOT_REQUESTED_AT',String(now));p.deleteProperty('BACKGROUND_NEXT');}
 progressContextMemory_=undefined;return recovered;
}
