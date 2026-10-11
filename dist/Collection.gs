function collectionStatus_(tasks) {
  const cache=CacheService.getScriptCache();
  if(!tasks){const cached=cache.get('collection-status');if(cached)return JSON.parse(cached);const sheet=book_().getSheetByName('Recopilacion'),count=sheet.getLastRow()-1;tasks=count>0?sheet.getRange(2,4,count,5).getDisplayValues().map(row=>({estado:row[0],nuevas:row[4]})):[];}
  const status={total:tasks.length,processed:0,pending:0,skipped:0,failed:0,added:0};
  for(const task of tasks){
    if(task.estado==='Completada')status.processed++;
    else if(['Pendiente','Reintento programado'].includes(task.estado))status.pending++;
    else if(task.estado==='Omitida')status.skipped++;
    else if(task.estado==='Error')status.failed++;
    status.added+=Number(task.nuevas||0);
  }
  cache.put('collection-status',JSON.stringify(status),15);return status;
}
function ensureCollectionTrigger_() {
  if(!ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='collectionTick_'))ScriptApp.newTrigger('collectionTick_').timeBased().everyMinutes(1).create();
}
function startCollection_(range) {
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    CacheService.getScriptCache().remove('collection-status');
    if(collectionStatus_().pending){if(range)throw Error('Hay una recuperación en curso. Espera a que termine antes de cambiar el período.');ensureCollectionTrigger_();return;}
    range=range||collectionRecentRange_(new Date());
    const cycle=Utilities.getUuid(),sheet=book_().getSheetByName('Recopilacion');
    if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,RADAR.sheets.Recopilacion.length).clearContent();
    if(range)properties_().setProperty('COLLECTION_RANGE',JSON.stringify(range));else properties_().deleteProperty('COLLECTION_RANGE');
    append_('Recopilacion',collectionFeeds_(range).map(feed=>[cycle,feed.name,feed.url,'Pendiente',0,'',0,0,'']));
    properties_().deleteProperty('COLLECTION_AFTER');CacheService.getScriptCache().remove('collection-status');ensureCollectionTrigger_();
  }finally{lock.releaseLock();}
}
function collectNow(mode='today') {authorize_(true);startCollection_(collectionRange_(mode,new Date()));return collectionTick_();}
function dailyRadar_() {maintenance_();startCollection_();collectionTick_();}
function collectionTick_() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {added:0,evaluated:0,errors:[],busy:true};
  const started=Date.now(),news=[],audit=[],errors=[],newTasks=[];let evaluated=0;
  try{
    if(started<Number(properties_().getProperty('COLLECTION_AFTER')||0))return {...collectionStatus_(),added:0,evaluated:0,errors:[],paused:true};
    const {tasks,pending}=collectionWork_(started);
    if(!pending.length){
      if(!tasks.some(task=>task.estado==='Reintento programado'))ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()==='collectionTick_').forEach(trigger=>ScriptApp.deleteTrigger(trigger));
      return {...collectionStatus_(tasks),added:0,evaluated:0,errors:[]};
    }
    const feeds=collectionFeedIndex_(),known=knownUrls_(),now=new Date(),updates=tasks.map(task=>[task.estado,task.intentos,task.actualizada,task.evaluadas,task.nuevas,task.error]);
    const work=pending.map(task=>({task,feed:collectionTaskFeed_(task,feeds)})),fetchStart=Date.now();
    const responses=fetchFeedBatch_(work.filter(item=>item.feed).map(item=>item.feed));
    const fetchMs=Date.now()-fetchStart,processingStarted=Date.now();let responseIndex=0;
    for(const {task,feed} of work){
      const attempts=Number(task.intentos)+1;let status='Completada',count=0,added=0,error='';
      try{
        if(!feed){status='Omitida';audit.push([task.ciclo,now.toISOString(),task.fuente,task.url,status,'Fuente desactivada o eliminada']);}
        else{const response=responses[responseIndex++];if(response.error)throw response.error;
          const result=ingestFeed_(feed,known,task.ciclo,now,response.response);news.push(...result.news);audit.push(...result.audit);count=result.evaluated;added=result.news.length;evaluated+=count;
          if(result.saturated){
            const split=splitCollectionFeed_(feed);
            for(const child of split)newTasks.push([task.ciclo,child.name,child.url,'Pendiente',0,'',0,0,'']);
            audit.push([task.ciclo,now.toISOString(),feed.name,feed.url,'Cobertura parcial',split.length?'Consulta saturada; dividida en dos períodos menores':'Consulta diaria saturada; el proveedor puede omitir publicaciones']);
          }}
      }catch(e){error=String(e.message).slice(0,180);status=(e.retryable||/HTTP (429|5\d\d)/.test(error))&&attempts<3?'Reintento programado':'Error';errors.push(task.fuente+': '+error);audit.push([task.ciclo,now.toISOString(),task.fuente,task.url,status,error]);}
      updates[task.row-2]=[status,attempts,now.toISOString(),count,added,error];
      Object.assign(tasks[task.row-2],{estado:status,nuevas:added});
    }
    const processingMs=Date.now()-processingStarted,writeStarted=Date.now();
    append_('Noticias',news);if(news.length)invalidateNews_();
    append_('Auditoria',audit);append_('Recopilacion',newTasks);
    writeCollectionTasks_(pending,updates);
    if(!newTasks.length&&updates.every(row=>!['Pendiente','Reintento programado'].includes(row[0]))){const sheet=book_().getSheetByName('Noticias'),count=sheet.getLastRow()-1;if(count>1){sheet.getRange(2,1,count,RADAR.sheets.Noticias.length).sort({column:2,ascending:true});invalidateNews_();}}
    append_('Ejecuciones',[[pending[0].ciclo,now.toISOString(),new Date().toISOString(),errors.length?'Parcial':'Completada',pending.length,evaluated,news.length,errors.join(' | ')]]);
    if(errors.length>=2)properties_().setProperty('COLLECTION_AFTER',String(Date.now()+settings_().pauseMinutes*60000));
    const collection=collectionStatus_(tasks.concat(newTasks.map(row=>({estado:row[3],nuevas:row[7]}))));
    telemetry_('recopilacion',Date.now()-started,errors.length?'Parcial':'OK',pending.length+' fuentes; '+news.length+' nuevas; preparación '+(fetchStart-started)+' ms; red '+fetchMs+' ms; proceso '+processingMs+' ms; escritura '+(Date.now()-writeStarted)+' ms');
    return {...collection,added:news.length,evaluated,errors};
  }catch(error){telemetry_('recopilacion',Date.now()-started,'Error',error.message);throw error;}
  finally{lock.releaseLock();}
}
function retryCollectionErrors() {
  authorize_(true);const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const tasks=rows_('Recopilacion');let count=0;
    const values=tasks.map(task=>{if(task.estado==='Error'){task.estado='Pendiente';task.intentos=0;task.error='';count++;}return [task.estado,task.intentos,task.actualizada,task.evaluadas,task.nuevas,task.error];});
    if(count){book_().getSheetByName('Recopilacion').getRange(2,4,values.length,6).setNumberFormat('@').setValues(values.map(row=>row.map(safeCell_)));ensureCollectionTrigger_();}
    properties_().deleteProperty('COLLECTION_AFTER');CacheService.getScriptCache().remove('collection-status');
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
  const sheet=book_().getSheetByName('Recopilacion'),count=sheet.getLastRow()-1,keys=RADAR.sheets.Recopilacion.slice(3);
  const tasks=count>0?sheet.getRange(2,4,count,6).getDisplayValues().map(row=>Object.fromEntries(keys.map((key,index)=>[key,row[index]]))):[];
  const pending=[],retryMs=settings_().retryMinutes*60000;
  for(let index=0;index<tasks.length&&pending.length<settings_().collectionBatch;index++){
    const task=tasks[index];
    if(task.estado==='Pendiente'||(task.estado==='Reintento programado'&&started-new Date(task.actualizada).getTime()>=retryMs))pending.push({...task,row:index+2});
  }
  let start=0;
  for(let end=1;end<=pending.length;end++){
    if(end<pending.length&&pending[end].row===pending[end-1].row+1)continue;
    const group=pending.slice(start,end),sources=sheet.getRange(group[0].row,1,group.length,3).getDisplayValues();
    group.forEach((task,index)=>Object.assign(task,{ciclo:sources[index][0],fuente:sources[index][1],url:sources[index][2]}));start=end;
  }
  return {tasks,pending};
}
