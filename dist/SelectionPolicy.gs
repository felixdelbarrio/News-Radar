const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
const coverageOptions=Object.freeze({digital:'Canal digital',generalista:'Generalista'});
const subscriptionFilterKeys=Object.freeze(['entity','country','source','topic','type','segment','coverage','signal','search','palanca','subpalanca']);
function geographyLabel(name){return name==='Sin determinar'?'Transversal':name;}
function geographyOrder(a,b){return Number(a.name==='Sin determinar')-Number(b.name==='Sin determinar')||a.name.localeCompare(b.name,'es');}
