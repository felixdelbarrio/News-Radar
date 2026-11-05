function eventDuration_(value){return Math.max(0,Math.min(3600000,Math.round(Number(value)||0)));}
function telemetry_(operation,duration,status,detail) {
  try{append_('Telemetria',[[new Date().toISOString(),operation,Math.max(0,Math.round(duration)),status,('v'+RADAR.version+'; '+String(detail||'')).slice(0,operation==='recopilacion'?2000:300)]]);}catch(error){console.warn(String(error.message||error));}
}
function recordEvents(events) {
  const session=authorize_(),now=new Date();
  if(!Array.isArray(events)||!events.length||events.length>20)throw new Error('Lote de eventos no válido.');
  const administrative=['administration',...Object.keys(APPLICATION_NAVIGATION.adminViews)],allowed=['acceso','vista','filtro','lectura','exportacion','rendimiento','error'],views=[...Object.keys(APPLICATION_NAVIGATION.views),...administrative];
  const cleaned=events.map(event=>{
    if(!allowed.includes(event.event)||!views.includes(event.view)||!/^[a-z0-9-]{16,80}$/i.test(event.session))throw new Error('Evento no válido.');
    if(administrative.includes(event.view)&&!session.admin)throw new Error('Vista restringida.');
    return [now.toISOString(),session.email,event.session,event.event,event.view,eventDuration_(event.duration)];
  });
  const lock=LockService.getScriptLock();if(!lock.tryLock(3000))return {saved:false};
  try {
    const cache=CacheService.getScriptCache(),key='events:'+session.email+':'+events[0]?.session;
    if(cache.get(key))return {saved:false};
    recordNewsletterEvents_(events,session.email);append_('Adopcion',cleaned);
    const timings=events.filter(event=>event.event==='rendimiento'&&event.performance);
    if(timings.length){
      append_('Telemetria',timings.map(event=>{
        const p=event.performance,browserHit=p.clientCacheHit===true,snapshotHit=!browserHit&&p.snapshotHit===true;
        const ms=key=>eventDuration_(browserHit?0:p[key]);
        const cacheState=browserHit||snapshotHit?'n/a':p.cacheHit===true?'hit':'miss';
        const details=p.metadataDetails;
        const breakdown=!browserHit&&details?'; '+['catalog','operation','years','daily'].map(key=>key+' '+eventDuration_(details[key+'Ms'])+' ms').join('; '):'';
        return [now.toISOString(),'dashboard',eventDuration_(event.duration),'OK',event.view+'; RPC '+ms('rpcMs')+' ms; servidor '+ms('serverMs')+' ms; noticias '+ms('newsMs')+' ms; render '+eventDuration_(p.renderMs)+' ms; caché '+cacheState+'; preparación '+ms('preparationMs')+' ms; metadatos '+ms('metadataMs')+' ms; caché cliente '+(browserHit?'hit':'miss')+'; snapshot '+(browserHit?'n/a':snapshotHit?'hit':'miss')+'; RPC compartida '+(!browserHit&&p.sharedRequest===true?'sí':'no')+breakdown+'; v'+RADAR.version];
      }));
    }
    cache.put(key,'1',10);
    return {saved:true};
  } finally {lock.releaseLock();}
}
function getAdoption(query={}) {
  authorize_(true);
  const {eventLimit,timezone,retentionDays}=settings_(),newsletter=query.source==='newsletterAccess';
  const rows=rows_(newsletter?'NewsletterEventos':'Adopcion',eventLimit);
  const events=newsletter?rows.filter(row=>row.evento==='acceso'):rows;
  const fields=newsletter?['correo','edicion','cadencia']:['correo','vista','evento'];
  const selected=filterRecords(events,query,fields,[...fields,'sesion'],'fecha',timezone);
  const now=Date.now(),metrics=metrics_(selected,now),cohort=['dau','wau','mau','returning','total'].includes(query.cohort)?query.cohort:'dau',allUsers=metrics.allUsers;delete metrics.allUsers;
  const members=cohort==='total'?allUsers:metrics.users.filter(user=>cohort==='returning'?user.recentSessions>1:cohort==='mau'||Date.parse(user.last)>=now-(cohort==='dau'?1:7)*86400000),page=recordPage(members,query,ADMIN_PAGE_SIZE);
  return {...metrics,cohort,users:page.items,total:page.total,page:page.page,pageSize:page.pageSize,options:recordOptions(events,fields),retentionDays,limited:rows.length===eventLimit};
}
function exportTelemetry(){
  authorize_(true);const limit=settings_().eventLimit;
  const telemetry=rows_('Telemetria',limit),runs=rows_('Ejecuciones',limit),audit=rows_('Auditoria',limit),tasks=rows_('Recopilacion');
  const reasons=exclusionReasons_(audit);
  return {schemaVersion:1,applicationVersion:RADAR.version,exportedAt:new Date().toISOString(),timezone:settings_().timezone,limits:{eventLimit:limit,collectionBatch:settings_().collectionBatch},pipeline:{classification:classificationJob_(),translation:translationJob_(),taxonomy:taxonomyJob_(),taxonomyTranslation:taxonomyTranslationJob_(),fetchResumeAt:Number(properties_().getProperty('FETCH_PAUSED_UNTIL')||0)},collection:{...collectionStatus_(tasks),tasks},telemetry,runs,audit,exclusionReasons:reasons,auditSampling:{maxExcludedExamplesPerReason:0,totals:'motivos en los resúmenes de Fuente consultada'},limited:{telemetry:telemetry.length===limit,runs:runs.length===limit,audit:audit.length===limit},usage:metrics_(rows_('Adopcion',limit),Date.now())};
}

function exclusionReasons_(audit){
  const reasons={},summaries=new Set(),key=row=>JSON.stringify([row.ejecucion,row.fecha,row.fuente]);
  for(const row of audit){
    if(row.resultado!=='Fuente consultada')continue;
    const match=row.motivo.match(/; motivos (\{.*\})(?:; posible|$)/);if(!match)continue;
    const counts=JSON.parse(match[1]);summaries.add(key(row));
    for(const [reason,count] of Object.entries(counts))reasons[reason]=(reasons[reason]||0)+Number(count);
  }
  for(const row of audit)if(row.resultado==='Excluida'&&!summaries.has(key(row)))reasons[row.motivo]=(reasons[row.motivo]||0)+1;
  return reasons;
}
