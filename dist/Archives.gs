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
 const book=SpreadsheetApp.openById(id),info=book.getSheetByName('Archivo').getRange(1,1,1,4).getDisplayValues()[0],headers=JSON.parse(info[2]);
 if(info[0]!=='1')throw Error('Formato de archivo no válido.');
 let rows;
 if(info[1]==='NewsletterEdiciones'){
  const metadataSheet=book.getSheetByName('Edicion'),metadataKeys=metadataSheet.getRange(1,1,1,RADAR.sheets.NewsletterEdiciones.length).getDisplayValues()[0],values=metadataSheet.getRange(2,1,1,metadataKeys.length).getDisplayValues()[0],content=book.getSheetByName('Contenido'),count=content.getLastRow()-1;
  rows=[{metadata:Object.fromEntries(metadataKeys.map((key,index)=>[key,values[index]])),items:count?content.getRange(2,1,count,2).getDisplayValues():[]}];
 }else{
  const sheet=book.getSheetByName('Datos');
  if(JSON.stringify(sheet.getRange(1,1,1,headers.length).getDisplayValues()[0])!==JSON.stringify(headers))throw Error('Cabecera de archivo no válida.');
  const count=info[3]!==''?Number(info[3]):Math.max(0,sheet.getLastRow()-1);
  if(!Number.isSafeInteger(count)||count<0||count>sheet.getMaxRows()-1||sheet.getLastRow()-1>count)throw Error('Contenido de archivo no verificado: '+info[1]);
  rows=count?sheet.getRange(2,1,count,headers.length).getDisplayValues():[];
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
  checkpoint={id:book.getId(),digest,count:rows.length};p.setProperty(property,JSON.stringify(checkpoint));
 }
 fileInFolder_(checkpoint.id,folder);const book=SpreadsheetApp.openById(checkpoint.id);
 const info=book.getSheetByName('Archivo')||book.insertSheet('Archivo');info.getRange(1,1,1,4).setNumberFormat('@').setValues([['1',name,JSON.stringify(headers),String(rows.length)]]);
 if(name==='NewsletterEdiciones'){
  const metadata=rows[0].metadata,keys=Object.keys(metadata);writeArchiveTable_(book,'Edicion',keys,[keys.map(key=>metadata[key])]);writeArchiveTable_(book,'Contenido',['edicion','contenido'],rows[0].items);
 }else writeArchiveTable_(book,'Datos',headers,rows);
 SpreadsheetApp.flush();if(sha256_(archivePayload_(checkpoint.id))!==digest)throw Error('Contenido de archivo no verificado: '+name);
 p.setProperty(property,JSON.stringify({...checkpoint,verified:true}));
 return {id:checkpoint.id,digest,property,verified:true};
}
function archiveLogBatch_(name){
 if(name==='Adopcion')return true;
 const sheet=recordSheet_(name),count=sheet.getLastRow()-1,policy={...configuration_().storage,...logRetention_(name)};
 const expected=RADAR.sheets[name];if(JSON.stringify(sheet.getRange(1,1,1,expected.length).getDisplayValues()[0])!==JSON.stringify(expected))throw Error('Cabecera del log no válida: '+name);
 const checkpointKey='ARCHIVE_SHEET:'+name,checkpoint=JSON.parse(properties_().getProperty(checkpointKey)||'null');
 if(checkpoint)return recoverLogArchive_(name,sheet,checkpoint,checkpointKey);
 if(count<=0)return true;
 const keys=RADAR.sheets[name],date=keys.indexOf(name==='Ejecuciones'?'inicio':'fecha'),cutoff=Date.now()-policy.days*86400000;
 const rows=sheet.getRange(2,1,Math.min(count,ARCHIVE_WORK.rows),keys.length).getDisplayValues();
 if(count<policy.rows+ARCHIVE_WORK.rows&&!(Number.isFinite(Date.parse(rows[0][date]))&&Date.parse(rows[0][date])<cutoff))return true;
 let size=0,chars=0;
 for(const row of rows){
  const expired=Number.isFinite(Date.parse(row[date]))&&Date.parse(row[date])<cutoff;
  if(count-size<=policy.rows&&!expired)break;
  const length=JSON.stringify(row).length;if(size&&chars+length>ARCHIVE_WORK.chars)break;size++;chars+=length;
 }
 if(!size)return true;
 const values=rows.slice(0,size),archive=archiveSpreadsheet_(name,keys,values,policy.logFolderId,name);
 if(sha256_(JSON.stringify(sheet.getRange(2,1,size,keys.length).getDisplayValues()))!==sha256_(JSON.stringify(values)))throw Error('El log cambió durante el archivo: '+name);
 const nextRow=count>size?sheet.getRange(size+2,1,1,keys.length).getDisplayValues()[0]:null;
 properties_().setProperty(archive.property,JSON.stringify({...archive,count:size,deleting:true,nextRow}));
 sheet.deleteRows(2,size);SpreadsheetApp.flush();properties_().setProperty('LOG_ARCHIVE_ACTION',name+': '+size+' filas archivadas y verificadas.');
 if(sheet.getLastRow()-1!==count-size)throw Error('Retirada del log no verificada: '+name);
 properties_().deleteProperty(archive.property);return false;
}
// A checkpoint owns a frozen prefix. Appends must never change its payload or digest.
function recoverLogArchive_(name,sheet,checkpoint,key){
 const headers=RADAR.sheets[name],conflict=()=>{throw Error('Conflicto de archivo '+name+': conserva origen y checkpoint; revisa el archivo '+checkpoint.id+'.');};
 let payload,stored;
 try{const raw=archivePayload_(checkpoint.id);stored=JSON.parse(raw);if(sha256_(raw)===checkpoint.digest)payload=stored;}catch(_){}
 if(payload&&(payload.table!==name||JSON.stringify(payload.headers)!==JSON.stringify(headers)))return conflict();
 const size=payload?.rows.length||Number(checkpoint.count||0),count=sheet.getLastRow()-1;
 if(!size||size>ARCHIVE_WORK.rows)return conflict();
 const first=count>0?sheet.getRange(2,1,1,headers.length).getDisplayValues()[0]:null;
 // The next row proves that deletion finished. An identical boundary is ambiguous.
 if(checkpoint.deleting&&JSON.stringify(first)===JSON.stringify(checkpoint.nextRow)){
  if(!payload||JSON.stringify(first)===JSON.stringify(payload.rows[0]))return conflict();
  properties_().deleteProperty(key);return false;
 }
 if(count<size)return conflict();
 const prefix=sheet.getRange(2,1,size,headers.length).getDisplayValues(),digest=sha256_(JSON.stringify({schema:1,table:name,headers,rows:prefix}));
 if(digest!==checkpoint.digest)return conflict();
 if(!payload){
  if(checkpoint.deleting||checkpoint.verified)return conflict();
  if(stored&&(stored.table!==name||JSON.stringify(stored.headers)!==JSON.stringify(headers)||stored.rows.length>=size||stored.rows.some((row,index)=>JSON.stringify(row)!==JSON.stringify(prefix[index]))))return conflict();
  if(!stored&&(SpreadsheetApp.openById(checkpoint.id).getSheetByName('Datos')?.getLastRow()||0)>1)return conflict();
  archiveSpreadsheet_(name,headers,prefix,configuration_().storage.logFolderId,name);payload={rows:prefix};
 }
 const nextRow=count>size?sheet.getRange(size+2,1,1,headers.length).getDisplayValues()[0]:null;
 if(checkpoint.deleting&&JSON.stringify(nextRow)===JSON.stringify(first))return conflict();
 properties_().setProperty(key,JSON.stringify({...checkpoint,count:size,deleting:true,nextRow}));
 sheet.deleteRows(2,size);SpreadsheetApp.flush();
 if(sheet.getLastRow()-1!==count-size)throw Error('Retirada del log no verificada: '+name);
 properties_().deleteProperty(key);properties_().setProperty('LOG_ARCHIVE_ACTION',name+': checkpoint recuperado; '+size+' filas verificadas.');return false;
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
 const deliveries=rows_('NewsletterEnvios',undefined,8),sent=new Set(deliveries.filter(row=>row.estado==='Enviada').map(row=>row.id)),retained=new Set(recentNewsletterDeliveries_(deliveries).map(row=>row.id)),keys=RADAR.sheets.NewsletterEdiciones,sheet=newsletterSheet_('NewsletterEdiciones'),p=properties_(),source=newsletterStorageKey_('NewsletterEdiciones'),total=Math.max(0,sheet.getLastRow()-1);
 const checkpointKey='NEWSLETTER_ARCHIVE_CURSOR';let cursor=JSON.parse(p.getProperty(checkpointKey)||'null');if(!cursor||cursor.source!==source||cursor.next<2||cursor.next>total+2)cursor={source,next:2};
 cursor.total=total;const size=Math.min(8,Math.max(0,total-cursor.next+2));if(!size){p.deleteProperty(checkpointKey);return true;}
 const editions=sheet.getRange(cursor.next,1,size,keys.length).getDisplayValues().map(values=>Object.fromEntries(keys.map((key,index)=>[key,values[index]])));
 for(const [index,row] of editions.entries()){
  const position=cursor.next+index;
  if(row.estado!=='Enviada'||!sent.has(row.envio)||retained.has(row.envio))continue;
  const marker=JSON.parse(row.editorial||'null');
  if(marker?.archive){if(marker.cleared)continue;finishNewsletterArchive_(row,position-2,marker);p.setProperty(checkpointKey,JSON.stringify({...cursor,next:position+1}));return false;}
  const count=Number(row.cantidad),items=count?newsletterSheet_('NewsletterContenido').getRange(Number(row.inicio),1,count,2).getDisplayValues():[];
  if(items.some(([id,value])=>id!==row.id||!value))throw Error('Contenido de newsletter incompleto.');
  const archive=archiveSpreadsheet_('NewsletterEdiciones',[],[{metadata:row,items}],configuration_().storage.newsletterFolderId,'newsletter:'+row.id),range=sheet.getRange(position,keys.indexOf('editorial')+1,1,1),value=JSON.stringify({archive:archive.id,digest:archive.digest});
  range.setValues([[value]]);SpreadsheetApp.flush();if(range.getDisplayValues()[0][0]!==value)throw Error('Puntero de newsletter no verificado.');
  markNewsletterArchiveEdited_();finishNewsletterArchive_(row,position-2,{archive:archive.id,digest:archive.digest});properties_().deleteProperty(archive.property);p.setProperty(checkpointKey,JSON.stringify({...cursor,next:position+1}));return false;
 }
 cursor.next+=size;if(cursor.next>total+1){p.deleteProperty(checkpointKey);return true;}p.setProperty(checkpointKey,JSON.stringify(cursor));return false;
}

function finishNewsletterArchive_(row,index,marker){
 archivedNewsletter_({...row,editorial:JSON.stringify(marker)});
 const count=Number(row.cantidad),range=count?newsletterSheet_('NewsletterContenido').getRange(Number(row.inicio),2,count,1):null;
 if(range){range.clearContent();SpreadsheetApp.flush();if(range.getDisplayValues().some(([value])=>value))throw Error('Archivo de newsletter pendiente de compactar.');}
 newsletterSheet_('NewsletterEdiciones').getRange(index+2,RADAR.sheets.NewsletterEdiciones.indexOf('editorial')+1,1,1).setValues([[JSON.stringify({...marker,cleared:true})]]);markNewsletterArchiveEdited_();
}
function logArchiveReadyAt_(){const p=properties_();return p.getProperty('LOG_ARCHIVE_PENDING')?Math.max(Date.now(),Number(p.getProperty('LOG_ARCHIVE_NEXT')||0)):Infinity;}
function operationalArchiveBatch_(){
 const p=properties_();try{p.setProperty('LOG_ARCHIVE_LAST',new Date().toISOString());const done=compactOperationalLogs_();p.deleteProperty('LOG_ARCHIVE_ATTEMPTS');p.deleteProperty('LOG_ARCHIVE_NEXT');p.deleteProperty('LOG_ARCHIVE_ERROR');return done;}
 catch(error){p.setProperty('LOG_ARCHIVE_ATTEMPTS',String(Number(p.getProperty('LOG_ARCHIVE_ATTEMPTS')||0)+1));p.setProperty('LOG_ARCHIVE_NEXT',String(Date.now()+Math.min(21600000,settings_().retryMinutes*60000*2**Math.min(8,Number(p.getProperty('LOG_ARCHIVE_ATTEMPTS')||0)-1))));p.setProperty('LOG_ARCHIVE_ERROR',String(error.message).slice(0,180));return false;}
}
function resumeOperationalArchive(){authorize_(true);return withForegroundWrite_(()=>{for(const key of ['LOG_ARCHIVE_ATTEMPTS','LOG_ARCHIVE_NEXT','LOG_ARCHIVE_ERROR'])properties_().deleteProperty(key);properties_().setProperty('LOG_ARCHIVE_PENDING','true');const job=maintenanceJob_();if(job?.state==='Revisar'){job.state='Pendiente';job.attempts=0;job.pausedUntil=0;saveMaintenanceJob_(job);}ensureBackgroundWorker_();return getOperationalSchedule();});}
// Stage content and offsets together; no positional reader observes a partial move.
function compactNewsletterBatch_(){
 const p=properties_(),revision=newsletterArchiveVersion_(),source={editions:newsletterStorageKey_('NewsletterEdiciones'),content:newsletterStorageKey_('NewsletterContenido')},keys=RADAR.sheets.NewsletterEdiciones;
 let job=JSON.parse(p.getProperty('NEWSLETTER_COMPACTION_JOB')||'null');
 if(job?.state==='Completada'&&job.published===revision)return true;
 if(!job||job.state==='Completada'){
  job={state:'Scanning',revision,source,next:2,active:0,total:Math.max(0,newsletterSheet_('NewsletterEdiciones').getLastRow()-1)};
 }
 if(job.state==='Scanning'){
  if(job.revision!==revision||job.source.editions!==source.editions||job.source.content!==source.content)job={state:'Scanning',revision,source,next:2,active:0,total:Math.max(0,newsletterSheet_('NewsletterEdiciones').getLastRow()-1)};
  const size=Math.min(8,Math.max(0,job.total-job.next+2)),rows=size?newsletterSheet_('NewsletterEdiciones').getRange(job.next,keys.indexOf('cantidad')+1,size,keys.length-keys.indexOf('cantidad')).getDisplayValues():[];
  for(const values of rows)if(!JSON.parse(values[keys.indexOf('editorial')-keys.indexOf('cantidad')]||'null')?.archive)job.active+=Number(values[0]);
  job.next+=size;p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));if(job.next<=job.total+1)return false;
  if(newsletterSheet_('NewsletterContenido').getLastRow()-1<=job.active){job.state='Completada';job.published=revision;p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));return true;}
  const id=Utilities.getUuid();job={state:'Creating',revision,source,next:2,offset:2,total:job.total,editions:'NewsletterEdiciones_gen_'+id,content:'NewsletterContenido_gen_'+id};
  p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));
 }
 if(job.state==='Creating'){
  generationSheet_(job.editions,keys);generationSheet_(job.content,RADAR.sheets.NewsletterContenido);job.state='Pendiente';p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));
 }
 if(source.editions===job.editions&&source.content===job.content){markNewsletterArchiveEdited_();job.state='Completada';job.published=newsletterArchiveVersion_();p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));return true;}
 if(job.revision!==revision||job.source.editions!==source.editions||job.source.content!==source.content)throw Error('Las newsletters cambiaron durante la compactación; conserva las generaciones y revisa el checkpoint.');
 const editionSheet=book_().getSheetByName(source.editions),contentSheet=book_().getSheetByName(source.content);
 if(job.next<=job.total+1){
  const values=editionSheet.getRange(job.next,1,1,keys.length).getDisplayValues()[0],row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),marker=JSON.parse(row.editorial||'null');
  let nextOffset=job.offset;
  if(marker?.archive){archivedNewsletter_(row);values[keys.indexOf('inicio')]='0';}
  else{
   const size=Number(row.cantidad),items=size?contentSheet.getRange(Number(row.inicio),1,size,2).getDisplayValues():[];
   if(items.some(([id,value])=>id!==row.id||!value))throw Error('Contenido activo incompleto: '+row.id);
   if(items.length)writeVerifiedRows_(book_().getSheetByName(job.content),items.map((values,index)=>({row:job.offset+index,values})));
   values[keys.indexOf('inicio')]=String(job.offset);nextOffset+=items.length;
  }
  writeVerifiedRows_(book_().getSheetByName(job.editions),[{row:job.next,values}]);job.next++;job.offset=nextOffset;p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));return false;
 }
 const previous=dataGeneration_(),generation={...previous,newsletterTables:{NewsletterEdiciones:job.editions,NewsletterContenido:job.content}};
 p.setProperty('DATA_GENERATION_ROLLBACK',JSON.stringify(previous));p.setProperty('DATA_GENERATION',JSON.stringify(generation));dataGenerationMemory_=generation;
 markNewsletterArchiveEdited_();job.state='Completada';job.published=newsletterArchiveVersion_();p.setProperty('NEWSLETTER_COMPACTION_JOB',JSON.stringify(job));return true;
}
