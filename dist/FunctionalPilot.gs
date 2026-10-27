// Explicit, bounded editorial pilot. Frozen editions and LLM evidence are never rewritten.
function functionalPilotChange_(row,items=taxonomyCatalog_()){
 if(llmIndex_().has(row.id))return null;
 const title=searchText_(row.titular),text=searchText_(row.titular+' '+row.extracto),focus=functionalPrimary(row.titular),recruitment=recruitmentHeadline_(title);
 if(!focus&&!recruitment)return null;
 const saved=taxonomySaved_(row.taxonomia),byId=taxonomyValidationIndex_(items).byId,previous=byId.get(saved.primary||saved.ids[0])?.palanca||'';
 const assignment=taxonomyRecord_(row.titular,row.extracto,items,savedNewsLabels_(row.clasificacion)),next=byId.get(assignment.primary)?.palanca||'';
 if(!recruitment&&(previous===next||!next))return null;
 validateTaxonomyAssignment_(assignment,items,row.id,true,row);
 const after={taxonomia:JSON.stringify(assignment)};
 if(recruitment){const labels=newsLabels_(digitalAssessment_(title,text),sha256_(JSON.stringify([title,text])));labels.procedencia=savedNewsLabels_(row.clasificacion).procedencia;after.clasificacion=JSON.stringify(labels);}
 if(Object.entries(after).every(([key,value])=>row[key]===value))return null;
 return {id:row.id,row:row._sheetRow,fingerprint:llmArticle_(row).contentHash,previous,next,evidence:focus?.terms||[row.titular],before:Object.fromEntries(Object.keys(after).map(key=>[key,row[key]])),after};
}
function previewFunctionalPilot(options={}){
 authorize_(true);const sheet=newsSheet_(),offset=Math.max(0,Math.floor(Number(options.offset)||0)),limit=Math.min(100,Math.max(1,Math.floor(Number(options.limit)||100))),total=Math.max(0,sheet.getLastRow()-1),count=Math.max(0,Math.min(limit,total-offset)),items=taxonomyCatalog_();
 const rows=newsRowsAt_(Array.from({length:count},(_,i)=>offset+i+2)),changes=rows.map(row=>functionalPilotChange_(row,items)).filter(Boolean),source=newsStorageKey_(),distribution={before:{},after:{}};
 for(const change of changes){distribution.before[change.previous]=(distribution.before[change.previous]||0)+1;distribution.after[change.next]=(distribution.after[change.next]||0)+1;}
 const digest=sha256_(JSON.stringify([RADAR.version,source,configurationRevision_(),llmRevision_(),rows,changes]));
 return {dryRun:true,version:RADAR.version,source,offset,count,total,next:offset+count,digest,changes,distribution};
}
function applyFunctionalPilot(options){
 authorize_(true);return withForegroundWrite_(()=>{
  const key='ARCHIVE_SHEET:functional-pilot:'+String(options?.digest||''),checkpoint=JSON.parse(properties_().getProperty(key)||'null');
  if(checkpoint?.applied)return {applied:checkpoint.count,archive:checkpoint.id,idempotent:true};
  if(classificationPending_()||taxonomyPending_()||snapshotJobsPending_())throw Error('Espera a que terminen clasificación, taxonomía y publicación LLM antes de actualizar reglas.');
  if(checkpoint?.verified){const changes=functionalPilotArchive_(checkpoint);writeFunctionalPilot_(changes,false);properties_().setProperty(key,JSON.stringify({...checkpoint,applied:true}));return {applied:changes.length,archive:checkpoint.id};}
  const preview=previewFunctionalPilot(options);if(preview.digest!==options?.digest)throw Error('El origen del archivo ha cambiado. Revisa el checkpoint '+key+'.');
  if(!preview.changes.length)return {applied:0};
  const records=preview.changes.map(change=>[change.id,JSON.stringify(change)]),archive=archiveSpreadsheet_('PilotoFuncional',['id','cambio'],records,configuration_().storage.primaryFolderId,'functional-pilot:'+preview.digest);
  properties_().setProperty(key,JSON.stringify({...JSON.parse(properties_().getProperty(key)),source:preview.source}));
  writeFunctionalPilot_(preview.changes,false);properties_().setProperty(key,JSON.stringify({...JSON.parse(properties_().getProperty(key)),applied:true}));
  telemetry_('piloto-funcional',0,'OK',preview.changes.length+'; archivo '+archive.id);return {applied:preview.changes.length,archive:archive.id};
 });
}
function restoreFunctionalPilot(options){
 authorize_(true);return withForegroundWrite_(()=>{
  const key='ARCHIVE_SHEET:functional-pilot:'+String(options?.digest||''),checkpoint=JSON.parse(properties_().getProperty(key)||'null');
  const changes=functionalPilotArchive_(checkpoint);
  writeFunctionalPilot_(changes,true);properties_().setProperty(key,JSON.stringify({...checkpoint,applied:false,restored:true}));return {restored:changes.length,archive:checkpoint.id};
 });
}
function functionalPilotArchive_(checkpoint){
 if(!checkpoint?.verified||checkpoint.source!==newsStorageKey_())throw Error('El origen del piloto funcional ha cambiado.');
 const raw=archivePayload_(checkpoint.id);if(sha256_(raw)!==checkpoint.digest)throw Error('Archivo del piloto funcional no verificado.');
 const payload=JSON.parse(raw);if(payload.table!=='PilotoFuncional')throw Error('Formato de archivo no válido.');
 return payload.rows.map(([id,value])=>{const change=JSON.parse(value);if(change.id!==id)throw Error('Formato de archivo no válido.');return change;});
}
function writeFunctionalPilot_(changes,restore){
 const rows=newsRowsForCandidates_(changes),keys=RADAR.sheets.Noticias,updates=[];
 // Validate the entire batch before the first write; retries accept only before or after values.
 for(const change of changes){const row=rows.get(change.id);if(!row?._sheetRow||llmArticle_(row).contentHash!==change.fingerprint||llmIndex_().has(change.id))throw Error('El origen del archivo ha cambiado. Revisa el checkpoint '+change.id+'.');
  for(const key of Object.keys(change.after)){if(row[key]!==change.before[key]&&row[key]!==change.after[key])throw Error('El origen del archivo ha cambiado. Revisa el checkpoint '+change.id+'.');updates.push({row:row._sheetRow,column:keys.indexOf(key)+1,value:(restore?change.before:change.after)[key]});}
 }
 writeNewsCells_(updates);SpreadsheetApp.flush();
 const verified=newsRowsForCandidates_(changes);for(const change of changes)for(const [key,value] of Object.entries(restore?change.before:change.after))if(verified.get(change.id)?.[key]!==value)throw Error('Configuración escrita incompleta.');
 invalidateNews_();requestDashboardSnapshots_(true);ensureBackgroundWorker_();
}
