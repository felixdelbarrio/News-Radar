import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {root} from '../scripts/source.mjs';

test('benchmark compara el servidor actual contra el commit fijo 3.7.2 y registra su procedencia',()=>{
 const report=JSON.parse(execFileSync(process.execPath,['scripts/benchmark-llm.mjs','3'],{cwd:root,encoding:'utf8'}));
 assert.deepEqual(report.baseline,{commit:'b915ebc5bb4cafd449017ccbbfbece74f5e0a1a9',version:'3.7.2'});
 assert.notEqual(report.currentVersion,report.baseline.version);
 assert.equal(report.total,3);assert.equal(report.valid,3);assert.equal(report.pending,0);
 for(const prefix of ['baseline-3.7.2','new-deterministic','new-llm'])for(const stage of ['snapshots','briefing','news','radar'])assert.ok(report.measurements.some(row=>row.label===prefix+':'+stage));
 const wrong=spawnSync(process.execPath,['scripts/benchmark-llm.mjs','3','f2201a4932717c5f586ebc4d0687d2e9756ffa62'],{cwd:root,encoding:'utf8'});
 assert.notEqual(wrong.status,0);assert.match(wrong.stderr,/baseline must be version 3.7.2/);
});
