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
