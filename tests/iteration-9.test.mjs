import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
import {taxonomyDecision,taxonomyText} from '../src/shared/taxonomy.js';
function setup(count=1){
 const s=storage(),c=s.c;c.initializeConfiguration();
 for(let i=0;i<count;i++){const title='BBVA lanza login biométrico para empresas',row={id:String(i),fecha:'2026-10-10',pais:'España',medio:'Editor',entidad:'BBVA',titular:title,extracto:'',url:'https://example.com/'+i,fuente:'Editor',idioma:'es',clasificacion:JSON.stringify(c.classification_(c.searchText_(title),c.searchText_(title)).labels),taxonomia:''};c.append_('Noticias',[vm.runInContext('RADAR.sheets.Noticias',c).map(key=>row[key]||'')]);}
 c.invalidateNews_();for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();return s;
}
function stage(c){c.startTaxonomy();for(let i=0;i<100&&c.taxonomyJob_().state!=='Publicando';i++)c.taxonomyBatch_();assert.equal(c.taxonomyJob_().state,'Publicando');return c.taxonomyJob_();}
function finish(c){for(let i=0;i<20&&c.taxonomyJob_().state!=='Completada';i++)c.dashboardSnapshotBatch_();assert.equal(c.taxonomyJob_().state,'Completada');}
function mutate(s,job,change,rowIndex=1){const values=c.newsSheet_().grid[rowIndex],saved=JSON.parse(values[12]);change(saved);values[12]=JSON.stringify(saved);}

test('una asignación corrupta fuera del período visible se repara in-place',()=>{
 const s=setup(),c=s.c;stage(c);finish(c);c.newsSheet_().grid[1][1]='2025-01-01';const saved=JSON.parse(c.newsSheet_().grid[1][12]);saved.ids=['obsolete'];c.newsSheet_().grid[1][12]=JSON.stringify(saved);stage(c);finish(c);const row=c.rows_('Noticias')[0];c.validateTaxonomyAssignment_(c.taxonomySaved_(row.taxonomia),c.taxonomyCatalog_(),row.id,true,row);assert.equal(c.taxonomyJob_().tagged,1);
});
test('la validación de cada asignación rechaza modelo mixto, evidencia ausente y principal errónea',()=>{
 for(const change of [saved=>saved.model='obsolete',saved=>saved.evidence.assignments=[],saved=>saved.primary='obsolete']){const s=setup(),c=s.c;stage(c);finish(c);const row=c.rows_('Noticias')[0],saved=JSON.parse(row.taxonomia);change(saved);assert.throws(()=>c.validateTaxonomyAssignment_(saved,c.taxonomyCatalog_(),row.id,true,row));}
});
test('el etiquetado conserva el cursor al fallar y reanuda la pareja preparada',()=>{
 const s=setup(205),c=s.c;c.startTaxonomy();c.taxonomyBatch_();c.taxonomyBatch_();assert.equal(c.taxonomyJob_().next,102);const write=c.writeNewsCells_;c.writeNewsCells_=()=>{throw Error('Escritura temporal');};c.taxonomyBatch_();assert.equal(c.taxonomyJob_().next,102);assert.equal(c.taxonomyJob_().state,'En pausa');c.writeNewsCells_=write;c.startTaxonomy();stage(c);finish(c);assert.equal(c.taxonomyJob_().next,207);assert.match(c.newsStorageKey_(),/^Noticias_tax_/);
});
test('fallar tras preparar dos snapshots conserva el manifiesto y reintentar publica las tres vistas juntas',()=>{
 const s=setup(),c=s.c,previous=s.properties.DATA_GENERATION;stage(c);c.dashboardSnapshotBatch_();c.dashboardSnapshotBatch_();const verify=c.verifyDashboardSnapshot_;c.verifyDashboardSnapshot_=(view,...args)=>{if(view==='radar')throw Error('Verificación temporal');return verify(view,...args);};
 assert.throws(()=>c.dashboardSnapshotBatch_(),/Verificación temporal/);assert.equal(s.properties.DATA_GENERATION,previous);assert.equal(c.taxonomyJob_().state,'Publicando');c.verifyDashboardSnapshot_=verify;finish(c);
 for(const view of ['news','briefing','radar'])c.verifyDashboardSnapshot_(view,c.dashboardSnapshotManifest_(view));assert.equal(c.dashboardSnapshotsPending_(),false);
});
test('un cambio de corpus invalida snapshots preparados sin crear una generación de noticias',()=>{
 const s=setup(),c=s.c;stage(c);c.dashboardSnapshotBatch_();const old=JSON.parse(s.properties.DASHBOARD_SNAPSHOT_BUILD).signature;c.invalidateNews_();c.dashboardSnapshotBatch_();const next=JSON.parse(s.properties.DASHBOARD_SNAPSHOT_BUILD).signature;assert.notEqual(next,old);assert.equal(c.newsStorageKey_(),'Noticias');finish(c);
});
test('la publicación de snapshots completa todos los jobs in-place que esperaban las mismas vistas',()=>{
 const s=setup(),c=s.c;stage(c);s.properties.MAINTENANCE_JOB=JSON.stringify({state:'Publicando'});s.properties.SNAPSHOT_JOBS=JSON.stringify(['TAXONOMY_JOB','MAINTENANCE_JOB']);finish(c);assert.equal(c.maintenanceJob_().state,'Completada');assert.equal(s.properties.SNAPSHOT_JOBS,undefined);assert.match(c.newsStorageKey_(),/^Noticias_tax_/);
});
test('dos frases con el mismo discriminante no justifican una asociación secundaria',()=>{
 const definitions=[{id:'one',palanca:'01.Pagos',subpalanca:'01.01.Pagos biométricos',terms:['pagos biometricos']},{id:'two',palanca:'02.Acceso',subpalanca:'02.01.Autenticación biométrica',terms:['autenticacion biometrica']}],title='Banco lanza pagos biométricos con autenticación biométrica';
 const result=taxonomyDecision(taxonomyText(title),definitions,title);assert.equal(result.matches.length,1);
});
test('una secundaria genérica no se añade; se conservan dos bloques con evidencia propia',()=>{
 const definitions=[{id:'one',palanca:'01.Depósitos',subpalanca:'01.01.Depósitos tokenizados',terms:['depositos tokenizados']},{id:'two',palanca:'02.Pagos',subpalanca:'02.01.Pagos agénticos',terms:['pagos con ia']},{id:'generic',palanca:'03.Digital',subpalanca:'03.01.Producto digital',terms:['producto digital']}],title='HSBC prueba pagos con IA y depósitos tokenizados: nuevo producto digital';
 const result=taxonomyDecision(taxonomyText(title),definitions,title);assert.equal(result.matches.length,2);assert.deepEqual(new Set(result.matches.map(x=>x.row.id)),new Set(['one','two']));
});
test('muestra real: CONTPAQi sin integración no acredita API Channel; la integración bancaria explícita sí',()=>{
 const {c}=setup();c.publishTaxonomy_({documents:0,candidates:{}});for(const title of ['CONTPAQi y Banorte buscan eficientar la gestión fiscal y contable en las PyMEs de México','Banorte y Contpaqi forman alianza para impulsar digitalización de pymes en México'])assert.equal(c.taxonomyRecord_(title,'').ids.length,0,title);
 const record=c.taxonomyRecord_('Banorte y CONTPAQi se alían para que las PyMEs integren banca y contabilidad en tiempo real','');assert.equal(record.ids.length,1);assert.ok(c.taxonomyCatalog_().some(row=>row.id===record.primary&&row.subpalanca.startsWith('17.16.')));
});
test('JSON o IDs malformados no se ocultan en lectura y el reproceso los sustituye',()=>{
 const s=setup(),c=s.c;for(const value of ['{broken','{"ids":"obsolete"}'])assert.throws(()=>c.annotateNews_([{...c.rows_('Noticias')[0],taxonomia:value}]),/IDs inexistentes/);
 c.newsSheet_().grid[1][12]='{broken';stage(c);finish(c);assert.equal(c.taxonomySaved_(c.rows_('Noticias')[0].taxonomia).invalid,false);
});
test('una repetición idéntica repara IDs corruptos aunque el modelo y la huella sigan vigentes',()=>{
 const s=setup(),c=s.c;stage(c);finish(c);const grid=c.newsSheet_().grid,saved=JSON.parse(grid[1][12]);saved.ids=['obsolete'];grid[1][12]=JSON.stringify(saved);stage(c);finish(c);assert.equal(c.taxonomyJob_().tagged,1);const row=c.rows_('Noticias')[0];c.validateTaxonomyAssignment_(c.taxonomySaved_(row.taxonomia),c.taxonomyCatalog_(),row.id,true,row);
});
test('un enlace de edición ya enviado con solo país abre su pestaña y mantiene disponibles las otras geografías',()=>{
 const {c}=setup(),base={id:'es',pais:'España',entidad:'BBVA',fecha:'2026-10-10',medio:'Editor',fuente:'Editor',titular:'BBVA lanza pagos digitales para empresas',extracto:'',url:'https://example.com/es',tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],senales:['Lanzamiento de producto'],taxonomia:[],etiquetas:{digital:true}},query={view:'briefing',country:'España',from:'2026-10-01',to:'2026-10-15'};
 c.saveNewsletterEdition_('old-edition','delivery','owner@bbva.com','Edición',query,'es',[base,{...base,id:'mx',pais:'México',entidad:'Santander',titular:'Santander lanza una API empresarial',url:'https://example.com/mx'}]);c.completeNewsletterEdition_('old-edition','Enviada');
 const data=c.getDashboard({edition:'old-edition',view:'news',country:'España',entity:'',initial:true});assert.equal(data.selection.country,'');assert.equal(data.newsGeography,'España');assert.equal(data.contextTotal,2);assert.equal(data.total,1);assert.equal(data.newsGeographies.length,2);assert.equal(data.selection.from,query.from);assert.equal(data.selection.to,query.to);
 const detail=c.getDashboard({edition:'old-edition',view:'news',country:'España',entity:'BBVA',initial:true});assert.equal(detail.selection.country,'España');assert.equal(detail.total,1);
});
test('la evidencia contextual conserva las palabras flexionadas del texto y supera la validación de publicación',()=>{
 const {c}=setup();c.publishTaxonomy_({documents:0,candidates:{}});const row={id:'description',titular:'Banco ofrece a concesionarios financiación para adquirir vehículos y mantenerlos expuestos hasta su venta',extracto:''},saved=c.taxonomyRecord_(row.titular,row.extracto);assert.equal(saved.evidence.method,'description');assert.ok(saved.evidence.terms.includes('vehiculos'));c.validateTaxonomyAssignment_(saved,c.taxonomyCatalog_(),row.id,true,row);
});
