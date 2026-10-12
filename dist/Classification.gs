function newsLabels_(topic,assessment,title){
  const generalista=Boolean(topic||assessment.capabilities.length||assessment.excluded);
  const digital=Boolean(assessment.capabilities.length&&assessment.channel&&assessment.score>0&&!assessment.excluded&&!assessment.editorial&&(assessment.change||assessment.capabilities.some(row=>row.terms.some(term=>phraseMatch_(title,term)))));
  return {generalista,digital,capacidades:[...new Set(assessment.capabilities.map(row=>row.segment+': '+row.name))]};
}
function savedNewsLabels_(value){
  if(!value)return {generalista:false,digital:false,capacidades:[]};
  try{const labels=JSON.parse(value);return {generalista:labels.generalista===true,digital:labels.digital===true,capacidades:Array.isArray(labels.capacidades)?labels.capacidades:[]};}
  catch(_){return {generalista:false,digital:false,capacidades:[]};}
}
function classificationRulesRevision_(){const config=configuration_();return sha256_(JSON.stringify([RADAR.version,config.capabilities,config.topics]));}
function requestNewsClassification_(force=false){
  const p=properties_();if(!force&&(p.getProperty('CLASSIFICATION_JOB')||p.getProperty('CLASSIFICATION_VERSION')===RADAR.version))return;
  p.setProperty('CLASSIFICATION_JOB',JSON.stringify({next:2,revision:classificationRulesRevision_()}));ensureBackgroundWorker_();
}
function newsClassificationBatch_(){
  const p=properties_(),raw=p.getProperty('CLASSIFICATION_JOB');if(!raw)return;
  const started=Date.now(),job=JSON.parse(raw),sheet=book_().getSheetByName('Noticias'),keys=RADAR.sheets.Noticias,column=keys.indexOf('clasificacion'),revision=classificationRulesRevision_();
  if(job.revision!==revision){job.next=2;job.revision=revision;}
  const count=Math.min(CLASSIFICATION_WORK.batchRows,Math.max(0,sheet.getLastRow()-job.next+1));let classified=0,digital=0;
  if(count){
    const rows=sheet.getRange(job.next,1,count,keys.length).getDisplayValues(),values=[];
    for(const row of rows){
      const title=searchText_(row[5]),text=searchText_(row[5]+' '+row[6]),labels=classification_(title,text).labels,value=JSON.stringify(labels);
      values.push([value]);if(row[column]!==value)classified++;if(labels.digital)digital++;
      if(Date.now()-started>=CLASSIFICATION_WORK.maxMs)break;
    }
    if(classified){sheet.getRange(job.next,column+1,values.length,1).setNumberFormat('@').setValues(values);SpreadsheetApp.flush();invalidateNews_();}
    job.next+=values.length;
  }
  if(job.next>sheet.getLastRow()){p.deleteProperty('CLASSIFICATION_JOB');p.setProperty('CLASSIFICATION_VERSION',RADAR.version);}
  else p.setProperty('CLASSIFICATION_JOB',JSON.stringify(job));
  telemetry_('clasificacion',Date.now()-started,'OK',count+' leídas; '+classified+' clasificadas; '+digital+' digitales; siguiente fila '+job.next);
}
