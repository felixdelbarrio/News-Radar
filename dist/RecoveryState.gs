function recoveryAvailability(jobs,requests=[]){
  const active=jobs.filter(job=>Number(job.pendientes)>0||['Preparando','En curso','En cola'].includes(job.estado));
  return {today:active.some(job=>job.tipo==='daily')||requests.some(request=>request.kind==='daily'),year:active.some(job=>job.tipo==='annual')||requests.some(request=>request.kind==='annual')};
}

function recoveryProgressJobs(jobs){
  const grouped=new Map();
  const active=job=>Number(job.pendientes)>0||['Preparando','En curso','En cola'].includes(job.estado);
  for(const job of jobs){
    const current=grouped.get(job.tipo);
    if(!current||Number(active(job))>Number(active(current))||(active(job)===active(current)&&String(job.inicio)>String(current.inicio)))grouped.set(job.tipo,job);
  }
  return [...grouped.values()].sort((a,b)=>Number(b.tipo==='daily')-Number(a.tipo==='daily')||String(a.tipo).localeCompare(String(b.tipo)));
}
