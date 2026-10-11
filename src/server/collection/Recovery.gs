function collectionRange_(mode,now){
  if(!['today','year'].includes(mode))throw Error('Selecciona Hoy o Último año.');
  const to=calendarDate_(now),from=new Date(to);if(mode==='year'){const month=from.getUTCMonth();from.setUTCFullYear(from.getUTCFullYear()-1);if(from.getUTCMonth()!==month)from.setUTCDate(0);}
  return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
}
function collectionWindows_(range){
  const windows=[],cursor=new Date(range.from+'T00:00:00Z'),last=new Date(range.to+'T00:00:00Z');
  while(cursor<=last){const next=new Date(cursor);next.setUTCDate(next.getUTCDate()+7);const end=new Date(Math.min(last.getTime(),next.getTime()-86400000));windows.push({from:cursor.toISOString().slice(0,10),to:end.toISOString().slice(0,10)});cursor.setTime(next.getTime());}
  return windows;
}
let collectionFeedMemory_;
function collectionFeeds_(range){
  if(!range)return feeds_();
  const config=configuration_(),key=JSON.stringify(range);if(collectionFeedMemory_?.config===config&&collectionFeedMemory_.key===key)return collectionFeedMemory_.feeds;
  const rss=feeds_().filter(feed=>feed.kind==='rss').map(feed=>({...feed,range}));
  const feeds=rss.concat(collectionWindows_(range).flatMap(window=>defaultFeeds_(window).filter(feed=>feed.enabled&&feed.kind==='profile').map(feed=>({...feed,range:window}))));
  collectionFeedMemory_={config,key,feeds};return feeds;
}
function collectionRangeFromStore_(){const value=properties_().getProperty('COLLECTION_RANGE');return value?JSON.parse(value):null;}

function splitCollectionFeed_(feed){
  if(!feed.range||feed.range.from===feed.range.to)return [];
  const from=Date.parse(feed.range.from),to=Date.parse(feed.range.to),mid=from+Math.floor((to-from)/86400000/2)*86400000;
  const ranges=[{from:feed.range.from,to:new Date(mid).toISOString().slice(0,10)},{from:new Date(mid+86400000).toISOString().slice(0,10),to:feed.range.to}];
  return ranges.map(range=>collectionProfile_(feed,range));
}
function collectionTaskFeed_(task,feeds){
  if(feeds.has(task.url))return feeds.get(task.url);
  const base=feeds.get('source:'+task.fuente);if(!base||base.kind!=='profile')return null;
  const query=decodeURIComponent((task.url.match(/[?&]q=([^&]*)/)||[])[1]||''),period=query.match(/after:(\d{4}-\d{2}-\d{2}) before:(\d{4}-\d{2}-\d{2})/);
  if(!period)return null;
  const from=new Date(period[1]),to=new Date(period[2]);from.setUTCDate(from.getUTCDate()+1);to.setUTCDate(to.getUTCDate()-1);
  const range={from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
  const feed=collectionProfile_(base,range);
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
  const index=new Map(),range=collectionRangeFromStore_();for(const feed of feeds_()){index.set(feed.url,{...feed,range});index.set('source:'+feed.name,feed);}return index;
}
