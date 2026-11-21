import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function records(bundle){
 if(bundle?.schema!==1||typeof bundle.sourceRevision!=='string'||!bundle.sourceRevision||!Array.isArray(bundle.records)||!Array.isArray(bundle.taxonomy))throw Error('Invalid frozen audit bundle');
 const taxonomy=new Map(),catalogueCounts=new Map();
 for(const row of bundle.taxonomy){
  const block=typeof row.palanca==='string'?row.palanca.match(/^\d{2}(?=[. ]|$)/)?.[0]:null,catalogueId=typeof row.subpalanca==='string'?row.subpalanca.match(/^\d{2}\.(?:\d{2}(?:\.\d{2})?|xx|XX)(?=[. ]|$)/)?.[0]||null:null;
  if(typeof row.id!=='string'||!row.id||taxonomy.has(row.id)||!block||typeof row.subpalanca!=='string'||catalogueId&&catalogueId.slice(0,2)!==block)throw Error('Invalid internal taxonomy mapping');
  taxonomy.set(row.id,{block,catalogueId});
  if(catalogueId)catalogueCounts.set(catalogueId,(catalogueCounts.get(catalogueId)||0)+1);
 }
 const byId=new Map();
 for(const row of bundle.records){
  if(typeof row.id!=='string'||!row.id||byId.has(row.id)||typeof row.language!=='string'||!/^[a-f0-9]{64}$/.test(row.contentHash))throw Error('Invalid or duplicate audit record');
  if(!Array.isArray(row.blocks)||new Set(row.blocks).size!==row.blocks.length||row.blocks.some(x=>!/^\d{2}$/.test(x)))throw Error('Invalid functional blocks');
  if(!Array.isArray(row.internalIds)||new Set(row.internalIds).size!==row.internalIds.length||row.internalIds.some(x=>typeof x!=='string'||!x)||row.primary!==(row.internalIds[0]||''))throw Error('Invalid internal assignment contract');
  if(row.internalIds.some(id=>!taxonomy.has(id))||!same([...new Set(row.internalIds.map(id=>taxonomy.get(id).block))].sort(),row.blocks.slice().sort()))throw Error('Incoherent internal taxonomy mapping');
  const catalogueIds=row.internalIds.map(id=>taxonomy.get(id).catalogueId);
  if(row.catalogueIds&&!same(row.catalogueIds,catalogueIds))throw Error('Incoherent catalogue IDs');
  byId.set(row.id,{...row,catalogueIds,ambiguousCatalogue:catalogueIds.some(id=>id&&catalogueCounts.get(id)>1)});
 }
 return byId;
}
/** Regression against frozen history; human reference is restricted to explicit approvals. */
export function compareClassifierAudit(before,after,reference){
 const old=records(before),next=records(after);
 if(before.sourceRevision!==after.sourceRevision)throw Error('Source revision changed; comparison is invalid');
 const pins=after.library?.pins;
 if(!/^\d+$/.test(String(after.library?.version||''))||Number(after.library.version)<1||!pins||['expectedRevision','expectedRulesRevision','expectedTranslationsRevision','expectedAlgorithmVersion'].some(k=>typeof pins[k]!=='string'||!pins[k]))throw Error('Library version and four pinned revisions are required');
 const reviews=new Map();
 if(!Array.isArray(reference?.reviewedAssignments)||!Number.isSafeInteger(reference.approved)||reference.approved<1||reference.reviewedAssignments.length!==reference.approved)throw Error('Complete approved reference is required');
 for(const review of reference.reviewedAssignments){
  if(!review||typeof review.recordId!=='string'||!review.recordId||reviews.has(review.recordId)||!/^[a-f0-9]{64}$/.test(review.contentHash)||typeof review.reference!=='string'||!review.reference||!Array.isArray(review.ids)||!review.ids.length||new Set(review.ids).size!==review.ids.length||review.ids.some(id=>!/^\d{2}\.(?:\d{2}(?:\.\d{2})?|xx|XX)$/.test(id)))throw Error('Invalid approved reference');
  reviews.set(review.recordId,review);
 }
 const normalized=[...reviews.values()].map(({recordId,contentHash,ids,reference})=>({recordId,contentHash,ids,reference})).sort((a,b)=>a.recordId.localeCompare(b.recordId));
 const reviewRevision=createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
 if(after.library.reviewedAssignmentsRevision!==reviewRevision)throw Error('Reviewed reference revision changed or was not pinned');
 const failures=[],byLanguage=Object.create(null),add=(id,reason)=>failures.push({id,reason});let protectedRecords=0,approvedRecords=0,approvedCorrect=0;
 for(const [id,row] of old){
  const candidate=next.get(id),review=reviews.get(id),language=row.language||'unknown';byLanguage[language]??={protected:0,approved:0,approvedCorrect:0};
  if(!candidate){add(id,'missing-candidate');continue;}
  if(candidate.contentHash!==row.contentHash){add(id,'content-changed');continue;}
  if(candidate.language!==row.language){add(id,'language-changed');continue;}
  if(review){
   approvedRecords++;byLanguage[language].approved++;
   const blocks=[...new Set(review.ids.map(value=>value.slice(0,2)))].sort();
   if(review.contentHash!==row.contentHash){add(id,'approved-content-changed');continue;}
   if(candidate.ambiguousCatalogue){add(id,'ambiguous-reviewed-target');continue;}
   if(!same(candidate.blocks.slice().sort(),blocks)||!same(candidate.catalogueIds,review.ids)||candidate.internalIds.length!==review.ids.length){add(id,'approved-target-not-met');continue;}
   if(row.internalIds.length&&!same(row.internalIds,candidate.internalIds)){add(id,'approved-baseline-no-longer-unclassified');continue;}
   approvedCorrect++;byLanguage[language].approvedCorrect++;
  }else{
   protectedRecords++;byLanguage[language].protected++;
   if(!same(row.blocks.slice().sort(),candidate.blocks.slice().sort())||!same(row.internalIds,candidate.internalIds)||row.primary!==candidate.primary)add(id,'unapproved-category-change');
  }
 }
 for(const id of next.keys())if(!old.has(id))add(id,'unexpected-candidate');
 for(const id of reviews.keys())if(!old.has(id))add(id,'approved-id-not-in-frozen-history');
 return {schema:1,categoryGatePassed:failures.length===0,sourceRevision:before.sourceRevision,reviewRevision,baseline:old.size,candidate:next.size,protectedRecords,approvedRecords,approvedCorrect,approvedExpected:reviews.size,byLanguage,failures,scope:'Historical preservation plus explicitly adjudicated targets; not global independent quality or performance certification'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const paths=process.argv.slice(2);if(paths.length!==3)throw Error('Usage: node scripts/compare-classifier-audit.mjs baseline.json candidate.json approved.json');
 const result=compareClassifierAudit(...paths.map(file=>JSON.parse(fs.readFileSync(file,'utf8'))));console.log(JSON.stringify(result,null,2));if(!result.categoryGatePassed)process.exitCode=1;
}
