function newsletterCoverageOrder_(a,b){return b.count-a.count||a.name.localeCompare(b.name,'es');}
function newsletterComparisonRows_(items,editorial,scope){if(scope!=='international')throw Error('Ámbito no disponible.');return items.filter(row=>!editorial.context.country||row.pais!==editorial.context.country);}
function newsletterLandscape_(items){
  const entities=new Map(),themes=new Map(),countries=new Set(),bbva={count:0};let unknownCountryCount=0;
  for(const row of items){
    if(row.entidad==='BBVA')bbva.count++;
    if(row.pais&&row.pais!=='Sin determinar')countries.add(row.pais);else unknownCountryCount++;
    if(!entities.has(row.entidad))entities.set(row.entidad,{name:row.entidad,count:0,themes:new Map()});
    const entity=entities.get(row.entidad);entity.count++;
    const labels=new Set(row.taxonomia.map(tag=>tag.palanca));
    for(const name of labels){
      entity.themes.set(name,(entity.themes.get(name)||0)+1);
      if(!themes.has(name))themes.set(name,{name,count:0});
      const theme=themes.get(name);theme.count++;
    }
  }
  const rank=newsletterCoverageOrder_,share=count=>items.length?Math.round(count/items.length*100):0;
  const rankedThemes=[...themes.values()].sort(rank).map(theme=>({name:theme.name,count:theme.count,share:share(theme.count)}));
  const leaders=[...entities.values()].sort(rank).slice(0,NEWSLETTER_EDITORIAL.cards).map((entity,index,top)=>({position:top.findIndex(row=>row.count===entity.count)+1,name:entity.name,count:entity.count,share:share(entity.count),themes:[...entity.themes].map(([name,count])=>({name,count})).sort(rank).slice(0,NEWSLETTER_EDITORIAL.entityThemes)}));
  return {total:items.length,entityCount:entities.size,countryCount:countries.size,unknownCountryCount,bbvaCount:bbva.count,themes:rankedThemes,leaders};
}
function newsletterExecutiveReport_(editorial,query,language,t,escape,links,images,renderCard){
 if(!editorial.landscapes)return {html:'',text:''};
 const label=value=>escape(t(value)),parts=[],texts=[];
 for(const [scope,data] of Object.entries(editorial.landscapes)){
  if(!data?.total)continue;const local=scope==='local',country=local?query.country:'',heading=country||'Mirada global',theme=data.themes[0],card=editorial.cards.find(card=>card.scope===scope);
  const link=(text,entity='',palanca='')=>links.app&&links.edition?'<a href="'+escape(newsletterExploreLink_(links.app,'news',country,entity,palanca,'',!local&&query.country?'international':''))+'">'+escape(text)+' ↗</a>':escape(text);
  const metrics=[['Noticias',data.total],['Noticias BBVA',data.bbvaCount],['Entidades',data.entityCount],...(!query.country?[['Geografías identificadas',data.countryCount]]:[])].map(([name,count])=>'<td class="newsletter-metric"><strong class="newsletter-metric-value">'+count+'</strong><span class="newsletter-metric-label">'+label(name)+'</span></td>').join('');
  const lead=theme?formatText('{theme} fue el bloque funcional con más noticias: {count}, el {share}% de las noticias analizadas.',{theme:t(theme.name),count:theme.count,share:theme.share},language):t('La selección no tiene noticias clasificadas por bloque funcional.');
  const themes=data.themes.slice(0,NEWSLETTER_EDITORIAL.cards).map(row=>'<div class="newsletter-ranking"><p><strong>'+link(t(row.name),'',row.name)+'</strong><span class="newsletter-ranking-count">'+row.count+' · '+row.share+'%</span></p></div>').join('');
  const leaders=data.leaders.map(row=>'<div class="newsletter-leader"><p>'+identityMark('entities',row.name,escape,images)+'<strong>'+link(row.name,row.name)+'</strong> · '+row.count+' · '+row.share+'%</p><p>'+row.themes.map(theme=>link(t(theme.name),row.name,theme.name)+' ('+theme.count+')').join(' · ')+'</p></div>').join('');
  parts.push('<section class="newsletter-report"><p class="newsletter-lever-label">'+label('EL TRIMESTRE EN CIFRAS')+'</p><h2>'+label(heading)+'</h2><table role="presentation" class="newsletter-metrics"><tr>'+metrics+'</tr></table><p class="newsletter-executive">'+escape(lead)+'</p><h3>'+label('Los bloques funcionales que marcaron el trimestre')+'</h3>'+themes+'<h3>'+label('Quién ocupó la conversación')+'</h3>'+leaders+'<p class="newsletter-meta">'+label('Noticias y porcentaje de la selección. Los temas de una entidad pueden solaparse.')+'</p><h3>'+label('El pulso del trimestre')+'</h3>'+(card?renderCard(card):'')+'</section>');
  texts.push(t(heading),lead,...data.leaders.map(row=>row.name+': '+row.count));
 }
 const note=t('Presencia en las fuentes y filtros de esta edición; no mide cuota de mercado. Una noticia puede pertenecer a varios bloques funcionales.');
 return {html:parts.join('')+'<p class="newsletter-meta">'+escape(note)+'</p>',text:[...texts,note].join('\n\n')};
}
