import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
const positive=[
 '¿No puedes hacer pagos? BBVA México reporta fallas en su app este jueves 28 de mayo',
 'Uno de los bancos más grandes de Argentina lanzó una nueva plataforma de cobros y pagos',
 'Así es Banco Santander Pay: la herramienta que promete revolucionar los cobros de empresas',
 'España: Bankinter implementó RCS para confirmar transferencias y pagos',
 'BBVA México y Buk se alían para digitalizar la gestión de talento y las finanzas de las empresas en el país',
 'BBVA México lanza solución para que pymes puedan solicitar crédito por la vía digital',
 'Con banca y crédito simple digital buscan bancarizar a las Pymes en México: BBVA',
 'BBVA México lanzó estrategia de financiamiento digital para 1.1 millones de Pymes por hasta 14 mdp',
 'BBVA lanza nuevo crédito pyme 100% digital; espera colocar 1,500 mdp en el primer año',
 'BBVA México presentó Pago Directo, solución para realizar pagos digitales',
 'BBVA y MBRF lanzaron el primer Programa de Confirming Sostenible de Uruguay',
 'App Itaú Empresas: gestión financiera creada con clientes',
 'Banorte y CONTPAQi se alían para que las PyMEs integren banca y contabilidad en tiempo real',
 'Citi to Offer Stablecoin Checkout for Corporate Clients, With Coinbase Handling the Conversion',
 'HSBC launches HSBCnio digital banking solution for businesses',
 'National Australia Bank: Digital Business Lending and Automated Credit Decisions',
 'Vivid chooses Wise Platform for international SME payments',
 'KB Kookmin Bank teams up with SAP Korea on embedded finance to expand corporate banking',
 'Garanti BBVA KOBİ için yeni nakit yönetimi sunar',
 'PagoEfectivo de Paysafe se asocia con Yape para ampliar opciones de pagos digitales en el Perú',
 'Getnet (Santander) permitirá a las empresas tener una única solución de pago para 30 países europeos',
 'Banco Sabadell completa su primer pago real con un agente de inteligencia artificial',
 'Shinhan Bank completes stablecoin proof-of-concept for corporate overseas remittances',
 'BBVA habilita una API para que los autónomos concilien sus facturas',
 'BBVA integra el stock de pymes con su API digital',
 'BBVA incorpora IA a su asistente digital para empresas',
 'BBVA digitaliza pagos de universidades e instituciones',
 'Citi and Coinbase Expand Collaboration to Connect Digital and Fiat Payments for Corporations and Consumers'
];
const negative=[
 'BBVA financia hasta 12 cuotas compras con 1 solo pago con tarjeta de crédito o débito',
 'BBVA Uruguay, mejor banco de Trade Finance del país por sexto año consecutivo',
 'BBVA premiará a los nuevos clientes en España que usen la cuenta y Bizum',
 'BBVA habilitó el pago de servicios con tarjeta de crédito desde su app',
 'BBVA fortalece el ahorro digital con una cuenta que ofrece hasta 8,5% de rentabilidad anual',
 'BBVA presenta resultados financieros de banca digital',
 'Bank of America Corporation shares purchased by investment fund',
 'Solactive BBVA Cybersecurity EUR Index NTR Forum & Discussion',
 'BPS y BROU confirman pagos de mayo: este es el calendario',
 'CALENDARIO oficial de pagos de la Beca Rita Cetina de octubre',
 'Barclays bankers demand one-off payment to return to office just three days a week',
 'Mercado Pago permite comprar y vender acciones',
 'Mercado Pago lanzó descuentos de hasta 30% y cuotas sin interés por el Día de la Madre',
 'La Justicia archivó la denuncia por usura por los créditos de Mercado Pago',
 'Rada Tilly: cobraban la cocaína por Mercado Pago y las transferencias dejaron un rastro',
 'Banco Santander appoints new director for digital payments',
 'Visa expands stablecoin payments: Barclays keeps Buy on Visa stock',
 'N26 launches online banking for personal customers',
 'BBVA mejora su app para particulares',
 'Banco tradicional presenta resultados trimestrales',
 'Qué es una API bancaria y cómo funciona',
 'Cómo abrir una cuenta para empresas por internet',
 'HSBC recognised for cash management in Qatar by Euromoney'
];
test('recuperación reconoce servicios empresariales y capacidades transversales sin admitir ruido de retail',()=>{
 const {c}=storage();c.initializeConfiguration();for(const [expected,rows] of [[true,positive],[false,negative]])for(const title of rows){const text=c.searchText_(title),result=c.classification_(text,text);assert.equal(result.labels.digital,expected,title);if(expected)assert.deepEqual(Array.from(result.segments),['Empresas e instituciones']);}
});
test('BBVA conserva tres RSS y perfiles generales sin una cláusula empresarial obligatoria',()=>{
 const {c}=storage();c.initializeConfiguration();assert.equal(c.feeds_().filter(row=>row.kind==='rss'&&row.entity==='BBVA').length,3);const feed=c.feeds_().find(row=>row.kind==='profile'&&row.entity==='BBVA');assert.equal(feed.name,'BBVA · España');const q=new URL(feed.url).searchParams.get('q');assert.match(q,/"BBVA"/);assert.doesNotMatch(q,/\) \("empresa"/);assert.ok(q.length<=1500);
});
test('patrones compilados coinciden con el buscador de frases, escapan términos y no conservan estado',()=>{
 const {c}=storage();for(const term of ['api','a+b','net.cash','[test]','corporate banking']){const pattern=c.phrasePattern_([term]);for(const text of [term,'nueva '+term+' para empresas',term+'x','x'+term])for(let i=0;i<3;i++)assert.equal(pattern.test(text),c.phraseMatch_(text,term),text);}
});
