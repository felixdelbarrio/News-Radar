import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();s.c.configuration_().storage.logRows=10;return s;}
function logs(s,count=110){const sheet=s.sheets.get('Telemetria');sheet.grid.splice(1);for(let i=0;i<count;i++)sheet.grid.push([new Date().toISOString(),'dashboard','10','OK',String(i)]);return sheet;}
for(const point of ['before-write','after-write','verify','before-delete','after-delete','checkpoint-clear'])test('archivo recupera '+point+' con nuevas filas sin pérdida ni duplicados',()=>{
 const s=server(),c=s.c,sheet=logs(s),remove=sheet.deleteRows,write=c.writeArchiveTable_,read=c.archivePayload_,props=c.properties_();let fail=true;
 if(point==='before-write'||point==='after-write')c.writeArchiveTable_=(...args)=>{if(point==='after-write')write(...args);if(fail){fail=false;throw Error('crash');}return write(...args);};
 if(point==='verify')c.archivePayload_=(...args)=>{if(fail){fail=false;throw Error('crash');}return read(...args);};
 if(point==='before-delete'||point==='after-delete')sheet.deleteRows=(...args)=>{if(point==='after-delete')remove(...args);if(fail){fail=false;throw Error('crash');}return remove(...args);};
 if(point==='checkpoint-clear'){const original=c.properties_;c.properties_=()=>({...original(),deleteProperty(key){if(key==='ARCHIVE_SHEET:Telemetria'&&fail){fail=false;throw Error('crash');}return props.deleteProperty(key);}});}
 assert.throws(()=>c.archiveLogBatch_('Telemetria'),/crash/);
 sheet.grid.push([new Date().toISOString(),'dashboard','10','OK','appended']);
 c.writeArchiveTable_=write;c.archivePayload_=read;sheet.deleteRows=remove;
 assert.equal(c.archiveLogBatch_('Telemetria'),false);
 assert.equal(s.archiveBooks.size,1);const [id]=s.archiveBooks.keys();const archived=JSON.parse(c.archivePayload_(id)).rows;
 assert.equal(archived.length,100);assert.equal(sheet.getLastRow()-1,11);assert.equal(s.properties['ARCHIVE_SHEET:Telemetria'],undefined);
 assert.deepEqual([...archived,...sheet.grid.slice(1)].map(row=>row[4]),[...Array.from({length:110},(_,i)=>String(i)),'appended']);
});
test('una divergencia real conserva origen, archivo y checkpoint e identifica la tabla',()=>{
 const s=server(),c=s.c,sheet=logs(s),remove=sheet.deleteRows;sheet.deleteRows=()=>{throw Error('crash');};assert.throws(()=>c.archiveLogBatch_('Telemetria'));sheet.deleteRows=remove;sheet.grid[1][4]='edited';const before=JSON.stringify(sheet.grid),checkpoint=s.properties['ARCHIVE_SHEET:Telemetria'];assert.throws(()=>c.archiveLogBatch_('Telemetria'),/Conflicto de archivo Telemetria/);assert.equal(JSON.stringify(sheet.grid),before);assert.equal(s.properties['ARCHIVE_SHEET:Telemetria'],checkpoint);
});
test('un conflicto de una tabla no impide archivar las restantes',()=>{
 const s=server(),c=s.c,calls=[];c.archiveLogBatch_=name=>{calls.push(name);if(name==='Telemetria')throw Error('Conflicto Telemetria');return true;};assert.throws(()=>c.compactOperationalLogs_(),/Conflicto Telemetria/);assert.ok(calls.includes('Cobertura'));assert.ok(calls.includes('NewsletterEventos'));
});
test('Cobertura conserva más de 20000 filas hasta que su archivo esté verificado',()=>{
 const s=server(),sheet=s.sheets.get('Cobertura');sheet.grid.push(...Array.from({length:20000},(_,i)=>[String(i)]));s.c.appendCoverage_([['new']]);assert.equal(sheet.getLastRow()-1,20001);assert.equal(sheet.grid[1][0],'0');assert.equal(s.properties.LOG_ARCHIVE_PENDING,'true');
});
function newsletterFixture(){
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.NewsletterEdiciones',c),row=(id,start,count)=>Object.fromEntries(keys.map(key=>[key,({id,correo:'owner@bbva.com',inicio:String(start),cantidad:String(count),editorial:'{}',estado:'Enviada'})[key]||'']));
 const a=row('archived',2,1),b=row('active',4,2),items=[['archived',JSON.stringify({id:'old'})]],archive=c.archiveSpreadsheet_('NewsletterEdiciones',[],[{metadata:a,items}],c.configuration_().storage.newsletterFolderId,'newsletter:archived');a.editorial=JSON.stringify({archive:archive.id,digest:archive.digest,cleared:true});
 s.sheets.get('NewsletterEdiciones').grid.push(keys.map(key=>a[key]),keys.map(key=>b[key]));s.sheets.get('NewsletterContenido').grid.push(['archived',''],['',''],['active',JSON.stringify({id:'n1'})],['active',JSON.stringify({id:'n2'})]);return s;
}
test('compactación publica contenido y offsets juntos y conserva archivos y rollback',()=>{
 const s=newsletterFixture(),c=s.c,original=s.sheets.get('NewsletterContenido').grid.map(row=>row.slice());
 assert.equal(c.compactNewsletterBatch_(),false);assert.equal(c.newsletterStorageKey_('NewsletterContenido'),'NewsletterContenido');assert.equal(c.compactNewsletterBatch_(),false);assert.equal(c.newsletterStorageKey_('NewsletterContenido'),'NewsletterContenido');assert.equal(c.compactNewsletterBatch_(),true);
 const editions=c.rows_('NewsletterEdiciones');assert.equal(editions[1].inicio,'2');assert.deepEqual(Array.from(c.newsletterSheet_('NewsletterContenido').grid.slice(1),row=>row[1]),[JSON.stringify({id:'n1'}),JSON.stringify({id:'n2'})]);assert.equal(c.archivedNewsletter_(editions[0]).archivedItems[0][1],JSON.stringify({id:'old'}));assert.deepEqual(s.sheets.get('NewsletterContenido').grid.map(row=>row.slice()),original);assert.equal(c.compactNewsletterBatch_(),true);
});
test('una escritura interrumpida de staging reanuda sin publicar offsets parciales',()=>{
 const s=newsletterFixture(),c=s.c,write=c.writeVerifiedRows_;c.compactNewsletterBatch_();let fail=true;c.writeVerifiedRows_=(sheet,rows)=>{write(sheet,rows);if(fail){fail=false;throw Error('crash');}};assert.throws(()=>c.compactNewsletterBatch_(),/crash/);assert.equal(c.newsletterStorageKey_('NewsletterContenido'),'NewsletterContenido');c.writeVerifiedRows_=write;assert.equal(c.compactNewsletterBatch_(),false);assert.equal(c.compactNewsletterBatch_(),true);assert.equal(c.newsletterSheet_('NewsletterContenido').getLastRow(),3);
});
test('un archivo de edición corrupto impide compactar y no modifica el origen',()=>{
 const s=newsletterFixture(),c=s.c;c.archivePayload_=()=> 'corrupt';assert.throws(()=>c.compactNewsletterBatch_(),/no verificada/);assert.equal(c.newsletterStorageKey_('NewsletterContenido'),'NewsletterContenido');assert.equal(s.sheets.get('NewsletterContenido').getLastRow(),5);
});
test('el país declarado del RSS se conserva aunque Google use otro mercado',()=>{
 const {c}=server();const feed=c.feeds_().find(feed=>feed.kind==='profile'&&feed.country==='Uruguay');assert.ok(feed);assert.equal(c.sourceCountry_(feed),'Uruguay');assert.equal(c.newsCountry_({titular:'BBVA lanza una plataforma digital',extracto:'',fuente:feed.name,pais:'Uruguay'}),'Uruguay');assert.equal(c.newsCountry_({titular:'BBVA lanza una plataforma digital en Uruguay',fuente:feed.name,pais:'Uruguay'}),'Uruguay');
 const index=c.businessIndex_();assert.equal(c.sourceCountry_({country:'México',url:'https://news.google.com/rss/search?gl=US'},index),'México');
});

test('description sin contenido usa content:encoded y no inventa un extracto del titular',()=>{
 const {c}=server(),title='BBVA lanza una nueva API empresarial';
 assert.equal(c.newsExcerpt_({excerpt:'<a>'+title+'</a> <font>Reuters</font>',rssContent:'<p>Permite conciliar facturas en tiempo real.</p>'},title,'Reuters').text,'Permite conciliar facturas en tiempo real.');
 assert.equal(c.newsExcerpt_({excerpt:title},title).text,'');assert.equal(c.newsExcerpt_({excerpt:'<p>'+ 'a'.repeat(2000)+'</p>'},title).text.length,1500);
});
test('el enriquecimiento solo rellena vacíos, conserva etiquetas y respeta LLM verificado',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),feed=c.feeds_().find(feed=>feed.kind==='rss'),source=c.newsStorageKey_();
 const records=[{id:'empty',extracto:''},{id:'existing',extracto:'Extracto original'},{id:'approved',extracto:''}].map(row=>({...row,fecha:'2026-10-10',titular:'BBVA lanza pagos digitales para empresas',entidad:'BBVA',url:'https://example.com/'+row.id,fuente:feed.name,clasificacion:'{"digital":true,"capacidades":["Empresas: Pagos"],"score":7}',taxonomia:'{"ids":[]}'}));
 s.sheets.get(source).grid.push(...records.map(row=>keys.map(key=>row[key]||'')));s.properties.EXCERPT_RECOVERY_JOB=JSON.stringify({state:'Pendiente',source,next:2,reviewed:0,recovered:0,failed:0,protected:0});const scoreBefore=JSON.parse(c.rows_('Noticias')[0].clasificacion).score;c.llmIndex_=()=>new Map([['approved',{status:'classified'}]]);c.llmStrongResult_=saved=>Boolean(saved);c.UrlFetchApp={fetch:()=>({getResponseCode:()=>200,getContentText:()=>'<rss/>'})};c.parseFeed_=()=>[{url:'https://example.com/empty',excerpt:'La API permite automatizar la conciliación.',source:'Editor'}];c.recoverMissingExcerptsBatch_(10000);
 const rows=c.rows_('Noticias');assert.equal(rows[0].extracto,'La API permite automatizar la conciliación.');assert.equal(rows[1].extracto,'Extracto original');assert.equal(rows[2].extracto,'');const saved=JSON.parse(rows[0].clasificacion);assert.equal(saved.score,scoreBefore);assert.equal(saved.digital,true);assert.equal(saved.procedencia.recuperacionExtracto.status,'recuperado');assert.equal(JSON.parse(s.properties.EXCERPT_RECOVERY_JOB).protected,1);
});
test('la compactación se recupera si el manifiesto se publicó antes de guardar el cierre del job',()=>{
 const s=newsletterFixture(),c=s.c;c.compactNewsletterBatch_();c.compactNewsletterBatch_();const p=c.properties_(),original=c.properties_;let fail=true;c.properties_=()=>({...original(),setProperty(key,value){if(key==='NEWSLETTER_COMPACTION_JOB'&&JSON.parse(value).state==='Completada'&&fail){fail=false;throw Error('crash');}return p.setProperty(key,value);}});assert.throws(()=>c.compactNewsletterBatch_(),/crash/);assert.notEqual(c.newsletterStorageKey_('NewsletterContenido'),'NewsletterContenido');assert.equal(c.compactNewsletterBatch_(),true);
});
test('la auditoría distingue corpus publicado y candidato y devuelve muestras reproducibles',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),row={id:'n1',fecha:'2026-10-10',pais:'España',entidad:'BBVA',titular:'Noticia empresarial',url:'https://example.com/n1',clasificacion:'{"estado":"indeterminado"}',taxonomia:'{"ids":[]}'};s.sheets.get('Noticias').grid.push(keys.map(key=>row[key]||''));const staged=s.book.insertSheet('Noticias_tax_candidate');staged.grid.push([...keys],keys.map(key=>({...row,id:'n2',extracto:'Evidencia operativa'})[key]||''));s.properties.TAXONOMY_JOB=JSON.stringify({state:'Publicando',generation:{newsSheet:'Noticias_tax_candidate'}});
 const first=c.getCorpusQualityAudit(),second=c.getCorpusQualityAudit();assert.equal(first.corpora.length,2);assert.equal(first.corpora[0].missingExcerpt,1);assert.equal(first.corpora[1].missingExcerpt,0);assert.equal(JSON.stringify(first.corpora),JSON.stringify(second.corpora));
});
test('la deduplicación no fusiona anuncios de países explícitos diferentes',()=>{
 const {c}=server(),known={titles:new Map()},a={title:'BBVA lanza plataforma para automatizar cobros digitales en España',entity:'BBVA',date:'2026-10-10'},b={...a,title:'BBVA lanza plataforma para automatizar cobros digitales en México'};c.rememberTitle_(known,a);assert.equal(c.duplicateTitle_(known,b),false);
});

test('una sola fila tras archivar no reactiva el ciclo ni crea un microarchivo',()=>{
 const s=server(),c=s.c,sheet=logs(s);c.archiveLogBatch_('Telemetria');delete s.properties.LOG_ARCHIVE_PENDING;c.append_('Telemetria',[[new Date().toISOString(),'dashboard','1','OK','new']]);assert.equal(s.properties.LOG_ARCHIVE_PENDING,undefined);assert.equal(c.archiveLogBatch_('Telemetria'),true);assert.equal(s.archiveBooks.size,1);assert.equal(sheet.getLastRow()-1,11);
});
test('Adopción conserva sus límites propios y archiva por edad con verificación',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Adopcion',c),sheet=s.sheets.get('Adopcion');sheet.grid.push(keys.map(key=>key==='fecha'?'2000-01-01T00:00:00Z':'old'));const recent=keys.map(key=>key==='fecha'?new Date().toISOString():'recent');sheet.grid.push(recent);assert.equal(c.archiveLogBatch_('Adopcion'),false);assert.equal(sheet.getLastRow()-1,1);assert.deepEqual(sheet.grid[1],recent);const [id]=s.archiveBooks.keys();assert.equal(JSON.parse(c.archivePayload_(id)).rows.length,1);
});
test('la limpieza física conserva todos los IDs referenciados por LLM',()=>{
 const s=server(),c=s.c,keys=vm.runInContext('RADAR.sheets.Noticias',c),title='BBVA presenta resultados trimestrales',t=c.searchText_(title),labels=c.classification_(t,t).labels,row={id:'protected',fecha:'2026-10-10',titular:title,url:'https://example.com/protected',clasificacion:JSON.stringify(labels)};Array.prototype.push.call(s.sheets.get('Noticias').grid,keys.map(key=>row[key]||''));c.llmIndex_=()=>new Map([['protected',{status:'insufficient_evidence'}]]);assert.equal(c.deduplicateNews_(),0);assert.equal(c.rows_('Noticias')[0].id,'protected');
});

test('la memoria de deduplicación no reutiliza identidades si cambia el titular o la fecha',()=>{
 const {c}=server(),known={titles:new Map()},item={title:'BBVA lanza una plataforma digital de conciliación bancaria para empresas',entity:'BBVA',date:'2026-10-10'};c.rememberTitle_(known,item);assert.equal(c.duplicateTitle_(known,item),true);item.title='BBVA publica un nuevo servicio digital de custodia institucional';assert.equal(c.duplicateTitle_(known,item),false);item.title='BBVA lanza una plataforma digital de conciliación bancaria para empresas';item.date='2026-11-10';assert.equal(c.duplicateTitle_(known,item),false);
});

test('un archivo verificado que diverge nunca se sobrescribe ni autoriza retirar el origen',()=>{
 const s=server(),c=s.c,sheet=logs(s),remove=sheet.deleteRows;sheet.deleteRows=()=>{throw Error('crash');};assert.throws(()=>c.archiveLogBatch_('Telemetria'));sheet.deleteRows=remove;const checkpoint=s.properties['ARCHIVE_SHEET:Telemetria'],id=JSON.parse(checkpoint).id,archive=s.archiveBooks.get(id).getSheetByName('Datos');archive.grid[1][4]='divergent';const original=JSON.stringify(sheet.grid),stored=JSON.stringify(archive.grid);assert.throws(()=>c.archiveLogBatch_('Telemetria'),/Conflicto/);assert.equal(JSON.stringify(sheet.grid),original);assert.equal(JSON.stringify(archive.grid),stored);assert.equal(s.properties['ARCHIVE_SHEET:Telemetria'],checkpoint);
});

test('solicitar extractos no reinicia el mantenimiento ni crea dos recuperaciones',()=>{
 const s=server(),c=s.c;c.maintenance_();const maintenance=c.maintenanceJob_();maintenance.next=88;c.saveMaintenanceJob_(maintenance);c.startExcerptRecovery();const recovery=s.properties.EXCERPT_RECOVERY_JOB;c.startExcerptRecovery();assert.equal(c.maintenanceJob_().next,88);assert.equal(s.properties.EXCERPT_RECOVERY_JOB,recovery);
});

test('el archivo conserva las filas vacías finales del prefijo y verifica su digest',()=>{
 const s=server(),c=s.c,sheet=logs(s);sheet.grid[100]=Array(5).fill('');assert.equal(c.archiveLogBatch_('Telemetria'),false);const [id]=s.archiveBooks.keys(),payload=JSON.parse(c.archivePayload_(id));assert.equal(payload.rows.length,100);assert.ok(payload.rows.at(-1).every(value=>value===''));assert.equal(sheet.getLastRow()-1,10);assert.equal(s.properties['ARCHIVE_SHEET:Telemetria'],undefined);
});
test('un tamaño de archivo inválido bloquea su lectura sin truncar el contenido',()=>{
 const s=server(),c=s.c;logs(s);c.archiveLogBatch_('Telemetria');const [id]=s.archiveBooks.keys(),info=s.archiveBooks.get(id).getSheetByName('Archivo');info.grid[0][3]='99';assert.throws(()=>c.archivePayload_(id),/no verificado/);info.grid[0][3]='invalid';assert.throws(()=>c.archivePayload_(id),/no verificado/);
});

test('una noticia global toma el RSS y el dominio original domina el extracto',()=>{
 const {c}=server();const row={titular:'Stripe y Plasma preparan tarjetas con stablecoins para más de cien países',extracto:'Una alianza para ampliar su oferta global.',medio:'DiarioBitcoin',fuente:'BBVA · España',pais:'España',url:'https://news.google.com/articles/global'};assert.equal(c.newsCountry_(row),'España');assert.equal(c.newsCountry_({...row,medio:'Cinco Días'}),'España');assert.equal(c.newsCountry_({...row,titular:'BBVA presenta una solución',extracto:'BBVA lanza la solución en México. También operará en España.',sourceUrl:'https://publisher.es/story'}),'España');
});
