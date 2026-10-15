function administrativeRecords_(name,query,fields,searchFields,dateKey='fecha'){
  const limit=settings_().eventLimit,rows=rows_(name,limit,name==='NewsletterEnvios'?8:RADAR.sheets[name].length).flatMap(row=>{if(name!=='Ejecuciones'||!query.id&&!query.from&&!query.to)return [row];const summary=retainedSummary_(row.errores);return summary?.events?summary.events.map(values=>Object.fromEntries(RADAR.sheets.Ejecuciones.map((key,i)=>[key,values[i]]))):[row];}),selected=filterRecords(rows,query,fields,searchFields,dateKey,settings_().timezone);
  return {...recordPage(selected.reverse(),query,settings_().pageSize),options:recordOptions(rows,fields),limited:rows.length===limit,limit};
}
