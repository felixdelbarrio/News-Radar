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
  if(['news','briefing'].includes(view)&&filters.coverage&&!['generalista','digital'].includes(filters.coverage))throw Error('Filtro de cobertura no válido.');
  if(view==='briefing')return {...(initial?{segment:'Empresas e instituciones',coverage:'digital'}:filters),...recentNewsRange_(now)};
  const selection=initial?{entity:settings_().defaultEntity,segment:settings_().defaultSegment,topic:settings_().defaultTopic,country:settings_().defaultCountry,...currentMonth_(now)}:filters;
  if(view==='news'){selection.coverage=initial?'digital':selection.coverage||'';}
  else delete selection.coverage;
  return selection;
}
