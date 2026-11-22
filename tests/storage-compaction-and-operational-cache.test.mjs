import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {storage} from './helpers/server.mjs';
import {app,tick} from './helpers/app.mjs';
function fixture(){const s=storage();s.c.initializeConfiguration();return s;}
const keys=(c,name)=>vm.runInContext('RADAR.sheets.'+name,c);
function job(s,id,state,finished){s.c.append_('Recargas',[keys(s.c,'Recargas').map(key=>({id,tipo:'daily',estado:state,fin:finished,pendientes:state==='Pendiente'?1:0})[key]??'')]);s.c.append_('Recopilacion',[[id,'Fuente','https://example.test/'+id,state,0,'',0,0,'','2026-10-24']]);}
test('retirada de enriquecimiento elimina hoja y propiedades; catálogo se distribuye en un único módulo',()=>{
 const s=fixture();s.book.insertSheet('Enriquecimiento');for(const key of ['ENRICHMENT_ENABLED','ENRICHMENT_REQUEST','ENRICHMENT_JOB','ENRICHMENT_HTTP_USAGE'])s.properties[key]='old';s.c.initializeConfiguration();assert.equal(s.sheets.has('Enriquecimiento'),false);assert.equal(Object.keys(s.properties).some(key=>key.startsWith('ENRICHMENT_')),false);assert.equal(fs.existsSync('dist/Enrichment.gs'),false);assert.equal(fs.existsSync('dist/FunctionalCatalogue.gs'),false);assert.equal(typeof s.c.functionalCatalogRules,'function');
});
test('propiedades se leen una vez por ámbito, conservan escrituras y se refrescan entre peticiones',()=>{
 const s=fixture(),get=s.c.PropertiesService.getScriptProperties;let reads=0;s.c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,getProperties(){reads++;return p.getProperties();}};};
 s.c.withScriptProperties_(()=>{for(let i=0;i<20;i++)s.c.properties_().getProperty('OWNER_EMAIL');s.c.properties_().setProperty('TEST','one');assert.equal(s.c.properties_().getProperty('TEST'),'one');s.c.properties_().deleteProperty('TEST');assert.equal(s.c.properties_().getProperty('TEST'),null);});assert.equal(reads,1);s.properties.TEST='external';assert.equal(s.c.withScriptProperties_(()=>s.c.properties_().getProperty('TEST')),'external');assert.equal(reads,2);
});
test('append descarta filas vacías y conserva el bloqueo del escritor externo',()=>{
 const s=fixture(),c=s.c,lock=c.LockService.getScriptLock();let releases=0;const release=lock.releaseLock;c.LockService.getScriptLock=()=>({...lock,releaseLock(){releases++;release();}});
 c.withForegroundWrite_(()=>c.append_('Telemetria',[[],null,['',null],['2026-10-24','append',0,'OK','']]));assert.equal(releases,1);assert.equal(c.rows_('Telemetria').filter(row=>row.operacion==='append').length,1);lock.tryLock();c.append_('Telemetria',[['2026-10-24','nested',0,'OK','']]);assert.equal(lock.hasLock(),true);lock.releaseLock();
});
test('compactación conserva ciclos terminados distintos y todos los activos',()=>{
 const s=fixture();job(s,'old','Completada','2026-10-22');job(s,'latest','Parcial','2026-10-23');job(s,'active','Pendiente','');assert.equal(s.c.compactCollectionTasks_(),0);assert.deepEqual(Array.from(s.c.rows_('Recopilacion'),row=>row.ciclo),['old','latest','active']);assert.equal(s.c.collectionJobs_().length,3);
});
test('candidatos se recortan a 3000 y la segunda ingesta reutiliza IDs sin releer la columna',()=>{
 const s=fixture(),c=s.c,sheet=s.sheets.get('Candidatos'),headers=keys(c,'Candidatos');for(let i=0;i<3010;i++)sheet.grid.push(headers.map(key=>({id:'c'+i,capturada:new Date().toISOString()})[key]||''));c.persistCandidates_([]);assert.equal(sheet.getLastRow()-1,3000);assert.equal(sheet.grid[1][0],'c10');let idReads=0;const range=sheet.getRange;sheet.getRange=(...args)=>{if(args[1]===1&&args[3]===1)idReads++;return range(...args);};const row=headers.map(key=>({id:'c3009',capturada:new Date().toISOString()})[key]||'');c.persistCandidates_([row]);assert.equal(idReads,0);assert.equal(sheet.getLastRow()-1,3000);
});
test('polling del panel reutiliza caché y no lee hojas de entregas ni suscripciones',()=>{
 const s=fixture(),c=s.c;for(const name of ['NewsletterEnvios','Suscripciones'])s.sheets.get(name).getRange=()=>{throw Error('Polling no debe leer '+name);};const first=c.getControlPanel(),reads=s.reads;const second=c.getControlPanel();assert.equal(s.reads,reads);assert.equal(second.groups.length,9);assert.equal(first.groups.find(group=>group.id==='archive').jobs[0].stage,'archive');const logs=c.rows_('Telemetria').filter(row=>row.operacion==='control-panel');assert.equal(logs.length,0);s.properties.SUPERVISOR_DECISION='Cambio';assert.equal(c.getControlPanel().groups[0].jobs[0].comment,'Cambio');
});
test('snapshot precalienta tres vistas, incluye metadatos y evita reconstruirlos en lectura',()=>{
 const s=fixture(),c=s.c;c.dashboardSnapshotBatch_();assert.equal(c.dashboardSnapshotsPending_(),false);c.dashboardMetadata_=()=>{throw Error('Metadatos ya preparados');};const result=c.getDashboard({view:'briefing',initial:true,language:'es'});assert.equal(result.performance.snapshotHit,true);assert.ok(result.preferences.timezone);s.cache.clear();assert.equal(c.getDashboard({view:'briefing',initial:true,language:'es'}).performance.snapshotHit,true);
});
test('bloques con prefijo 13 conservan identidad por nombre completo y funciones distintas',()=>{
 const {c}=fixture(),blocks=vm.runInContext('CONFIGURATION_DEFAULTS.taxonomy',c).filter(row=>row.name.startsWith('13.'));assert.equal(blocks.length,2);assert.notEqual(blocks[0].name,blocks[1].name);const ids=blocks.flatMap(row=>Array.from(row.functions,item=>item.id));assert.equal(new Set(ids).size,ids.length);
});
test('panel ofrece recopilación en cada franja, snapshots y mantenimiento sin contingencia manual',async t=>{
 const a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="runs"]');assert.equal(a.w.document.querySelectorAll('[data-collection-slot]').length,3);assert.equal(a.w.document.querySelector('.admin-action-panel'),null);assert.ok(a.find('[data-process-action="snapshot"]'));assert.ok(a.find('[data-process-action="maintenance"]'));a.replies.collectSlot='Recuperación diaria en cola.';await a.click('[data-collection-slot="afternoon"]');assert.equal(a.calls.find(row=>row.method==='collectSlot').query,'afternoon');
});
test('navegación reutiliza respuestas y persiste caché en la sesión',async t=>{
 const a=await app(t);await a.click('[data-view="news"]');const count=a.calls.filter(row=>row.method==='getDashboard').length,article=a.find('#news-list').firstElementChild;assert.ok(article);await a.click('[data-view="briefing"]');await a.click('[data-view="news"]');assert.equal(a.calls.filter(row=>row.method==='getDashboard').length,count);assert.equal(a.find('#news-list').firstElementChild,article);assert.ok(a.w.sessionStorage.getItem('radar-dashboards:'+a.find('meta[name=application-version]').content));await tick();
});
test('prefetch en idle comparte un único RPC cuando se navega mientras está en vuelo',async t=>{
 const idle=[];let complete;const a=await app(t,{configure({w}){w.requestIdleCallback=callback=>idle.push(callback);const backend=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=(method,query)=>method==='getDashboard'&&query.view==='news'?new Promise(resolve=>{complete=()=>backend(method,query).then(resolve);}):backend(method,query);}});
 assert.equal(idle.length,1);idle[0]();await tick();await a.click('[data-view="news"]');assert.equal(typeof complete,'function');await complete();await tick();assert.equal(a.calls.filter(row=>row.method==='getDashboard'&&row.query.view==='news').length,1);assert.equal(a.find('#news-section').hidden,false);
});
test('el último ciclo conserva todos los detalles distintos y sus agregados al reintentar errores',()=>{
 const s=fixture(),c=s.c;job(s,'latest','Parcial','2026-10-24');const sheet=s.sheets.get('Recopilacion');sheet.grid.splice(1);for(let i=0;i<301;i++)sheet.grid.push(['latest','Fuente','https://example.test/'+i,i===300?'Error':'Completada',1,'2026-10-24',1,i===0?7:0,'','2026-10-24']);const saved=c.collectionJobs_()[0];Object.assign(saved,{total:301,procesadas:300,fallidas:1,pendientes:0,nuevas:7});c.writeCollectionJob_(saved);
 assert.equal(c.compactCollectionTasks_(),0);assert.equal(c.rows_('Recopilacion').length,301);let current=c.collectionSnapshots_(c.rows_('Recopilacion'),c.collectionJobs_())[0];assert.equal(current.total,301);assert.equal(current.procesadas,300);assert.equal(current.nuevas,7);assert.equal(current.fallidas,1);c.retryCollectionErrors();current=c.collectionJobs_()[0];assert.equal(Number(current.total),301);assert.equal(Number(current.pendientes),1);assert.equal(Number(current.procesadas),300);assert.equal(c.compactCollectionTasks_(),0);
});
