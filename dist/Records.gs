function administrativeRecords_(name,query,fields,searchFields,dateKey='fecha'){
  const limit=settings_().eventLimit,rows=rows_(name,limit,name==='NewsletterEnvios'?8:RADAR.sheets[name].length),selected=filterRecords(rows,query,fields,searchFields,dateKey,settings_().timezone);
  return {...recordPage(selected.reverse(),query,configuration_().storage.logRows),options:recordOptions(rows,fields),limited:rows.length===limit,limit};
}
