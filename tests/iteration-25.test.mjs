import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';

test('normaliza atribuciones antes de clasificar sin recortar el contenido del titular',()=>{
 const {c}=storage();
 for(const separator of [' - ',' | ',' — ',' – '])assert.equal(c.cleanNewsTitle_('BBVA lanza confirming digital'+separator+'Cinco Días','Cinco Días'),'BBVA lanza confirming digital');
 assert.equal(c.cleanNewsTitle_('Una alianza con Cinco Días','Cinco Días'),'Una alianza con Cinco Días');
});

test('el catálogo aporta capacidades específicas aunque ya exista una capacidad genérica',()=>{
 const {c}=storage();c.initializeConfiguration();
 const title='BBVA lanza anticipo confirming para empresas';
 const result=c.classification_(c.searchText_(title),c.searchText_(title+' Una nueva solución digital para gestionar proveedores.'));
 assert.equal(result.labels.digital,true);
 assert.ok(result.assessment.capabilities.some(row=>/\d{2}\.\d{2}/.test(row.name)));
 assert.equal(c.classification_(c.searchText_('BBVA recorta empleos en el área de confirming'),c.searchText_('BBVA recorta empleos en el área de confirming para empresas')).labels.digital,false);
});

test('el supervisor reinicia solo la publicación vencida y normaliza las pausas corruptas',()=>{
 const {c,properties:p}=storage();c.initializeConfiguration();const now=Date.now();
 p.CLASSIFICATION_JOB=JSON.stringify({state:'Publicando',next:123,total:122,updated:new Date(now-600001).toISOString(),pausedUntil:'invalid'});
 p.CATALOG_SYNC_RETRY_AT=String(now+86400001);
 assert.equal(c.recoverBackgroundJobs_(now),true);
 const job=JSON.parse(p.CLASSIFICATION_JOB);assert.equal(job.state,'Publicando');assert.equal(job.next,123);assert.equal(job.pausedUntil,0);assert.equal(p.DASHBOARD_SNAPSHOT_REQUEST,'ready');assert.equal(p.CATALOG_SYNC_RETRY_AT,undefined);
 assert.equal(c.recoverBackgroundJobs_(now+1),false);
});

test('el supervisor respeta la publicación con progreso reciente y pausas válidas',()=>{
 const {c,properties:p}=storage();c.initializeConfiguration();const now=Date.now();
 p.TAXONOMY_JOB=JSON.stringify({state:'Publicando',updated:new Date(now-700000).toISOString(),pausedUntil:now+60000});
 p.DASHBOARD_SNAPSHOT_BUILD=JSON.stringify({updated:new Date(now-1000).toISOString(),manifests:{}});
 assert.equal(c.recoverBackgroundJobs_(now),false);assert.equal(JSON.parse(p.TAXONOMY_JOB).pausedUntil,now+60000);assert.ok(p.DASHBOARD_SNAPSHOT_BUILD);
});
