function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function dashboardPeriod_(view,now=new Date(),closed=false){const {from,to}=readingWindow(view,recordDay(now,settings_().timezone),closed);return {from,to};}
function dashboardQuery_(query={},now=new Date(),currentScope=true){
  const view=query.view||'news',initial=query.initial,filters=Object.fromEntries([...subscriptionFilterKeys,'from','to','page','newsGeography','benchmark'].filter(key=>Object.hasOwn(query,key)).map(key=>[key,query[key]]));
  if(currentScope&&filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(!readingViews.includes(view))return filters;
  const defaults={...(view==='radar'?{entity:''}:{}),...sectorNewsDefaults};
  return {...(initial?{...defaults,...(filters.newsGeography?{newsGeography:filters.newsGeography}:{})}:currentScope?{...filters,...sectorNewsDefaults}:filters),...(initial||!filters.from&&!filters.to?dashboardPeriod_(view,now):{})};
}
