function radarMetrics_(rows,query,countries=configuration_().geographies,entityName=entityKey_) {
  const entities=new Map(),geographies=new Map(),publishers=new Map(),dates=new Map();
  const knownCountries=new Set(countries.map(row=>row.name));
  let unlocated=0;
  for(const row of rows){
    const entity=entityName(row.entidad);
    entities.set(entity,(entities.get(entity)||0)+1);
    if(row.medio)publishers.set(row.medio,(publishers.get(row.medio)||0)+1);
    for(const country of articleGeographies(row)){if(knownCountries.has(country)||REGION_CODES.includes(country)){const area=geographies.get(country)||new Map();area.set(entity,(area.get(entity)||0)+1);geographies.set(country,area);}else unlocated++;}
    const day=dates.get(row.fecha)||new Map();day.set(entity,(day.get(entity)||0)+1);dates.set(row.fecha,day);
  }
  const ranking=[...entities].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).map(([entity,total])=>({entity,total}));
  const days=[...dates.keys()].sort(),from=query.from||days[0],to=query.to||days.at(-1);
  const start=Date.parse(from),end=Date.parse(to),span=Number.isFinite(start)&&Number.isFinite(end)?Math.max(1,Math.floor((end-start)/86400000)+1):1,intervalDays=Math.max(1,Math.ceil(span/settings_().trendPoints));
  const buckets=days.length?Array.from({length:Math.ceil(span/intervalDays)},(_,i)=>new Date(start+i*intervalDays*86400000).toISOString().slice(0,10)):[];
  const groups=ranking.length>settings_().trendSeries?[...ranking.slice(0,settings_().trendSeries-1),{entity:'Otras entidades',total:ranking.slice(settings_().trendSeries-1).reduce((n,r)=>n+r.total,0)}]:ranking;
  const series=groups.map(({entity,total})=>({entity,total,values:Array(buckets.length).fill(0)})),index=new Map(series.map((row,i)=>[row.entity,i]));
  for(const [date,counts] of dates){
    const bucket=Math.floor((Date.parse(date)-start)/(intervalDays*86400000));
    for(const [entity,count] of counts){const group=index.get(entity)??series.length-1;if(bucket>=0&&bucket<buckets.length)series[group].values[bucket]+=count;}
  }
  const publicationRanking=[...publishers].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).map(([publisher,total])=>({publisher,total}));
  return {publishers:publicationRanking.slice(0,6),summary:{news:rows.length,entities:entities.size,sources:publishers.size,countries:geographies.size},ranking,
    geographies:[...geographies].map(([country,counts])=>({country,total:[...counts.values()].reduce((a,b)=>a+b,0),entities:[...counts].map(([entity,count])=>({entity,count}))})).sort((a,b)=>b.total-a.total||a.country.localeCompare(b.country,'es')),
    trend:{from:from||'',to:to||'',intervalDays,buckets,series},unlocated,latest:days.at(-1)||'',
    topPublisher:publicationRanking[0]?.publisher||''};
}
function radarPreviousPeriod_(query){
  const previous=value=>{const date=new Date(value+'T00:00:00Z'),month=date.getUTCMonth();date.setUTCFullYear(date.getUTCFullYear()-1);if(date.getUTCMonth()!==month)date.setUTCDate(0);return date.toISOString().slice(0,10);};
  return {from:previous(query.from),to:previous(query.to)};
}
function radarOutageSelection_(selected,query,entityName,previousRows){
  const previous=query.from&&query.to?radarPreviousPeriod_(query):null;
  return radarOutages_(selected,previousRows&&previous?selectAnnotatedNews_(previousRows,{...query,...previous},entityName,true):[],query,entityName,Boolean(previousRows));
}
function radarPreviousRows_(query){return query.from&&query.to?cachedNewsRecords_({...query,...radarPreviousPeriod_(query)}):[];}
function radarOutages_(rows,previousRows,query,entityName=entityKey_,comparable=true){
  const incident=row=>row.senales?.some(name=>name===INCIDENT_SIGNAL||name==='Incidencia operativa'),items=rows.filter(incident),prior=previousRows.filter(incident),entities=new Map(),vectors=new Map(),months=new Map();
  const from=query.from||rows.map(row=>row.fecha).sort()[0]||'',to=query.to||rows.map(row=>row.fecha).sort().at(-1)||'';
  const year=(to||from).slice(0,4);
  if(year)for(let month=1;month<=12;month++)months.set(year+'-'+String(month).padStart(2,'0'),0);
  for(const row of items){const entity=entityName(row.entidad),entry=entities.get(entity)||{entity,total:0,countries:new Map()};entry.total++;for(const country of articleGeographies(row))entry.countries.set(country,(entry.countries.get(country)||0)+1);entities.set(entity,entry);const month=row.fecha.slice(0,7);if(months.has(month))months.set(month,months.get(month)+1);const names=new Set((row.taxonomia||[]).map(tag=>tag.palanca).filter(Boolean));if(!names.size)names.add('Canales digitales');for(const name of names)vectors.set(name,(vectors.get(name)||0)+1);}
  const ranking=[...entities.values()].sort((a,b)=>b.total-a.total||a.entity.localeCompare(b.entity,'es')).map(row=>({...row,countries:[...row.countries].map(([country,total])=>({country,total}))})),functional=[...vectors].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'es')),active=new Set(rows.map(row=>entityName(row.entidad))).size,total=items.length;
  return {signal:INCIDENT_SIGNAL,from,to,total,previous:prior.length,comparable,change:comparable?(prior.length?Math.round((total-prior.length)/prior.length*100):total?null:0):null,affected:entities.size,active,ratio:active?Math.round(entities.size/active*100):0,top:ranking[0]||null,concentration:total?Math.round((ranking[0]?.total||0)/total*100):0,vector:functional[0]||null,ranking:ranking.slice(0,8),vectors:functional.slice(0,6),months:[...months].map(([month,total])=>({month,total})),latest:[...items].sort((a,b)=>b.fecha.localeCompare(a.fecha)||String(a.id).localeCompare(String(b.id))).slice(0,4).map(row=>({id:row.id,entity:entityName(row.entidad),country:row.pais,date:row.fecha,publisher:row.medio,title:plainText_(row.titular),text:{titular:row.titular,extracto:row.extracto,fuente:row.fuente,idioma:row.idioma},url:canonicalUrl_(row.url)})),summary:total?total+' incidencias operativas publicadas en '+entities.size+' entidades durante el período anual seleccionado. '+(ranking[0]?ranking[0].entity+' concentra el '+Math.round(ranking[0].total/total*100)+'% de las evidencias.':''):'Sin incidencias operativas registradas en el canal para los filtros y periodo anual seleccionados'};
}
