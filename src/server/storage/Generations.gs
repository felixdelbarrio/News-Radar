function configurationStorageKey_(name){return name==='Noticias'?newsStorageKey_():name==='Taxonomia'?taxonomyStorageKey_():NEWSLETTER_ARCHIVE_TABLES.includes(name)?newsletterStorageKey_(name):name;}
function generationSheet_(name,headers){let sheet=book_().getSheetByName(name);if(!sheet)sheet=book_().insertSheet(name);if(sheet.getLastRow()===0)sheet.getRange(1,1,1,headers.length).setValues([headers]);return sheet;}

function verifiedGenerationWrite_(sheet,first,rows){
  if(!rows.length)return;const needed=first+rows.length-1;if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
  sheet.getRange(first,1,rows.length,rows[0].length).setNumberFormat('@').setValues(rows);SpreadsheetApp.flush();
  if(sha256_(JSON.stringify(rows))!==sha256_(JSON.stringify(sheet.getRange(first,1,rows.length,rows[0].length).getDisplayValues())))throw Error('La verificación del backup o de la generación ha fallado.');
}

function writeStagedNewsRows_(sheet,records){
  if(!records.length)return;
  const ordered=records.slice().sort((a,b)=>a.row-b.row),width=ordered[0].values.length,needed=ordered.at(-1).row;
  if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
  const writes=[];
  for(let start=0;start<ordered.length;){
    let end=start+1;while(end<ordered.length&&ordered[end].row-ordered[end-1].row<=64&&ordered[end].row-ordered[start].row<250)end++;
    const first=ordered[start].row,size=ordered[end-1].row-first+1,rows=size===end-start?ordered.slice(start,end).map(record=>record.values):sheet.getRange(first,1,size,width).getDisplayValues();
    if(size!==end-start)for(const record of ordered.slice(start,end))rows[record.row-first]=record.values;
    sheet.getRange(first,1,size,width).setNumberFormat('@').setValues(rows);writes.push({first,rows});start=end;
  }
  SpreadsheetApp.flush();
  for(const {first,rows} of writes)if(sha256_(JSON.stringify(rows))!==sha256_(JSON.stringify(sheet.getRange(first,1,rows.length,width).getDisplayValues())))throw Error('La verificación del backup o de la generación ha fallado.');
}

function generationKeep_(excludeJob=null){
  const keep=new Set(Object.keys(RADAR.sheets).map(configurationStorageKey_)),current=dataGeneration_(),previous=JSON.parse(properties_().getProperty('PREVIOUS_DATA_GENERATION')||'{}');
  const add=generation=>{for(const name of [generation.newsSheet,generation.taxonomySheet,generation.categorization?.sheet,...Object.values(generation.newsletterTables||{}),...Object.values(generation.snapshots||{}).map(snapshot=>snapshot.sheet)])if(name)keep.add(name);};
  add(current);
  if(DASHBOARD_SNAPSHOTS.views.every(view=>previous.snapshots?.[view])){
    let valid=true;
    for(const view of DASHBOARD_SNAPSHOTS.views){const manifest=previous.snapshots[view],sheet=book_().getSheetByName(manifest.sheet||'DashboardSnapshots');if(!sheet){valid=false;break;}const rows=sheet.getRange(manifest.first,1,manifest.parts,4).getDisplayValues();if(rows.some(([name,generation,part],index)=>name!==view||generation!==manifest.generation||Number(part)!==index)||sha256_(rows.map(row=>row[3]).join(''))!==manifest.digest){valid=false;break;}}
    if(valid)add(previous);
  }
  for(const [key,job] of [['classification',classificationJob_()],['taxonomy',taxonomyJob_()],['maintenance',maintenanceJob_()],['llm',llmJob_()]])if(key!==excludeJob&&job&&job.state!=='Completada'){
    for(const name of [job.source,job.target,job.modelTarget,job.taxonomySource,job.categorization?.sheet])if(name)keep.add(name);
  }
  return keep;
}
function discardJobTargets_(job,kind){
  if(!job||job.state==='Completada')return;
  const keep=generationKeep_(kind);
  for(const name of [job.target,job.modelTarget])if(name&&!keep.has(name)){const sheet=book_().getSheetByName(name);if(sheet)book_().deleteSheet(sheet);}
}
function pruneNewsGenerations_(){
 const keep=generationKeep_(),removed=[];
 for(const sheet of book_().getSheets()){const name=sheet.getName();if(keep.has(name))continue;
  const superseded=['Noticias','Taxonomia','NewsletterContenido','NewsletterEdiciones'].includes(name)&&configurationStorageKey_(name)!==name;
  if(superseded||/^(?:DashboardSnapshotBackup$|Preferencias$|Noticias_cuarentena_|Noticias_(?:class_|gen_|tax_|maintenance_|backup|staging)|Taxonomia_gen_|CategorizacionLLM_gen_|Newsletter(?:Contenido|Ediciones)_gen_)/i.test(name)){book_().deleteSheet(sheet);removed.push(name);}
 }
 return removed;
}

function compactStorageDimensions_(){
  for(const sheet of book_().getSheets()){
    const name=sheet.getName(),schema=Object.keys(RADAR.sheets).find(key=>name===key||name.startsWith(key+'_'));if(!schema&&name!=='DashboardSnapshotBackup')continue;
    const rows=Math.max(1,sheet.getLastRow())+100,columns=Math.max(RADAR.sheets[schema]?.length||4,sheet.getLastColumn());
    if(sheet.getMaxRows()>rows)sheet.deleteRows(rows+1,sheet.getMaxRows()-rows);
    if(sheet.getMaxColumns()>columns)sheet.deleteColumns(columns+1,sheet.getMaxColumns()-columns);
  }
}
