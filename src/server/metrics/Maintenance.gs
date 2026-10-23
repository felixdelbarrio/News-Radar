const MAINTENANCE_POLICY=Object.freeze({batchRows:100,maxMs:8000});
function maintenanceJob_(){const raw=properties_().getProperty('MAINTENANCE_JOB');return raw?JSON.parse(raw):null;}
function saveMaintenanceJob_(job){job.updated=new Date().toISOString();properties_().setProperty('MAINTENANCE_JOB',JSON.stringify(snapshotJob_('MAINTENANCE_JOB',job)));}
function maintenance_(force=false){
 const previous=maintenanceJob_();if(!force&&previous&&previous.version===RADAR.version&&previous.state!=='Completada')return;
 const newsTotal=Math.max(0,newsSheet_().getLastRow()-1),candidateTotal=Math.max(0,candidateSheet_().getLastRow()-1);
 saveMaintenanceJob_({version:RADAR.version,newsTotal,candidateTotal,total:newsTotal+candidateTotal,next:2,firstRow:2,state:'Pendiente',phase:'logs',reviewed:0,corrected:0,consolidated:0,removed:0,started:new Date().toISOString()});ensureBackgroundWorker_();
}
function maintenanceReadyAt_(){const job=maintenanceJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function getMaintenanceStatus(){authorize_(true);const job=maintenanceJob_();return {job:withJobProgress_('maintenance',job?{...job,processed:job.reviewed+Math.max(0,(job.candidateNext||2)-2)}:null),active:Boolean(job&&job.state!=='Completada')};}
function compactOperationalLogs_(){
 for(const name of Object.keys(LOG_LIMITS)){const sheet=book_().getSheetByName(name);if(sheet)enforceLogLimit_(name,sheet);}
 const completed=new Set(rows_('Recargas').filter(row=>['Completada','Parcial'].includes(row.estado)).map(row=>row.id)),sheet=book_().getSheetByName('Recopilacion'),keys=RADAR.sheets.Recopilacion;
 if(sheet&&sheet.getLastRow()>1){
  const count=sheet.getLastRow()-1,cycles=sheet.getRange(2,keys.indexOf('ciclo')+1,count,1).getDisplayValues().flat(),states=sheet.getRange(2,keys.indexOf('estado')+1,count,1).getDisplayValues().flat();
  const active=new Set(cycles.filter((_,i)=>!['Completada','Cancelada','Omitida'].includes(states[i])));
  deleteSheetRows_(sheet,cycles.flatMap((cycle,index)=>completed.has(cycle)&&!active.has(cycle)?[index+2]:[]));
 }
}
function deleteSheetRows_(sheet,positions){
 const rows=[...new Set(positions)].sort((a,b)=>b-a);for(let i=0;i<rows.length;){let end=i+1;while(end<rows.length&&rows[end]===rows[end-1]-1)end++;sheet.deleteRows(rows[end-1],end-i);i=end;}
}
function deduplicateNews_(){
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,count=Math.max(0,sheet.getLastRow()-1);if(!count)return 0;
 const revision=newsClassificationRevision_(),remove=[],rows=[];
 for(const [index,values] of sheet.getRange(2,1,count,keys.length).getDisplayValues().entries()){
  const row={...Object.fromEntries(keys.map((key,i)=>[key,values[i]])),_sheetRow:index+2},labels=savedNewsLabels_(row.clasificacion),title=searchText_(row.titular),text=searchText_(row.titular+' '+row.extracto);
  const current=labels.schema===1&&labels.version===CLASSIFICATION_WORK.rulesVersion&&labels.revision===revision&&labels.contentHash===sha256_(JSON.stringify([title,text]));
  if(current&&(!labels.digital||entityKey_(row.entidad)==='Santander'&&santanderExcluded_(text)))remove.push(row._sheetRow);else rows.push(row);
 }
 const aliases=[];uniqueNews_(translationIdentityRows_(rows),aliases);remove.push(...aliases.map(alias=>rows[alias.index]._sheetRow));if(!remove.length)return 0;
 // Archived editions already contain complete frozen articles, so their IDs and content remain intact.
 deleteSheetRows_(sheet,remove);invalidateNews_();return remove.length;
}
function cleanDuplicateNews(){authorize_(true);return withForegroundWrite_(()=>({removed:deduplicateNews_()}));}
function maintenanceBatch_(maxMs=MAINTENANCE_POLICY.maxMs){
 const job=maintenanceJob_();if(!job||['Completada','Publicando'].includes(job.state)||backgroundPaused_())return;
 const started=Date.now();try{
  if(job.phase==='logs'){compactOperationalLogs_();job.phase='dedup';saveMaintenanceJob_(job);}
  if(classificationPending_()||dailyCollectionPending_())return;
  if(job.phase==='dedup'){job.removed+=deduplicateNews_();job.phase='news';job.newsTotal=Math.max(0,newsSheet_().getLastRow()-1);job.total=job.newsTotal+job.candidateTotal;}
  if(job.phase==='news'){
  const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,size=Math.min(MAINTENANCE_POLICY.batchRows,job.newsTotal-job.next+2),updates=[],items=taxonomyCatalog_();let read=0;
  const rows=size>0?sheet.getRange(job.next,1,size,keys.length).getDisplayValues():[];
  for(const values of rows){if(Date.now()-started>=maxMs||backgroundPaused_(true))break;const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),saved=savedNewsLabels_(row.clasificacion);const changed={clasificacion:JSON.stringify(saved),pais:newsCountry_(row),entidad:entityKey_(row.entidad),taxonomia:JSON.stringify(necessaryTaxonomyRecord_(row,items))};let corrected=false;for(const [key,value] of Object.entries(changed))if(value!==row[key]){updates.push({row:job.next+read,column:keys.indexOf(key)+1,value});corrected=true;}if(corrected)job.corrected++;read++;}
  writeNewsCells_(updates);if(updates.length)invalidateNews_(false);job.next+=read;job.reviewed+=read;job.state='Pendiente';if(job.next>job.newsTotal+1){job.phase='candidates';job.candidateNext=2;}
  }
  if(job.phase==='candidates'){
   const result=reclassifyCandidates_(job.candidateNext,MAINTENANCE_POLICY.batchRows,Math.max(0,maxMs-(Date.now()-started)));job.candidateNext=result.next;job.candidateTotal=result.total;job.total=job.newsTotal+result.total;job.corrected+=result.changed;job.state=result.done?'Completada':'Pendiente';
  }
  job.error='';job.pausedUntil=0;if(job.state==='Completada'){compactOperationalLogs_();compactStorageDimensions_();requestDashboardSnapshots_(true);}saveMaintenanceJob_(job);
  telemetry_('mantenimiento',Date.now()-started,'OK',job.reviewed+' revisadas; '+job.removed+' noticias compactadas');
 }catch(error){job.state='En pausa';job.error=String(error.message).slice(0,180);job.pausedUntil=Date.now()+settings_().retryMinutes*60000;saveMaintenanceJob_(job);telemetry_('mantenimiento',Date.now()-started,'Error',job.error);}
}
function drainMaintenanceRequest_(){const p=properties_(),day=p.getProperty('MAINTENANCE_REQUEST');if(!day)return;if(p.getProperty('MAINTENANCE_DAY')!==day){maintenance_();p.setProperty('MAINTENANCE_DAY',day);}p.deleteProperty('MAINTENANCE_REQUEST');}
