function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function dashboardPeriod_(view,now=new Date(),closed=false){if(view==='radar'){const year=Number(recordDay(now,settings_().timezone).slice(0,4))-(closed?1:0);return {from:year+'-01-01',to:year+'-12-31'};}const {from,to}=readingWindow(view,recordDay(now,settings_().timezone),closed);return {from,to};}
function dashboardQuery_(query={},now=new Date(),currentScope=true){
  const view=query.view||'news',initial=query.initial,filters=Object.fromEntries([...subscriptionFilterKeys,'from','to','page','newsGeography','benchmark'].filter(key=>Object.hasOwn(query,key)).map(key=>[key,query[key]]));
  if(currentScope&&filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(!readingViews.includes(view))return filters;
  if(currentScope&&view==='briefing')return {...sectorNewsDefaults,...dashboardPeriod_(view,now)};
  if(currentScope&&view==='radar'){const year=String(query.year||query.from?.slice(0,4)||dashboardPeriod_(view,now).from.slice(0,4));if(!/^\d{4}$/.test(year)||Number(year)<2000||Number(year)>Number(recordDay(now,settings_().timezone).slice(0,4)))throw Error('Año no válido.');return {...sectorNewsDefaults,country:initial?'':filters.country||'',from:year+'-01-01',to:year+'-12-31'};}
  const defaults={...(view==='radar'?{entity:''}:{}),...sectorNewsDefaults};
  return {...(initial?{...defaults,...(filters.newsGeography?{newsGeography:filters.newsGeography}:{})}:currentScope?{...filters,...sectorNewsDefaults}:filters),...(initial||!filters.from&&!filters.to?dashboardPeriod_(view,now):{})};
}
