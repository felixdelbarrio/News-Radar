let newsletterKeyMemory_;
function newsletterItemKeys_(row){
  if(!newsletterKeyMemory_)newsletterKeyMemory_=new WeakMap();if(newsletterKeyMemory_.has(row))return newsletterKeyMemory_.get(row);
  const url=canonicalUrl_(row.url),keys=[...(url?['url:'+sha256_(url)]:[]),'text:'+sha256_(recordText(row.titular)+'\n'+recordText(row.extracto))];
  newsletterKeyMemory_.set(row,keys);return keys;
}
function newsletterSentContent_(deliveries){
  const recipients=new Map();
  for(const delivery of deliveries){
    if(!delivery.suscripcion||!['Enviada','Enviando','Revisar'].includes(delivery.estado))continue;
    const email=newsletterEmail_(delivery.correo),keys=JSON.parse(delivery.contenido||'[]');
    if(!Array.isArray(keys)||keys.some(key=>!/^(url|text):[a-f0-9]{64}$/.test(key)))throw Error('Registro de contenido no válido. Revisa el envío '+delivery.id+' antes de continuar.');
    if(!recipients.has(email))recipients.set(email,new Set());for(const key of keys)recipients.get(email).add(key);
  }
  return recipients;
}
function newsletterWasSent_(row,known){return known.size>0&&newsletterItemKeys_(row).some(key=>known.has(key));}
function newsletterUnseen_(rows,known){
  const seen=new Set();
  return rows.filter(row=>{const keys=newsletterItemKeys_(row);if(keys.some(key=>known.has(key)||seen.has(key)))return false;for(const key of keys)seen.add(key);return true;});
}

function newsletterContentDetail_(content){return content.count+' noticias incluidas'+(content.omitted?'; '+content.omitted+' noticias repetidas omitidas':'')+(content.editorial?.reusedCount?'; '+content.editorial.reusedCount+' ejemplos reutilizados en su tema':'');}
