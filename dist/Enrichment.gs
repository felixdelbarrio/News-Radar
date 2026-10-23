// Independent proposals only. No consumer of Noticias, taxonomy or LLM reads this table.
const ENRICHMENT=Object.freeze({version:'1.2',rows:100,articles:2,maxText:24000,maxBytes:1000000,retries:3,retryMs:900000,dailyRequests:300});
function enrichmentSheet_(){return generationSheet_('Enriquecimiento',RADAR.sheets.Enriquecimiento);}
function enrichmentInput_(row,model=taxonomyModelRevision_(taxonomyCatalog_())){return sha256_(JSON.stringify([ENRICHMENT.version,row.id,row.titular,row.extracto,row.url,row.entidad,row.pais,row.clasificacion,row.taxonomia,model]));}
function enrichmentRss_(id,item){
  if(properties_().getProperty('ENRICHMENT_ENABLED')!=='true')return;
  cacheJson_('enrichment-rss:'+id,{feed:enrichmentUrl_(item.feedUrl||'')},21600);
}
function requestEnrichment_(){if(properties_().getProperty('ENRICHMENT_ENABLED')==='true'){properties_().setProperty('ENRICHMENT_REQUEST','true');ensureBackgroundWorker_();}}
function enrichmentJob_(){return JSON.parse(properties_().getProperty('ENRICHMENT_JOB')||'null');}
function enrichmentQuotaAt_(){const usage=JSON.parse(properties_().getProperty('ENRICHMENT_HTTP_USAGE')||'{}');return usage.day===recordDay(new Date(),settings_().timezone)&&usage.calls>=ENRICHMENT.dailyRequests?nextDailyReset(Date.now(),settings_().timezone):0;}
function enrichmentReadyAt_(){const p=properties_(),job=enrichmentJob_();return p.getProperty('ENRICHMENT_ENABLED')==='true'&&(p.getProperty('ENRICHMENT_REQUEST')||job&&(job.state!=='Completada'||job.version!==ENRICHMENT.version))?Math.max(Date.now(),Number(job?.pausedUntil||0),Number(p.getProperty('FETCH_PAUSED_UNTIL')||0),enrichmentQuotaAt_()):Infinity;}
function enrichmentUrl_(value,base=''){
  const raw=String(value||'').trim(),origin=base.match(/^https:\/\/[^/]+/)?.[0]||'';
  const url=canonicalUrl_(raw.startsWith('//')?'https:'+raw:raw.startsWith('/')?origin+raw:raw.startsWith('https://')?raw:'');
  const host=url.match(/^https:\/\/([^/:]+)(?::\d+)?(?:\/|$)/)?.[1]?.toLowerCase()||'';
  return host&&host.includes('.')&&!/^(?:localhost|.*\.(?:local|internal|localhost|nip\.io|sslip\.io)|[0-9.]+|0x[0-9a-f]+)$/.test(host)&&!/[\[\]@]/.test(url)?url:'';
}
function enrichmentHeader_(headers,name){return String(Object.entries(headers).find(([key])=>key.toLowerCase()===name.toLowerCase())?.[1]||'');}
function enrichmentFetch_(url,metrics){
  if(metrics.deadline&&Date.now()>=metrics.deadline){const error=Error('Lote interrumpido por presupuesto de tiempo');error.interrupted=true;error.retryAt=Date.now()+60000;throw error;}
  const p=properties_(),today=recordDay(new Date(),settings_().timezone),usage=JSON.parse(p.getProperty('ENRICHMENT_HTTP_USAGE')||'{}');
  if(usage.day!==today){usage.day=today;usage.calls=0;}
  if(usage.calls>=ENRICHMENT.dailyRequests){const error=Error('Cuota diaria de enriquecimiento');error.quota=true;error.retryAt=nextDailyReset(Date.now(),settings_().timezone);throw error;}
  usage.calls++;p.setProperty('ENRICHMENT_HTTP_USAGE',JSON.stringify(usage));metrics.http++;
  const start=Date.now();try{
    const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:false,headers:{'User-Agent':'NewsRadar/1.0','Accept':'text/html, application/rss+xml, application/xml'}});
    const code=response.getResponseCode(),headers=response.getAllHeaders();
    if(code===429||code>=500){const error=Error('HTTP '+code);error.retryAt=Date.now()+ENRICHMENT.retryMs;throw error;}
    if(code>=400){const error=Error('HTTP '+code);error.restricted=[401,403,451].includes(code);error.terminal=true;throw error;}
    const text=response.getContentText();if(text.length>ENRICHMENT.maxBytes){const error=Error('Contenido demasiado grande');error.terminal=true;throw error;}
    return {code,headers,text};
  }finally{metrics.fetchMs+=Date.now()-start;}
}
function enrichmentRobots_(url,metrics){
  const origin=url.match(/^https:\/\/[^/]+/)[0],cache=CacheService.getScriptCache(),key='enrichment-robots:'+sha256_(origin),stored=cache.get(key);let rules;
  if(stored)rules=JSON.parse(stored);else{
    try{const response=enrichmentFetch_(origin+'/robots.txt',metrics);if(response.code!==200||enrichmentHeader_(response.headers,'tdm-reservation')==='1')return false;rules=response.text.slice(0,64000);cacheJson_(key,rules,3600);}catch(error){if(error.retryAt||serviceQuotaPause_(error))throw error;return false;}
  }
  if(/^\s*tdm-reservation\s*:\s*1/im.test(rules))return false;
  let agents=[],entries=[],group=[],seenRule=false;
  for(const line of rules.split(/\r?\n/)){const match=line.replace(/#.*/,'').match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/);if(!match)continue;const key=match[1].toLowerCase(),value=match[2];
    if(key==='user-agent'){if(seenRule){entries.push({agents,rules:group});agents=[];group=[];seenRule=false;}agents.push(value.toLowerCase());}
    else if(['allow','disallow'].includes(key)){seenRule=true;group.push({allow:key==='allow',path:value});}
  }entries.push({agents,rules:group});
  const specific=entries.filter(entry=>entry.agents.some(agent=>agent!=='*'&&'newsradar'.includes(agent))),selected=specific.length?specific:entries.filter(entry=>entry.agents.includes('*'));
  const path=url.slice(origin.length),matches=selected.flatMap(entry=>entry.rules).filter(rule=>rule.path&&new RegExp('^'+rule.path.replace(/[.+?^{}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')).test(path)).sort((a,b)=>b.path.length-a.path.length||Number(b.allow)-Number(a.allow));
  return !matches.length||matches[0].allow;
}
function enrichmentExtract_(html){
  for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(match=>[match[1].toLowerCase(),String(match[2]??match[3]??match[4]).toLowerCase().trim()]));if(attrs.name==='tdm-reservation'&&attrs.content==='1'||['robots','googlebot'].includes(attrs.name)&&/(?:noai|noimageai|nosnippet|noarchive)/.test(attrs.content||''))return {restricted:true,text:''};}
  if(/"isAccessibleForFree"\s*:\s*(?:false|"false")|(?:class|id)=["'][^"']*(?:paywall|subscription-wall)/i.test(html))return {restricted:true,text:''};
  const main=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if(!main)return {text:'',reason:'sin-contenido-principal'};
  const text=plainText_(main.replace(/<(nav|footer|header|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')).replace(/\s+/g,' ').trim().slice(0,ENRICHMENT.maxText);
  return {text};
}
function enrichmentContent_(row,metrics){
  const cached=CacheService.getScriptCache().get('enrichment-rss:'+row.id),metadata=cached?JSON.parse(cached):null;
  let text=plainText_(row.extracto||'').replace(/\s+/g,' ').trim().slice(0,ENRICHMENT.maxText),source='rss:stored-excerpt',url=enrichmentUrl_(row.url);
  const feed=enrichmentUrl_(metadata?.feed||configuration_().feeds.find(feed=>feed.name===row.fuente&&feed.enabled)?.url||'');
  if(feed&&text.length<500){
    try{const response=enrichmentFetch_(feed,metrics);if(response.code===200){const item=parseFeed_(response.text).find(item=>newsUrlIdentity_(item.url)===newsUrlIdentity_(row.url)||searchText_(item.title)===searchText_(row.titular));if(item){const content=[item.excerpt,item.rssContent].filter(Boolean).map(plainText_).sort((a,b)=>b.length-a.length)[0]||'';if(content.length>text.length){text=content.slice(0,ENRICHMENT.maxText);source=item.rssContent?'rss:content:encoded':item.excerptSource;}}}}
    catch(error){if(error.retryAt||serviceQuotaPause_(error))throw error;}
  }
  if(text.length>=500)return {text,source,url};
  if(!url)return {text,source,url:'',reason:'url-no-permitida'};
  const resolveStart=Date.now();
  for(let hop=0;hop<4;hop++){
    if(!enrichmentRobots_(url,metrics))return {text,source,url,restricted:true,reason:'robots-no-permite-o-no-verificable'};
    const response=enrichmentFetch_(url,metrics);
    if([301,302,303,307,308].includes(response.code)){const next=enrichmentUrl_(enrichmentHeader_(response.headers,'location'),url);if(!next||hop===3)return {text,source,url,reason:'redireccion-no-permitida'};url=next;continue;}
    if(response.code!==200)return {text,source,url,reason:'HTTP '+response.code};
    if(/(?:noai|nosnippet|noarchive)/i.test(enrichmentHeader_(response.headers,'x-robots-tag'))||enrichmentHeader_(response.headers,'tdm-reservation')==='1')return {text,source,url,restricted:true,reason:'reserva-editorial'};
    if(!/text\/html/i.test(enrichmentHeader_(response.headers,'content-type')))return {text,source,url,reason:'formato-no-html'};
    const extract=enrichmentExtract_(response.text);if(extract.restricted)return {text,source,url,restricted:true,reason:'contenido-restringido'};
    if(extract.text.length>text.length){text=extract.text;source='editorial:article/main';}
    metrics.resolveMs+=Date.now()-resolveStart;return {text,source,url,reason:extract.reason};
  }return {text,source,url,reason:'limite-redirecciones'};
}
const enrichmentDefinitions_=new WeakMap();
function enrichmentSignals_(row,text){
  const catalog=taxonomyCatalog_();if(!enrichmentDefinitions_.has(catalog))enrichmentDefinitions_.set(catalog,catalog.map(item=>({...item,terms:item.terminos||[],context:item.context||[],exclude:item.exclude||[]})));
  const normalized=taxonomyText(row.titular+'. '+text),sentences=normalized.split(/(?<=[.!?;])\s+/).filter(sentence=>!/(?:\b(?:no|not|never|cannot|doesn.t|didn.t|won.t)\b.{0,40}\b(?:ofrec|permit|lanz|dispon|habilit|incorpor|admit|implement|soport|offer|allow|launch|enable|support|provide|introduc)|\b(?:podria|podrian|preve|planea|estudia|evalua|habilitara|incorporara|lanzara|permitira|ofrecera|implementara|could|would|might|plans|rumor|hace \d+ anos|en 20(?:0\d|1\d))\b)/.test(sentence)),context=sentences.filter(sentence=>{const subject=headlineEntity_(sentence,businessIndex_())?.name;return !subject||subject===row.entidad;}).join(' '),definitions=enrichmentDefinitions_.get(catalog),decision=taxonomyDecision(context,definitions,taxonomyText(row.titular));
  const entity=headlineEntity_(taxonomyText(row.titular),businessIndex_())?.name||'',attributed=entity===row.entidad;
  const functions=attributed?decision.matches.filter(match=>match.evidence.method==='literal').map(match=>({id:match.row.id,terms:match.evidence.terms,method:'tf-idf/ngram+context',ranking:Math.round(match.score*100)/100})):[];
  const movements=attributed?businessSignals_(searchText_(row.titular),searchText_(context)).map(row=>row.name):[];
  const countries=businessIndex_().geographies.filter(country=>country.terms.some(term=>phraseMatch_(context,term))).map(country=>country.name);
  return {functions,channels:[...new Set((context.match(/\b(?:app|web|api|movil|online|banca digital)\b/g)||[]))],entities:entity?[entity]:[],countries,movements,attribution:attributed?'headline-entity':'unverified',requiresApproval:true};
}
function enrichmentBatch_(maxMs=BACKGROUND_WORK.sliceMs,selectedIds=null){
  const started=Date.now(),p=properties_(),sheet=enrichmentSheet_(),keys=RADAR.sheets.Enriquecimiento,metrics={deadline:started+maxMs,http:0,fetchMs:0,resolveMs:0,reads:2,writes:0,processed:0,retried:0,success:0,changes:0,reasons:{}};
  const count=Math.max(0,sheet.getLastRow()-1),records=count?sheet.getRange(2,1,count,6).getDisplayValues().map(values=>Object.fromEntries(keys.slice(0,6).map((key,i)=>[key,values[i]]))):[],index=new Map(records.map((row,i)=>[row.newsId,{...row,row:i+2}])),job=enrichmentJob_()||{version:ENRICHMENT.version,next:2,newNext:2,state:'Pendiente'},last=newsSheet_().getLastRow();
  if(enrichmentQuotaAt_()>started){job.state='En pausa';job.pausedUntil=enrichmentQuotaAt_();p.setProperty('ENRICHMENT_JOB',JSON.stringify(job));return {job,metrics};}
  const model=taxonomyModelRevision_(taxonomyCatalog_()),source=newsStorageKey_();if(job.version!==ENRICHMENT.version||job.model&&job.model!==model||job.source&&job.source!==source||job.lastRow&&last<job.lastRow){job.next=2;job.newNext=2;}job.version=ENRICHMENT.version;job.model=model;job.source=source;job.lastRow=last;
  // New arrivals take precedence; the stable historical cursor advances in bounded windows.
  const ranges=[];if(job.newNext<=last)ranges.push([Math.max(2,job.newNext),Math.min(last,job.newNext+ENRICHMENT.rows-1),'newNext']);if(job.next<=last)ranges.push([job.next,Math.min(last,job.next+ENRICHMENT.rows-1),'next']);
  if(last>Number(job.newNext||2)+ENRICHMENT.rows-1)ranges.push([Math.max(2,last-ENRICHMENT.rows+1),last,'']);
  if(selectedIds)ranges.length=0;
  const retry=records.filter(row=>row.state==='Reintento'&&Number(row.nextAt)<=started).slice(0,ENRICHMENT.rows);const news=new Map();
  for(const [first,end,cursor]of ranges){for(const row of newsSheet_().getRange(first,1,end-first+1,RADAR.sheets.Noticias.length).getDisplayValues()){const item=Object.fromEntries(RADAR.sheets.Noticias.map((key,i)=>[key,row[i]]));news.set(item.id,item);}metrics.reads++;if(cursor)job[cursor]=end+1;}
  if(selectedIds){for(const row of rowsById_('Noticias',new Set(selectedIds)))news.set(row.id,row);metrics.reads++;}
  if(!selectedIds&&retry.length){for(const row of rowsById_('Noticias',new Set(retry.map(row=>row.newsId))))news.set(row.id,row);metrics.reads++;}
  const candidates=[...news.values()].sort((a,b)=>b.capturada.localeCompare(a.capturada));let interrupted=false,quotaUntil=0;
  for(const row of candidates){
    if(Date.now()-started>=maxMs||metrics.processed>=ENRICHMENT.articles||!selectedIds&&backgroundPaused_()){interrupted=true;break;}
    const input=enrichmentInput_(row,model),old=index.get(row.id);if(old?.inputHash===input&&(old.state!=='Reintento'||Number(old.nextAt)>Date.now()))continue;
    const record={newsId:row.id,inputHash:input,version:ENRICHMENT.version,state:'Completada',attempts:old?.inputHash===input?Number(old.attempts)+1:1,nextAt:'',url:row.url,source:'',contentHash:'',signals:'{}',comparison:'{}',error:'',updated:new Date().toISOString()};const articleStart=Date.now();
    try{const content=enrichmentContent_(row,metrics),signals=enrichmentSignals_(row,content.text),current=taxonomySaved_(row.taxonomia).ids||[],proposed=signals.functions.map(item=>item.id);record.source=content.source;record.url=content.url;record.contentHash=sha256_(content.text);record.signals=JSON.stringify(signals);record.comparison=JSON.stringify({current,proposed,added:proposed.filter(id=>!current.includes(id)),removed:current.filter(id=>!proposed.includes(id)),classificationHash:sha256_(row.clasificacion),taxonomyHash:sha256_(row.taxonomia),applied:false});record.state=content.restricted?'Restringida':content.text?'Completada':'Sin contenido';record.error=content.reason||'';if(content.text&&content.source!=='rss:stored-excerpt'&&!content.restricted)metrics.success++;if(proposed.some(id=>!current.includes(id)))metrics.changes++;}
    catch(error){if(error.interrupted||error.quota||serviceQuotaPause_(error))record.attempts--;if(error.quota||serviceQuotaPause_(error))quotaUntil=Number(error.retryAt)||Date.now()+86400000;record.error=String(error.message||error).slice(0,180);record.state=error.restricted?'Restringida':!error.terminal&&record.attempts<ENRICHMENT.retries?'Reintento':'Error';record.nextAt=record.state==='Reintento'?String(error.retryAt||Date.now()+ENRICHMENT.retryMs*2**(record.attempts-1)):'';if(serviceQuotaPause_(error)){record.nextAt=String(Date.now()+86400000);p.setProperty('FETCH_PAUSED_UNTIL',record.nextAt);}if(record.state==='Reintento')metrics.retried++;}
    record.durationMs=Date.now()-articleStart;const position=old?.row||sheet.getLastRow()+1;if(position>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),100);sheet.getRange(position,1,1,keys.length).setNumberFormat('@').setValues([keys.map(key=>safeCell_(record[key]??''))]);index.set(row.id,{...record,row:position});metrics.writes++;metrics.processed++;metrics.reasons[record.error||record.state]=(metrics.reasons[record.error||record.state]||0)+1;if(quotaUntil){interrupted=true;break;}
  }
  delete metrics.deadline;
  if(selectedIds){telemetry_('enrichment-sample',Date.now()-started,'OK',JSON.stringify(metrics));return {metrics,records:selectedIds.map(id=>index.get(id)).filter(Boolean)};}
  if(interrupted){for(const [first,,cursor]of ranges)if(cursor)job[cursor]=first;}
  const scanning=job.next<=last||job.newNext<=last,active=scanning?null:new Set(last>1?newsSheet_().getRange(2,1,last-1,1).getDisplayValues().flat():[]);if(active)metrics.reads++;
  for(const record of index.values())if(record.state==='Reintento'&&active&&!active.has(record.newsId)){sheet.getRange(record.row,4,1,3).setValues([['Retirada',record.attempts,'']]);record.state='Retirada';metrics.writes++;}
  const retries=[...index.values()].filter(row=>row.state==='Reintento');job.processed=[...index.values()].filter(row=>!['Reintento','Retirada'].includes(row.state)&&(!active||active.has(row.newsId))).length;job.total=last-1;job.pending=Math.max(0,job.total-job.processed);job.state=quotaUntil?'En pausa':scanning||retries.length?'Pendiente':'Completada';job.pausedUntil=quotaUntil||(scanning?0:retries.length?Math.min(...retries.map(row=>Number(row.nextAt))):0);job.updated=new Date().toISOString();p.setProperty('ENRICHMENT_JOB',JSON.stringify(job));p.deleteProperty('ENRICHMENT_REQUEST');
  telemetry_('enrichment',Date.now()-started,'OK',JSON.stringify(metrics));return {job,metrics};
}
function startNewsEnrichment(){authorize_(true);return withForegroundWrite_(()=>{const p=properties_();enrichmentSheet_();if(!enrichmentJob_()||enrichmentJob_().state==='Completada')p.setProperty('ENRICHMENT_JOB',JSON.stringify({version:ENRICHMENT.version,next:2,newNext:Math.max(2,newsSheet_().getLastRow()-ENRICHMENT.rows+1),state:'Pendiente'}));p.setProperty('ENRICHMENT_ENABLED','true');requestEnrichment_();return enrichmentJob_();});}
function getNewsEnrichmentStatus(){authorize_(true);return {job:enrichmentJob_(),enabled:properties_().getProperty('ENRICHMENT_ENABLED')==='true'};}

function enrichNewsSample(ids){authorize_(true);if(!Array.isArray(ids)||ids.length<1||ids.length>ENRICHMENT.articles||ids.some(id=>typeof id!=='string'))throw Error('Selecciona una o dos noticias persistidas.');return withForegroundWrite_(()=>enrichmentBatch_(BACKGROUND_WORK.sliceMs,ids));}
