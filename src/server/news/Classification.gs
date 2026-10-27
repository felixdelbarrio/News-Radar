function businessNews_(row){
  const labels=row.etiquetas||savedNewsLabels_(row.clasificacion);
  return labels.digital&&labels.capacidades.some(name=>name.startsWith('Empresas: '));
}
function newsLabels_(assessment,hash){
  const state=assessment.relevant?'relevante':assessment.excluded||assessment.editorial?'no relevante':'indeterminado';
  return {contentHash:hash,digital:assessment.relevant,capacidades:[...new Set(assessment.capabilities.map(row=>row.segment+': '+row.name))],schema:1,version:CLASSIFICATION_WORK.rulesVersion,revision:newsClassificationRevision_(),estado:state,segmento:assessment.business?sectorNewsDefaults.segment:'indeterminado',segmentos:assessment.relevant||assessment.business?[sectorNewsDefaults.segment]:[],canal:assessment.channel?'digital':'indeterminado',evento:assessment.signals.includes(INCIDENT_SIGNAL)?INCIDENT_SIGNAL:assessment.signals[0]||'indeterminado',senales:assessment.excluded?[]:assessment.signals,score:assessment.score,evidencia:assessment.evidence};
}
function savedNewsLabels_(value){
  if(!value)return {digital:false,capacidades:[]};
  try{const labels=JSON.parse(value);return {...labels,digital:labels.digital===true,capacidades:Array.isArray(labels.capacidades)?labels.capacidades:[]};}
  catch(_){return {digital:false,capacidades:[]};}
}
let classificationRevisionMemory_;
function newsClassificationRevision_(){const config=configuration_();if(classificationRevisionMemory_?.config===config)return classificationRevisionMemory_.revision;const revision=classificationRulesRevision_(config);classificationRevisionMemory_={config,revision};return revision;}
function classificationRulesRevision_(config=configuration_()){return sha256_(JSON.stringify([CLASSIFICATION_WORK.rulesVersion,config.capabilities,config.taxonomy.flatMap(block=>block.functions),config.relevanceRules,config.signals,config.entities,config.segments,config.geographies,config.feeds.map(({name,country,url})=>({name,country,url}))]));}
function classificationJob_(){const raw=properties_().getProperty('CLASSIFICATION_JOB');return raw?JSON.parse(raw):null;}
function classificationPending_(){const job=classificationJob_();return Boolean(job&&job.state!=='Completada');}
function classificationReadyAt_(){const job=classificationJob_();return job&&!['Completada','Publicando'].includes(job.state)?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeClassificationJob_(job){progressContextMemory_=undefined;properties_().setProperty('CLASSIFICATION_JOB',JSON.stringify(snapshotJob_('CLASSIFICATION_JOB',job)));}
function requestNewsClassification_(force=false){
  const job=classificationJob_(),revision=newsClassificationRevision_(),source=newsStorageKey_(),total=Math.max(0,newsSheet_().getLastRow()-1),recordsRevision=properties_().getProperty('NEWS_RECORDS_REVISION')||'0';
  if(!force&&job&&job.revision===revision&&(job.state!=='Completada'||job.source===source&&job.total===total&&job.recordsRevision===recordsRevision))return;
  const now=new Date();
  writeClassificationJob_({source,recordsRevision,next:2,total,revision,version:CLASSIFICATION_WORK.rulesVersion,force,state:total?'Pendiente':'Completada',started:now.toISOString(),updated:now.toISOString(),day:recordDay(now,settings_().timezone),classified:0,digital:0});
  if(total)ensureBackgroundWorker_();
}
function drainClassificationRequest_(){
  const p=properties_();if(!p.getProperty('CLASSIFICATION_REQUEST')||classificationPending_())return;
  requestNewsClassification_();p.deleteProperty('CLASSIFICATION_REQUEST');
}
function getClassificationStatus(){
  authorize_(true);const job=classificationJob_(),queued=Boolean(properties_().getProperty('CLASSIFICATION_REQUEST'));
  return {newsRevision:publishedNewsRevision_(),queued,scheduled:dailyScheduleStatus_(),timezone:settings_().timezone,job:withJobProgress_('classification',job?{...job,processed:Math.min(job.total,job.next-2)}:null,queued)};
}
function startClassification(){
  authorize_(true);return withForegroundWrite_(()=>{
    if(!classificationPending_())requestNewsClassification_(true);
    else{const job=classificationJob_();if(job.state==='En pausa'){job.state='Pendiente';job.pausedUntil=0;writeClassificationJob_(job);}ensureBackgroundWorker_();}
    return getClassificationStatus();
  });
}
function newsClassificationBatch_(maxMs=CLASSIFICATION_WORK.maxMs){
 const job=classificationJob_();if(!job||['Completada','Publicando'].includes(job.state))return;
 const started=Date.now();let read=0,classified=0,digital=0;
 try{
  const revision=newsClassificationRevision_();if(job.revision!==revision){requestNewsClassification_(true);return;}
  const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,total=Math.max(0,sheet.getLastRow()-1),size=Math.min(CLASSIFICATION_WORK.batchRows,total-job.next+2),updates=[],items=taxonomyCatalog_();
  const rows=size>0?sheet.getRange(job.next,1,size,keys.length).getDisplayValues():[];
  for(const values of rows){
   if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
   const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),position=job.next+read,cleanTitle=plainText_(row.titular),cleanExcerpt=plainText_(row.extracto),title=searchText_(cleanTitle),text=searchText_(cleanTitle+' '+cleanExcerpt),hash=sha256_(JSON.stringify([title,text])),saved=savedNewsLabels_(row.clasificacion),taxonomy=taxonomySaved_(row.taxonomia);
   read++;
   let taxonomyValid=true;try{validateTaxonomyAssignment_(taxonomy,items,row.id,true,row);}catch(_){taxonomyValid=false;}
   const current=saved.schema===1&&saved.version===CLASSIFICATION_WORK.rulesVersion&&saved.revision===revision&&saved.contentHash===hash;
   const provenance=saved.procedencia||{},feedUrl=provenance.feedUrl||configuration_().feeds.find(feed=>feed.name===row.fuente)?.url||'',geography=newsCountryDecision_({...row,titular:cleanTitle,extracto:cleanExcerpt,sourceUrl:provenance.medioUrl,feedUrl,language:row.idioma}),nextCountry=geography.country,nextEntity=entityKey_(row.entidad);
   if(!job.force&&current&&taxonomyValid&&nextEntity===row.entidad&&nextCountry===row.pais&&provenance.versionReglas===RADAR.version&&cleanTitle===row.titular&&cleanExcerpt===row.extracto)continue;
   const labels=current&&!job.force?saved:classification_(title,text,true,row.medio).labels;
   const prior={...provenance};delete prior.locale;delete prior.origenLocale;
   labels.procedencia={...prior,geografias:geography.geographies,scope:geography.scope,paisMetodo:geography.reason,paisConfianza:geography.confidence,paisEvidencias:geography.countryEvidence,tipoGeografia:geography.type,...(geography.locale?{locale:geography.locale,origenLocale:geography.localeOrigin}:{}),versionReglas:RADAR.version};
   const changed={titular:cleanTitle,extracto:cleanExcerpt,clasificacion:JSON.stringify(labels),pais:nextCountry,entidad:nextEntity,taxonomia:JSON.stringify(necessaryTaxonomyRecord_({...row,titular:cleanTitle,extracto:cleanExcerpt,clasificacion:JSON.stringify(labels)},items))};
   for(const [key,value] of Object.entries(changed))if(value!==row[key])updates.push({row:position,column:keys.indexOf(key)+1,value});
   if(changed.clasificacion!==row.clasificacion)classified++;if(labels.digital)digital++;
  }
  writeNewsCells_(updates);if(updates.length)invalidateNews_(false);
  job.total=total;job.next+=read;Object.assign(job,{state:job.next>total+1?'Completada':'En curso',updated:new Date().toISOString(),classified:job.classified+classified,digital:job.digital+digital,error:'',pausedUntil:0});if(job.state==='Completada')job.recordsRevision=properties_().getProperty('NEWS_RECORDS_REVISION')||'0';writeClassificationJob_(job);if(job.state==='Completada')requestDashboardSnapshots_(true);
  telemetry_('clasificacion',Date.now()-started,'OK',read+' leídas; '+classified+' clasificadas; '+updates.length+' celdas modificadas');
 }catch(error){Object.assign(job,{state:'En pausa',error:String(error.message).slice(0,180),pausedUntil:Date.now()+(serviceQuotaPause_(error)||settings_().retryMinutes*60000)});writeClassificationJob_(job);telemetry_('clasificacion',Date.now()-started,'Error',job.error);}
}

function necessaryTaxonomyRecord_(row,items=taxonomyCatalog_()){
 const saved=taxonomySaved_(row.taxonomia);
 try{validateTaxonomyAssignment_(saved,items,row.id,true,row);return JSON.parse(row.taxonomia);}catch(_){return taxonomyRecord_(row.titular,row.extracto,items,savedNewsLabels_(row.clasificacion));}
}
