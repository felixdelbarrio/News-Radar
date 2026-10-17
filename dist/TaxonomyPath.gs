function taxonomyPath(row){return row.subpalanca?row.palanca+' › '+row.subpalanca:row.palanca;}
function taxonomySubLabel(value){return String(value||'').split(' › ').slice(1).join(' › ')||String(value||'');}
function taxonomyDisplayLabel(value){return taxonomySubLabel(value).replace(/^\d{2}\.(?:\d{2}\.|xx\s+)?\s*/, '');}
function taxonomyChoices(paths,selection={}){
  const rows=paths.map(value=>({value,palanca:value.split(' › ')[0],subpalanca:taxonomySubLabel(value)}));
  return {palanca:[...new Set(rows.filter(row=>!selection.subpalanca||row.subpalanca===taxonomySubLabel(selection.subpalanca)).map(row=>row.palanca))],subpalanca:rows.filter(row=>!selection.palanca||row.palanca===selection.palanca).map(row=>row.value)};
}
