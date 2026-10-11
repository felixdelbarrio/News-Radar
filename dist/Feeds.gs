function parseFeed_(xml) {
  const channel=XmlService.parse(xml).getRootElement().getChild('channel');
  if(!channel)throw Error('Se requiere RSS 2.0 con channel/item.');
  const items=channel.getChildren('item'),language=feedLanguage(channel.getChildText('language'));
  if(items.length>settings_().maxItems)throw Error('Feed demasiado grande (máximo '+settings_().maxItems+' entradas).');
  return items.map(item=>({title:item.getChildText('title'),url:item.getChildText('link'),date:item.getChildText('pubDate'),excerpt:item.getChildText('description'),source:item.getChildText('source'),language}));
}
function newsRecord_(item,feed,now) {
  const record={id:Utilities.getUuid(),fecha:Utilities.formatDate(item.date,settings_().timezone,'yyyy-MM-dd'),pais:feed.country,medio:item.publisher||(feed.kind==='profile'?'':feed.name),entidad:feed.entity,titular:item.title,extracto:item.excerpt,tema:item.topic,url:item.url,capturada:now.toISOString(),fuente:feed.name,idioma:item.language||feed.language||''};
  return RADAR.sheets.Noticias.map(key=>record[key]);
}
function ingestFeed_(feed,known,cycle,now,response) {
  if(response.getResponseCode()!==200)throw Error('HTTP '+response.getResponseCode());
  const xml=response.getContentText();if(xml.length>settings_().maxFeedBytes)throw Error('Feed excede el tamaño máximo permitido.');
  const items=parseFeed_(xml),news=[],audit=[],date=now.toISOString();let excluded=0,duplicated=0;const reasons={};
  for(const raw of items){
    const result=evaluate_(raw,feed,now),item=result.item;
    let state='Excluida',reason=result.reason;
    if(item){
      if(known.has(item.url)){state='Duplicada';reason='URL ya recopilada';}
      else{known.add(item.url);state='Incluida';reason=feed.kind==='profile'?'Noticia integrada desde RSS de Google News':'Noticia integrada desde RSS del editor';news.push(newsRecord_(item,feed,now));}
    }
    if(state==='Excluida'){excluded++;reasons[reason]=(reasons[reason]||0)+1;}else if(state==='Duplicada')duplicated++;
    if(state!=='Excluida'||reasons[reason]<=3)audit.push([cycle,date,feed.name,item?.url||String(raw.url||''),state,reason]);
  }
  audit.push([cycle,date,feed.name,feed.url,'Fuente consultada',items.length+' evaluadas; '+news.length+' nuevas; '+excluded+' excluidas; '+duplicated+' duplicadas; motivos '+JSON.stringify(reasons)+(feed.kind==='profile'&&items.length>=100?'; posible límite del proveedor: cobertura parcial':'')]);
  return {news,audit,evaluated:items.length,saturated:feed.kind==='profile'&&items.length>=100};
}
function knownUrls_() {
  const sheet=book_().getSheetByName('Noticias'),count=sheet.getLastRow()-1;
  return new Set(count>0?sheet.getRange(sheet.getLastRow()-count+1,9,count,1).getDisplayValues().flat():[]);
}

function fetchFeedBatch_(feeds){
  const results=feeds.map(()=>({}));let pending=feeds.map((feed,index)=>({feed,index,url:feed.url}));
  for(let hop=0;pending.length;hop++){
    let responses;
    try{responses=UrlFetchApp.fetchAll(pending.map(({url})=>({url,muteHttpExceptions:true,followRedirects:false,headers:{Accept:'application/rss+xml, application/xml'}})));}
    catch(error){error.retryable=true;for(const item of pending)results[item.index]={error};break;}
    const next=[];
    pending.forEach((item,index)=>{
      const response=responses[index],status=response.getResponseCode();
      if(![301,302,303,307,308].includes(status)){results[item.index]={response};return;}
      const headers=response.getAllHeaders(),location=Object.entries(headers).find(([key])=>key.toLowerCase()==='location')?.[1];
      const raw=String(Array.isArray(location)?location[0]:location||''),origin=item.url.match(/^https:\/\/[^/]+/)[0];
      const url=canonicalUrl_(raw.startsWith('/')?origin+raw:raw);
      if(hop>=3||!url||!domainMatches_(url,item.feed.domain)){results[item.index]={error:Error('HTTP '+status+': redirección no permitida o demasiados saltos')};return;}
      next.push({...item,url});
    });
    pending=next;
  }
  return results;
}
