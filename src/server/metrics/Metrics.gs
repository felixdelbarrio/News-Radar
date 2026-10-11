function telemetry_(operation,duration,status,detail) {
  append_('Telemetria',[[new Date().toISOString(),operation,Math.max(0,Math.round(duration)),status,String(detail||'').slice(0,200)]]);
  trim_('Telemetria',settings_().eventLimit);
}
function recordEvents(events) {
  const session=authorize_(),now=new Date();
  if(!Array.isArray(events)||!events.length||events.length>20)throw new Error('Lote de eventos no válido.');
  const allowed=['acceso','vista','filtro','lectura','exportacion','rendimiento','error'],views=['radar','news','audit','sources','telemetry','adoption','administration','configuration','briefing','subscriptions','subscribers'];
  const cleaned=events.map(event=>{
    if(!allowed.includes(event.event)||!views.includes(event.view)||!/^[a-z0-9-]{16,80}$/i.test(event.session))throw new Error('Evento no válido.');
    if(['audit','sources','telemetry','adoption','administration','configuration'].includes(event.view)&&!session.admin)throw new Error('Vista restringida.');
    return [now.toISOString(),session.email,event.session,event.event,event.view,Math.max(0,Math.min(3600000,Math.round(Number(event.duration)||0)))];
  });
  const lock=LockService.getScriptLock();if(!lock.tryLock(3000))return {saved:false};
  try {
    const cache=CacheService.getScriptCache(),key='events:'+session.email+':'+events[0]?.session;
    if(cache.get(key))return {saved:false};
    pruneEvents_();append_('Adopcion',cleaned);trim_('Adopcion',settings_().eventLimit);
    const timings=events.filter(event=>event.event==='rendimiento'&&event.performance);
    if(timings.length){
      append_('Telemetria',timings.map(event=>{
        const bounded=value=>Math.max(0,Math.min(3600000,Math.round(Number(value)||0))),p=event.performance;
        return [now.toISOString(),'dashboard',bounded(event.duration),'OK',event.view+'; RPC '+bounded(p.rpcMs)+' ms; servidor '+bounded(p.serverMs)+' ms; noticias '+bounded(p.newsMs)+' ms; render '+bounded(p.renderMs)+' ms; caché '+(p.cacheHit===true?'hit':'miss')];
      }));trim_('Telemetria',settings_().eventLimit);
    }
    cache.put(key,'1',10);
    return {saved:true};
  } finally {lock.releaseLock();}
}
function getAdoption() {
  authorize_(true);const events=rows_('Adopcion',settings_().eventLimit),now=Date.now();
  return {...metrics_(events,now),retentionDays:settings_().retentionDays,limited:events.length===settings_().eventLimit};
}
function getTelemetry() {
  authorize_(true);const rows=rows_('Telemetria',100).reverse(),usage=metrics_(rows_('Adopcion',settings_().eventLimit),Date.now());
  return {rows,latencyP95:usage.latencyP95,clientErrors:usage.failures,collection:collectionStatus_()};
}
function maintenance_() {
  const lock=LockService.getScriptLock();lock.waitLock(10000);try{pruneEvents_();}finally{lock.releaseLock();}
}
function pruneEvents_() {
  const p=properties_(),today=new Date().toISOString().slice(0,10);if(p.getProperty('RETENTION_DATE')===today)return;
  const cutoff=new Date(Date.now()-settings_().retentionDays*86400000).toISOString();
  ['Adopcion','Telemetria'].forEach(name=>{
    const sheet=book_().getSheetByName(name),count=sheet.getLastRow()-1;
    if(!count)return;
    const dates=sheet.getRange(2,1,count,1).getDisplayValues();let expired=0;
    while(expired<dates.length&&dates[expired][0]<cutoff)expired++;
    if(expired)sheet.deleteRows(2,expired);
  });
  p.setProperty('RETENTION_DATE',today);
}

function exportTelemetry(){
  authorize_(true);const limit=settings_().eventLimit;
  const telemetry=rows_('Telemetria',limit),runs=rows_('Ejecuciones',limit),audit=rows_('Auditoria',limit),tasks=rows_('Recopilacion');
  const reasons=exclusionReasons_(audit);
  return {schemaVersion:1,exportedAt:new Date().toISOString(),timezone:settings_().timezone,limits:{eventLimit:limit,newsReadLimit:settings_().newsReadLimit,collectionBatch:settings_().collectionBatch},collection:{...collectionStatus_(tasks),range:collectionRangeFromStore_(),tasks},telemetry,runs,audit,exclusionReasons:reasons,auditSampling:{maxExcludedExamplesPerReason:3,totals:'motivos en los resúmenes de Fuente consultada'},limited:{telemetry:telemetry.length===limit,runs:runs.length===limit,audit:audit.length===limit},usage:metrics_(rows_('Adopcion',limit),Date.now())};
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
