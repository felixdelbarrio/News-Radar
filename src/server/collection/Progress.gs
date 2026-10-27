let progressContextMemory_;
const PROGRESS_JOB_NAMES=Object.freeze({archive:'Archivado de logs',snapshot:'Publicación de snapshots',daily:'Recopilación diaria',classification:'Clasificación de noticias',translation:'Traducción de noticias',newsletter:'Envíos de newsletters planificadas',taxonomy:'Catálogo global de funcionalidades',taxonomyTranslation:'Traducción de catálogo global de funcionalidades',maintenance:'Mantenimiento incremental'});
function progressContext_(jobs){
  if(progressContextMemory_)return progressContextMemory_;
  const p=properties_().getProperties(),now=Date.now(),collection=jobs||collectionJobs_(),classification=p.CLASSIFICATION_JOB?JSON.parse(p.CLASSIFICATION_JOB):null,translation=p.TRANSLATION_JOB?JSON.parse(p.TRANSLATION_JOB):null,taxonomy=p.TAXONOMY_JOB?JSON.parse(p.TAXONOMY_JOB):null,taxonomyTranslation=p.TAXONOMY_TRANSLATION_JOB?JSON.parse(p.TAXONOMY_TRANSLATION_JOB):null,unfinished=job=>Boolean(job&&job.state!=='Completada'&&!publicationNeedsReview_(job));
  const ready=job=>unfinished(job)&&Number(job.pausedUntil||0)<=now,daily=Boolean(dailyPipelineRequested_()||collectionRequests_().some(job=>job.kind==='daily')||collection.some(job=>job.tipo==='daily'&&(Number(job.pendientes)>0||job.estado==='Preparando'))),classifying=Boolean(!publicationNeedsReview_(classification)&&(p.CLASSIFICATION_REQUEST||unfinished(classification))),translationQuota=Math.max(Number(p.TRANSLATION_PAUSED_UNTIL||0),[translation,taxonomyTranslation].reduce((sum,job)=>sum+(job?.callDay===recordDay(new Date(now),settings_().timezone)?Number(job.calls||0):0),0)>=TRANSLATION_WORK.dailyCalls?nextDailyReset(now,settings_().timezone):0),translating=Boolean(p.DAILY_TRANSLATION_REQUEST||p.TRANSLATION_PRIORITY_REQUEST||translation?.businessPending>0),newsletter=Boolean(p.NEWSLETTER_REQUEST&&settings_().newsletterEnabled),analyzing=Boolean(!publicationNeedsReview_(taxonomy)&&(p.TAXONOMY_REQUEST||unfinished(taxonomy)));
  return progressContextMemory_={p,now,snapshots:snapshotPublicationPending_({jobs:collection}),classificationPublishing:classification?.state==='Publicando',taxonomyReady:taxonomyPublicationReady_(),daily,classifying,translating,newsletter,analyzing,translationQuota,resumeAt:{daily:Math.max(Number(p.FETCH_PAUSED_UNTIL||0),...collection.filter(job=>job.tipo==='daily'&&Number(job.pendientes)>0).map(job=>Number(job.pausa||0))),classification:Number(classification?.pausedUntil||0),translation:Math.max(translationQuota,Number(translation?.pausedUntil||0)),newsletter:Math.max(Number(p.NEWSLETTER_NEXT||0),Number(p.NEWSLETTER_QUOTA_UNTIL||0)),taxonomy:Number(taxonomy?.pausedUntil||0),taxonomyTranslation:Math.max(translationQuota,Number(taxonomyTranslation?.pausedUntil||0))},ready:{classification:!publicationNeedsReview_(classification)&&(Boolean(p.CLASSIFICATION_REQUEST)||ready(classification)),translation:!publicationNeedsReview_(translation)&&translationQuota<=now&&(Boolean(p.TRANSLATION_PRIORITY_REQUEST)||ready(translation)),newsletter:newsletter&&Math.max(Number(p.NEWSLETTER_NEXT||0),Number(p.NEWSLETTER_QUOTA_UNTIL||0))<=now,taxonomy:!publicationNeedsReview_(taxonomy)&&(Boolean(p.TAXONOMY_REQUEST)||ready(taxonomy)),taxonomyTranslation:!publicationNeedsReview_(taxonomyTranslation)&&translationQuota<=now&&(Boolean(p.TAXONOMY_TRANSLATION_REQUEST)||ready(taxonomyTranslation))}};
}
function progressBlockingJob_(stage,context){
  const c=context;if(stage==='daily')return '';
  if(c.daily)return 'daily';
  if(stage==='classification')return c.classificationPublishing?'snapshot':'';
  if(stage==='snapshot')return c.classifying&&!c.classificationPublishing?'classification':!c.taxonomyReady?'taxonomy':'';
  if(c.classifying)return 'classification';
  if(stage==='newsletter')return snapshotPublicationPending_()?'snapshot':'';
  if(c.snapshots&&!['taxonomy','snapshot'].includes(stage))return 'snapshot';
  if(c.ready.newsletter)return 'newsletter';
  if(stage!=='translation'&&c.ready.translation)return 'translation';
  if(stage==='taxonomyTranslation'&&c.analyzing)return 'taxonomy';
  if(stage==='maintenance'&&c.ready.taxonomy)return 'taxonomy';
  if(stage==='maintenance'&&c.ready.taxonomyTranslation)return 'taxonomyTranslation';return '';
}
function jobProgressState_(stage,job={},options={}){
  const c=progressContext_(options.jobs),{p,now}=c,ownPause=Number(options.pausedUntil??job.pausedUntil??0),quotaUntil=['translation','taxonomyTranslation'].includes(stage)?c.translationQuota:stage==='daily'?Number(p.FETCH_PAUSED_UNTIL||0):Number(options.quotaUntil||0),effectiveQuota=Math.max(quotaUntil,serviceQuotaPause_(job.error)&&ownPause>now?ownPause:0),running=p.BACKGROUND_ACTIVE===stage&&Number(p.BACKGROUND_ACTIVE_UNTIL)>now&&(!Object.hasOwn(options,'jobId')||Boolean(options.jobId)&&p.BACKGROUND_COLLECTION_JOB===options.jobId)||stage==='newsletter'&&Number(p.NEWSLETTER_RUNNING_UNTIL)>now;
  if(job.state==='Revisar')return progressState({state:'Revisar',lastExecutedAt:options.lastExecutedAt??job.updated??'',error:job.error||''},now);
  const blocker=progressBlockingJob_(stage,c),queued=options.queued||job.state==='En curso'&&!running;return progressState({state:job.state==='En curso'&&!running?'Pendiente':job.state,queued,running,lastExecutedAt:options.lastExecutedAt??p['JOB_LAST_EXECUTED:'+stage]??job.updated??'',pausedUntil:ownPause,quotaUntil:effectiveQuota,nextAt:Math.max(Number(p.BACKGROUND_NEXT||0),Number(c.resumeAt[blocker]||0)),waitingFor:PROGRESS_JOB_NAMES[blocker]||'',error:job.error||''},now);
}

function withJobProgress_(stage,job,queued=false){if(!job&&!queued)return null;const value=job||{state:'En cola',total:0,processed:0,translated:0,updated:''};return {...value,progress:jobProgressState_(stage,value,{queued})};}
