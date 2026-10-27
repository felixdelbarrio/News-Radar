import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';
const row=i=>({id:'story-'+i,pais:i%2?'España':'México',entidad:i%2?'BBVA':'Qonto',fecha:'2026-10-22',medio:'Editor',titular:'Nueva oferta digital empresarial número '+i,extracto:'Gestión de tesorería para empresas.',url:'https://example.com/'+i,senales:['Lanzamiento de producto'],segmentos:['Empresas e instituciones'],etiquetas:{digital:true},taxonomia:[{id:'api',palanca:'Enablers',subpalanca:'API Channel'}]});
function setup(){const s=storage();s.c.initializeConfiguration();for(const name of ['NewsletterContenido','NewsletterEdiciones']){const sheet=s.c.newsletterSheet_(name),range=sheet.getRange.bind(sheet);sheet.getRange=(...args)=>{const r=range(...args),write=r.setValues.bind(r);r.setValues=values=>{for(const cells of values)for(const value of cells)assert.ok(String(value??'').length<=50000,'Sheets rechaza la celda');return write(values);};return r;};}return s;}
test('trimestral de mil noticias guarda y recupera metadatos compactos y el corpus íntegro',()=>{
 const {c}=setup(),items=Array.from({length:1000},(_,i)=>row(i)),content=c.newsletterContent_(items,{view:'news',from:'2026-10-01',to:'2026-12-31'},'',new Date(),'s','es','edition');
 content.editorial.geographies[0].terms=['alias '.repeat(10000)];const before=JSON.stringify(content.editorial);assert.ok(before.length>50000);
 c.saveNewsletterEdition_('edition','delivery','owner@bbva.com','Trimestre',content.editorial.context,'es',content.evidence,content.editorial);c.completeNewsletterEdition_('edition','Enviada');
 const saved=c.newsletterEdition_('edition','owner@bbva.com');assert.equal(saved.items.length,1000);assert.equal(saved.editorial.audit.eligible,1000);assert.equal(saved.editorial.cards.length,3);assert.equal(saved.editorial.audit.exclusions.reduce((n,row)=>n+row.count,0),997);assert.equal(saved.editorial.geographies[0].name,content.editorial.geographies[0].name);assert.equal(saved.editorial.geographies[0].region,content.editorial.geographies[0].region);assert.equal(saved.editorial.geographies[0].terms,undefined);assert.equal(JSON.stringify(content.editorial),before);
 const values=c.newsletterSheet_('NewsletterEdiciones').getRange(2,1,1,12).getValues()[0];assert.ok(values[11].length<20000);assert.equal(c.getNewsletterSummary('edition').topics.length,3);
});
test('preflight valida metadatos y artículos antes de escribir cualquier fila',()=>{
 const {c}=setup();for(const [title,item] of [['x'.repeat(50001),row(1)],['Normal',{...row(2),titular:'x'.repeat(50001)}]]){assert.throws(()=>c.saveNewsletterEdition_('rejected','delivery','owner@bbva.com',title,{},'es',[item]),/No se ha guardado ni enviado/);assert.equal(c.newsletterSheet_('NewsletterContenido').getLastRow(),1);assert.equal(c.newsletterSheet_('NewsletterEdiciones').getLastRow(),1);}
});
