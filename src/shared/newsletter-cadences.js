export const newsletterCadences=Object.freeze({fortnightly:{label:'Quincenal',view:'briefing',scope:'Novedades',weekday:1},quarterly:{label:'Trimestral',view:'news',scope:'Noticias',weekday:3},yearly:{label:'Anual',view:'radar',scope:'Radar',weekday:5}});
export const newsletterComparisonLabels=Object.freeze({local:'Tu geografía',group:'El grupo en otras geografías',market:'El mercado internacional'});
export function newsletterWindow(periodicity,day,closed=false){
 const cadence=newsletterCadences[periodicity];if(!cadence)throw Error('Periodicidad no válida.');
 const start=new Date(day+'T00:00:00Z'),end=new Date(start),month=start.getUTCMonth();
 if(periodicity==='fortnightly'){
  start.setUTCDate(start.getUTCDate()<=15?1:16);
  if(closed){if(start.getUTCDate()===1)start.setUTCMonth(month-1,16);else start.setUTCDate(1);}
  end.setTime(start.getTime());if(start.getUTCDate()===1)end.setUTCDate(16);else end.setUTCMonth(start.getUTCMonth()+1,1);
 }else{
  const months=periodicity==='quarterly'?3:12;
  start.setUTCMonth(periodicity==='quarterly'?Math.floor(month/3)*3:0,1);
  if(closed)start.setUTCMonth(start.getUTCMonth()-months);
  end.setTime(start.getTime());end.setUTCMonth(end.getUTCMonth()+months);
 }
 const cutoff=end.toISOString(),delivery=new Date(end);delivery.setUTCDate(delivery.getUTCDate()+(cadence.weekday-delivery.getUTCDay()+7)%7);end.setUTCDate(end.getUTCDate()-1);
 return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10),cutoff,available:delivery.toISOString().slice(0,10)};
}
export function readingWindow(view,day,closed=false){
 const cadence=Object.keys(newsletterCadences).find(key=>newsletterCadences[key].view===view);return newsletterWindow(cadence,day,closed);
}
