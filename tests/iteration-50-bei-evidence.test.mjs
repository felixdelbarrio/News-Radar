import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';

const now=new Date('2026-11-05T12:00:00Z');
const feed={entity:'Stripe',name:'Stripe · España',country:'España',url:'https://news.google.com/rss/search?gl=ES&hl=es-ES',domain:'news.google.com',kind:'profile'};
const evaluate=(c,title,excerpt='',origin=feed)=>c.evaluate_({title,excerpt,source:'Editor',sourceUrl:'https://editor.es',url:'https://news.google.com/articles/example',date:'2026-11-04'},origin,now);

test('el segmento requiere evidencia del destinatario o del uso y una capacidad concreta',()=>{
 const {c}=storage();c.initializeConfiguration();
 for(const [title,excerpt] of [
  ['Stripe y miPlata lanzan tarjeta Visa de stablecoins','La empresa tiene su sede en Miami.'],
  ['Stripe launches stablecoin payments for consumers',''],
  ['Stripe presents a stablecoin forecast for institutional clients',''],
  ['Stripe launches a stablecoin pilot with another bank',''],
  ['Stripe launches a new digital payments app','Empresas: nueva oferta.'],
  ['Stripe obtains a licence to issue stablecoins',''],
  ['Stripe y un banco firman una alianza institucional',''],
  ['Stripe and a bank announce a strategic partnership for corporate payments',''],
  ['Stripe expands its stablecoin strategy for institutional clients',''],
  ['Banco y Swift exploran pagos internacionales con móvil o email',''],
  ['Dictan más de 3 años de cárcel por falsificar un pago Yape','El comercio recibió un comprobante falso.'],
  ['Esposa de ex titular del BCP cobró por asesoría','']
 ]){
  const entity=/Yape|BCP/.test(title)?'BCP':title.startsWith('Banco')?'CaixaBank':'Stripe';
  const result=evaluate(c,title,excerpt,{...feed,kind:'rss',entity});
  assert.equal(result.item,undefined,title);
  assert.equal(result.candidate.labels.senales.length,0,title);
  if(!result.candidate.labels.evidencia.segmento.length)assert.equal(result.candidate.labels.segmentos.length,0,title);
 }
 for(const [title,excerpt] of [
  ['Stripe launches stablecoin payments for merchants in Colombia',''],
  ['Stripe launches a stablecoin checkout','Stores can accept stablecoin payments at checkout.'],
  ['Stripe completes a pilot for corporate overseas remittances using stablecoins',''],
  ['Stripe launches an institutional custody platform for stablecoins','']
 ]){
  const result=evaluate(c,title,excerpt);
  assert.ok(result.item?.labels.digital,title);
  assert.ok(result.item.labels.evidencia.segmento.length,title);
 }
});

test('el mercado explícito y la región prevalecen sobre la procedencia RSS',()=>{
 const {c}=storage();c.initializeConfiguration();
 const title='Stripe y miPlata lanzan pagos digitales para comercios';
 const none=evaluate(c,title,'La empresa tiene su sede en Estados Unidos.');
 assert.equal(none.item.country,'España');
 assert.equal(none.item.geography.reason,'domain');
 const provenance=JSON.parse(c.newsRecord_(none.item,feed,now)[11]).procedencia;
 assert.equal(provenance.paisRSS,'España');
 assert.equal(evaluate(c,title+' en Colombia').item.country,'Colombia');
 assert.equal(evaluate(c,title+' para Europa').item.country,'EMEA');
 assert.equal(evaluate(c,title+' para Europa').item.geography.type,'REGION');
 assert.deepEqual(Array.from(evaluate(c,title+' en Colombia y México').item.geography.geographies),['Colombia','México']);
});

test('Noticias recupera la geografía del histórico de la iteración 50 al leer',()=>{
 const {c,sheets}=storage();c.initializeConfiguration();
 const source={...feed,entity:'CaixaBank',name:'CaixaBank · España'};
 const {item}=evaluate(c,'CaixaBank lanza pagos digitales para empresas','',source);
 const row=c.newsRecord_(item,source,now),labels=JSON.parse(row[11]);
 row[2]='Sin determinar';
 row[11]=JSON.stringify({...labels,procedencia:{...labels.procedencia,paisMetodo:'undetermined',geografias:['Sin determinar']}});
 sheets.get('Noticias').grid.push(row);
 const cached=c.cachedNewsRecords_();
 assert.equal(cached[0].pais,'España');
 assert.deepEqual(Array.from(cached[0].geografias),['España']);
 assert.equal(c.newsCsv_(cached,{country:'España'},'es',true).count,1);
 assert.equal(c.selectNews_(c.newsRowsForPeriod_(),{country:'España'}).length,1);
 assert.equal(sheets.get('Noticias').grid[1][2],'Sin determinar');
});
