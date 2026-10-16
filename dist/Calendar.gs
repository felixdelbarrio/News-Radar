function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function dashboardPeriod_(view,now=new Date(),closed=false){
  if(view==='news'){const start=calendarDate_(now);start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3-(closed?3:0),1);const end=new Date(start);end.setUTCMonth(end.getUTCMonth()+3);end.setUTCDate(0);return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};}
  const cadence=Object.keys(newsletterCadences).find(key=>newsletterCadences[key].view===view);
  const {from,to}=newsletterWindow(cadence,recordDay(now,settings_().timezone),closed);
  return {from,to};
}
function dashboardQuery_(query={},now=new Date(),currentScope=true){
  const view=query.view||'news',initial=query.initial,filters=Object.fromEntries([...subscriptionFilterKeys,'from','to','page','newsGeography','benchmark'].filter(key=>Object.hasOwn(query,key)).map(key=>[key,query[key]]));
  if(currentScope&&filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(!readingViews.includes(view))return filters;
  const defaults=view==='news'?{entity:settings_().defaultEntity,...sectorNewsDefaults,country:settings_().defaultCountry}:{...(view==='radar'?{entity:''}:{}),...sectorNewsDefaults};
  return {...(initial?defaults:currentScope?{...filters,...sectorNewsDefaults}:filters),...(initial||!filters.from&&!filters.to?dashboardPeriod_(view,now):{})};
}
