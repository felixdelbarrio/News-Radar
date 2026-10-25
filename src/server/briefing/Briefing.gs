function newsletterSubject_(filters,language='es',t=taxonomyLanguage_(language)){
  const labels={entity:'Entidad',country:'Geografía',source:'Fuente',type:'Tipo de entidad',segment:'Segmento',coverage:'Cobertura',signal:'Novedad',search:'Buscar',palanca:"Bloque funcional",subpalanca:"Funcionalidad / Sub Operativa",from:'Desde',to:'Hasta'};
  const values=Object.entries(labels).filter(([key])=>filters[key]).map(([key,label])=>t(label)+': '+(key==='search'||key==='from'||key==='to'?String(filters[key]).replace(/[\r\n]+/g,' '):t(key==='coverage'?coverageOptions[filters[key]]:key==='subpalanca'?taxonomySubLabel(filters[key]):filters[key])));
  return '[bIA] '+(values.join(' · ')||t('Todo el sector'));
}
function briefing_(rows,perGeography=false,geography=row=>geographyLabel(row.pais)){
  const ranked=rows.filter(briefingAllowed).sort(publicationOrder),overview=noveltyOverview(ranked,BRIEFING_ALLOWED_SIGNALS,geography),items=[],counts=new Map(),limit=settings_().briefingLimit;
  for(const row of ranked){const key=perGeography?(geography(row)===otherGeography?countryRegion(row.pais)||otherGeography:geography(row)):'',count=counts.get(key)||0;if(count<limit){items.push(row);counts.set(key,count+1);}}
  const regions=noveltyOverview(ranked.filter(row=>geography(row)===otherGeography&&countryRegion(row.pais)),BRIEFING_ALLOWED_SIGNALS,row=>countryRegion(row.pais)).geographies;
  return {...overview,regions,items,limited:overview.total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId,language='es',editionId='',known=new Set()){
  return newsletterContent_(selectNews_(rows,newsletterSelectionQuery_(query)),query,title,now,subscriptionId,language,editionId,known);
}
function newsletterContent_(selected,query,title,now,subscriptionId,language='es',editionId='',known=new Set()){
  if(!supportedLanguage(language))throw Error('Idioma no admitido.');
  const evidence=selected.filter(row=>plainText_(row.titular).trim()&&briefingAllowed(row)),t=taxonomyLanguage_(language),editorial=newsletterDigest_(evidence,query,language,t,known),examples=new Map(editorial.cards.map(card=>[card.id,null])),links=newsletterLinks_(subscriptionId,editionId,query.view,query),images=new Map([['bia-logo',{id:'bia-logo',data:NEWSLETTER_BIA_PNG}]]);
  for(const row of evidence)if(examples.has(row.id))examples.set(row.id,row);
  const items=[...examples.values()],localized=savedArticleTranslations_(items,language);for(let i=0;i<editorial.cards.length;i++){editorial.cards[i].title=newsletterWords_(localized[i].titular,NEWSLETTER_EDITORIAL.titleWords);editorial.cards[i].fact=newsletterWords_(localized[i].extracto,NEWSLETTER_EDITORIAL.factWords);}
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label=value=>escape(t(value)),message=(value,params)=>escape(formatText(value,params,language)),fortnightly=editorial.cadence==='fortnightly',period=query.from&&query.to?formatCalendarDay(query.from,language)+' — '+formatCalendarDay(query.to,language):formatCalendarDay(recordDay(now,settings_().timezone),language),selection=newsletterSubject_({...query,from:'',to:''},language,t).slice(6);
  for(const card of editorial.cards){
    const international=editorial.focused&&card.scope==='global',country=international?(card.countries.length===1?card.countries[0]:''):editorial.focused?(card.scope==='local'?query.country:''):(query.country||''),geography=international?(card.countries.length===1?applicationGeography(editorial.scope,query.segment)({pais:country}):''):'';
    card.topicLabel=t('Bloque funcional');
    card.related=editionId&&card.relatedCount>1&&links.app?newsletterExploreLink_(links.app,'news',country,'',card.category,'',international?'international':'',geography):'';
  }
  const relatedLabel=card=>card.additionalCount?formatText(fortnightly?(card.additionalCount===1?"1 noticia más en este ámbito":"{count} noticias más en este ámbito"):(card.additionalCount===1?"1 noticia más en este bloque funcional":"{count} noticias más en este bloque funcional"),{count:card.additionalCount},language):'';
  const cardHtml=card=>{
    const country=label(geographyLabel(card.country));
    const title='<h3>'+(card.url?'<a href="'+escape(card.url)+'">'+escape(card.title)+'</a>':escape(card.title))+'</h3>';
    const identity='<table role="presentation" class="newsletter-article-heading"><tr><td><p class="newsletter-bank">'+escape(card.entity)+' · '+country+'</p></td><td class="newsletter-identity-cell">'+storyIdentity(card.entity,card.country,escape,images)+'</td></tr></table>';
    const detail=fortnightly?label(card.category):card.subcategories.filter(Boolean).map(label).join(' · ');
    const example=identity+title+(detail?'<p class="newsletter-subcategory">'+label(fortnightly?"Bloque funcional":"Funcionalidad / Sub Operativa")+': '+detail+'</p>':'')+(card.fact?'<p class="newsletter-excerpt">'+escape(card.fact)+'</p>':'')+'<p class="newsletter-insight">'+escape(card.relevance)+'</p><p class="newsletter-meta">'+escape(formatCalendarDay(card.date,language))+' · '+identityMark('publishers',card.publisher,escape,images)+escape(card.publisher)+'</p>';

    const theme='<p class="newsletter-lever-label">'+escape(card.topicLabel)+'</p><h2 class="newsletter-lever">'+label(card.category||'Noticias del sector')+'</h2><p class="newsletter-volume">'+message('Noticias: {count} · Entidades: {entities}',{count:card.relatedCount,entities:card.entityCount})+(!editorial.focused&&card.countryCount?' · '+message('Geografías: {count}',{count:card.countryCount}):'')+'</p>';
    const body='<div class="newsletter-example"><p class="newsletter-example-label">'+label(fortnightly?"Noticia seleccionada":"Un ejemplo de este bloque funcional")+'</p>'+example+'</div>';
    const more=card.related?'<a class="newsletter-related" href="'+escape(card.related)+'">'+escape(relatedLabel(card))+' ↗</a>':escape(relatedLabel(card));
    return '<article class="newsletter-article">'+theme+body+'<p class="newsletter-links">'+more+'</p></article>';
  };
  let previousScope='';
  const sections=fortnightly?editorial.cards.map(card=>{
    const heading=card.scope!==previousScope?'<div class="newsletter-scope"><p class="newsletter-eyebrow">'+label(fortnightly?(card.scope==='local'?'TU GEOGRAFÍA':'MIRADA INTERNACIONAL'):editorial.focused?(card.scope==='local'?'TU GEOGRAFÍA':'MIRADA INTERNACIONAL'):'MIRADA GLOBAL')+'</p><h2>'+label(editorial.focused?(card.scope==='local'?query.country:'Tendencias globales'):'Tendencias globales')+'</h2><p>'+(fortnightly&&card.scope==='local'?message('Trending topics en {country}.',{country:t(query.country)}):label(fortnightly?'Señales del conjunto del sector para ampliar la perspectiva.':editorial.focused?(card.scope==='local'?'Actividad en la geografía seleccionada.':'Señales del conjunto del sector para ampliar la perspectiva.'):'Ejemplos de los bloques funcionales con más actividad registrada durante el trimestre.'))+'</p></div>':'';previousScope=card.scope;return heading+cardHtml(card);
  }).join(''):'';
  const scopeText=formatText(editorial.focused?'Noticias en {country}: {local} · Mirada global: {global}':"Noticias en la selección: {count} · Bloques funcionales destacados: {themes}",{local:editorial.localCount,country:t(query.country),global:editorial.globalCount,count:evidence.length,themes:editorial.cards.length},language);
  const emptyLocalText=editorial.focused&&!editorial.localCount?formatText('Sin noticias en {country} con estos filtros. La mirada internacional recoge la actividad disponible.',{country:t(query.country)},language):'';
  const scopeSummary=scopeText?'<p class="newsletter-summary">'+escape(scopeText)+'</p>':'',noLocal=emptyLocalText?'<p class="newsletter-empty-local">'+escape(emptyLocalText)+'</p>':'';
  const editionLink=newsletterExploreLink_(links.app,'news','','','','','',query.country?applicationGeography(editorial.scope,query.segment)({pais:query.country}):'');
  const report=newsletterExecutiveReport_(editorial,query,language,t,escape,{...links,edition:editionId},images,cardHtml);
  const footer='<footer><p>'+label('Has recibido esta selección por tu suscripción a News Radar.')+'</p>'+(links.manage?'<p><a href="'+escape(links.manage)+'">'+label('Gestiona tu suscripción')+'</a> · <a href="'+escape(links.unsubscribe)+'">'+label('Dar de baja')+'</a></p>':'')+(editionId&&links.app?'<p>'+label('Valorar esta edición (opcional)')+' <a href="'+escape(newsletterExploreLink_(links.app,'news','')+'&feedback=positive')+'">👍 '+label('Útil')+'</a> · <a href="'+escape(newsletterExploreLink_(links.app,'news','')+'&feedback=negative')+'">👎 '+label('Mejorable')+'</a></p>':'')+'<table role="presentation" class="newsletter-brand"><tr><td><img src="cid:bia-logo" width="80" alt="bIA"></td><td>'+label('Impulsado por')+'<br><strong>'+label('Banca Inteligente y Autónoma')+'</strong></td></tr></table></footer>';
  const html='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><title>'+escape(title)+'</title><style>'+NEWSLETTER_STYLE+'</style></head><body><header><p class="newsletter-eyebrow">BBVA '+label('Banca de Empresas e Instituciones')+' · News Radar</p><h1>'+escape(editorial.heading)+'</h1><p class="newsletter-period">'+escape(period)+'</p></header><p class="newsletter-selection">'+escape(selection)+'</p><p class="newsletter-intro">'+escape(editorial.intro)+'</p>'+scopeSummary+noLocal+report.html+sections+(editorial.cards.length?'':'<p>'+label('No hay novedades detectadas en esta selección.')+'</p>')+(editionId&&evidence.length&&links.app?'<p class="newsletter-more"><a class="newsletter-cta" href="'+escape(editionLink)+'">'+label('Ver esta edición')+' ↗</a></p>':'')+footer+'</body></html>';
  const text=[title,editorial.heading,period,selection,editorial.intro,scopeText,emptyLocalText,report.text,...editorial.cards.flatMap(card=>[t(fortnightly?(card.scope==='local'?query.country:'Tendencias globales'):editorial.focused?(card.scope==='local'?query.country:'Tendencias globales'):'MIRADA GLOBAL'),card.topicLabel+': '+t(card.category||'Noticias del sector'),formatText('Noticias: {count} · Entidades: {entities}',{count:card.relatedCount,entities:card.entityCount},language),t(fortnightly?"Noticia seleccionada":"Un ejemplo de este bloque funcional"),card.entity+' · '+t(geographyLabel(card.country)),...(fortnightly?[t("Bloque funcional")+': '+t(card.category)]:card.subcategories.filter(Boolean).map(value=>t("Funcionalidad / Sub Operativa")+': '+t(value))),card.title,card.fact,card.relevance,card.publisher,card.url,card.related?relatedLabel(card)+': '+card.related:relatedLabel(card)]),editionId&&evidence.length?editionLink:'',links.manage?t('Gestiona tu suscripción')+': '+links.manage:'',links.unsubscribe?t('Dar de baja')+': '+links.unsubscribe:''].filter(Boolean).join('\n\n');
  return {subject:newsletterSubject_(query,language,t),html:newsletterInline_(html,escape),text,images:[...images.values()],editionId,count:items.length,total:evidence.length,items,evidence,editorial,translationReady:localized.every(row=>row.translation.state!=='pending')};
}
function newsletterInline_(html,escape){
  return html.replace(/<([a-z][\w-]*)(\s[^>]*|)>/g,(tag,name,attributes)=>{
    const classes=attributes.match(/class="([^"]*)"/)?.[1].split(/\s+/)||[],style=(NEWSLETTER_INLINE[name]||'')+classes.map(value=>NEWSLETTER_INLINE['.'+value]||'').join('');
    const existing=attributes.match(/style="([^"]*)"/)?.[1]||'';
    return style?'<'+name+' style="'+escape(style+existing)+'"'+attributes.replace(/\sstyle="[^"]*"/,'')+'>':tag;
  });
}
function newsletterLinks_(subscriptionId,editionId,view='briefing',period={}){
  const configured=settings_().newsletterAppUrl,url=configured||(typeof ScriptApp!=='undefined'&&ScriptApp.getService?ScriptApp.getService().getUrl():'');
  const app=canonicalUrl_(url);if(!app)return {app:'',manage:'',unsubscribe:''};
  const base=app.split('?')[0],manage=base+'?view=subscriptions';
  return {app:editionId?base+'?edition='+encodeURIComponent(editionId)+'&view='+encodeURIComponent(view)+(period.from?'&from='+encodeURIComponent(period.from):'')+(period.to?'&to='+encodeURIComponent(period.to):''):base+'?view='+encodeURIComponent(view),manage,unsubscribe:subscriptionId?manage+'&unsubscribe='+encodeURIComponent(subscriptionId):manage};
}

function newsletterExploreLink_(app,view,country,entity='',palanca='',subpalanca='',benchmark='',newsGeography=''){if(!app)return '';return app.replace(/([?&])view=[^&]*&?/,'$1').replace(/[?&]$/,'')+(app.includes('?edition=')?'&':'?')+'view='+encodeURIComponent(view)+'&country='+encodeURIComponent(country)+'&entity='+encodeURIComponent(entity)+(benchmark?'&benchmark='+encodeURIComponent(benchmark):'')+(newsGeography?'&newsGeography='+encodeURIComponent(newsGeography):'')+(palanca?'&palanca='+encodeURIComponent(palanca):'')+(subpalanca?'&subpalanca='+encodeURIComponent(subpalanca):'');}
