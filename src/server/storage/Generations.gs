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
 const taxonomy=taxonomyJob_();clearTaxonomyCheckpoints_(['scan','publish'].includes(taxonomy?.phase)?taxonomy.checkpoint:null);
 const active=new Set([dataGeneration_().newsSheet,dataGeneration_().taxonomySheet,dataGeneration_().categorization?.sheet,...Object.values(dataGeneration_().newsletterTables||{})].filter(Boolean));
 const removed=[];for(const sheet of book_().getSheets()){const name=sheet.getName();if(!Object.hasOwn(RADAR.sheets,name)&&!active.has(name)){book_().deleteSheet(sheet);removed.push(name);}}return removed;
}

function compactStorageDimensions_(){
  for(const sheet of book_().getSheets()){
    const name=sheet.getName(),schema=Object.keys(RADAR.sheets).find(key=>name===key||name.startsWith(key+'_'));if(!schema)continue;
    const rows=Math.max(1,sheet.getLastRow())+100,columns=Math.max(RADAR.sheets[schema]?.length||4,sheet.getLastColumn());
    if(sheet.getMaxRows()>rows)sheet.deleteRows(rows+1,sheet.getMaxRows()-rows);
    if(sheet.getMaxColumns()>columns)sheet.deleteColumns(columns+1,sheet.getMaxColumns()-columns);
  }
}
