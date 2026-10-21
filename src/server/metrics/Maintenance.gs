const MAINTENANCE_TABLES=Object.freeze(['Auditoria','Telemetria','Ejecuciones','Cobertura','Adopcion','NewsletterEventos']);
const MAINTENANCE_POLICY=Object.freeze({batchRows:100,maxMs:8000});
function maintenanceJob_(){const raw=properties_().getProperty('MAINTENANCE_JOB');return raw?JSON.parse(raw):null;}
function saveMaintenanceJob_(job){job.updated=new Date().toISOString();properties_().setProperty('MAINTENANCE_JOB',JSON.stringify(snapshotJob_('MAINTENANCE_JOB',job)));}
function maintenance_(force=false){
 const previous=maintenanceJob_();if(!force&&previous&&previous.state!=='Completada')return;
 saveMaintenanceJob_({total:Math.max(0,newsSheet_().getLastRow()-1),next:2,firstRow:2,state:'Pendiente',phase:'logs',reviewed:0,corrected:0,consolidated:0,removed:0,started:new Date().toISOString()});ensureBackgroundWorker_();
}
function maintenanceReadyAt_(){const job=maintenanceJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function getMaintenanceStatus(){authorize_(true);const job=maintenanceJob_();return {job:withJobProgress_('maintenance',job?{...job,processed:job.reviewed}:null),active:Boolean(job&&job.state!=='Completada')};}
function compactOperationalLogs_(){
 for(const name of Object.keys(LOG_LIMITS)){const sheet=book_().getSheetByName(name);if(sheet)enforceLogLimit_(name,sheet);}
 const completed=new Set(rows_('Recargas').filter(row=>['Completada','Parcial'].includes(row.estado)).map(row=>row.id)),sheet=book_().getSheetByName('Recopilacion'),keys=RADAR.sheets.Recopilacion;
 if(sheet&&sheet.getLastRow()>1){const rows=sheet.getRange(2,1,sheet.getLastRow()-1,keys.length).getDisplayValues(),cycle=keys.indexOf('ciclo'),status=keys.indexOf('estado'),errors=new Set(rows.filter(row=>!['Completada','Cancelada','Omitida'].includes(row[status])).map(row=>row[cycle]));deleteSheetRows_(sheet,rows.flatMap((row,index)=>completed.has(row[cycle])&&!errors.has(row[cycle])?[index+2]:[]));}
}
function deleteSheetRows_(sheet,positions){
 const rows=[...new Set(positions)].sort((a,b)=>b-a);for(let i=0;i<rows.length;){let end=i+1;while(end<rows.length&&rows[end]===rows[end-1]-1)end++;sheet.deleteRows(rows[end-1],end-i);i=end;}
}
function deduplicateNews_(){
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,count=Math.max(0,sheet.getLastRow()-1);if(!count)return 0;
 const rows=sheet.getRange(2,1,count,keys.length).getDisplayValues().map((values,index)=>({...Object.fromEntries(keys.map((key,i)=>[key,values[i]])),_sheetRow:index+2})),aliases=[];uniqueNews_(translationIdentityRows_(rows),aliases);if(!aliases.length)return 0;
 const replacements=new Map(aliases.map(alias=>[rows[alias.index].id,rows[alias.representativeIndex].id])),content=recordSheet_('NewsletterContenido'),width=RADAR.sheets.NewsletterContenido.length,column=RADAR.sheets.NewsletterContenido.indexOf('noticia');
 if(content.getLastRow()>1){const values=content.getRange(2,1,content.getLastRow()-1,width).getDisplayValues();let changed=false;for(const row of values)if(replacements.has(row[column])){row[column]=replacements.get(row[column]);changed=true;}if(changed){content.getRange(2,1,values.length,width).setNumberFormat('@').setValues(values);SpreadsheetApp.flush();markNewsletterArchiveEdited_();}}
 deleteSheetRows_(sheet,aliases.map(alias=>rows[alias.index]._sheetRow));invalidateNews_();return aliases.length;
}
function cleanDuplicateNews(){authorize_(true);return withForegroundWrite_(()=>({removed:deduplicateNews_()}));}
function maintenanceBatch_(maxMs=MAINTENANCE_POLICY.maxMs){
 const job=maintenanceJob_();if(!job||['Completada','Publicando'].includes(job.state)||backgroundPaused_())return;
 const started=Date.now();try{
  if(job.phase==='logs'){compactOperationalLogs_();job.phase='dedup';saveMaintenanceJob_(job);}
  if(classificationPending_()||dailyCollectionPending_())return;
  if(job.phase==='dedup'){job.removed+=deduplicateNews_();job.phase='news';job.total=Math.max(0,newsSheet_().getLastRow()-1);}
  const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,size=Math.min(MAINTENANCE_POLICY.batchRows,job.total-job.next+2),updates=[],items=taxonomyCatalog_();let read=0;
  const rows=size>0?sheet.getRange(job.next,1,size,keys.length).getDisplayValues():[];
  for(const values of rows){if(Date.now()-started>=maxMs||backgroundPaused_(true))break;const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),saved=savedNewsLabels_(row.clasificacion);delete saved.canonicalId;const changed={clasificacion:JSON.stringify(saved),pais:newsCountry_(row),entidad:entityKey_(row.entidad),taxonomia:JSON.stringify(necessaryTaxonomyRecord_(row,items))};let corrected=false;for(const [key,value] of Object.entries(changed))if(value!==row[key]){updates.push({row:job.next+read,column:keys.indexOf(key)+1,value});corrected=true;}if(corrected)job.corrected++;read++;}
  writeNewsCells_(updates);if(updates.length)invalidateNews_(false);job.next+=read;job.reviewed+=read;job.state=job.next>job.total+1?'Completada':'Pendiente';job.error='';job.pausedUntil=0;if(job.state==='Completada'){compactOperationalLogs_();compactStorageDimensions_();requestDashboardSnapshots_(true);}saveMaintenanceJob_(job);
  telemetry_('mantenimiento',Date.now()-started,'OK',job.reviewed+' revisadas; '+job.removed+' duplicadas eliminadas');
 }catch(error){job.state='En pausa';job.error=String(error.message).slice(0,180);job.pausedUntil=Date.now()+settings_().retryMinutes*60000;saveMaintenanceJob_(job);telemetry_('mantenimiento',Date.now()-started,'Error',job.error);}
}
function drainMaintenanceRequest_(){const p=properties_(),day=p.getProperty('MAINTENANCE_REQUEST');if(!day)return;if(p.getProperty('MAINTENANCE_DAY')!==day){maintenance_();p.setProperty('MAINTENANCE_DAY',day);}p.deleteProperty('MAINTENANCE_REQUEST');}
