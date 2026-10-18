function generationSheet_(name,headers){let sheet=book_().getSheetByName(name);if(!sheet){sheet=book_().insertSheet(name);sheet.getRange(1,1,1,headers.length).setValues([headers]);}return sheet;}

function verifiedGenerationWrite_(sheet,first,rows){
  if(!rows.length)return;const needed=first+rows.length-1;if(needed>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),needed-sheet.getMaxRows());
  sheet.getRange(first,1,rows.length,rows[0].length).setNumberFormat('@').setValues(rows);SpreadsheetApp.flush();
  if(sha256_(JSON.stringify(rows))!==sha256_(JSON.stringify(sheet.getRange(first,1,rows.length,rows[0].length).getDisplayValues())))throw Error('La verificación del backup o de la generación ha fallado.');
}

function writeStagedNewsRows_(sheet,records){
  const ordered=records.slice().sort((a,b)=>a.row-b.row);let start=0;
  for(let end=1;end<=ordered.length;end++){
    if(end<ordered.length&&ordered[end].row===ordered[end-1].row+1)continue;
    if(end>start)verifiedGenerationWrite_(sheet,ordered[start].row,ordered.slice(start,end).map(record=>record.values));start=end;
  }
}

function pruneNewsGenerations_(){
  const current=dataGeneration_(),previous=JSON.parse(properties_().getProperty('PREVIOUS_DATA_GENERATION')||'{}'),keep=new Set([newsStorageKey_(),taxonomyStorageKey_(),previous.newsSheet,previous.taxonomySheet||'Taxonomia']);
  for(const generation of [current,...(previous.snapshots?[previous]:[])])for(const name of NEWSLETTER_ARCHIVE_TABLES)keep.add(generation.newsletterTables?.[name]||name);
  for(const job of [classificationJob_(),taxonomyJob_(),maintenanceJob_()])if(job&&job.state!=='Completada')for(const key of ['source','target','modelTarget'])keep.add(job[key]);
  for(const sheet of book_().getSheets())if(/^(?:Noticias$|Taxonomia$|Newsletter(?:Contenido|Ediciones)(?:$|_gen_)|Noticias_(?:class_|gen_|tax_|maintenance_)|Taxonomia_gen_)/.test(sheet.getName())&&!keep.has(sheet.getName()))book_().deleteSheet(sheet);
}
