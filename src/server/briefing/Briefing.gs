function newsletterSubject_(filters,language='es',t=taxonomyLanguage_(language)){
  const labels={entity:'Entidad',country:'Geografía',source:'Fuente',type:'Tipo de entidad',segment:'Segmento',coverage:'Cobertura',signal:'Novedad',search:'Buscar',palanca:'Palanca',subpalanca:'Subpalanca',from:'Desde',to:'Hasta'};
  const values=Object.entries(labels).filter(([key])=>filters[key]).map(([key,label])=>t(label)+': '+(key==='search'||key==='from'||key==='to'?String(filters[key]).replace(/[\r\n]+/g,' '):t(key==='coverage'?coverageOptions[filters[key]]:key==='subpalanca'?taxonomySubLabel(filters[key]):filters[key])));
  return '[bIA] '+(values.join(' · ')||t('Todo el sector'));
}
function briefing_(rows,perGeography=false,geography=row=>row.pais||'Sin determinar',entityName=entityKey_){
  const entities=new Map(),ranked=rows.filter(row=>row.senales.length).map(row=>{
    const entity=entityName(row.entidad);entities.set(entity,(entities.get(entity)||0)+1);
    return {row,entity,score:newsRelevance_(row)};
  });
  ranked.sort((a,b)=>Number(b.entity==='BBVA')-Number(a.entity==='BBVA')||entities.get(b.entity)-entities.get(a.entity)||a.entity.localeCompare(b.entity,'es')||b.score-a.score||b.row.fecha.localeCompare(a.row.fecha));
  const overview=noveltyOverview(ranked.map(item=>item.row),configuration_().signals.filter(row=>row.enabled).map(row=>row.name),geography),items=[],counts=new Map(),limit=settings_().briefingLimit;
  for(const {row} of ranked){const key=perGeography?geography(row):'';if((counts.get(key)||0)>=limit)continue;counts.set(key,(counts.get(key)||0)+1);items.push(row);}
  return {...overview,items,limited:overview.total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId,language='es',editionId='',known=new Set()){
  return newsletterContent_(selectNews_(rows,newsletterSelectionQuery_(query)),query,title,now,subscriptionId,language,editionId,known);
}
function newsletterContent_(selected,query,title,now,subscriptionId,language='es',editionId='',known=new Set()){
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const evidence=selected.filter(row=>plainText_(row.titular).trim()&&((query.view||'briefing')!=='briefing'||row.senales.length)),t=taxonomyLanguage_(language),editorial=newsletterDigest_(evidence,query,language,t,known),examples=new Map(editorial.cards.map(card=>[card.id,null])),links=newsletterLinks_(subscriptionId,editionId,query.view),images=new Map([['bia-logo',{id:'bia-logo',data:NEWSLETTER_BIA_PNG}]]);
  for(const row of evidence)if(examples.has(row.id))examples.set(row.id,row);
  const items=[...examples.values()],localized=savedArticleTranslations_(items,language);for(let i=0;i<editorial.cards.length;i++){editorial.cards[i].title=newsletterWords_(localized[i].titular,NEWSLETTER_EDITORIAL.titleWords);editorial.cards[i].fact=newsletterWords_(localized[i].extracto,NEWSLETTER_EDITORIAL.factWords);}
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label=value=>escape(t(value)),message=(value,params)=>escape(formatText(value,params,language)),fortnightly=editorial.cadence==='fortnightly',annual=editorial.cadence==='yearly',period=query.from&&query.to?formatCalendarDay(query.from,language)+' — '+formatCalendarDay(query.to,language):formatCalendarDay(recordDay(now,settings_().timezone),language),selection=newsletterSubject_({...query,from:'',to:''},language,t).slice(6);
  for(const card of editorial.cards){
    card.related=editionId&&card.relatedCount>1&&links.app?newsletterExploreLink_(links.app,'news',editorial.focused?(card.scope==='local'?query.country:''):(query.country||''), '',card.category,fortnightly?card.subcategoryPath:'',annual&&card.scope!=='global'?card.scope:''):'';
  }
  const relatedLabel=card=>formatText(fortnightly?(card.additionalCount===1?'1 noticia más en esta subpalanca':'{count} noticias más en esta subpalanca'):(card.additionalCount===1?'1 noticia más en esta palanca':'{count} noticias más en esta palanca'),{count:card.additionalCount},language);
  const cardHtml=(card,index)=>{
    const country=label(card.country==='Sin determinar'?'Transversal':card.country);
    const title='<h3>'+(card.url?'<a href="'+escape(card.url)+'">'+escape(card.title)+'</a>':escape(card.title))+'</h3>';
    const identity='<table role="presentation" class="newsletter-article-heading"><tr><td><p class="newsletter-bank">'+escape(card.entity)+' · '+country+'</p></td><td class="newsletter-identity-cell">'+storyIdentity(card.entity,card.country,escape,images)+'</td></tr></table>';
    const detail=fortnightly?label(card.category):card.subcategories.filter(Boolean).map(label).join(' · ');
    const example=identity+title+(detail?'<p class="newsletter-subcategory">'+label(fortnightly?'Palanca':'Subpalanca')+': '+detail+'</p>':'')+(card.fact?'<p class="newsletter-excerpt">'+escape(card.fact)+'</p>':'')+'<p class="newsletter-insight">'+escape(card.relevance)+'</p><p class="newsletter-meta">'+escape(formatCalendarDay(card.date,language))+' · '+identityMark('publishers',card.publisher,escape,images)+escape(card.publisher)+'</p>';
    const theme='<p class="newsletter-lever-label">'+label(editorial.focusLabel)+' · '+String(index+1).padStart(2,'0')+'</p><h2 class="newsletter-lever">'+label((fortnightly?card.subcategory:card.category)||'Noticias del sector')+'</h2><p class="newsletter-volume">'+message('Noticias: {count} · Entidades: {entities}',{count:card.relatedCount,entities:card.entityCount})+(card.countryCount?' · '+message('Geografías: {count}',{count:card.countryCount}):'')+'</p>';
    const body='<div class="newsletter-example"><p class="newsletter-example-label">'+label(fortnightly?'Un ejemplo de esta subpalanca':'Un ejemplo de esta palanca')+'</p>'+example+'</div>';
    const more=card.additionalCount?(card.related?'<a class="newsletter-related" href="'+escape(card.related)+'">'+escape(relatedLabel(card))+' ↗</a>':escape(relatedLabel(card))):label(fortnightly?'Única noticia de esta subpalanca en la selección':'Única noticia de esta palanca en la selección');
    return '<article class="newsletter-article">'+theme+body+'<p class="newsletter-links">'+more+'</p></article>';
  };
  const scopeLabel=scope=>scope==='local'?query.country:newsletterComparisonLabels[scope]||(editorial.focused?'Tendencias globales':'MIRADA GLOBAL');
  let previousScope='';
  const sections=editorial.cards.map((card,index)=>{
    const heading=card.scope!==previousScope?'<div class="newsletter-scope"><p class="newsletter-eyebrow">'+label(editorial.focused?(card.scope==='local'?'TU GEOGRAFÍA':'MIRADA INTERNACIONAL'):'MIRADA GLOBAL')+'</p><h2>'+label(annual?scopeLabel(card.scope):editorial.focused?(card.scope==='local'?query.country:'Tendencias globales'):(fortnightly?'Las subpalancas que mueven el sector':annual?'Las palancas que marcaron el año':'Las palancas que marcaron el trimestre'))+'</h2><p>'+label(editorial.focused?(card.scope==='local'?'Actividad en la geografía seleccionada.':'Señales del conjunto del sector para ampliar la perspectiva.'):(fortnightly?'Una noticia de ejemplo por subpalanca; descubre el resto de la actividad.':annual?'Ejemplos de las palancas con más actividad registrada durante el año.':'Ejemplos de las palancas con más actividad registrada durante el trimestre.'))+'</p></div>':'';previousScope=card.scope;return heading+cardHtml(card,index);
  }).join('');
  const scopeText=formatText(editorial.focused?'Noticias en {country}: {local} · Mirada global: {global}':(fortnightly?'Noticias en la selección: {count} · Subpalancas destacadas: {themes}':'Noticias en la selección: {count} · Palancas destacadas: {themes}'),{local:editorial.localCount,country:t(query.country),global:editorial.globalCount,count:evidence.length,themes:editorial.cards.length},language);
  const emptyLocalText=editorial.focused&&!editorial.localCount?formatText('Sin noticias en {country} con estos filtros. La mirada internacional recoge la actividad disponible.',{country:t(query.country)},language):'';
  const scopeSummary=scopeText?'<p class="newsletter-summary">'+escape(scopeText)+'</p>':'',noLocal=emptyLocalText?'<p class="newsletter-empty-local">'+escape(emptyLocalText)+'</p>':'';
  const editionLink=annual?newsletterExploreLink_(links.app,'radar',''):links.app;
  const report=newsletterExecutiveReport_(editorial,query,language,t,escape,{...links,edition:editionId},images);
  const footer='<footer><p>'+label('Has recibido esta selección por tu suscripción a News Radar.')+'</p>'+(links.manage?'<p><a href="'+escape(links.manage)+'">'+label('Gestiona tu suscripción')+'</a> · <a href="'+escape(links.unsubscribe)+'">'+label('Dar de baja')+'</a></p>':'')+'<table role="presentation" class="newsletter-brand"><tr><td><img src="cid:bia-logo" width="80" alt="bIA"></td><td>'+label('Impulsado por')+'<br><strong>'+label('Banca Inteligente y Autónoma')+'</strong></td></tr></table></footer>';
  const html='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style></head><body><header><p class="newsletter-eyebrow">BBVA · News Radar</p><h1>'+escape(editorial.heading)+'</h1><p class="newsletter-period">'+escape(period)+'</p></header><p class="newsletter-selection">'+escape(selection)+'</p><p class="newsletter-intro">'+escape(editorial.intro)+'</p>'+scopeSummary+noLocal+report.html+sections+(editorial.cards.length?'':'<p>'+label('No hay novedades detectadas en esta selección.')+'</p>')+(editionId&&evidence.length&&links.app?'<p class="newsletter-more"><a class="newsletter-cta" href="'+escape(editionLink)+'">'+label('Ver esta edición')+' ↗</a></p>':'')+footer+'</body></html>';
  const text=[title,editorial.heading,period,selection,editorial.intro,scopeText,emptyLocalText,report.text,...editorial.cards.flatMap(card=>[t(annual?scopeLabel(card.scope):editorial.focused?(card.scope==='local'?query.country:'Tendencias globales'):'MIRADA GLOBAL'),t(editorial.focusLabel)+': '+t((fortnightly?card.subcategory:card.category)||'Noticias del sector'),formatText('Noticias: {count} · Entidades: {entities}',{count:card.relatedCount,entities:card.entityCount},language),t(fortnightly?'Un ejemplo de esta subpalanca':'Un ejemplo de esta palanca'),card.entity+' · '+t(card.country==='Sin determinar'?'Transversal':card.country),...(fortnightly?[t('Palanca')+': '+t(card.category)]:card.subcategories.filter(Boolean).map(value=>t('Subpalanca')+': '+t(value))),card.title,card.fact,card.relevance,card.publisher,card.url,card.additionalCount?relatedLabel(card):'',card.related?relatedLabel(card)+': '+card.related:'']),editionId&&evidence.length?editionLink:'',links.manage?t('Gestiona tu suscripción')+': '+links.manage:'',links.unsubscribe?t('Dar de baja')+': '+links.unsubscribe:''].filter(Boolean).join('\n\n');
  return {subject:newsletterSubject_(query,language,t),html:newsletterInline_(html,escape),text,images:[...images.values()],editionId,count:items.length,total:evidence.length,items,evidence,editorial};
}
function newsletterInline_(html,escape){
  return html.replace(/<([a-z][\w-]*)(\s[^>]*|)>/g,(tag,name,attributes)=>{
    const classes=attributes.match(/class="([^"]*)"/)?.[1].split(/\s+/)||[],style=(NEWSLETTER_INLINE[name]||'')+classes.map(value=>NEWSLETTER_INLINE['.'+value]||'').join('');
    const existing=attributes.match(/style="([^"]*)"/)?.[1]||'';
    return style?'<'+name+' style="'+escape(style+existing)+'"'+attributes.replace(/\sstyle="[^"]*"/,'')+'>':tag;
  });
}
function newsletterLinks_(subscriptionId,editionId,view='briefing'){
  const configured=settings_().newsletterAppUrl,url=configured||(typeof ScriptApp!=='undefined'&&ScriptApp.getService?ScriptApp.getService().getUrl():'');
  const app=canonicalUrl_(url);if(!app)return {app:'',manage:'',unsubscribe:''};
  const base=app.split('?')[0],manage=base+'?view=subscriptions';
  return {app:editionId?base+'?edition='+encodeURIComponent(editionId)+'&view='+encodeURIComponent(view):base+'?view='+encodeURIComponent(view),manage,unsubscribe:subscriptionId?manage+'&unsubscribe='+encodeURIComponent(subscriptionId):manage};
}

function newsletterExploreLink_(app,view,country,entity='',palanca='',subpalanca='',benchmark=''){if(!app)return '';return app.replace(/([?&])view=[^&]*&?/,'$1').replace(/[?&]$/,'')+(app.includes('?edition=')?'&':'?')+'view='+encodeURIComponent(view)+'&country='+encodeURIComponent(country)+'&entity='+encodeURIComponent(entity)+(benchmark?'&benchmark='+encodeURIComponent(benchmark):'')+(palanca?'&palanca='+encodeURIComponent(palanca):'')+(subpalanca?'&subpalanca='+encodeURIComponent(subpalanca):'');}
