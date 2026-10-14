function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function dashboardPeriod_(view,now=new Date()){
  const cadence=Object.keys(newsletterCadences).find(key=>newsletterCadences[key].view===view);
  const {from,to}=newsletterWindow(cadence,recordDay(now,settings_().timezone));
  return {from,to};
}
function personalDashboardQuery_(subscription,view,now=new Date()){
  return {...subscriptionFilters_(subscription.filtros),...dashboardPeriod_(view,now),view,initial:false};
}
function dashboardQuery_(query={},now=new Date()){
  const view=query.view||'news',initial=query.initial,filters=Object.fromEntries([...subscriptionFilterKeys,'from','to','page','newsGeography','benchmark'].filter(key=>Object.hasOwn(query,key)).map(key=>[key,query[key]]));
  if(filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(!readingViews.includes(view))return filters;
  const defaults=view==='news'?{entity:settings_().defaultEntity,...sectorNewsDefaults,country:settings_().defaultCountry}:{...(view==='radar'?{entity:''}:{}),...sectorNewsDefaults};
  return {...(initial?defaults:filters),...(initial||!filters.from&&!filters.to?dashboardPeriod_(view,now):{})};
}
