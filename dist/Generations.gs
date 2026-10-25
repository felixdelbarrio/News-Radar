function configurationStorageKey_(name){return name==='Noticias'?newsStorageKey_():name==='Taxonomia'?taxonomyStorageKey_():NEWSLETTER_ARCHIVE_TABLES.includes(name)?newsletterStorageKey_(name):name;}
function generationSheet_(name,headers){let sheet=book_().getSheetByName(name);if(!sheet)sheet=book_().insertSheet(name);if(sheet.getLastRow()===0)sheet.getRange(1,1,1,headers.length).setValues([headers]);return sheet;}

function writeVerifiedRows_(sheet,records){
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

function pruneNewsGenerations_(){
 const generation=dataGeneration_(),active=new Set([generation.newsSheet,generation.taxonomySheet,generation.categorization?.sheet,...Object.values(generation.newsletterTables||{})].filter(Boolean));
 const rollback=JSON.parse(properties_().getProperty('DATA_GENERATION_ROLLBACK')||'{}');
 for(const value of [rollback.newsSheet,rollback.taxonomySheet,rollback.categorization?.sheet,...Object.values(rollback.newsletterTables||{})])if(value)active.add(value);
 const compaction=JSON.parse(properties_().getProperty('NEWSLETTER_COMPACTION_JOB')||'null');if(compaction&&compaction.state!=='Completada')for(const value of [compaction.editions,compaction.content,compaction.source?.editions,compaction.source?.content])if(value)active.add(value);
 const taxonomy=taxonomyJob_();clearTaxonomyCheckpoints_(['scan','publish'].includes(taxonomy?.phase)?taxonomy.checkpoint:null);
 for(const key of ['TAXONOMY_JOB','CLASSIFICATION_JOB','LLM_JOB','MAINTENANCE_JOB','EXCERPT_RECOVERY_JOB']){
  const job=JSON.parse(properties_().getProperty(key)||'null');if(!job||job.state==='Completada')continue;
  for(const value of [job.source,job.target,job.sheet,job.generation?.source,job.generation?.newsSheet,job.generation?.taxonomySheet,job.categorization?.sheet])if(value)active.add(value);
 }
 const removed=[];for(const sheet of book_().getSheets()){const name=sheet.getName();if(/^(?:Noticias|Taxonomia|NewsletterContenido|NewsletterEdiciones|CategorizacionLLM)_(?:tax|class|gen|maintenance|llm)_[-a-zA-Z0-9]+$/.test(name)&&!active.has(name)){book_().deleteSheet(sheet);removed.push(name);}}return removed;
}

function compactStorageDimensions_(){
  for(const sheet of book_().getSheets()){
    const name=sheet.getName(),schema=Object.keys(RADAR.sheets).find(key=>name===key||name.startsWith(key+'_'));if(!schema)continue;
    const rows=Math.max(1,sheet.getLastRow())+100,columns=Math.max(RADAR.sheets[schema]?.length||4,sheet.getLastColumn());
    if(sheet.getMaxRows()>rows)sheet.deleteRows(rows+1,sheet.getMaxRows()-rows);
    if(sheet.getMaxColumns()>columns)sheet.deleteColumns(columns+1,sheet.getMaxColumns()-columns);
  }
}

// Build catalogue and assignments on an isolated pair; readers retain the published pair.
function prepareTaxonomyGeneration_(job){
 if(job.generation)return;
 const suffix=String(job.id).replace(/[^a-zA-Z0-9-]/g,''),news='Noticias_tax_'+suffix,taxonomy='Taxonomia_tax_'+suffix;
 const source=newsSheet_(),target=book_().getSheetByName(news)||source.copyTo(book_()).setName(news);
 const width=RADAR.sheets.Noticias.length,sourceDigest=sha256_(JSON.stringify(source.getRange(1,1,source.getLastRow(),width).getDisplayValues()));
 if(sourceDigest!==sha256_(JSON.stringify(target.getRange(1,1,target.getLastRow(),width).getDisplayValues())))throw Error('Copia de noticias incompleta.');
 generationSheet_(taxonomy,RADAR.sheets.Taxonomia);
 job.generation={newsSheet:news,taxonomySheet:taxonomy,sourceDigest,source:newsStorageKey_()};
 writeTaxonomyJob_(job);
}
function withTaxonomyGeneration_(job,operation){
 const previousNews=newsSheetOverride_,previousTaxonomy=taxonomySheetOverride_;
 try{if(job?.generation){newsSheetOverride_=job.generation.newsSheet;taxonomySheetOverride_=job.generation.taxonomySheet;}return operation();}
 finally{newsSheetOverride_=previousNews;taxonomySheetOverride_=previousTaxonomy;}
}
function taxonomyPublicationReady_(){
 const job=taxonomyJob_();return !job||job.state==='Completada'||job.state==='Publicando'&&(!job.generation||job.verified===true);
}

function taxonomySourceUnchanged_(job){
 const sheet=newsSheet_();return job.generation.source===newsStorageKey_()&&job.generation.sourceDigest===sha256_(JSON.stringify(sheet.getRange(1,1,sheet.getLastRow(),RADAR.sheets.Noticias.length).getDisplayValues()));
}
