function collectionWindows_(range){
  const windows=[],first=Date.parse(range.from),cursor=Date.parse(range.to);
  for(let to=cursor;to>=first;to-=COLLECTION_POLICY.windowDays*86400000)windows.push({from:new Date(Math.max(first,to-(COLLECTION_POLICY.windowDays-1)*86400000)).toISOString().slice(0,10),to:new Date(to).toISOString().slice(0,10)});
  return windows;
}
function collectionFeeds_(range){
  const enabled=feeds_(),windows=collectionWindows_(range);
  const rss=enabled.filter(feed=>feed.kind==='rss').flatMap(feed=>domainMatches_(feed.url,'news.google.com')?windows.map(window=>collectionProfile_(feed,window)):[{...feed,range}]);
  const profiles=enabled.filter(feed=>feed.kind==='profile');
  const selected=rss.concat(windows.flatMap(window=>profiles.flatMap(base=>{
    const variants=[base,{...base,capabilitySearch:true}];
    return variants.map(feed=>collectionProfile_(feed,window)).filter(Boolean);
  })));
  const primary=new Set(configuration_().applicationScope.find(scope=>scope.name==='Empresas e instituciones').countries),seen=new Set();
  return selected.filter(feed=>{if(seen.has(feed.url))return false;seen.add(feed.url);return true;}).sort((a,b)=>String(b.range?.to||'').localeCompare(String(a.range?.to||''))||Number(primary.has(b.country))-Number(primary.has(a.country)));
}

function splitCollectionFeed_(feed){
  if(!feed.range||feed.range.from===feed.range.to)return [];
  const from=Date.parse(feed.range.from),to=Date.parse(feed.range.to),mid=from+Math.floor((to-from)/86400000/2)*86400000;
  const ranges=[{from:feed.range.from,to:new Date(mid).toISOString().slice(0,10)},{from:new Date(mid+86400000).toISOString().slice(0,10),to:feed.range.to}];
  return ranges.reverse().map(range=>domainMatches_(feed.url,'news.google.com')?{...collectionProfile_({...feed,kind:'rss'},range),kind:feed.kind}:collectionProfile_(feed,range)).filter(Boolean);
}
function collectionTaskFeed_(task,feeds,range){
  if(feeds.has(task.url))return {...feeds.get(task.url),range};
  const base=feeds.get('source:'+task.fuente);if(!base||(base.kind!=='profile'&&!domainMatches_(base.url,'news.google.com')))return null;
  const periodRange=collectionQueryRange_(task.url);if(!periodRange)return null;
  if(!domainMatches_(task.url,'news.google.com'))return null;
  const language=base.language?.split('-')[0],query=decodeURIComponent((task.url.match(/[?&]q=([^&]*)/)||[])[1]||'').toLowerCase();
  if(['it','de','fr','pt','tr'].includes(language)){
    const languages=configuration_().searchLanguages,native=new Set((languages.find(row=>row.language===language)?.terms||[]).map(searchText_));
    if((languages.find(row=>row.language==='en')?.terms||[]).some(term=>!native.has(searchText_(term))&&query.includes('"'+term.toLowerCase()+'"')))return null;
  }
  // Preserve the historical query: rotating capabilities are not a new task identity.
  return countryScopedSource_({...base,url:task.url,range:periodRange});
}

function collectionRecentRange_(now){
  const to=calendarDate_(now),from=new Date(to);from.setUTCDate(from.getUTCDate()-settings_().windowDays);
  return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
}

function collectionProfile_(base,range){
  base=countryScopedSource_(base);
  if(base.kind==='rss'&&domainMatches_(base.url,'news.google.com')){
    const query=decodeURIComponent((base.url.match(/[?&]q=([^&]*)/)||[])[1]||'').replace(/\s*when:\d+d\b/g,'').replace(/\s*(?:after|before):\d{4}-\d{2}-\d{2}/g,'').trim();
    return {...base,range,url:canonicalUrl_(base.url.replace(/([?&]q=)[^&]*/,(_,prefix)=>prefix+encodeURIComponent(collectionPeriod_(range)+' '+query)))};
  }
  const config=configuration_(),entity=config.entities.find(row=>row.name===base.entity),geo=config.geographies.find(row=>row.name===base.country);
  const feed=profileFeed_(geo,entity,range,base.capabilitySearch);return feed?{...feed,range}:null;
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
      const job={id,tipo:'daily',desde:period.from,hasta:period.to,inicio:dates[0]||new Date().toISOString(),fin:'',estado:'Pendiente',total:0,procesadas:0,pendientes:0,omitidas:0,fallidas:0,nuevas:0,actualizada:'',pausa:paused};
      collectionSnapshots_(tasks,[job]);append_('Recargas',[RADAR.sheets.Recargas.map(key=>job[key])]);jobs.push(job);
    }
  }
  properties_().deleteProperty('COLLECTION_RANGE');properties_().deleteProperty('COLLECTION_AFTER');CacheService.getScriptCache().remove('collection-status');
}

function collectionQueryRange_(url){
  let query;try{query=decodeURIComponent((url.match(/[?&]q=([^&]*)/)||[])[1]||'');}catch(_){return null;}
  const period=query.match(/after:(\d{4}-\d{2}-\d{2}) before:(\d{4}-\d{2}-\d{2})/);if(!period)return null;
  const after=Date.parse(period[1]),before=Date.parse(period[2]);
  if(!Number.isFinite(after)||!Number.isFinite(before)||new Date(after).toISOString().slice(0,10)!==period[1]||new Date(before).toISOString().slice(0,10)!==period[2]||before-after<2*86400000)return null;
  return {from:new Date(after+86400000).toISOString().slice(0,10),to:new Date(before-86400000).toISOString().slice(0,10)};
}
function upgradeCollectionQueries_(){
  const feeds=collectionFeedIndex_(),tasks=rows_('Recopilacion'),urls=tasks.map(task=>[task.url]);let changed=false;
  tasks.forEach((task,index)=>{
    const base=feeds.get('source:'+task.fuente);if(!base||!['Pendiente','Reintento programado'].includes(task.estado))return;
    const url=countryScopedSource_({...base,url:task.url}).url;
    if(url!==task.url){urls[index]=[url];changed=true;}
  });
  if(changed)book_().getSheetByName('Recopilacion').getRange(2,3,urls.length,1).setValues(urls);
}
