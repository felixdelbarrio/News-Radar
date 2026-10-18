import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {TestDate} from './helpers/clock.mjs';
function server(){const s=storage();s.c.Date=TestDate;s.c.initializeConfiguration();return s;}
function add(s,id='one',title='BBVA lanza pagos digitales para empresas'){
 const c=s.c,labels=c.classification_(c.searchText_(title),c.searchText_(title)).labels,row={id,fecha:'2026-10-10',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'',url:'https://www.bbva.com/'+id,fuente:'Editor',idioma:'es',clasificacion:JSON.stringify(labels)};
 c.append_('Noticias',[vm.runInContext('RADAR.sheets.Noticias',c).map(key=>row[key]||'')]);c.invalidateNews_();return row;
}
function snapshots(c){for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();}

test('las claves fragmentadas de caché respetan el límite real con generaciones y UUID completos',()=>{
 const s=server(),c=s.c;let sequence=0;c.Utilities.getUuid=()=>String(++sequence).padStart(8,'0')+'-1234-1234-1234-123456789abc';const cache=c.CacheService.getScriptCache(),check=key=>assert.ok(key.length<=250,'Clave demasiado larga: '+key.length);
 c.CacheService.getScriptCache=()=>({get:key=>{check(key);return cache.get(key);},getAll:keys=>{keys.forEach(check);return cache.getAll(keys);},put:(key,value)=>{check(key);return cache.put(key,value);},putAll:values=>{Object.keys(values).forEach(check);return cache.putAll(values);},remove:key=>cache.remove(key)});
 add(s);snapshots(c);c.startTaxonomy();for(let i=0;i<12&&c.taxonomyPending_();i++){if(c.taxonomyJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.taxonomyBatch_();}c.cachedNewsRecords_({from:'2026-10-01',to:'2026-10-15'});assert.ok([...s.cache.keys()].some(key=>key.startsWith('news-records:')&&key.split(':').length===5));
});
test('ambigüedad recuperable, exclusión explícita y entrada inválida tienen estados distintos y deduplicación acotada',()=>{
 const s=server(),c=s.c,feed=c.feeds_().find(row=>row.entity==='BBVA'&&row.kind==='rss'),now=new TestDate(),raw={title:'BBVA anuncia una nueva solución',url:'https://www.bbva.com/ambiguous?utm_source=x',date:'2026-10-10'};
 const decision=c.evaluate_(raw,feed,now);assert.equal(decision.item,undefined);assert.equal(decision.candidate.labels.estado,'indeterminado');
 const record=c.candidateRecord_(decision.candidate,feed,now,decision.reason);c.persistCandidates_([record,record],now);c.persistCandidates_([record],now);assert.equal(c.rows_('Candidatos').length,1);assert.equal(c.rows_('Candidatos')[0].url,'https://www.bbva.com/ambiguous');
 const retail=c.evaluate_({...raw,title:'BBVA mejora su app para particulares'},feed,now);assert.equal(retail.candidate.labels.estado,'no relevante');assert.equal(c.evaluate_({...raw,date:'bad'},feed,now).candidate,undefined);
 c.persistCandidates_([record],new TestDate('2027-02-01'));assert.equal(c.rows_('Candidatos').length,1);assert.ok(c.rows_('Telemetria').some(row=>row.operacion==='candidatos'&&JSON.parse(row.detalle.slice(row.detalle.indexOf('{'))).expirados===1));c.persistCandidates_([],new TestDate('2027-02-02'));assert.equal(c.rows_('Candidatos').length,0);
});
test('la lectura usa evidencia persistida aunque cambien las reglas y no ejecuta clasificación',()=>{
 const s=server(),c=s.c,row=add(s);const expected=JSON.parse(row.clasificacion);c.classification_=()=>{throw Error('Reclasificación en lectura');};c.digitalAssessment_=()=>{throw Error('Relevancia en lectura');};c.newsCountry_=()=>{throw Error('Geografía en lectura');};const annotated=c.annotateNews_([row])[0];assert.deepEqual(Array.from(annotated.senales),expected.senales);assert.deepEqual(Array.from(annotated.segmentos),expected.segmentos);assert.equal(c.newsRelevance_(annotated),expected.score);
});
test('las tres vistas cambian mediante un único manifiesto y un fallo conserva la generación anterior',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);const previous=s.properties.DATA_GENERATION;c.invalidateNews_();c.dashboardSnapshotBatch_();assert.equal(s.properties.DATA_GENERATION,previous);c.dashboardSnapshotBatch_();assert.equal(s.properties.DATA_GENERATION,previous);
 const sheet=s.sheets.get('DashboardSnapshots'),get=sheet.getRange;sheet.getRange=()=>{throw Error('Fallo de escritura');};assert.throws(()=>c.dashboardSnapshotBatch_(),/Fallo/);assert.equal(s.properties.DATA_GENERATION,previous);sheet.getRange=get;c.dashboardSnapshotBatch_();assert.notEqual(s.properties.DATA_GENERATION,previous);assert.equal(c.dashboardSnapshotsPending_(),false);
});
test('clasificación diaria no expone lotes parciales y solo termina tras publicar las tres vistas',()=>{
 const s=server(),c=s.c;for(let i=0;i<105;i++)add(s,String(i));snapshots(c);const original=c.newsStorageKey_();c.requestNewsClassification_(true);c.newsClassificationBatch_();assert.equal(c.newsStorageKey_(),original);c.newsClassificationBatch_();assert.equal(c.classificationJob_().state,'Publicando');assert.equal(c.newsStorageKey_(),original);snapshots(c);assert.equal(c.classificationJob_().state,'Completada');assert.notEqual(c.newsStorageKey_(),original);assert.equal(c.dashboardSnapshotsPending_(),false);
});
test('rollback conserva el corpus y los tres snapshots anteriores tras publicar otra generación',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);const previous=c.newsStorageKey_(),generation=c.dataGeneration_();c.startClassification();c.newsClassificationBatch_();snapshots(c);assert.notEqual(c.newsStorageKey_(),previous);assert.ok(s.properties.PREVIOUS_DATA_GENERATION);c.rollbackDataGeneration();assert.equal(c.newsStorageKey_(),previous);for(const view of ['briefing','news','radar']){assert.equal(c.dashboardSnapshotManifest_(view).generation,generation.snapshots[view].generation);c.verifyDashboardSnapshot_(view,c.dashboardSnapshotManifest_(view));}
});
test('la taxonomía observa candidatos indeterminados sin publicarlos como noticias',()=>{
 const s=server(),c=s.c,feed=c.feeds_().find(row=>row.kind==='rss'),title='Banco explora pagos con stablecoins',decision=c.classification_(c.searchText_(title),c.searchText_(title));const candidate={date:new TestDate('2026-10-10'),title,excerpt:'',url:'https://www.bbva.com/candidate',labels:{...decision.labels,digital:false,estado:'indeterminado'},entity:'BBVA',country:'España',language:'es',provenance:'rss:title'};
 c.persistCandidates_([c.candidateRecord_(candidate,feed,new TestDate(),'Contexto insuficiente')]);c.startTaxonomy();for(let i=0;i<12&&c.taxonomyPending_();i++){if(c.taxonomyJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.taxonomyBatch_();}assert.equal(c.taxonomyJob_().candidatesProcessed,1);assert.equal(c.taxonomyJob_().documents,1);assert.equal(c.rows_('Noticias').length,0);
});
test('golden estratificado: se evalúa solo el texto con referencia y se mantienen abstenciones',async()=>{
 const {readFile}=await import('node:fs/promises'),fixture=JSON.parse(await readFile(new URL('./fixtures/ingestion-golden.json',import.meta.url),'utf8')),s=server(),c=s.c;let evaluated=0;
 for(const row of fixture.cases){const result=c.classification_(c.searchText_(row.title),c.searchText_(row.title+' '+row.excerpt));if(row.relevant!==null){assert.equal(result.labels.digital,row.relevant,row.title);evaluated++;}assert.ok(result.labels.revision);}
 assert.equal(evaluated,22);assert.equal(new Set(fixture.cases.map(row=>row.stratum)).size,4);assert.equal(fixture.excludedSampleRowsWithoutOriginalText,220);
});
test('funciones secundarias requieren evidencia distinta, respetan el orden y no duplican sinónimos',()=>{
 const {c}=server(),definitions=[{key:'01.01',palanca:'01.Pagos',subpalanca:'01.01.Pagos internacionales',terms:['pagos internacionales']},{key:'02.01',palanca:'02.Facturas',subpalanca:'02.01.Facturas electrónicas',terms:['facturas electronicas']},{key:'03.01',palanca:'03.Transferencias',subpalanca:'03.01.Transferencias',terms:['pagos internacionales']}],title='Banco lanza pagos internacionales y facturas electrónicas para empresas',result=c.taxonomyDecision(c.taxonomyText(title),definitions,title);
 assert.equal(result.matches.length,2);assert.equal(result.matches[0].row.key,'02.01');assert.equal(result.matches[1].row.key,'01.01');assert.ok(result.matches.every(row=>row.evidence.terms.length));
});
test('el catálogo y sus asignaciones permanecen aislados hasta publicar una misma generación',()=>{
 const s=server(),c=s.c;add(s,'one','BBVA lanza autenticación biométrica para empresas');snapshots(c);const source=c.newsStorageKey_(),model=c.taxonomyStorageKey_();c.startTaxonomy();c.taxonomyBatch_();c.taxonomyBatch_();assert.equal(c.taxonomyJob_().phase,'tag');assert.equal(c.newsStorageKey_(),source);assert.equal(c.taxonomyStorageKey_(),model);c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Publicando');assert.equal(c.newsStorageKey_(),source);assert.equal(c.taxonomyStorageKey_(),model);snapshots(c);assert.equal(c.taxonomyJob_().state,'Completada');assert.notEqual(c.newsStorageKey_(),source);assert.notEqual(c.taxonomyStorageKey_(),model);assert.equal(c.dashboardSnapshotsPending_(),false);
});
test('un fragmento preparado corrupto se reconstruye antes de cambiar el manifiesto público',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);const previous=s.properties.DATA_GENERATION;c.invalidateNews_();c.dashboardSnapshotBatch_();const build=JSON.parse(s.properties.DASHBOARD_SNAPSHOT_BUILD),manifest=build.manifests.briefing;s.sheets.get('DashboardSnapshots').grid[manifest.first-1][3]='corrupt';c.dashboardSnapshotBatch_();assert.throws(()=>c.dashboardSnapshotBatch_(),/Snapshot incompleto/);assert.equal(s.properties.DATA_GENERATION,previous);c.dashboardSnapshotBatch_();assert.notEqual(s.properties.DATA_GENERATION,previous);assert.equal(c.dashboardSnapshotsPending_(),false);
});
test('la newsletter histórica conserva la relevancia de la generación que se guardó',()=>{
 const s=server(),c=s.c;add(s);const row=c.annotateNews_(c.rows_('Noticias'))[0],score=c.newsRelevance_(row);assert.ok(score>0);c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Prueba',{from:'2026-10-01',to:'2026-10-15'},'es',[row]);c.completeNewsletterEdition_('edition','Enviada');const edition=c.newsletterEdition_('edition','owner@bbva.com');assert.equal(c.newsRelevance_(edition.items[0]),score);
});
test('el descubrimiento deduplica URL entre histórico y candidatos incluso si cambian título o medio',()=>{
 const s=server(),c=s.c;add(s,'one','BBVA lanza pagos con stablecoins para empresas');add(s,'two','BBVA mejora pagos con stablecoins para empresas');const url=c.newsSheet_().grid[1][7];c.newsSheet_().grid[2][7]=url;c.invalidateNews_();const feed=c.feeds_().find(row=>row.kind==='rss'),title='BBVA incorpora pagos con stablecoins para empresas',labels=c.classification_(c.searchText_(title),c.searchText_(title)).labels;
 c.persistCandidates_([c.candidateRecord_({date:new TestDate('2026-10-10'),title,excerpt:'',url,labels,publisher:'Otro medio',entity:'BBVA',country:'España',language:'es',provenance:'rss:title'},feed,new TestDate(),'Contexto')]);c.startTaxonomy();for(let i=0;i<12&&c.taxonomyPending_();i++){if(c.taxonomyJob_().state==='Publicando')c.dashboardSnapshotBatch_();else c.taxonomyBatch_();}assert.equal(c.taxonomyJob_().documents,1);assert.equal(c.rows_('Noticias').length,2);
});
test('el cliente recibe una revisión nueva solo tras publicar los tres snapshots',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);const before=c.getCollectionProgress().newsRevision;c.startClassification();c.newsClassificationBatch_();assert.equal(c.classificationJob_().state,'Publicando');assert.equal(c.getCollectionProgress().newsRevision,before);assert.equal(c.getClassificationStatus().newsRevision,before);c.dashboardSnapshotBatch_();c.dashboardSnapshotBatch_();assert.equal(c.getCollectionProgress().newsRevision,before);c.dashboardSnapshotBatch_();const after=c.getCollectionProgress().newsRevision;assert.notEqual(after,before);assert.equal(c.getClassificationStatus().newsRevision,after);assert.equal(c.getDashboard({view:'news',initial:true}).newsRevision,after);
});

test('publicar precalienta las tres vistas y una evicción recupera el snapshot persistido',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);const sheet=s.sheets.get('DashboardSnapshots'),read=sheet.getRange;sheet.getRange=()=>{throw Error('Lectura fría de snapshot');};
 for(const view of ['briefing','news','radar'])assert.equal(c.getDashboard({view,initial:true}).performance.snapshotHit,true);
 sheet.getRange=read;s.cache.clear();assert.equal(c.getDashboard({view:'news',initial:true}).performance.snapshotHit,true);
});
test('metadatos operativos distinguen privilegios y no cachean la revisión publicada',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);const admin=c.dashboardOperation_(true),reader=c.dashboardOperation_(false);assert.ok(admin.sheetUrl);assert.equal(reader.sheetUrl,undefined);
 const before=c.getDashboard({view:'news',initial:true}).newsRevision;c.invalidateNews_();snapshots(c);assert.notEqual(c.getDashboard({view:'news',initial:true}).newsRevision,before);
});

test('la limpieza retiene solo generaciones activas, rollback y trabajos pendientes',()=>{
 const s=server(),c=s.c;add(s);snapshots(c);c.startClassification();c.newsClassificationBatch_();snapshots(c);const active=c.newsStorageKey_();
 c.generationSheet_('Noticias_class_orphan',vm.runInContext('RADAR.sheets.Noticias',c));c.generationSheet_('Noticias_tax_pending',vm.runInContext('RADAR.sheets.Noticias',c));s.properties.TAXONOMY_JOB=JSON.stringify({state:'Pendiente',source:active,target:'Noticias_tax_pending'});
 c.pruneNewsGenerations_();assert.ok(s.sheets.has(active));assert.ok(s.sheets.has('Noticias'));assert.ok(s.sheets.has('Noticias_tax_pending'));assert.equal(s.sheets.has('Noticias_class_orphan'),false);
});
