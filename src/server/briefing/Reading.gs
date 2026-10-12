function newsPreferences_(email,requested,first=false){
  const revision=properties_().getProperty('SUBSCRIPTIONS_REVISION')||'0',key='preferences:'+RADAR.version+':'+sha256_(email+'|'+revision),cached=CacheService.getScriptCache().get(key);
  const rows=cached?JSON.parse(cached):subscriptionRows_(email).filter(row=>row.activa);
  if(!cached)cacheJson_(key,rows,300);
  let choice=requested|| (first?(rows[0]?.id||'default'):'');
  if(!choice){
    const profileKey='news-preference:'+sha256_(email),profileCache=CacheService.getScriptCache().get(profileKey);
    choice=profileCache?JSON.parse(profileCache):rows_('Preferencias').find(row=>row.correo===email)?.suscripcion||'';
    if(!profileCache)cacheJson_(profileKey,choice,300);
  }
  const selected=choice==='default'?null:(rows.find(row=>row.id===choice)||null);
  if(requested&&requested!=='default'&&!selected)throw Error('Selección personal no disponible.');
  return {selected,options:rows.map(row=>({id:row.id,name:row.nombre})),active:selected?.id||'default'};
}
function saveNewsletterEdition_(id,delivery,email,name,query,language,items){
  const sheet=book_().getSheetByName('NewsletterContenido'),start=sheet.getLastRow()+1,allNames=taxonomyTranslations_(),names={};
  for(const code of Object.keys(languageNames)){
    names[code]={};for(const item of items)for(const category of item.taxonomia){
      for(const label of [category.palanca,category.subpalanca])names[code][label]=allNames[code]?.[label]||translateText(label,code);
      names[code][taxonomyPath(category)]=names[code][category.palanca]+' › '+names[code][category.subpalanca];
    }
  }
  append_('NewsletterContenido',items.map(item=>[id,JSON.stringify(packNews_(item))]));
  const row={id,envio:delivery,correo:email,nombre:name,filtros:JSON.stringify(query),idioma:language,fecha:new Date().toISOString(),inicio:start,cantidad:items.length,estado:'Enviando',traducciones:JSON.stringify(names)};
  append_('NewsletterEdiciones',[RADAR.sheets.NewsletterEdiciones.map(key=>row[key])]);
}
function completeNewsletterEdition_(id,state){
  const sheet=book_().getSheetByName('NewsletterEdiciones'),count=sheet.getLastRow()-1;if(!count)return;
  const ids=sheet.getRange(2,1,count,1).getDisplayValues(),position=ids.findIndex(([value])=>value===id);
  if(position<0)throw Error('Edición de newsletter no disponible.');
  sheet.getRange(position+2,10,1,1).setValues([[state]]);
}
function newsletterEdition_(id,email){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Edición de newsletter no disponible.');
  const key='edition:'+sha256_(id+'|'+email),cached=CacheService.getScriptCache().get(key);if(cached){const edition=JSON.parse(cached);edition.items=edition.items.map(unpackNews_);return edition;}
  const sheet=book_().getSheetByName('NewsletterEdiciones'),count=sheet.getLastRow()-1,ids=count?sheet.getRange(2,1,count,1).getDisplayValues():[],position=ids.findIndex(([value])=>value===id);
  if(position<0)throw Error('Edición de newsletter no disponible.');
  const keys=RADAR.sheets.NewsletterEdiciones,values=sheet.getRange(position+2,1,1,keys.length).getDisplayValues()[0],row=Object.fromEntries(keys.map((key,index)=>[key,values[index]]));
  if(row.correo!==email||row.estado!=='Enviada')throw Error('Edición de newsletter no disponible.');
  const size=Number(row.cantidad),start=Number(row.inicio),items=size?book_().getSheetByName('NewsletterContenido').getRange(start,1,size,2).getDisplayValues().map(([edition,value])=>{if(edition!==id)throw Error('Edición de newsletter no disponible.');return unpackNews_(JSON.parse(value));}):[];
  const edition={id:row.id,title:row.nombre,query:JSON.parse(row.filtros),language:row.idioma,created:row.fecha,items,names:JSON.parse(row.traducciones)};
  cacheJson_(key,{...edition,items:items.map(packNews_)},21600);return edition;
}

function saveNewsPreference(query){
  const session=authorize_(),id=String(query.preference||'');if(!id)throw Error('Selección personal no disponible.');newsPreferences_(session.email,id);
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sheet=book_().getSheetByName('Preferencias'),rows=rows_('Preferencias'),index=rows.findIndex(row=>row.correo===session.email),value=[session.email,id,new Date().toISOString()];
    if(index<0)append_('Preferencias',[value]);else sheet.getRange(index+2,1,1,3).setValues([value]);
    cacheJson_('news-preference:'+sha256_(session.email),id,300);
  }finally{lock.releaseLock();}
  return getDashboard({...query,initial:true});
}
function newsletterCollectionPriority_(){return collectionRequests_().some(request=>request.kind==='daily')||collectionJobs_().some(job=>job.tipo==='daily'&&Number(job.pendientes)>0&&Number(job.pausa||0)<=Date.now());}
function ensureNewsletterContinuation_(){if(!scheduledTriggers_('newsletterTick_').length)ScriptApp.newTrigger('newsletterTick_').timeBased().after(settings_().pauseMinutes*60000).create();}
