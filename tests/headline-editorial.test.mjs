import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
import {app} from './helpers/app.mjs';
import audit from './fixtures/headline-audit.json' with {type:'json'};
import decisions from './fixtures/headline-editorial-decisions.json' with {type:'json'};

test('audited headlines require a customer service rather than funding or consumer evidence',()=>{
 const {c}=storage();c.initializeConfiguration();
 const classify=(title,excerpt='')=>c.classification_(c.searchText_(title),c.searchText_(title+' '+excerpt)).labels.digital;
 for(const decision of decisions){const row=audit.find(row=>row.id===decision.id);assert.ok(row,decision.id);assert.equal(classify(row.title,row.excerpt),!decision.decision.startsWith('FP confirmado'),row.title);}
 for(const [fragment,expected] of [['ALVA lands',false],['foreign patients',false],['HSBC launches AI tool for corporate banking clients',true],['DBS rolls out agentic AI',true]]){
  const row=audit.find(row=>row.title?.includes(fragment));assert.ok(row,fragment);assert.equal(classify(row.title,row.excerpt),expected,row.title);
 }
 for(const title of ['Revolut users report app outage','BBVA app no funciona para particulares','Malaysia Aviation Group secures US$75mil trade finance facility from Citi',"JPMorgan analyst says Alibaba AI business is growing",'Maybank ringgit account corporate'])assert.equal(classify(title),false,title);
 for(const title of ['BBVA lanza una API de pagos para pymes','BBVA business banking app outage affects corporate clients','Standard Chartered launches digital trade finance platform for corporate clients','HSBC launches AI tool for corporate banking clients','DBS rolls out agentic AI to 350,000 corporate clients'])assert.equal(classify(title),true,title);
 // The complete meaning remains necessary; bare AI is not client evidence.
 for(const title of ['HSBC uses AI internally to improve corporate banking productivity','HSBC invests in AI business','Banco Nación rechaza propuesta de pago de una empresa concursada'])assert.equal(classify(title),false,title);
 for(const row of audit.filter(row=>/Maybank/.test(row.title)))assert.equal(classify(row.title,row.excerpt),false,row.id+' remains undetermined');
 for(const row of audit.filter(row=>/Stripe Pay|NPCI partners|UBS and Ant International|Kookmin Bank Signs/.test(row.title)))assert.equal(classify(row.title,row.excerpt),true,row.title);
 for(const row of audit.filter(row=>/Malaysia Aviation|Foreign Medical Tourists/.test(row.title)))assert.equal(classify(row.title,row.excerpt),false,row.title);
 for(const title of ['Sabadell relanza su bróker online para particulares y empresas','Sabadell lanza pagos digitales para pymes y particulares'])assert.equal(classify(title),true,title);
});

test('Noticias keeps flags in the heading and publisher marks beside the shared Medio label',async t=>{
 const rows=['The Asset','Forbes','Unknown <publisher>'].map((medio,i)=>({id:String(i),entidad:'BBVA',pais:'España',medio,fecha:'2026-10-20',titular:'BBVA lanza pagos digitales para empresas '+i,url:'https://example.com/'+i,segmentos:[],senales:[],etiquetas:{digital:true},taxonomia:[]}));
 const a=await app(t,{configure({data}){data.items=rows;data.total=4;data.contextTotal=4;data.pageSize=3;}});await a.click('[data-view="news"]');
 const doc=a.w.document;assert.equal(doc.querySelectorAll('#news-list .news-entity-heading .publisher-logo').length,0);assert.ok(doc.querySelector('#news-list .news-entity-heading .geography-flag'));
 const cells=[...doc.querySelectorAll('#news-list tbody tr td:last-child')];assert.equal(cells.length,3);
 for(const cell of cells.slice(0,2)){const label=cell.querySelector('.identity-label');assert.match(label.textContent,/Medio:/);assert.ok(label.querySelector('.publisher-logo'));}
 assert.match(cells[2].textContent,/Unknown <publisher>/);assert.equal(cells[2].querySelector('publisher'),null);
 a.data.items=[{...rows[0],id:'appended',titular:'Otro pago digital empresarial',medio:'Forbes'}];a.data.page=1;await a.click('#next');
 assert.equal(doc.querySelectorAll('#news-list tbody tr').length,4);assert.equal(doc.querySelectorAll('#news-list .news-entity-heading .publisher-logo').length,0);assert.ok(doc.querySelector('#news-list tbody tr:last-child .identity-label .publisher-logo'));
});
