export const NON_INCIDENT_SIGNAL='Sin incidencias operativas';
export const BRIEFING_ALLOWED_SIGNALS=Object.freeze(['Lanzamiento de producto','Mejora de oferta','Alianza estratégica']);
export function briefingAllowed(row){return row.senales?.length===1&&BRIEFING_ALLOWED_SIGNALS.includes(row.senales[0]);}
export const applicationScopeSegments=Object.freeze(['Empresas e instituciones']);
export const readingViews=Object.freeze(['news','briefing','radar']);
export const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
export const coverageOptions=Object.freeze({digital:'Canal digital'});
export const subscriptionFilterKeys=Object.freeze(['entity','country','source','type','segment','coverage','signal','search','palanca','subpalanca']);
export const otherGeography='Otras geografías';
export function geographyLabel(name){return !name||name==='Sin determinar'?otherGeography:name;}
export function applicationGeography(scopes,segment,geographies=[]){
  const countries=new Set(scopes.filter(scope=>!segment||scope.name===segment).flatMap(scope=>scope.countries));
  const region=new Map(geographies.map(row=>[row.name,row.region||''])),geography=row=>{const name=geographyLabel(row.pais);return countries.has(name)?name:otherGeography;};geography.region=country=>region.get(country)||'';geography.regions=[...new Set([...REGION_CODES.filter(code=>[...region.values()].includes(code)),...[...region.values()].filter(Boolean)])];return geography;
}
export function geographyOrder(a,b){return Number(a.name===otherGeography)-Number(b.name===otherGeography)||a.name.localeCompare(b.name,'es');}
export function entityOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||a.name.localeCompare(b.name,'es');}
export function entityVolumeOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||b.total-a.total||entityOrder(a,b);}

export const REGION_CODES=Object.freeze(['APAC','EMEA','AMER']);
export function countryRegion(country,geographies=[]){return geographies.find(row=>row.name===country)?.region||'';}
export function geographyMatches(row,selection,geography){
  return geography.regions.includes(selection)?geography(row)===otherGeography&&geography.region(row.pais)===selection:geography(row)===selection;
}
export function regionalGeographies(rows,geography){
  const totals=new Map(geography.regions.map(name=>[name,0]));
  for(const row of rows)if(geography(row)===otherGeography){const region=geography.region(row.pais);if(totals.has(region))totals.set(region,totals.get(region)+1);}
  return [...totals].map(([name,total])=>({name,total}));
}

export function geographyTabQuery(query,regions=REGION_CODES){
  return query.view==='news'&&(query.country===otherGeography||regions.includes(query.country))?{...query,country:'',newsGeography:query.country}:query;
}
