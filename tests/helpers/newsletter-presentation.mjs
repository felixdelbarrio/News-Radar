import vm from 'node:vm';
import {storage} from './server.mjs';
export function presentationServer(){
 const s=storage();s.c.initializeConfiguration();
 for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',s.c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 s.c.settings_().newsletterAppUrl='https://script.google.com/macros/s/test/exec';
 return s;
}
export const presentationRows=Array.from({length:18},(_,i)=>({id:'presentation-'+i,fecha:'2026-10-'+String(17+i%10).padStart(2,'0'),pais:['España','México','Reino Unido'][i%3],entidad:['BBVA','CaixaBank','HSBC','Stripe','Nubank'][i%5],medio:'Editor de referencia',titular:['Nueva aplicación móvil para gestionar la tesorería de empresas','Transferencias digitales y cobros para clientes corporativos','Integración de pagos y permisos en el canal empresarial'][i%3]+' '+i,extracto:'La nueva funcionalidad permite a las empresas gestionar sus operaciones desde el canal digital con controles de autorización y acceso a información de sus cuentas.',url:'https://example.com/presentation/'+i,tipo:'Banco tradicional',segmentos:['Empresas e instituciones'],etiquetas:{digital:true},senales:['Lanzamiento de producto'],taxonomia:[{palanca:['Home','Pagos - Transf. y traspasos','Enablers'][i%3],subpalanca:'API'}]}));
export const presentationCases=['briefing','news'].flatMap(view=>['España',''].map(country=>({name:(view==='briefing'?'fortnightly':'quarterly')+'-'+(country?'focused':'global'),query:{view,country,coverage:'digital',segment:'Empresas e instituciones',from:view==='briefing'?'2026-10-16':'2026-10-01',to:view==='briefing'?'2026-10-31':'2026-12-31'}})));
export function presentationContent(c,query,rows=presentationRows,language='es',known=new Set()){
 return c.newsletterContent_(structuredClone(rows),query,'Selección',new Date('2026-10-28T10:00:00Z'),'subscription',language,'presentation-edition',known);
}
export function presentationContract(content){
 return JSON.parse(JSON.stringify(Object.fromEntries(['subject','text','editionId','count','total','items','evidence','editorial','translationReady'].map(key=>[key,content[key]]))));
}
