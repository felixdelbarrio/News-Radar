import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
const setup=()=>{const s=storage();s.c.initializeConfiguration();return s;};
test('retention defaults to 500, accepts 5000 and migrates only legacy small limits',()=>{
 const {c,sheets}=setup();assert.equal(c.configuration_().storage.logRows,500);
 const config=c.configuration_();config.storage.logRows=5000;assert.doesNotThrow(()=>c.validateConfiguration_(config));config.storage.logRows=5001;assert.throws(()=>c.validateConfiguration_(config));
 for(const [before,expected] of [[10,500],[20,500],[21,21],[2000,2000]]){const row=sheets.get('Configuracion').grid.find(r=>r[0]==='storage'),value=JSON.parse(row[1]);value.logRows=before;row[1]=JSON.stringify(value);c.properties_().deleteProperty('STORAGE_RETENTION_VERSION');c.initializeConfiguration();assert.equal(c.configuration_().storage.logRows,expected);value.logRows=8;row[1]=JSON.stringify(value);c.initializeConfiguration();assert.equal(c.configuration_().storage.logRows,8);}
});
test('operational archiving never prunes adoption',()=>{
 const {c}=setup(),names=[];c.archiveLogBatch_=name=>{names.push(name);return true;};c.compactOperationalLogs_();assert.ok(!names.includes('Adopcion'));
});
test('publication supervisor recovers at most three times and keeps stalled jobs incomplete',()=>{
 const {c,properties:p}=setup(),now=Date.now();p.TAXONOMY_JOB=JSON.stringify({id:'stalled',state:'Publicando',updated:new Date(now-700000).toISOString(),next:87});
 for(let i=0;i<3;i++)assert.equal(c.recoverBackgroundJobs_(now+i*600001),true);
 assert.equal(c.recoverBackgroundJobs_(now+3*600001),false);const job=JSON.parse(p.TAXONOMY_JOB);assert.equal(job.publicationRetries,3);assert.equal(job.state,'Publicando');assert.equal(job.next,87);assert.match(job.error,/tres recuperaciones/);
});
test('a stale build cannot immediately retrigger a publication recovery',()=>{
 const {c,properties:p}=setup(),now=Date.now();p.TAXONOMY_JOB=JSON.stringify({state:'Publicando',publicationRetriedAt:new Date(now).toISOString()});p.DASHBOARD_SNAPSHOT_BUILD=JSON.stringify({updated:new Date(now-700000).toISOString()});assert.equal(c.recoverBackgroundJobs_(now+1),false);
});
test('unknown media append only available capacity, preserve verified rows and are idempotent',()=>{
 const {c,sheets}=setup(),sheet=sheets.get('CatalogoMedios'),seed=c.geographyCatalog_('CatalogoMedios')[0];sheet.grid.splice(1,sheet.grid.length-1,...Array.from({length:599},(_,i)=>['media'+i,JSON.stringify({...seed,domain:'media'+i+'.com'})]));vm.runInContext("geographyCatalogMemory_.clear()",c);
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),news=['one.com','two.com'].map(domain=>keys.map(k=>k==='clasificacion'?JSON.stringify({procedencia:{dominioMedio:domain}}):'')),original=JSON.stringify(sheet.grid.slice(0,600));assert.equal(c.registerUnknownMedia_(news),1);assert.equal(sheet.getLastRow(),601);assert.equal(JSON.stringify(sheet.grid.slice(0,600)),original);assert.equal(c.registerUnknownMedia_(news),0);
});
test('compaction preserves tasks whose historical job is unknown',()=>{
 const {c,sheets}=setup();sheets.get('Recopilacion').grid.push(['orphan-unproven','Source','https://editor.test/rss','Pendiente',2,'',1,0,'','2026-10-01']);assert.equal(c.compactCollectionTasks_(),0);assert.equal(c.rows_('Recopilacion').length,1);
});
test('demonstrated primary capabilities preserve valid secondary assignments and catalogue IDs',()=>{
 const {c}=setup(),definitions=c.taxonomyDefinitions(c.configuration_().taxonomy);
 for(const [title,prefix] of [
 ['HSBC and Mastercard launch mobile virtual card solution for B2B payments','09.'],
 ['JPMorgan Payments and Mastercard Launch Virtual Card Partnership','09.'],
 ['Citi Details Stablecoin Checkout With Coinbase and Fiat Payouts','11.'],
 ['Santander amplía Getnet para gestionar pagos de comercios en más de 30 países europeos','11.'],
 ['ANZ Tests Tokenised Deposits for Cross-Border Corporate Payments','03.'],
 ['DBS and Citi settle USD payments in minutes via tokenised deposits','03.'],
 ['BBVA habilitará pagos por Bre-B con tarjeta de crédito','03.'],
 ['Maybank Revamps Maybank2E Platform for Business Banking Clients','01.'],
 ['CaixaBank renueva su plataforma de banca digital para empresas','01.'],
 ['CaixaBank renueva su app para empresas con nuevas funciones de gestión financiera y contratación digital','01.'],
 ['CaixaBank lanza su nueva app móvil para empresas con gestión integral y contratación 100% digital','01.']
 ]){const result=c.taxonomyDecision(c.taxonomyText(title),definitions,title);assert.ok(result.matches[0]?.row.palanca.startsWith(prefix),title);assert.ok(result.matches.every(m=>definitions.includes(m.row)));}
 assert.notEqual(c.functionalPrimary('BBVA renueva su plataforma de pagos para empresas')?.prefix,'01.');
 const result=c.taxonomyDecision(c.taxonomyText('ANZ Tests Tokenised Deposits for Cross-Border Corporate Payments'),definitions,'ANZ Tests Tokenised Deposits for Cross-Border Corporate Payments');assert.ok(result.matches.slice(1).every(m=>c.taxonomyIndependentEvidence(m.evidence,result.matches[0].evidence.terms)));
});
test('generic cash management recruitment is excluded without excluding a banking launch',()=>{
 const {c}=setup(),title=c.searchText_('Yapı Kredi Nakit Yönetimi Satış Yönetmeni Alımı Yapacağını Duyurdu');assert.equal(c.digitalAssessment_(title,title).excluded,true);assert.equal(c.taxonomyEligible_(title,title),false);
 const launch=c.searchText_('BBVA lanza pagos digitales para empresas en su banca online');assert.equal(c.digitalAssessment_(launch,launch).relevant,true);
});
test('critical maintenance runs before any excerpt HTTP work',()=>{
 const {c}=setup();c.maintenance_(true);let critical=false;c.compactOperationalLogs_=()=>{critical=true;return true;};c.classificationPending_=()=>true;c.recoverMissingExcerptsBatch_=()=>{throw Error('Must wait for critical work');};c.maintenanceBatch_();assert.equal(critical,true);assert.equal(c.maintenanceJob_().phase,'dedup');
});
test('functional pilot backs up, verifies, retries partial writes and restores only reviewed rows',()=>{
 const s=setup(),{c}=s,definitions=c.taxonomyDefinitions(c.configuration_().taxonomy),items=definitions.map(row=>({...row,id:c.sha256_(row.key).slice(0,24),terminos:row.terms,descripcion:row.description||''}));c.taxonomyCatalog_=()=>items;c.classificationPending_=()=>false;c.taxonomyPending_=()=>false;c.snapshotJobsPending_=()=>false;
 const keys=vm.runInContext('RADAR.sheets.Noticias',c),old=items.find(r=>r.subpalanca==='02.xx Otros'),record={id:'pilot',fecha:'2026-10-10',pais:'Australia',entidad:'ANZ',titular:'ANZ Tests Tokenised Deposits for Cross-Border Corporate Payments',extracto:'',url:'https://editor.test/pilot',clasificacion:JSON.stringify({digital:true,capacidades:['Empresas: Pagos']}),taxonomia:JSON.stringify({ids:[old.id],primary:old.id})};Array.prototype.push.call(c.newsSheet_().grid,keys.map(k=>record[k]||''));
 const before=JSON.stringify(c.newsSheet_().grid),preview=c.previewFunctionalPilot();assert.equal(preview.changes.length,1);assert.equal(preview.changes[0].next,'03.Pagos - Transf. y traspasos');assert.equal(JSON.stringify(c.newsSheet_().grid),before);
 assert.throws(()=>c.applyFunctionalPilot({...preview,digest:'stale'}),/origen/);
 const write=c.writeNewsCells_;let fail=true;c.writeNewsCells_=updates=>{write(updates);if(fail){fail=false;throw Error('crash after write');}};assert.throws(()=>c.applyFunctionalPilot(preview),/crash/);assert.equal(s.archiveBooks.size,1);c.writeNewsCells_=write;
 const applied=c.applyFunctionalPilot(preview);assert.equal(applied.applied,1);assert.equal(s.archiveBooks.size,1);assert.equal(c.applyFunctionalPilot(preview).idempotent,true);assert.equal(c.previewFunctionalPilot().changes.length,0);
 c.restoreFunctionalPilot(preview);assert.equal(JSON.stringify(c.newsSheet_().grid),before);c.restoreFunctionalPilot(preview);assert.equal(JSON.stringify(c.newsSheet_().grid),before);
});
test('launching a pilot remains a competitive improvement without claiming product availability',()=>{
 const {c}=setup(),title=c.searchText_('Maybank launches pilot project for tokenised deposits and cross border payments');const assessment=c.digitalAssessment_(title,title);assert.equal(assessment.relevant,true);assert.deepEqual([...assessment.signals],['Mejora de oferta']);
});
