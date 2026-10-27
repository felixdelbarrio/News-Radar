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
function registerUnknownMedia_(news){
 if(!news.length)return 0;const name='CatalogoMedios',catalog=geographyCatalog_(name),known=new Set(catalog.map(row=>row.domain)),pending=[];
 for(const values of news){if(catalog.length+pending.length>=600)break;const row=Object.fromEntries(RADAR.sheets.Noticias.map((key,index)=>[key,values[index]])),domain=savedNewsLabels_(row.clasificacion).procedencia?.dominioMedio||'';
  if(!domain||known.has(domain)||domain==='news.google.com')continue;known.add(domain);
  const candidate={name:row.medio||domain,domain,country:'',iso2:'',status:'PENDIENTE',enabled:false,ruleType:'DOMINIO_OBSERVADO',editionCountry:'',editionPattern:'',historical:0,sourceUrl:'https://'+domain,notes:'Detectado automáticamente en source.url; sin verificación editorial.',source:'RSS',updated:new Date().toISOString().slice(0,10)};
  pending.push([geographyCatalogKey_(name,candidate),JSON.stringify(candidate)]);
 }
 if(pending.length){append_(name,pending);geographyCatalogMemory_.delete(name);}return pending.length;
}
function parseCatalogCsv_(value){
 const text=String(value||'').replace(/^\ufeff/,''),rows=[],row=[];let field='',quoted=false;
 for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(char===','&&!quoted){row.push(field);field='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(Boolean))rows.push(row.splice(0));}else field+=char;}
 if(quoted)throw Error('CSV con comillas incompletas.');row.push(field);if(row.some(Boolean))rows.push(row);
 const [header,...data]=rows;return data.map(values=>Object.fromEntries(header.map((key,index)=>[key,values[index]||''])));
}
function importGeographyCatalog(payload){
 authorize_(true);const name=payload?.category==='mediaCatalog'?'CatalogoMedios':payload?.category==='localeRules'?'ReglasIdiomaGeografia':'';
 if(!name)throw Error('Catálogo desconocido.');const records=parseCatalogCsv_(payload.csv),expected=name==='CatalogoMedios'?'dominio':'codigoIdioma';if(records.some(row=>!row[expected]))throw Error('CSV sin columna '+expected+'.');
 return withForegroundWrite_(()=>{
  const current=geographyCatalog_(name),keys=new Set(current.map(row=>geographyCatalogKey_(name,row))),seedIds=new Set(current.map(row=>row.seedId).filter(Boolean));let added=0;
  for(const row of records){const mapped=name==='CatalogoMedios'?{seedId:row.idSemilla||'',name:row.nombreRSS,domain:row.dominio.toLowerCase(),country:row.paisEditorialPropuesto,iso2:row.iso2Propuesto,status:row.estadoVerificacion,enabled:false,ruleType:row.tipoRegla,editionCountry:row.paisEdicion,editionPattern:row.patronEdicion,historical:Number(row.noticiasHistoricas)||0,sourceUrl:row.urlReferencia,notes:row.observaciones,source:'CSV importado',updated:new Date().toISOString().slice(0,10)}:{name:row.codigoIdioma.toLowerCase().replace('_','-'),destination:row.geografiaDestino==='EMAE'?'EMEA':row.geografiaDestino,type:row.tipoGeografia,method:row.metodo,notes:row.observaciones,enabled:true,precedence:row.codigoIdioma.includes('-')?100:50,confidence:'low',source:'CSV importado',updated:new Date().toISOString().slice(0,10)};
   const key=geographyCatalogKey_(name,mapped);if(keys.has(key)||mapped.seedId&&seedIds.has(mapped.seedId))continue;keys.add(key);if(mapped.seedId)seedIds.add(mapped.seedId);current.push(mapped);added++;
  }
  writeGeographyCatalog_(name,current);invalidateConfiguration_();requestNewsClassification_(true);return added+' entradas incorporadas; las ediciones existentes se han conservado.';
 });
}
