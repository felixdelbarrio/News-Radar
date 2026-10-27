function collectionRequests_(){
  return Object.entries(properties_().getProperties()).filter(([key])=>key.startsWith('COLLECTION_REQUEST:')).map(([key,value])=>({key,value,...JSON.parse(value)}));
}
function requestCollection_(kind,range){
  const id=kind==='daily'?'daily/'+range.to+'/'+Utilities.getUuid():Utilities.getUuid(),request={id,kind,range,created:new Date().toISOString()};
  properties_().setProperty('COLLECTION_REQUEST:'+sha256_(kind+'|'+range.from+'|'+range.to),JSON.stringify(request));
  CacheService.getScriptCache().remove('collection-status');ensureBackgroundWorker_();return id;
}
function collectionJobs_(){return rows_('Recargas').map((job,index)=>({...job,row:index+2}));}
function writeCollectionJob_(job){
  book_().getSheetByName('Recargas').getRange(job.row,1,1,RADAR.sheets.Recargas.length).setNumberFormat('@').setValues([RADAR.sheets.Recargas.map(key=>safeCell_(job[key]??''))]);
}
function jobRange_(job){return {from:job.desde,to:job.hasta};}
function drainCollectionRequests_(){
  const requests=collectionRequests_().sort((a,b)=>(b.kind==='daily')-(a.kind==='daily'));if(!requests.length)return;
  const jobs=collectionJobs_(),tasks=rows_('Recopilacion');
  const finished=new Set(jobs.filter(job=>['Completada','Parcial'].includes(job.estado)).map(job=>job.id));
  const existing=new Set(tasks.filter(task=>!finished.has(task.ciclo)||task.estado==='Error').map(task=>task.ciclo+'|'+task.url));
  for(const request of requests){
    let job=jobs.find(job=>job.id===request.id)||jobs.find(job=>(Number(job.pendientes)>0||job.estado==='Preparando')&&job.tipo===request.kind&&(job.desde===request.range.from&&job.hasta===request.range.to));
    if(!job){
      job={id:request.id,tipo:request.kind,desde:request.range.from,hasta:request.range.to,inicio:request.created,estado:'Preparando',total:0,procesadas:0,pendientes:0,omitidas:0,fallidas:0,nuevas:0,actualizada:'',pausa:'',fin:'',row:book_().getSheetByName('Recargas').getLastRow()+1};
      append_('Recargas',[RADAR.sheets.Recargas.map(key=>job[key])]);jobs.push(job);SpreadsheetApp.flush();
    }
    if(job.estado==='Preparando'){
      const feeds=collectionFeeds_(jobRange_(job)),missing=feeds.filter(feed=>{const key=job.id+'|'+feed.url;if(existing.has(key))return false;existing.add(key);return true;});
      append_('Recopilacion',missing.map(feed=>[job.id,feed.name,feed.url,'Pendiente',0,'',0,0,'',feed.range.to]));
      Object.assign(job,{estado:feeds.length?'Pendiente':'Completada',total:feeds.length,pendientes:feeds.length,fin:feeds.length?'':new Date().toISOString()});writeCollectionJob_(job);SpreadsheetApp.flush();
    }
    if(properties_().getProperty(request.key)===request.value)properties_().deleteProperty(request.key);
  }
  CacheService.getScriptCache().remove('collection-status');
}
function collectionSnapshots_(tasks,jobs,now=new Date()){
  const summaries=JSON.parse(properties_().getProperty('COLLECTION_TASK_SUMMARIES')||'{}'),counters=new Map();
  for(const task of tasks){
    let count=counters.get(task.ciclo);if(!count){count={total:0,procesadas:0,pendientes:0,omitidas:0,fallidas:0,nuevas:0,actualizada:'',...summaries[task.ciclo]};counters.set(task.ciclo,count);}
    count.total++;count.nuevas+=Number(task.nuevas||0);
    if(task.estado==='Completada')count.procesadas++;
    if(['Pendiente','Reintento programado'].includes(task.estado))count.pendientes++;
    if(task.estado==='Omitida')count.omitidas++;
    if(task.estado==='Error')count.fallidas++;
    if(task.actualizada>count.actualizada)count.actualizada=task.actualizada;
  }
  for(const job of jobs){
    const count=counters.get(job.id);if(!count||['Cancelada','Revisar'].includes(job.estado))continue;
    Object.assign(job,count,{estado:count.pendientes?(Number(job.pausa)>now.getTime()?'En pausa':'Pendiente'):count.fallidas?'Parcial':'Completada',fin:count.pendientes?'':job.fin||now.toISOString()});
    if(!count.pendientes&&dashboardSnapshotsPending_()){job.estado='Publicando';job.fin='';requestDashboardSnapshots_(true);}
  }
  return jobs;
}

function compactCollectionTasks_(){
 const jobs=collectionJobs_().filter(job=>['Completada','Parcial'].includes(job.estado)),finished=new Set(jobs.map(job=>job.id)),p=properties_(),summaries=JSON.parse(p.getProperty('COLLECTION_TASK_SUMMARIES')||'{}'),tasks=rows_('Recopilacion'),seen=new Set(),remove=[],counts=new Map();
 for(const [index,task] of tasks.entries()){
  const count=counts.get(task.ciclo)||{total:0,procesadas:0,omitidas:0,nuevas:0};count.total++;if(task.estado==='Completada')count.procesadas++;if(task.estado==='Omitida')count.omitidas++;count.nuevas+=Number(task.nuevas||0);counts.set(task.ciclo,count);
  if(!finished.has(task.ciclo)||!['Completada','Omitida'].includes(task.estado))continue;
  const key=JSON.stringify(RADAR.sheets.Recopilacion.map(key=>task[key]));if(seen.has(key))remove.push(index+2);else seen.add(key);
 }
 // Persist the authoritative counters before deletion; a retry can reconstruct summaries after a partial delete.
 const totals=jobs.map(job=>({...job}));
 if(remove.length){
  for(const job of totals){const summary=summaries[job.id]||{},count=counts.get(job.id)||{};for(const key of ['total','procesadas','omitidas','nuevas'])job[key]=Math.max(Number(job[key]||0),Number(summary[key]||0)+Number(count[key]||0));writeCollectionJob_(job);}
 }
 try{if(remove.length)deleteSheetRows_(book_().getSheetByName('Recopilacion'),remove);}
 finally{
  const retained=new Map();for(const task of remove.length?rows_('Recopilacion'):tasks){const count=retained.get(task.ciclo)||{total:0,procesadas:0,omitidas:0,nuevas:0};count.total++;if(task.estado==='Completada')count.procesadas++;if(task.estado==='Omitida')count.omitidas++;count.nuevas+=Number(task.nuevas||0);retained.set(task.ciclo,count);}
  for(const job of totals){const count=retained.get(job.id)||{total:0,procesadas:0,omitidas:0,nuevas:0},summary={actualizada:job.actualizada||''};for(const key of ['total','procesadas','omitidas','nuevas'])summary[key]=Math.max(0,Number(job[key]||0)-count[key]);if(summary.total)summaries[job.id]=summary;}
  const encoded=JSON.stringify(summaries);if(encoded!==p.getProperty('COLLECTION_TASK_SUMMARIES'))p.setProperty('COLLECTION_TASK_SUMMARIES',encoded);
  if(remove.length)CacheService.getScriptCache().remove('collection-status');
 }
 return remove.length;
}
