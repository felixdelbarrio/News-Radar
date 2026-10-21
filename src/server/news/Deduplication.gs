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
const EDITORIAL_STOPWORDS=new Set('para por con sin del las los una uno unos unas que como desde hasta sobre entre este esta sus the and for with from into this that are was has have not but you your their its dos das uma uns nas nos com sem pelo pela aos sao por que nao em as os de da do es en el la un o a e y i di il lo gli le dei delle per nel nella con che non der die das den dem des ein eine und oder von zur zum mit auf aus bei ist im zu et les des une dans sur pour pas aux du au ne ou ce ces se son sa ses un entre um ao pelo para sem ve bir bu ile icin gibi olan mais como foi'.split(' '));
function editorialIdentity_(item,identity=titleIdentity_(item)){
  const entity=item.entity?searchText_(entityKey_(item.entity)):'';if(!identity||!entity)return null;
  const excluded=new Set([...entity.split(' '),...searchText_(item.publisher).split(/[^\p{L}\p{N}]+/u)]);
  const catalog=businessIndex_().entities.get(entity);for(const alias of catalog?.aliases||[])for(const token of searchText_(alias).split(' '))excluded.add(token);
  const tokens=[...new Set(identity.key.split(' ').filter(token=>(token.length>=3||/\d/.test(token))&&!EDITORIAL_STOPWORDS.has(token)&&!excluded.has(token)))];
  return tokens.length>=5?{key:JSON.stringify([entity,tokens.filter(token=>/\d/.test(token)).sort(),/\b(?:no|not|never|nao|non|nicht|yok)\b/.test(identity.key)]),tokens}:null;
}
function rememberTitle_(known,item,entry=true){
  const identity=titleIdentity_(item);if(!identity)return;
  if(!known.titles.has(identity.key))known.titles.set(identity.key,new Map());known.titles.get(identity.key).set(identity.day,entry);
  const editorial=editorialIdentity_(item,identity);if(!editorial)return;
  known.editorial=known.editorial||new Map();if(!known.editorial.has(editorial.key))known.editorial.set(editorial.key,new Map());
  const days=known.editorial.get(editorial.key);if(!days.has(identity.day))days.set(identity.day,[]);
  const candidates=days.get(identity.day);
  candidates.push({tokens:editorial.tokens,entry});
}
function equivalentEditorialTitle_(a,b){
  if(a.length<5||b.length<5)return false;
  const numbers=tokens=>tokens.filter(token=>/\d/.test(token)).sort().join('|');if(numbers(a)!==numbers(b))return false;
  const right=new Set(b),intersection=a.filter(token=>right.has(token)).length;
  return intersection/Math.min(a.length,b.length)>=.72||intersection/(a.length+b.length-intersection)>=.60;
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
    const items=[row.titular,row.original?.titular,...(row.identityTitles||[])].filter(Boolean).map(title=>({title,date:row.fecha,publisher:row.medio,entity:entityKey_(row.entidad),country:row.pais})),url=newsUrlIdentity_(row.url);
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
