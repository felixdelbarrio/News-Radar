function newsletterEmail_(value){
  const email=String(value||'').trim().toLowerCase();
  if(!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@bbva\.com$/.test(email))throw Error('El correo de newsletter debe pertenecer al dominio bbva.com.');
  return email;
}
function gmailRequest_(path,payload){
  const response=UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{method:payload?'post':'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{}),muteHttpExceptions:true});
  const status=response.getResponseCode();
  let result;try{result=JSON.parse(response.getContentText());}catch(_){result={};}
  if(status<200||status>=300){
    const detail=plainText_(result.error?.message||'').slice(0,300),help=status===404?'Añade y verifica el grupo en Gmail → Cuentas → Enviar como.':status===401||status===403?'Revisa los permisos del propietario y que Gmail API esté habilitada en el proyecto de Google Cloud.':status===429?'Límite de envío alcanzado; revisa las cuotas de Google.':'Revisa el registro antes de reintentar.';
    const error=Error('Gmail API ('+status+'). '+detail+' '+help);error.rejected=status>=400&&status<500&&status!==408;throw error;
  }
  return result;
}
function newsletterSender_(){
  const settings=settings_(),address=newsletterEmail_(settings.newsletterSender),alias=gmailRequest_('settings/sendAs/'+encodeURIComponent(address));
  if(alias.sendAsEmail?.toLowerCase()!==address||alias.verificationStatus!=='accepted')throw Error('El remitente '+address+' debe estar verificado en Gmail → Cuentas → Enviar como.');
  return {address,name:settings.newsletterSenderName};
}
function newsletterBudget_(deliveries,now){
  return Math.max(0,settings_().newsletterDailyLimit-deliveries.filter(row=>['Enviando','Enviada','Revisar'].includes(row.estado)&&new Date(row.fecha).getTime()>now.getTime()-86400000).length);
}
function getNewsletterDeliveryStatus(){
  authorize_(true);const settings=settings_(),deliveries=rows_('NewsletterEnvios',undefined,8),status={address:settings.newsletterSender,name:settings.newsletterSenderName,enabled:settings.newsletterEnabled,scheduled:ScriptApp.getProjectTriggers().some(trigger=>trigger.getHandlerFunction()==='deliverNewsletters_'),remaining:newsletterBudget_(deliveries,new Date()),last:deliveries.at(-1)||null,untracked:deliveries.filter(row=>row.suscripcion&&['Enviada','Enviando','Revisar'].includes(row.estado)&&!/(?:^|; )\d+ noticias incluidas/.test(row.detalle)).length};
  try{return {...status,...newsletterSender_(),available:true,error:''};}
  catch(error){return {...status,available:false,error:error.message};}
}
function mailHeader_(value){
  if(/[\r\n]/.test(value))throw Error('Cabecera de correo no válida.');
  const words=[];let word='',bytes=0;
  for(const char of String(value)){
    const size=encodeURIComponent(char).replace(/%[A-F\d]{2}/gi,'x').length;
    if(bytes+size>45){words.push('=?UTF-8?B?'+Utilities.base64Encode(word,Utilities.Charset.UTF_8)+'?=');word='';bytes=0;}
    word+=char;bytes+=size;
  }
  if(word)words.push('=?UTF-8?B?'+Utilities.base64Encode(word,Utilities.Charset.UTF_8)+'?=');
  return words.join('\r\n ');
}
function sendNewsletterMail_(sender,recipient,subject,content){
  const boundary='news_radar_'+Utilities.getUuid().replace(/-/g,''),body=value=>Utilities.base64Encode(value,Utilities.Charset.UTF_8).match(/.{1,76}/g)?.join('\r\n')||'';
  const mime=['From: '+mailHeader_(sender.name)+' <'+newsletterEmail_(sender.address)+'>','Reply-To: '+newsletterEmail_(sender.address),'To: '+newsletterEmail_(recipient),'Subject: '+mailHeader_('[bIA] News Radar : '+subject),'Date: '+new Date().toUTCString(),'MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',body(content.text),'--'+boundary,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',body(content.html),'--'+boundary+'--',''].join('\r\n');
  const related=boundary+'_related';
  const raw=content.inlineBia?mime.replace('Content-Type: multipart/alternative; boundary="'+boundary+'"','Content-Type: multipart/related; boundary="'+related+'"').replace('\r\n\r\n--'+boundary,'\r\n\r\n--'+related+'\r\nContent-Type: multipart/alternative; boundary="'+boundary+'"\r\n\r\n--'+boundary)+'--'+related+'\r\nContent-Type: image/png\r\nContent-Transfer-Encoding: base64\r\nContent-ID: <bia-logo>\r\nContent-Disposition: inline; filename="bia.png"\r\n\r\n'+NEWSLETTER_BIA_PNG.match(/.{1,76}/g).join('\r\n')+'\r\n--'+related+'--\r\n':mime;
  const result=gmailRequest_('messages/send',{raw:Utilities.base64EncodeWebSafe(raw,Utilities.Charset.UTF_8).replace(/=+$/,'')});
  if(!result.id)throw Error('Gmail no ha confirmado el identificador del mensaje. Revisa el envío antes de reintentar.');
  return result.id;
}
function sendNewsletterTest(){return newsletterTest_(authorize_(true));}
function sendSubscriptionTest(id){
  const session=authorize_(),subscription=subscriptionRows_(session.email).find(row=>row.id===id);
  if(!subscription)throw Error('Suscripción no encontrada.');
  return newsletterTest_(session,subscription);
}
function newsletterTest_(session,subscription){
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  let claimed=false;
  try{
    const now=new Date();if(!newsletterBudget_(rows_('NewsletterEnvios'),now))throw Error('Se ha alcanzado el límite configurado de newsletters en 24 horas.');
    const sender=newsletterSender_(),defaults=subscription?{name:subscription.nombre,filters:subscription.filtros}:subscriptionDefaults_();
    const query=subscription?subscriptionQuery_(subscription,now):{...defaults.filters,...recentNewsRange_(now)},content=newsletter_(rows_('Noticias',settings_().newsReadLimit),query,defaults.name,now,subscription?.id,subscription?.idioma||'es');
    append_('NewsletterEnvios',[['prueba:'+Utilities.getUuid(),'',session.email,query.from,query.to,'Enviando',now.toISOString(),subscription?'Prueba de suscripción':'Prueba del administrador']]);
    claimed=true;
    const sheet=book_().getSheetByName('NewsletterEnvios'),id=completeNewsletterDelivery_(sheet,sheet.getLastRow(),sender,session.email,translateText('Prueba',subscription?.idioma||'es')+' · '+defaults.name,content,true);
    return {accepted:true,recipient:session.email,sender:sender.address,messageId:id,count:content.count,from:query.from,to:query.to};
  }catch(error){if(!claimed)recordNewsletterBlock_(error,session.email);throw error;
  }finally{lock.releaseLock();}
}
function recordNewsletterBlock_(error,email){append_('NewsletterEnvios',[['diagnostico:'+Utilities.getUuid(),'',email,'','','Bloqueada',new Date().toISOString(),String(error.message).slice(0,500)]]);}
function completeNewsletterDelivery_(sheet,index,sender,recipient,subject,content,test=false){
  if(!test&&!content.count)throw Error('No se puede enviar una newsletter sin novedades.');
  try{
    SpreadsheetApp.flush();
    const id=sendNewsletterMail_(sender,recipient,subject,content);
    sheet.getRange(index,6,1,3).setValues([['Enviada',new Date().toISOString(),'Gmail ID: '+id+'; '+newsletterContentDetail_(content)]]);return id;
  }catch(error){
    sheet.getRange(index,6,1,3).setValues([[error.rejected?'No enviado':'Revisar',new Date().toISOString(),String(error.message).slice(0,500)+'; '+newsletterContentDetail_(content)]]);throw error;
  }
}

function getNewsletterHistory(query={}){
  authorize_(true);const data=administrativeRecords_('NewsletterEnvios',query,['correo','estado','suscripcion'],['correo','suscripcion','detalle','id']);
  return {...data,items:data.items.map(row=>({...row,noticias:row.detalle.match(/(?:^|; )(\d+) noticias incluidas/)?.[1]??null}))};
}
