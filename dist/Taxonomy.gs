// Sparse corpus statistics: no document matrix or retained article text.
const TAXONOMY_POLICY=Object.freeze({batchRows:100,maxMs:10000,maxCandidates:600,maxEmergingPerLever:3,minEmergingDocuments:2,maxTerms:24,checkpointRows:20,checkpointChars:40000,maxOverlapLinks:32,overlapContainment:.9,overlapSizeRatio:.6});
const leverRules=[
  ['Seguridad e identidad',['seguridad','identidad','fraud','biometr','autentic','kyc','ciber','security','identity']],
  ['Integración y automatización',['api','erp','integracion','automat','inteligencia','artificial','asistente','open banking','embedded','integration']],
  ['Pagos y cobros',['pago','cobro','tarjeta','wallet','payment','card','checkout','bizum']],
  ['Financiación digital',['financiacion','credito','prestamo','factoring','confirming','lending','loan','credit']],
  ['Tesorería y gestión financiera',['tesoreria','liquidez','cash','treasury','conciliacion','contabilidad','divisa','currency']],
  ['Inversión y ahorro',['inversion','ahorro','deposito','investment','saving','deposit']]
];
const definitionTerms=new WeakMap();
const stopwords=new Set(('de la el los las un una unos unas y o en con por para del al que como mas su sus se es son a e lo les este esta estos estas sobre entre desde hasta sin hoy nuevo nueva nuevos nuevas lanza presenta mejora anuncia ofrece banco banca empresa empresas cliente clientes servicio servicios producto productos the and or of to in on for with from by is are this that new bank banking customer customers business launch launches introduces announces ve bir bu icin ile yeni banka').split(' '));
const digitalWords=new Set(('digital online movil mobile app api ia ai generativa generative biometrico biometric biometrica biometricos biometrics token tokenizacion tokenization blockchain pago pagos payment payments wallet wallets onboarding identidad identity seguridad security fraude fraud instantaneo instantaneos instant instantanea instantaneas tesoreria treasury automatizacion automation embedded financiero financial finanzas finance credito credit lending ciberseguridad cybersecurity erp cloud nube open').split(' '));
function taxonomyText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i');}
function taxonomyLever(value){const text=taxonomyText(value);if(/\b(?:ai|ia)\b/.test(text))return 'Integración y automatización';return leverRules.find(([,terms])=>terms.some(term=>text.includes(term)))?.[0]||'Acceso y experiencia digital';}
function taxonomyDefinitions(capabilities){
  const definitions=new Map();
  for(const [segment,rows] of Object.entries(capabilities))for(const row of rows){
    if(!row.enabled)continue;
    const palanca=taxonomyLever(row.name),key=palanca+'|'+taxonomyText(row.name),entry=definitions.get(key)||{key,palanca,subpalanca:row.name,segments:[],terms:[]};
    entry.segments.push(segment);entry.terms.push(...row.terms.map(taxonomyText));definitions.set(key,entry);
  }
  for(const [subpalanca,terms] of [['APIs e integración',['api','apis']],['Inteligencia artificial',['ia','ai','inteligencia artificial','artificial intelligence']],['Banca online',['banca online','online banking','internet banking']],['Experiencia móvil',['app','aplicacion movil','mobile banking']]]){
    const palanca=taxonomyLever(subpalanca),key=palanca+'|'+taxonomyText(subpalanca);
    if(!definitions.has(key))definitions.set(key,{key,palanca,subpalanca,segments:['Empresas'],terms});
  }
  return [...definitions.values()].map(row=>({...row,segments:[...new Set(row.segments)].sort(),terms:[...new Set(row.terms)].sort().slice(0,TAXONOMY_POLICY.maxTerms)}));
}
function taxonomyTermCounts(text,terms){
  const counts=new Map();
  for(const term of terms){
    let at=-1,count=0;
    while((at=text.indexOf(term,at+1))>=0)if((at===0||!/[a-z0-9]/.test(text[at-1]))&&(at+term.length===text.length||!/[a-z0-9]/.test(text[at+term.length])))count++;
    if(count)counts.set(term,count);
  }
  return counts;
}
function taxonomyObserve(state,text,definitions,excludedWords){
  const matched=[];
  for(const row of definitions){const counts=taxonomyTermCounts(text,row.terms);if(counts.size)matched.push({row,count:[...counts.values()].reduce((a,b)=>a+b,0)});}
  if(!matched.length)return false;
  state.documents++;
  if(state.size==null)state.size=Object.keys(state.candidates).length;
  const observed=[];
  const observe=(entry,count)=>{
    let stats=state.candidates[entry.key];
    if(!stats){if(entry.origin==='tf-idf'&&state.size>=TAXONOMY_POLICY.maxCandidates)return;stats=state.candidates[entry.key]={...entry,df:0,tf:0};state.size++;}
    stats.segments=[...new Set([...stats.segments,...entry.segments])].sort();stats.df++;stats.tf+=1+Math.log(count);observed.push(stats);
  };
  for(const {row,count} of matched)observe({...row,origin:'regla'},count);
  let known=definitionTerms.get(definitions);if(!known){known=new Set(definitions.flatMap(row=>row.terms));definitionTerms.set(definitions,known);}
  const tokens=(text.match(/[a-z][a-z0-9]+/g)||[]).slice(0,200),phrases=new Map();
  for(let i=1;i<tokens.length;i++){
    const a=tokens[i-1],b=tokens[i],term=a+' '+b;
    if(stopwords.has(a)||stopwords.has(b)||excludedWords.has(a)||excludedWords.has(b)||known.has(term)||(!digitalWords.has(a)&&!digitalWords.has(b)))continue;
    phrases.set(term,(phrases.get(term)||0)+1);
  }
  const segments=[...new Set(matched.flatMap(({row})=>row.segments))].sort();
  for(const [term,count] of phrases){
    const palanca=taxonomyLever(term),subpalanca=term.replace(/\b(?:api|ia|ai|erp)\b/g,word=>word.toUpperCase()).replace(/^./,letter=>letter.toUpperCase());
    observe({key:palanca+'|'+term,palanca,subpalanca,terms:[term],segments,origin:'tf-idf'},count);
  }
  for(const a of observed)for(const b of observed){
    if(a===b||a.palanca!==b.palanca)continue;
    a.overlap=a.overlap||{};if(Object.hasOwn(a.overlap,b.key)||Object.keys(a.overlap).length<TAXONOMY_POLICY.maxOverlapLinks)a.overlap[b.key]=(a.overlap[b.key]||0)+1;
  }
  return true;
}
function taxonomyRedundant(a,b){
 const common=Math.max(a.overlap?.[b.key]||0,b.overlap?.[a.key]||0),small=Math.min(a.df,b.df),large=Math.max(a.df,b.df);
 return a.palanca===b.palanca&&small>0&&common/small>=TAXONOMY_POLICY.overlapContainment&&small/large>=TAXONOMY_POLICY.overlapSizeRatio;
}
function taxonomyBuild(state){
  const rows=Object.values(state.candidates).map(row=>({...row,peso:Number((row.tf/Math.max(1,state.documents)*(Math.log((1+state.documents)/(1+row.df))+1)).toFixed(6))}));
  const anchors=[],rules=rows.filter(row=>row.origin==='regla').sort((a,b)=>a.subpalanca.length-b.subpalanca.length||a.key.localeCompare(b.key));
  for(const row of rules){const duplicate=anchors.find(other=>{const terms=new Set(other.terms),shared=row.terms.filter(term=>terms.has(term)).length;return Math.min(row.df,other.df)>=3&&shared/Math.max(1,Math.min(row.terms.length,other.terms.length))>=.5&&taxonomyRedundant(row,other);});if(duplicate){duplicate.terms=[...new Set([...duplicate.terms,...row.terms])].sort().slice(0,TAXONOMY_POLICY.maxTerms);}else anchors.push(row);}
  const emerging=rows.filter(row=>row.origin==='tf-idf'&&row.df>=TAXONOMY_POLICY.minEmergingDocuments).sort((a,b)=>b.df-a.df||b.peso-a.peso||a.key.localeCompare(b.key)),counts=new Map(),merged=new Set();
  for(const row of emerging){
    if(merged.has(row.key)||anchors.some(anchor=>anchor.origin==='regla'&&taxonomyRedundant(row,anchor)))continue;
    const other=emerging.find(candidate=>candidate!==row&&!merged.has(candidate.key)&&taxonomyRedundant(row,candidate));
    if(other){const overlap=Math.max(row.overlap?.[other.key]||0,other.overlap?.[row.key]||0);row.terms=[...new Set([...row.terms,...other.terms])].sort().slice(0,TAXONOMY_POLICY.maxTerms);row.df+=other.df-overlap;merged.add(other.key);}
    const count=counts.get(row.palanca)||0;if(count>=TAXONOMY_POLICY.maxEmergingPerLever)continue;counts.set(row.palanca,count+1);anchors.push(row);
  }
  return anchors.sort((a,b)=>a.palanca.localeCompare(b.palanca,'es')||a.subpalanca.localeCompare(b.subpalanca,'es'));
}
