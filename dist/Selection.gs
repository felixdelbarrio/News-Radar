function snapshotEntity_(value){return String(value||'').trim();}
function newsReadingGeography_(context,query){return context?.cadence==='fortnightly'&&query.benchmark==='international'&&!query.country?()=> 'Otras geografías':applicationGeography(context?.scope||configuration_().applicationScope,query.segment);}
function newsGeographySelection_(rows,query,geography=applicationGeography(configuration_().applicationScope,query.segment)){
  return query.newsGeography?rows.filter(row=>geography(row)===query.newsGeography):rows;
}
function searchText_(value) {
  return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').trim();
}
function newsScope_(row,query,entity,entityName=entityKey_,geography){
  return (!query.country||(query.country===otherGeography?(geography||applicationGeography(configuration_().applicationScope,query.segment))(row)===otherGeography:row.pais===query.country))&&(!entity||entityName(row.entidad)===entity)&&(!query.source||row.medio===query.source||row.fuente===query.source)&&(!query.from||row.fecha>=query.from)&&(!query.to||row.fecha<=query.to);
}
function selectNews_(rows,query){
  const entity=query.entity?entityKey_(query.entity):'';
  return selectAnnotatedNews_(annotateNews_(rows.filter(row=>newsScope_(row,query,entity))),query);
}
function selectAnnotatedNews_(rows,query,entityName=entityKey_,identities=false,geography) {
  const q=searchText_(String(query.search||'').slice(0,160));
  if(query.from && query.to && query.from>query.to)throw new Error('La fecha desde debe ser anterior o igual a la fecha hasta.');
  const entity=query.entity?entityName(query.entity):'';
  const selected=rows.filter(r=>(!q || searchText_(r.titular+' '+r.extracto+' '+r.entidad+' '+r.medio).includes(q)) && newsScope_(r,query,entity,entityName,geography) && (!query.type || r.tipo===query.type) && (!query.segment || r.segmentos.includes(query.segment)) && (!query.signal || r.senales.includes(query.signal)) && (!query.coverage || r.etiquetas?.[query.coverage]===true) && (!query.palanca || r.taxonomia.some(item=>item.palanca===query.palanca)) && (!query.subpalanca || r.taxonomia.some(item=>item.subpalanca===taxonomySubLabel(query.subpalanca)&&(!query.palanca||item.palanca===query.palanca))));
  return uniqueNews_(identities||entityName===snapshotEntity_?selected:translationIdentityRows_(selected)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function newsDashboard_(rows, query, feeds,view='radar',context=null,pagination=null,previousRows=null) {
  const identities=Boolean(context)||view==='radar';if(!context&&view==='radar')rows=translationIdentityRows_(rows);
  const entityName=context?snapshotEntity_:entityKey_,geography=newsReadingGeography_(context,query),selected=selectAnnotatedNews_(view==='briefing'?rows.filter(briefingAllowed):rows,query,entityName,identities,geography),radar=view==='radar'?radarMetrics_(selected,query,context?.geographies,entityName):null;
  if(radar){radar.outages=radarOutageSelection_(selected,query,entityName,previousRows);const available={total:0,from:'',to:'',limited:false},period=['country','entity','source','search','type','segment','signal','coverage','palanca','subpalanca'].some(key=>query[key])?uniqueNews_(rows.filter(row=>newsScope_(row,{from:query.from,to:query.to},''))):selected;for(const row of period){available.total++;if(!available.from||row.fecha<available.from)available.from=row.fecha;if(row.fecha>available.to)available.to=row.fecha;}radar.available=available;}
  const newsGeographies=view==='news'?noveltyOverview(selected,[],geography).geographies.map(({name,total})=>({name,total})):[],newsGeography=newsGeographies.some(row=>row.name===query.newsGeography)?query.newsGeography:newsGeographies[0]?.name||'',visible=view==='news'?newsGeographySelection_(selected,{...query,newsGeography},geography):selected;
  const page=Math.min(Math.max(0,Math.floor(Number(query.page)||0)),Math.max(0,Math.ceil(visible.length/settings_().pageSize)-1));
  const ordered=view==='news'&&pagination?newsEntityGroups(visible).flatMap(group=>group.items):visible;if(pagination)pagination(ordered);
  const values=items=>[...new Set(items.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  return {...taxonomyOptions_(),items:view==='news'&&!pagination?newsEntityPage(visible,page*settings_().pageSize,settings_().pageSize):ordered.slice(page*settings_().pageSize,(page+1)*settings_().pageSize),total:visible.length,contextTotal:selected.length,...(view==='news'?{newsGeographies,newsGeography}:{}),page,pageSize:settings_().pageSize,
    countries:values((query.country?selectAnnotatedNews_(rows,{...query,country:''},entityName,identities,geography):selected).map(row=>row.pais)),entities:values([...rows.map(r=>entityName(r.entidad)),...feeds.map(f=>entityName(f.entity))]),sources:values(rows.map(r=>r.medio)),types:values(configuration_().entities.filter(row=>row.enabled).map(row=>row.type)),segments:configuration_().segments.filter(row=>row.enabled).map(row=>row.name),signals:view==='briefing'?[...BRIEFING_ALLOWED_SIGNALS]:configuration_().signals.filter(row=>row.enabled).map(row=>row.name),...(radar?{radar,stats:radar.summary,heatmap:taxonomyHeatmap_(selected,entityName)}:{}),...(view==='briefing'?{briefing:briefing_(selected,true,geography)}:{})};
}
function newsCsv_(rows, query, language='es',prepared=false,names,entityName=entityKey_,geography) {
  const label=taxonomyLanguage_(language,names),selected=prepared?selectAnnotatedNews_(rows,query,entityName,false,geography):selectNews_(rows,query),keys=[...RADAR.sheets.Noticias.filter(k=>!['id','capturada','clasificacion','taxonomia'].includes(k)),'tipo','segmentos','senales','bloques_funcionales','funcionalidades_suboperativas'];
  if(selected.length>settings_().exportLimit)throw new Error('Reduce el período para exportar hasta '+settings_().exportLimit+' publicaciones.');
  return {csv:'\ufeff'+[keys,...selected.map(r=>keys.map(k=>k==='bloques_funcionales'?[...new Set(r.taxonomia.map(item=>label(item.palanca)))].join(' · '):k==='funcionalidades_suboperativas'?r.taxonomia.map(item=>label(item.subpalanca)).join(' · '):r[k]))].map(row=>row.map(value=>'"'+String(safeCell_(value)||'').replace(/"/g,'""')+'"').join(';')).join('\r\n'),count:selected.length};
}
function entityKey_(entity){return businessIndex_().entities.get(searchText_(entity))?.name||String(entity||'').trim();}
