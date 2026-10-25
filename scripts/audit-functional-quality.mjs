import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {storage} from '../tests/helpers/server.mjs';
import {benchmarkSource} from './benchmark-source.mjs';
import {readServerScript} from './source.mjs';
import {functionalCatalogRules} from '../src/shared/functional-catalogue.js';

const parse=value=>{try{return JSON.parse(value||'{}');}catch{return {};}};
export function snapshotObjects(tables,name){
 if(!tables[name]){const matches=Object.keys(tables).filter(key=>key.length===31&&name.startsWith(key));if(matches.length!==1)throw Error('Tabla ausente o ambigua: '+name);name=matches[0];}
 const [keys,...rows]=tables[name];return rows.filter(row=>row[0]).map(row=>Object.fromEntries(keys.map((key,i)=>[key,row[i]||''])));
}
export function snapshotConfiguration(snapshot){
 const tables=snapshot.tables,config=Object.fromEntries(snapshotObjects(tables,'Configuracion').map(row=>[row.clave,JSON.parse(row.valor)])),catalogue=new Map();
 for(const row of snapshotObjects(tables,'CatalogoFuncional')){if(!catalogue.has(row.bloque))catalogue.set(row.bloque,{name:row.bloque,functions:[]});catalogue.get(row.bloque).functions.push({id:row.id,name:row.nombre,description:row.descripcion});}
 return {...config,taxonomy:functionalCatalogRules([...catalogue.values()],config.taxonomy)};
}
function evaluator(source,config){
 const {c}=storage(source);c.configuration_=()=>config;
 const state={documents:0,candidates:{}};c.taxonomySeed(state,c.taxonomyDefinitions(config.taxonomy));
 const items=c.taxonomyBuild(state).map(row=>({...row,id:c.sha256_(row.key).slice(0,24),terminos:row.terms,segmentos:row.segments,descripcion:row.description||''})),byId=new Map(items.map(row=>[row.id,row]));
 return {c,items,run(row){
  const title=row.titular||row.title||'',excerpt=row.extracto||row.excerpt||'',labels=c.classification_(c.searchText_(c.plainText_(title)),c.searchText_(c.plainText_(title+' '+excerpt)),true,row.medio||row.publisher||'').labels,assignment=c.taxonomyRecord_(title,excerpt,items,labels);
  return {state:labels.estado,digital:labels.digital,primary:byId.get(assignment.primary)?.subpalanca||'',assignments:assignment.ids.map(id=>byId.get(id)?.subpalanca||id),reason:assignment.reason,evidence:assignment.evidence||null};
 }};
}
export function auditFunctionalQuality(snapshot,{baselineSource,source=readServerScript(),manifest=null}={}){
 if(!baselineSource)throw Error('Se requiere una versión base congelada.');
 const config=snapshotConfiguration(snapshot),candidateContext=storage(source).c,next=candidateContext.functionalRuleUpgrade_(config),baseline=evaluator(baselineSource,config),candidate=evaluator(source,next),official=rows=>rows.flatMap(block=>block.functions.map(row=>[row.id,block.name,row.name,row.description]));
 if(JSON.stringify(official(config.taxonomy))!==JSON.stringify(official(next.taxonomy)))throw Error('La actualización altera el catálogo oficial.');
 const newsName=manifest?.newsSheet||'Noticias',news=snapshotObjects(snapshot.tables,newsName),candidates=snapshotObjects(snapshot.tables,'Candidatos'),rows=[];
 for(const [corpus,records] of [['news',news],['candidates',candidates]])for(const row of records){
  const before=baseline.run(row),after=candidate.run(row),text=candidate.c.searchText_(row.titular+' '+row.extracto);
  rows.push({id:row.id,title:row.titular,url:row.url,date:row.fecha,corpus,stored_state:parse(row.clasificacion).estado||'',before,after,changed:before.state!==after.state||JSON.stringify(before.assignments)!==JSON.stringify(after.assignments),topics:{card:/\b(?:tarjetas?|cards?)\b/.test(text),api:/\b(?:apis?|mcp|open banking|open finance|erp)\b/.test(text),agent:/\b(?:agentic|ai[ -]agents?|agentes? de ia|assistants?|asistentes?)\b/.test(text)}});
 }
 const ids=new Set(official(config.taxonomy).map(row=>row[0])),missingAliases=next.taxonomy.flatMap(block=>block.functions.filter(row=>!row.terms.length).map(row=>({id:row.id,block:block.name,name:row.name})));
 return {schema:1,created_at:new Date().toISOString(),snapshot:{source:snapshot.source||'',sha256:snapshot.sha256||'',mtime_utc:snapshot.mtime_utc||'',news_sheet:newsName},summary:{blocks:config.taxonomy.length,functions:ids.size,news:news.length,candidates:candidates.length,reviewed:rows.length,changed:rows.filter(row=>row.changed).length,newly_relevant:rows.filter(row=>!row.before.digital&&row.after.digital).length,no_longer_relevant:rows.filter(row=>row.before.digital&&!row.after.digital).length,canonical_catalogue_preserved:true,missing_aliases_before:config.taxonomy.flatMap(block=>block.functions).filter(row=>!row.terms.length).length,missing_aliases_after:missingAliases.length},missing_aliases:missingAliases,rows,limits:['Todos los registros del snapshot se evalúan; no es una validación independiente de cada fuente.','La actualización conserva la taxonomía canónica y los datos de entrada; los resultados se entregan como candidato.','El snapshot histórico no sustituye la comprobación de la generación viva y su backup antes de actualizar producción.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [input,output='output/functional-quality',manifestFile]=process.argv.slice(2).filter(arg=>!arg.startsWith('--baseline'));
 if(!input)throw Error('Uso: node scripts/audit-functional-quality.mjs snapshot.json [output] [manifest.json] --baseline=<SHA>');
 const baseline=benchmarkSource(process.argv.slice(2));if(!baseline.source)throw Error('Especifica --baseline=<SHA>.');
 const report=auditFunctionalQuality(JSON.parse(fs.readFileSync(input,'utf8')),{baselineSource:baseline.source,manifest:manifestFile?JSON.parse(fs.readFileSync(manifestFile,'utf8')):null});
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify({...report,baseline:baseline.revision},null,2)+'\n');
 const fields=['id','title','url','date','corpus','stored_state','before_state','before_function','after_state','after_function','changed'],cell=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 fs.writeFileSync(path.join(output,'changes.csv'),[fields,...report.rows.map(row=>[row.id,row.title,row.url,row.date,row.corpus,row.stored_state,row.before.state,row.before.assignments.join(' · '),row.after.state,row.after.assignments.join(' · '),row.changed])].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n');
 console.log(JSON.stringify(report.summary,null,2));
}
