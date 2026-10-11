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
function dashboardQuery_(query={},now=new Date()){
  const {view,initial,language,...filters}=query;
  if(view==='radar')return {entity:initial?'':filters.entity||'',segment:initial?'Empresas e instituciones':filters.segment||''};
  const selection=initial?{entity:settings_().defaultEntity,segment:settings_().defaultSegment,topic:settings_().defaultTopic,country:settings_().defaultCountry,...currentMonth_(now)}:filters;
  return view==='briefing'?{...selection,...recentNewsRange_(now)}:selection;
}
