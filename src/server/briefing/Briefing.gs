function newsletterIdentity_(query,now=new Date(),testLabel=''){
 const from=query.from||'',to=query.to||'',start=new Date(from+'T00:00:00Z'),end=new Date(to+'T00:00:00Z'),month=date=>new Intl.DateTimeFormat('es',{month:'long',timeZone:'UTC'}).format(date),day=date=>new Intl.DateTimeFormat('es',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date),fortnightly=(query.view||'briefing')==='briefing',last=Number.isFinite(start.getTime())?new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate():0;
 let period='';
 if(from&&to&&Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())){
  const sameMonth=from.slice(0,7)===to.slice(0,7),naturalHalf=sameMonth&&(start.getUTCDate()===1&&end.getUTCDate()===15||start.getUTCDate()===16&&end.getUTCDate()===last),naturalQuarter=start.getUTCDate()===1&&start.getUTCMonth()%3===0&&to===new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+3,0)).toISOString().slice(0,10);
  if(fortnightly&&naturalHalf)period=(start.getUTCDate()===1?'Primera':'Segunda')+' quincena de '+month(start)+' de '+start.getUTCFullYear();
  else if(!fortnightly&&naturalQuarter)period='Lo más relevante del '+['primer','segundo','tercer','cuarto'][start.getUTCMonth()/3]+' trimestre de '+start.getUTCFullYear();
  else period=day(start)+' — '+day(end);
 }
 const scope=String(query.country||'Mirada global').replace(/[\r\n]+/g,' '),subject='[bIA] Canal BBVA BEI'+(testLabel?' · ['+testLabel+']':'')+' · '+scope+(period?' · '+period:'');
 return {subject,period,scope,preheader:fortnightly?(query.country?'Novedades y movimientos competitivos en canales digitales para empresas e instituciones.':'Novedades internacionales en canales digitales para empresas e instituciones.'):'Entidades y bloques funcionales destacados en las publicaciones del trimestre.'};
}
function newsletterSubject_(query){return newsletterIdentity_(query).subject;}
function briefing_(rows,perGeography=false,geography=applicationGeography(configuration_().applicationScope,sectorNewsDefaults.segment,configuration_().geographies)){
  const ranked=rows.filter(briefingAllowed).sort(publicationOrder),overview=noveltyOverview(ranked,BRIEFING_ALLOWED_SIGNALS,geography),items=[],counts=new Map(),limit=settings_().briefingLimit;
  for(const row of ranked){const keys=perGeography?[...new Set(articleGeographies(row).map(country=>geography.own(country)?country:geography.region(country)||otherGeography))]:[''];if(keys.some(key=>(counts.get(key)||0)<limit)){items.push(row);for(const key of keys)counts.set(key,(counts.get(key)||0)+1);}}
  const regional=row=>[...new Set(articleGeographies(row).filter(country=>!geography.own(country)).map(country=>geography.region(country)).filter(Boolean))],regions=noveltyOverview(ranked.filter(row=>regional(row).length),BRIEFING_ALLOWED_SIGNALS,regional).geographies;
  return {...overview,regions,items,limited:overview.total>items.length};
}
function newsletter_(rows,query,title,now,subscriptionId,language='es',editionId='',known=new Set()){
 return newsletterContent_(selectNews_(rows,newsletterSelectionQuery_(query)),query,title,now,subscriptionId,language,editionId,known);
}
function newsletterContent_(selected,query,title,now,subscriptionId,language='es',editionId='',known=new Set()){
 if(!supportedLanguage(language))throw Error('Idioma no admitido.');
 const t=taxonomyLanguage_(language),editorial=newsletterDigest_(selected,query,language,t,known),byId=new Map(selected.map(row=>[row.id,row])),items=editorial.cards.map(card=>byId.get(card.id)),localized=savedArticleTranslations_(items,language),links=newsletterLinks_(subscriptionId,editionId,query.view,query),images=new Map([['bia-logo',{id:'bia-logo',data:NEWSLETTER_BIA_PNG}]]),identity=newsletterIdentity_(query,now);
 if(editorial.cadence==='quarterly'&&known.verified&&!known.incomplete)identity.preheader='Publicaciones del trimestre con ejemplos que todavía no te hemos compartido.';
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),label=value=>escape(t(value));
 for(let index=0;index<editorial.cards.length;index++){const card=editorial.cards[index];card.title=newsletterWords_(localized[index].titular,NEWSLETTER_EDITORIAL.titleWords);card.fact=newsletterWords_(newsExcerpt_({excerpt:localized[index].extracto},localized[index].titular,card.publisher).text,NEWSLETTER_EDITORIAL.factWords);}
 const cardHtml=(card,options={})=>newsletterCardHtml_(card,editorial,query,label,escape,links,images,language,options),report=newsletterExecutiveReport_(editorial,query,language,t,escape,links,images,cardHtml),parts=[];
 for(const scope of ['local','global']){
  const data=editorial.landscapes[scope];if(!data?.total)continue;
  const cards=editorial.cards.filter(card=>card.scope===scope),content=(scope==='global'&&editorial.focused?newsletterIllustrationHtml_('other-banks-visual','Canales digitales de otros bancos',images):'')+report.scopes[scope]+(editorial.cadence==='fortnightly'&&cards.length?'<p class="newsletter-eyebrow">'+label('Bloques funcionales destacados')+'</p>'+cards.map((card,index)=>cardHtml(card,{topic:index+1})).join(''):'')+report.after[scope];
  parts.push(newsletterSectionHtml_(scope==='local'?'TU GEOGRAFÍA':'MIRADA INTERNACIONAL',scope==='local'?identity.scope:'Tendencias globales',content,label));
 }
 const editionLink=editionId&&links.app?newsletterExploreLink_(links.app,'news',''):'';
 const footer=newsletterFooterHtml_(editionLink,links,label,escape,images);
 const html='<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>'+escape(identity.subject)+'</title><style>'+NEWSLETTER_STYLE+'</style></head><body><div class="newsletter-preheader">'+escape(identity.preheader)+'</div><!--[if mso]><table role="presentation" class="newsletter-outlook-shell" align="center"><tr><td><![endif]--><table role="presentation" class="newsletter-shell" width="100%" align="center"><tr><td class="newsletter-shell-cell">'+newsletterHeaderHtml_(identity,editorial,label,escape,images)+'<p class="newsletter-intro">'+label(editorial.cadence==='quarterly'?'Qué se ha publicado, acerca de los canales digitales de Banca de Empresas, en los medios.':'Qué se ha publicado, acerca de los canales digitales de Banca de Empresas, para revisar esta quincena.')+'</p>'+(editorial.cadence==='quarterly'&&!editorial.focused?'':newsletterIllustrationHtml_(editorial.cadence==='quarterly'?'quarterly-visual':'fortnightly-visual',editorial.cadence==='quarterly'?'Planificación trimestral':'Novedades de la quincena',images))+parts.join('')+report.note+(!items.length?'<p>'+escape(editorial.audit.suppressReason)+'</p>':'')+footer+'</td></tr></table><!--[if mso]></td></tr></table><![endif]--></body></html>';
 const text=[identity.subject,identity.preheader,editorial.heading,...editorial.cards.flatMap(card=>[card.entity+' · '+card.country,t(card.category),card.title,card.fact,card.relevance,card.publisher,card.url]),report.text,editionLink,links.manage||'',links.unsubscribe||''].filter(Boolean).join('\n\n');
 const corpusIds=new Set(editorial.corpusIds);
 return {subject:identity.subject,html:newsletterInline_(html,escape),text,images:[...images.values()],editionId,count:items.length,total:editorial.audit.eligible,items,evidence:selected.filter(row=>corpusIds.has(row.id)),editorial,translationReady:localized.every(row=>row.translation.state!=='pending')};
}
function newsletterHeaderHtml_(identity,editorial,label,escape,images){
 const bei=newsletterVisualAsset_('bei-logo',images),logo=bei?'<img src="cid:bei-logo" width="160" height="56" alt="BBVA · Banca de Empresas e Instituciones">':(images.set('bbva-logo',{id:'bbva-logo',data:NEWSLETTER_BBVA_PNG}),'<img src="cid:bbva-logo" width="112" height="34" alt="BBVA">');
 return '<table role="presentation" class="newsletter-header"><tr><td class="newsletter-header-cell"><p class="newsletter-wordmark">'+logo+'</p><h1 class="newsletter-header-title">'+label(editorial.cadence==='quarterly'?'Publicaciones del trimestre':'Publicaciones de la quincena')+'</h1><p class="newsletter-period">'+escape(identity.period)+'</p></td></tr></table>';
}
function newsletterIllustrationHtml_(name,alt,images){
 return newsletterVisualAsset_(name,images)?'<table role="presentation" class="newsletter-visual"><tr><td class="newsletter-visual-cell"><img src="cid:'+name+'" width="520" height="260" alt="'+alt+'"></td></tr></table>':'';
}
let newsletterVisualConfig_,newsletterVisualMemory_=new Map();
function newsletterVisualAsset_(name,images){
 const allowed=['bei-logo','fortnightly-visual','quarterly-visual','other-banks-visual','feedback-positive','feedback-negative','link-icon'];if(!allowed.includes(name))return false;
 try{
  const configured=newsletterVisualConfig_||(newsletterVisualConfig_=JSON.parse(PropertiesService.getScriptProperties().getProperty('NEWSLETTER_VISUAL_ASSETS')||'{}')),fileId=String(configured[name]||'');
  if(!/^[\w-]{20,100}$/.test(fileId))return false;
  let base64=newsletterVisualMemory_.get(fileId);
  if(!base64){
   const cache=CacheService.getScriptCache(),key='newsletter-visual-'+name+'-'+fileId,stored=cache.getAll([key+'-count',...Array.from({length:5},(_,index)=>key+'-'+index)]),chunks=Number(stored[key+'-count']||0);
   if(chunks>0&&chunks<=5){const parts=Array.from({length:chunks},(_,index)=>stored[key+'-'+index]);if(parts.every(part=>typeof part==='string'&&part.length))base64=parts.join('');}
   if(!base64){const blob=DriveApp.getFileById(fileId).getBlob();if(blob.getContentType()!=='image/png')return false;const bytes=blob.getBytes();if(!bytes.length||bytes.length>200000)return false;base64=Utilities.base64Encode(bytes);const segments=base64.match(/.{1,80000}/g)||[];if(segments.length<=5){const values={[key+'-count']:String(segments.length)};segments.forEach((segment,index)=>values[key+'-'+index]=segment);cache.putAll(values,21600);}}
   newsletterVisualMemory_.set(fileId,base64);
  }
  images.set(name,{id:name,data:base64});return true;
 }catch(error){return false;}
}
function newsletterSectionHtml_(eyebrow,heading,content,label){
 return '<table role="presentation" class="newsletter-scope"><tr><td class="newsletter-scope-cell"><p class="newsletter-eyebrow">'+label(eyebrow)+'</p><h2>'+label(heading)+'</h2></td></tr></table>'+content;
}
function newsletterFeedbackIconHtml_(value,images,label){
 const name='feedback-'+value,alt=label(value==='positive'?'Útil':'Mejorable');
 return newsletterVisualAsset_(name,images)?'<img class="newsletter-feedback-icon" src="cid:'+name+'" width="32" height="32" alt="'+alt+'">':alt;
}
function newsletterLinkIconHtml_(images){
 return newsletterVisualAsset_('link-icon',images)?' <img class="newsletter-link-icon" src="cid:link-icon" width="24" height="24" alt="" aria-hidden="true">':'';
}
function newsletterCardHtml_(card,editorial,query,label,escape,links,images,language,options={}){
 const contextual=(text,entity='',palanca='')=>links.app.includes('edition=')&&!/^(?:\d+[.\s]*)?Otros$/i.test(palanca)?'<a href="'+escape(newsletterExploreLink_(links.app,'news',card.scope==='local'?query.country:'',entity,palanca,'',editorial.focused&&card.scope!=='local'?'international':''))+'">'+text+'</a>':text;
 const url=canonicalUrl_(card.url),headline=escape(card.title),count=editorial.landscapes?.[card.scope]?.themes.find(theme=>theme.name===card.category)?.count||0;
 const heading=options.compact?'<p class="newsletter-meta">'+identityMark('countries',card.country,escape,images)+' '+label(card.country)+'</p>':'<p class="newsletter-eyebrow">'+(options.topic?escape(formatText('Trending topic {number}',{number:options.topic},language)):label('Bloque funcional'))+'</p><h2 class="newsletter-lever">'+contextual(label(card.category),'',card.category)+'</h2><table role="presentation" class="newsletter-article-heading"><tr><td><p class="newsletter-bank">'+contextual(escape(card.entity),card.entity)+' · '+label(card.country)+'</p></td><td class="newsletter-identity-cell">'+storyIdentity(card.entity,card.country,escape,images)+'</td></tr></table>';
 const more=options.topic&&count>1&&links.app.includes('edition=')&&!/^(?:\d+[.\s]*)?Otros$/i.test(card.category)?'<p class="newsletter-more"><a class="newsletter-cta newsletter-theme-more" href="'+escape(newsletterExploreLink_(links.app,'news',card.scope==='local'?query.country:'','',card.category,'',editorial.focused&&card.scope!=='local'?'international':''))+'">'+escape(formatText(count===2?'{count} publicación más de {theme}':'{count} publicaciones más de {theme}',{count:count-1,theme:card.category},language))+newsletterLinkIconHtml_(images)+'</a></p>':'';
 return '<table role="presentation" class="newsletter-article"><tr><td class="newsletter-card-cell">'+heading+'<h3>'+(url?'<a href="'+escape(url)+'">'+headline+'</a>':headline)+'</h3>'+(!options.compact&&card.fact?'<p class="newsletter-excerpt">'+escape(card.fact)+'</p>':'')+'<p class="newsletter-insight">'+escape(card.relevance)+'</p><p class="newsletter-meta">'+escape(formatCalendarDay(card.date,language))+' · '+identityMark('publishers',card.publisher,escape,images)+' '+escape(card.publisher)+'</p>'+more+'</td></tr></table>';
}
function newsletterFooterHtml_(editionLink,links,label,escape,images){
 const action=editionLink?'<table role="presentation" class="newsletter-action"><tr><td class="newsletter-action-cell"><h2>'+label('Explorar en News Radar')+'</h2><p class="newsletter-more"><a class="newsletter-cta newsletter-edition-link" href="'+escape(editionLink)+'">'+label('Ver esta edición')+newsletterLinkIconHtml_(images)+'</a></p></td></tr></table>':'';
 const feedback=editionLink?'<table role="presentation" class="newsletter-feedback"><tr><td class="newsletter-feedback-cell"><p>'+label('¿Te ha resultado útil?')+'</p><p>'+['positive','negative'].map(value=>'<a class="newsletter-feedback-cta" aria-label="'+label(value==='positive'?'Útil':'Mejorable')+'" href="'+escape(editionLink+'&feedback='+value)+'">'+newsletterFeedbackIconHtml_(value,images,label)+'</a>').join(' ')+'</p></td></tr></table>':'';
 return action+'<p class="newsletter-meta newsletter-disclaimer">'+label('Selección basada en fuentes trazables; consulta la fuente para confirmar oferta y disponibilidad.')+'</p>'+(links.manage?'<p class="newsletter-meta newsletter-management"><a href="'+escape(links.manage)+'">'+label('Gestiona tu suscripción')+'</a> · <a href="'+escape(links.unsubscribe)+'">'+label('Dar de baja')+'</a></p>':'')+'<table role="presentation" class="newsletter-brand"><tr><td class="newsletter-brand-logo"><img src="cid:bia-logo" width="80" alt="bIA · Banca Inteligente y Autónoma"></td><td class="newsletter-brand-cell">'+label('Impulsado por')+'<br><strong>'+label('Banca Inteligente y Autónoma')+'</strong><br>BBVA · '+label('Banca de Empresas e Instituciones')+'</td></tr></table>'+feedback;
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
