function newsletterCoverageOrder_(a,b){return b.count-a.count||a.name.localeCompare(b.name,'es');}
function newsletterComparisonRows_(items,editorial,scope){if(scope!=='international')throw Error('Ámbito no disponible.');return items.filter(row=>!editorial.context.country||!articleGeographies(row).includes(editorial.context.country));}
function newsletterLandscape_(items){
  const entities=new Map(),themes=new Map(),countries=new Set(),bbva={count:0};let unknownCountryCount=0;
  for(const row of items){
    if(row.entidad==='BBVA')bbva.count++;
    for(const country of articleGeographies(row))if(country&&country!=='Sin determinar')countries.add(country);else unknownCountryCount++;
    if(!entities.has(row.entidad))entities.set(row.entidad,{name:row.entidad,count:0,themes:new Map()});
    const entity=entities.get(row.entidad);entity.count++;
    const labels=new Set(row.taxonomia.map(tag=>tag.palanca));if(!labels.size)labels.add('Otros');
    for(const name of labels){
      entity.themes.set(name,(entity.themes.get(name)||0)+1);
      if(!themes.has(name))themes.set(name,{name,count:0});
      const theme=themes.get(name);theme.count++;
    }
  }
  const rank=newsletterCoverageOrder_,share=count=>items.length?Math.round(count/items.length*100):0;
  const rankedThemes=[...themes.values()].sort(rank).map(theme=>({name:theme.name,count:theme.count,share:share(theme.count)}));
  const leaders=[...entities.values()].sort(rank).slice(0,NEWSLETTER_EDITORIAL.cards).map((entity,index,top)=>({position:top.findIndex(row=>row.count===entity.count)+1,name:entity.name,count:entity.count,share:share(entity.count),themes:[...entity.themes].map(([name,count])=>({name,count})).sort(rank)}));
  return {total:items.length,entityCount:entities.size,countryCount:countries.size,unknownCountryCount,bbvaCount:bbva.count,themes:rankedThemes,leaders};
}
function newsletterMetricsHtml_(metrics,label){
 return '<table role="presentation" class="newsletter-metrics"><tr>'+metrics.map(([name,count])=>'<td class="newsletter-metric"><strong class="newsletter-metric-value">'+count+'</strong><span class="newsletter-metric-label">'+label(name)+'</span></td>').join('')+'</tr></table>';
}
function newsletterExecutiveReport_(editorial,query,language,t,escape,links,images,renderCard){
 const label=value=>escape(t(value)),scopes={},after={},texts=[],quarterly=editorial.cadence==='quarterly';
 for(const [scope,data] of Object.entries(editorial.landscapes)){
  if(!data?.total)continue;const local=scope==='local',country=local?query.country:'',heading=country||'Mirada global',theme=data.themes[0];
  const link=(text,entity='',palanca='')=>links.app.includes('edition=')&&!/^(?:\d+[.\s]*)?Otros$/i.test(palanca)?'<a href="'+escape(newsletterExploreLink_(links.app,'news',country,entity,palanca,'',!local&&query.country?'international':''))+'">'+escape(text)+' ↗</a>':escape(text);
  const metrics=newsletterMetricsHtml_([['Entidades',data.entityCount],['Menciones totales en prensa',data.total],['Menciones directas a BBVA',data.bbvaCount]],label);
  const lead=theme?formatText('{theme} fue el bloque funcional con más menciones en prensa: {count}, el {share}% de las publicaciones analizadas.',{theme:t(theme.name),count:theme.count,share:theme.share},language):t('La selección no tiene noticias clasificadas por bloque funcional.');
  const highlight='<table role="presentation" class="newsletter-highlight"><tr><td class="newsletter-highlight-cell"><p class="newsletter-executive">'+escape(lead)+'</p></td></tr></table>';
  const leaders=quarterly?data.leaders.map(row=>{
   const example=editorial.cards.find(card=>card.scope===scope&&card.entity===row.name);
   const themes=row.themes.map(theme=>'<p class="newsletter-entity-theme"><strong>'+link(t(theme.name),row.name,theme.name)+'</strong> ('+escape(formatText('{count} publicaciones',{count:theme.count},language))+')</p>'+(example?.category===theme.name?renderCard(example,{compact:true}):'')).join('');
   return '<tr><td class="newsletter-leader"><p class="newsletter-bank">'+identityMark('entities',row.name,escape,images)+' <strong>'+link(row.name,row.name)+'</strong></p>'+newsletterMetricsHtml_([['Menciones en prensa',row.count],[formatText('Menciones de {entity} sobre el total de publicaciones del periodo',{entity:row.name},language),row.share+'%']],label)+'<p class="newsletter-lever-label">'+label('Bloques funcionales mencionados en prensa')+'</p>'+themes+'</td></tr>';
  }).join(''):'';
  scopes[scope]='<table role="presentation" class="newsletter-report"><tr><td class="newsletter-report-cell"><p class="newsletter-lever-label">'+label(quarterly?'EL TRIMESTRE EN CIFRAS':'LA QUINCENA EN CIFRAS')+'</p>'+metrics+(quarterly?'<h3>'+label('Quién ocupó la conversación')+'</h3><table role="presentation" class="newsletter-leaders">'+leaders+'</table><p class="newsletter-meta">'+label('Menciones y porcentaje de las publicaciones. Los temas de una entidad pueden solaparse.')+'</p>'+highlight:'')+'</td></tr></table>';
  after[scope]=quarterly?'':highlight;
  texts.push(t(heading),lead,...data.leaders.map(row=>row.name+': '+row.count));
 }
 const note=t('Presencia en las fuentes y filtros de esta edición; no mide cuota de mercado. Una noticia puede pertenecer a varios bloques funcionales.');
 return {scopes,after,note:'<p class="newsletter-meta">'+escape(note)+'</p>',text:[...texts,note].join('\n\n')};
}
