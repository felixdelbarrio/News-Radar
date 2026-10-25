const BRIEFING_ALLOWED_SIGNALS=Object.freeze(['Lanzamiento de producto','Mejora de oferta','Alianza estratégica']);
function briefingAllowed(row){return row.senales?.length===1&&BRIEFING_ALLOWED_SIGNALS.includes(row.senales[0]);}
const applicationScopeSegments=Object.freeze(['Empresas e instituciones']);
const readingViews=Object.freeze(['news','briefing','radar']);
const sectorNewsDefaults=Object.freeze({segment:'Empresas e instituciones',coverage:'digital'});
const coverageOptions=Object.freeze({digital:'Canal digital'});
const subscriptionFilterKeys=Object.freeze(['entity','country','source','type','segment','coverage','signal','search','palanca','subpalanca']);
const otherGeography='Otras geografías';
function geographyLabel(name){return !name||name==='Sin determinar'?otherGeography:name;}
function applicationGeography(scopes,segment){
  const countries=new Set(scopes.filter(scope=>!segment||scope.name===segment).flatMap(scope=>scope.countries));
  return row=>{const name=geographyLabel(row.pais);return countries.has(name)?name:otherGeography;};
}
function geographyOrder(a,b){return Number(a.name===otherGeography)-Number(b.name===otherGeography)||a.name.localeCompare(b.name,'es');}
function entityOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||a.name.localeCompare(b.name,'es');}
function entityVolumeOrder(a,b){return Number(b.name==='BBVA')-Number(a.name==='BBVA')||b.total-a.total||entityOrder(a,b);}

const REGION_CODES=Object.freeze(['APAC','EMEA','AMER']);
const countryRegions=Object.freeze({"China": "APAC", "Hong Kong": "APAC", "Japón": "APAC", "Singapur": "APAC", "India": "APAC", "Australia": "APAC", "Indonesia": "APAC", "Corea del Sur": "APAC", "Vietnam": "APAC", "Filipinas": "APAC", "Malasia": "APAC", "Tailandia": "APAC", "México": "AMER", "Perú": "AMER", "Colombia": "AMER", "Argentina": "AMER", "Uruguay": "AMER", "Estados Unidos": "AMER", "Brasil": "AMER", "Chile": "AMER", "Venezuela": "AMER", "Canadá": "AMER", "España": "EMEA", "Turquía": "EMEA", "Italia": "EMEA", "Alemania": "EMEA", "Francia": "EMEA", "Portugal": "EMEA", "Reino Unido": "EMEA", "Suiza": "EMEA", "Países Bajos": "EMEA", "Bélgica": "EMEA", "Rumanía": "EMEA", "Emiratos Árabes Unidos": "EMEA"});
function countryRegion(country){return countryRegions[country]||'';}
function geographyMatches(row,selection,geography){
  return REGION_CODES.includes(selection)?geography(row)===otherGeography&&countryRegion(row.pais)===selection:geography(row)===selection;
}
function regionalGeographies(rows,geography){
  const totals=new Map(REGION_CODES.map(name=>[name,0]));
  for(const row of rows)if(geography(row)===otherGeography){const region=countryRegion(row.pais);if(totals.has(region))totals.set(region,totals.get(region)+1);}
  return [...totals].map(([name,total])=>({name,total}));
}

function geographyTabQuery(query){
  return query.view==='news'&&(query.country===otherGeography||REGION_CODES.includes(query.country))?{...query,country:'',newsGeography:query.country}:query;
}
