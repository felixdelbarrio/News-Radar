function candidateRecord_(item,feed,now,reason){
  const row={id:sha256_(newsUrlIdentity_(item.url)).slice(0,32),fecha:recordDay(item.date,settings_().timezone),pais:item.country,entidad:item.entity,titular:item.title.slice(0,1000),extracto:item.excerpt.slice(0,CANDIDATE_POLICY.excerptChars),url:item.url,fuente:feed.name,idioma:item.language,capturada:now.toISOString(),estado:item.labels.estado,motivo:reason,procedencia:JSON.stringify({fuente:feed.url,tipo:feed.kind||'rss',dominio:feed.domain,capacidad:Boolean(feed.capabilitySearch),medio:item.publisher||(feed.kind==='rss'?feed.name:''),extracto:item.provenance,...(item.sourceUrl?{medioUrl:item.sourceUrl}:{}),consulta:feed.range||null}),clasificacion:JSON.stringify(item.labels)};
  return RADAR.sheets.Candidatos.map(key=>row[key]||'');
}
function candidateSheet_(){
  let sheet=book_().getSheetByName('Candidatos');if(!sheet){sheet=book_().insertSheet('Candidatos');sheet.getRange(1,1,1,RADAR.sheets.Candidatos.length).setValues([RADAR.sheets.Candidatos]);}return sheet;
}
// A bounded identity column is read once per collection batch, never per article.
function persistCandidates_(records,now=new Date()){
  const p=properties_(),day=recordDay(now,settings_().timezone);
  if(!records.length&&(!book_().getSheetByName('Candidatos')||p.getProperty('CANDIDATE_RETENTION_DAY')===day))return;
  const sheet=candidateSheet_(),count=Math.max(0,sheet.getLastRow()-1),cutoff=new Date(now.getTime()-CANDIDATE_POLICY.retentionDays*86400000).toISOString();
  let expired=0;
  if(count&&p.getProperty('CANDIDATE_RETENTION_DAY')!==day)for(const [captured] of sheet.getRange(2,10,count,1).getDisplayValues()){if(captured>=cutoff)break;expired++;}
  if(expired)sheet.deleteRows(2,expired);
  const size=Math.max(0,sheet.getLastRow()-1),cache=CacheService.getScriptCache(),key='candidate-ids:'+RADAR.version+':'+(p.getProperty('CANDIDATES_REVISION')||'0')+':'+size,cached=!expired&&readDashboardCache_(cache,key),known=new Set(cached||(size?sheet.getRange(2,1,size,1).getDisplayValues().flat():[])),added=[];
  if(!cached&&!expired)writeDashboardCache_(cache,key,[...known]);
  for(const record of records)if(!known.has(record[0])){known.add(record[0]);added.push(record);}
  // Keep the newest bounded recoverable corpus; expired/displaced records are counted explicitly.
  const overflow=Math.max(0,size+added.length-CANDIDATE_POLICY.maxRows),removed=Math.min(size,overflow),discarded=Math.max(0,overflow-size);
  if(removed)sheet.deleteRows(2,removed);
  append_('Candidatos',added.slice(discarded));
  p.setProperty('CANDIDATE_RETENTION_DAY',day);
  if(added.length||expired||removed){const revision=Utilities.getUuid();p.setProperty('CANDIDATES_REVISION',revision);const retained=removed?sheet.getRange(2,1,Math.max(0,sheet.getLastRow()-1),1).getDisplayValues().flat():[...known];writeDashboardCache_(cache,'candidate-ids:'+RADAR.version+':'+revision+':'+Math.max(0,sheet.getLastRow()-1),retained);}
  telemetry_('candidatos',0,'OK',JSON.stringify({recibidos:records.length,nuevos:added.length-discarded,duplicados:records.length-added.length,expirados:expired,limite:removed+discarded}));
}
function appendCoverage_(records){
  if(!records.length)return;
  let sheet=book_().getSheetByName('Cobertura');if(!sheet){sheet=book_().insertSheet('Cobertura');sheet.getRange(1,1,1,RADAR.sheets.Cobertura.length).setValues([RADAR.sheets.Cobertura]);}
  const overflow=Math.max(0,sheet.getLastRow()-1+records.length-20000);if(overflow)sheet.deleteRows(2,Math.min(overflow,sheet.getLastRow()-1));append_('Cobertura',records);
}

function reclassifyCandidates_(first,limit,maxMs){
 const sheet=candidateSheet_(),keys=RADAR.sheets.Candidatos,total=Math.max(0,sheet.getLastRow()-1),count=Math.min(limit,Math.max(0,total-first+2)),started=Date.now(),updates=[];let read=0;
 if(maxMs<=0)return {next:first,total,changed:0,done:first>total+1};
 const rows=count?sheet.getRange(first,1,count,keys.length).getDisplayValues():[];
 for(const values of rows){
  if(Date.now()-started>=maxMs||backgroundPaused_(true))break;
  const row=Object.fromEntries(keys.map((key,i)=>[key,values[i]])),provenance=JSON.parse(row.procedencia||'{}'),saved=savedNewsLabels_(row.clasificacion),title=searchText_(row.titular),text=searchText_(row.titular+' '+row.extracto),hash=sha256_(JSON.stringify([title,text])),country=newsCountry_({...row,medio:provenance.medio,sourceUrl:provenance.medioUrl}),entity=entityKey_(row.entidad);
  const current=saved.schema===1&&saved.version===CLASSIFICATION_WORK.rulesVersion&&saved.revision===newsClassificationRevision_()&&saved.contentHash===hash;
  if(!current||country!==row.pais||entity!==row.entidad){const labels=current?saved:classification_(title,text).labels,changed={...row,pais:country,entidad:entity,clasificacion:JSON.stringify(labels),estado:labels.estado};updates.push({row:first+read,values:keys.map(key=>String(changed[key]||''))});}
  read++;
 }
 writeVerifiedRows_(sheet,updates);if(updates.length)properties_().setProperty('CANDIDATES_REVISION',Utilities.getUuid());
 return {next:first+read,total,changed:updates.length,done:first+read>total+1};
}
