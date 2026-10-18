function publisherKey_(value){const text=String(value||'').trim();return /^bbva(?:\s*[·-]\s*empresas|\s+empresas|\s+noticias)?$/i.test(text)?'BBVA':text;}
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
  if(!newsRelevanceMemory_.has(row))newsRelevanceMemory_.set(row,Number(savedNewsLabels_(row.clasificacion).score||0));
  return newsRelevanceMemory_.get(row);
}
function packNews_(row){return [row,newsRelevanceMemory_.get(row)??0];}
function unpackNews_(record){newsRelevanceMemory_.set(record[0],record[1]);return record[0];}
function businessIndex_(){
  const config=configuration_();if(businessIndexMemory_?.config===config)return businessIndexMemory_;
  const entities=new Map(),entityTerms=new Map();for(const row of config.entities){const terms=[row.name,...row.aliases].map(searchText_);entityTerms.set(row.name,terms);for(const term of terms)entities.set(term,row);}
  const rules=rows=>rows.filter(row=>row.enabled).map(row=>{const terms=[...new Set(row.terms.map(searchText_))];return {...row,terms,pattern:phrasePattern_(terms),context:(row.context||[]).map(searchText_),contextPattern:phrasePattern_((row.context||[]).map(searchText_)),exclude:(row.exclude||[]).map(searchText_),excludePattern:phrasePattern_((row.exclude||[]).map(searchText_))};});
  const capabilities=Object.entries(config.capabilities).flatMap(([segment,rows])=>rules(rows).map(row=>({...row,segment}))),aliases=[...entities].filter(([,row])=>row.enabled).sort((a,b)=>b[0].length-a[0].length);
  const relevance=Object.fromEntries(RELEVANCE_ROLES.map(role=>[role,phrasePattern_(config.relevanceRules.filter(row=>row.enabled&&row.role===role).flatMap(row=>row.terms.map(searchText_)))]));
  const serviceNames=phrasePattern_(aliases.filter(([alias])=>alias.includes(' ')&&relevance.service.test(alias)).map(([alias])=>alias),'g');
  const catalogue=config.taxonomy.flatMap(block=>block.functions.map(row=>({name:row.id+'.'+row.name,segment:'Empresas',pattern:phrasePattern_([row.name,...row.terms].map(searchText_))})));
  const cataloguePattern=phrasePattern_(config.taxonomy.flatMap(block=>block.functions.flatMap(row=>[row.name,...row.terms])).map(searchText_));
  return businessIndexMemory_={cataloguePattern,catalogue,config,entities,entityTerms,aliases,serviceNames,relevance,capabilities,segments:rules(config.segments),signals:rules(config.signals),geographies:config.geographies.filter(row=>row.enabled).map(row=>({...row,terms:[...new Set([row.name,row.searchName,...(row.terms||[])].map(searchText_))]}))};
}
function phrasePattern_(terms,flags=''){return new RegExp('(?:^|[^a-z0-9])(?:'+(terms.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'[a-z0-9]*')).join('|')||'(?!)')+')(?![a-z0-9])',flags);}
function phrasePosition_(text,term){
  let at=-1;while((at=text.indexOf(term,at+1))>=0){if((at===0||!/[a-z0-9]/.test(text[at-1]))&&(at+term.length===text.length||!/[a-z0-9]/.test(text[at+term.length])))return at;}return -1;
}
function phraseMatch_(text,term){return phrasePosition_(text,term)>=0;}
function headlineEntity_(headline,index){
  let entity,first=Infinity;for(const [alias,row] of index.aliases){const position=phrasePosition_(headline,alias);if(position>=0&&position<first){entity=row;first=position;}}return entity;
}
function digitalAssessment_(title,text,index=businessIndex_()){
  // Entity names are not evidence of a service (for example, Mercado Pago).
  const headline=title;title=title.replace(index.serviceNames,' ');text=text.replace(index.serviceNames,' ');
  const capabilities=index.capabilities.filter(row=>row.pattern.test(text));
  const business=index.segments.some(row=>row.pattern.test(text.replace(/\bbusiness (?:days?|hours?)\b/g,' '))),channel=index.relevance.channel.test(text),shared=index.relevance.shared.test(title);
  if(!capabilities.length&&business&&channel&&index.cataloguePattern.test(text))capabilities.push(...index.catalogue.filter(row=>row.pattern.test(text)));
  const signals=index.signals.filter(row=>row.pattern.test(row.scope==='headline'?title:text)&&(!row.exclude.length||!row.excludePattern.test(title))&&(!row.context.length||row.contextPattern.test(text))),change=signals.length>0,problem=signals.some(row=>row.group==='Problema'),editorial=(index.relevance.editorial.test(title.replace(/\breport\b/g,' '))||index.relevance.editorial.test(title)&&!change),excluded=index.relevance.corporate.test(title)||index.relevance.incidental.test(title)||!business&&index.relevance.retail.test(text);
  const relevant=Boolean(capabilities.length&&!excluded&&!editorial&&(!problem||business||index.relevance.infrastructure.test(text))&&(business&&(channel||shared)&&(index.relevance.service.test(text)||headlineEntity_(headline,index))||shared&&(channel||change||index.relevance.infrastructure.test(title))));
  const score=relevant?4+Math.min(3,capabilities.length)+(business?2:0)+(change?2:0):0;
  const evidence=(pattern,value)=>pattern.exec(value)?.[0]?.trim().slice(0,120)||'';
  return {capabilities,score,channel,change,editorial,excluded,relevant,business,shared,signals:signals.map(row=>row.name),evidence:{segmento:index.segments.map(row=>evidence(row.pattern,text)).filter(Boolean).slice(0,3),canal:evidence(index.relevance.channel,text),capacidades:capabilities.slice(0,8).map(row=>({nombre:row.name,texto:evidence(row.pattern,text)})),senales:signals.map(row=>({nombre:row.name,texto:evidence(row.pattern,row.scope==='headline'?title:text)})),corporativa:evidence(index.relevance.corporate,title),retail:!business?evidence(index.relevance.retail,text):'',editorial:evidence(index.relevance.editorial,title)}};
}
function classification_(title,text,includeLabels=true){
  const index=businessIndex_(),assessment=digitalAssessment_(title,text,index);
  const signals=assessment.signals;
  const segments=assessment.relevant?[sectorNewsDefaults.segment]:index.segments.filter(row=>row.pattern.test(text)).map(row=>row.name);
  return {signals,assessment,segments,labels:includeLabels?newsLabels_(assessment):undefined};
}
let sourceGeographyMemory_;
function sourceCountry_(feed,index=businessIndex_()){
  const country=index.config.geographies.find(geo=>searchText_(geo.name)===searchText_(feed.country));
  if(country)return country.name;
  if(!domainMatches_(feed.url||'','news.google.com'))return '';
  const text=searchText_(feed.name),matches=index.geographies.filter(geo=>geo.terms.some(term=>phraseMatch_(text,term)));
  if(matches.length===1)return matches[0].name;
  const code=(String(feed.url).match(/[?&](?:gl|ceid)=([a-z]{2})(?:[&:]|%3A|$)/i)||[])[1];
  return index.config.geographies.find(geo=>geo.code===code?.toUpperCase())?.name||'';
}
function sourceGeographies_(index=businessIndex_()){
  if(sourceGeographyMemory_?.config===index.config)return sourceGeographyMemory_.values;
  const values=new Map();
  for(const feed of index.config.feeds){const country=sourceCountry_(feed,index);if(country)values.set(searchText_(feed.name),country);}
  for(const entity of index.config.entities)for(const geo of index.config.geographies){values.set(searchText_(entity.name+' · '+geo.name),geo.name);if(entity.name==='BBVA')values.set(searchText_('BBVA Empresas · '+geo.name),geo.name);}
  sourceGeographyMemory_={config:index.config,values};return values;
}
function newsCountry_(row,index=businessIndex_()){
  const source=sourceGeographies_(index).get(searchText_(row.fuente));if(source)return source;
  if(index.geographies.some(geo=>geo.name===row.pais))return row.pais;
  const title=searchText_(row.titular),matches=index.geographies.filter(geo=>geo.terms.some(term=>phraseMatch_(title,term)));
  return matches.length===1?matches[0].name:row.pais||settings_().unknownCountry;
}
function annotateNews_(rows){
  const index=businessIndex_(),taxonomy=new Map(taxonomyCatalog_().map(({id,palanca,subpalanca})=>[id,{id,palanca,subpalanca}]));
  return rows.map(row=>{
    const catalog=index.entities.get(searchText_(row.entidad)),assignment=taxonomySaved_(row.taxonomia),classification=savedNewsLabels_(row.clasificacion),labels={digital:classification.digital,capacidades:classification.capacidades,...(classification.canonicalId?{canonicalId:classification.canonicalId}:{})};
    const annotated={...row,clasificacion:JSON.stringify(labels),medio:publisherKey_(row.medio),pais:row.pais||settings_().unknownCountry,...(assignment.evidence?{functionalEvidence:assignment.evidence}:{}),taxonomia:assignment.ids.map(id=>taxonomy.get(id)).filter(Boolean),etiquetas:labels,entidad:catalog?.name||row.entidad,tipo:catalog?.type||'',segmentos:classification.segmentos||[],senales:classification.senales||[]};newsRelevanceMemory_.set(annotated,Number(classification.score||0));return annotated;
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
  const candidate={date,title,excerpt,url,labels:classification.labels,entity:entity?.name||feed.entity,country:sourceCountry_(feed,index)||settings_().unknownCountry,language:item.language||feed.language||'',publisher:publisher||'',provenance:item.excerptSource||'rss:description'};
  const reject=reason=>({inRange:true,reason,candidate});
  if(feed.entity==='Sector'&&!entity)return reject('Sin entidad de seguimiento en el titular');
  if(feed.kind==='profile'&&entity&&!index.entityTerms.get(entity.name).some(alias=>phraseMatch_(text,alias)))return reject('Sin evidencia de la entidad buscada');
  const geographyText=text;
  const countries=index.geographies.filter(geo=>geo.terms.some(term=>phraseMatch_(geographyText,term))).map(geo=>geo.name);
  if(feed.kind==='profile'&&countries.length&&!countries.includes(feed.country))return reject('Geografía distinta de la búsqueda');
  if(!classification.labels.digital||!classification.labels.capacidades.some(name=>name.startsWith('Empresas: ')))return reject('Fuera de canal digital de Empresas e instituciones');
  const country=sourceCountry_(feed,index)||(countries.length===1?countries[0]:settings_().unknownCountry);
  if(feed.capabilitySearch&&classification.assessment.excluded)return reject('Información corporativa sin novedad de canal digital');
  if(feed.capabilitySearch&&(!classification.assessment.capabilities.length||!classification.assessment.channel))return reject('Sin capacidad digital activa en contexto de canal');
  return {inRange:true,relevant:classification.labels.digital||(!classification.assessment.excluded&&classification.assessment.score>0),item:{date,title,excerpt:excerpt===title?'':excerpt,url,labels:classification.labels,entity:entity?.name||feed.entity,country,language:item.language||feed.language||'',publisher:publisher||'',provenance:item.excerptSource||'rss:description'}};
}
function safeCell_(value) {
  return typeof value==='string' && /^[=+@-]/.test(value) ? "'"+value : value;
}

function sha256_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(byte=>(byte&255).toString(16).padStart(2,'0')).join('');}
