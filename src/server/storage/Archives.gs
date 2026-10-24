const ARCHIVE_WORK=Object.freeze({rows:100,chars:30000});
function archiveFolder_(id){
 const folder=DriveApp.getFolderById(id);folder.getName();return folder;
}
function fileInFolder_(id,folder){
 const file=DriveApp.getFileById(id),parents=file.getParents(),ids=[];while(parents.hasNext())ids.push(parents.next().getId());
 if(ids.length!==1||ids[0]!==folder.getId())file.moveTo(folder);
 const verified=file.getParents();let found=0;while(verified.hasNext()){if(verified.next().getId()!==folder.getId())throw Error('Carpeta de archivo incorrecta.');found++;}
 if(found!==1)throw Error('No se ha verificado la carpeta del archivo: '+id);return file;
}
function archivePayload_(id){
 const book=SpreadsheetApp.openById(id),info=book.getSheetByName('Archivo').getRange(1,1,1,3).getDisplayValues()[0],headers=JSON.parse(info[2]);
 if(info[0]!=='1')throw Error('Formato de archivo no válido.');
 let rows;
 if(info[1]==='NewsletterEdiciones'){
  const metadataSheet=book.getSheetByName('Edicion'),metadataKeys=metadataSheet.getRange(1,1,1,RADAR.sheets.NewsletterEdiciones.length).getDisplayValues()[0],values=metadataSheet.getRange(2,1,1,metadataKeys.length).getDisplayValues()[0],content=book.getSheetByName('Contenido'),count=content.getLastRow()-1;
  rows=[{metadata:Object.fromEntries(metadataKeys.map((key,index)=>[key,values[index]])),items:count?content.getRange(2,1,count,2).getDisplayValues():[]}];
 }else{
  const sheet=book.getSheetByName('Datos');
  if(JSON.stringify(sheet.getRange(1,1,1,headers.length).getDisplayValues()[0])!==JSON.stringify(headers))throw Error('Cabecera de archivo no válida.');
  rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,headers.length).getDisplayValues():[];
 }
 return JSON.stringify({schema:1,table:info[1],headers,rows});
}
function writeArchiveTable_(book,name,headers,rows){
 const sheet=book.getSheetByName(name)||book.insertSheet(name),values=[headers,...rows];
 if(values.length>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),values.length-sheet.getMaxRows());
 sheet.getRange(1,1,values.length,headers.length).setNumberFormat('@').setValues(values.map(row=>row.map(safeCell_)));sheet.setFrozenRows(1);
}
function archiveSpreadsheet_(name,headers,rows,folderId,key){
 const folder=archiveFolder_(folderId),payload=JSON.stringify({schema:1,table:name,headers,rows}),digest=sha256_(payload),p=properties_(),property='ARCHIVE_SHEET:'+key;
 let checkpoint=JSON.parse(p.getProperty(property)||'null');
 if(checkpoint&&checkpoint.digest!==digest)throw Error('El origen del archivo ha cambiado. Revisa el checkpoint '+key+'.');
 if(!checkpoint){
  const book=SpreadsheetApp.create(recordDay(new Date(),settings_().timezone).replace(/-/g,'')+'_'+name+'_'+digest.slice(0,12));book.getSheets()[0]?.setName('Archivo');
  checkpoint={id:book.getId(),digest};p.setProperty(property,JSON.stringify(checkpoint));
 }
 fileInFolder_(checkpoint.id,folder);const book=SpreadsheetApp.openById(checkpoint.id);
 const info=book.getSheetByName('Archivo')||book.insertSheet('Archivo');info.getRange(1,1,1,3).setNumberFormat('@').setValues([['1',name,JSON.stringify(headers)]]);
 if(name==='NewsletterEdiciones'){
  const metadata=rows[0].metadata,keys=Object.keys(metadata);writeArchiveTable_(book,'Edicion',keys,[keys.map(key=>metadata[key])]);writeArchiveTable_(book,'Contenido',['edicion','contenido'],rows[0].items);
 }else writeArchiveTable_(book,'Datos',headers,rows);
 SpreadsheetApp.flush();if(sha256_(archivePayload_(checkpoint.id))!==digest)throw Error('Contenido de archivo no verificado: '+name);
 return {id:checkpoint.id,digest,property};
}
function archiveLogBatch_(name){
 const sheet=recordSheet_(name),count=sheet.getLastRow()-1,policy=configuration_().storage;
 const expected=RADAR.sheets[name];if(JSON.stringify(sheet.getRange(1,1,1,expected.length).getDisplayValues()[0])!==JSON.stringify(expected))throw Error('Cabecera del log no válida: '+name);
 const checkpointKey='ARCHIVE_SHEET:'+name,checkpoint=JSON.parse(properties_().getProperty(checkpointKey)||'null');
 if(checkpoint?.deleting){
  const first=sheet.getLastRow()>1?sheet.getRange(2,1,1,RADAR.sheets[name].length).getDisplayValues()[0]:null;
  if(JSON.stringify(first)===JSON.stringify(checkpoint.nextRow)){
   if(sha256_(archivePayload_(checkpoint.id))!==checkpoint.digest)throw Error('Archivo previo no verificado.');
   properties_().deleteProperty(checkpointKey);return false;
  }
 }
 if(count<=0)return true;
 const keys=RADAR.sheets[name],date=keys.indexOf(name==='Ejecuciones'?'inicio':'fecha'),cutoff=Date.now()-policy.logDays*86400000;
 const rows=sheet.getRange(2,1,Math.min(count,ARCHIVE_WORK.rows),keys.length).getDisplayValues();let size=0,chars=0;
 for(const row of rows){
  const expired=Number.isFinite(Date.parse(row[date]))&&Date.parse(row[date])<cutoff;
  if(count-size<=policy.logRows&&!expired)break;
  const length=JSON.stringify(row).length;if(size&&chars+length>ARCHIVE_WORK.chars)break;size++;chars+=length;
 }
 if(!size)return true;
 const values=rows.slice(0,size),archive=archiveSpreadsheet_(name,keys,values,policy.logFolderId,name);
 if(sha256_(JSON.stringify(sheet.getRange(2,1,size,keys.length).getDisplayValues()))!==sha256_(JSON.stringify(values)))throw Error('El log cambió durante el archivo: '+name);
 const nextRow=count>size?sheet.getRange(size+2,1,1,keys.length).getDisplayValues()[0]:null;
 properties_().setProperty(archive.property,JSON.stringify({...archive,deleting:true,nextRow}));
 sheet.deleteRows(2,size);SpreadsheetApp.flush();properties_().setProperty('LOG_ARCHIVE_ACTION',name+': '+size+' filas archivadas y verificadas.');
 if(sheet.getLastRow()-1!==count-size)throw Error('Retirada del log no verificada: '+name);
 properties_().deleteProperty(archive.property);return false;
}
function validateStorageFolders_(storage){for(const key of ['primaryFolderId','logFolderId','newsletterFolderId'])archiveFolder_(storage[key]);}
function verifyPrimaryStorage(){authorize_(true);const storage=configuration_().storage;validateStorageFolders_(storage);fileInFolder_(properties_().getProperty('SPREADSHEET_ID'),archiveFolder_(storage.primaryFolderId));return {primaryId:properties_().getProperty('SPREADSHEET_ID'),folderId:storage.primaryFolderId};}
function recentNewsletterDeliveries_(rows){
 const counts=new Map(),limit=configuration_().storage.newsletterDeliveries;
 return rows.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).filter(row=>{
  const key=row.suscripcion||row.correo,count=counts.get(key)||0;counts.set(key,count+1);return count<limit;
 });
}
function archivedNewsletter_(row){
 const marker=JSON.parse(row.editorial||'null');if(!marker?.archive)return row;
 const payload=archivePayload_(marker.archive);
 if(sha256_(payload)!==marker.digest)throw Error('Newsletter archivada no verificada.');
 const archived=JSON.parse(payload).rows[0];
 if(archived.metadata.id!==row.id||archived.metadata.correo!==row.correo)throw Error('Newsletter archivada no verificada.');
 return {...archived.metadata,archivedItems:archived.items};
}
function archiveNewsletterBatch_(){
 const deliveries=rows_('NewsletterEnvios',undefined,8),sent=new Set(deliveries.filter(row=>row.estado==='Enviada').map(row=>row.id)),retained=new Set(recentNewsletterDeliveries_(deliveries).map(row=>row.id)),editions=rows_('NewsletterEdiciones'),keys=RADAR.sheets.NewsletterEdiciones,sheet=newsletterSheet_('NewsletterEdiciones');
 for(const [index,row] of editions.entries()){
  if(row.estado!=='Enviada'||!sent.has(row.envio)||retained.has(row.envio))continue;
  const marker=JSON.parse(row.editorial||'null');
  if(marker?.archive){if(marker.cleared)continue;finishNewsletterArchive_(row,index,marker);return false;}
  const count=Number(row.cantidad),items=count?newsletterSheet_('NewsletterContenido').getRange(Number(row.inicio),1,count,2).getDisplayValues():[];
  if(items.some(([id,value])=>id!==row.id||!value))throw Error('Contenido de newsletter incompleto.');
  const archive=archiveSpreadsheet_('NewsletterEdiciones',[],[{metadata:row,items}],configuration_().storage.newsletterFolderId,'newsletter:'+row.id),range=sheet.getRange(index+2,keys.indexOf('editorial')+1,1,1),value=JSON.stringify({archive:archive.id,digest:archive.digest});
  range.setValues([[value]]);SpreadsheetApp.flush();if(range.getDisplayValues()[0][0]!==value)throw Error('Puntero de newsletter no verificado.');
  markNewsletterArchiveEdited_();finishNewsletterArchive_(row,index,{archive:archive.id,digest:archive.digest});properties_().deleteProperty(archive.property);return false;
 }
 return true;
}

function finishNewsletterArchive_(row,index,marker){
 archivedNewsletter_({...row,editorial:JSON.stringify(marker)});
 const count=Number(row.cantidad),range=count?newsletterSheet_('NewsletterContenido').getRange(Number(row.inicio),2,count,1):null;
 if(range){range.clearContent();SpreadsheetApp.flush();if(range.getDisplayValues().some(([value])=>value))throw Error('Archivo de newsletter pendiente de compactar.');}
 newsletterSheet_('NewsletterEdiciones').getRange(index+2,RADAR.sheets.NewsletterEdiciones.indexOf('editorial')+1,1,1).setValues([[JSON.stringify({...marker,cleared:true})]]);markNewsletterArchiveEdited_();
}
function logArchiveReadyAt_(){const p=properties_();return p.getProperty('LOG_ARCHIVE_PENDING')&&Number(p.getProperty('LOG_ARCHIVE_ATTEMPTS')||0)<3?Math.max(Date.now(),Number(p.getProperty('LOG_ARCHIVE_NEXT')||0)):Infinity;}
function operationalArchiveBatch_(){
 const p=properties_();try{p.setProperty('LOG_ARCHIVE_LAST',new Date().toISOString());const done=compactOperationalLogs_();p.deleteProperty('LOG_ARCHIVE_ATTEMPTS');p.deleteProperty('LOG_ARCHIVE_NEXT');p.deleteProperty('LOG_ARCHIVE_ERROR');return done;}
 catch(error){p.setProperty('LOG_ARCHIVE_ATTEMPTS',String(Number(p.getProperty('LOG_ARCHIVE_ATTEMPTS')||0)+1));p.setProperty('LOG_ARCHIVE_NEXT',String(Date.now()+settings_().retryMinutes*60000));p.setProperty('LOG_ARCHIVE_ERROR',String(error.message).slice(0,180));return false;}
}
function resumeOperationalArchive(){authorize_(true);return withForegroundWrite_(()=>{for(const key of ['LOG_ARCHIVE_ATTEMPTS','LOG_ARCHIVE_NEXT','LOG_ARCHIVE_ERROR'])properties_().deleteProperty(key);properties_().setProperty('LOG_ARCHIVE_PENDING','true');const job=maintenanceJob_();if(job?.state==='Revisar'){job.state='Pendiente';job.attempts=0;job.pausedUntil=0;saveMaintenanceJob_(job);}ensureBackgroundWorker_();return getOperationalSchedule();});}
