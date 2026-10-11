function collectionRange_(mode,now){
  if(!['today','year'].includes(mode))throw Error('Selecciona Hoy o Último año.');
  const to=calendarDate_(now),from=new Date(to);if(mode==='year'){const month=from.getUTCMonth();from.setUTCFullYear(from.getUTCFullYear()-1);if(from.getUTCMonth()!==month)from.setUTCDate(0);}
  return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
}
function collectionWindows_(range){
  const windows=[],first=Date.parse(range.from),cursor=Date.parse(range.to);
  for(let to=cursor;to>=first;to-=7*86400000)windows.push({from:new Date(Math.max(first,to-6*86400000)).toISOString().slice(0,10),to:new Date(to).toISOString().slice(0,10)});
  return windows;
}
function collectionFeeds_(range){
  const rss=feeds_().filter(feed=>feed.kind==='rss').map(feed=>({...feed,range}));
  return rss.concat(collectionWindows_(range).flatMap(window=>defaultFeeds_(window).filter(feed=>feed.enabled&&feed.kind==='profile').map(feed=>({...feed,range:window}))));
}

function splitCollectionFeed_(feed){
  if(!feed.range||feed.range.from===feed.range.to)return [];
  const from=Date.parse(feed.range.from),to=Date.parse(feed.range.to),mid=from+Math.floor((to-from)/86400000/2)*86400000;
  const ranges=[{from:feed.range.from,to:new Date(mid).toISOString().slice(0,10)},{from:new Date(mid+86400000).toISOString().slice(0,10),to:feed.range.to}];
  return ranges.reverse().map(range=>collectionProfile_(feed,range));
}
function collectionTaskFeed_(task,feeds,range){
  if(feeds.has(task.url))return {...feeds.get(task.url),range};
  const base=feeds.get('source:'+task.fuente);if(!base||base.kind!=='profile')return null;
  const query=decodeURIComponent((task.url.match(/[?&]q=([^&]*)/)||[])[1]||''),period=query.match(/after:(\d{4}-\d{2}-\d{2}) before:(\d{4}-\d{2}-\d{2})/);
  if(!period)return null;
  const from=new Date(period[1]),to=new Date(period[2]);from.setUTCDate(from.getUTCDate()+1);to.setUTCDate(to.getUTCDate()-1);
  const periodRange={from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
  const feed=collectionProfile_(base,periodRange);
  return feed.url===task.url?feed:null;
}

function collectionRecentRange_(now){
  const to=calendarDate_(now),from=new Date(to);from.setUTCDate(from.getUTCDate()-settings_().windowDays);
  return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
}

function collectionProfile_(base,range){
  const config=configuration_(),entity=config.entities.find(row=>row.name===base.entity),geo=config.geographies.find(row=>row.name===base.country);
  return {...profileFeed_(geo,entity,range),range};
}
function collectionFeedIndex_(){
  const index=new Map();for(const feed of feeds_()){index.set(feed.url,feed);index.set('source:'+feed.name,feed);}return index;
}

function initializeCollectionQueue_(){
  const value=properties_().getProperty('COLLECTION_RANGE'),range=value?JSON.parse(value):null,paused=properties_().getProperty('COLLECTION_AFTER')||'',tasks=rows_('Recopilacion'),jobs=collectionJobs_();
  for(const job of jobs)if(job.tipo==='manual'){job.tipo='daily';writeCollectionJob_(job);}
  if(tasks.length){
    const jobIndex=new Map(jobs.map(job=>[job.id,job]));
    const priorities=tasks.map(task=>{if(task.prioridad)return task.prioridad;const before=task.url.match(/before(?::|%3A)(\d{4}-\d{2}-\d{2})/i);return before?new Date(Date.parse(before[1])-86400000).toISOString().slice(0,10):jobIndex.get(task.ciclo)?.hasta||range?.to||calendarDate_(new Date()).toISOString().slice(0,10);});
    book_().getSheetByName('Recopilacion').getRange(2,10,tasks.length,1).setNumberFormat('@').setValues(priorities.map(value=>[value]));
    for(const id of new Set(tasks.map(task=>task.ciclo)))if(!jobs.some(job=>job.id===id)){
      const dates=tasks.filter(task=>task.ciclo===id).map(task=>task.actualizada).filter(Boolean).sort(),period=range||{from:priorities.slice().sort()[0],to:priorities.slice().sort().at(-1)};
      const job={id,tipo:Date.parse(period.to)-Date.parse(period.from)>7*86400000?'annual':'daily',desde:period.from,hasta:period.to,inicio:dates[0]||new Date().toISOString(),fin:'',estado:'Pendiente',total:0,procesadas:0,pendientes:0,omitidas:0,fallidas:0,nuevas:0,actualizada:'',pausa:paused};
      collectionSnapshots_(tasks,[job]);append_('Recargas',[RADAR.sheets.Recargas.map(key=>job[key])]);jobs.push(job);
    }
  }
  properties_().deleteProperty('COLLECTION_RANGE');properties_().deleteProperty('COLLECTION_AFTER');CacheService.getScriptCache().remove('collection-status');
}
