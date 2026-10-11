export function recoveryAvailability(jobs,requests=[]){
  const active=jobs.filter(job=>Number(job.pendientes)>0||['Preparando','En curso','En cola'].includes(job.estado));
  return {today:active.some(job=>job.tipo==='daily')||requests.some(request=>request.kind==='daily'),year:active.some(job=>job.tipo==='annual')||requests.some(request=>request.kind==='annual')};
}
