function calendarDate_(now){return new Date(recordDay(now,settings_().timezone)+'T00:00:00Z');}
function recentNewsRange_(now=new Date()){
  const end=calendarDate_(now),start=new Date(end);start.setUTCDate(start.getUTCDate()-6);
  return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)};
}
function sectorNewsFilters_(filters={segment:'Empresas e instituciones'}){
  const selection={...filters};
  if(selection.segment==='Empresas e instituciones'&&selection.topic==='Empresas y pymes')delete selection.topic;
  return selection;
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
  const filters=subscriptionFilters_(subscription.filtros);
  return {...filters,...newsRange_(view==='briefing'?'week':view==='news'?'month':'year',now),view,initial:false};
}
function dashboardQuery_(query={},now=new Date()){
  const {view,initial,...filters}=query;delete filters.language;delete filters.edition;delete filters.preference;delete filters.savePreference;
  if(view==='radar')return initial?{entity:'',...sectorNewsFilters_(),...newsRange_('year',now)}:filters;
  if(['news','briefing'].includes(view)&&filters.coverage&&!['generalista','digital'].includes(filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(view==='briefing')return {...(initial?{...sectorNewsFilters_(),...recentNewsRange_(now)}:filters),...(!initial&&!filters.from&&!filters.to?recentNewsRange_(now):{})};
  const selection=initial?{entity:settings_().defaultEntity,segment:settings_().defaultSegment,topic:settings_().defaultTopic,country:settings_().defaultCountry,...currentMonth_(now)}:filters;
  if(view==='news'){selection.coverage=initial?'digital':selection.coverage||'';}
  else delete selection.coverage;
  return selection;
}
