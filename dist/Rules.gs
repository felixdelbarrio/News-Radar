function plainText_(value) {
  const html=String(value||''), parts=[];
  let cursor=0, hidden='';
  // Extrae texto para clasificación. El cliente escapa este texto al mostrarlo.
  for(const tag of html.matchAll(/<!--[\s\S]*?(?:-->|$)|<[^>]*(?:>|$)/g)){
    if(!hidden)parts.push(html.slice(cursor,tag.index),' ');
    const name=tag[0].match(/^<\s*(\/?)\s*(script|style)\b/i);
    if(name){
      const kind=name[2].toLowerCase();
      if(!name[1]&&!hidden)hidden=kind;
      else if(name[1]&&hidden===kind)hidden='';
    }
    cursor=tag.index+tag[0].length;
  }
  if(!hidden)parts.push(html.slice(cursor));
  return parts.join('').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n[0].toLowerCase()==='x'?n.slice(1):n,n[0].toLowerCase()==='x'?16:10),0x10ffff))).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[m]).replace(/\s+/g,' ').trim();
}
function canonicalUrl_(value) {
  const match = String(value || '').trim().match(/^https:\/\/([a-z0-9.-]+)(?::443)?(\/[^#?]*)?(?:\?([^#]*))?(?:#.*)?$/i);
  if (!match) return '';
  const query = (match[3] || '').split('&').filter(x=>x&&!/^(utm_\w+|fbclid|gclid)=/i.test(x)).sort().join('&');
  return 'https://' + match[1].toLowerCase() + (match[2] || '/') + (query?'?'+query:'');
}
function domainMatches_(url, domain) {
  const host = (url.match(/^https:\/\/([^/]+)/)||[])[1] || '';
  return host === domain || host.endsWith('.'+domain);
}
let businessIndexMemory_;
const newsRelevanceMemory_=new WeakMap();
function newsRelevance_(row){
  if(!newsRelevanceMemory_.has(row))newsRelevanceMemory_.set(row,digitalAssessment_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).score);
  return newsRelevanceMemory_.get(row);
}
function packNews_(row){return [row,newsRelevanceMemory_.get(row)??0];}
function unpackNews_(record){newsRelevanceMemory_.set(record[0],record[1]);return record[0];}
function businessIndex_(){
  const config=configuration_();if(businessIndexMemory_?.config===config)return businessIndexMemory_;
  const entities=new Map(),entityTerms=new Map();for(const row of config.entities){const terms=[row.name,...row.aliases].map(searchText_);entityTerms.set(row.name,terms);for(const term of terms)entities.set(term,row);}
  const rules=rows=>rows.filter(row=>row.enabled).map(row=>({...row,terms:[...new Set(row.terms.map(searchText_))],context:(row.context||[]).map(searchText_),exclude:(row.exclude||[]).map(searchText_)}));
  const capabilities=Object.entries(config.capabilities).flatMap(([segment,rows])=>rules(rows).map(row=>({...row,segment}))),aliases=[...entities].filter(([,row])=>row.enabled).sort((a,b)=>b[0].length-a[0].length);
  const capabilitySegments=new Map();for(const row of capabilities)for(const term of row.terms){const segments=capabilitySegments.get(term)||new Set();segments.add(row.segment);capabilitySegments.set(term,segments);}
  return businessIndexMemory_={config,capabilitySegments,entities,entityTerms,aliases,capabilities,segments:rules(config.segments),signals:rules(config.signals),geographies:config.geographies.filter(row=>row.enabled).map(row=>({...row,terms:[...new Set([row.name,row.searchName,...(row.terms||[])].map(searchText_))]}))};
}
function termsMatch_(text,terms){return terms.some(term=>text.includes(term));}
function phrasePosition_(text,term){
  let at=-1;while((at=text.indexOf(term,at+1))>=0){if((at===0||!/[a-z0-9]/.test(text[at-1]))&&(at+term.length===text.length||!/[a-z0-9]/.test(text[at+term.length])))return at;}return -1;
}
function phraseMatch_(text,term){return phrasePosition_(text,term)>=0;}
function headlineEntity_(headline,index){
  let entity,first=Infinity;for(const [alias,row] of index.aliases){const position=phrasePosition_(headline,alias);if(position>=0&&position<first){entity=row;first=position;}}return entity;
}
function digitalAssessment_(title,text,index=businessIndex_()){
  const capabilities=index.capabilities.filter(row=>row.terms.some(term=>phraseMatch_(text,term)));
  const channel=DIGITAL_RULES.channel.some(term=>phraseMatch_(text,term))||Boolean(capabilities.length&&headlineEntity_(title,index)),change=termsMatch_(title,DIGITAL_RULES.changes),editorial=termsMatch_(title,DIGITAL_RULES.editorial),negative=termsMatch_(title,DIGITAL_RULES.negative);
  const score=(capabilities.length&&channel?3+Math.min(2,capabilities.length):0)+(change&&!editorial?2:0)-(negative?6:0)-(editorial?3:0);
  return {capabilities,score,channel,change,editorial,excluded:negative&&!(capabilities.length&&channel&&change&&!editorial)};
}
function classification_(title,text,includeLabels=true){
  const index=businessIndex_(),assessment=digitalAssessment_(title,text,index);
  const signals=index.signals.filter(row=>termsMatch_(row.scope==='headline'?title:text,row.terms)&&!termsMatch_(title,row.exclude)&&(!row.context.length||termsMatch_(text,row.context))).map(row=>row.name);
  if(assessment.capabilities.length&&assessment.channel&&assessment.change&&assessment.score>0&&!signals.length){const launch=index.signals[0];if(launch&&!termsMatch_(title,launch.exclude))signals.push(launch.name);}
  let segments=index.segments.filter(row=>termsMatch_(text,row.terms)).map(row=>row.name);
  if(assessment.channel)for(const capability of assessment.capabilities){
    const exclusive=capability.terms.some(term=>phraseMatch_(text,term)&&index.capabilitySegments.get(term).size===1);
    const segment=index.segments.find(row=>row.name===(capability.segment==='Empresas'?'Empresas e instituciones':'Retail'));if(exclusive&&segment&&!segments.includes(segment.name))segments.push(segment.name);
  }
  const labels=includeLabels?newsLabels_(assessment,title):undefined;
  return {signals,assessment,segments,labels};
}
function annotateNews_(rows){
  const index=businessIndex_(),taxonomy=new Map(taxonomyCatalog_().map(({id,palanca,subpalanca})=>[id,{id,palanca,subpalanca}]));
  return rows.map(row=>{
    const catalog=index.entities.get(searchText_(row.entidad)),classification=classification_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto),false);
    const annotated={...row,taxonomia:taxonomySaved_(row.taxonomia).ids.map(id=>taxonomy.get(id)).filter(Boolean),etiquetas:savedNewsLabels_(row.clasificacion),entidad:catalog?.name||row.entidad,tipo:catalog?.type||'',segmentos:classification.segments,senales:classification.assessment.excluded?[]:classification.signals};newsRelevanceMemory_.set(annotated,classification.assessment.score);return annotated;
  });
}
function evaluate_(item, feed, now) {
  const publisher=plainText_(item.source),rawTitle=plainText_(item.title);
  const title=publisher&&rawTitle.endsWith(' - '+publisher)?rawTitle.slice(0,-publisher.length-3):rawTitle;
  const url=canonicalUrl_(item.url),date=new Date(item.date);
  if (!title || !url || !domainMatches_(url,feed.domain) || !Number.isFinite(date.getTime())) return {reason:'Falta titular, URL del editor o fecha válida'};
  if(date>now)return {reason:'Fecha futura'};
  if(feed.range){const day=calendarDate_(date).toISOString().slice(0,10);if(day<feed.range.from||day>feed.range.to)return {reason:'Fuera del período de recuperación'};}
  else if(now-date>settings_().windowDays*86400000)return {reason:'Fuera de la ventana de '+settings_().windowDays+' días'};
  const excerpt=plainText_(item.excerpt).slice(0,1500),headline=searchText_(title),text=searchText_(title+' '+excerpt),index=businessIndex_();
  const entity=feed.entity==='Sector'?headlineEntity_(headline,index):index.entities.get(searchText_(feed.entity));
  const classification=classification_(headline,text);
  if(feed.entity==='Sector'&&!entity)return {inRange:true,reason:'Sin entidad de seguimiento en el titular'};
  if(feed.kind==='profile'&&entity&&!index.entityTerms.get(entity.name).some(alias=>phraseMatch_(text,alias)))return {inRange:true,reason:'Sin evidencia de la entidad buscada'};
  const geographyText=text;
  const countries=index.geographies.filter(geo=>geo.terms.some(term=>phraseMatch_(geographyText,term))).map(geo=>geo.name);
  if(feed.kind==='profile'&&countries.length&&!countries.includes(feed.country))return {inRange:true,reason:'Geografía distinta de la búsqueda'};
  const country=countries.length===1?countries[0]:settings_().unknownCountry;
  if(feed.capabilitySearch&&classification.assessment.excluded)return {inRange:true,reason:'Información corporativa sin novedad de canal digital'};
  if(feed.capabilitySearch&&(!classification.assessment.capabilities.length||!classification.assessment.channel))return {inRange:true,reason:'Sin capacidad digital activa en contexto de canal'};
  return {inRange:true,relevant:classification.labels.digital||(!classification.assessment.excluded&&classification.assessment.score>0),item:{date,title,excerpt:feed.kind==='profile'&&excerpt.startsWith(title)?'':excerpt,url,labels:classification.labels,entity:entity?.name||feed.entity,country,language:item.language||feed.language||'',publisher:publisher||''}};
}
function safeCell_(value) {
  return typeof value==='string' && /^[=+@-]/.test(value) ? "'"+value : value;
}

function sha256_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(byte=>(byte&255).toString(16).padStart(2,'0')).join('');}
