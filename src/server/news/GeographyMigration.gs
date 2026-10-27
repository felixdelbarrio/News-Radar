function auditGeographyMigration(options={}){
 authorize_(true);const sheet=newsSheet_(),keys=RADAR.sheets.Noticias,total=Math.max(0,sheet.getLastRow()-1),offset=Math.max(0,Math.floor(Number(options.offset)||0)),limit=Math.min(200,Math.max(1,Math.floor(Number(options.limit)||100))),count=Math.min(limit,total-offset),byMethod={},samples=[];let changed=0,multicountry=0,missing=0;
 if(count>0)for(const values of sheet.getRange(offset+2,1,count,keys.length).getDisplayValues()){
  const row=Object.fromEntries(keys.map((key,index)=>[key,values[index]])),decision=newsCountryDecision_(row);byMethod[decision.reason]=(byMethod[decision.reason]||0)+1;if(decision.country!==row.pais)changed++;if(decision.geographies.length>1)multicountry++;if(!decision.country)missing++;
  if(samples.length<12&&(decision.country!==row.pais||decision.geographies.length>1||decision.reason==='apac_fallback'))samples.push({id:row.id,title:row.titular,previous:row.pais,next:decision.country,geographies:decision.geographies,method:decision.reason});
 }
 return {dryRun:true,offset,count,total,next:offset+count,changed,multicountry,missing,byMethod,samples};
}
function applyGeographyMigration(){
 authorize_(true);return withForegroundWrite_(()=>{
  const previous=JSON.parse(properties_().getProperty('GEOGRAPHY_MIGRATION')||'null');if(previous?.version===RADAR.version)return previous;
  const source=book_(),backup=source.copy('News Radar · Geografías '+RADAR.version+' · '+new Date().toISOString()),newsName=newsStorageKey_();
  for(const name of ['Configuracion',newsName]){const active=source.getSheetByName(name),copy=backup.getSheetByName(name),height=active.getLastRow(),width=active.getLastColumn();if(!copy||copy.getLastRow()!==height||copy.getLastColumn()!==width||sha256_(JSON.stringify(active.getRange(1,1,height,width).getDisplayValues()))!==sha256_(JSON.stringify(copy.getRange(1,1,height,width).getDisplayValues())))throw Error('Backup no verificado: '+name);}
  const state={version:RADAR.version,backupId:backup.getId(),backupUrl:backup.getUrl(),rows:Math.max(0,source.getSheetByName(newsName).getLastRow()-1),created:new Date().toISOString()};properties_().setProperty('GEOGRAPHY_MIGRATION',JSON.stringify(state));return state;
 });
}
function getGeographyMigrationStatus(){authorize_(true);const state=JSON.parse(properties_().getProperty('GEOGRAPHY_MIGRATION')||'null'),job=classificationJob_();return {...state,classification:job?{state:job.state,processed:classificationProcessed_(job),total:job.total,error:job.error||''}:null};}
function reportGeographyMigration(){
 const status=getGeographyMigrationStatus(),result={total:0,changed:0,multicountry:0,missing:0,byMethod:{},samples:[]};let offset=0;
 do{const batch=auditGeographyMigration({offset,limit:200});result.total=batch.total;for(const key of ['changed','multicountry','missing'])result[key]+=batch[key];for(const [method,count] of Object.entries(batch.byMethod))result.byMethod[method]=(result.byMethod[method]||0)+count;result.samples.push(...batch.samples);offset=batch.next;}while(offset<result.total);
 console.log(JSON.stringify({status,...result}));return result;
}
function continueGeographyMigration(){
 authorize_(true);const status=getGeographyMigrationStatus();if(status.version!==RADAR.version||!status.backupId)throw Error('Primero crea una copia verificada con applyGeographyMigration.');
 const result=processBackground_();console.log(JSON.stringify(getGeographyMigrationStatus()));return result;
}
