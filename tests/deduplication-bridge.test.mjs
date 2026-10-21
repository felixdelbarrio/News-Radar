import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {storage} from './helpers/server.mjs';
import {readServerScript} from '../scripts/source.mjs';
function fixture(){let source=readServerScript('dist');for(const file of ['news/Deduplication.gs','metrics/Maintenance.gs'])source=source.replace(fs.readFileSync('dist/'+file.split('/').at(-1),'utf8'),fs.readFileSync('src/server/'+file,'utf8'));const s=storage(source);s.c.initializeConfiguration();return s;}
function bridge(){return [['a','BBVA impulsa pagos digitales tesorería automatización','a'],['b','BBVA impulsa pagos digitales comercios transferencias','b'],['c','BBVA impulsa pagos digitales tesorería comercios','Texto completo '.repeat(20)]].map(([id,titular,extracto])=>({id,titular,extracto,entidad:'BBVA',pais:'España',medio:'Editor',fecha:'2026-10-10',url:'https://example.test/'+id}));}
test('a lexical bridge unifies every matching component in one pass independently of input order',()=>{
 const {c}=fixture(),rows=bridge();for(const indexes of [[0,1,2],[1,0,2],[2,0,1],[0,2,1],[1,2,0],[2,1,0]]){
  const input=indexes.map(i=>rows[i]),aliases=[],survivors=c.uniqueNews_(input,aliases);assert.deepEqual(Array.from(survivors,row=>row.id),['c']);assert.equal(aliases.length,2);assert.ok(aliases.every(alias=>input[alias.representativeIndex].id==='c'));assert.deepEqual(Array.from(c.uniqueNews_(survivors),row=>row.id),['c']);
 }
});
test('RSS first-match lookup keeps its early exit while the generator enumerates both bridge matches',()=>{
 const {c}=fixture(),rows=bridge(),known={titles:new Map()},item=row=>({title:row.titular,date:row.fecha,entity:row.entidad,publisher:row.medio});c.rememberTitle_(known,item(rows[0]),0);c.rememberTitle_(known,item(rows[1]),1);
 let comparisons=0;const equivalent=c.equivalentEditorialTitle_;c.equivalentEditorialTitle_=(...args)=>{comparisons++;return equivalent(...args);};assert.equal(c.duplicateTitleEntry_(known,item(rows[2])),0);assert.equal(comparisons,1);assert.deepEqual(Array.from(c.duplicateTitleEntries_(known,item(rows[2]))),[0,1]);assert.equal(comparisons,3);
});
test('physical cleanup uses the complete bridge plan and preserves frozen archive articles with their original IDs',()=>{
 const s=fixture(),c=s.c,rows=bridge(),keys=vm.runInContext('RADAR.sheets.Noticias',c);for(const row of rows)c.append_('Noticias',[keys.map(key=>row[key]||'')]);const frozen=rows.slice(0,2).map(row=>['edition',JSON.stringify(c.packNews_(row))]);s.sheets.get('NewsletterContenido').grid.push(...frozen.map(row=>row.slice()));const plan=c.previewNewsDeduplication();assert.equal(plan.duplicates,2);assert.equal(c.cleanDuplicateNews().removed,2);assert.deepEqual(Array.from(c.rows_('Noticias'),row=>row.id),['c']);assert.deepEqual(s.sheets.get('NewsletterContenido').grid.slice(1),frozen);assert.deepEqual(s.sheets.get('NewsletterContenido').grid.slice(1).map(row=>c.unpackNews_(JSON.parse(row[1])).id),['a','b']);assert.equal(c.cleanDuplicateNews().removed,0);assert.equal(c.previewNewsDeduplication().duplicates,0);
});
