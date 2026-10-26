import test from 'node:test';
import assert from 'node:assert/strict';
import {files,read} from '../scripts/source.mjs';

test('responsive width and height thresholds always use CSS dimensions',()=>{
 for(const file of files('src/styles')){
  for(const condition of read(file).matchAll(/\((?:min-|max-)?(?:width|height)\s*:\s*([\d.]+)\s*\)/g))assert.equal(Number(condition[1]),0,`${file}: media query ignored by browsers: ${condition[0]}`);
 }
});
