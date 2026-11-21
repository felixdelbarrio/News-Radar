import test from 'node:test';
import assert from 'node:assert/strict';
import {compareClassifierAudit} from '../scripts/compare-classifier-audit.mjs';
import {createHash} from 'node:crypto';
const pinReviews=(after,reference)=>{after.library.reviewedAssignmentsRevision=createHash('sha256').update(JSON.stringify(reference.reviewedAssignments)).digest('hex');};
function fixture(){
 const row=(id,blocks=[],internalIds=[])=>({id,contentHash:'a'.repeat(64),language:'es',blocks,internalIds,primary:internalIds[0]||''});
 const taxonomy=[{id:'internal-payment',palanca:'03.Pagos',subpalanca:'03.01 Transferencias'},{id:'different',palanca:'03.Pagos',subpalanca:'03.02 Otra operación'},{id:'second',palanca:'03.Pagos',subpalanca:'03.03 Otra operación'},{id:'internal-enablers-other',palanca:'17.Enablers',subpalanca:'17.xx Otros'}];
 const before={schema:1,sourceRevision:'frozen-1',taxonomy,records:[row('protected',['03'],['internal-payment']),row('approved')]};
 const after=structuredClone(before);after.library={version:'2',pins:{expectedRevision:'catalogue',expectedRulesRevision:'rules',expectedTranslationsRevision:'translations',expectedAlgorithmVersion:'algorithm'}};
 Object.assign(after.records[1],{blocks:['17'],internalIds:['internal-enablers-other'],primary:'internal-enablers-other',catalogueIds:['17.xx']});
 const reference={approved:1,reviewedAssignments:[{recordId:'approved',contentHash:'a'.repeat(64),ids:['17.xx'],reference:'synthetic-approval'}]};
 pinReviews(after,reference);
 return {before,after,reference};
}
test('only the explicitly approved unclassified record may change',()=>{const f=fixture(),r=compareClassifierAudit(f.before,f.after,f.reference);assert.equal(r.categoryGatePassed,true);assert.equal(r.protectedRecords,1);assert.equal(r.approvedCorrect,1);});
test('block, suboperation ID or primary drift in protected history blocks cutover',()=>{
 for(const change of [{internalIds:['different'],primary:'different'},{internalIds:['internal-payment','second']}]){
  const f=fixture();Object.assign(f.after.records[0],change);if(change.internalIds?.length===2)f.after.records[0].primary=change.internalIds[0];
  assert.equal(compareClassifierAudit(f.before,f.after,f.reference).categoryGatePassed,false);
 }
});
test('same block with the wrong approved suboperation is insufficient',()=>{const f=fixture();f.after.taxonomy.find(x=>x.id==='internal-enablers-other').subpalanca='17.16 API Channel';f.after.records[1].catalogueIds=['17.16'];assert.equal(compareClassifierAudit(f.before,f.after,f.reference).categoryGatePassed,false);});
test('missing approved IDs and unexpected rows cannot be silently skipped',()=>{const f=fixture();f.reference.approved=2;f.reference.reviewedAssignments.push({...f.reference.reviewedAssignments[0],recordId:'missing'});pinReviews(f.after,f.reference);assert.equal(compareClassifierAudit(f.before,f.after,f.reference).categoryGatePassed,false);});
test('changed text, revisions, duplicated rows or absent library pins invalidate comparison',()=>{
 let f=fixture();f.after.records[0].contentHash='b'.repeat(64);assert.equal(compareClassifierAudit(f.before,f.after,f.reference).categoryGatePassed,false);
 f=fixture();f.after.sourceRevision='new';assert.throws(()=>compareClassifierAudit(f.before,f.after,f.reference),/Source revision changed/);
 f=fixture();f.after.records.push(f.after.records[0]);assert.throws(()=>compareClassifierAudit(f.before,f.after,f.reference),/duplicate/);
 f=fixture();delete f.after.library.pins.expectedRulesRevision;assert.throws(()=>compareClassifierAudit(f.before,f.after,f.reference),/four pinned/);
});
test('claimed labels cannot mask a wrong internal ID or truncated approval manifest',()=>{
 let f=fixture();f.after.records[1].internalIds=['internal-payment'];f.after.records[1].primary='internal-payment';assert.throws(()=>compareClassifierAudit(f.before,f.after,f.reference),/Incoherent/);
 f=fixture();f.reference.approved=7;assert.throws(()=>compareClassifierAudit(f.before,f.after,f.reference),/Complete approved/);
});
test('ambiguous Others mapping cannot authorize a reviewed assignment',()=>{const f=fixture();f.after.taxonomy.push({id:'duplicate-other',palanca:'17.Enablers',subpalanca:'17.xx Otros'});assert.equal(compareClassifierAudit(f.before,f.after,f.reference).categoryGatePassed,false);});
test('review metadata cannot change after the candidate batch was produced',()=>{const f=fixture();f.reference.reviewedAssignments[0].reference='changed';assert.throws(()=>compareClassifierAudit(f.before,f.after,f.reference),/reference revision changed/);});
