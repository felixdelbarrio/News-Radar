export function taxonomyPath(row){return row.palanca+' › '+row.subpalanca;}
export function taxonomySubLabel(value){return String(value||'').split(' › ').slice(1).join(' › ')||String(value||'');}
export function taxonomyChoices(paths,selection={}){
  const rows=paths.map(value=>({value,palanca:value.split(' › ')[0],subpalanca:taxonomySubLabel(value)}));
  return {palanca:[...new Set(rows.filter(row=>!selection.subpalanca||row.subpalanca===taxonomySubLabel(selection.subpalanca)).map(row=>row.palanca))],subpalanca:rows.filter(row=>!selection.palanca||row.palanca===selection.palanca).map(row=>row.value)};
}
