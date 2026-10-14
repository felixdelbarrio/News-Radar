let taxonomyMemory_;
function taxonomyCatalog_(){
  const revision=properties_().getProperty('TAXONOMY_REVISION')||'0';
  if(taxonomyMemory_?.revision===revision)return taxonomyMemory_.items;
  const key='taxonomy:'+revision,cache=CacheService.getScriptCache(),cached=cache.get(key);
  const items=cached?JSON.parse(cached):rows_('Taxonomia').map(row=>({...row,segmentos:JSON.parse(row.segmentos),terminos:JSON.parse(row.terminos),noticias:Number(row.noticias),peso:Number(row.peso)}));
  if(!cached)cacheJson_(key,items,21600);taxonomyMemory_={revision,items};return items;
}
function taxonomyOptions_(){const rows=taxonomyCatalog_();return {palanca:[...new Set(rows.map(row=>row.palanca))],subpalanca:rows.map(taxonomyPath)};}
function taxonomySaved_(value){try{const data=JSON.parse(value||'{}');return {fingerprint:data.fingerprint||'',ids:Array.isArray(data.ids)?data.ids:[]};}catch(_){return {fingerprint:'',ids:[]};}}
function taxonomyFingerprint_(title,excerpt){return sha256_(JSON.stringify([title,excerpt]));}
function taxonomyNewsIds_(title,excerpt,items=taxonomyCatalog_()){
  if(!items.length)return [];
  const text=taxonomyText(title+' '+excerpt);
  return taxonomyEligible_(searchText_(title),text)?items.filter(item=>taxonomyTermCounts(text,item.terminos).size).map(item=>item.id).sort():[];
}
function taxonomyJob_(){const raw=properties_().getProperty('TAXONOMY_JOB');return raw?JSON.parse(raw):null;}
function taxonomyPending_(){const job=taxonomyJob_();return Boolean(job&&job.state!=='Completada');}
function taxonomyReadyAt_(){const job=taxonomyJob_();return job&&job.state!=='Completada'?Math.max(Date.now(),Number(job.pausedUntil||0)):Infinity;}
function writeTaxonomyJob_(job){properties_().setProperty('TAXONOMY_JOB',JSON.stringify(job));}
function requestTaxonomy_(){
  const total=Math.max(0,book_().getSheetByName('Noticias').getLastRow()-1),now=new Date().toISOString();
  writeTaxonomyJob_({id:Utilities.getUuid(),state:'Pendiente',phase:'scan',next:2,total,processed:0,tagged:0,documents:0,started:now,updated:now,day:recordDay(now,settings_().timezone),corpus:properties_().getProperty('NEWS_CONTENT_REVISION')||'0',rules:classificationRulesRevision_()});
  ensureBackgroundWorker_();
}
function drainTaxonomyRequest_(){
  const p=properties_(),day=p.getProperty('TAXONOMY_REQUEST');if(!day||taxonomyPending_())return;
  if(taxonomyJob_()?.day!==day)requestTaxonomy_();p.deleteProperty('TAXONOMY_REQUEST');
}
function getTaxonomyStatus(){
  authorize_(true);return {newsRevision:properties_().getProperty('NEWS_REVISION')||'0',pageSize:settings_().pageSize,job:taxonomyJob_(),items:taxonomyCatalog_(),taxonomyTranslations:taxonomyTranslations_(),queued:Boolean(properties_().getProperty('TAXONOMY_REQUEST')),scheduled:newsletterEnabled_(),timezone:settings_().timezone};
}
function startTaxonomy(){
  authorize_(true);return withForegroundWrite_(()=>{
    const job=taxonomyJob_();if(!taxonomyPending_())requestTaxonomy_();else if(job.state==='En pausa'){job.state='Pendiente';job.pausedUntil=0;writeTaxonomyJob_(job);}
    ensureBackgroundWorker_();return getTaxonomyStatus();
  });
}
function taxonomyCheckpoint_(job){
  const sheet=book_().getSheetByName('TaxonomiaTrabajo');if(sheet.getLastRow()<2)return {next:2,documents:0,candidates:{}};
  const meta=JSON.parse(sheet.getRange(2,1,1,1).getDisplayValues()[0][0]);if(meta.id!==job.id)return {next:2,documents:0,candidates:{}};
  const candidates={};if(meta.chunks)for(const [value] of sheet.getRange(3,1,meta.chunks,1).getDisplayValues())for(const entry of JSON.parse(value))candidates[entry.key]=entry;
  const titles={};
  for(let offset=0;offset<(meta.titleChunks||0);offset+=100)for(const [value] of sheet.getRange(3+meta.chunks+offset,1,Math.min(100,meta.titleChunks-offset),1).getDisplayValues())Object.assign(titles,Object.fromEntries(JSON.parse(value)));
  return {...meta,candidates,titles};
}
function writeTaxonomyCheckpoint_(job,state){
  const entries=Object.values(state.candidates),chunks=[];
  for(let i=0;i<entries.length;i+=TAXONOMY_POLICY.checkpointRows)chunks.push([JSON.stringify(entries.slice(i,i+TAXONOMY_POLICY.checkpointRows))]);
  const titles=Object.entries(state.titles||{}),titleChunks=[];
  let chunk=[],size=2;
  for(const entry of titles){const value=JSON.stringify(entry);if(size+value.length+1>TAXONOMY_POLICY.checkpointChars&&chunk.length){titleChunks.push(['['+chunk.join(',')+']']);chunk=[];size=2;}chunk.push(value);size+=value.length+1;}
  if(chunk.length)titleChunks.push(['['+chunk.join(',')+']']);
  const meta={id:job.id,next:state.next,documents:state.documents,size:state.size,chunks:chunks.length,titleChunks:titleChunks.length};
  book_().getSheetByName('TaxonomiaTrabajo').getRange(2,1,chunks.length+titleChunks.length+1,1).setNumberFormat('@').setValues([[JSON.stringify(meta)],...chunks,...titleChunks]);
}
function taxonomyModelRevision_(items){return sha256_(JSON.stringify(items.map(row=>[row.id,row.palanca,row.subpalanca,row.segmentos,row.terminos])));}
function publishTaxonomy_(state){
  const items=taxonomyBuild(state).map(row=>({id:sha256_(row.key).slice(0,24),palanca:row.palanca,subpalanca:row.subpalanca,segmentos:row.segments,terminos:row.terms,noticias:row.df,peso:row.peso,origen:row.origin}));
  const revision=sha256_(JSON.stringify(items));
  if(revision===properties_().getProperty('TAXONOMY_REVISION')){taxonomyMemory_={revision,items};return taxonomyModelRevision_(items);}
  const sheet=book_().getSheetByName('Taxonomia'),previous=Math.max(0,sheet.getLastRow()-1),keys=RADAR.sheets.Taxonomia;
  const values=items.map(row=>keys.map(key=>Array.isArray(row[key])?JSON.stringify(row[key]):row[key]));
  if(values.length)sheet.getRange(2,1,values.length,keys.length).setNumberFormat('@').setValues(values);
  if(previous>values.length)sheet.getRange(values.length+2,1,previous-values.length,keys.length).clearContent();
  properties_().setProperty('TAXONOMY_REVISION',revision);taxonomyMemory_={revision,items};invalidateNews_(false);
  return taxonomyModelRevision_(items);
}
function taxonomyEligible_(title,text){
  const assessment=digitalAssessment_(title,text);return !assessment.excluded&&!assessment.editorial;
}
function taxonomyBatch_(maxMs=TAXONOMY_POLICY.maxMs){
  const job=taxonomyJob_();if(!job||job.state==='Completada')return;
  const started=Date.now();let written=false;
  try{
    if(job.corpus!==(properties_().getProperty('NEWS_CONTENT_REVISION')||'0')||job.rules!==classificationRulesRevision_()){requestTaxonomy_();return;}
    const sheet=book_().getSheetByName('Noticias'),keys=RADAR.sheets.Noticias,column=keys.indexOf('taxonomia');
    if(job.phase==='scan'){
      const state=taxonomyCheckpoint_(job),definitions=taxonomyDefinitions(configuration_().capabilities),excluded=new Set(configuration_().entities.flatMap(row=>[row.name,...row.aliases]).flatMap(name=>taxonomyText(name).match(/[a-z][a-z0-9]+/g)||[]));
      const count=Math.min(TAXONOMY_POLICY.batchRows,Math.max(0,job.total-state.next+2));
      state.titles=state.titles||{};
      if(count)for(const row of sheet.getRange(job.total-state.next-count+4,2,count,6).getDisplayValues().reverse()){
        const title=searchText_(row[4]),text=taxonomyText(row[4]+' '+row[5]),identity=titleIdentity_({title:row[4],date:row[0],publisher:row[2]}),key=identity?sha256_(identity.key):'',days=state.titles[key]||[];
        const duplicate=identity&&days.some(day=>Math.abs(day-identity.day)<=COLLECTION_POLICY.duplicateDays);
        if(identity&&!duplicate){days.push(identity.day);state.titles[key]=days;}
        if(!duplicate&&taxonomyEligible_(title,text))taxonomyObserve(state,text,definitions,excluded);
        state.next++;if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
      }
      writeTaxonomyCheckpoint_(job,state);job.next=state.next;job.documents=state.documents;job.processed=state.next-2;
      if(state.next>job.total+1){job.phase='publish';}
    }else if(job.phase==='publish'){
      job.model=publishTaxonomy_(taxonomyCheckpoint_(job));job.changed=job.model!==properties_().getProperty('TAXONOMY_APPLIED_MODEL')||job.rules!==properties_().getProperty('TAXONOMY_APPLIED_RULES');job.phase='tag';job.next=2;
    }else{
      let next=job.next;
      const items=taxonomyCatalog_(),count=Math.min(TAXONOMY_POLICY.batchRows,Math.max(0,job.total-job.next+2)),updates=[];
      if(count){
        const rows=sheet.getRange(job.next,6,count,column-4).getDisplayValues();
        for(const row of rows){
          const saved=taxonomySaved_(row[column-5]),fingerprint=taxonomyFingerprint_(row[0],row[1]);
          if(job.changed||saved.fingerprint!==fingerprint){
            const ids=taxonomyNewsIds_(row[0],row[1],items);
            if(saved.fingerprint!==fingerprint||JSON.stringify(saved.ids)!==JSON.stringify(ids))updates.push({row:next,value:JSON.stringify({fingerprint,ids})});
          }
          next++;if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
        }
        for(let start=0,end=1;end<=updates.length;end++){
          if(end<updates.length&&updates[end].row===updates[end-1].row+1)continue;
          sheet.getRange(updates[start].row,column+1,end-start,1).setNumberFormat('@').setValues(updates.slice(start,end).map(update=>[update.value]));written=true;job.tagged+=end-start;start=end;
          if(end<updates.length&&Date.now()-started>=maxMs){next=updates[end].row;break;}
        }
        if(written)SpreadsheetApp.flush();
      }
      job.next=next;job.processed=job.total+Math.min(job.total,job.next-2);
      if(job.next>job.total+1){job.state='Completada';properties_().setProperty('TAXONOMY_APPLIED_MODEL',job.model);properties_().setProperty('TAXONOMY_APPLIED_RULES',job.rules);properties_().setProperty('TAXONOMY_EVALUATED_CORPUS',job.corpus);}
    }
    Object.assign(job,{state:job.state==='Completada'?'Completada':'En curso',updated:new Date().toISOString(),error:'',pausedUntil:0});writeTaxonomyJob_(job);
    if(job.state==='Completada')requestTaxonomyTranslations_();
    telemetry_('taxonomia',Date.now()-started,'OK',job.phase+'; '+job.processed+'/'+job.total*2+' revisadas; '+job.tagged+' etiquetas actualizadas');
  }catch(error){Object.assign(job,{state:'En pausa',error:String(error.message).slice(0,180),updated:new Date().toISOString(),pausedUntil:Date.now()+settings_().retryMinutes*60000});writeTaxonomyJob_(job);telemetry_('taxonomia',Date.now()-started,'Error',job.error);}
  finally{if(written)invalidateNews_(false);}
}
