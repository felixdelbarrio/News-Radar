let taxonomyTranslationMemory_;
function taxonomyTranslationJob_(){const value=properties_().getProperty('TAXONOMY_TRANSLATION_JOB');return value?JSON.parse(value):null;}
function writeTaxonomyTranslationJob_(job){progressContextMemory_=undefined;properties_().setProperty('TAXONOMY_TRANSLATION_JOB',JSON.stringify(snapshotJob_('TAXONOMY_TRANSLATION_JOB',job)));}
function taxonomyTranslationNames_(){return [...new Set(taxonomyCatalog_().flatMap(row=>[row.palanca,row.subpalanca]).filter(Boolean))].sort();}
function taxonomyTranslationKey_(name,language){return language+':'+sha256_(name);}
function taxonomyTranslationIndex_(){
  if(taxonomyTranslationMemory_)return taxonomyTranslationMemory_;
  const key='taxonomy-texts:'+(properties_().getProperty('TAXONOMY_TRANSLATIONS_REVISION')||'0'),cached=CacheService.getScriptCache().get(key),entries=cached?JSON.parse(cached):rows_('TaxonomiaTraducciones').map(row=>[row.clave,row.texto]);
  if(!cached)cacheJson_(key,entries,21600);return taxonomyTranslationMemory_=new Map(entries);
}
function taxonomyTranslations_(){
  const items=taxonomyCatalog_();if(!items.length)return {};
  const key='taxonomy-names:'+taxonomyStorageKey_()+':'+RADAR.version+':'+(properties_().getProperty('TAXONOMY_REVISION')||'0')+':'+(properties_().getProperty('TAXONOMY_TRANSLATIONS_REVISION')||'0'),cached=CacheService.getScriptCache().get(key);if(cached)return JSON.parse(cached);
  const values=taxonomyTranslationIndex_(),unique=new Set(items.flatMap(row=>[row.palanca,row.subpalanca]).filter(Boolean)),result={};
  for(const language of Object.keys(languageNames).filter(language=>language!=='es')){
    const names=Object.create(null);for(const name of unique)names[name]=values.get(taxonomyTranslationKey_(name,language))||translateText(name,language);
    for(const row of items)if(row.subpalanca)names[taxonomyPath(row)]=names[row.palanca]+' › '+names[row.subpalanca];
    result[language]=names;
  }const originals=Object.fromEntries([...unique].map(name=>[name,name]));for(const row of items)if(row.subpalanca)originals[taxonomyPath(row)]=taxonomyPath(row);result.es=originals;cacheJson_(key,result,21600);return result;
}
function taxonomyLanguage_(language,names=taxonomyTranslations_()[language]||{}){
  return value=>language==='es'?value:Object.hasOwn(names,value)?names[value]:translateText(value,language);
}
function translationCallsToday_(){
  const today=recordDay(new Date(),settings_().timezone);
  return [translationJob_(),taxonomyTranslationJob_()].reduce((sum,job)=>sum+(job?.callDay===today?Number(job.calls||0):0),0);
}
function requestTaxonomyTranslations_(){properties_().setProperty('TAXONOMY_TRANSLATION_REQUEST',new Date().toISOString());ensureBackgroundWorker_();}
function taxonomyTranslationReadyAt_(){
  if(taxonomyPending_()||properties_().getProperty('TAXONOMY_REQUEST'))return Infinity;
  const job=taxonomyTranslationJob_(),request=properties_().getProperty('TAXONOMY_TRANSLATION_REQUEST');
  if(job?.state==='Publicando'||!request&&(!job||job.state==='Completada'))return Infinity;
  const paused=Number(properties_().getProperty('TRANSLATION_PAUSED_UNTIL')||0);if(paused>Date.now())return paused;
  if(request)return Date.now();
  if(job?.pausedUntil>Date.now())return job.pausedUntil;
  if(translationCallsToday_()>=TRANSLATION_WORK.dailyCalls){
    // Wake after the daily budget resets, even if article translation is disabled.
    return nextDailyReset(Date.now(),settings_().timezone);
  }
  return Math.max(Date.now(),Number(job.pausedUntil||0));
}
function getTaxonomyTranslationStatus(){
  authorize_(true);return {job:withJobProgress_('taxonomyTranslation',taxonomyTranslationJob_(),Boolean(properties_().getProperty('TAXONOMY_TRANSLATION_REQUEST'))),queued:Boolean(properties_().getProperty('TAXONOMY_TRANSLATION_REQUEST')),newsRevision:publishedNewsRevision_(),taxonomyTranslations:taxonomyTranslations_()};
}
function startTaxonomyTranslations(){authorize_(true);requestTaxonomyTranslations_();return getTaxonomyTranslationStatus();}
function taxonomyTranslationBatch_(maxMs=TAXONOMY_POLICY.maxMs){
  if(Number(properties_().getProperty('TRANSLATION_PAUSED_UNTIL')||0)>Date.now())return;
  if(taxonomyTranslationJob_()?.state==='Publicando')return;
  const started=Date.now(),p=properties_(),today=recordDay(new Date(),settings_().timezone);let job=taxonomyTranslationJob_(),written=false;
  try{
    const names=taxonomyTranslationNames_(),languages=Object.keys(languageNames).filter(language=>language!=='es'),revision=sha256_(JSON.stringify([names,languages])),request=p.getProperty('TAXONOMY_TRANSLATION_REQUEST');
    if(!job||job.revision!==revision||request&&job.state==='Completada'){
      job={revision,state:'Pendiente',total:names.length*languages.length,processed:0,translated:0,started:new Date().toISOString(),updated:new Date().toISOString(),calls:job?.callDay===today?job.calls:0,callDay:today,error:'',pausedUntil:0};
    }
    if(request){job.pausedUntil=0;if(p.getProperty('TAXONOMY_TRANSLATION_REQUEST')===request)p.deleteProperty('TAXONOMY_TRANSLATION_REQUEST');}
    if(job.callDay!==today){job.callDay=today;job.calls=0;job.pausedUntil=0;}
    if(job.pausedUntil>started)return;
    const index=taxonomyTranslationIndex_();let calls=0;
    job.state='En curso';job.error='';writeTaxonomyTranslationJob_(job);
    while(job.processed<job.total&&Date.now()-started<maxMs&&!backgroundPaused_()){
      if(collectionRequests_().some(request=>request.kind==='daily'))break;
      const name=names[Math.floor(job.processed/languages.length)],language=languages[job.processed%languages.length],key=taxonomyTranslationKey_(name,language);
      if(!index.has(key)){
        const staticName=Object.hasOwn(translations,name);
        if(!staticName&&(calls>=TRANSLATION_WORK.batchCalls||translationCallsToday_()>=TRANSLATION_WORK.dailyCalls))break;
        if(!staticName){calls++;job.calls++;writeTaxonomyTranslationJob_(job);}
        const text=staticName?translateText(name,language):String(LanguageApp.translate(name,'',language)||'').trim();
        if(!text||text.length>5000)throw Error('Respuesta de traducción incompleta.');
        append_('TaxonomiaTraducciones',[[key,language,text,new Date().toISOString()]]);index.set(key,text);written=true;job.translated++;
      }
      job.processed++;
    }
    job.state=job.processed===job.total?'Completada':translationCallsToday_()>=TRANSLATION_WORK.dailyCalls?'En pausa':'Pendiente';
    if(job.state==='En pausa')job.error='Límite diario de traducción alcanzado. Continuará en la siguiente ejecución diaria.';
    if(job.state==='Completada'){
      const active=new Set(names.flatMap(name=>languages.map(language=>taxonomyTranslationKey_(name,language)))),sheet=book_().getSheetByName('TaxonomiaTraducciones'),rows=rows_('TaxonomiaTraducciones'),kept=rows.filter(row=>active.has(row.clave));
      if(kept.length!==rows.length){
        if(kept.length)sheet.getRange(2,1,kept.length,4).setValues(kept.map(row=>RADAR.sheets.TaxonomiaTraducciones.map(key=>row[key])));
        sheet.getRange(kept.length+2,1,rows.length-kept.length,4).clearContent();taxonomyTranslationMemory_=new Map(kept.map(row=>[row.clave,row.texto]));written=true;
      }
    }
    telemetry_('traduccion-taxonomia',Date.now()-started,'OK',job.processed+'/'+job.total+' nombres; '+calls+' llamadas');
  }catch(error){
    if(!job)throw error;
    if(serviceQuotaPause_(error))p.setProperty('TRANSLATION_PAUSED_UNTIL',String(Date.now()+serviceQuotaPause_(error)));
    Object.assign(job,{state:'En pausa',error:'Traducción temporalmente no disponible. Se reintentará automáticamente.',pausedUntil:Date.now()+(serviceQuotaPause_(error)||TRANSLATION_WORK.retryMs)});
    telemetry_('traduccion-taxonomia',Date.now()-started,'Error',String(error.message).slice(0,180));
  }finally{if(written){p.setProperty('TAXONOMY_TRANSLATIONS_REVISION',Date.now()+'-'+Math.random().toString(36).slice(2));invalidateNews_(false,false);}if(job){job.updated=new Date().toISOString();writeTaxonomyTranslationJob_(job);}if(job?.state==='Completada')requestDashboardSnapshots_(true);}
}
