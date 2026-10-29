import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {JSDOM} from 'jsdom';import {storage} from './helpers/server.mjs';import {app} from './helpers/app.mjs';
const plain=value=>JSON.parse(JSON.stringify(value));
function setup(){const s=storage();s.c.initializeConfiguration();s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';return s;}
const q={view:'briefing',country:'España',from:'2026-10-01',to:'2026-10-15',segment:'Empresas e instituciones',coverage:'digital'};
const row=(id,country='España',entity='Qonto',score=6)=>({id,pais:country,entidad:entity,fecha:'2026-10-10',medio:'Fuente',titular:'Nueva operativa digital verificable para empresas '+id,extracto:'Una funcionalidad concreta disponible para gestionar la tesorería empresarial.',url:'https://example.com/'+id,senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true},clasificacion:JSON.stringify({score}),taxonomia:[{id:'api',palanca:'Enablers',subpalanca:'API bancarias'}]});
function synthetic(c){const config=structuredClone(plain(c.configuration_()));config.applicationScope=[{name:'Empresas e instituciones',countries:['G1','G2','G3']}];config.geographies=[['G1','Z1'],['G2','Z1'],['G3','Z2'],['U1','Z1'],['U2','Z2']].map(([name,region])=>({name,region}));c.configuration_=()=>config;return config;}
test('newsletter tiers derive from configured tabs and regions, with no fixed country order',()=>{
 const {c}=setup(),config=synthetic(c),query={...q,country:'G1'};
 for(const [country,tier] of [['G2',1],['G3',2],['U1',3],['U2',4],['Z1',3],['Sin determinar',4]]){const result=c.newsletterDigest_([row('local','G1'),row('external',country)],query,'es',s=>s);assert.equal(result.cards.find(card=>card.id==='external').tier,tier);}
 const result=c.newsletterDigest_([row('local','G1'),row('t4','U2'),row('t3','U1'),row('t2','G3'),row('t1','G2')],query,'es',s=>s);assert.deepEqual(Array.from(result.cards,card=>card.id),['local','t1']);
 config.applicationScope[0].countries.push('U2');assert.equal(c.newsletterDigest_([row('local','G1'),row('external','U2')],query,'es',s=>s).cards[1].tier,2);
 config.geographies.find(row=>row.name==='G1').region='';const degraded=c.newsletterDigest_([row('local','G1'),row('external','G2')],query,'es',s=>s);assert.ok(degraded.audit.warnings.length);assert.equal(degraded.cards[1].tier,2);
});
test('eligibility, traceable URLs and recipient history precede selection without suppressing international evidence',()=>{
 const {c}=setup(),local=row('local'),foreign=row('foreign','Italia'),bad={...row('bad'),url:''};
 const result=c.newsletterContent_([bad,foreign],q,'',new Date('2026-10-16'),'s');assert.equal(result.count,1);assert.equal(result.items[0].id,'foreign');
 const known=new Set(c.newsletterItemKeys_(local));const changed={...local,titular:'Otro título',url:'https://example.com/moved'};assert.equal(c.newsletterWasSent_(changed,known),true);
 const quarterly=c.newsletterContent_([changed,foreign],{...q,view:'news'},'',new Date('2026-10-16'),'s','es','e',known);assert.deepEqual(Array.from(quarterly.items,item=>item.id),['foreign']);assert.equal(quarterly.total,2);assert.equal(quarterly.evidence.length,2);
 known.incomplete=true;assert.equal(c.newsletterContent_([foreign],{view:'news'},'',new Date(),'s','es','e',known).count,0);
});
test('quarterly highlights contain at most three unique unseen items and do not change the corpus',()=>{
 const {c}=setup(),input=Array.from({length:8},(_,i)=>row('n'+i,i%2?'Italia':'España',i%2?'Revolut':'Qonto')),before=JSON.stringify(input),known=new Set(c.newsletterItemKeys_(input[0]));
 const result=c.newsletterContent_(input,{...q,view:'news'},'',new Date('2026-10-16'),'s','es','edition',known);assert.ok(result.count<=3);assert.equal(new Set(result.items.map(row=>row.id)).size,result.count);assert.equal(result.evidence.length,8);assert.equal(result.editorial.audit.eligible,8);assert.ok(!result.items.some(row=>row.id==='n0'));assert.equal(JSON.stringify(input),before);
});
test('external perspective prefers competitors and justifies BBVA when it is the only eligible evidence',()=>{
 const {c}=setup(),local=row('local'),bbva=row('bbva','Italia','BBVA'),competitor=row('competitor','Italia');
 const selected=c.newsletterDigest_([local,bbva,competitor],q,'es',s=>s);assert.ok(!selected.cards.some(card=>card.id==='bbva'));
 const only=c.newsletterDigest_([local,bbva],q,'es',s=>s);assert.match(only.cards.find(card=>card.id==='bbva').selectionReason,/ejemplo BBVA/);
});
test('subjects follow natural coverage periods, configured scope and exact irregular windows',()=>{
 const {c}=setup();c.Date=class extends Date{constructor(value='2026-10-26T12:00:00Z'){super(value);}};
 assert.equal(c.newsletterSubject_({view:'briefing',country:'España',from:'2026-11-01',to:'2026-11-15'}),'[bIA] Canal BBVA BEI · España · Primera quincena de noviembre de 2026');
 assert.equal(c.newsletterSubject_({view:'briefing',from:'2024-02-16',to:'2024-02-29'}),'[bIA] Canal BBVA BEI · Mirada global · Segunda quincena de febrero de 2024');
 for(let quarter=0;quarter<4;quarter++){const start=new Date(Date.UTC(2026,quarter*3,1)),end=new Date(Date.UTC(2026,quarter*3+3,0));assert.match(c.newsletterSubject_({view:'news',country:'EMEA',from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)}),new RegExp('EMEA · Lo más relevante del '+['primer','segundo','tercer','cuarto'][quarter]+' trimestre de 2026'));}
 assert.equal(c.newsletterSubject_({view:'briefing',from:'2026-12-28',to:'2027-01-05'}),'[bIA] Canal BBVA BEI · Mirada global · 28 de diciembre de 2026 — 5 de enero de 2027');
});
test('email uses inline table layout, visible evidence and a single hidden preheader',()=>{
 const {c}=setup(),result=c.newsletterContent_([row('a'),row('b','Italia')],q,'',new Date('2026-10-16'),'s','es','edition'),d=new JSDOM(result.html).window.document;
 assert.ok(d.querySelector('.newsletter-header-title').getAttribute('style').includes('color:#001391'));assert.ok(d.querySelector('.newsletter-header-cell').getAttribute('style').includes('background-color:#ffffff'));assert.equal(d.querySelectorAll('.newsletter-preheader').length,1);assert.match(d.querySelector('.newsletter-preheader').getAttribute('style'),/display:none/);assert.equal(d.querySelectorAll('.newsletter-article').length,result.count);assert.doesNotMatch(result.html,/display:(?:flex|grid)|linear-gradient|fonts.googleapis/);assert.equal(d.querySelector('.newsletter-shell').getAttribute('width'),'100%');
 for(const image of d.querySelectorAll('img')){assert.ok(image.alt||image.getAttribute('aria-hidden')==='true'&&image.getAttribute('alt')===''&&image.closest('a')?.textContent.trim());assert.ok(image.src.startsWith('cid:'));}assert.match(result.text,/example.com\/a/);assert.doesNotMatch(result.text,/API bancarias/);
});
test('country priorities distinguish explicit names, ccTLDs, national context and verified publishers',()=>{
 const {c}=setup(),base={titular:'Nueva función digital para empresas',entidad:'BBVA',fuente:'BBVA · España',url:'https://news.google.com/rss/articles/test'};
 for(const medio of ['LaRepublica.co','Portafolio.co','HSB Noticias','Revista Semana'])assert.equal(c.newsCountryDecision_({...base,medio}).country,'Colombia');
 assert.equal(c.newsCountryDecision_({...base,titular:'Pagos por Bre-B',medio:'Fuente'}).reason,'market');assert.equal(c.newsCountryDecision_({...base,titular:'Servicio para España',sourceUrl:'https://editor.co/a'}).country,'España');assert.equal(c.newsCountryDecision_({...base,titular:'Pagos por Bre-B',sourceUrl:'https://editor.it/a'}).country,'Colombia');assert.equal(c.newsCountryDecision_({...base,titular:'New functionality in Ireland'}).country,'Irlanda');
});
test('adoption cohorts and chart share filtered events; total includes older retained users',()=>{
 const s=setup(),{c}=s,now=Date.parse('2026-10-26T12:00:00Z');c.Date=class extends Date{static now(){return now;}};const events=[{fecha:'2026-10-26T10:00:00Z',correo:'a@bbva.com',sesion:'1',evento:'vista',vista:'news'},{fecha:'2026-10-25T11:00:00Z',correo:'a@bbva.com',sesion:'2',evento:'lectura',vista:'news'},{fecha:'2026-09-01T10:00:00Z',correo:'b@bbva.com',sesion:'3',evento:'vista',vista:'radar'}];c.rows_=()=>events;
 const result=c.getAdoption({cohort:'total'});assert.equal(result.totalUsers,2);assert.equal(result.mau,1);assert.equal(result.total,2);assert.equal(c.getAdoption({vista:'news',cohort:'returning'}).total,1);assert.equal(c.getAdoption({vista:'radar',cohort:'dau'}).total,0);assert.equal(c.getAdoption({vista:'news'}).daily[0].users,1);
});
test('heatmap excludes incidents and its drilldown applies the matching exclusion filter',async t=>{
 const {c}=setup(),commercial=row('commercial'),incident={...row('outage'),senales:['Incidencia operativa']};c.annotateNews_=rows=>rows;c.translationIdentityRows_=rows=>rows;c.taxonomyOptions_=()=>({palanca:[],subpalanca:[]});const data=c.newsDashboard_([commercial,incident],{from:'2026-01-01',to:'2026-12-31'},[],'radar');assert.equal(data.heatmap.total,1);assert.equal(c.selectAnnotatedNews_([commercial,incident],{signal:'Sin incidencias operativas'}).length,1);
 const a=await app(t,{configure({data:response}){response.heatmap=plain(data.heatmap);response.selection={};}});await a.click('[data-view="radar"]');await a.click('#heatmap-table [data-node]');assert.equal(a.calls.filter(call=>call.method==='getDashboard').at(-1).query.signal,'Sin incidencias operativas');
});
test('taxonomy restarts retain the reclassification requirement',()=>{
 const {c,properties}=setup();c.refreshFunctionalCatalog_=()=>({source:'test'});c.requestTaxonomy_('functional-rules');let job=c.taxonomyJob_();job.reclassify=true;c.writeTaxonomyJob_(job);properties.NEWS_CONTENT_REVISION='changed';c.taxonomyBatch_();assert.equal(c.taxonomyJob_().reclassify,true);assert.notEqual(c.taxonomyJob_().id,job.id);
 job=c.taxonomyJob_();job.state='Completada';c.writeTaxonomyJob_(job);c.requestTaxonomy_('ordinary');assert.equal(c.taxonomyJob_().reclassify,false);
});
test('rollback restores verified native-backup tables before changing the active generation',()=>{
 const s=setup(),{c,properties}=s;const saved=new Map();
 for(const [name,logical] of [['Noticias_gen_old','Noticias'],['Taxonomia_gen_old','Taxonomia'],['Configuracion','Configuracion']]){const source=s.sheets.get(logical),copy=source.copyTo(s.book);saved.set(name,copy);}
 const keys=vm.runInContext('RADAR.sheets.Noticias',c);saved.get('Noticias_gen_old').grid.push(keys.map(key=>({id:'preserved-id',titular:'Evidence retained',pais:'España'})[key]||''));
 s.archiveBooks.set('backup-verified',{getSheetByName:name=>saved.get(name)});properties.FUNCTIONAL_RULE_UPGRADE=JSON.stringify({backupId:'backup-verified',generation:{newsSheet:'Noticias_gen_old',taxonomySheet:'Taxonomia_gen_old'},properties:{}});
 assert.equal(s.book.getSheetByName('Noticias_gen_old'),undefined);c.restoreFunctionalRuleUpgrade_();const generation=JSON.parse(properties.DATA_GENERATION);assert.notEqual(generation.newsSheet,'Noticias_gen_old');assert.equal(s.book.getSheetByName(generation.newsSheet).grid[1][0],'preserved-id');assert.ok(s.book.getSheetByName(generation.taxonomySheet));assert.equal(JSON.parse(properties.FUNCTIONAL_RULE_UPGRADE).state,'RolledBack');
});
test('high-value official BBVA evidence is retained as a documented editorial exception',()=>{
 const {c}=setup(),bbva={...row('official','Italia','BBVA',20),url:'https://www.bbva.com/es/empresas/official-release'};const result=c.newsletterDigest_([row('local'),bbva,row('alternative','Italia','Qonto',5)],q,'es',s=>s);assert.ok(result.cards.some(card=>card.id==='official'));assert.match(result.cards.find(card=>card.id==='official').selectionReason,/oficial BBVA/);
});
test('functional filters preserve scope and quarterly examples follow press activity',()=>{
 const {c}=setup(),many=Array.from({length:20},(_,i)=>({...row('weak'+i,'España','Qonto',1),taxonomia:[{palanca:'Pagos',subpalanca:'Transferencias'}]})),strong={...row('strong','España','Revolut',15),taxonomia:[{palanca:'Enablers',subpalanca:'API'}]};const input=[...many,strong];assert.equal(c.newsletterDigest_(input,{view:'news'},'es',s=>s).cards[0].id,'weak0');const selected=c.newsletterDigest_(input,{view:'news',palanca:'Enablers'},'es',s=>s);assert.equal(selected.cards.length,1);assert.equal(selected.cards[0].id,'strong');assert.equal(selected.audit.eligible,1);
});

test('initial dashboard is embedded safely and archived editions retain their own load',()=>{
 const {c}=setup();let calls=0;
 const output={setTitle(){return this;},addMetaTag(){return this;}},template={evaluate:()=>output};
 c.HtmlService={createTemplateFromFile:()=>template};c.getDashboard=query=>{calls++;assert.equal(query.view,'briefing');return {title:'</script><script>alert(1)</script>',items:[]};};
 assert.equal(c.doGet(),output);assert.equal(calls,1);assert.doesNotMatch(template.bootstrap,/<\/script>/);assert.equal(JSON.parse(template.bootstrap).data.title,'</script><script>alert(1)</script>');
 c.doGet({parameter:{edition:'archived'}});assert.equal(template.bootstrap,'null');assert.equal(calls,1);
});
