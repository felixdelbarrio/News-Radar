function parseFeed_(xml) {
  const channel=XmlService.parse(xml).getRootElement().getChild('channel');
  if(!channel)throw Error('Se requiere RSS 2.0 con channel/item.');
  const items=channel.getChildren('item'),language=feedLanguage(channel.getChildText('language'));
  if(items.length>settings_().maxItems)throw Error('Feed demasiado grande (máximo '+settings_().maxItems+' entradas).');
  return items.map(item=>({title:item.getChildText('title'),url:item.getChildText('link'),date:item.getChildText('pubDate'),excerpt:item.getChildText('description'),source:item.getChildText('source'),language}));
}
function newsRecord_(item,feed,now) {
  const record={id:Utilities.getUuid(),fecha:Utilities.formatDate(item.date,settings_().timezone,'yyyy-MM-dd'),pais:item.country||feed.country,medio:item.publisher||(feed.kind==='profile'?'':feed.name),entidad:item.entity||feed.entity,titular:item.title,extracto:item.excerpt,url:item.url,capturada:now.toISOString(),fuente:feed.name,idioma:item.language||feed.language||'',clasificacion:JSON.stringify(item.labels),taxonomia:JSON.stringify({fingerprint:taxonomyFingerprint_(item.title,item.excerpt),ids:taxonomyNewsIds_(item.title,item.excerpt)})};
  return RADAR.sheets.Noticias.map(key=>record[key]);
}
function ingestFeed_(feed,known,cycle,now,response) {
  if(response.getResponseCode()!==200)throw Error('HTTP '+response.getResponseCode());
  const xml=response.getContentText();if(xml.length>settings_().maxFeedBytes)throw Error('Feed excede el tamaño máximo permitido.');
  const items=parseFeed_(xml),news=[],audit=[],date=now.toISOString();let excluded=0,duplicated=0,inside=0,relevant=0,digital=0;const reasons={};
  known.titles=known.titles||new Map();
  for(const raw of items){
    const result=evaluate_(raw,feed,now),item=result.item;
    if(result.inRange)inside++;
    let state='Excluida',reason=result.reason;
    if(item){
      if(result.relevant)relevant++;
      if(known.has(item.url)){state='Duplicada';reason='URL ya recopilada';}
      else if(duplicateTitle_(known,item)){state='Duplicada';reason='Titular sindicado equivalente en fecha próxima';known.add(item.url);}
      else{known.add(item.url);rememberTitle_(known,item);state='Incluida';reason=feed.kind==='profile'?'Noticia integrada desde RSS de Google News':'Noticia integrada desde RSS del editor';news.push(newsRecord_(item,feed,now));if(item.labels.digital)digital++;}
    }
    if(state==='Excluida'){excluded++;reasons[reason]=(reasons[reason]||0)+1;}else if(state==='Duplicada')duplicated++;
    if(state==='Incluida'||(state==='Duplicada'?duplicated<=3:reasons[reason]<=3))audit.push([cycle,date,feed.name,item?.url||String(raw.url||''),state,reason]);
  }
  audit.push([cycle,date,feed.name,feed.url,'Fuente consultada',items.length+' evaluadas; '+news.length+' nuevas; '+excluded+' excluidas; '+duplicated+' duplicadas; '+relevant+' relevantes; '+inside+' dentro del período; motivos '+JSON.stringify(reasons)+((feed.kind==='profile'||feed.domain==='news.google.com')&&items.length>=COLLECTION_POLICY.providerLimit?'; posible límite del proveedor: cobertura parcial':'')]);
  return {news,audit,evaluated:items.length,relevant,digital,duplicated,excluded,saturated:(feed.kind==='profile'||feed.domain==='news.google.com')&&items.length>=COLLECTION_POLICY.providerLimit&&inside>=COLLECTION_POLICY.providerLimit*COLLECTION_POLICY.saturationRatio};
}
function knownUrls_() {
  const sheet=book_().getSheetByName('Noticias'),count=sheet.getLastRow()-1,known=new Set();known.titles=new Map();
  if(count>0)for(const row of translationIdentityRows_(sheet.getRange(2,2,count,7).getDisplayValues().map(row=>({fecha:row[0],medio:row[2],titular:row[4],extracto:row[5],url:row[6]})))){
    const url=canonicalUrl_(row.url);if(url)known.add(url);
    if(Number.isFinite(Date.parse(row.fecha)))for(const title of [row.titular,...(row.identityTitles||[])])rememberTitle_(known,{date:row.fecha,title,publisher:row.medio});
  }
  return known;
}

function fetchFeedBatch_(feeds){
  const results=feeds.map(()=>({}));let pending=feeds.map((feed,index)=>({feed,index,url:feed.url}));
  for(let hop=0;pending.length;hop++){
    let responses;const requests=pending.map(({url})=>({url,muteHttpExceptions:true,followRedirects:false,headers:{Accept:'application/rss+xml, application/xml','User-Agent':'NewsRadar/1.0'}}));
    try{responses=UrlFetchApp.fetchAll(requests);}
    catch(error){
      const pause=serviceQuotaPause_(error);if(pause){error.quota=true;error.retryable=true;properties_().setProperty('FETCH_PAUSED_UNTIL',String(Date.now()+pause));for(const item of pending)results[item.index]={error};break;}
      if(pending.length===1){error.retryable=true;results[pending[0].index]={error};break;}
      responses=requests.map((request,index)=>{try{return UrlFetchApp.fetchAll([request])[0];}catch(failure){failure.retryable=true;results[pending[index].index]={error:failure};return null;}});
    }
    const next=[];
    pending.forEach((item,index)=>{
      const response=responses[index];if(!response)return;const status=response.getResponseCode();
      if(![301,302,303,307,308].includes(status)){results[item.index]={response};return;}
      const headers=response.getAllHeaders(),location=Object.entries(headers).find(([key])=>key.toLowerCase()==='location')?.[1];
      const raw=String(Array.isArray(location)?location[0]:location||''),origin=item.url.match(/^https:\/\/[^/]+/)[0];
      const path=item.url.split('?')[0],url=canonicalUrl_(raw.startsWith('//')?'https:'+raw:raw.startsWith('/')?origin+raw:raw.startsWith('?')?path+raw:/^https?:/i.test(raw)?raw:raw&&!/^[a-z][a-z0-9+.-]*:/i.test(raw)?path.slice(0,path.lastIndexOf('/')+1)+raw:'');
      if(hop>=3||!url||!domainMatches_(url,item.feed.domain)){results[item.index]={error:Error('HTTP '+status+': redirección no permitida o demasiados saltos')};return;}
      next.push({...item,url});
    });
    pending=next;
  }
  return results;
}
