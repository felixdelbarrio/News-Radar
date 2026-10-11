import test from 'node:test';
import assert from 'node:assert/strict';
import coverageLibrary from 'istanbul-lib-coverage';
import {coverageFailures,coverageMetrics} from '../scripts/coverage-policy.mjs';
import {sourceCoverage} from '../scripts/coverage-source.mjs';
test('el umbral estricto rechaza 80 %, métricas ausentes y cualquier categoría insuficiente',()=>{
 const summary=Object.fromEntries(coverageMetrics.map(metric=>[metric,{covered:81,total:100}]));assert.deepEqual(coverageFailures(summary),[]);
 for(const metric of coverageMetrics){assert.deepEqual(coverageFailures({...summary,[metric]:{covered:80,total:100}}),[metric]);assert.deepEqual(coverageFailures({...summary,[metric]:{covered:0,total:0}}),[metric]);}
 assert.deepEqual(coverageFailures({}),coverageMetrics);
});
test('el informe cuenta fuentes nunca ejecutadas con cobertura cero',()=>{
 const coverage=coverageLibrary.createCoverageMap({});coverage.addFileCoverage(sourceCoverage('export function unused(value){return value?1:0;}','/unexecuted.js'));
 const summary=coverage.getCoverageSummary();assert.deepEqual(coverageFailures(summary),coverageMetrics);assert.equal(summary.lines.covered,0);assert.equal(summary.functions.total,1);
});
