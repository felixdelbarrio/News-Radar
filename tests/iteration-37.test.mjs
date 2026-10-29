import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {presentationServer,presentationContent,presentationCases,presentationRows} from './helpers/newsletter-presentation.mjs';
import {app} from './helpers/app.mjs';
const debt=JSON.parse(fs.readFileSync(new URL('./fixtures/banco-nacion-debt.json',import.meta.url)));
test('37: los cuatro casos reales y las disputas de deuda no son novedades digitales; los canales auténticos se conservan',()=>{
 const {c}=presentationServer(),classify=(title,excerpt='')=>c.classification_(c.searchText_(title),c.searchText_(title+' '+excerpt)).labels.digital;
 for(const row of debt)assert.equal(classify(row.title,row.excerpt),false,row.id);
 for(const title of ['Banco Nación presenta una propuesta de pago para refinanciación de empresas','Banco Nación rechaza pagos en un concurso de acreedores de una empresa','Banco Nación anuncia una nueva reestructuración de deuda de empresas','Banco Nación plantea una disputa de cobro de una empresa'])assert.equal(classify(title),false,title);
 for(const title of ['Banco Nación lanza una app de pagos digitales para empresas','Mercado Pago lanza un asistente financiero con inteligencia artificial para gestionar pagos y gastos de empresas','Banco Nación mejora su portal de pagos y refinanciación online para empresas','Banco Nación lanza una API para pagos masivos de empresas','Banco Nación mejora pagos digitales con QR para empresas','Banco Nación mejora pagos digitales con QR y refinanciación para empresas','Banco Nación lanza pagos móviles para empresas con refinanciación','Banco Nación improves digital payments and debt restructuring for businesses'])assert.equal(classify(title),true,title);
});
test('37: historial por envío real, empates deterministas, paginación y aislamiento de destinatarios',()=>{
 const {c}=presentationServer();c.configuration_().storage.newsletterDeliveries=300;
 const rows=Array.from({length:25},(_,i)=>({id:String(i).padStart(2,'0'),correo:'fixture@example.test',suscripcion:'sub-'+i%3,estado:'Enviada',fecha:new Date(Date.UTC(2026,9,1+i%20)).toISOString(),desde:'2026-01-01',hasta:'2026-12-31',detalle:'2 noticias incluidas'}));
 rows.push({...rows[0],id:'blocked',estado:'Bloqueada',fecha:'2026-12-31'},{...rows[0],id:'other',correo:'other@example.test',fecha:'2026-12-31'});
 const editions=rows.map(row=>({id:'edition-'+row.id,envio:row.id,correo:row.correo,estado:row.estado,fecha:'2020-01-01'}));
 c.rows_=name=>name==='NewsletterEnvios'?rows:editions;
 const expected=rows.filter(r=>r.estado==='Enviada'&&r.correo==='fixture@example.test').sort((a,b)=>Date.parse(b.fecha)-Date.parse(a.fecha)||b.id.localeCompare(a.id)).map(r=>r.id);
 const first=c.newsletterHistoryRecords_({limit:3},'fixture@example.test'),more=c.newsletterHistoryRecords_({limit:30},'fixture@example.test');
 assert.deepEqual(Array.from(first.items,r=>r.id),expected.slice(0,3));assert.deepEqual(Array.from(more.items,r=>r.id),expected);assert.equal(more.total,25);assert.equal(new Set(more.items.map(r=>r.id)).size,25);
 assert.ok(more.items.every(r=>r.edition==='edition-'+r.id));assert.equal(rows[0].id,'00');
 const pages=[0,1,2].flatMap(page=>Array.from(c.newsletterHistoryRecords_({page,correo:'fixture@example.test',estado:'Enviada'}).items,r=>r.id));assert.deepEqual(pages,expected);
});
test('37: asunto y cuerpo usan primera/segunda quincena y trimestre en cada idioma',()=>{
 const {c}=presentationServer(),expectations={es:['Primera quincena de octubre de 2026','Segunda quincena de octubre de 2026','Lo más relevante del cuarto trimestre de 2026'],en:['First half of October 2026','Second half of October 2026','Highlights of the fourth quarter of 2026'],tr:['Ekim 2026 ayının ilk yarısı','Ekim 2026 ayının ikinci yarısı','2026 yılının dördüncü çeyreğinde öne çıkanlar']};
 for(const [language,periods] of Object.entries(expectations))for(const [index,range] of [{view:'briefing',from:'2026-10-01',to:'2026-10-15'},{view:'briefing',from:'2026-10-16',to:'2026-10-31'},{view:'news',from:'2026-10-01',to:'2026-12-31'}].entries()){
  const content=presentationContent(c,{...range,country:'España'},presentationRows,language),d=new JSDOM(content.html).window.document;
  assert.ok(content.subject.includes(periods[index]),content.subject);assert.equal(d.querySelector('.newsletter-period').textContent,periods[index]);assert.ok(content.text.includes(periods[index]));
  assert.doesNotMatch(d.querySelector('.newsletter-disclaimer').textContent,/oferta y disponibilidad|offering and availability/);assert.equal(d.querySelector('.newsletter-preheader').textContent,c.translateText(range.view==='news'?'Entidades y bloques funcionales destacados en las publicaciones del trimestre.':'Novedades y movimientos competitivos en canales digitales para empresas e instituciones.',language));
 }
 for(const language of ['es','en','tr'])for(let quarter=0;quarter<4;quarter++){
  const query={view:'news',from:new Date(Date.UTC(2026,quarter*3,1)).toISOString().slice(0,10),to:new Date(Date.UTC(2026,quarter*3+3,0)).toISOString().slice(0,10)};
  const identity=c.newsletterIdentity_(query,new Date(),'',language);assert.match(identity.period,/2026/);if(language!=='es')assert.doesNotMatch(identity.period,/trimestre/);
 }
});
test('37: sin evidencia local se omite solo la ilustración internacional; identidad separada con tokens',()=>{
 const {c}=presentationServer();c.newsletterVisualAsset_=(name,images)=>{images.set(name,{id:name,data:'iVBORw0KGgo='});return true;};
 const query=presentationCases[0].query;
 for(const local of [false,true]){
  const rows=presentationRows.filter(r=>local||r.pais!=='España'),content=presentationContent(c,query,rows),d=new JSDOM(content.html).window.document;
  assert.equal(content.images.some(r=>r.id==='other-banks-visual'),local);assert.ok(content.editorial.landscapes.global.total>0);assert.ok(d.querySelector('.newsletter-article'));assert.ok(content.images.some(r=>r.id==='fortnightly-visual'));
  for(const flag of d.querySelectorAll('.story-identity .geography-flag'))assert.equal(flag.style.marginLeft,'16px');
 }
});
test('37: edición usa país del navegador y al salir limpia URL y no reaparece al cambiar de vista',async t=>{
 let replacement;
 const a=await app(t,{language:'tr-TR',location:{edition:'edition-one',view:'news',from:'2026-01-01',to:'2026-01-15'},configure({w,data}){
  data.context={mode:'edition',id:'edition-one'};data.selection={from:'2026-01-01',to:'2026-01-15'};
  w.Intl=Object.create(w.Intl);w.Intl.DateTimeFormat=function(...args){const formatter=new Intl.DateTimeFormat(...args),resolved=formatter.resolvedOptions.bind(formatter);formatter.resolvedOptions=()=>({...resolved(),timeZone:'Europe/Istanbul'});return formatter;};
 }});
 a.w.google.script.history={replace:(_state,params)=>{replacement=params;}};
 assert.equal(a.calls.find(r=>r.method==='getDashboard').query.newsGeography,'Turquía');
 await a.click('[data-edit-filter="from"]');await a.click('#restore-filters');assert.deepEqual({...replacement},{view:'news'});
 for(const view of ['radar','briefing','news'])await a.click('[data-view="'+view+'"]');
 assert.ok(a.calls.filter(r=>r.method==='getDashboard').slice(1).every(r=>!r.query.edition));
});
test('37: configuración muestra nombres maliciosos como texto y rechaza categorías ajenas al esquema',async t=>{
 const payload='<img src=x onerror=alert(1)>',a=await app(t);await a.click('[data-view="administration"]');await a.click('[data-admin-view="configuration"]');
 const input=a.find('#catalog-fields [data-key="name"]');input.value=payload;
 await a.change('#catalog-category','settings');await a.change('#catalog-category','entities');
 assert.ok(a.find('#catalog-fields').textContent.includes(payload));assert.equal(a.w.document.querySelector('#catalog-fields [onerror]'),null);
 const select=a.find('#catalog-category'),option=a.w.document.createElement('option');option.value=payload;select.append(option);await a.change('#catalog-category',payload);assert.equal(a.w.document.querySelector('#catalog-fields [onerror]'),null);
});
test('37: la edición aplica solo su periodo inicial y las peticiones posteriores no reinyectan país ni fechas',()=>{
 const {c}=presentationServer(),query={...presentationCases[0].query,country:'Colombia'},content=presentationContent(c,query);
 c.saveNewsletterEdition_('historical-edition','delivery','owner@bbva.com','Histórica',query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('historical-edition','Enviada');
 const first=c.getDashboard({view:'news',initial:true,edition:'historical-edition',newsGeography:'España'});
 assert.equal(first.selection.country,'');assert.equal(first.selection.from,query.from);assert.equal(first.newsGeography,'España');assert.equal(first.context.from,query.from);
 const changed=c.getDashboard({view:'news',initial:false,edition:'historical-edition',country:'México',from:'',to:''});
 assert.equal(changed.selection.from,'');assert.equal(changed.selection.to,'');assert.equal(changed.selection.country,'México');assert.equal(changed.context.from,query.from);
});
test('37: el favicon embebido conserva los bytes originales y el contenedor usa su URL pública inmutable',()=>{
 const {c}=presentationServer(),expected='data:image/x-icon;base64,'+fs.readFileSync(new URL('../assets/favicon.ico',import.meta.url)).toString('base64');let favicon;
 const out={setTitle(){return this;},setFaviconUrl(value){favicon=value;return this;},addMetaTag(){return this;}};
 c.HtmlService={createTemplateFromFile:()=>({evaluate:()=>out})};c.doGet({parameter:{edition:'fixture'}});assert.equal(favicon,'https://raw.githubusercontent.com/felixdelbarrio/News-Radar/87e9ef88d9331af498c1d3995ff6d1f5252bc3aa/assets/favicon.ico');
 const html=fs.readFileSync(new URL('../dist/Index.html',import.meta.url),'utf8');assert.ok(html.includes('href="'+expected+'"'));
});
