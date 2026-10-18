function newsRecordsKey_(){return 'news-records:'+sha256_(JSON.stringify([RADAR.version,newsStorageKey_(),taxonomyStorageKey_(),configurationRevision_(),properties_().getProperty('NEWS_RECORDS_REVISION')||'0']));}
function newsRecordIndex_(){
  const key='news-records:index:'+newsStorageKey_()+':'+RADAR.version+':'+(properties_().getProperty('NEWS_CONTENT_REVISION')||'0'),cache=CacheService.getScriptCache(),cached=readDashboardCache_(cache,key);if(cached)return cached;
  const sheet=newsSheet_(),count=sheet.getLastRow()-1,days=Object.create(null),entities=new Set(),sources=new Set();
  if(count>0)sheet.getRange(2,2,count,4).getDisplayValues().forEach(([date,,source,entity],index)=>{
    const position=index+2,ranges=days[date]||(days[date]=[]),last=ranges.at(-1);
    if(last&&last[1]===position-1)last[1]=position;else ranges.push([position,position]);
    if(entity)entities.add(entity);if(source)sources.add(source);
  });
  const value={days,entities:[...entities],sources:[...sources]};writeDashboardCache_(cache,key,value);return value;
}
function cachedNewsRecords_(query={}){
  const cache=CacheService.getScriptCache(),key=newsRecordsKey_()+':'+sha256_(JSON.stringify([query.from||'',query.to||''])),raw=cache.get(key);
  if(raw){
    const manifest=JSON.parse(raw),keys=Array.from({length:manifest.parts},(_,index)=>key+':'+manifest.id+':'+index),parts=cache.getAll(keys);
    if(keys.every(key=>parts[key]))return keys.flatMap(key=>JSON.parse(parts[key])).map(unpackNews_);
  }
  const rows=annotateNews_(newsRowsForPeriod_(query).filter(businessNews_)),chunks=[];
  function chunk(items){
    const value=cacheJsonValue_(items);if(value){chunks.push(value);return chunks.length<=NEWS_CACHE.recordParts;}
    if(items.length<2)return false;const middle=Math.ceil(items.length/2);return chunk(items.slice(0,middle))&&chunk(items.slice(middle));
  }
  let complete=true;for(let i=0;i<rows.length;i+=NEWS_CACHE.chunkRows)if(!chunk(rows.slice(i,i+NEWS_CACHE.chunkRows).map(packNews_))){complete=false;break;}
  if(complete){const id=Utilities.getUuid();if(chunks.length)cache.putAll(Object.fromEntries(chunks.map((value,index)=>[key+':'+id+':'+index,value])),NEWS_CACHE.seconds);cache.put(key,JSON.stringify({id,parts:chunks.length}),NEWS_CACHE.seconds);}
  return rows;
}
function newsPeriodCount_(query){
  let count=0;for(const [day,ranges] of Object.entries(newsRecordIndex_().days))if(day>=query.from&&day<=query.to)for(const [first,last] of ranges)count+=last-first+1;return count;
}
function newsRowsForPeriod_(query={}){
  const positions=[];
  for(const [day,ranges] of Object.entries(newsRecordIndex_().days))if((!query.from||day>=query.from)&&(!query.to||day<=query.to))for(const [first,last] of ranges)for(let row=first;row<=last;row++)positions.push(row);
  return newsRowsAt_(positions.sort((a,b)=>a-b));
}
function newsRowsAt_(positions,gap=8){
  if(!positions.length)return [];
  const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,result=[],wanted=new Set(positions);
  for(const [first,last] of sheetRowRanges_(positions,gap)){
    sheet.getRange(first,1,last-first+1,keys.length).getDisplayValues().forEach((values,index)=>{if(wanted.has(first+index))result.push({...Object.fromEntries(keys.map((key,i)=>[key,values[i]])),_sheetRow:first+index});});
  }
  return result;
}
function dashboardAdministration_(){
  const key='dashboard-admin:'+RADAR.version+':'+configurationRevision_(),cached=CacheService.getScriptCache().get(key);if(cached)return JSON.parse(cached);
  const value={maxFeeds:settings_().maxCustomFeeds,schedule:'Ventana: últimos '+settings_().windowDays+' días. '+collectionScheduleLabel_()+'.',feeds:customFeeds_(),configuredFeeds:configuredFeeds_(),sheetUrl:book_().getUrl()};
  cacheJson_(key,value,300);return value;
}

// A manifest is published only after all bounded fragments have been stored.
function readDashboardCache_(cache,key){
  const raw=cache.get(key);if(!raw)return null;
  const manifest=JSON.parse(raw),keys=Array.from({length:manifest.parts},(_,index)=>key+':'+manifest.id+':'+index),parts=cache.getAll(keys);
  return keys.every(key=>typeof parts[key]==='string')?JSON.parse(keys.map(key=>JSON.parse(parts[key])).join('')):null;
}
function writeDashboardCache_(cache,key,data){
  const encoded=JSON.stringify(data),size=NEWS_CACHE.dashboardChars,count=Math.ceil(encoded.length/size);
  if(count>NEWS_CACHE.dashboardParts)return;
  const id=Utilities.getUuid(),parts={};
  for(let index=0;index<count;index++)parts[key+':'+id+':'+index]=JSON.stringify(encoded.slice(index*size,(index+1)*size));
  cache.putAll(parts,NEWS_CACHE.seconds);cache.put(key,JSON.stringify({id,parts:count}),NEWS_CACHE.seconds);
}
