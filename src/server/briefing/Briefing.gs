function newsletterSubject_(filters,language='es',t=taxonomyLanguage_(language)){
  const labels={entity:'Entidad',country:'Geografía',source:'Fuente',topic:'Tema',type:'Tipo de entidad',segment:'Segmento',signal:'Novedad',search:'Buscar',palanca:'Palanca',subpalanca:'Subpalanca',from:'Desde',to:'Hasta'};
  const values=Object.entries(labels).filter(([key])=>filters[key]).map(([key,label])=>t(label)+': '+(key==='search'||key==='from'||key==='to'?String(filters[key]).replace(/[\r\n]+/g,' '):t(filters[key])));
  if(filters.range)values.push(t(newsRanges[filters.range]));
  return '[bIA] '+(values.join(' · ')||t('Todo el sector'));
}
function briefing_(rows,perGeography=false){
  const entities=new Map(),ranked=rows.filter(row=>row.senales.length).map(row=>{
    const entity=entityKey_(row.entidad);entities.set(entity,(entities.get(entity)||0)+1);
    return {row,entity,score:newsRelevanceMemory_.get(row)??digitalAssessment_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).score};
  });
  ranked.sort((a,b)=>Number(b.entity==='BBVA')-Number(a.entity==='BBVA')||entities.get(b.entity)-entities.get(a.entity)||a.entity.localeCompare(b.entity,'es')||b.score-a.score||b.row.fecha.localeCompare(a.row.fecha));
  const overview=noveltyOverview(ranked.map(item=>item.row),configuration_().signals.filter(row=>row.enabled).map(row=>row.name)),items=[],counts=new Map(),limit=settings_().briefingLimit;
  for(const {row} of ranked){const key=perGeography?row.pais||'Sin determinar':'';if((counts.get(key)||0)>=limit)continue;counts.set(key,(counts.get(key)||0)+1);items.push(row);}
  return {...overview,items,limited:overview.total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId,language='es',editionId=''){
  return newsletterContent_(selectNews_(rows,query),query,title,now,subscriptionId,language,editionId);
}
function newsletterContent_(selected,query,title,now,subscriptionId,language='es',editionId=''){
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const briefing=briefing_(selected),groups=noveltyGroups(briefing.items),overview=noveltyOverview(briefing.items,briefing.bySignal.map(row=>row.name)),links=newsletterLinks_(subscriptionId,editionId),t=taxonomyLanguage_(language);
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label=value=>escape(t(value)),count=(value,singular,plural)=>noveltyCount(value,singular,plural,label),selection=newsletterSubject_({...query,from:'',to:''},language,t).slice(6);
  const period=query.from&&query.to?formatCalendarDay(query.from,language)+' — '+formatCalendarDay(query.to,language):formatCalendarDay(recordDay(now,settings_().timezone),language);
  const metrics=[{name:'Novedades incluidas',total:overview.total},...overview.bySignal];
  const kpis='<table role="presentation" class="newsletter-kpis" cellspacing="0" cellpadding="0">'+metrics.map((metric,index)=>(index%2===0?'<tr>':'')+'<td class="newsletter-kpi"><strong class="newsletter-kpi-value">'+metric.total+'</strong><span class="newsletter-kpi-label">'+label(metric.name)+'</span></td>'+(index%2===1?'</tr>':index===metrics.length-1?'<td></td></tr>':'')).join('')+'</table>';
  const index=groups.length?'<table class="newsletter-index" cellspacing="0" cellpadding="0"><caption class="newsletter-index-title">'+label('Tu selección por geografía')+'</caption><tbody>'+groups.map(group=>'<tr><th scope="row">'+label(group.name)+'</th><td>'+count(group.entities.length,'entidad','entidades')+'</td><td class="newsletter-index-count">'+count(group.items.length,'novedad','novedades')+'</td></tr>').join('')+'</tbody></table>':'';
  const article=row=>'<article class="newsletter-article"><p class="newsletter-meta">'+escape(formatCalendarDay(row.fecha,language))+' · '+escape(row.medio)+'</p><h3><a href="'+escape(canonicalUrl_(row.url))+'">'+escape(row.titular)+'</a></h3><p>'+[...(row.senales||[]),...(row.taxonomia||[]).map(taxonomyPath)].map(value=>'<span class="newsletter-tag">'+label(value)+'</span>').join(' ')+'</p><p class="newsletter-excerpt">'+escape(row.extracto||t('Consulta la fuente original para conocer la oferta y sus condiciones.'))+'</p><p class="newsletter-meta">'+label(row.tema)+' · '+label(row.tipo)+'</p><a class="newsletter-source" href="'+escape(canonicalUrl_(row.url))+'">'+label('Consultar anuncio')+' ↗</a></article>';
  const sections=groups.map((group,index)=>'<section class="newsletter-geography"><table role="presentation" class="newsletter-geography-heading"><tr><td class="newsletter-chapter">'+String(index+1).padStart(2,'0')+'</td><td><p class="newsletter-eyebrow">'+label('Geografía')+'</p><h2>'+label(group.name)+'</h2></td><td class="newsletter-geography-count">'+group.items.length+'<span class="newsletter-count-label">'+label(group.items.length===1?'novedad':'novedades')+'</span></td></tr></table>'+group.entities.map(entity=>'<div class="newsletter-entity"><h3 class="newsletter-entity-heading">'+escape(entity.name)+' <span class="newsletter-entity-count">'+entity.items.length+'</span></h3>'+entity.segments.map(segment=>'<div class="newsletter-segment"><p class="newsletter-segment-heading">'+label('Segmento')+' · '+label(segment.name)+'</p>'+segment.items.map(article).join('')+'</div>').join('')+'</div>').join('')+'</section>').join('');
  const notice=briefing.limited?'<p class="newsletter-note">'+overview.total+' / '+briefing.total+' · '+label('Se muestra un máximo de')+' '+settings_().briefingLimit+' '+label('novedades; reduce la selección para incluirlas todas.')+'</p>':'';
  const footer='<footer>'+(links.app?'<p><a class="newsletter-cta" href="'+escape(links.app)+'">'+label('Ir a Newsradar')+' ↗</a></p>':'')+'<p>'+label('Has recibido esta selección por tu suscripción a News Radar.')+' '+label('Gestiona o da de baja tu suscripción desde Newsletter en News Radar.')+'</p>'+(links.manage?'<p><a href="'+escape(links.manage)+'">'+label('Gestiona tu suscripción')+'</a> · <a href="'+escape(links.unsubscribe)+'">'+label('Dar de baja')+'</a></p>':'')+'<table role="presentation" class="newsletter-brand"><tr><td><img src="cid:bia-logo" width="80" alt="bIA"></td><td>'+label('Impulsado por')+'<br><strong>'+label('Banca Inteligente y Autónoma')+'</strong></td></tr></table></footer>';
  const html='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style></head><body><p class="newsletter-preheader">'+count(overview.total,'novedad','novedades')+' · '+count(groups.length,'geografía','geografías')+' · '+count(overview.entities,'entidad','entidades')+'</p><header><p class="newsletter-eyebrow">BBVA · News Radar</p><h1>'+label('Tu radar de novedades')+'</h1><p class="newsletter-period">'+escape(period)+'</p><p class="newsletter-header-note">'+label('Banca de Empresas e Instituciones')+'</p></header><p class="newsletter-selection">'+escape(selection)+'</p>'+kpis+index+'<p class="newsletter-note">'+label('Señales por coincidencia de términos; consulta cada fuente antes de comunicar condiciones comerciales.')+'</p>'+notice+(groups.length?sections:'<p class="newsletter-note">'+label('No hay novedades detectadas en esta selección.')+'</p>')+footer+'</body></html>';
  const text=[title,selection,t('Novedades detectadas')+': '+overview.total,...overview.bySignal.map(row=>t(row.name)+': '+row.total),...groups.flatMap(group=>[t('Geografía')+': '+t(group.name)+' · '+noveltyCount(group.items.length,'novedad','novedades',t),...group.entities.flatMap(entity=>[entity.name+' · '+noveltyCount(entity.items.length,'novedad','novedades',t),...entity.segments.flatMap(segment=>[t('Segmento')+': '+t(segment.name),...segment.items.map(row=>[row.titular,formatCalendarDay(row.fecha,language)+' · '+row.medio,[...(row.senales||[]),...(row.taxonomia||[]).map(taxonomyPath)].map(t).join(' · '),row.extracto,canonicalUrl_(row.url)].filter(Boolean).join('\n'))])])]),briefing.limited?overview.total+' / '+briefing.total+' · '+t('Se muestra un máximo de')+' '+settings_().briefingLimit+' '+t('novedades')+'.':'',links.app?t('Ir a Newsradar')+': '+links.app:'',links.manage?t('Gestiona tu suscripción')+': '+links.manage:'',links.unsubscribe?t('Dar de baja')+': '+links.unsubscribe:'',t('Impulsado por')+' bIA · '+t('Banca Inteligente y Autónoma')].filter(Boolean).join('\n\n');
  return {subject:newsletterSubject_(query,language,t),html:newsletterInline_(html,escape),text,inlineBia:true,editionId,count:briefing.items.length,total:briefing.total,items:briefing.items};
}
function newsletterInline_(html,escape){
  return html.replace(/<([a-z][\w-]*)(\s[^>]*|)>/g,(tag,name,attributes)=>{
    const classes=attributes.match(/class="([^"]*)"/)?.[1].split(/\s+/)||[],style=(NEWSLETTER_INLINE[name]||'')+classes.map(value=>NEWSLETTER_INLINE['.'+value]||'').join('');
    return style?'<'+name+' style="'+escape(style)+'"'+attributes+'>':tag;
  });
}
function newsletterLinks_(subscriptionId,editionId){
  const configured=settings_().newsletterAppUrl,url=configured||(typeof ScriptApp!=='undefined'&&ScriptApp.getService?ScriptApp.getService().getUrl():'');
  const app=canonicalUrl_(url);if(!app)return {app:'',manage:'',unsubscribe:''};
  const base=app.split('?')[0],manage=base+'?view=subscriptions';
  return {app:editionId?base+'?edition='+encodeURIComponent(editionId):app,manage,unsubscribe:subscriptionId?manage+'&unsubscribe='+encodeURIComponent(subscriptionId):manage};
}
