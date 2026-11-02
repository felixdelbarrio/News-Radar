import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
test('esperar clasificación o taxonomía no consume reintentos de publicación de una ingesta',()=>{
 const {c,properties:p}=storage();c.initializeConfiguration();const now=Date.now();
 c.append_('Recargas',[['ingestion','daily','','',new Date(now-3600000).toISOString(),'','Publicando',1,1,0,0,0,0,new Date(now-3600000).toISOString(),0]]);
 p.CLASSIFICATION_JOB=JSON.stringify({state:'En curso',next:40,total:100,updated:new Date(now).toISOString()});
 for(let i=0;i<5;i++)c.recoverBackgroundJobs_(now+i*600001);
 assert.equal(c.collectionJobs_()[0].estado,'Publicando');assert.equal(JSON.parse(p['PUBLICATION_RETRY:ingestion']).count,undefined);
 p.CLASSIFICATION_JOB=JSON.stringify({state:'Publicando',next:102,total:100,updated:new Date(now-3600000).toISOString()});p.TAXONOMY_JOB=JSON.stringify({state:'En curso'});
 c.recoverBackgroundJobs_(now+6*600001);assert.equal(JSON.parse(p.CLASSIFICATION_JOB).publicationRetries,undefined);assert.equal(JSON.parse(p.CLASSIFICATION_JOB).state,'Publicando');
 p.TAXONOMY_JOB=JSON.stringify({state:'Completada'});c.recoverBackgroundJobs_(now+6*600001+1);assert.equal(c.collectionJobs_()[0].estado,'Publicando');assert.equal(JSON.parse(p.CLASSIFICATION_JOB).publicationRetries,undefined);
 c.recoverBackgroundJobs_(now+7*600001+1);assert.equal(JSON.parse(p.CLASSIFICATION_JOB).publicationRetries,1);assert.equal(JSON.parse(p['PUBLICATION_RETRY:ingestion']).count,1);
});

test('reanudar una publicación revisada restaura su barrera y completa sus checkpoints al publicar',()=>{
 const {c,properties:p}=storage();c.initializeConfiguration();
 for(const key of ['CLASSIFICATION_JOB','TAXONOMY_JOB'])p[key]=JSON.stringify({state:'Revisar',publicationRetries:3,total:100,next:102,verified:true});
 delete p.SNAPSHOT_JOBS;c.rebuildDashboardSnapshots();
 assert.deepEqual(JSON.parse(p.SNAPSHOT_JOBS).sort(),['CLASSIFICATION_JOB','TAXONOMY_JOB']);
 c.completeSnapshotJobs_();
 for(const key of ['CLASSIFICATION_JOB','TAXONOMY_JOB']){const job=JSON.parse(p[key]);assert.equal(job.state,'Completada');assert.equal(job.next,102);assert.ok(job.published);}
 assert.equal(p.SNAPSHOT_JOBS,undefined);
});
