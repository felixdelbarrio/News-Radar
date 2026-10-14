function cachedNewsRecords_(){
  const cache=CacheService.getScriptCache(),key='news-records:'+sha256_(configurationRevision_()+'|'+(properties_().getProperty('NEWS_RECORDS_REVISION')||'0')),raw=cache.get(key);
  if(raw){
    const keys=Array.from({length:Number(raw)},(_,index)=>key+':'+index),parts=cache.getAll(keys);
    if(keys.every(key=>parts[key]))return keys.flatMap(key=>JSON.parse(parts[key])).map(unpackNews_);
  }
  const rows=annotateNews_(rows_('Noticias',settings_().newsReadLimit)),chunks=[];
  function chunk(items){
    const value=cacheJsonValue_(items);if(value){chunks.push(value);return true;}
    if(items.length<2)return false;const middle=Math.ceil(items.length/2);return chunk(items.slice(0,middle))&&chunk(items.slice(middle));
  }
  let complete=true;for(let i=0;i<rows.length;i+=NEWS_CACHE.chunkRows)if(!chunk(rows.slice(i,i+NEWS_CACHE.chunkRows).map(packNews_))){complete=false;break;}
  if(complete){if(chunks.length)cache.putAll(Object.fromEntries(chunks.map((value,index)=>[key+':'+index,value])),NEWS_CACHE.seconds);cache.put(key,String(chunks.length),NEWS_CACHE.seconds);}
  return rows;
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
