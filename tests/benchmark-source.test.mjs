import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {benchmarkSource,defaultBenchmarkBase} from '../scripts/benchmark-source.mjs';
test('benchmark base queda fijada antes del PR y permite una revisión explícita resuelta a SHA',()=>{
 const base=benchmarkSource(['--baseline']),head=benchmarkSource(['--baseline=HEAD']);
 assert.equal(base.revision,defaultBenchmarkBase);assert.notEqual(base.source,head.source);
 assert.equal(head.revision,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
 assert.equal(benchmarkSource(['--baseline='+defaultBenchmarkBase]).source,base.source);
 assert.deepEqual(benchmarkSource([]),{baseline:false,revision:null,source:null});
 assert.throws(()=>benchmarkSource(['--baseline=']),/no vacía/);
});
test('la auditoría funcional compara por defecto con la revisión previa al catálogo y permite otra referencia explícita',()=>{
 const audit=args=>JSON.parse(execFileSync(process.execPath,['scripts/audit-functional-taxonomy.mjs',...args],{encoding:'utf8'})),baseline=JSON.parse(readFileSync('docs/functional-taxonomy-3.3.0-audit.json','utf8')).baseline,result=audit([]);
 assert.equal(result.baseline,baseline);assert.notEqual(result.baseline,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());assert.notEqual(result.runs[0].version,result.runs[1].version);
 assert.equal(audit(['--baseline=HEAD']).baseline,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
});
