let radarBook_;
function book_() { return radarBook_ || (radarBook_=SpreadsheetApp.openById(properties_().getProperty('SPREADSHEET_ID'))); }
function setupRadar() {
  const p=properties_(), email=Session.getEffectiveUser().getEmail().toLowerCase();
  if (p.getProperty('OWNER_EMAIL') && p.getProperty('OWNER_EMAIL')!==email) throw new Error('Solo el propietario puede inicializar.');
  if(p.getProperty('OWNER_EMAIL'))authorize_(true);
  else if(Session.getActiveUser().getEmail().toLowerCase()!==email)throw new Error('Inicializa desde el editor con la cuenta propietaria.');
  const existing=p.getProperty('SPREADSHEET_ID');
  const book=existing?SpreadsheetApp.openById(existing):(SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('BBVA Empresas · News Radar'));
  radarBook_=book;
  p.setProperties({OWNER_EMAIL:email,SPREADSHEET_ID:book.getId()});
  initializeConfiguration();
  book.setSpreadsheetTimeZone(settings_().timezone);
  Object.entries(RADAR.sheets).forEach(([name,headers])=>{
    let sheet=book.getSheetByName(name);
    if (sheet) {
      const actual=sheet.getRange(1,1,1,headers.length).getValues()[0];
      if (actual.some((value,i)=>value && value!==headers[i])) throw new Error('Estructura inesperada en '+name+'.');
      sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground(SHEET_THEME.background).setFontColor(SHEET_THEME.foreground);
      return;
    }
    sheet=book.insertSheet(name);sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground(SHEET_THEME.background).setFontColor(SHEET_THEME.foreground);sheet.setFrozenRows(1);
  });
  return 'News Radar preparado: fuentes predeterminadas, recopilación automática y métricas.';
}
function rows_(sheet, limit, width=RADAR.sheets[sheet].length,period=null) {
  if(sheet==='Noticias'&&period){const rows=newsRowsForPeriod_(period);for(const row of rows)delete row._sheetRow;return rows;}
  const s=recordSheet_(sheet), count=s.getLastRow()-1;
  if (count<1) return [];
  const size=limit?Math.min(count,limit):count;
  const keys=RADAR.sheets[sheet].slice(0,width);
  return s.getRange(count-size+2,1,size,keys.length).getDisplayValues().map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]])));
}
function append_(name, rows) {
  if (!rows.length) return;
  if(NEWSLETTER_ARCHIVE_TABLES.includes(name))markNewsletterArchiveEdited_();
  const s=recordSheet_(name), start=s.getLastRow()+1, needed=start+rows.length-1;
  if (needed>s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(),needed-s.getMaxRows());
  const range=s.getRange(start,1,rows.length,rows[0].length);range.setNumberFormat('@').setValues(rows.map(r=>r.map(safeCell_)));
  enforceLogLimit_(name,s);
  if(name==='Ejecuciones')CacheService.getScriptCache().remove('dashboard-runs:'+RADAR.version);
}

function rowsById_(name,ids,limit=Infinity){
  const sheet=recordSheet_(name),count=Math.min(Math.max(0,sheet.getLastRow()-1),limit),keys=RADAR.sheets[name],result=[];
  if(!count||!ids.size)return result;
  const first=sheet.getLastRow()-count+1,positions=sheet.getRange(first,1,count,1).getDisplayValues().flatMap(([id],index)=>ids.has(id)?[first+index]:[]);
  let start=0;
  for(let end=1;end<=positions.length;end++){
    if(end<positions.length&&positions[end]===positions[end-1]+1)continue;
    for(const row of sheet.getRange(positions[start],1,end-start,keys.length).getDisplayValues())result.push(Object.fromEntries(keys.map((key,index)=>[key,row[index]])));
    start=end;
  }
  return result;
}

function cacheJsonValue_(value){
  const encoded=JSON.stringify(value);
  return encoded.length<=90000&&encodeURIComponent(encoded).replace(/%[A-F\d]{2}/gi,'x').length<=90000?encoded:null;
}
function cacheJson_(key,value,seconds){const encoded=cacheJsonValue_(value);if(encoded)try{CacheService.getScriptCache().put(key,encoded,seconds);}catch(_){}}

function sheetRowRanges_(positions,gap=8){
  if(!positions.length)return [];
  const dense=positions.at(-1)-positions[0]+1<=Math.max(2000,positions.length*4),ranges=[];let start=0;
  for(let end=1;end<=positions.length;end++){
    if(end<positions.length&&positions[end]-positions[start]<2000&&(dense||positions[end]-positions[end-1]<=gap))continue;
    ranges.push([positions[start],positions[end-1]]);start=end;
  }
  return ranges;
}

function newsWorkRows_(job,limit){
  const selected=[],days=newsRecordIndex_().days;
  scan:for(const day of Object.keys(days).sort().reverse()){
    if(job.cursor&&day>job.cursor.date)continue;
    for(const [first,last] of days[day].slice().reverse())for(let row=Math.min(last,job.total+1);row>=Math.max(first,job.firstRow||2);row--){
      if(job.cursor&&day===job.cursor.date&&row>=job.cursor.row)continue;
      selected.push({day,row});if(selected.length>=limit)break scan;
    }
  }
  const rows=new Map(newsRowsAt_(selected.map(item=>item.row).sort((a,b)=>a-b),64).map(row=>[row._sheetRow,row]));return selected.map(item=>rows.get(item.row));
}

function newsWorkCursor_(row){return {date:row.fecha,row:row._sheetRow};}

function writeNewsCells_(updates){
  const sheet=newsSheet_(),ordered=updates.slice().sort((a,b)=>a.column-b.column||a.row-b.row);
  for(let start=0;start<ordered.length;){
    let end=start+1;while(end<ordered.length&&ordered[end].column===ordered[start].column&&ordered[end].row-ordered[end-1].row<=64&&ordered[end].row-ordered[start].row<250)end++;
    const first=ordered[start].row,column=ordered[start].column,size=ordered[end-1].row-first+1,values=size===end-start?ordered.slice(start,end).map(item=>[item.value]):sheet.getRange(first,column,size,1).getDisplayValues();
    if(size!==end-start)for(const item of ordered.slice(start,end))values[item.row-first]=[item.value];
    sheet.getRange(first,column,size,1).setNumberFormat('@').setValues(values);start=end;
  }
}

// Shared membership index: translations and functional analysis only read business articles.
function businessNewsIndex_(){
  const sheet=newsSheet_(),count=Math.max(0,sheet.getLastRow()-1),job=classificationJob_();
  const cache=CacheService.getScriptCache(),key='business-news-index:'+newsStorageKey_()+':'+RADAR.version+':'+(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')+':'+(job?.revision||'0')+':'+(job?.next||0)+':'+count,cached=readDashboardCache_(cache,key);if(cached)return cached;
  if(!count)return {rows:[],revision:sha256_('[]')};
  const labels=sheet.getRange(2,RADAR.sheets.Noticias.indexOf('clasificacion')+1,count,1).getDisplayValues(),dates=sheet.getRange(2,1,count,2).getDisplayValues(),captured=sheet.getRange(2,RADAR.sheets.Noticias.indexOf('capturada')+1,count,1).getDisplayValues();
  const rows=dates.flatMap(([id,fecha],index)=>id&&businessNews_({clasificacion:labels[index][0]})?[{id,fecha,captured:captured[index][0],row:index+2,priority:0}]:[]).sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.row-a.row);
  const value={rows,revision:sha256_(JSON.stringify(rows.map(row=>[row.id,row.fecha,row.row])))};writeDashboardCache_(cache,key,value);return value;
}

let newsSheetOverride_,taxonomySheetOverride_,dataGenerationMemory_;
function dataGeneration_(){return dataGenerationMemory_||(dataGenerationMemory_=JSON.parse(properties_().getProperty('DATA_GENERATION')||'{}'));}
function newsSheet_(){return book_().getSheetByName(newsSheetOverride_||dataGeneration_().newsSheet||'Noticias');}
function newsStorageKey_(){return newsSheetOverride_||dataGeneration_().newsSheet||'Noticias';}

function taxonomyStorageKey_(){return taxonomySheetOverride_||dataGeneration_().taxonomySheet||'Taxonomia';}
function taxonomySheet_(){return book_().getSheetByName(taxonomyStorageKey_());}

function publishedNewsRevision_(){return dataGeneration_().revision||properties_().getProperty('NEWS_REVISION')||'0';}

const NEWSLETTER_ARCHIVE_TABLES=Object.freeze(['NewsletterContenido','NewsletterEdiciones']);
function newsletterStorageKey_(name){return dataGeneration_().newsletterTables?.[name]||name;}
function newsletterSheet_(name){return book_().getSheetByName(newsletterStorageKey_(name));}
function newsletterArchiveVersion_(){return properties_().getProperty('NEWSLETTER_ARCHIVE_REVISION')||'0';}
function newsletterArchiveKey_(){return JSON.stringify([newsletterArchiveVersion_(),NEWSLETTER_ARCHIVE_TABLES.map(newsletterStorageKey_)]);}
function markNewsletterArchiveEdited_(){properties_().setProperty('NEWSLETTER_ARCHIVE_REVISION',Utilities.getUuid());}
function recordSheet_(name){return name==='Noticias'?newsSheet_():name==='Taxonomia'?taxonomySheet_():NEWSLETTER_ARCHIVE_TABLES.includes(name)?newsletterSheet_(name):book_().getSheetByName(name);}

const LOG_LIMITS=Object.freeze({Auditoria:5000,Telemetria:3000,Ejecuciones:1500,Cobertura:2000,Adopcion:5000,NewsletterEventos:2000});
function enforceLogLimit_(name,sheet=recordSheet_(name)){
 const limit=LOG_LIMITS[name];if(!limit)return;const overflow=sheet.getLastRow()-1-limit;if(overflow>0)sheet.deleteRows(2,overflow);
}
