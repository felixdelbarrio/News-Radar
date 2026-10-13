export const applicationScopeSegments=Object.freeze(['Empresas e instituciones','Retail']);
export const readingViews=Object.freeze(['news','briefing','radar']);
export const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
export const coverageOptions=Object.freeze({digital:'Canal digital',generalista:'Generalista'});
export const subscriptionFilterKeys=Object.freeze(['entity','country','source','type','segment','coverage','signal','search','palanca','subpalanca']);
export function geographyLabel(name){return name==='Sin determinar'?'Transversal':name;}
export function applicationGeography(scopes,segment){
  const countries=new Set(scopes.filter(scope=>!segment||scope.name===segment).flatMap(scope=>scope.countries));
  return row=>!row.pais||row.pais==='Sin determinar'?'Sin determinar':countries.has(row.pais)?row.pais:'Otras geografías';
}
export function geographyOrder(a,b){const rank=name=>name==='Otras geografías'?2:name==='Sin determinar'?1:0;return rank(a.name)-rank(b.name)||a.name.localeCompare(b.name,'es');}
export function entityOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||a.name.localeCompare(b.name,'es');}
export function entityVolumeOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||b.total-a.total||entityOrder(a,b);}
