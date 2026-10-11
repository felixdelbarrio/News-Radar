function briefing_(rows){
  const counts=new Map(configuration_().signals.filter(row=>row.enabled).map(row=>[row.name,0])),items=[];let total=0;
  for(const row of rows){if(!row.senales.length)continue;total++;if(items.length<settings_().briefingLimit)items.push(row);for(const signal of row.senales)counts.set(signal,(counts.get(signal)||0)+1);}
  return {total,bySignal:[...counts].map(([name,total])=>({name,total})),items,limited:total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId){
  return newsletterContent_(selectNews_(rows,query),query,title,now,subscriptionId);
}
function newsletterContent_(selected,query,title,now,subscriptionId){
  const briefing=briefing_(selected),links=newsletterLinks_(subscriptionId);
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const footer='<footer>'+(links.app?'<p><a class="newsletter-cta" href="'+escape(links.app)+'">Ir a Newsradar ↗</a></p>':'')+'<p>Has recibido esta selección por tu suscripción a News Radar. '+(links.manage?'<a href="'+escape(links.manage)+'">Gestiona</a> o <a href="'+escape(links.unsubscribe)+'">da de baja</a> tu suscripción desde Newsletter en News Radar.':'Gestiona o da de baja tu suscripción desde Newsletter en News Radar.')+'</p><table role="presentation" class="newsletter-brand"><tr><td><img src="cid:bia-logo" width="80" alt="bIA"></td><td>Impulsado por<br><strong>Banca Inteligente y Autónoma</strong></td></tr></table></footer>';
  const html='<!doctype html><html lang="es"><meta charset="utf-8"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style><body><header><p>BBVA · Banca de Empresas e Instituciones</p><h2>News Radar</h2></header><h1>'+escape(title)+'</h1><p>'+escape(Object.entries(query).filter(([key,value])=>value&&key!=='page').map(([,value])=>value).join(' · ')||'Todo el sector')+'</p><p>'+escape(now.toISOString().slice(0,10))+' · Novedades detectadas: '+briefing.total+'. Señales por coincidencia de términos; consulta cada fuente antes de comunicar condiciones comerciales.</p>'+briefing.items.map(row=>'<article><h2><a href="'+escape(canonicalUrl_(row.url))+'">'+escape(row.titular)+'</a></h2><p>'+escape(row.entidad+' · '+row.tipo+' · '+row.pais+' · '+row.fecha+' · '+row.medio)+'</p><p>'+escape([...row.senales,...row.segmentos,row.tema].join(' · '))+'</p><p>'+escape(row.extracto)+'</p></article>').join('')+(briefing.limited?'<p>Se muestra un máximo de '+settings_().briefingLimit+' novedades; reduce la selección para incluirlas todas.</p>':'')+footer+'</body></html>';
  const styled=html.replace(/<(body|header|footer|p|h1|h2|article|a|table|td)(\s[^>]*|)>/g,(_,tag,attributes)=>'<'+tag+' style="'+escape((NEWSLETTER_INLINE[tag]||'')+(attributes.includes('newsletter-cta')?NEWSLETTER_INLINE['.newsletter-cta']||'':'')+(attributes.includes('newsletter-brand')?NEWSLETTER_INLINE['.newsletter-brand']||'':''))+'"'+attributes+'>');
  const text=[title,Object.values(query).filter(Boolean).join(' · '),'Novedades detectadas: '+briefing.total,...briefing.items.map(row=>[row.titular,row.entidad+' · '+row.pais+' · '+row.fecha+' · '+row.medio,row.extracto,canonicalUrl_(row.url)].join('\n')),briefing.limited?'Se muestra un máximo de '+settings_().briefingLimit+' novedades.':'',links.app?'Ir a Newsradar: '+links.app:'','Gestiona tu suscripción: '+links.manage,'Dar de baja: '+links.unsubscribe,'Impulsado por bIA · Banca Inteligente y Autónoma'].filter(Boolean).join('\n\n');
  return {html:styled,text,inlineBia:true,count:briefing.items.length,total:briefing.total};
}
function newsletterLinks_(subscriptionId){
  const configured=settings_().newsletterAppUrl,url=configured||(typeof ScriptApp!=='undefined'&&ScriptApp.getService?ScriptApp.getService().getUrl():'');
  const app=canonicalUrl_(url);if(!app)return {app:'',manage:'',unsubscribe:''};
  const base=app.split('?')[0],manage=base+'?view=subscriptions';
  return {app,manage,unsubscribe:subscriptionId?manage+'&unsubscribe='+encodeURIComponent(subscriptionId):manage};
}
