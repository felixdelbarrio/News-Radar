function collectionRequests_(){
  return Object.entries(properties_().getProperties()).filter(([key])=>key.startsWith('COLLECTION_REQUEST:')).map(([key,value])=>({key,value,...JSON.parse(value)}));
}
function requestCollection_(kind,range){
  const id=kind==='daily'?'daily/'+range.to+'/'+Utilities.getUuid():Utilities.getUuid(),request={id,kind,range,created:new Date().toISOString()};
  properties_().setProperty('COLLECTION_REQUEST:'+sha256_(kind+'|'+range.from+'|'+range.to),JSON.stringify(request));
  CacheService.getScriptCache().remove('collection-status');ensureBackgroundWorker_();
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
    let job=jobs.find(job=>job.id===request.id)||jobs.find(job=>(Number(job.pendientes)>0||job.estado==='Preparando')&&job.tipo===request.kind&&(request.kind==='annual'||(job.desde===request.range.from&&job.hasta===request.range.to)));
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
  const counters=new Map();
  for(const task of tasks){
    let count=counters.get(task.ciclo);if(!count){count={total:0,procesadas:0,pendientes:0,omitidas:0,fallidas:0,nuevas:0,actualizada:''};counters.set(task.ciclo,count);}
    count.total++;count.nuevas+=Number(task.nuevas||0);
    if(task.estado==='Completada')count.procesadas++;
    if(['Pendiente','Reintento programado'].includes(task.estado))count.pendientes++;
    if(task.estado==='Omitida')count.omitidas++;
    if(task.estado==='Error')count.fallidas++;
    if(task.actualizada>count.actualizada)count.actualizada=task.actualizada;
  }
  for(const job of jobs){
    const count=counters.get(job.id);if(!count)continue;
    Object.assign(job,count,{estado:count.pendientes?(Number(job.pausa)>now.getTime()?'En pausa':'Pendiente'):count.fallidas?'Parcial':'Completada',fin:count.pendientes?'':job.fin||now.toISOString()});
    if(!count.pendientes&&dashboardSnapshotsPending_()){job.estado='Publicando';job.fin='';requestDashboardSnapshots_(true);}
  }
  return jobs;
}
