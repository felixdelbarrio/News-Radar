import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {read} from '../scripts/source.mjs';
import {feedLanguage} from '../src/shared/locales.js';

function parser(){
 const xmlURI='http://www.w3.org/XML/1998/namespace',calls=[];
 function wrap(element){return element&&{
  getChild:name=>wrap([...element.children].find(child=>child.tagName===name)),
  getChildren:name=>[...element.children].filter(child=>child.tagName===name).map(wrap),
  getChildText:(name,namespace)=>[...element.children].find(child=>child.localName===name&&child.namespaceURI===(namespace||null))?.textContent||'',
  getAttribute:(name,namespace)=>{const value=element.getAttributeNS(namespace||null,name);return value===null?null:{getValue:()=>value};},
  getText:()=>element.textContent
 };}
 const c=vm.createContext({feedLanguage,settings_:()=>({maxItems:100}),canonicalUrl_:value=>value,XmlService:{
  getXmlNamespace:()=>xmlURI,
  getNamespace:uri=>{calls.push(uri);if(uri===xmlURI)throw Error('Argumento no válido');return uri;},
  parse:xml=>({getRootElement:()=>wrap(new JSDOM(xml,{contentType:'text/xml'}).window.document.documentElement)})
 }});
 vm.runInContext(read('src/server/news/Feeds.gs'),c);return {c,calls};
}
const item='<item><title>Noticia</title><link>https://publisher.test/article</link><description>Extracto</description><source url="https://publisher.test/">Editor</source></item>';
test('RSS válido sin xml:lang no crea el namespace reservado con getNamespace',()=>{
 const {c,calls}=parser(),rows=c.parseFeed_('<rss><channel><language>es</language>'+item+item+'</channel></rss>');
 assert.equal(rows.length,2);assert.equal(rows[0].language,'es');assert.equal(rows[0].articleLanguage,'');assert.equal(rows[0].source,'Editor');assert.equal(rows[0].sourceUrl,'https://publisher.test/');assert.equal(rows[0].excerptSource,'rss:description');
 assert.deepEqual(calls,['http://purl.org/rss/1.0/modules/content/']);
});
test('xml:lang del artículo prevalece, el canal sirve de fallback y content:encoded se conserva',()=>{
 const {c}=parser(),xml='<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel xml:lang="en-US">'+item.replace('<item>','<item xml:lang="tr">')+item.replace('<description>Extracto</description>','<content:encoded><![CDATA[Texto completo]]></content:encoded>')+'</channel></rss>',rows=c.parseFeed_(xml);
 assert.equal(rows[0].language,'tr');assert.equal(rows[0].articleLanguage,'tr');assert.equal(rows[1].language,'en-US');assert.equal(rows[1].rssContent,'Texto completo');assert.equal(rows[1].excerptSource,'rss:content:encoded');
 assert.equal(c.parseFeed_(xml.replace('<channel xml:lang="en-US">','<channel xml:lang="en-US"><language>es</language>'))[1].language,'es');
});
test('RSS malformado o incompatible falla de forma definitiva y no impide parsear el siguiente',()=>{
 const {c}=parser();for(const xml of ['<rss>','<feed/>']){let failure;try{c.parseFeed_(xml);}catch(error){failure=error;}assert.ok(failure);assert.equal(failure.retryable,undefined);}
 assert.equal(c.parseFeed_('<rss><channel>'+item+'</channel></rss>').length,1);
});
