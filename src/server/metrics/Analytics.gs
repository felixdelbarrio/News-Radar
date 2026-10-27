function metrics_(events,now) {
 const start=now-30*86400000,week=now-7*86400000,day=now-86400000,users=new Map(),sessions=new Set(),byDay=new Map(),latencies=[];let failures=0,count=0;
 for(const event of events){
  const time=Date.parse(event.fecha);if(!Number.isFinite(time)||time>now)continue;
  let user=users.get(event.correo);if(!user){user={correo:event.correo,first:event.fecha,last:event.fecha,sessions:new Set(),recentSessions:new Set(),actions:0,recentActions:0};users.set(event.correo,user);}
  user.first=user.first<event.fecha?user.first:event.fecha;user.last=user.last>event.fecha?user.last:event.fecha;user.sessions.add(event.sesion);user.actions++;
  if(time<start)continue;
  count++;user.recentActions++;user.recentSessions.add(event.sesion);sessions.add(event.correo+'|'+event.sesion);
  const key=recordDay(event.fecha,settings_().timezone);if(!byDay.has(key))byDay.set(key,{sessions:new Set(),users:new Set()});const daily=byDay.get(key);daily.sessions.add(event.correo+'|'+event.sesion);daily.users.add(event.correo);
  if(event.evento==='rendimiento')latencies.push(Number(event.duracion_ms));if(event.evento==='error')failures++;
 }
 const allUsers=[...users.values()].sort((a,b)=>b.last.localeCompare(a.last)).map(({recentSessions,recentActions,sessions,...user})=>({...user,sessions:sessions.size,recentSessions:recentSessions.size,recentActions})),recent=allUsers.filter(user=>Date.parse(user.last)>=start);
 latencies.sort((a,b)=>a-b);
 return {totalUsers:allUsers.length,allUsers,mau:recent.length,wau:recent.filter(user=>Date.parse(user.last)>=week).length,dau:recent.filter(user=>Date.parse(user.last)>=day).length,sessions:sessions.size,returning:recent.filter(user=>user.recentSessions>1).length,users:recent.map(user=>({...user,sessions:user.recentSessions,actions:user.recentActions})),daily:[...byDay].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,users:value.users.size,sessions:value.sessions.size})),latencyP95:latencies.length?latencies[Math.ceil(latencies.length*.95)-1]:null,failures,events:count};
}
