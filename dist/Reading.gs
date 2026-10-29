const NEWSLETTER_STORAGE=Object.freeze({cellChars:50000});
function newsletterEditorialSnapshot_(editorial){
 if(!editorial)return null;
 const {corpusIds,geographies,scope,audit,...snapshot}=editorial,reasons=new Map();
 for(const row of audit?.exclusions||[])reasons.set(row.reason,(reasons.get(row.reason)||0)+(row.count||1));
 return {...snapshot,...(geographies?{geographies:geographies.map(({name,code,region,mapId,searchName,enabled,language})=>({name,code,region,mapId,searchName,enabled,language}))}:{}),...(scope?{scope:scope.map(({name,countries})=>({name,countries}))}:{}),...(audit?{audit:{...audit,exclusions:[...reasons].map(([reason,count])=>({reason,count}))}}:{})};
}
function validateNewsletterCells_(rows){
 for(const row of rows)for(const value of row)if(String(value??'').length>NEWSLETTER_STORAGE.cellChars)throw Error('La edición supera el límite de almacenamiento. No se ha guardado ni enviado.');
}
function saveNewsletterEdition_(id,delivery,email,name,query,language,items,editorial=null){
  const sheet=newsletterSheet_('NewsletterContenido'),start=sheet.getLastRow()+1,allNames=taxonomyTranslations_(),names={};
  for(const code of Object.keys(languageNames)){
    names[code]={};for(const item of items)for(const category of item.taxonomia){
      for(const label of [category.palanca,category.subpalanca].filter(Boolean))names[code][label]=allNames[code]?.[label]||translateText(label,code);
      if(category.subpalanca)names[code][taxonomyPath(category)]=names[code][category.palanca]+' › '+names[code][category.subpalanca];
    }
  }
  const content=items.map(item=>{const saved={...item,entidad:entityKey_(item.entidad)};newsRelevanceMemory_.set(saved,newsRelevance_(item));return [id,JSON.stringify(packNews_(saved))];});
  const row={id,envio:delivery,correo:email,nombre:name,filtros:JSON.stringify(query),idioma:language,fecha:new Date().toISOString(),inicio:start,cantidad:items.length,estado:'Enviando',traducciones:JSON.stringify(names),editorial:JSON.stringify(newsletterEditorialSnapshot_(editorial))};
  validateNewsletterCells_([RADAR.sheets.NewsletterEdiciones.map(key=>row[key]),...content]);
  append_('NewsletterContenido',content);
  append_('NewsletterEdiciones',[RADAR.sheets.NewsletterEdiciones.map(key=>row[key])]);
}
function completeNewsletterEdition_(id,state){
  const sheet=newsletterSheet_('NewsletterEdiciones'),count=sheet.getLastRow()-1;if(!count)return;
  const ids=sheet.getRange(2,1,count,1).getDisplayValues(),position=ids.findIndex(([value])=>value===id);
  if(position<0)throw Error('Edición de newsletter no disponible.');
  markNewsletterArchiveEdited_();sheet.getRange(position+2,10,1,1).setValues([[state]]);
}
function newsletterEditionMetadata_(id,email,admin=false){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Edición de newsletter no disponible.');
  const sheet=newsletterSheet_('NewsletterEdiciones'),count=sheet.getLastRow()-1,ids=count?sheet.getRange(2,1,count,1).getDisplayValues():[],position=ids.findIndex(([value])=>value===id);
  if(position<0)throw Error('Edición de newsletter no disponible.');
  const keys=RADAR.sheets.NewsletterEdiciones,values=sheet.getRange(position+2,1,1,keys.length).getDisplayValues()[0],row=Object.fromEntries(keys.map((key,index)=>[key,values[index]]));
  if(row.correo!==email&&!admin||row.estado!=='Enviada')throw Error('Edición de newsletter no disponible.');
  return archivedNewsletter_(row);
}
function newsletterEdition_(id,email,admin=false){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Edición de newsletter no disponible.');
  const key='edition:'+RADAR.version+':'+sha256_(id+'|'+email+'|'+admin+'|'+newsletterArchiveKey_()),cached=CacheService.getScriptCache().get(key);if(cached){const edition=JSON.parse(cached);edition.items=edition.items.map(unpackNews_);return edition;}
  const row=newsletterEditionMetadata_(id,email,admin);
  const size=Number(row.cantidad),start=Number(row.inicio),items=row.archivedItems?row.archivedItems.map(([edition,value])=>{if(edition!==id)throw Error('Edición de newsletter no disponible.');return unpackNews_(JSON.parse(value));}):size?newsletterSheet_('NewsletterContenido').getRange(start,1,size,2).getDisplayValues().map(([edition,value])=>{if(edition!==id)throw Error('Edición de newsletter no disponible.');return unpackNews_(JSON.parse(value));}):[];
  const edition={id:row.id,title:row.nombre,query:Object.fromEntries(Object.entries(JSON.parse(row.filtros)).filter(([key])=>[...subscriptionFilterKeys,'from','to','view'].includes(key))),language:row.idioma,created:row.fecha,items,names:JSON.parse(row.traducciones),editorial:row.editorial?JSON.parse(row.editorial):null};
  cacheJson_(key,{...edition,items:items.map(packNews_)},21600);return edition;
}

function ensureNewsletterContinuation_(delay=settings_().pauseMinutes*60000){if(backgroundPaused_()){deferBackgroundWork_('newsletter');return;}requestNewsletterDelivery_(delay);}
function getNewsletterSummary(id){
  const session=authorize_(),row=newsletterEditionMetadata_(id,session.email,session.admin),editorial=JSON.parse(row.editorial||'null'),query=JSON.parse(row.filtros);
  const topics=(editorial?.cards||[]).map(card=>card.title).filter(Boolean),base=newsletterLinks_('',id,'news',query).app,t=taxonomyLanguage_(row.idioma),cards=(editorial?.cards||[]).map(card=>({title:card.title,entity:card.entity,category:taxonomyDisplayLabel(t(card.category)),scope:card.scope==='local'?query.country:'Mirada internacional',url:base?newsletterExploreLink_(base,'news',card.scope==='local'?query.country:'','',card.category,'',query.country&&card.scope==='global'?'international':''):'',source:card.url}));
  if(!topics.length&&Number(row.cantidad)){const size=Math.min(3,Number(row.cantidad));for(const [edition,value] of (row.archivedItems?row.archivedItems.slice(0,size):newsletterSheet_('NewsletterContenido').getRange(Number(row.inicio),1,size,2).getDisplayValues())){if(edition!==id)throw Error('Edición de newsletter no disponible.');topics.push(unpackNews_(JSON.parse(value)).titular);}}
  return {from:query.from,to:query.to,country:query.country||'',language:row.idioma,cadence:editorial?.cadence||(query.view==='briefing'?'fortnightly':'quarterly'),count:Number(row.cantidad),landscapes:Object.fromEntries(Object.entries(editorial?.landscapes||{}).filter(([,scope])=>scope).map(([key,scope])=>[key,{total:scope.total,entityCount:scope.entityCount,themes:scope.themes.map(theme=>({name:taxonomyDisplayLabel(t(theme.name)),count:theme.count}))}])),topics,cards};
}
function getMyNewsletterHistory(query={}){
  const email=authorize_().email;return newsletterHistoryRecords_(query,email);
}
function newsletterHistoryRecords_(query={},email=null){
  const available=rows_('NewsletterEnvios',settings_().eventLimit,8),rows=recentNewsletterDeliveries_(available.filter(row=>!email||row.correo===email&&row.estado==='Enviada')),selected=filterRecords(rows,query,['correo','estado','suscripcion'],['correo','suscripcion','detalle','id'],'fecha',settings_().timezone),editions=new Map(rows_('NewsletterEdiciones',undefined,10).filter(row=>row.estado==='Enviada'&&(!email||row.correo===email)).map(row=>[row.envio,row.id]));
  const page=email?{items:selected.reverse().slice(0,Math.min(300,Math.max(3,Number(query.limit)||3))),total:selected.length,page:0,pageSize:Math.min(300,Math.max(3,Number(query.limit)||3))}:recordPage(selected.reverse(),query,ADMIN_PAGE_SIZE);return {...page,items:page.items.map(row=>({...row,edition:editions.get(row.id)||'',noticias:Number(row.detalle.match(/(?:^|; )(\d+) noticias incluidas/)?.[1]||0)})),options:recordOptions(rows,['correo','estado','suscripcion']),limited:available.length===settings_().eventLimit,limit:settings_().eventLimit};
}
