function newsletterSubject_(filters,language='es',t=taxonomyLanguage_(language)){
  const labels={entity:'Entidad',country:'Geografía',source:'Fuente',type:'Tipo de entidad',segment:'Segmento',coverage:'Cobertura',signal:'Novedad',search:'Buscar',palanca:'Palanca',subpalanca:'Subpalanca',from:'Desde',to:'Hasta'};
  const values=Object.entries(labels).filter(([key])=>filters[key]).map(([key,label])=>t(label)+': '+(key==='search'||key==='from'||key==='to'?String(filters[key]).replace(/[\r\n]+/g,' '):t(key==='coverage'?coverageOptions[filters[key]]:key==='subpalanca'?taxonomySubLabel(filters[key]):filters[key])));
  return '[bIA] '+(values.join(' · ')||t('Todo el sector'));
}
function briefing_(rows,perGeography=false,geography=row=>row.pais||'Sin determinar',entityName=entityKey_){
  const entities=new Map(),ranked=rows.filter(row=>row.senales.length).map(row=>{
    const entity=entityName(row.entidad);entities.set(entity,(entities.get(entity)||0)+1);
    return {row,entity,score:newsRelevanceMemory_.get(row)??digitalAssessment_(searchText_(row.titular),searchText_(row.titular+' '+row.extracto)).score};
  });
  ranked.sort((a,b)=>Number(b.entity==='BBVA')-Number(a.entity==='BBVA')||entities.get(b.entity)-entities.get(a.entity)||a.entity.localeCompare(b.entity,'es')||b.score-a.score||b.row.fecha.localeCompare(a.row.fecha));
  const overview=noveltyOverview(ranked.map(item=>item.row),configuration_().signals.filter(row=>row.enabled).map(row=>row.name),geography),items=[],counts=new Map(),limit=settings_().briefingLimit;
  for(const {row} of ranked){const key=perGeography?geography(row):'';if((counts.get(key)||0)>=limit)continue;counts.set(key,(counts.get(key)||0)+1);items.push(row);}
  return {...overview,items,limited:overview.total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId,language='es',editionId=''){
  return newsletterContent_(selectNews_(rows,query),query,title,now,subscriptionId,language,editionId);
}
function newsletterContent_(selected,query,title,now,subscriptionId,language='es',editionId=''){
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const evidence=(query.view||'briefing')==='briefing'?selected.filter(row=>row.senales.length):selected,t=taxonomyLanguage_(language),editorial=newsletterDigest_(evidence,query,language,t),items=editorial.cards.map(card=>evidence.find(row=>row.id===card.id)),links=newsletterLinks_(subscriptionId,editionId,query.view),images=new Map([['bia-logo',{id:'bia-logo',data:NEWSLETTER_BIA_PNG}]]);
  const localized=savedArticleTranslations_(items,language);for(let i=0;i<editorial.cards.length;i++){editorial.cards[i].title=newsletterWords_(localized[i].titular,NEWSLETTER_EDITORIAL.titleWords);editorial.cards[i].fact=newsletterWords_(localized[i].extracto,NEWSLETTER_EDITORIAL.factWords);}
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label=value=>escape(t(value)),period=query.from&&query.to?formatCalendarDay(query.from,language)+' — '+formatCalendarDay(query.to,language):formatCalendarDay(recordDay(now,settings_().timezone),language),selection=newsletterSubject_({...query,from:'',to:''},language,t).slice(6);
  for(const card of editorial.cards){
    card.related=editionId&&card.relatedCount>1&&links.app?newsletterExploreLink_(links.app,'news',query.country||'', '',card.category):'';
    card.radar=editionId&&editorial.cadence==='yearly'&&evidence.length>1&&links.app?newsletterExploreLink_(links.app,'radar',query.country||''):'';
  }
  const sections=editorial.cards.map(card=>'<article class="newsletter-article"><table role="presentation" class="newsletter-article-heading"><tr><td><h2>'+(card.url?'<a href="'+escape(card.url)+'">'+escape(card.title)+'</a>':escape(card.title))+'</h2></td><td class="newsletter-identity-cell">'+storyIdentity(card.entity,card.country,escape,images)+'</td></tr></table>'+(card.fact?'<p class="newsletter-excerpt">'+escape(card.fact)+'</p>':'')+'<p class="newsletter-insight">'+escape(card.relevance)+'</p><p class="newsletter-meta">'+escape(formatCalendarDay(card.date,language))+' · '+escape(t(card.country==='Sin determinar'?'Transversal':card.country))+' · '+identityMark('publishers',card.publisher,escape,images)+escape(card.publisher)+'</p><p class="newsletter-links">'+(card.url?'<a href="'+escape(card.url)+'">'+label('Consultar fuente')+' ↗</a>':'')+(card.related?' · <a href="'+escape(card.related)+'">'+label('Noticias relacionadas')+' ↗</a>':'')+(card.radar?' · <a href="'+escape(card.radar)+'">'+label('Explorar Radar')+' ↗</a>':'')+'</p></article>').join('');
  const footer='<footer><p>'+label('Has recibido esta selección por tu suscripción a News Radar.')+'</p>'+(links.manage?'<p><a href="'+escape(links.manage)+'">'+label('Gestiona tu suscripción')+'</a> · <a href="'+escape(links.unsubscribe)+'">'+label('Dar de baja')+'</a></p>':'')+'<table role="presentation" class="newsletter-brand"><tr><td><img src="cid:bia-logo" width="80" alt="bIA"></td><td>'+label('Impulsado por')+'<br><strong>'+label('Banca Inteligente y Autónoma')+'</strong></td></tr></table></footer>';
  const html='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style></head><body><header><p class="newsletter-eyebrow">BBVA · News Radar</p><h1>'+escape(editorial.heading)+'</h1><p class="newsletter-period">'+escape(period)+'</p></header><p class="newsletter-selection">'+escape(selection)+'</p><p class="newsletter-intro">'+escape(editorial.intro)+'</p>'+sections+(editorial.cards.length?'':'<p>'+label('No hay novedades detectadas en esta selección.')+'</p>')+(editionId&&evidence.length&&links.app?'<p class="newsletter-more"><a class="newsletter-cta" href="'+escape(links.app)+'">'+label('Ver esta edición')+' ↗</a></p>':'')+footer+'</body></html>';
  const text=[title,editorial.heading,period,selection,editorial.intro,...editorial.cards.flatMap(card=>[card.title,card.fact,card.relevance,card.publisher,card.url,card.related?t('Noticias relacionadas')+': '+card.related:'',card.radar?t('Explorar Radar')+': '+card.radar:'']),editionId&&evidence.length?links.app:'',links.manage?t('Gestiona tu suscripción')+': '+links.manage:'',links.unsubscribe?t('Dar de baja')+': '+links.unsubscribe:''].filter(Boolean).join('\n\n');
  return {subject:newsletterSubject_(query,language,t),html:newsletterInline_(html,escape),text,images:[...images.values()],editionId,count:items.length,total:evidence.length,items,evidence,editorial};
}
function newsletterInline_(html,escape){
  return html.replace(/<([a-z][\w-]*)(\s[^>]*|)>/g,(tag,name,attributes)=>{
    const classes=attributes.match(/class="([^"]*)"/)?.[1].split(/\s+/)||[],style=(NEWSLETTER_INLINE[name]||'')+classes.map(value=>NEWSLETTER_INLINE['.'+value]||'').join('');
    return style?'<'+name+' style="'+escape(style)+'"'+attributes+'>':tag;
  });
}
function newsletterLinks_(subscriptionId,editionId,view='briefing'){
  const configured=settings_().newsletterAppUrl,url=configured||(typeof ScriptApp!=='undefined'&&ScriptApp.getService?ScriptApp.getService().getUrl():'');
  const app=canonicalUrl_(url);if(!app)return {app:'',manage:'',unsubscribe:''};
  const base=app.split('?')[0],manage=base+'?view=subscriptions';
  return {app:editionId?base+'?edition='+encodeURIComponent(editionId)+'&view='+encodeURIComponent(view):base+'?view='+encodeURIComponent(view),manage,unsubscribe:subscriptionId?manage+'&unsubscribe='+encodeURIComponent(subscriptionId):manage};
}

function newsletterExploreLink_(app,view,country,entity='',palanca=''){if(!app)return '';return app.replace(/([?&])view=[^&]*&?/,'$1').replace(/[?&]$/,'')+(app.includes('?edition=')?'&':'?')+'view='+encodeURIComponent(view)+'&country='+encodeURIComponent(country)+(entity?'&entity='+encodeURIComponent(entity):'')+(palanca?'&palanca='+encodeURIComponent(palanca):'');}
