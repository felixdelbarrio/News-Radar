import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {presentationServer,presentationContent,presentationCases,presentationRows,presentationContract} from './helpers/newsletter-presentation.mjs';
const document=html=>new JSDOM(html).window.document;
test('el periodo trimestral conserva trimestre y año con el nuevo copy',()=>{
 const {c}=presentationServer();for(const [month,end,ordinal] of [['01','03-31','primer'],['04','06-30','segundo'],['07','09-30','tercer'],['10','12-31','cuarto']]){
  const period=c.newsletterIdentity_({view:'news',from:'2026-'+month+'-01',to:'2026-'+end},new Date('2026-12-31T12:00:00Z')).period;
  assert.equal(period,'Lo más relevante del '+ordinal+' trimestre de 2026');
 }
});
for(const {name,query} of presentationCases){
 test(name+': conserva el corpus previo y presenta enlaces y CID íntegros',()=>{
  const s=presentationServer(),c=s.c,result=presentationContent(c,query),d=document(result.html);
  const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/newsletter-presentation/'+name+'.contract.json',import.meta.url)));assert.equal(result.total,baseline.total);assert.deepEqual(Array.from(result.editorial.corpusIds),baseline.editorial.corpusIds);assert.deepEqual(Array.from(result.evidence,row=>row.id),baseline.editorial.corpusIds);
  assert.equal(d.querySelectorAll('.newsletter-article').length,result.count);
  assert.equal(d.querySelector('.newsletter-intro').textContent,query.view==='briefing'?'Qué se ha publicado, acerca de los canales digitales de Banca de Empresas, para revisar esta quincena.':'Qué se ha publicado, acerca de los canales digitales de Banca de Empresas, en los medios.');
  for(const expected of result.editorial.cards){
   const cards=[...d.querySelectorAll('.newsletter-article')].filter(card=>card.querySelector('h3 a')?.href===expected.url);assert.equal(cards.length,1);
   const card=cards[0];assert.equal(card.querySelector('.newsletter-read'),null);
   assert.ok((query.view==='news'?card.closest('.newsletter-leader'):card).querySelector('.entity-logo,.entity-monogram'));assert.ok(card.querySelector('.geography-flag'));
   assert.ok(card.querySelector('.newsletter-card-cell').style.padding);
  }
  const scopes=[...d.querySelectorAll('.newsletter-scope')];if(query.country&&result.editorial.cards.some(card=>card.scope==='local')&&result.editorial.cards.some(card=>card.scope==='global')){
   assert.equal(scopes.length,2);const global=scopes[1];for(const card of result.editorial.cards.filter(card=>card.scope==='local')){const element=[...d.querySelectorAll('.newsletter-article')].find(row=>row.querySelector('h3 a')?.href===card.url);assert.ok(element.compareDocumentPosition(global)&4,'la noticia local precede a la mirada internacional');}
  }
  if(query.view==='news')for(const card of result.editorial.cards){const element=[...d.querySelectorAll('.newsletter-article')].find(row=>row.querySelector('h3 a')?.href===card.url),leader=element.closest('.newsletter-leader');assert.ok(leader.querySelector('.newsletter-bank').textContent.includes(card.entity));assert.ok(leader.textContent.includes(card.category));}
  assert.ok(d.querySelector('.newsletter-brand').compareDocumentPosition(d.querySelector('.newsletter-feedback'))&4);
  assert.equal(d.querySelectorAll('.newsletter-feedback a').length,2);
  for(const a of d.querySelectorAll('.newsletter-feedback a')){const u=new URL(a.href);assert.equal(u.searchParams.get('edition'),'presentation-edition');assert.ok(['positive','negative'].includes(u.searchParams.get('feedback')));}
  assert.equal(s.c.rows_('NewsletterFeedback').length,0);
  assert.equal(d.querySelectorAll('.newsletter-preheader').length,1);assert.equal(d.querySelector('.newsletter-preheader').style.display,'none');
  assert.equal(d.querySelector('.newsletter-header-title').style.color,'rgb(0, 19, 145)');
  assert.equal(d.querySelector('.newsletter-metric a'),null,'las cifras no fingen un conjunto filtrado equivalente');
  assert.doesNotMatch(result.html,/data:image|https?:\/\/[^"<> ]+\.(?:png|jpg)|display:(?:flex|grid)|@font-face|<section/);
  const ids=result.images.map(image=>image.id);assert.equal(new Set(ids).size,ids.length);
  for(const img of d.images){assert.ok(img.alt);assert.ok(ids.includes(img.src.replace('cid:','')));}
  let mime;c.Utilities.base64EncodeWebSafe=value=>Buffer.from(value).toString('base64url');c.gmailRequest_=(_path,payload)=>{mime=Buffer.from(payload.raw,'base64url').toString();return {id:'verified'};};
  c.sendNewsletterMail_({name:'News Radar',address:'news-radar.group@bbva.com'},'owner@bbva.com',result);
  assert.match(mime,/multipart\/related/);assert.match(mime,/multipart\/alternative/);
  for(const image of result.images){assert.equal(mime.split('Content-ID: <'+image.id+'>').length,2);assert.ok(mime.includes(image.data.match(/.{1,76}/g).join('\r\n')));}
  assert.ok(Buffer.byteLength(result.html)<102400);assert.match(result.html,/<!--\[if mso\]><table style="[^"]*width:640px/);
 });
 test(name+': todos los contextos enlazan a la edición congelada y sobreviven a cambios de catálogo',()=>{
  const s=presentationServer(),c=s.c,result=presentationContent(c,query),d=document(result.html);
  c.saveNewsletterEdition_('presentation-edition','delivery','owner@bbva.com',result.subject,query,'es',result.evidence,result.editorial);c.completeNewsletterEdition_('presentation-edition','Enviada');
  const anchors=[...d.querySelectorAll('a')].filter(a=>new URL(a.href).searchParams.has('edition'));
  const read=()=>anchors.map(a=>{const q={...Object.fromEntries(new URL(a.href).searchParams),initial:true};assert.equal(q.view,'news');assert.equal(q.from,query.from);assert.equal(q.to,query.to);const data=c.getDashboard(q);assert.equal(data.context.id,'presentation-edition');assert.ok(data.items.length>0,'Destino contextual vacío: '+a.href);assert.ok(data.items.every(row=>(!q.entity||row.entidad===q.entity)&&(!q.palanca||row.taxonomia.some(tag=>tag.palanca===q.palanca))));assert.ok(data.items.every(row=>result.evidence.some(original=>row.id===original.id)));return JSON.parse(JSON.stringify({ids:data.items.map(row=>row.id),editorial:data.context.editorial}));});
  const before=read();c.configuration_().applicationScope=[];c.configuration_().geographies=[];c.entityKey_=value=>'changed '+value;s.cache.clear();assert.deepEqual(read(),before);
 });
}
test('fallbacks de entidad/país, alias y evidencia vacía o insegura mantienen texto accesible',()=>{
 const {c}=presentationServer(),query=presentationCases[1].query;
 const result=presentationContent(c,query,[{...presentationRows[0],entidad:'Entidad sin logo',pais:'País sin bandera'}]),d=document(result.html);
 assert.equal(d.querySelector('.entity-monogram').getAttribute('aria-label'),'Entidad sin logo');assert.match(d.querySelector('.newsletter-bank').textContent,/Entidad sin logo · País sin bandera/);
 for(const url of ['', 'javascript:alert(1)','http://example.com','data:text/html,test']){const content=presentationContent(c,query,[{...presentationRows[0],url}]);assert.equal(content.count,0);assert.equal(document(content.html).querySelector('.newsletter-article'),null);}
 for(const pais of ['', 'Sin determinar']){const content=presentationContent(c,query,[{...presentationRows[0],pais}]);assert.equal(content.count,1);assert.ok(document(content.html).querySelector('.entity-logo'));}
 const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 assert.match(c.identityMark('entities','Caixabank',escape,new Map()),/cid:/);
 const unsafe={...result.editorial.cards[0],url:'javascript:alert(1)',title:'<img src=x onerror=alert(1)>',entity:'A & B',country:'<b>País</b>',category:'<script>danger</script>'};
 const card=document(c.newsletterCardHtml_(unsafe,result.editorial,query,escape,escape,{app:''},new Map(),'es'));
 assert.equal(card.querySelector('h3 a'),null);assert.equal(card.querySelector('script,[onerror]'),null);assert.match(card.querySelector('h3').textContent,/<img/);
});
test('los controles nuevos se traducen y admiten textos extensos sin contenido editorial añadido',()=>{
 const {c}=presentationServer();for(const language of ['en','tr']){
  const result=presentationContent(c,presentationCases[1].query,[{...presentationRows[0],titular:'Empresa '.repeat(100),extracto:'Detalle '.repeat(200)}],language),d=document(result.html);
  assert.equal(d.querySelector('.newsletter-read'),null);assert.ok(d.querySelector('.newsletter-article h3 a'));assert.equal(d.querySelector('.newsletter-feedback p').textContent,c.translateText('¿Te ha resultado útil?',language));assert.ok(result.html.includes('lang="'+language+'"'));
 }
 // El historial y las reglas de repetición tienen su propia batería; la presentación admite cero tarjetas.
 const empty=presentationContent(c,presentationCases[3].query,[]);assert.equal(empty.count,0);assert.equal(document(empty.html).querySelector('.newsletter-report'),null);
});
test('los recursos privados se incorporan por CID y respetan la variante y el ámbito',()=>{
 const {c}=presentationServer(),keys=Object.fromEntries(['bei-logo','fortnightly-visual','quarterly-visual','other-banks-visual'].map((name,index)=>[name,'private-visual-asset-'+index+'-1234567890']));
 c.PropertiesService.getScriptProperties().setProperty('NEWSLETTER_VISUAL_ASSETS',JSON.stringify(keys));
 const original=c.DriveApp.getFileById;c.DriveApp.getFileById=id=>Object.values(keys).includes(id)?{getBlob:()=>({getContentType:()=> 'image/png',getBytes:()=>[137,80,78,71,13,10,26,10]})}:original(id);
 for(const {name,query} of presentationCases){
  const result=presentationContent(c,query),d=document(result.html),ids=result.images.map(image=>image.id);
  assert.ok(ids.includes('bei-logo'),name);assert.equal(d.querySelector('.newsletter-wordmark img').getAttribute('src'),'cid:bei-logo');
  assert.equal(ids.includes(query.view==='news'?'quarterly-visual':'fortnightly-visual'),query.view!=='news'||Boolean(query.country),name);
  assert.equal(ids.includes('other-banks-visual'),Boolean(query.country&&result.editorial.cards.some(card=>card.scope==='global')),name);
  assert.doesNotMatch(result.html,/drive\.google\.com|private-visual-asset/);
 }
});
