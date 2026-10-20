let llmStateOverride_,llmIndexMemory_,llmContextMemory_;
function llmState_(){const {sheet='',revision='0'}=llmStateOverride_||dataGeneration_().categorization||{};return {sheet,revision};}
function llmRevision_(){const state=llmState_();return 'canonical:'+state.revision;}
function llmJob_(){return JSON.parse(properties_().getProperty('LLM_JOB')||'null');}
function llmContext_(){
 const items=taxonomyCatalog_(),catalog=functionalCatalog_();
 if(llmContextMemory_?.items===items&&llmContextMemory_.catalog===catalog)return llmContextMemory_.context;
 const context={catalogRevision:sha256_(JSON.stringify(catalog)),taxonomyRevision:taxonomyModelRevision_(items),schemaVersion:LLM_OFFLINE.schemaVersion,maxAssignments:TAXONOMY_POLICY.maxAssignments,ids:new Set(items.map(row=>row.id)),blocks:new Set(catalog.map(block=>block.name.slice(0,2))),concepts:new Set([...catalog.flatMap(block=>block.functions.map(row=>block.name.slice(0,2)+':'+llmConcept(row.name))),...items.map(row=>row.palanca.slice(0,2)+':'+llmConcept(row.subpalanca.replace(/^\d{2}\.(?:\d{2}|xx)[. ]*/,'')))])};
 llmContextMemory_={items,catalog,context};return context;
}
function llmArticle_(row){
 const article={id:row.id,titulo:row.titular||'',extracto:row.extracto||'',entidad:row.entidad||'',pais:row.pais||'',idioma:row.idioma||'',fecha:row.fecha||'',fuente:row.medio||row.fuente||'',url:row.url||''};
 return {...article,contentHash:sha256_(JSON.stringify(article))};
}
function llmIndex_(){
 const state=llmState_();if(llmIndexMemory_&&llmIndexMemory_.sheet===state.sheet)return llmIndexMemory_.index;
 const index=new Map(),sheet=state.sheet?book_().getSheetByName(state.sheet):null,keys=RADAR.sheets.CategorizacionLLM;
 if(sheet?.getLastRow()>1)for(const values of sheet.getRange(2,1,sheet.getLastRow()-1,keys.length).getDisplayValues()){
  const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));try{row.schemaVersion=Number(row.schemaVersion);for(const key of ['ids','evidence','sources','proposals'])row[key]=JSON.parse(row[key]);if(index.has(row.newsId))throw Error('ID LLM duplicado.');index.set(row.newsId,row);}catch(_){index.set(row.newsId,null);}
 }
 llmIndexMemory_={sheet:state.sheet,index};return index;
}
function llmValid_(saved,row,context=llmContext_()){
 if(!saved)return false;const {updatedAt,...result}=saved;
 try{llmValidateResult(result,llmArticle_(row),context);return true;}catch(_){return false;}
}
function llmStrongResult_(saved,row,items=taxonomyCatalog_()){
 if(saved?.status!=='classified'||!llmValid_(saved,row))return false;
 const byId=taxonomyValidationIndex_(items).byId;
 return saved.evidence.every(e=>{
  const item=byId.get(e.id),terms=/\.xx Otros$/.test(item.subpalanca)?items.find(block=>block.palanca===item.palanca&&!block.subpalanca)?.terminos||[]:item.terminos||[];
  const source=saved.sources.find(source=>source.id===e.source),text=taxonomyText([row.titular,row.extracto,source?.passage||''].join(' '));
  return e.quote.trim().length>=12&&(!item.context?.length||taxonomyTermCounts(text,item.context.map(taxonomyText)).size>0)&&!taxonomyTermCounts(text,(item.exclude||[]).map(taxonomyText)).size&&taxonomyEvidenceSupports(e.quote,terms);
 });
}
// One resolver for dashboards, filters, CSV, aggregations and newly composed newsletters.
function effectiveTaxonomyAssignment_(row,items=taxonomyCatalog_()){
 const result=llmIndex_().get(row.id);
 const editorialExcluded=result?.status==='out_of_scope'&&llmValid_(result,row)&&result.sources.some(source=>source.passage.trim().length>=40&&digitalAssessment_(searchText_(source.passage),searchText_(source.passage)).excluded);
 {
  const saved=result;if(llmStrongResult_(saved,row,items)){
   const assignments=saved.evidence.map(e=>{const source=saved.sources?.find(source=>source.id===e.source);return {id:e.id,terms:[e.quote],method:source?'external':'literal',location:source?'web':(row.titular||'').includes(e.quote)?'headline':'text',...(source?{url:source.url,retrievedAt:source.retrievedAt}:{})};});
   return {ids:saved.ids,primary:saved.primary,evidence:{...assignments[0],assignments}};
  }
 }
 const saved=taxonomySaved_(row.taxonomia);validateTaxonomyAssignment_(saved,items,row.id,false);return {...saved,editorialExcluded};
}
function llmPublishedRows_(visit){
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias;
 for(let first=2;first<=sheet.getLastRow();first+=250){const rows=sheet.getRange(first,1,Math.min(250,sheet.getLastRow()-first+1),keys.length).getDisplayValues();for(let i=0;i<rows.length;i++)visit(Object.fromEntries(keys.map((key,n)=>[key,rows[i][n]])),first+i);}
}
function getLlmCategorization(){
 authorize_(true);const context=llmContext_(),cache=CacheService.getScriptCache(),key='llm-progress:'+llmExportSignature_();let counts=cache.get(key);
 if(counts)counts=JSON.parse(counts);
 else{const index=llmIndex_();let total=0,valid=0,classified=0,abstained=0,outOfScope=0;llmPublishedRows_(row=>{total++;const saved=index.get(row.id);if(llmValid_(saved,row,context)){valid++;if(saved.status==='classified')classified++;else if(saved.status==='out_of_scope')outOfScope++;else abstained++;}});counts={total,valid,classified,abstained,outOfScope};cacheJson_(key,counts,60);}
 const {total,valid}=counts;
 const state=llmState_();return {...counts,total,valid,pending:total-valid,percent:total?Math.round(valid/total*1000)/10:0,revision:state.revision,projectUrl:properties_().getProperty('LLM_PROJECT_URL')||LLM_OFFLINE.projectUrl,instructions:llmInstructions(context.maxAssignments),job:llmJob_(),newsRevision:publishedNewsRevision_(),limits:{importBytes:LLM_OFFLINE.importBytes,importRows:LLM_OFFLINE.importRows}};
}
function saveLlmCategorization(payload){
 authorize_(true);return withForegroundWrite_(()=>{
  llmExact(payload,['projectUrl','revision'],'Configuración LLM');llmString(payload.projectUrl,300,'URL');
  if(!/^https:\/\/chatgpt\.com\/g\/g-p-[a-zA-Z0-9-]+\/?$/.test(payload.projectUrl))throw Error('Introduce la URL HTTPS de un proyecto GPT en chatgpt.com.');
  if(payload.revision!==llmState_().revision)throw Error('La categorización ha cambiado. Recarga la pestaña.');
  properties_().setProperty('LLM_PROJECT_URL',payload.projectUrl);return getLlmCategorization();
 });
}
function llmExportSignature_(){const context=llmContext_();return sha256_(JSON.stringify([properties_().getProperty('DATA_GENERATION'),newsSheet_().getLastRow(),properties_().getProperty('FUNCTIONAL_CATALOG_REVISION'),properties_().getProperty('TAXONOMY_REVISION'),newsStorageKey_(),properties_().getProperty('NEWS_CONTENT_REVISION')||'0',llmState_().revision,context.catalogRevision,context.taxonomyRevision]));}
function exportLlmPending(payload={}){
 authorize_(true);const started=Date.now(),selection=payload.selection||'pending';if(!['pending','abstentions','all'].includes(selection))throw Error('Selección de exportación no válida.');const signature=sha256_(llmExportSignature_()+':'+selection);
 if(payload.revision&&payload.revision!==signature)throw Error('Los pendientes han cambiado. Reinicia la descarga.');
 const cursor=payload.cursor??2;if(!Number.isSafeInteger(cursor)||cursor<2||cursor>newsSheet_().getLastRow()+1)throw Error('Cursor de exportación no válido.');
 const context=llmContext_(),index=llmIndex_(),instructions=llmInstructions(context.maxAssignments),manifest={schemaVersion:LLM_OFFLINE.schemaVersion,catalogRevision:context.catalogRevision,taxonomyRevision:context.taxonomyRevision,maxAssignments:context.maxAssignments,sourceRevision:signature},base={manifest,functionalCatalog:functionalCatalog_(),taxonomy:taxonomyCatalog_().map(row=>({id:row.id,palanca:row.palanca,subpalanca:row.subpalanca,descripcion:row.descripcion||'',aliases:row.terminos||[],conditions:row.condiciones||'',context:row.context||[],exclude:row.exclude||[]})),rules:instructions,resultSchema:llmResultSchema(context.maxAssignments)};
 const files=[{name:'manifest.json',text:JSON.stringify(manifest)},{name:'context.json',text:JSON.stringify(base)},{name:'instructions.md',text:instructions}];
 const review=cursor===2?{name:'proposals.json',text:JSON.stringify(llmProposals_(context,index))}:null,batches=[];
 let articles=[],next=cursor,count=0,size=files.reduce((sum,file)=>sum+llmUtf8(file.text).length+file.name.length+100,review?llmUtf8(review.text).length:0),stop=false;
 const flush=()=>{if(!articles.length)return;batches.push(JSON.stringify({schemaVersion:LLM_OFFLINE.schemaVersion,sourceRevision:signature,articles}));count+=articles.length;articles=[];};
 if(size>LLM_OFFLINE.archiveBytes)throw Error('Catálogo o noticia demasiado grande para exportar.');
 const sheet=newsSheet_(),keys=RADAR.sheets.Noticias;
 for(let first=cursor;first<=Math.min(sheet.getLastRow(),cursor+LLM_OFFLINE.exportRows-1)&&!stop;first+=250){
  const values=sheet.getRange(first,1,Math.min(250,sheet.getLastRow()-first+1,cursor+LLM_OFFLINE.exportRows-first),keys.length).getDisplayValues();
  for(let i=0;i<values.length;i++){
   const row=Object.fromEntries(keys.map((key,n)=>[key,values[i][n]]));next=first+i;
   const saved=index.get(row.id),valid=llmValid_(saved,row,context);if(selection==='all'||!valid||selection==='abstentions'&&saved.status!=='classified'){
    const article={...llmArticle_(row),previousResultHash:saved?llmResultHash_(saved):''},bytes=llmUtf8(JSON.stringify(article)).length+200;
    if(size+bytes>LLM_OFFLINE.archiveBytes){if(!count&&!articles.length)throw Error('Catálogo o noticia demasiado grande para exportar.');stop=true;break;}
    size+=bytes;articles.push(article);if(articles.length===LLM_OFFLINE.batchRows)flush();
   }
   next++;
  }
 }
 flush();batches.forEach((text,index)=>files.push({name:(index+1)+'_'+batches.length+'.json',text}));if(signature!==sha256_(llmExportSignature_()+':'+selection))throw Error('Los pendientes han cambiado durante la descarga. Reintenta.');
 telemetry_('llm-export',Date.now()-started,'OK',count+' noticias; '+selection+'; '+size+' bytes');
 return {revision:signature,cursor:next,done:next>sheet.getLastRow(),count,progress:Math.round((next-2)/Math.max(1,sheet.getLastRow()-1)*100),files,review};
}
function llmParseImport_(payload){
 llmExact(payload,['name','base64'],'Archivo');llmString(payload.name,150,'Nombre');llmString(payload.base64,Math.ceil(LLM_OFFLINE.importBytes/3)*4,'Archivo');
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(payload.base64))throw Error('Archivo base64 no válido.');
 const bytes=Utilities.base64Decode(payload.base64);if(bytes.length>LLM_OFFLINE.importBytes)throw Error('Importación superior a 2 MiB.');
 const files=/\.zip$/i.test(payload.name)?llmUnzip(bytes):/\.json$/i.test(payload.name)?[{text:llmDecode(bytes.map(b=>b&255))}]:null;
 if(!files)throw Error('Importa un ZIP_STORED o JSON.');
 const results=[];
 for(const file of files){let value;try{value=JSON.parse(file.text);}catch(_){throw Error('JSON corrupto.');}llmExact(value,['schemaVersion','results'],'Lote');if(value.schemaVersion!==LLM_OFFLINE.schemaVersion||!Array.isArray(value.results)||!value.results.length||value.results.length>LLM_OFFLINE.importRows)throw Error('Lote vacío, esquema o límite de resultados no válido.');results.push(...value.results);}
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
   if(previous&&JSON.stringify(llmCanonicalResult_(previous))===JSON.stringify(llmCanonicalResult_(result)))continue;
   if(result.replaces!==(previous?llmResultHash_(previous):''))throw Error('Resultado conflictivo: la revisión previa ha cambiado para '+row.id);
   changes.push({...llmCanonicalResult_(result),updatedAt:new Date().toISOString()});
  }
  if(!changes.length){if(pending?.state==='Publicando')ensureBackgroundWorker_();return {...getLlmCategorization(),imported:0,duplicates:results.length};}
  llmAssertIdle_();pruneLlmGenerations_();const state=llmState_(),name='CategorizacionLLM_gen_'+Utilities.getUuid(),keys=RADAR.sheets.CategorizacionLLM,previous=state.sheet&&book_().getSheetByName(state.sheet),sheet=previous?previous.copyTo(book_()).setName(name):generationSheet_(name,keys),positions=new Map();
  sheet.getRange(1,1,1,keys.length).setValues([keys]);
  if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues().forEach(([id],i)=>positions.set(id,i+2));
  let next=sheet.getLastRow()+1;const updates=changes.map(result=>({row:positions.get(result.newsId)||next++,values:keys.map(key=>typeof result[key]==='object'?JSON.stringify(result[key]):String(safeCell_(result[key])))}));
  // Staging is unreachable to consumers until the complete, verified snapshot set is published.
  try{writeStagedNewsRows_(sheet,updates);llmQueuePublication_({...state,sheet:name,revision:Utilities.getUuid()},changes.length>=25&&changes.every(row=>row.status!=='classified'&&!row.sources.length));}catch(error){if(llmJob_()?.categorization?.sheet!==name)book_().deleteSheet(sheet);throw error;}
  telemetry_('llm-import',Date.now()-started,'OK',changes.length+' preparadas; '+(results.length-changes.length)+' duplicadas; '+updates.length+' filas escritas');
  return {...getLlmCategorization(),imported:changes.length,duplicates:results.length-changes.length};
 });
}
function llmCanonicalValue_(value){return Array.isArray(value)?value.map(llmCanonicalValue_):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,llmCanonicalValue_(value[key])])):value;}
function llmCanonicalResult_(result){return Object.fromEntries(['newsId','contentHash','catalogRevision','taxonomyRevision','schemaVersion','ids','primary','evidence','status','sources','proposals','replaces'].map(key=>[key,llmCanonicalValue_(result[key])]));}
function llmResultHash_(result){return sha256_(JSON.stringify(llmCanonicalResult_(result)));}
// Review-only data is included once in the unified export.
function llmProposals_(context,index){
 const groups=new Map();let bytes=0;
 if([...index.values()].some(saved=>saved?.proposals?.length))llmPublishedRows_(row=>{const saved=index.get(row.id);if(!saved?.proposals?.length||!llmValid_(saved,row,context))return;for(const proposal of saved.proposals){
  const key=proposal.block+':'+llmConcept(proposal.name);if(!groups.has(key))groups.set(key,{concept:key,block:proposal.block,code:proposal.code,name:proposal.name,status:'review_only',articles:[]});
  const article={newsId:row.id,url:row.url,justification:proposal.justification,equivalents:proposal.equivalents,evidence:proposal.evidence,sources:saved.sources};bytes+=llmUtf8(JSON.stringify(article)).length+500;if(bytes>LLM_OFFLINE.archiveBytes)throw Error('Propuestas demasiado grandes para una descarga; revisa la hoja de categorización.');groups.get(key).articles.push(article);
 }});
 const proposals=[...groups.values()].sort((a,b)=>a.concept.localeCompare(b.concept)),report={schemaVersion:LLM_OFFLINE.schemaVersion,catalogRevision:context.catalogRevision,taxonomyRevision:context.taxonomyRevision,proposals};
 if(llmUtf8(JSON.stringify(report)).length>LLM_OFFLINE.archiveBytes)throw Error('Propuestas demasiado grandes para una descarga; revisa la hoja de categorización.');
 return report;
}
function llmQueuePublication_(state,reviewRequired=false){
 const job={id:Utilities.getUuid(),state:'Publicando',progress:0,reviewRequired,categorization:state,started:new Date().toISOString(),error:''};
 properties_().setProperty('LLM_JOB',JSON.stringify(job));
 try{requestDashboardSnapshots_(true);ensureBackgroundWorker_();}catch(error){job.error=String(error.message).slice(0,180);properties_().setProperty('LLM_JOB',JSON.stringify(job));throw error;}
}
function llmSnapshotBatch_(){
 const job=llmJob_();if(job?.state!=='Publicando')return false;
 llmStateOverride_=job.categorization;
 try{
  const worked=buildDashboardSnapshotBatch_({llm:true,categorization:job.categorization}),current=llmJob_();
  if(current.state==='Publicando'){const build=JSON.parse(properties_().getProperty('DASHBOARD_SNAPSHOT_BUILD')||'{}');current.progress=Math.round(Object.keys(build.manifests||{}).length/DASHBOARD_SNAPSHOTS.views.length*100);properties_().setProperty('LLM_JOB',JSON.stringify(current));}
  return worked;
 }catch(error){job.error=String(error.message).slice(0,180);properties_().setProperty('LLM_JOB',JSON.stringify(job));throw error;}
 finally{llmStateOverride_=undefined;llmIndexMemory_=undefined;}
}

function pruneLlmGenerations_(){
 const keep=generationKeep_();
 for(const sheet of book_().getSheets())if(sheet.getName().startsWith('CategorizacionLLM_gen_')&&!keep.has(sheet.getName()))book_().deleteSheet(sheet);
}
