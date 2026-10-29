import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';

function fixture(){
 const s=storage(),{c}=s;c.initializeConfiguration();
 const tables=vm.runInContext('RADAR.sheets',c);for(const [name,keys] of Object.entries(tables))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 const keys=tables.Noticias,news=s.sheets.get('Noticias');
 for(const id of ['funding-a','funding-b']){
  const row={id,fecha:'2026-10-20',pais:'España',entidad:'Standard Chartered',medio:'The Asset',titular:'ALVA lands $20M trade finance facility from Standard Chartered',extracto:'Trade finance facility',url:'https://example.com/'+id,clasificacion:JSON.stringify({digital:true,capacidades:['Empresas: Pagos'],procedencia:{feedUrl:'https://example.com/rss'}}),taxonomia:'{}'};
  news.grid.push(keys.map(key=>row[key]||''));news.grid.at(-1)[keys.indexOf('clasificacion')]=row.clasificacion;
 }
 const requests=()=>c.rows_('Noticias').map(row=>({id:row.id,expectedHash:c.newsCorrectionFingerprint_(row),reason:'Financiación concedida, sin nuevo canal digital.'}));
 return {...s,news,keys,requests};
}

test('selective maintenance validates all records, archives before writes and returns a guarded inverse',()=>{
 const {c,news,requests,archiveBooks}=fixture(),before=JSON.stringify(news.grid),plan=c.previewNewsClassificationCorrections(requests());
 assert.equal(JSON.stringify(news.grid),before);assert.equal(plan.changes.length,2);
 const result=c.applyNewsClassificationCorrections(plan);assert.equal(result.changed.length,2);assert.ok(result.archive.verified);assert.ok(archiveBooks.has(result.archive.id));
 for(const row of c.rows_('Noticias')){const labels=JSON.parse(row.clasificacion);assert.equal(labels.digital,false);assert.equal(labels.procedencia.feedUrl,'https://example.com/rss');assert.ok(labels.procedencia.editorial);}
 assert.throws(()=>c.applyNewsClassificationCorrections(plan),/Registro cambiado/);
 c.applyNewsClassificationCorrections(result.inverse.plan,result.inverse.rollback);assert.equal(JSON.stringify(news.grid),before);
});

test('stale evidence, duplicate IDs, wrong generation and unauthorized callers cannot mutate history',()=>{
 const s=fixture(),{c,news,keys,requests}=s,plan=c.previewNewsClassificationCorrections(requests());
 news.grid[2][keys.indexOf('titular')]+=' revised';const before=JSON.stringify(news.grid);
 assert.throws(()=>c.applyNewsClassificationCorrections(plan),/Registro cambiado/);assert.equal(JSON.stringify(news.grid),before);
 assert.throws(()=>c.previewNewsClassificationCorrections([requests()[0],requests()[0]]),/únicos/);
 assert.throws(()=>c.applyNewsClassificationCorrections({...plan,source:'other'}),/generación/);
 s.setEmail('visitor@outside.com');assert.throws(()=>c.previewNewsClassificationCorrections(requests()));assert.throws(()=>c.applyNewsClassificationCorrections(plan));assert.equal(JSON.stringify(news.grid),before);
});

test('archive failures and partial writes preserve the original cells',()=>{
 const {c,news,requests}=fixture(),plan=c.previewNewsClassificationCorrections(requests()),before=JSON.stringify(news.grid),archive=c.archiveSpreadsheet_;
 c.archiveSpreadsheet_=()=>{throw Error('archive unavailable');};assert.throws(()=>c.applyNewsClassificationCorrections(plan),/archive unavailable/);assert.equal(JSON.stringify(news.grid),before);c.archiveSpreadsheet_=archive;
 const getRange=news.getRange;let writes=0;news.getRange=(...args)=>{const range=getRange(...args),set=range.setValues;range.setValues=values=>{if(++writes===2)throw Error('write unavailable');return set(values);};return range;};
 assert.throws(()=>c.applyNewsClassificationCorrections(plan),/write unavailable/);assert.equal(JSON.stringify(news.grid),before);
});

test('reviewed exclusions survive maintenance without deleting general news or frozen history',()=>{
 const {c,news,requests}=fixture();c.applyNewsClassificationCorrections(c.previewNewsClassificationCorrections(requests()));
 assert.equal(c.deduplicateNews_(),0);assert.equal(news.getLastRow(),3);
});
