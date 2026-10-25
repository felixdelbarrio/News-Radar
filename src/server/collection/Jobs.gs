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
    const count=counters.get(job.id);if(!count||job.estado==='Cancelada')continue;
    Object.assign(job,count,{estado:count.pendientes?(Number(job.pausa)>now.getTime()?'En pausa':'Pendiente'):count.fallidas?'Parcial':'Completada',fin:count.pendientes?'':job.fin||now.toISOString()});
    if(!count.pendientes&&dashboardSnapshotsPending_()){job.estado='Publicando';job.fin='';requestDashboardSnapshots_(true);}
  }
  return jobs;
}

function compactCollectionTasks_(){
 const jobs=collectionJobs_(),finished=jobs.filter(job=>job.tipo==='daily'&&['Completada','Parcial'].includes(job.estado)).sort((a,b)=>String(b.fin||b.actualizada).localeCompare(String(a.fin||a.actualizada))),keep=new Set(jobs.filter(job=>!['Completada','Parcial','Cancelada'].includes(job.estado)).map(job=>job.id)),latest=finished[0],p=properties_(),summaries=JSON.parse(p.getProperty('COLLECTION_TASK_SUMMARIES')||'{}');
 if(latest)keep.add(latest.id);for(const id of Object.keys(summaries))if(!keep.has(id))delete summaries[id];
 const tasks=rows_('Recopilacion'),remove=tasks.flatMap((task,index)=>keep.has(task.ciclo)?[]:[index+2]);
 if(latest){
  const retained=tasks.map((task,index)=>({...task,row:index+2})).filter(task=>task.ciclo===latest.id),summary={actualizada:latest.actualizada||'',total:Math.max(0,Number(latest.total)-retained.length),procesadas:Math.max(0,Number(latest.procesadas)-retained.filter(task=>task.estado==='Completada').length),omitidas:Math.max(0,Number(latest.omitidas)-retained.filter(task=>task.estado==='Omitida').length),nuevas:Math.max(0,Number(latest.nuevas)-retained.reduce((sum,task)=>sum+Number(task.nuevas||0),0))};
  let excess=Math.max(0,tasks.length-remove.length-COLLECTION_POLICY.retainedTasks);
  for(const task of retained)if(excess&&['Completada','Omitida'].includes(task.estado)){remove.push(task.row);summary.total++;summary[task.estado==='Completada'?'procesadas':'omitidas']++;summary.nuevas+=Number(task.nuevas||0);excess--;}
  if(summary.total)summaries[latest.id]=summary;
 }
 if(remove.length){deleteSheetRows_(book_().getSheetByName('Recopilacion'),remove);CacheService.getScriptCache().remove('collection-status');}
 const encoded=JSON.stringify(summaries);if(encoded!==p.getProperty('COLLECTION_TASK_SUMMARIES'))p.setProperty('COLLECTION_TASK_SUMMARIES',encoded);return remove.length;
}
