export const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
export const segmentCoverageDefaults=Object.freeze({'Project Finance':'generalista'});
export const coverageOptions=Object.freeze({digital:'Canal digital',generalista:'Generalista'});
export const subscriptionFilterKeys=Object.freeze(['entity','country','source','type','segment','coverage','signal','search','palanca','subpalanca']);
export function geographyLabel(name){return name==='Sin determinar'?'Transversal':name;}
export function geographyOrder(a,b){return Number(a.name==='Sin determinar')-Number(b.name==='Sin determinar')||a.name.localeCompare(b.name,'es');}
export function entityOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||a.name.localeCompare(b.name,'es');}
export function entityVolumeOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||b.total-a.total||entityOrder(a,b);}
