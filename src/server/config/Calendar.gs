function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function recentNewsRange_(now=new Date()){
  const end=calendarDate_(now),start=new Date(end);start.setUTCDate(start.getUTCDate()-6);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
function currentMonth_(now=new Date()){
  const start=calendarDate_(now);start.setUTCDate(1);
  const end=new Date(start);end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
function newsRange_(range='week',now=new Date()){
  if(range==='week')return recentNewsRange_(now);
  if(range==='month')return currentMonth_(now);
  if(range==='year'){const year=calendarDate_(now).getUTCFullYear();return {from:year+'-01-01',to:year+'-12-31'};}
  throw Error('Período de contenido no válido.');
}
function personalDashboardQuery_(subscription,view,now=new Date()){
  const periodicity=Object.keys(newsletterCadences).find(key=>newsletterCadences[key].view===view),{from,to}=newsletterWindow(periodicity,recordDay(now,settings_().timezone));
  return {...subscriptionFilters_(subscription.filtros),from,to,view,initial:false};
}
function dashboardQuery_(query={},now=new Date()){
  const {view,initial}=query,filters=Object.fromEntries([...subscriptionFilterKeys,'from','to','page','newsGeography','benchmark'].filter(key=>Object.hasOwn(query,key)).map(key=>[key,query[key]]));
  if(filters.coverage&&!Object.hasOwn(coverageOptions,filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(view==='radar')return initial?{entity:'',...sectorNewsDefaults,...newsRange_('year',now)}:{...filters,...(!filters.from&&!filters.to?newsRange_('year',now):{})};
  if(view==='briefing')return {...(initial?{...sectorNewsDefaults,...recentNewsRange_(now)}:filters),...(!initial&&!filters.from&&!filters.to?recentNewsRange_(now):{})};
  const selection=initial?{entity:settings_().defaultEntity,...sectorNewsDefaults,country:settings_().defaultCountry,...currentMonth_(now)}:filters;
  return selection;
}
