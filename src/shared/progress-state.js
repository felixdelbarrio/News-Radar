let dayFormatter;
export function nextDailyReset(now=Date.now(),timezone='UTC'){
  if(dayFormatter?.timezone!==timezone)dayFormatter={timezone,formatter:new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})};
  const parts=value=>Object.fromEntries(dayFormatter.formatter.formatToParts(new Date(value)).map(part=>[part.type,part.value])),day=parts(now),target=Date.UTC(Number(day.year),Number(day.month)-1,Number(day.day)+1);let result=target;
  for(let i=0;i<3;i++){const p=parts(result),local=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));result=target-(local-result);}
  return result;
}
export function progressState({state='Pendiente',queued=false,running=false,lastExecutedAt='',pausedUntil=0,quotaUntil=0,nextAt=0,waitingFor='',error=''},now=Date.now()){
  const active=queued||!['Completada','Parcial'].includes(state),pause=active?Math.max(Number(pausedUntil)||0,Number(quotaUntil)||0):0;
  return {state:running?'En curso':pause>now?quotaUntil>now?'Detenido por falta de cuota':'En pausa':active&&waitingFor?'En espera de otro trabajo':queued?'En cola':state,lastExecutedAt,pauseReason:pause>now?quotaUntil>now?'Cuota agotada':error||'Error temporal':'',restartAt:active&&Math.max(pause,Number(nextAt)||0)>now?Math.max(pause,Number(nextAt)||0):0,waitingFor:active&&!running?waitingFor:''};
}
