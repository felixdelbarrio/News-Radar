function collectionStatus_(tasks,jobs){
  const cache=CacheService.getScriptCache();if(!tasks&&!jobs){const cached=cache.get('collection-status');if(cached)return JSON.parse(cached);}
  jobs=jobs||collectionJobs_();if(tasks)collectionSnapshots_(tasks,jobs);
  const requests=collectionRequests_().filter(request=>!jobs.some(job=>job.id===request.id));
  const ordered=jobs.slice().sort((a,b)=>b.inicio.localeCompare(a.inicio)),active=ordered.filter(job=>Number(job.pendientes)>0||job.estado==='Preparando'),selected=active.length?active:ordered.slice(0,1);
  const status={blocked:recoveryAvailability(jobs,requests),total:0,processed:0,pending:0,skipped:0,failed:0,added:0,lastActivity:'',queued:requests.length,jobs:[]};
  for(const job of selected){
    for(const [key,column] of [['total','total'],['processed','procesadas'],['pending','pendientes'],['skipped','omitidas'],['failed','fallidas'],['added','nuevas']])status[key]+=Number(job[column]||0);
    if(job.actualizada>status.lastActivity)status.lastActivity=job.actualizada;
  }
  status.jobs=[...active,...ordered.filter(job=>!active.includes(job)).slice(0,10)].map(({row,...job})=>job)
    .concat(requests.map(request=>({id:request.id,tipo:request.kind,desde:request.range.from,hasta:request.range.to,inicio:request.created,estado:'En cola',total:0,procesadas:0,pendientes:0,omitidas:0,fallidas:0,nuevas:0})));
  cacheJson_('collection-status',status,15);return status;
}
function resumeCollection(){authorize_(true);ensureBackgroundWorker_();return {...collectionStatus_(),added:0,errors:[],notice:'Continuación en cola.'};}
function collectNow(mode='today'){
  authorize_(true);const now=new Date(),range=collectionRange_(mode,now),blocked=recoveryAvailability(collectionJobs_(),collectionRequests_());
  if(blocked[mode])throw Error(mode==='year'?'Ya hay una recuperación anual en curso.':'Ya hay una recuperación diaria en curso.');
  if(mode==='today')requestDailyCollection_(now);else requestCollection_('annual',range);
  return {...collectionStatus_(),added:0,errors:[],notice:mode==='year'?'Recuperación anual en cola.':'Recuperación diaria en cola.'};
}
function requestDailyCollection_(now=new Date()){requestCollection_('daily',collectionRecentRange_(now));}
function dailyRadar_(){requestDailyCollection_();backgroundTick_();}
function collectionBatch_({tasks,pending,jobs,known:knownIndex}){
  const started=Date.now(),news=[],audit=[],errors=[],newTasks=[];let evaluated=0,relevant=0,digital=0,duplicated=0,excluded=0,saturated=0,queued;
  try{
    if(!pending.length){
      const previous=new Map(jobs.map(job=>[job.id,JSON.stringify(job)]));collectionSnapshots_(tasks,jobs);
      const changed=jobs.filter(job=>previous.get(job.id)!==JSON.stringify(job));for(const job of changed)writeCollectionJob_(job);if(changed.length)SpreadsheetApp.flush();
      return {...collectionStatus_(tasks,jobs),added:0,evaluated:0,errors:[]};
    }
    const feeds=collectionFeedIndex_(),known=knownIndex||knownUrls_(),now=new Date(),updates=tasks.map(task=>[task.estado,task.intentos,task.actualizada,task.evaluadas,task.nuevas,task.error]);
    const jobIndex=new Map(jobs.map(job=>[job.id,job]));
    const affected=new Set(pending.map(task=>task.ciclo));for(const job of jobs)if(affected.has(job.id)){job.estado='En curso';writeCollectionJob_(job);}
    CacheService.getScriptCache().remove('collection-status');SpreadsheetApp.flush();
    const work=pending.map(task=>({task,feed:collectionTaskFeed_(task,feeds,jobRange_(jobIndex.get(task.ciclo)))})),fetchStart=Date.now();
    const responses=fetchFeedBatch_(work.filter(item=>item.feed).map(item=>item.feed));
    const fetchMs=Date.now()-fetchStart,processingStarted=Date.now();let responseIndex=0;
    for(const {task,feed} of work){
      const attempts=Number(task.intentos)+1;let status='Completada',count=0,added=0,error='';
      try{
        if(!feed){status='Omitida';audit.push([task.ciclo,now.toISOString(),task.fuente,task.url,status,'Fuente desactivada o eliminada']);}
        else{const response=responses[responseIndex++];if(response.error)throw response.error;
          const result=ingestFeed_(feed,known,task.ciclo,now,response.response);news.push(...result.news);audit.push(...result.audit);count=result.evaluated;added=result.news.length;evaluated+=count;
          relevant+=result.relevant||0;digital+=result.digital||0;duplicated+=result.duplicated||0;excluded+=result.excluded||0;
          if(result.saturated){saturated++;
            const split=splitCollectionFeed_(feed);queued=queued||new Set(rows_('Recopilacion',undefined,3).map(row=>row.ciclo+'|'+row.url));
            for(const child of split)if(!queued.has(task.ciclo+'|'+child.url)&&!newTasks.some(row=>row[0]===task.ciclo&&row[2]===child.url))newTasks.push([task.ciclo,child.name,child.url,'Pendiente',0,'',0,0,'',child.range.to]);
            audit.push([task.ciclo,now.toISOString(),feed.name,feed.url,'Cobertura parcial',split.length?'Consulta saturada; dividida en dos períodos menores':'Consulta diaria saturada; el proveedor puede omitir publicaciones']);
          }}
      }catch(e){error=String(e.message).slice(0,180);status=(e.retryable||/HTTP (429|5\d\d)/.test(error))&&attempts<3?'Reintento programado':'Error';errors.push(task.fuente+': '+error);audit.push([task.ciclo,now.toISOString(),task.fuente,task.url,status,error]);}
      updates[task.row-2]=[status,attempts,now.toISOString(),count,added,error];
      Object.assign(tasks[task.row-2],{estado:status,actualizada:now.toISOString(),nuevas:added});
    }
    const processingMs=Date.now()-processingStarted,writeStarted=Date.now();
    append_('Noticias',news);let sorted=false;
    append_('Auditoria',audit);append_('Recopilacion',newTasks);
    writeCollectionTasks_(pending,updates);
    if((news.length||tasks.some(task=>Number(task.nuevas)>0))&&!newTasks.length&&updates.every(row=>!['Pendiente','Reintento programado'].includes(row[0]))){const sheet=book_().getSheetByName('Noticias'),count=sheet.getLastRow()-1;if(count>1){if(properties_().getProperty('CLASSIFICATION_JOB'))requestNewsClassification_(true);sheet.getRange(2,1,count,RADAR.sheets.Noticias.length).sort({column:2,ascending:true});sorted=true;}}
    SpreadsheetApp.flush();if(news.length||sorted)invalidateNews_();
    append_('Ejecuciones',[...affected].map(id=>{const batch=pending.filter(task=>task.ciclo===id),rows=batch.map(task=>updates[task.row-2]),failures=rows.map(row=>row[5]).filter(Boolean);return [id,now.toISOString(),new Date().toISOString(),failures.length?'Parcial':'Completada',batch.length,rows.reduce((sum,row)=>sum+Number(row[3]),0),rows.reduce((sum,row)=>sum+Number(row[4]),0),failures.join(' | ')];}));
    for(const job of jobs)if(pending.filter(task=>task.ciclo===job.id&&updates[task.row-2][5]).length>=2)job.pausa=String(Date.now()+settings_().pauseMinutes*60000);
    tasks.push(...newTasks.map(row=>({ciclo:row[0],estado:row[3],nuevas:row[7]})));
    collectionSnapshots_(tasks,jobs);for(const job of jobs)if(affected.has(job.id))writeCollectionJob_(job);
    SpreadsheetApp.flush();const collection=collectionStatus_(null,jobs);
    telemetry_('recopilacion',Date.now()-started,errors.length?'Parcial':'OK',pending.length+' fuentes; '+news.length+' nuevas; '+evaluated+' recuperadas; '+relevant+' relevantes; '+news.length+' clasificadas; '+digital+' digitales; '+duplicated+' duplicadas; '+excluded+' excluidas; '+saturated+' saturadas; '+errors.length+' fallidas; preparación '+(fetchStart-started)+' ms; red '+fetchMs+' ms; proceso '+processingMs+' ms; escritura '+(Date.now()-writeStarted)+' ms');
    return {...collection,added:news.length,evaluated,errors};
  }catch(error){telemetry_('recopilacion',Date.now()-started,'Error',error.message);throw error;}
}
function retryCollectionErrors() {
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const tasks=rows_('Recopilacion');let count=0;
    const values=tasks.map(task=>{if(task.estado==='Error'){task.estado='Pendiente';task.intentos=0;task.error='';count++;}return [task.estado,task.intentos,task.actualizada,task.evaluadas,task.nuevas,task.error];});
    if(count){book_().getSheetByName('Recopilacion').getRange(2,4,values.length,6).setNumberFormat('@').setValues(values.map(row=>row.map(safeCell_)));ensureBackgroundWorker_();}
    const jobs=collectionJobs_();for(const job of jobs)job.pausa='';collectionSnapshots_(tasks,jobs);for(const job of jobs)writeCollectionJob_(job);
    CacheService.getScriptCache().remove('collection-status');
    return count+' fuentes preparadas para reintentar.';
  }finally{lock.releaseLock();}
}

function writeCollectionTasks_(pending,updates){
  const sheet=book_().getSheetByName('Recopilacion');let start=0;
  for(let end=1;end<=pending.length;end++){
    if(end<pending.length&&pending[end].row===pending[end-1].row+1)continue;
    const group=pending.slice(start,end);sheet.getRange(group[0].row,4,group.length,6).setNumberFormat('@').setValues(group.map(task=>updates[task.row-2].map(safeCell_)));start=end;
  }
}

function collectionWork_(started){
  const sheet=book_().getSheetByName('Recopilacion'),count=sheet.getLastRow()-1,keys=RADAR.sheets.Recopilacion.slice(3),jobs=collectionJobs_(),jobIndex=new Map(jobs.map(job=>[job.id,job]));
  const cycles=count>0?sheet.getRange(2,1,count,1).getDisplayValues():[];
  const tasks=count>0?sheet.getRange(2,4,count,7).getDisplayValues().map((row,index)=>({...Object.fromEntries(keys.map((key,i)=>[key,row[i]])),ciclo:cycles[index][0]})):[];
  const retryMs=settings_().retryMinutes*60000,batch=settings_().collectionBatch;
  const eligible=tasks.map((task,index)=>({...task,row:index+2})).filter(task=>jobIndex.has(task.ciclo)&&Number(jobIndex.get(task.ciclo).pausa||0)<=started&&(task.estado==='Pendiente'||(task.estado==='Reintento programado'&&started-Date.parse(task.actualizada)>=retryMs)))
    .sort((a,b)=>a.prioridad===b.prioridad?a.row-b.row:a.prioridad>b.prioridad?-1:1);
  const selected=eligible.find(task=>jobIndex.get(task.ciclo).tipo==='daily')||eligible[0],size=selected&&jobIndex.get(selected.ciclo).tipo==='annual'?Math.min(20,batch*4):batch;
  const pending=selected?eligible.filter(task=>task.ciclo===selected.ciclo).slice(0,size).sort((a,b)=>a.row-b.row):[];
  let start=0;
  for(let end=1;end<=pending.length;end++){
    if(end<pending.length&&pending[end].row===pending[end-1].row+1)continue;
    const group=pending.slice(start,end),sources=sheet.getRange(group[0].row,2,group.length,2).getDisplayValues();
    group.forEach((task,index)=>Object.assign(task,{fuente:sources[index][0],url:sources[index][1]}));start=end;
  }
  return {tasks,pending,jobs};
}
