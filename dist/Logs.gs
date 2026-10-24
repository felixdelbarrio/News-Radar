// All log views share filtering, totals, pagination and export selection.
const ADMIN_LOGS=Object.freeze({
 runs:{table:'Ejecuciones',date:'inicio',fields:['estado','id'],columns:['inicio','fin','estado','evaluadas','nuevas','errores']},
 newsletters:{table:'NewsletterEnvios',fields:['correo','estado','suscripcion'],columns:['fecha','correo','estado','noticias','detalle','edition']},
 daily:{table:'Adopcion',fields:['correo','vista','evento'],columns:['fecha','usuarios','sesiones','eventos']},
 accesses:{table:'NewsletterEventos',fields:['edicion','cadencia','correo'],columns:['fecha','edicion','correo','cadencia','sesion','destino']},
 interactions:{table:'NewsletterEventos',fields:['edicion','correo'],columns:['edicion','accesos','lecturas','exportaciones']},
 telemetry:{table:'Telemetria',fields:['operacion','estado'],columns:['fecha','operacion','duracion_ms','estado','detalle']},
 audit:{table:'Auditoria',fields:['fuente','resultado','ejecucion'],columns:['fecha','fuente','resultado','motivo','url']}
});
function adminLogSelection_(view,query){
 const spec=Object.hasOwn(ADMIN_LOGS,view)?ADMIN_LOGS[view]:null;if(!spec)throw Error('Registro no válido.');
 const limit=settings_().eventLimit,rows=rows_(spec.table,limit,view==='newsletters'?8:undefined),selected=filterRecords(rows,query,spec.fields,RADAR.sheets[spec.table].filter(key=>key!=='contenido'),spec.date||'fecha',settings_().timezone);
 let items=selected;
 if(view==='daily'){
  const days=new Map();for(const row of selected){const day=recordDay(row.fecha,settings_().timezone);if(!days.has(day))days.set(day,{fecha:day,users:new Set(),sessions:new Set(),eventos:0});const group=days.get(day);group.users.add(row.correo);group.sessions.add(row.correo+'|'+row.sesion);group.eventos++;}
  items=[...days.values()].map(row=>({fecha:row.fecha,usuarios:row.users.size,sesiones:row.sessions.size,eventos:row.eventos}));
 }else if(view==='interactions'){
  const groups=new Map();for(const row of selected){if(!groups.has(row.edicion))groups.set(row.edicion,{edicion:row.edicion,accesos:0,lecturas:0,exportaciones:0});const group=groups.get(row.edicion);if(row.evento==='acceso')group.accesos++;if(row.evento==='lectura')group.lecturas++;if(row.evento==='exportacion')group.exportaciones++;}items=[...groups.values()];
 }else if(view==='accesses')items=selected.filter(row=>row.evento==='acceso');
 if(view==='newsletters'){const editions=new Map(rows_('NewsletterEdiciones',undefined,10).filter(row=>row.estado==='Enviada').map(row=>[row.envio,row.id]));items=items.map(row=>({...row,edition:editions.get(row.id)||'',noticias:Number(String(row.detalle||'').match(/(?:^|; )(\d+) noticias incluidas/)?.[1]||0)}));}
 items=items.slice().reverse();
 return {items,columns:spec.columns,fields:spec.fields,options:recordOptions(rows,spec.fields),limit,limited:rows.length===limit,metrics:adminLogMetrics_(view,items)};
}
function getAdminLogs(view='runs',query={}){authorize_(true);const data=adminLogSelection_(view,query);return {...data,...recordPage(data.items,query,ADMIN_PAGE_SIZE)};}
function exportAdminLogs(view='runs',query={}){
 authorize_(true);const data=adminLogSelection_(view,query),cell=value=>'"'+String(safeCell_(value??'')).replace(/"/g,'""')+'"';
 return {csv:'\ufeff'+[data.columns,...data.items.map(row=>data.columns.map(key=>row[key]))].map(row=>row.map(cell).join(',')).join('\r\n'),count:data.items.length};
}

function adminLogMetrics_(view,items){
 const total=items.length,errors=items.filter(row=>['Error','Fallida','Revisar'].includes(row.estado)).length,sum=key=>items.reduce((count,row)=>count+Number(row[key]||0),0),unique=key=>new Set(items.map(row=>row[key]).filter(Boolean)).size;
 let cards=[['Resultados',total,'']];
 if(view==='runs')cards.push(['Evaluadas',sum('evaluadas'),''],['Nuevas',sum('nuevas'),''],['Por revisar',errors,'']);
 else if(view==='newsletters')cards.push(['Enviada',items.filter(row=>row.estado==='Enviada').length,''],['Noticias incluidas',sum('noticias'),''],['Por revisar',errors,'']);
 else if(view==='daily')cards.push(['Sesiones',sum('sesiones'),''],['Eventos',sum('eventos'),'']);
 else if(view==='accesses')cards.push(['Usuarios',unique('correo'),''],['Sesiones',unique('sesion'),'']);
 else if(view==='interactions')cards.push(['Accesos',sum('accesos'),''],['Lecturas',sum('lecturas'),''],['Exportaciones',sum('exportaciones'),'']);
 else if(view==='telemetry'){const timings=items.map(row=>Number(row.duracion_ms)).filter(Number.isFinite).sort((a,b)=>a-b);cards.push(['Latencia p95',timings.length?timings[Math.ceil(timings.length*.95)-1]+' ms':'—',''],['Errores',errors,'']);}
 else cards.push(['Fuentes',unique('fuente'),''],['Resultados',unique('resultado'),'']);
 return {total,errors,cards};
}
