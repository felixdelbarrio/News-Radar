function newsGeographySelection_(rows,query,geography=applicationGeography(configuration_().applicationScope,query.segment)){
  return query.newsGeography?rows.filter(row=>geography(row)===query.newsGeography):rows;
}
function searchText_(value) {
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').trim();
}
function newsScope_(row,query,entity){
  return (!query.country||row.pais===query.country)&&(!entity||entityKey_(row.entidad)===entity)&&(!query.source||row.medio===query.source||row.fuente===query.source)&&(!query.from||row.fecha>=query.from)&&(!query.to||row.fecha<=query.to);
}
function selectNews_(rows,query){
  const entity=query.entity?entityKey_(query.entity):'';
  return selectAnnotatedNews_(annotateNews_(rows.filter(row=>newsScope_(row,query,entity))),query);
}
function selectAnnotatedNews_(rows, query) {
  const q=searchText_(String(query.search||'').slice(0,160));
  if(query.from && query.to && query.from>query.to)throw new Error('La fecha desde debe ser anterior o igual a la fecha hasta.');
  const entity=query.entity?entityKey_(query.entity):'';
  return uniqueNews_(rows.filter(r=>(!q || searchText_(r.titular+' '+r.extracto+' '+r.entidad+' '+r.medio).includes(q)) && newsScope_(r,query,entity) && (!query.type || r.tipo===query.type) && (!query.segment || r.segmentos.includes(query.segment)) && (!query.signal || r.senales.includes(query.signal)) && (!query.coverage || r.etiquetas?.[query.coverage]===true) && (!query.palanca || r.taxonomia.some(item=>item.palanca===query.palanca)) && (!query.subpalanca || r.taxonomia.some(item=>item.subpalanca===taxonomySubLabel(query.subpalanca)&&(!query.palanca||item.palanca===query.palanca))))).sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
function newsDashboard_(rows, query, feeds,view='radar') {
  const selected=selectAnnotatedNews_(rows,query),radar=view==='radar'?radarMetrics_(selected,query):null;
  if(radar){const available={total:0,from:'',to:'',limited:rows.length>=settings_().newsReadLimit};for(const row of uniqueNews_(rows.filter(row=>newsScope_(row,{from:query.from,to:query.to},'')))){available.total++;if(!available.from||row.fecha<available.from)available.from=row.fecha;if(row.fecha>available.to)available.to=row.fecha;}radar.available=available;}
  const geography=applicationGeography(configuration_().applicationScope,query.segment);
  const newsGeographies=view==='news'?noveltyOverview(selected,[],geography).geographies.map(({name,total})=>({name,total})):[],newsGeography=newsGeographies.some(row=>row.name===query.newsGeography)?query.newsGeography:newsGeographies[0]?.name||'',visible=view==='news'?newsGeographySelection_(selected,{...query,newsGeography},geography):selected;
  const page=Math.min(Math.max(0,Math.floor(Number(query.page)||0)),Math.max(0,Math.ceil(visible.length/settings_().pageSize)-1));
  const values=items=>[...new Set(items.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  return {...taxonomyOptions_(),items:view==='news'?newsEntityPage(visible,page*settings_().pageSize,settings_().pageSize):visible.slice(page*settings_().pageSize,(page+1)*settings_().pageSize),total:visible.length,...(view==='news'?{newsGeographies,newsGeography}:{}),page,pageSize:settings_().pageSize,
    countries:values((query.country?selectAnnotatedNews_(rows,{...query,country:''}):selected).map(row=>row.pais)),entities:values([...rows.map(r=>entityKey_(r.entidad)),...feeds.map(f=>entityKey_(f.entity))]),sources:values(rows.map(r=>r.medio)),types:values(configuration_().entities.filter(row=>row.enabled).map(row=>row.type)),segments:configuration_().segments.filter(row=>row.enabled).map(row=>row.name),signals:configuration_().signals.filter(row=>row.enabled).map(row=>row.name),...(radar?{radar,stats:radar.summary,heatmap:taxonomyHeatmap_(selected)}:{}),...(view==='briefing'?{briefing:briefing_(selected,true,geography)}:{})};
}
function newsCsv_(rows, query, language='es',prepared=false,names) {
  const label=taxonomyLanguage_(language,names),selected=prepared?selectAnnotatedNews_(rows,query):selectNews_(rows,query),keys=[...RADAR.sheets.Noticias.filter(k=>!['id','capturada','clasificacion','taxonomia'].includes(k)),'tipo','segmentos','senales','palancas','subpalancas'];
  if(selected.length>settings_().exportLimit)throw new Error('Reduce el período para exportar hasta '+settings_().exportLimit+' publicaciones.');
  return {csv:'\ufeff'+[keys,...selected.map(r=>keys.map(k=>k==='palancas'?[...new Set(r.taxonomia.map(item=>label(item.palanca)))].join(' · '):k==='subpalancas'?r.taxonomia.map(item=>label(item.subpalanca)).join(' · '):r[k]))].map(row=>row.map(value=>'"'+String(safeCell_(value)||'').replace(/"/g,'""')+'"').join(';')).join('\r\n'),count:selected.length};
}
function entityKey_(entity){return businessIndex_().entities.get(searchText_(entity))?.name||String(entity||'').trim();}
