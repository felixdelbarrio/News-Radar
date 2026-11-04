const GEOGRAPHY_CATALOG_SEEDS=Object.freeze({CatalogoMedios:typeof MEDIA_CATALOG_SEED==='undefined'?[]:MEDIA_CATALOG_SEED,ReglasIdiomaGeografia:typeof LOCALE_GEOGRAPHY_SEED==='undefined'?[]:LOCALE_GEOGRAPHY_SEED});
function mediaCatalogKey_(row){return String(row.domain||'').toLowerCase()+'|'+(row.seedId||row.editionPattern||'');}
function geographyCatalogKey_(name,row){return name==='CatalogoMedios'?mediaCatalogKey_(row):String(row.name||'').toLowerCase();}
const geographyCatalogMemory_=new Map();
function geographyCatalog_(name){
 const revision=typeof PropertiesService==='undefined'?'0':properties_().getProperty('CONFIG_REVISION')||'0',cached=geographyCatalogMemory_.get(name);if(cached?.revision===revision)return cached.rows;
 const sheet=typeof SpreadsheetApp!=='undefined'&&typeof SpreadsheetApp.openById==='function'?book_().getSheetByName(name):null,count=sheet?.getLastRow()-1||0,rows=!sheet?GEOGRAPHY_CATALOG_SEEDS[name].map(row=>({...row})):count?sheet.getRange(2,2,count,1).getValues().flat().filter(Boolean).map(value=>JSON.parse(value)):[];
 geographyCatalogMemory_.set(name,{revision,rows});return rows;
}
function validateGeographyCatalog_(name,rows){
 if(!Array.isArray(rows)||rows.length>600)throw Error('Catálogo geográfico demasiado grande.');
 const keys=new Set();for(const row of rows){
  const key=geographyCatalogKey_(name,row);if(!key||keys.has(key)||typeof row.enabled!=='boolean'||!row.name)throw Error('Entrada de catálogo duplicada o incompleta: '+key);
  if(name==='CatalogoMedios'&&(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(row.domain)||!['PENDIENTE','VERIFICADO','RECHAZADO'].includes(row.status)||row.enabled&&row.status!=='VERIFICADO'))throw Error('Medio: dominio o verificación no válidos: '+row.name);
  if(name==='ReglasIdiomaGeografia'&&(!/^[a-z]{2}(?:-[A-Za-z0-9]{2,8})?$/.test(row.name)||!['PAIS','REGION'].includes(row.type)||!Number.isFinite(Number(row.precedence))||!['low','medium','high'].includes(row.confidence)))throw Error('Regla de idioma no válida: '+row.name);
  keys.add(key);
 }
}
function writeGeographyCatalog_(name,rows){
 validateGeographyCatalog_(name,rows);const sheet=book_().getSheetByName(name),count=sheet.getLastRow()-1;
 if(count)sheet.getRange(2,1,count,2).clearContent();
 if(rows.length)sheet.getRange(2,1,rows.length,2).setNumberFormat('@').setValues(rows.map(row=>[geographyCatalogKey_(name,row),JSON.stringify(row)]));
 geographyCatalogMemory_.delete(name);
}
function initializeGeographyCatalogs_(){for(const [name,seed] of Object.entries(GEOGRAPHY_CATALOG_SEEDS))if(book_().getSheetByName(name).getLastRow()<2)writeGeographyCatalog_(name,seed);}
function verifiedEditorialCatalogUpgrade_(dryRun=true){
 authorize_(true);
 const operation=()=>{
 const name='CatalogoMedios',current=geographyCatalog_(name).map(row=>({...row})),byKey=new Map(current.map((row,index)=>[mediaCatalogKey_(row),index])),changes=[];
 for(const seed of GEOGRAPHY_CATALOG_SEEDS[name].filter(row=>row.seedId?.startsWith('v7_')||['seed_981653c20afac89d','seed_b417a7b9c3da37ba','seed_73f57709fc0a7aec','seed_30ed4dada5f27a4d'].includes(row.seedId))){
  const key=mediaCatalogKey_(seed),index=byKey.get(key);
  if(index===undefined){
   if(!seed.editionPattern&&current.some(row=>row.domain===seed.domain&&row.ruleType===seed.ruleType&&row.status==='VERIFICADO'&&row.enabled===true&&!(row.editionPattern||'')))continue;
   const observed=current.findIndex(row=>row.domain===seed.domain&&row.ruleType==='DOMINIO_OBSERVADO'&&row.status==='PENDIENTE'&&row.enabled===false);
   if(observed>=0&&!seed.editionPattern){const before=current[observed],after={...before,...seed,seedId:before.seedId||'',source:'Iteración 43 · edición verificada'};changes.push({type:'verify',key:mediaCatalogKey_(before),before,after});current[observed]=after;}
   else {changes.push({type:'add',key,after:seed});byKey.set(key,current.length);current.push({...seed});}
  }else{
   const before=current[index];
   if(before.ruleType==='DOMINIO_GENERICO'&&before.source==='Iteración 29'&&before.status==='VERIFICADO'&&before.enabled===true){
    const after={...before,ruleType:seed.ruleType,editionCountry:seed.editionCountry,editionPattern:seed.editionPattern,source:'Iteración 43 · edición verificada'};
    changes.push({type:'correct',key,before,after});current[index]=after;
   }
  }
 }
 validateGeographyCatalog_(name,current);
 if(!dryRun&&changes.length){writeGeographyCatalog_(name,current);invalidateConfiguration_();}
 return {dryRun,changes:changes.map(({type,key,before,after})=>({type,key,before:before?{ruleType:before.ruleType,status:before.status,enabled:before.enabled}:null,after:{ruleType:after.ruleType,status:after.status,enabled:after.enabled}})),count:changes.length};
 };
 return dryRun?operation():withForegroundWrite_(operation);
}
function registerUnknownMedia_(news){
 if(!news.length)return 0;const name='CatalogoMedios',catalog=geographyCatalog_(name),known=new Set(catalog.map(row=>row.domain)),pending=[];
 for(const values of news){if(catalog.length+pending.length>=600)break;const row=Object.fromEntries(RADAR.sheets.Noticias.map((key,index)=>[key,values[index]])),domain=savedNewsLabels_(row.clasificacion).procedencia?.dominioMedio||'';
  if(!domain||known.has(domain)||domain==='news.google.com')continue;known.add(domain);
  const candidate={name:row.medio||domain,domain,country:'',iso2:'',status:'PENDIENTE',enabled:false,ruleType:'DOMINIO_OBSERVADO',editionCountry:'',editionPattern:'',historical:0,sourceUrl:'https://'+domain,notes:'Detectado automáticamente en source.url; sin verificación editorial.',source:'RSS',updated:new Date().toISOString().slice(0,10)};
  pending.push([geographyCatalogKey_(name,candidate),JSON.stringify(candidate)]);
 }
 if(pending.length){append_(name,pending);geographyCatalogMemory_.delete(name);}return pending.length;
}
