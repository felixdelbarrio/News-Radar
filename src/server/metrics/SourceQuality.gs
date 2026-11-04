const SOURCE_QUALITY=Object.freeze({rows:5000,seconds:120});
function sourceQualityData_(days,now=Date.now()){
 const started=Date.now(),limit=Math.min(settings_().eventLimit,SOURCE_QUALITY.rows),since=now-days*86400000,within=(row,key='fecha')=>{const value=Date.parse(row[key]);return value>=since&&value<=now;},feeds=configuredFeeds_(),groups=new Map(),entry=name=>{if(!groups.has(name)){const feed=feeds.find(row=>row.name===name);groups.set(name,{source:name,country:feed?.country||'',enabled:feed?.enabled??false,queries:0,attempts:0,successful:0,errors:0,retrieved:0,relevant:0,discarded:0,duplicates:0,reasons:{},lastQuery:'',lastNews:'',publishers:new Set(),news:0,local:0,unknown:0,coverageQueries:0,saturated:0});}return groups.get(name);};
 feeds.forEach(feed=>entry(feed.name));
 const audit=rows_('Auditoria',limit),tasks=rows_('Recopilacion',limit),coverage=rows_('Cobertura',limit),runs=rows_('Ejecuciones',limit),seen=new Set();
 for(const row of audit.filter(row=>within(row)&&row.resultado==='Fuente consultada')){
  const key=JSON.stringify([row.ejecucion,row.fecha,row.fuente,row.url]);if(seen.has(key))continue;seen.add(key);
  const group=entry(row.fuente),value=String(row.motivo||''),number=label=>Number(value.match(new RegExp('(\\d+) '+label))?.[1]||0);group.queries++;group.retrieved+=number('evaluadas');group.relevant+=number('relevantes');group.discarded+=number('excluidas');group.duplicates+=number('duplicadas');if(row.fecha>group.lastQuery)group.lastQuery=row.fecha;
  const raw=value.match(/; motivos (\{.*\})(?:; posible|$)/)?.[1];if(raw)try{for(const [reason,count] of Object.entries(JSON.parse(raw)))if(Number.isFinite(Number(count)))group.reasons[reason]=(group.reasons[reason]||0)+Number(count);}catch(_){}
 }
 // Attempts are ingestion attempts recorded by the existing task cursor, not redirects.
 for(const row of tasks.filter(row=>within(row,"actualizada")&&row.estado!=="Omitida")){
  const attempts=Math.max(0,Number(row.intentos)||0);if(!attempts)continue;const group=entry(row.fuente),successful=row.estado==="Completada"?1:0;group.attempts+=attempts;group.successful+=successful;group.errors+=Math.max(0,attempts-successful);if(row.actualizada>group.lastQuery)group.lastQuery=row.actualizada;
 }
 for(const row of coverage.filter(row=>within(row))){const group=entry(row.fuente);if(['OK','Parcial'].includes(row.estado)){group.coverageQueries++;if(row.saturada==='sí')group.saturated++;}}
 const sheet=newsSheet_(),count=Math.min(limit,Math.max(0,sheet.getLastRow()-1)),keys=RADAR.sheets.Noticias;
 if(count){
  const first=sheet.getLastRow()-count+1,metadata=sheet.getRange(first,keys.indexOf('fecha')+1,count,3).getDisplayValues(),sources=sheet.getRange(first,keys.indexOf('fuente')+1,count,1).getDisplayValues(),labels=sheet.getRange(first,keys.indexOf('clasificacion')+1,count,1).getDisplayValues();
  for(let i=0;i<count;i++){const [fecha,pais,medio]=metadata[i];if(!within({fecha}))continue;const group=entry(sources[i][0]),provenance=savedNewsLabels_(labels[i][0]).procedencia||{},confirmed=['high','medium'].includes(provenance.paisConfianza);group.news++;if(medio)group.publishers.add(medio);if(fecha>group.lastNews)group.lastNews=fecha;if(!pais||pais===settings_().unknownCountry||provenance.scope==='unknown')group.unknown++;if(confirmed&&pais===group.country)group.local++;}
 }
 const percentage=(n,d)=>d?Math.round(1000*n/d)/10:null,items=[...groups.values()].map(group=>({...group,publishers:group.publishers.size,availability:percentage(group.successful,group.attempts),localPercent:group.country&&group.country!==settings_().unknownCountry?percentage(group.local,group.news):null,unknownPercent:percentage(group.unknown,group.news),saturationPercent:percentage(group.saturated,group.coverageQueries)})).sort((a,b)=>a.source.localeCompare(b.source,'es'));
 const dates=audit.map(row=>row.fecha).filter(Boolean).sort(),timings=runs.filter(row=>within(row,'inicio')).map(row=>Date.parse(row.fin)-Date.parse(row.inicio)).filter(value=>Number.isFinite(value)&&value>=0).sort((a,b)=>a-b);
 return {items,days,since:new Date(since).toISOString(),retainedFrom:dates[0]||null,limited:[audit,tasks,coverage,runs].some(rows=>rows.length===limit)||count===limit,limit,retentionDays:settings_().retentionDays,cycles:{n:timings.length,medianMs:timings.length?timings[Math.floor(timings.length/2)]:null,p95Ms:timings.length>=20?timings[Math.ceil(timings.length*.95)-1]:null},measurement:{serverMs:Date.now()-started,rows:audit.length+tasks.length+coverage.length+runs.length+count,readRanges:count?7:4}};
}
function getSourceQuality(query={}){
 authorize_(true);const days=query.days?Number(query.days):30;if(![7,30,90].includes(days))throw Error('Período de calidad no válido.');
 const now=Date.now(),cache=CacheService.getScriptCache(),key='source-quality:'+RADAR.version+':'+configurationRevision_()+':'+days+':'+Math.floor(now/(SOURCE_QUALITY.seconds*1000));let data=readDashboardCache_(cache,key),cacheHit=Boolean(data);
 if(!data){data=sourceQualityData_(days,now);writeDashboardCache_(cache,key,data);}
 const status=String(query.status||''),matches={never:row=>!row.news&&!row.retrieved,errors:row=>row.errors>0,news:row=>row.news>0};if(status&&!matches[status])throw Error('Estado de fuente no válido.');
 const base=filterRecords(data.items,query,['source'],['source','country']),items=status?base.filter(matches[status]):base,sum=key=>base.reduce((n,row)=>n+row[key],0),queries=sum('queries'),errors=sum('errors');
 const overview=base.slice().sort((a,b)=>b.news-a.news||b.retrieved-a.retrieved||a.source.localeCompare(b.source,'es')).slice(0,8).map(({source,news,queries,errors,lastNews})=>({source,news,queries,errors,lastNews}));
 return {...data,...recordPage(items,query,ADMIN_PAGE_SIZE),overview,cacheHit,options:{source:data.items.map(row=>row.source),status:[['never','Sin noticias'],['errors','Con errores'],['news','Con noticias']]},metrics:{sources:base.length,never:base.filter(matches.never).length,withErrors:base.filter(matches.errors).length,news:sum('news'),queries,errors,retrieved:sum('retrieved'),relevant:sum('relevant'),discarded:sum('discarded'),duplicates:sum('duplicates'),saturated:sum('saturated')}};
}
