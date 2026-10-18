// Sparse statistics and bounded evidence; article bodies are never retained.
const TAXONOMY_POLICY=Object.freeze({version:'3.7.2',batchRows:100,maxMs:10000,maxCandidates:600,maxEmergingPerLever:3,minEmergingDocuments:3,minEmergingSources:2,maxTerms:24,checkpointRows:20,checkpointChars:40000,maxAssignments:3,maxOverlapLinks:32,overlapContainment:.8,overlapSizeRatio:.5});
const definitionIndexes=new WeakMap(),taxonomyDefinitionMemory=new WeakMap(),rankingIndexes=new WeakMap();
function taxonomyText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i');}
const words=value=>taxonomyText(value).match(/[a-z][a-z0-9]+/g)||[];
function taxonomyDefinitions(blocks){
 if(taxonomyDefinitionMemory.has(blocks))return taxonomyDefinitionMemory.get(blocks);
 const definitions=blocks.flatMap(block=>[
  {key:block.name,palanca:block.name,subpalanca:'',segments:['Empresas'],terms:block.terms.map(taxonomyText),emerging:block.emerging},
  ...block.functions.map(row=>({key:row.id,palanca:block.name,subpalanca:row.id+'.'+row.name,segments:['Empresas'],description:row.description||'',context:(row.context||[]).map(taxonomyText),exclude:(row.exclude||[]).map(taxonomyText),terms:[...new Set([taxonomyText(row.name),...row.terms.map(taxonomyText)])]}))
 ]);taxonomyDefinitionMemory.set(blocks,definitions);return definitions;
}
function taxonomySeed(state,definitions){state.catalog=definitions;}
function taxonomyIndex(definitions){
 let index=definitionIndexes.get(definitions);if(index)return index;
 const functions=definitions.filter(row=>row.subpalanca),known=new Set(functions.flatMap(row=>row.terms.map(taxonomyText)));
 for(const block of definitions.filter(row=>!row.subpalanca))for(const concept of block.emerging)for(const term of concept.terms.map(taxonomyText))if(functions.some(row=>taxonomyTermCounts(taxonomyText(row.description),[term]).size))known.add(term);
 index={known};definitionIndexes.set(definitions,index);return index;
}
function taxonomyTermCounts(text,terms){
 const counts=new Map();
 for(const term of terms){if(!term)continue;let at=-1,count=0;while((at=text.indexOf(term,at+1))>=0)if((at===0||!/[a-z0-9]/.test(text[at-1]))&&(at+term.length===text.length||!/[a-z0-9]/.test(text[at+term.length])))count++;if(count)counts.set(term,count);}
 return counts;
}
// Compile once per catalogue, then rank bounded phrases by specificity and headline evidence.
const rankingWord=word=>word.length>4?word.replace(/s$/,''):word;
const rankingStopWords=new Set(words('landing de del la el y para con que en un una los las por se su sus al es esta este como donde todos todas cliente clientes permite permitir funcionalidad funcionalidades operativa canal producto productos información desde hasta sobre entre también actualmente través mediante disponer tener haber ser estar poder así más banco banca bancario empresarial empresa negocio pymes digital solución nuevo nueva sistema plataforma servicio gestión operar realizar uso proceso acceso mejora ofrecer incluir disponible usuario titular pago cobro cuenta crédito financiación tarjeta transferencia operación dato forma opción utilizar solicitud consulta reporte seguimiento the and of for to in on with that this from into a an is are can be will has have their it by as at or our your all more new business businesses enterprise corporate bank banking customer client company companies service product solution platform system digital web online mobile app application internet movil telefono phone linea payment pay money finance financial credit account card operation data use offer enable provide process ve bir bu için ile banka bankacilik şirket işletme hizmet yeni ürün ödeme sistem plataforma servicio pagamento servico empresa novo nuova sistema piattaforma').map(rankingWord));
function rankingIndex(definitions){
 let index=rankingIndexes.get(definitions);if(index)return index;
 const frequencies=new Map(),phrases=new Map(),canonical=new Map(),labels=new Map(),contexts=new Map(),rows=definitions.filter(row=>row.subpalanca);const contextWords=value=>words(value).map(rankingWord).filter(word=>!rankingStopWords.has(word)&&word.length>2);
 for(const row of rows){
  const tokens=new Set();for(const term of row.terms){if(!phrases.has(term))phrases.set(term,words(term).map(rankingWord));for(const word of phrases.get(term))tokens.add(word);}
  for(const word of contextWords(row.description))tokens.add(word);contexts.set(row,new Set(contextWords(row.description)));
  for(const word of tokens)frequencies.set(word,(frequencies.get(word)||0)+1);
  labels.set(row,taxonomyText(row.subpalanca.replace(/^\d{2}\.(?:\d{2}|xx)[. ]*/,'')));canonical.set(row,new Set(words(row.subpalanca).map(rankingWord).filter(word=>!rankingStopWords.has(word))));
 }
 const weights=new Map([...phrases].map(([term,tokens])=>[term,tokens.reduce((sum,word)=>sum+1+Math.log((1+rows.length)/(1+(frequencies.get(word)||0))),0)/Math.max(1,tokens.length)*(1+Math.log(1+tokens.length))]));
 const idf=new Map([...frequencies].map(([word,count])=>[word,1+Math.log((1+rows.length)/(1+count))]));
 const norms=new Map([...contexts].map(([row,tokens])=>[row,[...tokens].reduce((sum,word)=>sum+(idf.get(word)||0)**2,0)]));const minimumIdf=Math.min(4.8,1+Math.log((1+rows.length)/2));for(const [row,tokens] of contexts)contexts.set(row,[...tokens].filter(word=>(idf.get(word)||0)>=minimumIdf));
 index={weights,phrases,canonical,labels,contexts,norms,idf,blocks:new Map(definitions.filter(row=>!row.subpalanca).map(row=>[row.palanca,row]))};rankingIndexes.set(definitions,index);return index;
}
function taxonomyDecision(text,definitions,headline=''){
 const index=rankingIndex(definitions),title=taxonomyText(headline),tokens=new Set(words(text).map(rankingWord)),titleWords=new Set(words(title).map(rankingWord));let best,second;const ranked=[];
 for(const row of definitions){
  if(!row.subpalanca)continue;
  if(row.context?.length&&!taxonomyTermCounts(text,row.context).size||row.exclude?.length&&taxonomyTermCounts(text,row.exclude).size)continue;
  if(/(?:^|\.)landing\b/i.test(row.subpalanca)&&!/(?:landing|dashboard|visi[oó]n integral|vista (?:global|agregada)|posici[oó]n (?:global|integrada)|aggregate|aggregated|overview|bütünleşik|genel bakış)/i.test(text))continue;
  const terms=row.terms.filter(term=>row.context?.length||index.phrases.get(term)?.some(word=>!rankingStopWords.has(word))||term===index.labels.get(row)&&index.phrases.get(term).length>1),counts=taxonomyTermCounts(text,terms),context=index.contexts.get(row),shared=context.filter(word=>tokens.has(word));
  let semantic=0;if(shared.length>=3&&(!title||shared.some(word=>titleWords.has(word)))){const matched=shared.reduce((sum,word)=>sum+index.idf.get(word)**2,0),norm=index.norms.get(row);semantic=Math.sqrt(matched/Math.max(1,norm));}
  if(!counts.size&&semantic<.5)continue;
  const titleCounts=title?taxonomyTermCounts(title,[...counts.keys()]):new Map();
  let score=semantic*8,count=counts.size?0:shared.length;
  for(const [term,frequency]of counts){
   const nameEvidence=index.phrases.get(term)?.some(word=>index.canonical.get(row).has(word))?1.5:1,headlineEvidence=titleCounts.has(term)?4*(1+1/(1+title.indexOf(term)/80)):1;
   score+=(index.weights.get(term)||1)*(1+Math.log(frequency))*nameEvidence*headlineEvidence;count+=frequency;
  }
  const block=index.blocks.get(row.palanca);if(block&&taxonomyTermCounts(text,block.terms).size)score*=1.25;
  const evidence={terms:[...(titleCounts.size?titleCounts.keys():counts.size?counts.keys():shared.map(stem=>words(text).find(word=>rankingWord(word)===stem)))].slice(0,3),location:titleCounts.size?'headline':'text',method:counts.size?'literal':'description'},candidate={row,count,score,evidence};
  ranked.push(candidate);
  if(!best||score>best.score||score===best.score&&row.subpalanca.localeCompare(best.row.subpalanca,'es')<0){second=best;best=candidate;}else if(!second||score>second.score)second=candidate;
 }
 const distinct=second&&best.row.subpalanca.replace(/^\d{2}\.(?:\d{2}|xx)[. ]*/, '')!==second.row.subpalanca.replace(/^\d{2}\.(?:\d{2}|xx)[. ]*/, '');
 const ambiguous=best?.evidence.method==='description'&&distinct&&second.score>=best.score*.85;
 const matches=best&&!ambiguous?[best]:[];
 if(matches.length){
  const used=new Set(best.evidence.terms),ordered=ranked.filter(row=>row!==best).sort((a,b)=>b.score-a.score||a.row.subpalanca.localeCompare(b.row.subpalanca,'es'));
  for(const candidate of ordered){
   if(matches.length>=TAXONOMY_POLICY.maxAssignments)break;
   const independent=candidate.score>=best.score*.35&&taxonomyIndependentEvidence(candidate.evidence,[...used]);
   if(!independent)continue;
   matches.push(candidate);for(const term of candidate.evidence.terms)used.add(term);
  }
 }
 return {matches,reason:ambiguous?'ambiguous':best?'matched':'insufficient'};
}
const evidenceWord=word=>rankingWord(word).replace(word.length>5?/[oa]$/:/$^/,'');
function taxonomyIndependentEvidence(evidence,used){
 return evidence.method==='literal'&&evidence.terms.some(term=>words(term).length>=2&&words(term).some(word=>!rankingStopWords.has(rankingWord(word)))&&!used.some(previous=>words(previous).some(word=>!rankingStopWords.has(rankingWord(word))&&words(term).map(evidenceWord).includes(evidenceWord(word)))));
}
function taxonomyMatches(text,definitions,headline=''){return taxonomyDecision(text,definitions,headline).matches;}
function taxonomyObserve(state,text,definitions,excludedWords,evidence='',options={}){
 taxonomySeed(state,definitions);
 const matched=taxonomyMatches(text,definitions,options.headline);if(!matched.length&&!definitions.some(row=>!row.subpalanca&&(taxonomyTermCounts(text,row.terms).size||row.emerging.some(concept=>taxonomyTermCounts(text,concept.terms.map(taxonomyText)).size))))return false;
 state.documents++;state.size=Object.keys(state.candidates).length;
 const observed=[];
 const observe=(entry,count)=>{
  let stats=state.candidates[entry.key];
  if(!stats){if(state.size>=definitions.length+TAXONOMY_POLICY.maxCandidates)return;stats=state.candidates[entry.key]={...entry,df:0,tf:0,sources:[]};state.size++;}
  stats.primaryEvidence=Boolean(stats.primaryEvidence||entry.primaryEvidence);stats.df++;stats.tf+=1+Math.log(count);if(entry.origin==='tf-idf'){stats.terms=[...new Set([...stats.terms,...entry.terms])].slice(0,TAXONOMY_POLICY.maxTerms);if(evidence&&!stats.sources.includes(evidence)&&stats.sources.length<8)stats.sources.push(evidence);}observed.push(stats);
 };
 for(const {row,count}of matched)observe({...row,origin:'regla'},count);
 const {known}=taxonomyIndex(definitions);
 for(const block of definitions.filter(row=>!row.subpalanca))for(const concept of block.emerging){
  const terms=concept.terms.map(taxonomyText),name=taxonomyText(concept.name);
  if(known.has(name)||terms.some(term=>known.has(term))||excludedWords.has(name))continue;
  const counts=taxonomyTermCounts(text,terms);if(!counts.size)continue;
  const context=(concept.context||[]).map(taxonomyText),exclude=(concept.exclude||[]).map(taxonomyText);if(context.length&&!taxonomyTermCounts(text,context).size||exclude.length&&taxonomyTermCounts(text,exclude).size)continue;
  observe({key:block.key+'|'+name,palanca:block.palanca,subpalanca:block.palanca.slice(0,2)+'.xx '+concept.name,terms,context,exclude,segments:['Empresas'],origin:'tf-idf',primaryEvidence:Boolean(concept.primary&&options.primary&&taxonomyTermCounts(taxonomyText(options.headline),(concept.primaryTerms||terms).map(taxonomyText)).size)},[...counts.values()].reduce((a,b)=>a+b,0));
 }
 for(const a of observed)for(const b of observed){if(a===b)continue;a.overlap=a.overlap||{};if(Object.hasOwn(a.overlap,b.key)||Object.keys(a.overlap).length<TAXONOMY_POLICY.maxOverlapLinks)a.overlap[b.key]=(a.overlap[b.key]||0)+1;}
 return true;
}
function taxonomyRedundant(a,b){
 const common=Math.max(a.overlap?.[b.key]||0,b.overlap?.[a.key]||0),small=Math.min(a.df,b.df),large=Math.max(a.df,b.df);
 return small>0&&common/small>=TAXONOMY_POLICY.overlapContainment&&small/large>=TAXONOMY_POLICY.overlapSizeRatio;
}
function taxonomyBuild(state){
 const candidates=new Map((state.catalog||[]).map(row=>[row.key,{...row,origin:'regla',df:0,tf:0}]));
 for(const row of Object.values(state.candidates))candidates.set(row.key,row);
 const rows=[...candidates.values()].map(row=>({...row,peso:Number((row.tf/Math.max(1,state.documents)*(Math.log((1+state.documents)/(1+row.df))+1)).toFixed(6))}));
 const anchors=rows.filter(row=>row.origin==='regla'),blocks=new Set(anchors.map(row=>row.palanca)),counts=new Map();
 const emerging=rows.filter(row=>row.origin==='tf-idf'&&blocks.has(row.palanca)&&(row.primaryEvidence||row.df>=TAXONOMY_POLICY.minEmergingDocuments&&(row.sources?.length||0)>=TAXONOMY_POLICY.minEmergingSources)).sort((a,b)=>b.df-a.df||b.peso-a.peso||a.key.localeCompare(b.key));
 for(const row of emerging){
  if(anchors.some(anchor=>anchor.origin==='tf-idf'&&anchor.palanca===row.palanca&&taxonomyRedundant(row,anchor)))continue;
  const count=counts.get(row.palanca)||0;if(count>=TAXONOMY_POLICY.maxEmergingPerLever)continue;counts.set(row.palanca,count+1);anchors.push(row);
 }
 return anchors.sort((a,b)=>a.palanca.localeCompare(b.palanca,'es')||a.subpalanca.localeCompare(b.subpalanca,'es'));
}
