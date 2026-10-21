function newsletterFeedback_(id,email){return rows_('NewsletterFeedback',settings_().eventLimit).find(row=>row.edicion===id&&row.correo===email)||null;}
function saveNewsletterFeedback(input){
  const session=authorize_();newsletterEditionMetadata_(input?.edition,session.email);
  if(!['positive','negative',''].includes(input.rating)||typeof input.comment!=='string'||input.comment.length>NEWSLETTER_EDITORIAL.commentChars)throw Error('Valoración o comentario no válido.');
  return withForegroundWrite_(()=>{
    const id=sha256_(input.edition+'|'+session.email),sheet=book_().getSheetByName('NewsletterFeedback'),rows=rows_('NewsletterFeedback'),index=rows.findIndex(row=>row.id===id),comment=plainText_(input.comment).trim();
    if(!input.rating&&!comment){if(index>=0)sheet.deleteRow(index+2);return {feedback:null};}
    const feedback={id,edicion:input.edition,correo:session.email,valoracion:input.rating,comentario:comment,fecha:new Date().toISOString(),estado:'pendiente'},values=RADAR.sheets.NewsletterFeedback.map(key=>safeCell_(feedback[key]));
    if(index>=0)sheet.getRange(index+2,1,1,values.length).setNumberFormat('@').setValues([values]);else append_('NewsletterFeedback',[values]);
    return {feedback};
  });
}
function setNewsletterFeedbackState(input){
  authorize_(true);if(!['pendiente','atendido'].includes(input?.state))throw Error('Estado de seguimiento no válido.');
  return withForegroundWrite_(()=>{const rows=rows_('NewsletterFeedback'),index=rows.findIndex(row=>row.id===input.id);if(index<0)throw Error('Valoración no disponible.');book_().getSheetByName('NewsletterFeedback').getRange(index+2,7,1,1).setValues([[input.state]]);return {saved:true};});
}
function recordNewsletterEvents_(events,email){
  const attributed=events.filter(event=>event.edition&&['acceso','vista','lectura','exportacion'].includes(event.event));if(!attributed.length)return;
  const editions=new Map(),known=new Set(rows_('NewsletterEventos',settings_().eventLimit,1).map(row=>row.id)),values=[];
  for(const event of attributed){
    if(!/^[a-z0-9-]{16,80}$/i.test(event.id))throw Error('Evento no válido.');
    if(!editions.has(event.edition))editions.set(event.edition,newsletterEditionMetadata_(event.edition,email));
    if(known.has(event.id))continue;known.add(event.id);
    const edition=editions.get(event.edition),cadence=Object.entries(newsletterCadences).find(([,row])=>row.view===(JSON.parse(edition.filtros).view||'briefing'))[0],destination=event.event==='lectura'?'fuente':event.event==='exportacion'?'exportacion':event.view;
    values.push([event.id,event.edition,email,event.session,event.event,destination,cadence,new Date().toISOString()]);
  }
  append_('NewsletterEventos',values);
}
function getNewsletterInsights(query={}){
  authorize_(true);const events=filterRecords(rows_('NewsletterEventos',settings_().eventLimit),query.adoption||query,['edicion','cadencia'],['edicion','cadencia','destino'],'fecha',settings_().timezone),groups=new Map();
  for(const event of events){const key=event.edicion+'|'+event.cadencia;if(!groups.has(key))groups.set(key,{edition:event.edicion,cadence:event.cadencia,users:new Set(),sessions:new Set(),entries:0,destinations:new Set()});const group=groups.get(key);group.users.add(event.correo);group.sessions.add(event.correo+'|'+event.sesion);if(event.evento==='acceso')group.entries++;group.destinations.add(event.destino);}
  const editions=rows_('NewsletterEdiciones').filter(row=>row.estado==='Enviada'),recipients=new Map(editions.map(row=>[row.id,new Set([row.correo])])),feedback=filterRecords(rows_('NewsletterFeedback',settings_().eventLimit),query.feedback||query,['estado','edicion'],['edicion','comentario','estado'],'fecha',settings_().timezone);
  return {adoption:recordPage([...groups.values()].reverse().map(group=>({...group,users:group.users.size,sessions:group.sessions.size,destinations:[...group.destinations],recipients:recipients.get(group.edition)?.size||0})),query.adoption||query,settings_().pageSize),feedback:recordPage(feedback.slice().reverse(),query.feedback||query,settings_().pageSize),retentionDays:settings_().retentionDays};
}

// Administrative feedback uses header metadata only; article evidence is never read.
function adminFeedbackRows_(){
  const editions=new Map(rows_('NewsletterEdiciones').map(row=>[row.id,row]));
  return rows_('NewsletterFeedback').map(row=>{
    const edition=editions.get(row.edicion)||{};let filters={};try{filters=JSON.parse(edition.filtros||'{}');}catch(error){}
    const cadence=Object.entries(newsletterCadences).find(([,value])=>value.view===(filters.view||'briefing'))?.[0]||'';
    return {...row,nombre_edicion:edition.nombre||row.edicion,fecha_envio:edition.fecha||'',idioma:edition.idioma||'',filtros:filters,pais:filters.country||filters.pais||'',cadencia:cadence};
  });
}
function adminFeedbackSelection_(rows,query){return filterRecords(rows,query,['valoracion','estado','edicion','correo'],['correo','edicion','nombre_edicion','comentario','estado','pais','cadencia','idioma'],'fecha',settings_().timezone);}
function feedbackKpis_(rows){
  const total=rows.length,positive=rows.filter(row=>row.valoracion==='positive').length,negative=rows.filter(row=>row.valoracion==='negative').length,pending=rows.filter(row=>row.estado==='pendiente').length;
  return {total,positive,negative,positiveRate:positive+negative?Math.round(1000*positive/(positive+negative))/10:0,pending,resolved:rows.filter(row=>row.estado==='atendido').length};
}
function getAdminFeedback(query={}){
  authorize_(true);const started=Date.now();try{
  const rows=adminFeedbackRows_(),selected=adminFeedbackSelection_(rows,query),editionIds=new Set(selected.map(row=>row.edicion)),groups=new Map();
  const events=filterRecords(rows_('NewsletterEventos'),{...query,search:''},['edicion','correo'],['correo','edicion','destino'],'fecha',settings_().timezone);
  for(const event of events){
    if((query.valoracion||query.estado||query.search)&&!editionIds.has(event.edicion))continue;
    if(!groups.has(event.edicion))groups.set(event.edicion,{edicion:event.edicion,accesses:0,reads:0,exports:0});
    const group=groups.get(event.edicion);if(event.evento==='acceso')group.accesses++;if(event.evento==='lectura')group.reads++;if(event.evento==='exportacion')group.exports++;
  }
  const result={...recordPage(selected.slice().reverse(),query,settings_().pageSize),global:feedbackKpis_(rows),filtered:feedbackKpis_(selected),options:recordOptions(rows,['valoracion','estado','edicion','correo']),interactions:[...groups.values()]};
  telemetry_('feedback_admin',Date.now()-started,'OK',selected.length+' valoraciones filtradas; '+rows.length+' totales');return result;
  }catch(error){telemetry_('feedback_admin',Date.now()-started,'Error',error.message);throw error;}
}
function exportNewsletterFeedback(query={}){
  authorize_(true);const started=Date.now();try{
  const rows=adminFeedbackSelection_(adminFeedbackRows_(),query).slice().reverse(),columns=['fecha','correo','edicion','nombre_edicion','cadencia','pais','idioma','valoracion','comentario','estado'];
  const cell=value=>'"'+String(safeCell_(value??'')).replace(/"/g,'""')+'"';
  const result={csv:'\ufeff'+[columns,...rows.map(row=>columns.map(key=>row[key]))].map(row=>row.map(cell).join(',')).join('\r\n'),count:rows.length};
  telemetry_('feedback_export',Date.now()-started,'OK',rows.length+' valoraciones exportadas');return result;
  }catch(error){telemetry_('feedback_export',Date.now()-started,'Error',error.message);throw error;}
}
