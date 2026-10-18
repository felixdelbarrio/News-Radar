const MAINTENANCE_TABLES=Object.freeze(['Auditoria','Telemetria','Ejecuciones','Adopcion','NewsletterEventos','NewsletterFeedback']);
const MAINTENANCE_POLICY=Object.freeze({batchRows:100,retentionRows:200,maxMs:8000});
function maintenanceJob_(){const raw=properties_().getProperty('MAINTENANCE_JOB');return raw?JSON.parse(raw):null;}
function saveMaintenanceJob_(job){job.updated=new Date().toISOString();properties_().setProperty('MAINTENANCE_JOB',JSON.stringify(snapshotJob_('MAINTENANCE_JOB',job)));}
function maintenance_(force=false){
  const previous=maintenanceJob_(),revision=classificationRulesRevision_()+':'+(properties_().getProperty('TAXONOMY_REVISION')||'0');if(!force&&previous&&previous.state!=='Completada'&&previous.revision===revision)return;
  const total=Math.max(0,newsSheet_().getLastRow()-1),firstRow=!force&&previous?.revision===revision?Math.min(previous.total+2,total+2):2;
  const id=Utilities.getUuid();saveMaintenanceJob_({id,source:newsStorageKey_(),taxonomySource:taxonomyStorageKey_(),target:total?'Noticias_maintenance_'+id:null,corpus:properties_().getProperty('NEWS_CONTENT_REVISION')||'0',revision,total,firstRow,cursor:null,next:2,phase:'news',state:'Pendiente',reviewed:0,corrected:0,consolidated:0,removed:0,table:0,position:2,started:new Date().toISOString(),pausedUntil:0,error:''});ensureBackgroundWorker_();
}
function maintenanceReadyAt_(){const job=maintenanceJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function getMaintenanceStatus(){authorize_(true);const job=maintenanceJob_();return {job:withJobProgress_('maintenance',job?{...job,total:Math.max(0,job.total-job.firstRow+2),processed:job.reviewed}:null),active:Boolean(job&&job.state!=='Completada')};}
function maintenanceBatch_(maxMs=MAINTENANCE_POLICY.maxMs){
  const job=maintenanceJob_();if(!job||['Completada','Publicando'].includes(job.state)||backgroundPaused_()||dailyCollectionPending_()||classificationPending_()||properties_().getProperty('DAILY_PIPELINE_REQUEST'))return;
  const started=Date.now();let changed=false;
  try{
    if(job.journal)finishMaintenanceJournal_(job);
    if(job.taxonomySource!==taxonomyStorageKey_()||job.source!==newsStorageKey_()||job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')){maintenance_(true);return;}
    if(job.target&&!book_().getSheetByName(job.target))newsSheet_().copyTo(book_()).setName(job.target);
    if(job.phase==='news'){
      const rows=newsWorkRows_(job,MAINTENANCE_POLICY.batchRows),dates=rows.map(row=>row.fecha).filter(day=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))),updates=[];
      const from=dates.length?new Date(Date.parse(dates.at(-1))-COLLECTION_POLICY.duplicateDays*86400000).toISOString().slice(0,10):'',to=dates.length?new Date(Date.parse(dates[0])+COLLECTION_POLICY.duplicateDays*86400000).toISOString().slice(0,10):'';
      const candidates=dates.length?translationIdentityRows_(newsRowsForPeriod_({from,to}).filter(businessNews_)):[],aliases=[];uniqueNews_(candidates,aliases);
      const representatives=new Map(aliases.map(alias=>[candidates[alias.index]._sheetRow,candidates[alias.representativeIndex].id]));
      let cursor=job.cursor,reviewed=0,corrected=0,consolidated=0;
      for(const row of rows){
        if(Date.now()-started>=maxMs||backgroundPaused_(true)||reviewed%20===0&&properties_().getProperty('DAILY_PIPELINE_REQUEST'))break;
        const labels={...savedNewsLabels_(row.clasificacion)},canonicalId=representatives.get(row._sheetRow),country=newsCountry_(row),saved=savedNewsLabels_(row.clasificacion);
        if(canonicalId&&canonicalId!==row.id)labels.canonicalId=canonicalId;
        let correctedRow=false;
        const encoded=JSON.stringify(labels);if(encoded!==row.clasificacion){updates.push({row:row._sheetRow,column:12,value:encoded});correctedRow=true;}
        if(country!==row.pais){updates.push({row:row._sheetRow,column:3,value:country});correctedRow=true;}
        if(businessNews_({clasificacion:encoded})){
          const taxonomy=taxonomyRecord_(row.titular,row.extracto);
          if(JSON.stringify(taxonomy)!==row.taxonomia){updates.push({row:row._sheetRow,column:13,value:JSON.stringify(taxonomy)});correctedRow=true;}
        }
        if(canonicalId&&canonicalId!==saved.canonicalId)consolidated++;if(correctedRow)corrected++;cursor=newsWorkCursor_(row);reviewed++;
      }
      newsSheetOverride_=job.target;try{writeNewsCells_(updates);}finally{newsSheetOverride_=undefined;}if(updates.length){SpreadsheetApp.flush();invalidateNews_(false);changed=true;}
      job.cursor=cursor;job.reviewed+=reviewed;job.corrected+=corrected;job.consolidated+=consolidated;
      if(rows.length===0||reviewed===rows.length&&rows.length<MAINTENANCE_POLICY.batchRows){job.phase='retention';job.position=2;}
    }else pruneEvents_(job);
    job.state=job.state==='Completada'?'Completada':'Pendiente';job.error='';job.pausedUntil=0;saveMaintenanceJob_(job);if(job.state==='Completada')requestDashboardSnapshots_(true);
    telemetry_('mantenimiento',Date.now()-started,'OK',JSON.stringify({phase:job.phase,reviewed:job.reviewed,corrected:job.corrected,consolidated:job.consolidated,removed:job.removed,changed}));
  }catch(error){job.state='En pausa';job.error=String(error.message).slice(0,180);job.pausedUntil=Date.now()+settings_().retryMinutes*60000;saveMaintenanceJob_(job);telemetry_('mantenimiento',Date.now()-started,'Error',job.error);}
}
function retainedSummary_(value){try{const item=JSON.parse(value);return item?.maintenance===true?item:null;}catch(_){return null;}}
function maintenanceSummaries_(name,rows){
  const groups=new Map();
  for(const row of rows){
    if(name==='Auditoria'){const key=JSON.stringify([row[0],row[2],row[3],row[4],row[5]]);if(!groups.has(key))groups.set(key,{row:row.slice(),count:0,last:row[1]});const group=groups.get(key);group.count++;group.last=row[1];continue;}
    const date=row[name==='Ejecuciones'?1:0].slice(0,10),key=name==='Telemetria'?JSON.stringify([date,row[1],row[3]]):JSON.stringify([date,row[3]]);
    if(!groups.has(key))groups.set(key,{row:row.slice(),count:0,sum:0,min:Infinity,max:0,ids:[],errors:[],events:[],details:new Map(),first:row[name==='Ejecuciones'?1:0],last:row[name==='Ejecuciones'?2:0],sources:0,evaluated:0,added:0});
    const group=groups.get(key),duration=name==='Telemetria'?Number(row[2])||0:Math.max(0,Date.parse(row[2])-Date.parse(row[1]))||0;group.count++;group.sum+=duration;group.min=Math.min(group.min,duration);group.max=Math.max(group.max,duration);group.last=row[name==='Ejecuciones'?2:0];if(name==='Telemetria')group.details.set(row[4],(group.details.get(row[4])||0)+1);
    if(name==='Ejecuciones'){group.ids.push(row[0]);group.events.push(row.slice());group.sources+=Number(row[4])||0;group.evaluated+=Number(row[5])||0;group.added+=Number(row[6])||0;if(row[7])group.errors.push([row[0],row[7]]);}
  }
  const result=[...groups.values()].map(group=>{
    if(name==='Auditoria'){if(group.count===1)return group.row;return [group.row[0],group.row[1],group.row[2],group.row[3],group.row[4],JSON.stringify({maintenance:true,count:group.count,last:group.last,original:group.row[5]})];}
    const detail={maintenance:true,count:group.count,first:group.first,last:group.last,sumMs:group.sum,minMs:group.min,maxMs:group.max,...(name==='Ejecuciones'?{ids:group.ids,errors:group.errors,events:group.events}:{details:[...group.details]})},encoded=JSON.stringify(detail);
    if(encoded.length>40000)return null;
    return name==='Telemetria'?[group.first,group.row[1],Math.round(group.sum/group.count),group.row[3],encoded]:['maintenance:'+sha256_(group.ids.join('|')).slice(0,20),group.first,group.last,group.row[3],group.sources,group.evaluated,group.added,encoded];
  });return result.includes(null)?rows:result;
}
function finishMaintenanceJournal_(job){
  const j=job.journal,sheet=book_().getSheetByName(j.name),width=RADAR.sheets[j.name].length;
  const read=(start,count)=>count?sheet.getRange(start,1,count,width).getDisplayValues():[],digest=rows=>sha256_(JSON.stringify(rows));
  if(j.output&&digest(read(j.start,j.output))!==j.outputDigest){
    const original=read(j.start,j.input);if(digest(original)!==j.sourceDigest)throw Error('Compactación pendiente: el resumen no coincide. No se eliminaron más filas.');
    const output=maintenanceSummaries_(j.name,original).map(row=>row.map(String));if(digest(output)!==j.outputDigest)throw Error('Compactación pendiente: cambió el resumen previsto.');sheet.getRange(j.start,1,j.output,width).setNumberFormat('@').setValues(output);SpreadsheetApp.flush();
  }
  const remaining=j.input-j.output,current=read(j.start+j.output,Math.min(remaining,Math.max(0,sheet.getLastRow()-j.start-j.output+1)));
  if(remaining&&digest(current)===j.deleteDigest)sheet.deleteRows(j.start+j.output,remaining);
  else if(remaining){const tail=sheet.getLastRow()>=j.start+j.output?read(j.start+j.output,1):[];if(digest(tail)!==j.tailDigest)throw Error('Compactación pendiente: la posición final cambió.');}
  job.removed+=remaining;if(Number.isFinite(job.retentionEnd))job.retentionEnd-=remaining;job.position=j.start+j.output;delete job.journal;saveMaintenanceJob_(job);if(job.state==='Completada')requestDashboardSnapshots_(true);
}
function pruneEvents_(job){
  const cursors=JSON.parse(properties_().getProperty('RETENTION_CURSORS')||'{}'),name=MAINTENANCE_TABLES[job.table];
  if(!name){job.state='Completada';properties_().setProperty('RETENTION_DATE',recordDay(new Date(),settings_().timezone));return;}
  if(!job.retentionStarted){job.position=cursors[name]||2;job.retentionEnd=book_().getSheetByName(name)?.getLastRow()||1;job.retentionStarted=true;}
  const sheet=book_().getSheetByName(name),keys=RADAR.sheets[name],column=name==='Ejecuciones'?1:name==='Auditoria'?1:name==='NewsletterEventos'?7:name==='NewsletterFeedback'?5:0,cutoff=new Date(Date.now()-settings_().retentionDays*86400000).toISOString().slice(0,10),count=Math.min(MAINTENANCE_POLICY.retentionRows,Math.max(0,Math.min(sheet.getLastRow(),job.retentionEnd)-job.position+1));
  if(!count){advanceMaintenanceTable_(job,cursors,name);return;}
  const rows=sheet.getRange(job.position,1,count,keys.length).getDisplayValues(),older=[];
  let summariesSkipped=0;
  for(const row of rows){
    const detail=name==='Telemetria'?row[4]:name==='Ejecuciones'?row[7]:name==='Auditoria'?row[5]:'';
    if(retainedSummary_(detail)){if(!older.length){job.position++;summariesSkipped++;}else break;continue;}
    if(!row[column]||row[column].slice(0,10)>=cutoff||name==='Ejecuciones'&&!['Completada','Parcial','Error'].includes(row[3])){if(older.length)break;job.revisit=Math.min(job.revisit||Infinity,job.position);job.position++;summariesSkipped++;continue;}
    older.push(row);
  }
  if(!older.length){if(summariesSkipped===count)return;advanceMaintenanceTable_(job,cursors,name);return;}
  const summaries=['Auditoria','Telemetria','Ejecuciones'].includes(name)?maintenanceSummaries_(name,older):[];
  if(summaries.length>=older.length){job.position+=older.length;return;}
  const output=summaries.map(row=>row.map(String)),input=older.length,start=job.position,deleteRows=older.slice(output.length),tail=sheet.getLastRow()>=start+input?sheet.getRange(start+input,1,1,keys.length).getDisplayValues():[],journal={name,start,input,sourceDigest:sha256_(JSON.stringify(older)),output:output.length,outputDigest:sha256_(JSON.stringify(output)),deleteDigest:sha256_(JSON.stringify(deleteRows)),tailDigest:sha256_(JSON.stringify(tail))};
  job.journal=journal;saveMaintenanceJob_(job);if(job.state==='Completada')requestDashboardSnapshots_(true);
  if(output.length)sheet.getRange(start,1,output.length,keys.length).setNumberFormat('@').setValues(output);
  SpreadsheetApp.flush();finishMaintenanceJournal_(job);
}

function advanceMaintenanceTable_(job,cursors,name){
  cursors[name]=Math.min(job.revisit||Infinity,job.position);delete job.revisit;properties_().setProperty('RETENTION_CURSORS',JSON.stringify(cursors));job.table++;job.position=2;job.retentionStarted=false;delete job.retentionEnd;
}
function invalidateMaintenanceCursor_(name,row){
  if(!MAINTENANCE_TABLES.includes(name))return;const cursors=JSON.parse(properties_().getProperty('RETENTION_CURSORS')||'{}');cursors[name]=Math.min(cursors[name]||2,Math.max(2,row));properties_().setProperty('RETENTION_CURSORS',JSON.stringify(cursors));
}

function drainMaintenanceRequest_(){
  const p=properties_(),day=p.getProperty('MAINTENANCE_REQUEST');if(!day)return;
  if(p.getProperty('MAINTENANCE_DAY')!==day){maintenance_();p.setProperty('MAINTENANCE_DAY',day);}
  p.deleteProperty('MAINTENANCE_REQUEST');
}
