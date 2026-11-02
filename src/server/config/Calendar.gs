function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function dashboardPeriod_(view,now=new Date()){return readingWindow(view,recordDay(now,settings_().timezone));}
function dashboardQuery_(query={},now=new Date(),currentScope=true){
  query=geographyTabQuery(query);
  const view=query.view||'news',initial=query.initial,filters=Object.fromEntries([...subscriptionFilterKeys,'from','to','page','newsGeography','benchmark'].filter(key=>Object.hasOwn(query,key)).map(key=>[key,query[key]]));
  if(currentScope&&filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(!readingViews.includes(view))return filters;
  if(currentScope&&view==='briefing')return {...sectorNewsDefaults,...(!initial&&(filters.from||filters.to)?Object.fromEntries(['from','to'].filter(key=>filters[key]).map(key=>[key,filters[key]])):dashboardPeriod_(view,now))};
  if(currentScope&&view==='radar'){
    const year=String(query.year||'');if(year&&(!/^\d{4}$/.test(year)||Number(year)<2000||Number(year)>Number(recordDay(now,settings_().timezone).slice(0,4))))throw Error('Año no válido.');
    return {...sectorNewsDefaults,...Object.fromEntries(['entity','palanca','subpalanca'].filter(key=>filters[key]).map(key=>[key,filters[key]])),country:filters.country||'',...(year?{from:year+'-01-01',to:year+'-12-31'}:!initial&&(filters.from||filters.to)?Object.fromEntries(['from','to'].filter(key=>filters[key]).map(key=>[key,filters[key]])):dashboardPeriod_(view,now))};
  }
  const defaults={...(view==='radar'?{entity:''}:{}),...sectorNewsDefaults};
  return {...(initial?{...defaults,...(filters.newsGeography?{newsGeography:filters.newsGeography}:{})}:currentScope?{...filters,...sectorNewsDefaults}:filters),...(initial||currentScope&&!filters.from&&!filters.to?dashboardPeriod_(view,now):{})};
}
