const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
const segmentCoverageDefaults=Object.freeze({'Project Finance':'generalista'});
const coverageOptions=Object.freeze({digital:'Canal digital',generalista:'Generalista'});
const subscriptionFilterKeys=Object.freeze(['entity','country','source','type','segment','coverage','signal','search','palanca','subpalanca']);
function geographyLabel(name){return name==='Sin determinar'?'Transversal':name;}
function geographyOrder(a,b){return Number(a.name==='Sin determinar')-Number(b.name==='Sin determinar')||a.name.localeCompare(b.name,'es');}
function entityOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||a.name.localeCompare(b.name,'es');}
function entityVolumeOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||b.total-a.total||entityOrder(a,b);}
