export const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
export const coverageOptions=Object.freeze({digital:'Canal digital',generalista:'Generalista'});
export const subscriptionFilterKeys=Object.freeze(['entity','country','source','topic','type','segment','coverage','signal','search','palanca','subpalanca']);
export function geographyLabel(name){return name==='Sin determinar'?'Transversal':name;}
export function geographyOrder(a,b){return Number(a.name==='Sin determinar')-Number(b.name==='Sin determinar')||a.name.localeCompare(b.name,'es');}
