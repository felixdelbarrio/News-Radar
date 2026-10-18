import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {storage} from '../tests/helpers/server.mjs';
const input=process.argv.find(arg=>arg.startsWith('--input='))?.slice(8),output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);
if(!input)throw Error('Indica --input=<Noticias.json>; la copia local no forma parte del repositorio.');
const bytes=fs.readFileSync(input),articles=JSON.parse(bytes),s=storage(),c=s.c;c.initializeConfiguration();c.publishTaxonomy_({documents:0,candidates:{}});
const keys=vm.runInContext('RADAR.sheets.Noticias',c),grid=s.sheets.get('Noticias').grid;
// Preserve the original snapshot verbatim, bypassing synthetic test-fixture materialization.
for(const row of articles)Array.prototype.push.call(grid,keys.map(key=>String(row[key]??'')));c.invalidateNews_();
const identity=rows=>createHash('sha256').update(JSON.stringify(rows.map(row=>[row.id,row.url,row.fecha,row.capturada]))).digest('hex'),before=identity(articles);
function drain(){let batches=0;const start=performance.now();while(c.ingestionMigrationPending_()&&batches<10000){c.ingestionMigrationBatch_();batches++;const job=c.ingestionMigrationJob_();if(job.state==='En pausa')throw Error(job.error);if(batches%20===0)process.stderr.write(JSON.stringify({batches,phase:job.phase,classified:job.classified,total:job.total})+'\n');}if(c.ingestionMigrationPending_())throw Error('Migración sin completar');return {batches,ms:Math.round(performance.now()-start),job:c.ingestionMigrationJob_()};}
c.startIngestionMigration(true);const dryRun=drain();if(identity(c.rows_('Noticias'))!==before)throw Error('La prueba ha modificado identidades.');
c.startIngestionMigration(false);const promotedInMemory=drain(),after=c.rows_('Noticias');if(identity(after)!==before)throw Error('Se han modificado identidades históricas.');
const states=Object.fromEntries(['relevante','no relevante','indeterminado'].map(state=>[state,after.filter(row=>JSON.parse(row.clasificacion).estado===state).length]));
const report={scope:'Ensayo local en memoria; no escribe Google Sheets ni despliega Apps Script.',inputSha256:createHash('sha256').update(bytes).digest('hex'),inputRows:articles.length,outputRows:after.length,identityDigestBefore:before,identityDigestAfter:identity(after),dryRun,promotedInMemory,states,snapshotsComplete:!c.dashboardSnapshotsPending_(),snapshots:Object.fromEntries(['briefing','news','radar'].map(view=>[view,c.dashboardSnapshotManifest_(view)]))};
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2));
