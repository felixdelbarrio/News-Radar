function titleKey_(title,publisher){
  let text=searchText_(plainText_(title));const source=searchText_(publisher);
  if(source&&text.endsWith(source)){
    const prefix=text.slice(0,-source.length);if(/\s[-–—|:]\s*$/.test(prefix))text=prefix.replace(/\s[-–—|:]\s*$/,'');
  }
  const normalized=text.replace(/[^a-z0-9]+/g,' ').trim();
  return normalized.length>=30&&normalized.split(' ').length>=5?normalized:'';
}
function titleIdentity_(item){
  const key=titleKey_(item.title,item.publisher),date=new Date(item.date);
  if(!key||!Number.isFinite(date.getTime()))return null;
  const day=typeof item.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)?date:calendarDate_(date);
  return {key,day:day.getTime()/86400000};
}
function rememberTitle_(known,item,entry=true){
  const identity=titleIdentity_(item);if(!identity)return;
  if(!known.titles.has(identity.key))known.titles.set(identity.key,new Map());known.titles.get(identity.key).set(identity.day,entry);
}
function duplicateTitleEntry_(known,item){
  const identity=titleIdentity_(item);if(!identity)return;
  const days=known.titles.get(identity.key);if(!days)return;
  for(let offset=-COLLECTION_POLICY.duplicateDays;offset<=COLLECTION_POLICY.duplicateDays;offset++)if(days.has(identity.day+offset))return days.get(identity.day+offset);
}
function duplicateTitle_(known,item){return duplicateTitleEntry_(known,item)!==undefined;}
function newsRepresentative_(a,b){
  const original=row=>/europa\s*press/i.test(String(row.medio||''))||domainMatches_(row.url||'','europapress.es');
  const origin=Number(original(a))-Number(original(b));
  const richer=String(a.extracto||'').length-String(b.extracto||'').length;
  const direct=Number(!domainMatches_(a.url||'','news.google.com'))-Number(!domainMatches_(b.url||'','news.google.com'));
  return (origin||richer||direct||String(b.url||'').localeCompare(String(a.url||''))||String(b.id||'').localeCompare(String(a.id||'')))>0?a:b;
}
function uniqueNews_(rows){
  const titles=new Map(),known={titles},urls=new Map(),result=[];
  for(const row of rows){
    const item={title:row.titular,date:row.fecha,publisher:row.medio},url=canonicalUrl_(row.url),index=url&&urls.has(url)?urls.get(url):duplicateTitleEntry_(known,item);
    if(index!==undefined){result[index]=newsRepresentative_(result[index],row);if(url)urls.set(url,index);rememberTitle_(known,item,index);}
    else{const index=result.length;result.push(row);if(url)urls.set(url,index);rememberTitle_(known,item,index);}
  }
  return result;
}
