function eventDuration_(value){return Math.max(0,Math.min(3600000,Math.round(Number(value)||0)));}
function telemetry_(operation,duration,status,detail) {
  try{append_('Telemetria',[[new Date().toISOString(),operation,Math.max(0,Math.round(duration)),status,('v'+RADAR.version+'; '+String(detail||'')).slice(0,300)]]);}catch(error){console.warn(String(error.message||error));}
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
        const p=event.performance;
        return [now.toISOString(),'dashboard',eventDuration_(event.duration),'OK',event.view+'; RPC '+eventDuration_(p.rpcMs)+' ms; servidor '+eventDuration_(p.serverMs)+' ms; noticias '+eventDuration_(p.newsMs)+' ms; render '+eventDuration_(p.renderMs)+' ms; caché '+(p.cacheHit===true?'hit':'miss')+'; preparación '+eventDuration_(p.preparationMs)+' ms; metadatos '+eventDuration_(p.metadataMs)+' ms; caché cliente '+(p.clientCacheHit===true?'hit':'miss')+'; snapshot '+(p.snapshotHit===true?'hit':'miss')+'; RPC compartida '+(p.sharedRequest===true?'sí':'no')+'; v'+RADAR.version];
      }));
    }
    cache.put(key,'1',10);
    return {saved:true};
  } finally {lock.releaseLock();}
}
function getAdoption(query={}) {
  authorize_(true);const events=rows_('Adopcion',settings_().eventLimit),now=Date.now();
  const selected=filterRecords(events,query,['correo','vista','evento'],['correo','vista','evento','sesion'],'fecha',settings_().timezone),metrics=metrics_(selected,now),page=recordPage(metrics.users,query,ADMIN_PAGE_SIZE);
  return {...metrics,users:page.items,total:page.total,page:page.page,pageSize:page.pageSize,options:recordOptions(events,['correo','vista','evento']),retentionDays:settings_().retentionDays,limited:events.length===settings_().eventLimit};
}
function getTelemetry(query={}) {
  authorize_(true);const records=administrativeRecords_('Telemetria',query,['operacion','estado'],['operacion','estado','detalle']),usage=metrics_(rows_('Adopcion',settings_().eventLimit),Date.now());
  return {...records,rows:records.items,latencyP95:usage.latencyP95,clientErrors:usage.failures,collection:collectionStatus_()};
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
