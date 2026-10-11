import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {detectLanguage,supportedLanguage,translations,translateText,formatText,formatCalendarDay,feedLanguage} from '../src/shared/locales.js';
import {files,read,readServerScript} from '../scripts/source.mjs';
import {app,tick} from './helpers/app.mjs';

test('la detección usa preferencias ordenadas, variantes regionales y español si ninguna es compatible',()=>{
 for(const [values,expected] of [[['fr-FR','tr-TR','en-US'],'tr'],[['en-GB','es-ES'],'en'],[['es-419'],'es'],[['zh','de'],'es'],[[],'es']])assert.equal(detectLanguage(values),expected);
 for(const code of ['es','en','tr'])assert.equal(supportedLanguage(code),true);
 for(const code of ['constructor','__proto__','fr',null,{},'en-US'])assert.equal(supportedLanguage(code),false);
 assert.equal(translateText('Administración','es'),'Administración');assert.equal(translateText('Administración','fr'),'Administración');
 assert.equal(translateText('Medio: No indicado','en'),'Publisher: Not specified');assert.equal(translateText('ADMINISTRACIÓN','tr'),'YÖNETİM');
 assert.equal(translateText('RSS / URL / News Radar','en'),'RSS / URL / News Radar');assert.equal(translateText('noticias@bbva.com https://example.com/Noticias/España','en'),'noticias@bbva.com https://example.com/Noticias/España');
 assert.equal(formatText('Página {page} de {pages}',{page:1,pages:2},'tr'),'Sayfa 1 / 2');assert.equal(formatText('{empty}',{},'en'),'');
 for(const language of ['es','en','tr'])assert.equal(formatCalendarDay('2026-10-11',language),new Intl.DateTimeFormat(language,{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date('2026-10-11T00:00:00Z')));
 for(const tag of ['es','en-US','es-419','tr'])assert.equal(feedLanguage(tag),tag);for(const tag of ['',null,'invalid_language','x'.repeat(1000000)])assert.equal(feedLanguage(tag),'');assert.equal(feedLanguage(' en-US '),'en-US');
 assert.equal(formatCalendarDay('', 'es'),'');assert.equal(formatCalendarDay('invalid','tr'),'invalid');
});

test('todos los literales estáticos, atributos accesibles y etiquetas de configuración tienen traducciones completas',()=>{
 const ignored=new Set(['Radar','Newsletter','News Radar','RSS','URL','bIA','BBVA','↗','↻','×','✕','/','—','01','02','03']);
 const values=new Set();
 for(const file of files('src/views')){
  const dom=new JSDOM(read(file)),d=dom.window.document,walker=d.createTreeWalker(d.body,4);let node;
  while(node=walker.nextNode()){if(node.parentElement.closest('style,script'))continue;const text=node.textContent.trim().replace(/^[+↻]\s*|\s*[↗↓]$/g,'').replace(/^\.\s*/,'');if(text&&!text.includes('{{'))values.add(text);}
  for(const el of d.querySelectorAll('*'))for(const attribute of ['placeholder','aria-label','title','alt']){const value=el.getAttribute(attribute);if(value&&!value.includes('nombre@'))values.add(value);}
  dom.window.close();
 }
 const schema=JSON.parse(read('assets/admin-schema.json'));
 for(const item of Object.values(schema)){values.add(item.label);values.add(item.help);for(const [,label] of item.fields||[])values.add(label);for(const label of Object.values(item.labels||{}))values.add(label);for(const group of item.groups||[])values.add(group.label);}
 const missing=[...values].filter(value=>!ignored.has(value)&&translateText(value,'en')===value&&translateText(value,'tr')===value);
 assert.deepEqual(missing,[]);
 for(const [key,values] of Object.entries(translations)){assert.equal(values.length,2,key);assert.ok(values.every(value=>typeof value==='string'&&value.trim()),key);}
});

for(const language of ['es','en','tr'])test('interfaz '+language+': formularios, filtros, originales y idioma de las newsletters',async t=>{
 const a=await app(t,{language:language+'-'+(language==='tr'?'TR':language==='en'?'GB':'ES')});
 assert.equal(a.w.document.documentElement.lang,language);
 await a.click('[data-view="news"]');assert.equal(a.find('#page-title').textContent,translateText('Noticias',language));
 await a.change('#filters [name="country"]','España');assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.country,'España');assert.equal(a.find('#filters [name="country"]').value,'España');assert.equal(a.find('#filters [name="country"] option[value="España"]').textContent,translateText('España',language));
 a.data.items=[{titular:'Noticias de España',extracto:'Nueva cuenta en España',medio:'Noticias España',pais:'España',fecha:'2026-10-11',url:'https://example.com/original',entidad:'BBVA',tema:'Financiación'}];a.data.total=1;
 await a.click('[data-view="radar"]');await a.click('[data-view="news"]');
 assert.equal(a.find('#news-list h3').textContent,'Noticias de España');assert.equal(a.find('#news-list .news-meta [data-original]')?.textContent??'Noticias España','Noticias España');assert.equal(a.find('#news-list p[data-original]').textContent,'Nueva cuenta en España');
 await a.click('[data-view="subscriptions"]');await a.click('#new-subscription');assert.equal(a.find('#personal-editor [name="language"]').value,language);
 const name=a.find('#personal-editor [name="name"]');name.value='Noticias de España';await a.submit('#personal-editor form');const saved=a.calls.find(row=>row.method==='saveSubscription').query;assert.equal(saved.language,language);assert.equal(saved.name,'Noticias de España');
 await a.click('[data-view="administration"]');assert.equal(a.find('#preview-language').value,'');await a.click('[data-admin-view="subscribers"]');await a.click('#new-admin-subscription');assert.equal(a.find('#admin-subscription-editor [name="language"]').value,'es');
 await a.change('#admin-subscription-editor [name="language"]','tr');await a.submit('#admin-subscription-editor form');assert.equal(a.calls.find(row=>row.method==='saveAdminSubscription').query.language,'tr');
 a.replies.getAdoption.options={vista:['administration'],evento:['rendimiento']};
 for(const view of ['configuration','sources','audit','telemetry','adoption']){await a.click('[data-admin-view="'+view+'"]');assert.ok(a.find('#'+view+'-section').textContent.length);}
 assert.equal(a.find('#adoption-vista option[value="administration"]').textContent,translateText('Administración',language));await a.change('#adoption-vista','administration');assert.equal(a.calls.filter(row=>row.method==='getAdoption').at(-1).query.vista,'administration');
 const required=a.find('#source-fields input');required.value='';required.dispatchEvent(new a.w.Event('invalid',{bubbles:false}));assert.equal(required.validationMessage,translateText('Campo obligatorio.',language));required.value='test';required.dispatchEvent(new a.w.Event('input',{bubbles:true}));assert.equal(required.validity.customError,false);
});

test('la preferencia de prueba es propia de la pestaña y puede restaurarse al idioma del navegador',async t=>{
 const a=await app(t,{language:'es-ES',override:'tr'});assert.equal(a.w.document.documentElement.lang,'tr');await a.change('#preview-language','en');assert.equal(a.w.sessionStorage.getItem('news-radar-language'),'en');await a.change('#preview-language','');assert.equal(a.w.sessionStorage.getItem('news-radar-language'),null);
 const b=await app(t,{language:'en-US'});assert.equal(b.w.document.documentElement.lang,'en');assert.equal(b.w.sessionStorage.getItem('news-radar-language'),null);
 const c=await app(t,{language:'tr-TR',override:'unsupported'});assert.equal(c.w.document.documentElement.lang,'tr');
});

test('newsletters HTML y texto se generan por destinatario en tres idiomas sin traducir noticias ni URLs',()=>{
 const config=JSON.parse(read('assets/configuration-defaults.json')),c=vm.createContext({});vm.runInContext(readServerScript('dist',true),c);c.configuration_=()=>config;c.settings_=()=>config.settings;config.settings.newsletterAppUrl='https://script.google.com/macros/s/test/exec';
 const row={titular:'Noticias de España',extracto:'Oferta original en español.',pais:'España',fecha:'2026-10-11',entidad:'BBVA',medio:'Noticias España',tipo:'Banco tradicional',senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],tema:'Financiación',url:'https://example.com/noticias'};
 for(const language of ['es','en','tr']){const result=c.newsletterContent_([row],{entity:'BBVA'},'Noticias de España',new Date('2026-10-11T12:00:00Z'),'sub-id',language);assert.match(result.html,new RegExp('lang="'+language+'"'));assert.ok(result.html.includes(translateText('Gestiona tu suscripción',language)));assert.ok(result.text.includes(translateText('Novedades detectadas',language)));assert.ok(result.html.includes(row.extracto));assert.ok(result.html.includes(row.titular));assert.ok(result.text.includes(row.url));assert.equal(result.count,1);assert.equal(result.items[0],row);const document=new JSDOM(result.html).window.document;assert.equal(document.head.querySelector('meta[name="color-scheme"]').content,'light only');assert.match(document.querySelector('header').style.backgroundImage,/linear-gradient/);assert.match(document.querySelector('style').textContent,/color-scheme:only light/);}
 assert.throws(()=>c.newsletterContent_([],{},'Title',new Date(),'', 'fr'),/Idioma/);
 const empty=c.newsletterContent_([],{},'Test',new Date(),'', 'tr');assert.equal(empty.count,0);
 for(const language of ['es','en','tr'])assert.equal(c.subscriptionRecord_({name:'Mi canal',language,filters:{}},'user@bbva.com','id',new Date(),0).idioma,language);
 assert.equal(c.subscriptionRecord_({name:'Default',filters:{}},'user@bbva.com','id',new Date(),0).idioma,'es');assert.throws(()=>c.subscriptionRecord_({name:'Bad',language:'fr'},'user@bbva.com','id',new Date(),0),/Idioma/);
});

test('clasificación inglesa y turca reconoce productos, segmentos y exclusiones sin llamadas externas',()=>{
 const c=vm.createContext({});vm.runInContext(readServerScript('dist',true),c);c.configuration_=()=>JSON.parse(read('assets/configuration-defaults.json'));
 const rows=c.annotateNews_([{entidad:'BBVA',titular:'BBVA introduces a new business account',extracto:''},{entidad:'BBVA',titular:'Garanti BBVA KOBİ için yeni hesap sunar',extracto:''},{entidad:'BBVA',titular:'Yeni hesap nedir: rehber',extracto:''}]);
 assert.ok(rows[0].senales.includes('Lanzamiento de producto'));assert.ok(rows[1].senales.includes('Lanzamiento de producto'));assert.ok(rows[1].segmentos.includes('Empresas e instituciones'));assert.equal(rows[2].senales.length,0);assert.equal(c.searchText_('İŞ BANKACILIĞI'),c.searchText_('iş bankacılığı'));
});

test('la recopilación conserva inglés y turco y el idioma explícito o declarado por el RSS',()=>{
 const c=vm.createContext({Utilities:{getUuid:()=> 'id',formatDate:value=>value.toISOString().slice(0,10)}});vm.runInContext(readServerScript('dist',true),c);const config=JSON.parse(read('assets/configuration-defaults.json'));c.configuration_=()=>config;
 const values={title:'BBVA introduces a new business account',link:'https://www.bbva.com/en/account/',pubDate:'2026-10-10T10:00:00Z',description:'An account for small businesses',source:''};
 c.XmlService={parse:()=>({getRootElement:()=>({getChild:()=>({getChildText:()=> 'en-US',getChildren:()=>[{getChildText:key=>values[key]}]})})})};
 const raw=c.parseFeed_('<rss/>')[0],feed=config.feeds.find(row=>row.language==='en'),now=new Date('2026-10-11T12:00:00Z'),item=c.evaluate_(raw,feed,now).item,record=c.newsRecord_(item,feed,now);
 assert.equal(record[5],values.title);assert.equal(record[6],values.description);assert.equal(record[11],'en-US');
 const trFeed=c.profileFeed_(config.geographies.find(row=>row.language==='tr'),config.entities[0]);assert.equal(trFeed.language,'tr');assert.match(trFeed.url,/hl=tr/);
 const tr=c.evaluate_({title:'Garanti BBVA yeni hesap sunar',excerpt:'KOBİ için ticari hesap',url:'https://news.google.com/article',date:values.pubDate},trFeed,now).item;assert.ok(tr);assert.equal(c.newsRecord_(tr,trFeed,now)[11],'tr');
 const original=JSON.stringify(config);config.feeds[0].language='invalid_language';assert.throws(()=>c.validateConfiguration_(config),/Idioma de fuente/);assert.notEqual(JSON.stringify(config),original);
});
test('cambiar de idioma conserva documento, sección, borradores y filtros sin navegar ni recargar',async t=>{
 const a=await app(t,{language:'es-ES'});await a.click('[data-view="administration"]');await a.click('[data-admin-view="sources"]');
 const field=a.find('#source-fields input'),document=a.w.document;field.value='Borrador sin guardar';await a.click('[data-admin-view="language"]');
 for(const language of ['en','tr','es','tr','en','']){
  await a.change('#preview-language',language);const expected=language||'es';assert.equal(a.w.document,document);assert.equal(document.documentElement.lang,expected);assert.equal(a.find('#language-section').hidden,false);assert.equal(field.value,'Borrador sin guardar');
  assert.equal(a.find('[data-view="news"]').textContent.trim(),translateText('Noticias',expected));assert.equal(a.find('[data-admin-view="language"]').textContent.trim(),translateText('Idioma',expected));assert.equal(a.calls.filter(row=>row.method==='getDashboard').at(-1).query.language,expected);
  assert.ok(a.find('#translation-schedule').textContent.includes(translateText('Activada',expected)));
 }
});
