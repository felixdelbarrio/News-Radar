function newsUrlIdentity_(value){
  const url=canonicalUrl_(value);if(!url)return '';
  const [path,query='']=url.split('?'),google=domainMatches_(url,'news.google.com'),parameters=query.split('&').filter(value=>value&&!/^msclkid=/i.test(value)&&!(google&&/^oc=/i.test(value))).join('&');
  return (google?path.replace('/rss/articles/','/articles/'):path)+(parameters?'?'+parameters:'');
}
function titleKey_(title,publisher){
  let text=searchText_(plainText_(title));const source=searchText_(publisher);
  if(source&&text.endsWith(source)){
    const prefix=text.slice(0,-source.length);if(/\s*[-–—|:]\s*$/.test(prefix))text=prefix.replace(/\s*[-–—|:]\s*$/,'');
  }
  const normalized=text.replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  return normalized.length>=30&&normalized.split(' ').length>=5?normalized:'';
}
function titleIdentity_(item){
  const key=titleKey_(item.title,item.publisher),date=new Date(item.date);
  if(!key||!Number.isFinite(date.getTime()))return null;
  const day=typeof item.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)?date:calendarDate_(date);
  return {key,day:day.getTime()/86400000};
}
function editorialIdentity_(item,identity=titleIdentity_(item)){
  const publisher=searchText_(item.publisher),entity=item.entity?searchText_(entityKey_(item.entity)):'',country=searchText_(item.country);
  if(!identity||!publisher||!entity)return null;
  const tokens=identity.key.split(' ');if(tokens.length<8)return null;
  // Two stable anchors bound candidate lookup by country, publisher, entity and date.
  const anchors=tokens.filter(token=>token.length>=4&&!/\d/.test(token)).slice(0,2);
  return anchors.length===2?{key:JSON.stringify([country,publisher,entity,...anchors]),tokens}:null;
}
function rememberTitle_(known,item,entry=true){
  const identity=titleIdentity_(item);if(!identity)return;
  if(!known.titles.has(identity.key))known.titles.set(identity.key,new Map());known.titles.get(identity.key).set(identity.day,entry);
  const editorial=editorialIdentity_(item,identity);if(!editorial)return;
  known.editorial=known.editorial||new Map();if(!known.editorial.has(editorial.key))known.editorial.set(editorial.key,new Map());
  const days=known.editorial.get(editorial.key);if(!days.has(identity.day))days.set(identity.day,[]);
  const candidates=days.get(identity.day);
  if(candidates.length<32)candidates.push({tokens:editorial.tokens,entry});
}
function equivalentEditorialTitle_(a,b){
  if(a.length!==b.length)return false;
  let differences=0;
  for(let i=0;i<a.length;i++){
    if(a[i]===b[i])continue;
    if(++differences>1||a[i].length<8||a[i].length!==b[i].length||/\d/.test(a[i]+b[i]))return false;
    const left=a[i],right=b[i];let at=0;while(at<left.length&&left[at]===right[at])at++;
    // Only an adjacent transposition, not a substituted word, amount or product.
    if(left[at]!==right[at+1]||left[at+1]!==right[at]||left.slice(at+2)!==right.slice(at+2))return false;
  }
  return differences===1;
}
function duplicateTitleEntry_(known,item){
  const identity=titleIdentity_(item);if(!identity)return;
  const days=known.titles.get(identity.key);
  if(days)for(let offset=-COLLECTION_POLICY.duplicateDays;offset<=COLLECTION_POLICY.duplicateDays;offset++)if(days.has(identity.day+offset))return days.get(identity.day+offset);
  const editorial=editorialIdentity_(item,identity),candidates=editorial&&known.editorial?.get(editorial.key);if(!candidates)return;
  for(let offset=-COLLECTION_POLICY.duplicateDays;offset<=COLLECTION_POLICY.duplicateDays;offset++)for(const candidate of candidates.get(identity.day+offset)||[])if(equivalentEditorialTitle_(editorial.tokens,candidate.tokens))return candidate.entry;
}
function duplicateTitle_(known,item){return duplicateTitleEntry_(known,item)!==undefined;}
function newsRepresentative_(a,b){
  const original=row=>/europa\s*press/i.test(String(row.medio||''))||domainMatches_(row.url||'','europapress.es');
  const origin=Number(original(a))-Number(original(b));
  const richer=String(a.extracto||'').length-String(b.extracto||'').length;
  const direct=Number(!domainMatches_(a.url||'','news.google.com'))-Number(!domainMatches_(b.url||'','news.google.com'));
  return (origin||richer||direct||String(b.url||'').localeCompare(String(a.url||''))||String(b.id||'').localeCompare(String(a.id||'')))>0?a:b;
}
function uniqueNews_(rows,groups=null){
  const known={titles:new Map()},urls=new Map(),result=[],parents=[],members=groups?[]:null;
  const root=index=>{while(parents[index]!==index){parents[index]=parents[parents[index]];index=parents[index];}return index;};
  for(const row of rows){
    const items=[row.titular,row.original?.titular,...(row.identityTitles||[])].filter(Boolean).map(title=>({title,date:row.fecha,publisher:row.medio,entity:row.entidad,country:row.pais})),url=newsUrlIdentity_(row.url);
    const matches=new Set([url?urls.get(url):undefined,...items.map(item=>duplicateTitleEntry_(known,item))].filter(index=>index!==undefined).map(root));
    const index=matches.size?Math.min(...matches):result.length;
    if(!matches.size){parents.push(index);result.push(row);}
    else{for(const other of matches)if(other!==index){result[index]=newsRepresentative_(result[index],result[other]);parents[other]=index;result[other]=null;}result[index]=newsRepresentative_(result[index],row);}
    if(members)members.push(index);if(url)urls.set(url,index);for(const item of items)rememberTitle_(known,item,index);
  }
  if(groups){const positions=new Map(rows.map((row,index)=>[row,index]));rows.forEach((row,index)=>{const representative=result[root(members[index])];if(representative!==row)groups.push({index,representativeIndex:positions.get(representative)});});}
  return result.filter(Boolean);
}

// Read-only consolidation plan. Historical newsletter snapshots keep their original IDs.
function previewNewsDeduplication(){
  authorize_(true);
  const rows=translationIdentityRows_(rows_('Noticias')),aliases=[],survivors=uniqueNews_(rows,aliases),groups=new Map();
  for(const alias of aliases){
    if(!groups.has(alias.representativeIndex))groups.set(alias.representativeIndex,{representative:rows[alias.representativeIndex],duplicates:[]});
    groups.get(alias.representativeIndex).duplicates.push(rows[alias.index]);
  }
  return {revision:properties_().getProperty('NEWS_RECORDS_REVISION')||'0',total:rows.length,unique:survivors.length,duplicates:aliases.length,groups:[...groups.values()]};
}
