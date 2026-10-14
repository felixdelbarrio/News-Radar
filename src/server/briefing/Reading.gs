function firstNewsSubscription_(email){
  const revision=properties_().getProperty('SUBSCRIPTIONS_REVISION')||'0',key='first-subscription:'+RADAR.version+':'+sha256_(email+'|'+revision),cached=CacheService.getScriptCache().get(key);
  if(cached)return JSON.parse(cached);
  const row=rows_('Suscripciones').find(row=>row.correo===email&&String(row.activa)==='true'),selected=row?{periodicidad:row.periodicidad,filtros:subscriptionFilters_(JSON.parse(row.filtros))}:null;
  cacheJson_(key,selected,300);return selected;
}
function saveNewsletterEdition_(id,delivery,email,name,query,language,items,editorial=null){
  const sheet=book_().getSheetByName('NewsletterContenido'),start=sheet.getLastRow()+1,allNames=taxonomyTranslations_(),names={};
  for(const code of Object.keys(languageNames)){
    names[code]={};for(const item of items)for(const category of item.taxonomia){
      for(const label of [category.palanca,category.subpalanca])names[code][label]=allNames[code]?.[label]||translateText(label,code);
      names[code][taxonomyPath(category)]=names[code][category.palanca]+' › '+names[code][category.subpalanca];
    }
  }
  append_('NewsletterContenido',items.map(item=>[id,JSON.stringify(packNews_({...item,entidad:entityKey_(item.entidad)}))]));
  const row={id,envio:delivery,correo:email,nombre:name,filtros:JSON.stringify(query),idioma:language,fecha:new Date().toISOString(),inicio:start,cantidad:items.length,estado:'Enviando',traducciones:JSON.stringify(names),editorial:JSON.stringify(editorial)};
  append_('NewsletterEdiciones',[RADAR.sheets.NewsletterEdiciones.map(key=>row[key])]);
}
function completeNewsletterEdition_(id,state){
  const sheet=book_().getSheetByName('NewsletterEdiciones'),count=sheet.getLastRow()-1;if(!count)return;
  const ids=sheet.getRange(2,1,count,1).getDisplayValues(),position=ids.findIndex(([value])=>value===id);
  if(position<0)throw Error('Edición de newsletter no disponible.');
  sheet.getRange(position+2,10,1,1).setValues([[state]]);
}
function newsletterEditionMetadata_(id,email){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Edición de newsletter no disponible.');
  const sheet=book_().getSheetByName('NewsletterEdiciones'),count=sheet.getLastRow()-1,ids=count?sheet.getRange(2,1,count,1).getDisplayValues():[],position=ids.findIndex(([value])=>value===id);
  if(position<0)throw Error('Edición de newsletter no disponible.');
  const keys=RADAR.sheets.NewsletterEdiciones,values=sheet.getRange(position+2,1,1,keys.length).getDisplayValues()[0],row=Object.fromEntries(keys.map((key,index)=>[key,values[index]]));
  if(row.correo!==email||row.estado!=='Enviada')throw Error('Edición de newsletter no disponible.');
  return row;
}
function newsletterEdition_(id,email){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Edición de newsletter no disponible.');
  const key='edition:'+RADAR.version+':'+sha256_(id+'|'+email),cached=CacheService.getScriptCache().get(key);if(cached){const edition=JSON.parse(cached);edition.items=edition.items.map(unpackNews_);return edition;}
  const row=newsletterEditionMetadata_(id,email);
  const size=Number(row.cantidad),start=Number(row.inicio),items=size?book_().getSheetByName('NewsletterContenido').getRange(start,1,size,2).getDisplayValues().map(([edition,value])=>{if(edition!==id)throw Error('Edición de newsletter no disponible.');return unpackNews_(JSON.parse(value));}):[];
  const edition={id:row.id,title:row.nombre,query:Object.fromEntries(Object.entries(JSON.parse(row.filtros)).filter(([key])=>[...subscriptionFilterKeys,'from','to','view'].includes(key))),language:row.idioma,created:row.fecha,items,names:JSON.parse(row.traducciones),editorial:row.editorial?JSON.parse(row.editorial):null};
  cacheJson_(key,{...edition,items:items.map(packNews_)},21600);return edition;
}

function ensureNewsletterContinuation_(delay=settings_().pauseMinutes*60000){if(backgroundPaused_()){deferBackgroundWork_('newsletter');return;}requestNewsletterDelivery_(delay);}
