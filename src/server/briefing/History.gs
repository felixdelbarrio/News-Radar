let newsletterKeyMemory_;
function newsletterItemKeys_(row){
  if(!newsletterKeyMemory_)newsletterKeyMemory_=new WeakMap();if(newsletterKeyMemory_.has(row))return newsletterKeyMemory_.get(row);
  const keys=['url:'+newsletterHash_(canonicalUrl_(row.url)),'text:'+newsletterHash_(recordText(row.titular)+'\n'+recordText(row.extracto))];
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
function newsletterUnseen_(rows,known){
  const seen=new Set();
  return rows.filter(row=>{const keys=newsletterItemKeys_(row);if(keys.some(key=>known.has(key)||seen.has(key)))return false;for(const key of keys)seen.add(key);return true;});
}

function newsletterHash_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(byte=>(byte&255).toString(16).padStart(2,'0')).join('');}
function newsletterContentDetail_(content){return content.count+' noticias incluidas'+(content.omitted?'; '+content.omitted+' noticias repetidas omitidas':'');}
