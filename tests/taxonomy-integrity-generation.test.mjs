import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
const clean=value=>JSON.parse(JSON.stringify(value));
function server(){const s=storage();s.c.initializeConfiguration();s.c.publishTaxonomy_({documents:0,candidates:{}});return s;}
function article(c){const row={id:'a',titular:'BBVA mejora su servicio digital para empresas',extracto:''};row.clasificacion=JSON.stringify({digital:true,capacidades:['Empresas: Pagos'],evento:'Mejora de oferta'});row.taxonomia=JSON.stringify(c.taxonomyRecord_(row.titular,row.extracto,c.taxonomyCatalog_(),JSON.parse(row.clasificacion)));return row;}
function add(s,row){s.sheets.get('Noticias').grid.push(vm.runInContext('RADAR.sheets.Noticias',s.c).map(key=>row[key]||''));}
test('fallback conserva la regla, capacidades y señal sin inventar términos literales; se reutiliza',()=>{
 const {c}=server(),row=article(c),saved=JSON.parse(row.taxonomia);assert.equal(saved.reason,'capability-fallback');assert.equal(saved.evidence.method,'capability-fallback');assert.equal(saved.evidence.terms,undefined);assert.equal(saved.evidence.rule,'03.01');assert.deepEqual(saved.evidence.capabilities,['Pagos']);assert.equal(saved.evidence.signal,'Mejora de oferta');c.validateTaxonomyAssignment_(saved,c.taxonomyCatalog_(),row.id,true,row);
 c.taxonomyRecord_=()=>{throw Error('Reprocesamiento innecesario');};assert.equal(JSON.stringify(c.necessaryTaxonomyRecord_(row)),row.taxonomia);
 for(const key of ['rule','signal','capabilities']){const bad=clean(saved);bad.evidence.assignments[0][key]='incorrect';assert.throws(()=>c.validateTaxonomyAssignment_(bad,c.taxonomyCatalog_(),row.id,true,row),/fallback incoherente/);}
});
test('literal válido se conserva y evidencia literal ausente se rechaza',()=>{
 const {c}=server(),row={id:'literal',titular:'BBVA lanza login biométrico para empresas',extracto:''};row.taxonomia=JSON.stringify(c.taxonomyRecord_(row.titular,''));const saved=JSON.parse(row.taxonomia);assert.ok(saved.ids.length);c.validateTaxonomyAssignment_(saved,c.taxonomyCatalog_(),row.id,true,row);saved.evidence.assignments[0].terms=['no existe esta evidencia'];assert.throws(()=>c.validateTaxonomyAssignment_(saved,c.taxonomyCatalog_(),row.id,true,row),/no verificable/);
});
test('catálogo incompatible exige reclasificación; una asignación vacía vigente no se recalcula',()=>{
 const {c}=server(),row=article(c),items=clean(c.taxonomyCatalog_());items[0].descripcion+=' nueva';assert.throws(()=>c.validateTaxonomyAssignment_(JSON.parse(row.taxonomia),items,row.id),/Generación/);
 const empty={id:'empty',titular:'Evento institucional',extracto:'',clasificacion:'{}'};empty.taxonomia=JSON.stringify(c.taxonomyRecord_(empty.titular,''));c.taxonomyRecord_=()=>{throw Error('No recalcular');};assert.equal(JSON.stringify(c.necessaryTaxonomyRecord_(empty)),empty.taxonomia);
});
test('generación nueva mantiene la pareja publicada hasta completar asignaciones y los tres snapshots',()=>{
 const s=server(),c=s.c,row=article(c);add(s,{...row,fecha:'2026-10-10',pais:'España',entidad:'BBVA',url:'https://example.test/a'});c.invalidateNews_();for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();const before=clean(c.dataGeneration_()),original=JSON.stringify(s.sheets.get('Noticias').grid);
 c.requestTaxonomy_();for(let i=0;i<5&&c.taxonomyJob_().phase!=='tag';i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().phase,'tag');assert.equal(c.taxonomyJob_().state,'En curso');assert.equal(c.dashboardSnapshotBatch_(),false);assert.deepEqual(clean(c.dataGeneration_()),before);assert.equal(JSON.stringify(s.sheets.get('Noticias').grid),original);
 const generation=clean(c.taxonomyJob_().generation);c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Publicando');assert.equal(c.taxonomyJob_().verified,true);for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();assert.equal(c.taxonomyJob_().state,'Completada');assert.equal(c.dataGeneration_().newsSheet,generation.newsSheet);assert.equal(c.rows_('Noticias').length,1);assert.equal(JSON.stringify(s.sheets.get('Noticias').grid),original);for(const view of ['briefing','news','radar'])c.verifyDashboardSnapshot_(view,c.dashboardSnapshotManifest_(view));
});
test('error de escritura conserva cursor y generación; se reanuda sin perder noticias',()=>{
 const s=server(),c=s.c;add(s,article(c));c.invalidateNews_();c.requestTaxonomy_();for(let i=0;i<5&&c.taxonomyJob_().phase!=='tag';i++)c.taxonomyBatch_();const next=c.taxonomyJob_().next,write=c.writeNewsCells_;c.writeNewsCells_=()=>{throw Error('fallo simulado');};c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'En pausa');assert.equal(c.taxonomyJob_().next,next);assert.equal(c.newsStorageKey_(),'Noticias');c.writeNewsCells_=write;c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Publicando');assert.equal(c.rows_('Noticias').length,1);
});
test('publicación no sobrescribe noticias llegadas después de copiar el corpus',()=>{
 const s=server(),c=s.c;add(s,article(c));c.invalidateNews_();c.requestTaxonomy_();for(let i=0;i<5&&c.taxonomyJob_().phase!=='tag';i++)c.taxonomyBatch_();c.taxonomyBatch_();add(s,{...article(c),id:'new'});c.invalidateNews_();assert.equal(c.dashboardSnapshotBatch_(),false);assert.equal(c.newsStorageKey_(),'Noticias');assert.equal(c.rows_('Noticias').length,2);assert.equal(c.taxonomyJob_().phase,'scan');
});
test('clasificación esperando snapshots no bloquea el etiquetado pendiente',()=>{
 const {c,properties}=server();properties.CLASSIFICATION_JOB=JSON.stringify({state:'Publicando'});properties.TAXONOMY_JOB=JSON.stringify({state:'En curso',phase:'tag',pausedUntil:0});properties.SNAPSHOT_JOBS=JSON.stringify(['CLASSIFICATION_JOB']);assert.equal(c.backgroundTask_({jobs:[],pending:[]},false),'taxonomy');assert.equal(c.dashboardSnapshotBatch_(),false);
});
test('Uruguay se exige en perfiles y RSS configurados; capacidades no usan inglés en los cinco idiomas',()=>{
 const {c}=server(),config=c.configuration_(),entity=config.entities[0],range={from:'2026-10-01',to:'2026-10-23'};
 for(const variant of [false,true]){const feed=c.profileFeed_(config.geographies.find(g=>g.code==='UY'),entity,range,variant);assert.match(new URL(feed.url).searchParams.get('q'),/"Uruguay"/);}
 const raw={country:'Uruguay',url:'https://news.google.com/rss/search?q=bank&ceid=US:es-419&gl=US'};assert.match(new URL(c.countryScopedSource_(raw).url).searchParams.get('q'),/"Uruguay"/);assert.equal(c.countryScopedSource_(c.countryScopedSource_(raw)).url,c.countryScopedSource_(raw).url);
 for(const language of ['it','de','fr','pt','tr']){const terms=c.capabilitySearchTerms_({language,code:'TEST'},entity);assert.ok(!terms.some(term=>['bulk payments','direct debits'].includes(term)));for(const term of terms)assert.ok(config.searchLanguages.some(row=>row.language===language&&row.terms.includes(term)));}
});
test('archivo externo se verifica antes de purgar tareas idénticas y hojas legacy',()=>{
 const s=server(),c=s.c,backup=storage();s.book.copy=()=>{for(const sheet of s.book.getSheets())sheet.copyTo(backup.book).setName(sheet.getName());return backup.book;};s.book.insertSheet('legacy').grid.push(['dato']);const task=['cycle','Fuente','https://example.test','Pendiente','0','','0','0','','2026-10-23'];c.append_('Recopilacion',[task,task,task]);const result=c.archiveAndCompactOperationalStorage();assert.equal(result.duplicateTasks,2);assert.equal(c.rows_('Recopilacion').length,1);assert.equal(backup.sheets.get('Recopilacion').getLastRow(),4);assert.equal(backup.sheets.get('legacy').grid[0][0],'dato');assert.equal(s.sheets.has('legacy'),false);
});
test('fallo de verificación del archivo impide purgar cualquier dato operativo',()=>{
 const s=server(),c=s.c,backup=storage();s.book.copy=()=>backup.book;const task=['cycle','Fuente','https://example.test','Pendiente','0','','0','0','','2026-10-23'];c.append_('Recopilacion',[task,task]);assert.throws(()=>c.archiveAndCompactOperationalStorage(),/Archivo externo no verificado/);assert.equal(c.rows_('Recopilacion').length,2);
});
test('archivo consolida estados distintos de una misma URL conservando el resultado completado',()=>{
 const s=server(),c=s.c,backup=storage();s.book.copy=()=>{for(const sheet of s.book.getSheets())sheet.copyTo(backup.book).setName(sheet.getName());return backup.book;};const pending=['cycle','Fuente','https://example.test','Pendiente','0','','0','0','','2026-10-23'],done=[...pending];done[3]='Completada';done[6]='15';done[7]='3';c.append_('Recopilacion',[pending,done]);assert.equal(c.archiveAndCompactOperationalStorage().duplicateTasks,1);assert.equal(c.rows_('Recopilacion')[0].estado,'Completada');assert.equal(backup.sheets.get('Recopilacion').getLastRow(),3);
});
test('una escritura silenciosamente incompleta impide avanzar el cursor y publicar',()=>{
 const s=server(),c=s.c;add(s,article(c));c.invalidateNews_();c.requestTaxonomy_();for(let i=0;i<5&&c.taxonomyJob_().phase!=='tag';i++)c.taxonomyBatch_();c.withTaxonomyGeneration_(c.taxonomyJob_(),()=>{c.newsSheet_().grid[1][12]='';});c.writeNewsCells_=()=>{};c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'En pausa');assert.equal(c.taxonomyJob_().next,2);assert.match(c.taxonomyJob_().error,/persistido incompleto/);assert.equal(c.newsStorageKey_(),'Noticias');
});
test('actualizar la cola conserva variantes históricas y no las colapsa a la consulta principal',()=>{
 const {c}=server(),feed=c.feeds_().find(feed=>feed.kind==='profile'&&feed.language==='es'),range={from:'2026-10-01',to:'2026-10-23'},primary=c.collectionProfile_(feed,range),secondary={...primary,url:primary.url.replace(/([?&]q=)[^&]*/,(_,p)=>p+encodeURIComponent('after:2026-09-30 before:2026-10-24 "'+feed.entity+'" "consulta histórica"'))};
 c.append_('Recopilacion',[primary,secondary].map(f=>['annual',f.name,f.url,'Pendiente',0,'',0,0,'',range.to]));c.upgradeCollectionQueries_();const tasks=c.rows_('Recopilacion');assert.equal(new Set(tasks.map(task=>task.url)).size,2);assert.equal(c.collectionTaskFeed_(tasks[1],c.collectionFeedIndex_()).url,secondary.url);for(const child of c.splitCollectionFeed_(secondary))assert.match(new URL(child.url).searchParams.get('q'),/consulta histórica/);
});
test('taxonomía en backoff conserva su despertar aunque clasificación espere snapshots',()=>{
 const {c,properties}=server(),until=Date.now()+3600000;properties.CLASSIFICATION_JOB=JSON.stringify({state:'Publicando'});properties.TAXONOMY_JOB=JSON.stringify({state:'En pausa',phase:'tag',pausedUntil:until});properties.SNAPSHOT_JOBS=JSON.stringify(['CLASSIFICATION_JOB']);assert.equal(c.backgroundNextAt_({jobs:[],pending:[],tasks:[]}),until);
});

test('una segunda consulta sin ámbito empresarial nativo se desactiva y nunca envía paréntesis vacíos',()=>{
 const {c}=server(),config=c.configuration_();for(const geo of config.geographies.filter(g=>['it','de','fr','pt','tr'].includes(g.language.split('-')[0]))){const feed=c.profileFeed_(geo,config.entities[0],{from:'2026-10-01',to:'2026-10-23'},true);if(feed)assert.doesNotMatch(new URL(feed.url).searchParams.get('q'),/\(\)/);}
});
test('respuesta perdida después de publicar DATA_GENERATION completa el job sin reiniciar ni reclasificar',()=>{
 const s=server(),c=s.c;add(s,{...article(c),fecha:'2026-10-10',pais:'España',entidad:'BBVA'});c.invalidateNews_();for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();c.requestTaxonomy_();for(let i=0;i<10&&c.taxonomyJob_().state!=='Publicando';i++)c.taxonomyBatch_();const id=c.taxonomyJob_().id,generation=clean(c.taxonomyJob_().generation);c.dashboardSnapshotBatch_();c.dashboardSnapshotBatch_();
 const get=c.PropertiesService.getScriptProperties;let fail=true;c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,setProperty(key,value){const result=p.setProperty(key,value);if(key==='DATA_GENERATION'&&fail){fail=false;throw Error('respuesta perdida');}return result;}};};assert.throws(()=>c.dashboardSnapshotBatch_(),/respuesta perdida/);vm.runInContext('dataGenerationMemory_=undefined',c);c.taxonomyRecord_=()=>{throw Error('No reclasificar');};c.dashboardSnapshotBatch_();assert.equal(c.taxonomyJob_().id,id);assert.equal(c.taxonomyJob_().state,'Completada');assert.equal(c.newsStorageKey_(),generation.newsSheet);for(const view of ['briefing','news','radar'])c.verifyDashboardSnapshot_(view,c.dashboardSnapshotManifest_(view));
});
