// Persist the completion barrier with the job; publication failure leaves it visibly incomplete.
function snapshotJob_(key,job){
  if(job.state!=='Completada'&&job.state!=='Publicando'){const pending=JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]').filter(value=>value!==key);if(pending.length)properties_().setProperty('SNAPSHOT_JOBS',JSON.stringify(pending));else properties_().deleteProperty('SNAPSHOT_JOBS');}
  if(job.state!=='Completada'||job.total===0&&!(key==='TAXONOMY_JOB'&&job.model)||!dashboardSnapshotsPending_()&&!job.target)return job;
  const pending=JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]');if(!pending.includes(key))pending.push(key);
  properties_().setProperty('SNAPSHOT_JOBS',JSON.stringify(pending));requestDashboardSnapshots_(true);return {...job,state:'Publicando'};
}
function snapshotJobsPending_(){return JSON.parse(properties_().getProperty('SNAPSHOT_JOBS')||'[]').length>0;}
function completeSnapshotJobs_(){
  const p=properties_(),pending=JSON.parse(p.getProperty('SNAPSHOT_JOBS')||'[]');
  for(const key of pending){const job=JSON.parse(p.getProperty(key)||'null');if(job?.state==='Publicando')p.setProperty(key,JSON.stringify({...job,state:'Completada',error:'',published:new Date().toISOString()}));}
  p.deleteProperty('SNAPSHOT_JOBS');
  for(const job of collectionJobs_())if(job.estado==='Publicando'){if(job.tipo==='daily'&&p.getProperty('MAINTENANCE_DAY')!==recordDay(new Date(),settings_().timezone))p.setProperty('MAINTENANCE_REQUEST',recordDay(new Date(),settings_().timezone));job.estado=Number(job.fallidas)>0?'Parcial':'Completada';job.fin=new Date().toISOString();writeCollectionJob_(job);}
  CacheService.getScriptCache().remove('collection-status');
}

function recordSnapshotFailure_(error){
  const p=properties_(),message=String(error.message||error).slice(0,180),keys=JSON.parse(p.getProperty('SNAPSHOT_JOBS')||'[]');
  for(const key of keys){const job=JSON.parse(p.getProperty(key)||'null');if(job?.state==='Publicando')p.setProperty(key,JSON.stringify({...job,error:message}));}
  telemetry_('dashboard-snapshot',0,'Error',message);
}
