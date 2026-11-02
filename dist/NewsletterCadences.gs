const newsletterCadences=Object.freeze({fortnightly:{label:'Quincenal',view:'briefing',scope:'Novedades',weekday:1},quarterly:{label:'Trimestral',view:'news',scope:'Noticias',weekday:3}});
const newsletterComparisonLabels=Object.freeze({local:'Tu geografía',group:'El grupo en otras geografías',market:'El mercado internacional'});
function newsletterWindow(periodicity,day,closed=false){
 const cadence=newsletterCadences[periodicity];if(!cadence)throw Error('Periodicidad no válida.');
 const start=new Date(day+'T00:00:00Z'),end=new Date(start),month=start.getUTCMonth();
 if(periodicity==='fortnightly'){
  start.setUTCDate(start.getUTCDate()<=15?1:16);
  if(closed){if(start.getUTCDate()===1)start.setUTCMonth(month-1,16);else start.setUTCDate(1);}
  end.setTime(start.getTime());if(start.getUTCDate()===1)end.setUTCDate(16);else end.setUTCMonth(start.getUTCMonth()+1,1);
 }else{
  const months=3;
  start.setUTCMonth(Math.floor(month/3)*3,1);
  if(closed)start.setUTCMonth(start.getUTCMonth()-months);
  end.setTime(start.getTime());end.setUTCMonth(end.getUTCMonth()+months);
 }
 const cutoff=end.toISOString(),delivery=new Date(end);delivery.setUTCDate(delivery.getUTCDate()+(cadence.weekday-delivery.getUTCDay()+7)%7);end.setUTCDate(end.getUTCDate()-1);
 return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10),cutoff,available:delivery.toISOString().slice(0,10)};
}
// Inclusive business-calendar windows. Clamp the month subtraction at month end.
function readingWindow(view,day){
 const start=new Date(day+'T00:00:00Z');
 if(view==='briefing'||view==='radar')start.setUTCDate(start.getUTCDate()-(view==='briefing'?14:364));
 else if(view==='news'){const date=start.getUTCDate();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()-3);const end=new Date(start);end.setUTCMonth(end.getUTCMonth()+1,0);start.setUTCDate(Math.min(date,end.getUTCDate()));}
 else throw Error('Vista no válida.');
 return {from:start.toISOString().slice(0,10),to:day};
}
