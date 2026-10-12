function briefing_(rows,groupByEntity=false){
  const counts=new Map(configuration_().signals.filter(row=>row.enabled).map(row=>[row.name,0])),items=[];let total=0;
  const entities=new Map(),ranked=rows.filter(row=>row.senales.length).map(row=>{
    const entity=entityKey_(row.entidad);entities.set(entity,(entities.get(entity)||0)+1);
    return {row,entity,score:newsRelevanceMemory_.get(row)??digitalAssessment_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).score};
  });
  ranked.sort((a,b)=>(groupByEntity?Number(b.entity==='BBVA')-Number(a.entity==='BBVA')||entities.get(b.entity)-entities.get(a.entity)||a.entity.localeCompare(b.entity,'es'):0)||b.score-a.score||b.row.fecha.localeCompare(a.row.fecha));
  for(const {row} of ranked){total++;if(items.length<settings_().briefingLimit)items.push(row);for(const signal of row.senales)counts.set(signal,(counts.get(signal)||0)+1);}
  return {total,bySignal:[...counts].map(([name,total])=>({name,total})),items,limited:total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId,language='es'){
  return newsletterContent_(selectNews_(rows,query),query,title,now,subscriptionId,language);
}
function newsletterContent_(selected,query,title,now,subscriptionId,language='es'){
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const briefing=briefing_(selected),links=newsletterLinks_(subscriptionId),t=value=>translateText(value,language);
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label=value=>escape(t(value)),selection=Object.entries(query).filter(([key,value])=>value&&key!=='page').map(([key,value])=>key==='search'?value:t(value)).join(' · ')||t('Todo el sector');
  const footer='<footer>'+(links.app?'<p><a class="newsletter-cta" href="'+escape(links.app)+'">'+label('Ir a Newsradar')+' ↗</a></p>':'')+'<p>'+label('Has recibido esta selección por tu suscripción a News Radar.')+' '+label('Gestiona o da de baja tu suscripción desde Newsletter en News Radar.')+'</p>'+(links.manage?'<p><a href="'+escape(links.manage)+'">'+label('Gestiona tu suscripción')+'</a> · <a href="'+escape(links.unsubscribe)+'">'+label('Dar de baja')+'</a></p>':'')+'<table role="presentation" class="newsletter-brand"><tr><td><img src="cid:bia-logo" width="80" alt="bIA"></td><td>'+label('Impulsado por')+'<br><strong>'+label('Banca Inteligente y Autónoma')+'</strong></td></tr></table></footer>';
  const html='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style></head><body><header><p>BBVA · '+label('Banca de Empresas e Instituciones')+'</p><h2>News Radar</h2></header><h1>'+escape(title)+'</h1><p>'+escape(selection)+'</p><p>'+formatCalendarDay(now.toISOString().slice(0,10),language)+' · '+label('Novedades detectadas')+': '+briefing.total+'. '+label('Señales por coincidencia de términos; consulta cada fuente antes de comunicar condiciones comerciales.')+'</p>'+briefing.items.map(row=>'<article><h2><a href="'+escape(canonicalUrl_(row.url))+'">'+escape(row.titular)+'</a></h2><p>'+escape(row.entidad+' · '+t(row.tipo)+' · '+t(row.pais)+' · '+formatCalendarDay(row.fecha,language)+' · '+row.medio)+'</p><p>'+escape([...row.senales,...row.segmentos,row.tema].map(t).join(' · '))+'</p><p>'+escape(row.extracto)+'</p></article>').join('')+(briefing.limited?'<p>'+label('Se muestra un máximo de')+' '+settings_().briefingLimit+' '+label('novedades; reduce la selección para incluirlas todas.')+'</p>':'')+footer+'</body></html>';
  const styled=html.replace(/<(body|header|footer|p|h1|h2|article|a|table|td)(\s[^>]*|)>/g,(_,tag,attributes)=>'<'+tag+' style="'+escape((NEWSLETTER_INLINE[tag]||'')+(attributes.includes('newsletter-cta')?NEWSLETTER_INLINE['.newsletter-cta']||'':'')+(attributes.includes('newsletter-brand')?NEWSLETTER_INLINE['.newsletter-brand']||'':''))+'"'+attributes+'>');
  const text=[title,selection,t('Novedades detectadas')+': '+briefing.total,...briefing.items.map(row=>[row.titular,row.entidad+' · '+t(row.pais)+' · '+formatCalendarDay(row.fecha,language)+' · '+row.medio,row.extracto,canonicalUrl_(row.url)].join('\n')),briefing.limited?t('Se muestra un máximo de')+' '+settings_().briefingLimit+' '+t('novedades')+'.':'',links.app?t('Ir a Newsradar')+': '+links.app:'',links.manage?t('Gestiona tu suscripción')+': '+links.manage:'',links.unsubscribe?t('Dar de baja')+': '+links.unsubscribe:'',t('Impulsado por')+' bIA · '+t('Banca Inteligente y Autónoma')].filter(Boolean).join('\n\n');
  return {html:styled,text,inlineBia:true,count:briefing.items.length,total:briefing.total,items:briefing.items};
}
function newsletterLinks_(subscriptionId){
  const configured=settings_().newsletterAppUrl,url=configured||(typeof ScriptApp!=='undefined'&&ScriptApp.getService?ScriptApp.getService().getUrl():'');
  const app=canonicalUrl_(url);if(!app)return {app:'',manage:'',unsubscribe:''};
  const base=app.split('?')[0],manage=base+'?view=subscriptions';
  return {app,manage,unsubscribe:subscriptionId?manage+'&unsubscribe='+encodeURIComponent(subscriptionId):manage};
}
