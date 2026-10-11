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
function rows_(sheet, limit, width=RADAR.sheets[sheet].length) {
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

function trim_(name,limit) {
  const sheet=book_().getSheetByName(name),excess=sheet.getLastRow()-1-limit;
  if(excess>0){sheet.deleteRows(2,excess);if(name==='Traducciones')articleTranslationRows_=undefined;}
}

function rowsById_(name,ids,limit){
  const sheet=book_().getSheetByName(name),count=Math.min(Math.max(0,sheet.getLastRow()-1),limit),keys=RADAR.sheets[name],result=[];
  if(!count)return result;
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
