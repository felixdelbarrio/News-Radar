import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {presentationServer,presentationContent,presentationCases,presentationRows} from './helpers/newsletter-presentation.mjs';
import {app} from './helpers/app.mjs';
import vm from 'node:vm';
const document=html=>new JSDOM(html).window.document;

for(const {name,query} of presentationCases)test(name+': cabecera, menciones y ejemplos siguen el ámbito y la actividad real',()=>{
 const {c}=presentationServer(),before=JSON.stringify(presentationRows),content=presentationContent(c,query),d=document(content.html);
 assert.equal(JSON.stringify(presentationRows),before);
 assert.equal(d.querySelector('.newsletter-header-title').textContent,query.view==='news'?'Publicaciones del trimestre':'Publicaciones de la quincena');
 assert.doesNotMatch(d.querySelector('.newsletter-header').textContent,/\[bIA\]|España|Mirada global/);
 assert.match(d.querySelector('.newsletter-period').textContent,/2026/);
 for(const report of d.querySelectorAll('.newsletter-report')){
  const metrics=report.querySelector('.newsletter-metrics');
  assert.deepEqual([...metrics.querySelectorAll('.newsletter-metric-label')].map(e=>e.textContent),['Entidades','Menciones totales en prensa','Menciones directas a BBVA']);
 }
 for(const scope of ['local','global']){
  const data=content.editorial.landscapes[scope],cards=content.editorial.cards.filter(card=>card.scope===scope);if(!data?.total)continue;
  if(query.view==='news')for(const card of cards)assert.ok(data.leaders.some(leader=>leader.name===card.entity&&leader.themes.some(theme=>theme.name===card.category)));
  else{
   assert.deepEqual(cards.map(card=>card.category),data.themes.slice(0,cards.length).map(theme=>theme.name));
   for(const card of cards){const element=[...d.querySelectorAll('.newsletter-article')].find(e=>e.querySelector('h3 a').href===card.url),more=element.querySelector('.newsletter-more a'),count=data.themes.find(theme=>theme.name===card.category).count;
    assert.match(element.querySelector('.newsletter-eyebrow').textContent,/Trending topic/);
    assert.equal(Boolean(more),count>1);
    if(more){assert.match(more.textContent,new RegExp(String(count-1)));assert.equal(more.href,element.querySelector('.newsletter-lever a').href);}
    const entity=new URL(element.querySelector('.newsletter-bank a').href);assert.equal(entity.searchParams.get('entity'),card.entity);assert.equal(entity.searchParams.get('palanca'),null);
   }
  }
 }
 const edition=new URL(d.querySelector('.newsletter-edition-link').href);assert.equal(edition.searchParams.get('view'),'news');assert.equal(edition.searchParams.get('from'),query.from);assert.equal(edition.searchParams.get('to'),query.to);
 assert.equal(content.evidence.length,content.total);
});

test('cero o una noticia local mantienen el patrón sin ocultar la mirada internacional',()=>{
 const {c}=presentationServer();for(const view of ['briefing','news']){
  const query={...presentationCases[0].query,view},foreign=presentationRows.filter(row=>row.pais!=='España');
  const empty=presentationContent(c,query,foreign),one=presentationContent(c,query,[presentationRows[0],...foreign]);
  assert.ok(empty.count>0);assert.doesNotMatch(empty.html,/TU GEOGRAFÍA/);assert.match(empty.html,/MIRADA INTERNACIONAL/);
  assert.equal(one.editorial.landscapes.local.total,1);assert.match(one.html,/TU GEOGRAFÍA/);
 }
});

test('los logos fiables de medios se reutilizan y los desconocidos conservan su nombre',()=>{
 const {c}=presentationServer();for(const publisher of ['BBVA','Fuente desconocida']){
  const content=presentationContent(c,presentationCases[0].query,[{...presentationRows[0],medio:publisher}]),d=document(content.html);
  assert.equal(Boolean(d.querySelector('.publisher-logo')),Boolean(c.identityAsset('publishers',publisher)));
  assert.ok(d.querySelector('.newsletter-meta').textContent.includes(publisher));
 }
});

test('los iconos privados se incluyen antes de abrir el formulario, sin emojis ni petición posterior',async t=>{
 const {c}=presentationServer(),keys={positive:'private-feedback-positive-12345',negative:'private-feedback-negative-12345'};
 c.PropertiesService.getScriptProperties().setProperty('NEWSLETTER_VISUAL_ASSETS',JSON.stringify({'feedback-positive':keys.positive,'feedback-negative':keys.negative}));
 const original=c.DriveApp.getFileById;c.DriveApp.getFileById=id=>Object.values(keys).includes(id)?{getBlob:()=>({getContentType:()=> 'image/png',getBytes:()=>[137,80,78,71]})}:original(id);
 c.HtmlService={createHtmlOutputFromFile:()=>({getContent:()=>''})};const styles=c.include_('Styles'),content=presentationContent(c,presentationCases[0].query),d=document(content.html);
 for(const value of ['positive','negative']){assert.ok(styles.includes('[data-rating-icon="'+value+'"]{background-image:url("data:image/png;base64,'));assert.ok(content.images.some(image=>image.id==='feedback-'+value));assert.equal(d.querySelector('a[href$="feedback='+value+'"] img').getAttribute('src'),'cid:feedback-'+value);}
 c.saveNewsletterEdition_('presentation-edition','delivery','owner@bbva.com',content.subject,presentationCases[0].query,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('presentation-edition','Enviada');
 const a=await app(t,{location:{edition:'presentation-edition',view:'news',feedback:'positive'},configure({w,data}){const base=w.RADAR_PREVIEW.call;w.RADAR_PREVIEW.call=async(method,payload)=>method==='getDashboard'?{...data,...JSON.parse(JSON.stringify(c.getDashboard(payload)))}:base(method,payload);}});
 assert.equal(a.find('#edition-feedback').elements.rating.value,'positive');assert.equal(a.w.document.querySelectorAll('[data-rating-icon]').length,2);assert.doesNotMatch(a.find('#edition-feedback').textContent,/👍|👎/);assert.equal(a.calls.filter(call=>call.method==='getNewsletterFeedbackIcons').length,0);
 assert.equal(a.calls.filter(call=>call.method==='saveNewsletterFeedback').length,0);
});

test('una evicción parcial de caché recarga el PNG completo',()=>{
 const {c,cache}=presentationServer(),id='private-feedback-positive-12345',key='newsletter-visual-feedback-positive-'+id;let reads=0;
 c.PropertiesService.getScriptProperties().setProperty('NEWSLETTER_VISUAL_ASSETS',JSON.stringify({'feedback-positive':id}));
 c.DriveApp.getFileById=()=>({getBlob:()=>{reads++;return {getContentType:()=> 'image/png',getBytes:()=>Array(90000).fill(1)};}});
 assert.equal(c.newsletterVisualAsset_('feedback-positive',new Map()),true);assert.equal(c.newsletterVisualAsset_('feedback-positive',new Map()),true);assert.equal(reads,1);
 cache.delete(key+'-0');vm.runInContext('newsletterVisualMemory_.clear()',c);
 const images=new Map();assert.equal(c.newsletterVisualAsset_('feedback-positive',images),true);assert.equal(reads,2);assert.equal(Buffer.from(images.get('feedback-positive').data,'base64').length,90000);
});

test('la construcción MIME se puede medir sin ejecutar transporte',()=>{
 const {c}=presentationServer(),content=presentationContent(c,presentationCases[1].query);
 c.gmailRequest_=()=>{throw Error('El diagnóstico no puede enviar');};
 const raw=c.newsletterMime_({name:'News Radar',address:'news-radar.group@bbva.com'},'owner@bbva.com',content);
 assert.match(raw,/To: owner@bbva.com/);assert.match(raw,/multipart\/related/);
 for(const image of content.images)assert.ok(raw.includes('Content-ID: <'+image.id+'>'));
});

test('la flecha diagonal indicada se comparte en enlaces y CTA sin icono de cadena',()=>{
 const {c}=presentationServer();
 for(const item of presentationCases){const content=presentationContent(c,item.query),d=document(content.html);assert.ok(content.images.some(image=>image.id==='link-arrow-on-action'));assert.equal(d.querySelector('.newsletter-edition-link img').getAttribute('src'),'cid:link-arrow-on-action');assert.equal(d.querySelector('.newsletter-edition-link img').getAttribute('alt'),'');assert.equal(d.querySelector('img[src="cid:link-icon"]'),null);if(item.query.view==='news')assert.ok(d.querySelector('img[src="cid:link-arrow"]'));}
 c.HtmlService={createHtmlOutputFromFile:()=>({getContent:()=>'<style>base</style>'})};assert.equal(c.include_('Styles'),'<style>base</style>');
});
