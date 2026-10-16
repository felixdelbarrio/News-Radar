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
  const s=book_().getSheetByName(sheet), count=s.getLastRow()-1;
  if (count<1) return [];
  const size=limit?Math.min(count,limit):count;
  const keys=RADAR.sheets[sheet].slice(0,width);
  return s.getRange(count-size+2,1,size,keys.length).getDisplayValues().map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]])));
}
function append_(name, rows) {
  if (!rows.length) return;
  const s=book_().getSheetByName(name), start=s.getLastRow()+1, needed=start+rows.length-1;
  if (needed>s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(),needed-s.getMaxRows());
  const range=s.getRange(start,1,rows.length,rows[0].length);range.setNumberFormat('@').setValues(rows.map(r=>r.map(safeCell_)));
  if(name==='Ejecuciones')CacheService.getScriptCache().remove('dashboard-runs:'+RADAR.version);
}

function rowsById_(name,ids,limit=Infinity){
  const sheet=book_().getSheetByName(name),count=Math.min(Math.max(0,sheet.getLastRow()-1),limit),keys=RADAR.sheets[name],result=[];
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
function cacheJson_(key,value,seconds){const encoded=cacheJsonValue_(value);if(encoded)CacheService.getScriptCache().put(key,encoded,seconds);}

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
  const positions=[];
  for(const [day,ranges] of Object.entries(newsRecordIndex_().days))for(const [first,last] of ranges)for(let row=first;row<=Math.min(last,job.total+1);row++){
    if(row>=(job.firstRow||2)&&(!job.cursor||day<job.cursor.date||day===job.cursor.date&&row<job.cursor.row))positions.push({day,row});
  }
  positions.sort((a,b)=>b.day.localeCompare(a.day)||b.row-a.row);
  const selected=positions.slice(0,limit),rows=new Map(newsRowsAt_(selected.map(item=>item.row).sort((a,b)=>a-b),64).map(row=>[row._sheetRow,row]));
  return selected.map(item=>rows.get(item.row));
}
function newsWorkCursor_(row){return {date:row.fecha,row:row._sheetRow};}

function writeNewsCells_(updates){
  const sheet=book_().getSheetByName('Noticias'),ordered=updates.slice().sort((a,b)=>a.column-b.column||a.row-b.row);
  for(let start=0;start<ordered.length;){let end=start+1;while(end<ordered.length&&ordered[end].column===ordered[start].column&&ordered[end].row===ordered[end-1].row+1)end++;
    sheet.getRange(ordered[start].row,ordered[start].column,end-start,1).setNumberFormat('@').setValues(ordered.slice(start,end).map(item=>[item.value]));start=end;
  }
}
