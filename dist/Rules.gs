function publisherKey_(value){const text=String(value||'').trim();return /^bbva(?:\s*[·-]\s*empresas|\s+empresas|\s+noticias)?$/i.test(text)?'BBVA':text;}
function plainText_(value) {
  const html=String(value||'').replace(/<\s*(\/?)\s*(h)\s*([1-6])\s*>/gi,'<$1$2$3>').replace(/(^|\s)(?:le|h[1-6]|article)\s*>/gi,'$1'), parts=[];
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
  return parts.join('').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n[0].toLowerCase()==='x'?n.slice(1):n,n[0].toLowerCase()==='x'?16:10),0x10ffff))).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[m]).replace(/<\/?[a-z][^>]*(?:>|$)/gi,' ').replace(/\s+/g,' ').trim();
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
  const cataloguePattern=phrasePattern_(config.taxonomy.flatMap(block=>block.functions.flatMap(row=>[row.name,...row.terms])).map(searchText_));
  return businessIndexMemory_={publisherPatterns:new Map(),cataloguePattern,config,entities,entityTerms,aliases,serviceNames,relevance,capabilities,segments:rules(config.segments),signals:rules(config.signals),geographies:config.geographies.filter(row=>row.enabled).map(row=>({...row,terms:[...new Set([row.name,row.searchName,...(row.terms||[])].map(searchText_))]}))};
}
function phrasePattern_(terms,flags=''){return new RegExp('(?:^|[^a-z0-9])(?:'+(terms.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'[a-z0-9]*')).join('|')||'(?!)')+')(?![a-z0-9])',flags);}
function phrasePosition_(text,term){
  let at=-1;while((at=text.indexOf(term,at+1))>=0){if((at===0||!/[a-z0-9]/.test(text[at-1]))&&(at+term.length===text.length||!/[a-z0-9]/.test(text[at+term.length])))return at;}return -1;
}
function phraseMatch_(text,term){return phrasePosition_(text,term)>=0;}
function headlineEntity_(headline,index){
  let entity,first=Infinity;for(const [alias,row] of index.aliases){const position=phrasePosition_(headline,alias);if(position>=0&&position<first){entity=row;first=position;}}return entity;
}
// Exactly one business signal. Operational evidence is evaluated per clause so a
// generic prevention mention cannot mask a separately reported real outage.
function businessSignals_(title,text,index=businessIndex_()){
  const priority=['Problema','Alianza estratégica','Lanzamiento de producto','Mejora de oferta'];
  for(const kind of priority){
    const row=index.signals.find(rule=>kind==='Problema'?rule.group===kind:rule.name===kind);
    if(!row)continue;
    const scope=row.scope==='headline'?title:text;
    // A question mark is common in live-service headlines ("outage today?").
    // It is punctuation, not evidence that the outage is hypothetical.
    const clauses=kind==='Problema'?scope.split(/[.;!\n]+|\b(?:pero|however|but)\b/):[scope];
    if(clauses.some(value=>{
      const evidence=kind==='Alianza estratégica'?value.replace(/\bde acuerdo con\b/g,' '):value;
      const denied=kind==='Problema'&&/\b(?:no|nunca)\s+(?:(?:se|han?|ha)\s+)?(?:hay|hubo|existe[n]?|reporta[n]?|reportado|registra[n]?|registrado|sufre[n]?|detecta[n]?|detectado)\b.{0,50}\b(?:caida[s]?|fallo[s]?|problema[s]?|incidencia[s]?|interrupcion|outage[s]?)\b/.test(value);
      return !denied&&row.pattern.test(evidence)&&(!row.exclude.length||!row.excludePattern.test(evidence))&&(!row.context.length||row.contextPattern.test(kind==='Problema'?evidence:text));
    }))return [row];
  }
  return [];
}
function digitalAssessment_(title,text,index=businessIndex_()){
  // Entity names are not evidence of a service (for example, Mercado Pago).
  const headline=title,clean=value=>value.replace(/\b(?:business news|business standard|the business|expansion empresas|cinco dias)\b/g,' ');title=clean(title).replace(index.serviceNames,' ');text=clean(text).replace(index.serviceNames,' ');
  const capabilities=index.capabilities.filter(row=>row.pattern.test(text));
  const functional=functionalContext(text);
  let business=index.segments.some(row=>row.pattern.test(text.replace(/\bbusiness (?:days?|hours?)\b/g,' '))),channel=index.relevance.channel.test(text),shared=index.relevance.shared.test(title);
  if(functional.bankingApi)channel=true;
  if(functional.staffAgent&&headlineEntity_(headline,index)){business=true;channel=true;}
  const signals=businessSignals_(title,text,index);
  const catalogue=index.cataloguePattern.test(text)?taxonomyDecision(taxonomyText(text),taxonomyDefinitions(index.config.taxonomy),title).matches.filter(match=>match.evidence.method==='literal'&&!/\.xx Otros$/.test(match.row.subpalanca)):[];
  const operational=catalogue.length>0&&(business&&channel||catalogue.some(match=>match.evidence.terms.some(term=>/[ -]/.test(term)))&&(business||signals.length>0))&&(business||!index.relevance.retail.test(text))&&(business&&channel||Boolean(headlineEntity_(headline,index)))&&(catalogue.some(match=>match.evidence.location==='headline')||channel);
  if(operational){business=true;channel=true;for(const match of catalogue)capabilities.push({name:match.row.subpalanca,segment:'Empresas',pattern:phrasePattern_(match.evidence.terms)});}
  const change=signals.length>0,problem=signals.some(row=>row.group==='Problema'),liveReport=/\b(?:users|customers) report\b/.test(title),editorial=!liveReport&&index.relevance.editorial.test(title)&&!change,excluded=headlineEntity_(headline,index)?.name==='Santander'&&santanderExcluded_(text)||index.relevance.corporate.test(title)||index.relevance.incidental.test(title)||!problem&&!business&&index.relevance.retail.test(text);
  const incident=problem&&(channel||index.relevance.service.test(text))&&Boolean(headlineEntity_(text,index))&&!excluded&&!editorial;
  if(incident){business=true;channel=true;if(!capabilities.length)capabilities.push({segment:'Empresas',name:/\b(?:pagos|transferencias|payments|transfers)\b/.test(text)?'Pagos':/\b(?:app|movil|mobile)\b/.test(text)?'Aplicaciones móviles empresariales':'Banca electrónica corporativa',pattern:index.relevance.service});}
  const aiOnly=!functional.bankingApi&&index.relevance.channel.test(text)&&!index.relevance.channel.test(text.replace(/\b(?:ai|ia|artificial intelligence|inteligencia artificial)\b/g,' ')),workforce=/\b(?:(?:cut|slash)\b.{0,35}\bjobs|(?:recorta|reduce|elimina)\b.{0,35}\b(?:empleos|puestos|plantilla)|despidos|despide)\b/.test(title),bilateral=/\b(?:secures?\b.{0,60}\bfacility|grants?\b.{0,60}\bloan to|syndicated loan|bilateral facility|otorga prestamo a|firma prestamo con)\b/.test(text),explicitDigital=/\b(?:platform|plataforma|app|api|online|portal|digital banking|banca digital)\b/.test(text);
  const apiOnly=capabilities.length>0&&capabilities.every(row=>row.name==='API bancarias'||row.name.startsWith('17.16.'));
  const relevant=incident||Boolean(!workforce&&(!apiOnly||functional.bankingApi)&&!(aiOnly&&!functional.agentBanking&&(!/\b(?:payments?|pagos?|treasury|tesoreria|onboarding|kyb|trade finance|credit|credito|reconciliation|conciliacion|api|erp|asistentes?|assistants?)\b/.test(text)))&&!(bilateral&&!explicitDigital)&&capabilities.length&&!excluded&&!editorial&&(!problem||business||index.relevance.infrastructure.test(text))&&(business&&(channel||shared)&&(index.relevance.service.test(text)||headlineEntity_(headline,index))||shared&&(channel||change||index.relevance.infrastructure.test(title))));
  if(relevant&&!signals.length)signals.push({name:'Mejora de oferta',group:'Novedad',scope:'fullText',pattern:/(?!) /});
  const score=relevant?4+Math.min(3,capabilities.length)+(business?2:0)+(change?2:0):0;
  const evidence=(pattern,value)=>pattern.exec(value)?.[0]?.trim().slice(0,120)||'';
  return {capabilities,score,channel,change,editorial,excluded,relevant,business,shared,signals:signals.map(row=>row.name),evidence:{segmento:index.segments.map(row=>evidence(row.pattern,text)).filter(Boolean).slice(0,3),canal:evidence(index.relevance.channel,text),capacidades:capabilities.slice(0,8).map(row=>({nombre:row.name,texto:evidence(row.pattern,text)})),senales:signals.map(row=>({nombre:row.name,texto:evidence(row.pattern,row.scope==='headline'?title:text)})),corporativa:evidence(index.relevance.corporate,title),retail:!business?evidence(index.relevance.retail,text):'',editorial:evidence(index.relevance.editorial,title)}};
}
function classification_(title,text,includeLabels=true,publisher=''){
  const index=businessIndex_(),key=searchText_(publisher);if(key&&!index.publisherPatterns.has(key))index.publisherPatterns.set(key,phrasePattern_([key],'g'));
  const publisherPattern=index.entities.has(key)?null:index.publisherPatterns.get(key),assessment=digitalAssessment_(publisherPattern?title.replace(publisherPattern,' '):title,publisherPattern?text.replace(publisherPattern,' '):text,index);
  const signals=assessment.signals;
  const segments=assessment.relevant?[sectorNewsDefaults.segment]:index.segments.filter(row=>row.pattern.test(text)).map(row=>row.name);
  return {signals,assessment,segments,labels:includeLabels?newsLabels_(assessment,sha256_(JSON.stringify([title,text]))):undefined};
}
function santanderExcluded_(text){
  if(!phraseMatch_(text,'santander'))return false;
  if(phrasePattern_(['ayuntamiento de santander','alcaldia de santander','alcalde de santander','alcaldesa de santander','concejal','vecinos de santander','mercado de mexico','bahia de santander','puerto de santander','universidad de cantabria','gobierno de cantabria','diputacion','gobernador de santander','gobernacion de santander','departamento de santander','bucaramanga','barrancabermeja','policia de santander','bomberos de santander','eln','bus incinerado','extorsion','norte de santander','santander y cesar']).test(text))return true;
  if(phrasePattern_(['cucuta','floridablanca','piedecuesta','giron','socorro','san gil','malaga','curos','barbosa','veolia','aguas del','pae','renta ciudadana','soat','mineria ilegal','mineria criminal','granadas','disidencias','farc','ejercito','policia','asesinato','capturados']).test(text)&&!phrasePattern_(['banco santander','banco de santander','grupo santander','santander empresas','santander corporate','santander cib','app de santander','banca','banking','pagos digitales','transferencias']).test(text))return true;
  if(phrasePattern_(['banco santander','banco de santander','grupo santander','santander empresas','santander corporate','santander cib','santander uk','santander brasil','santander mexico','santander chile','santander argentina','santander portugal','getnet','pagonxt','ebury','cash nexus','openbank','ana botin']).test(text))return false;
  return !phrasePattern_(['banco','banca','bank','banking','entidad financiera','clientes del santander','app de santander']).test(text)||/\b(?:en|de|hacia|desde) santander\b/.test(text);
}
function annotateNews_(rows){
  const index=businessIndex_(),items=taxonomyCatalog_(),taxonomy=new Map(items.map(({id,palanca,subpalanca})=>[id,{id,palanca,subpalanca}]));
  return rows.map(row=>{
    const catalog=index.entities.get(searchText_(row.entidad)),assignment=effectiveTaxonomyAssignment_(row,items),classification=savedNewsLabels_(row.clasificacion),labels={digital:classification.digital,capacidades:classification.capacidades};
    if(assignment.editorialExcluded)return null;
    const annotated={...row,clasificacion:JSON.stringify(labels),medio:publisherKey_(row.medio),pais:row.pais||settings_().unknownCountry,...(assignment.evidence?{functionalEvidence:assignment.evidence}:{}),taxonomia:assignment.ids.map(id=>taxonomy.get(id)),etiquetas:labels,entidad:catalog?.name||row.entidad,tipo:catalog?.type||'',segmentos:classification.segmentos||[],senales:classification.senales||[]};newsRelevanceMemory_.set(annotated,Number(classification.score||0));return annotated;
  }).filter(Boolean);
}
function newsExcerpt_(item,title,publisher=''){
 const redundant=new Set([title,title+' '+publisher].map(searchText_));
 for(const [value,mechanism] of [[item.excerpt,item.excerptSource||'rss:description'],[item.rssContent,'rss:content:encoded']]){
  const text=plainText_(value).replace(/\s*(?:read more|leer m[aá]s|continue reading)[.…]*$/i,'').trim();
  if(text&&!redundant.has(searchText_(text)))return {text:text.slice(0,1500),mechanism};
 }
 return {text:'',mechanism:'rss:empty'};
}
function evaluate_(item, feed, now) {
  const publisher=plainText_(item.source),rawTitle=plainText_(item.title);
  const title=cleanNewsTitle_(rawTitle,publisher,feed.name);
  const url=canonicalUrl_(item.url),date=new Date(item.date);
  if (!title || !url || !domainMatches_(url,feed.domain) || !Number.isFinite(date.getTime())) return {reason:'Falta titular, URL del editor o fecha válida'};
  if(date>now)return {reason:'Fecha futura'};
  if(feed.range){const day=calendarDate_(date).toISOString().slice(0,10);if(day<feed.range.from||day>feed.range.to)return {reason:'Fuera del período de recuperación'};}
  else if(now-date>settings_().windowDays*86400000)return {reason:'Fuera de la ventana de '+settings_().windowDays+' días'};
  const extracted=newsExcerpt_(item,title,publisher),excerpt=extracted.text,headline=searchText_(title),text=searchText_(title+' '+excerpt),index=businessIndex_();
  const entity=feed.entity==='Sector'?headlineEntity_(headline,index):index.entities.get(searchText_(feed.entity));
  const classification=classification_(headline,text,true,publisher);
  const country=newsCountry_({titular:title,extracto:excerpt,url,sourceUrl:item.sourceUrl,medio:publisher,fuente:feed.name,rssCountry:feed.country,entidad:entity?.name||feed.entity},index);
  const candidate={date,title,excerpt,url,labels:classification.labels,entity:entity?.name||feed.entity,country,language:item.language||feed.language||'',publisher:publisher||'',sourceUrl:canonicalUrl_(item.sourceUrl),provenance:extracted.mechanism};
  const reject=reason=>({inRange:true,reason,candidate});
  if(feed.entity==='Sector'&&!entity)return reject('Sin entidad de seguimiento en el titular');
  if(feed.kind==='profile'&&entity&&!index.entityTerms.get(entity.name).some(alias=>phraseMatch_(text,alias)))return reject('Sin evidencia de la entidad buscada');
  if(entityKey_(entity?.name||feed.entity)==='Santander'&&santanderExcluded_(text))return reject('Santander geográfico o municipal');
  if(!classification.labels.digital||!classification.labels.capacidades.some(name=>name.startsWith('Empresas: ')))return reject('Fuera de canal digital de Empresas e instituciones');
  if(!country)return reject('Sin país ni sede de entidad configurada');
  if(feed.capabilitySearch&&classification.assessment.excluded)return reject('Información corporativa sin novedad de canal digital');
  if(feed.capabilitySearch&&(!classification.assessment.capabilities.length||!classification.assessment.channel))return reject('Sin capacidad digital activa en contexto de canal');
  return {inRange:true,relevant:classification.labels.digital||(!classification.assessment.excluded&&classification.assessment.score>0),item:{date,title,excerpt:excerpt===title?'':excerpt,url,labels:classification.labels,entity:entity?.name||feed.entity,country,language:item.language||feed.language||'',publisher:publisher||'',sourceUrl:canonicalUrl_(item.sourceUrl),provenance:extracted.mechanism}};
}
function safeCell_(value) {
  return typeof value==='string' && /^[=+@-]/.test(value) ? "'"+value : value;
}

function sha256_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(byte=>(byte&255).toString(16).padStart(2,'0')).join('');}
let sourceGeographyMemory_;
function sourceCountry_(feed,index=businessIndex_()){
 const country=index.config.geographies.find(row=>row.name===feed.country);if(country)return country.name;
 const text=searchText_(feed.name),named=index.geographies.find(row=>row.terms.some(term=>phraseMatch_(text,term)));
 if(named)return named.name;
 const code=(String(feed.url||'').match(/[?&](?:gl|ceid)=([a-z]{2})(?:[&:]|%3A|$)/i)||[])[1];
 return index.config.geographies.find(row=>row.code===code?.toUpperCase())?.name||'';
}
function sourceGeographies_(index=businessIndex_()){
 if(sourceGeographyMemory_?.config===index.config)return sourceGeographyMemory_.values;
 const values=new Map();
 for(const feed of index.config.feeds){const country=sourceCountry_(feed,index);if(country)values.set(searchText_(feed.name),country);}
 for(const entity of index.config.entities)for(const country of entity.countries)for(const alias of [entity.name,...entity.aliases])values.set(searchText_(alias+' · '+country),country);
 sourceGeographyMemory_={config:index.config,values};return values;
}
const domainCountryIndexes_=new WeakMap();
function domainCountry_(url,index=businessIndex_()){
 let countries=domainCountryIndexes_.get(index);
 if(!countries){countries=new Map(index.config.geographies.map(row=>[row.code.toLowerCase(),row.name]));countries.set('uk',countries.get('gb'));domainCountryIndexes_.set(index,countries);}
 const host=String(canonicalUrl_(url)||'').match(/^https:\/\/([^/:?#]+)/i)?.[1].toLowerCase();
 return host&&host!=='t.co'&&!domainMatches_(url,'news.google.com')?countries.get(host.split('.').at(-1))||'':'';
}
function newsCountryDecision_(row,index=businessIndex_()){
 const title=searchText_(row.titular).replace(/[\u2010-\u2015]/g,'-');
 let country='',position=Infinity,evidence='';
 for(const geo of index.geographies)for(const term of [geo.name,geo.searchName]){const normalized=searchText_(term),at=phrasePosition_(title,normalized);if(at>=0&&at<position){country=geo.name;position=at;evidence=term;}}
 if(country)return {country,reason:'headline',evidence};
 const provenance=savedNewsLabels_(row.clasificacion).procedencia||{};
 const publisherUrl=/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}$/i.test(row.medio||'')?'https://'+row.medio:'';
 for(const url of [row.sourceUrl||provenance.medioUrl,row.url,publisherUrl]){const country=domainCountry_(url,index);if(country)return {country,reason:'domain',evidence:canonicalUrl_(url)};}
 const rssCountry=index.config.geographies.find(geo=>geo.name===(row.rssCountry||provenance.paisRSS))?.name||sourceGeographies_(index).get(searchText_(row.fuente));
 if(rssCountry)return {country:rssCountry,reason:'rss',evidence:row.fuente||rssCountry};
 const entity=index.entities.get(searchText_(row.entidad))||headlineEntity_(title,index);
 return {country:entity?.headquartersCountry||'',reason:'headquarters',evidence:entity?.name||''};
}
function newsCountry_(row,index=businessIndex_()){return newsCountryDecision_(row,index).country;}
function getGeographyUpgrade(){
 authorize_(true);
 const checkpoint=JSON.parse(properties_().getProperty('GEOGRAPHY_UPGRADE')||'null'),job=classificationJob_();
 return {...checkpoint,classification:job?{state:job.state,processed:Math.min(job.total,job.next-2),total:job.total,error:job.error||''}:null};
}
function reportGeographyUpgrade(){const status=getGeographyUpgrade();console.log(JSON.stringify(status));return status;}
function applyGeographyUpgrade(){
 authorize_(true);
 return withForegroundWrite_(()=>{
  const sheet=book_().getSheetByName('Configuracion'),rows=sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues(),index=rows.findIndex(([key])=>key==='entities');
  if(index<0)throw Error('No se encuentra el catálogo de entidades.');
  const entities=JSON.parse(rows[index][1]),seeds=new Map(CONFIGURATION_DEFAULTS.entities.map(row=>[row.name,row.headquartersCountry]));
  if(entities.some(row=>!row.headquartersCountry&&!seeds.has(row.name)))throw Error('Hay entidades sin país de sede configurado.');
  const updated=entities.map(row=>({...row,headquartersCountry:row.headquartersCountry||seeds.get(row.name)}));
  const previous=JSON.parse(properties_().getProperty('GEOGRAPHY_UPGRADE')||'null');if(previous?.version===RADAR.version&&updated.every((row,i)=>row.headquartersCountry===entities[i].headquartersCountry))return getGeographyUpgrade();
  const source=book_(),backup=source.copy('News Radar · Geografías '+RADAR.version+' · '+new Date().toISOString()),original=rows[index][1];
  fileInFolder_(backup.getId(),archiveFolder_(JSON.parse(rows.find(([key])=>key==='storage')[1]).primaryFolderId));
  for(const name of ['Configuracion',newsStorageKey_()]){
   const active=source.getSheetByName(name),copy=backup.getSheetByName(name),height=active.getLastRow(),width=active.getLastColumn();
   if(!copy||copy.getLastRow()!==height||copy.getLastColumn()!==width||sha256_(JSON.stringify(active.getRange(1,1,height,width).getDisplayValues()))!==sha256_(JSON.stringify(copy.getRange(1,1,height,width).getDisplayValues())))throw Error('Backup no verificado: '+name);
  }
  try{
   sheet.getRange(index+2,2,1,1).setValues([[JSON.stringify(updated)]]);SpreadsheetApp.flush();invalidateConfiguration_();
   if(configuration_().entities.some(row=>!row.headquartersCountry))throw Error('Sedes no verificadas.');
   requestNewsClassification_(true);
   properties_().setProperty('GEOGRAPHY_UPGRADE',JSON.stringify({version:RADAR.version,backupId:backup.getId(),backupUrl:backup.getUrl(),updatedAt:new Date().toISOString(),entities:updated.length}));
   return getGeographyUpgrade();
  }catch(error){sheet.getRange(index+2,2,1,1).setValues([[original]]);invalidateConfiguration_();throw error;}
 });
}
