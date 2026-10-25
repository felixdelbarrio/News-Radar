// A preference inferred locally, never a claim about physical location.
const zoneCountries=Object.freeze({'Europe/Madrid':'ES','Atlantic/Canary':'ES','America/Mexico_City':'MX','America/Lima':'PE','America/Bogota':'CO','America/Argentina/Buenos_Aires':'AR','Europe/Istanbul':'TR','America/Montevideo':'UY','America/Caracas':'VE','America/Sao_Paulo':'BR','America/Toronto':'CA','America/Vancouver':'CA','America/Montreal':'CA','Asia/Dubai':'AE','Europe/London':'GB','Europe/Paris':'FR','Europe/Berlin':'DE','Europe/Rome':'IT','Europe/Lisbon':'PT','Asia/Singapore':'SG','Asia/Tokyo':'JP','Asia/Kolkata':'IN','Asia/Shanghai':'CN','Asia/Hong_Kong':'HK','Asia/Seoul':'KR','Asia/Bangkok':'TH','Asia/Jakarta':'ID','Asia/Manila':'PH','Asia/Kuala_Lumpur':'MY','Asia/Ho_Chi_Minh':'VN','Australia/Sydney':'AU','Australia/Melbourne':'AU','America/New_York':'US','America/Chicago':'US','America/Los_Angeles':'US'});
export function inferredCountryCode(languages=[],timeZone=''){
 if(zoneCountries[timeZone])return zoneCountries[timeZone];
 for(const language of languages){const match=String(language).match(/^[a-z]{2,3}(?:-[a-z]{4})?-([a-z]{2})(?:-|$)/i);if(match)return match[1].toUpperCase();}
 return '';
}
export function browserCountry(available=[]){
 const code=inferredCountryCode(navigator.languages||[navigator.language],Intl.DateTimeFormat().resolvedOptions().timeZone);
 if(!code)return '';
 const name=new Intl.DisplayNames(['es'],{type:'region'}).of(code);
 return !available.length||available.includes(name)?name:'';
}
