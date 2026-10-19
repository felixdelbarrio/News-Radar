let llmStateOverride_,llmIndexMemory_,llmContextMemory_;
function llmState_(){return llmStateOverride_||dataGeneration_().categorization||{mode:'deterministic',sheet:'',revision:'0'};}
function llmRevision_(){const state=llmState_();return state.mode+':'+state.revision;}
function llmJob_(){return JSON.parse(properties_().getProperty('LLM_JOB')||'null');}
function llmContext_(){
 const items=taxonomyCatalog_(),catalog=functionalCatalog_();
 if(llmContextMemory_?.items===items&&llmContextMemory_.catalog===catalog)return llmContextMemory_.context;
 const context={catalogRevision:sha256_(JSON.stringify(catalog)),taxonomyRevision:taxonomyModelRevision_(items),schemaVersion:LLM_OFFLINE.schemaVersion,maxAssignments:TAXONOMY_POLICY.maxAssignments,ids:new Set(items.map(row=>row.id))};
 llmContextMemory_={items,catalog,context};return context;
}
function llmArticle_(row){
 const article={id:row.id,titulo:row.titular||'',extracto:row.extracto||'',entidad:row.entidad||'',pais:row.pais||'',idioma:row.idioma||'',fecha:row.fecha||'',fuente:row.medio||row.fuente||'',url:row.url||''};
 return {...article,contentHash:sha256_(JSON.stringify(article))};
}
function llmIndex_(){
 const state=llmState_();if(llmIndexMemory_?.sheet===state.sheet)return llmIndexMemory_.index;
 const index=new Map(),sheet=state.sheet?book_().getSheetByName(state.sheet):null,keys=RADAR.sheets.CategorizacionLLM;
 if(sheet?.getLastRow()>1)for(const values of sheet.getRange(2,1,sheet.getLastRow()-1,keys.length).getDisplayValues()){
  const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));try{for(const key of ['ids','evidence'])row[key]=JSON.parse(row[key]);row.schemaVersion=Number(row.schemaVersion);if(index.has(row.newsId))throw Error('ID LLM duplicado.');index.set(row.newsId,row);}catch(_){index.set(row.newsId,null);}
 }
 llmIndexMemory_={sheet:state.sheet,index};return index;
}
function llmValid_(saved,row,context=llmContext_()){
 if(!saved)return false;const {updatedAt,...result}=saved;
 try{llmValidateResult(result,llmArticle_(row),context);return true;}catch(_){return false;}
}
// One resolver for dashboards, filters, CSV, aggregations and newly composed newsletters.
function effectiveTaxonomyAssignment_(row,items=taxonomyCatalog_()){
 if(llmState_().mode==='llm'){
  const saved=llmIndex_().get(row.id);if(llmValid_(saved,row)){
   const assignments=saved.evidence.map(e=>({id:e.id,terms:[e.quote],method:'literal',location:(row.titular||'').includes(e.quote)?'headline':'text'}));
   return {ids:saved.ids,primary:saved.primary,evidence:{...assignments[0],assignments}};
  }
 }
 const saved=taxonomySaved_(row.taxonomia);validateTaxonomyAssignment_(saved,items,row.id,false);return saved;
}
function llmPublishedRows_(visit){
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias;
 for(let first=2;first<=sheet.getLastRow();first+=250){const rows=sheet.getRange(first,1,Math.min(250,sheet.getLastRow()-first+1),keys.length).getDisplayValues();for(let i=0;i<rows.length;i++)visit(Object.fromEntries(keys.map((key,n)=>[key,rows[i][n]])),first+i);}
}
function getLlmCategorization(){
 authorize_(true);const context=llmContext_(),cache=CacheService.getScriptCache(),key='llm-progress:'+llmExportSignature_();let counts=cache.get(key);
 if(counts)counts=JSON.parse(counts);
 else{const index=llmIndex_();let total=0,valid=0;llmPublishedRows_(row=>{total++;if(llmValid_(index.get(row.id),row,context))valid++;});counts={total,valid};cacheJson_(key,counts,60);}
 const {total,valid}=counts;
 const state=llmState_();return {total,valid,pending:total-valid,percent:total?Math.round(valid/total*1000)/10:0,mode:state.mode,revision:state.revision,projectUrl:properties_().getProperty('LLM_PROJECT_URL')||LLM_OFFLINE.projectUrl,instructions:llmInstructions(context.maxAssignments),job:llmJob_(),newsRevision:publishedNewsRevision_(),limits:{importBytes:LLM_OFFLINE.importBytes,importRows:LLM_OFFLINE.importRows}};
}
function saveLlmCategorization(payload){
 authorize_(true);return withForegroundWrite_(()=>{
  llmExact(payload,['projectUrl','mode','revision'],'Configuración LLM');llmString(payload.projectUrl,300,'URL');
  if(!/^https:\/\/chatgpt\.com\/g\/g-p-[a-zA-Z0-9-]+\/?$/.test(payload.projectUrl))throw Error('Introduce la URL HTTPS de un proyecto GPT en chatgpt.com.');
  if(!['deterministic','llm'].includes(payload.mode))throw Error('Modo LLM no válido.');
  if(payload.revision!==llmState_().revision)throw Error('La categorización ha cambiado. Recarga la pestaña.');
  if(payload.mode!==llmState_().mode){llmAssertIdle_();llmQueuePublication_({...llmState_(),mode:payload.mode,revision:Utilities.getUuid()});}
  properties_().setProperty('LLM_PROJECT_URL',payload.projectUrl);return getLlmCategorization();
 });
}
function llmExportSignature_(){const context=llmContext_();return sha256_(JSON.stringify([properties_().getProperty('DATA_GENERATION'),newsSheet_().getLastRow(),properties_().getProperty('FUNCTIONAL_CATALOG_REVISION'),properties_().getProperty('TAXONOMY_REVISION'),newsStorageKey_(),properties_().getProperty('NEWS_CONTENT_REVISION')||'0',llmState_().revision,context.catalogRevision,context.taxonomyRevision]));}
function exportLlmPending(payload={}){
 authorize_(true);const started=Date.now(),signature=llmExportSignature_();
 if(payload.revision&&payload.revision!==signature)throw Error('Los pendientes han cambiado. Reinicia la descarga.');
 const cursor=payload.cursor??2;if(!Number.isSafeInteger(cursor)||cursor<2||cursor>newsSheet_().getLastRow()+1)throw Error('Cursor de exportación no válido.');
 const context=llmContext_(),index=llmIndex_(),instructions=llmInstructions(context.maxAssignments),manifest={schemaVersion:1,catalogRevision:context.catalogRevision,taxonomyRevision:context.taxonomyRevision,maxAssignments:context.maxAssignments,sourceRevision:signature},base={manifest,functionalCatalog:functionalCatalog_(),taxonomy:taxonomyCatalog_().map(row=>({id:row.id,palanca:row.palanca,subpalanca:row.subpalanca,descripcion:row.descripcion||'',aliases:row.terminos||[],conditions:row.condiciones||'',context:row.context||[],exclude:row.exclude||[]})),rules:instructions,resultSchema:llmResultSchema(context.maxAssignments)};
 const files=[{name:'manifest.json',text:JSON.stringify(manifest)},{name:'instructions.md',text:instructions}];let articles=[],next=cursor,count=0,size=llmUtf8(JSON.stringify(base)).length+llmUtf8(instructions).length+1000,stop=false;
 const flush=()=>{if(!articles.length)return;files.push({name:'batch-'+String(files.length-1).padStart(4,'0')+'.json',text:JSON.stringify({...base,articles})});count+=articles.length;articles=[];};
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,baseBytes=llmUtf8(JSON.stringify(base)).length;
 for(let first=cursor;first<=sheet.getLastRow()&&!stop;first+=250){
  const values=sheet.getRange(first,1,Math.min(250,sheet.getLastRow()-first+1),keys.length).getDisplayValues();
  for(let i=0;i<values.length;i++){
   const row=Object.fromEntries(keys.map((key,n)=>[key,values[i][n]]));next=first+i;
   if(!llmValid_(index.get(row.id),row,context)){
    const article=llmArticle_(row),bytes=llmUtf8(JSON.stringify(article)).length+1+(articles.length?0:baseBytes+200);
    if(size+bytes>LLM_OFFLINE.archiveBytes){if(!count&&!articles.length)throw Error('Catálogo o noticia demasiado grande para exportar.');stop=true;break;}
    size+=bytes;articles.push(article);if(articles.length===LLM_OFFLINE.batchRows)flush();
   }
   next++;
  }
 }
 flush();if(signature!==llmExportSignature_())throw Error('Los pendientes han cambiado durante la descarga. Reintenta.');
 const bytes=count?llmZip(files):[];telemetry_('llm-export',Date.now()-started,'OK',count+' pendientes; '+bytes.length+' bytes');
 return {revision:signature,cursor:next,done:next>sheet.getLastRow(),count,name:'news-radar-llm-'+cursor+'.zip',base64:bytes.length?Utilities.base64Encode(bytes.map(b=>b>127?b-256:b)):''};
}
function llmParseImport_(payload){
 llmExact(payload,['name','base64'],'Archivo');llmString(payload.name,150,'Nombre');llmString(payload.base64,Math.ceil(LLM_OFFLINE.importBytes/3)*4,'Archivo');
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(payload.base64))throw Error('Archivo base64 no válido.');
 const bytes=Utilities.base64Decode(payload.base64);if(bytes.length>LLM_OFFLINE.importBytes)throw Error('Importación superior a 2 MiB.');
 const files=/\.zip$/i.test(payload.name)?llmUnzip(bytes):/\.json$/i.test(payload.name)?[{text:llmDecode(bytes.map(b=>b&255))}]:null;
 if(!files)throw Error('Importa un ZIP_STORED o JSON.');
 const results=[];
 for(const file of files){let value;try{value=JSON.parse(file.text);}catch(_){throw Error('JSON corrupto.');}llmExact(value,['schemaVersion','results'],'Lote');if(value.schemaVersion!==1||!Array.isArray(value.results)||!value.results.length||value.results.length>LLM_OFFLINE.importRows)throw Error('Lote vacío, esquema o límite de resultados no válido.');results.push(...value.results);}
 if(results.length>LLM_OFFLINE.importRows)throw Error('Máximo 250 resultados por importación.');return results;
}
function llmAssertIdle_(){if(llmJob_()?.state==='Publicando')throw Error('La generación LLM sigue publicándose. Espera a que termine.');}
function importLlmResults(payload){
 authorize_(true);const started=Date.now(),results=llmParseImport_(payload);
 return withForegroundWrite_(()=>{
  const context=llmContext_(),wanted=new Set(),changes=[];
  const pending=llmJob_();let current;
  if(pending?.state==='Publicando'){llmStateOverride_=pending.categorization;try{current=llmIndex_();}finally{llmStateOverride_=undefined;llmIndexMemory_=undefined;}}else current=llmIndex_();
  for(const result of results){llmString(result?.newsId,150,'newsId');if(wanted.has(result.newsId))throw Error('newsId duplicado en la importación: '+result.newsId);wanted.add(result.newsId);}
  const news=new Map(rowsById_('Noticias',wanted).map(row=>[row.id,row]));
  for(const result of results){
   const row=news.get(result.newsId);if(!row)throw Error('Noticia no publicada o eliminada: '+result.newsId);
   llmValidateResult(result,llmArticle_(row),context);
   const previous=current.get(row.id);
   if(llmValid_(previous,row,context)){if(JSON.stringify(llmCanonicalResult_(previous))!==JSON.stringify(llmCanonicalResult_(result)))throw Error('Resultado conflictivo para '+row.id);continue;}
   changes.push({...llmCanonicalResult_(result),updatedAt:new Date().toISOString()});
  }
  if(!changes.length)return {...getLlmCategorization(),imported:0,duplicates:results.length};
  llmAssertIdle_();pruneLlmGenerations_();const state=llmState_(),name='CategorizacionLLM_gen_'+Utilities.getUuid(),keys=RADAR.sheets.CategorizacionLLM,previous=state.sheet&&book_().getSheetByName(state.sheet),sheet=previous?previous.copyTo(book_()).setName(name):generationSheet_(name,keys),positions=new Map();
  if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues().forEach(([id],i)=>positions.set(id,i+2));
  let next=sheet.getLastRow()+1;const updates=changes.map(result=>({row:positions.get(result.newsId)||next++,values:keys.map(key=>typeof result[key]==='object'?JSON.stringify(result[key]):String(safeCell_(result[key])))}));
  // Staging is unreachable to consumers until the complete, verified snapshot set is published.
  try{writeStagedNewsRows_(sheet,updates);llmQueuePublication_({...state,sheet:name,revision:Utilities.getUuid()});}catch(error){book_().deleteSheet(sheet);throw error;}
  telemetry_('llm-import',Date.now()-started,'OK',changes.length+' preparadas; '+(results.length-changes.length)+' duplicadas; '+updates.length+' filas escritas');
  return {...getLlmCategorization(),imported:changes.length,duplicates:results.length-changes.length};
 });
}
function llmCanonicalResult_(result){return Object.fromEntries(['newsId','contentHash','catalogRevision','taxonomyRevision','schemaVersion','ids','primary','evidence','status'].map(key=>[key,key==='evidence'?result.evidence.map(({id,quote})=>({id,quote})):result[key]]));}
function llmQueuePublication_(state){
 const job={id:Utilities.getUuid(),state:'Publicando',categorization:state,started:new Date().toISOString(),error:''};
 properties_().setProperty('LLM_JOB',JSON.stringify(job));requestDashboardSnapshots_(true);ensureBackgroundWorker_();
}
function llmSnapshotBatch_(){
 const job=llmJob_();if(job?.state!=='Publicando')return false;
 llmStateOverride_=job.categorization;
 try{return buildDashboardSnapshotBatch_({llm:true,categorization:job.categorization});}catch(error){job.error=String(error.message).slice(0,180);properties_().setProperty('LLM_JOB',JSON.stringify(job));throw error;}
 finally{llmStateOverride_=undefined;llmIndexMemory_=undefined;}
}

function pruneLlmGenerations_(){
 const previous=JSON.parse(properties_().getProperty('PREVIOUS_DATA_GENERATION')||'{}'),keep=new Set([llmState_().sheet,previous.categorization?.sheet,llmJob_()?.categorization?.sheet]);
 for(const sheet of book_().getSheets())if(sheet.getName().startsWith('CategorizacionLLM_gen_')&&!keep.has(sheet.getName()))book_().deleteSheet(sheet);
}
