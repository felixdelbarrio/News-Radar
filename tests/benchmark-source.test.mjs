import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {benchmarkSource,defaultBenchmarkBase} from '../scripts/benchmark-source.mjs';
test('benchmark base queda fijada antes del PR y permite una revisión explícita resuelta a SHA',()=>{
 const base=benchmarkSource(['--baseline']),head=benchmarkSource(['--baseline=HEAD']);
 assert.equal(base.revision,defaultBenchmarkBase);assert.notEqual(base.source,head.source);
 assert.equal(head.revision,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
 assert.equal(benchmarkSource(['--baseline='+defaultBenchmarkBase]).source,base.source);
 assert.deepEqual(benchmarkSource([]),{baseline:false,revision:null,source:null});
 assert.throws(()=>benchmarkSource(['--baseline=']),/no vacía/);
});
