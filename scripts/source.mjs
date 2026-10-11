import fs from 'node:fs';
import path from 'node:path';
import {buildSync} from 'esbuild';
const {instrument,sourceFiles}=process.env.RADAR_COVERAGE?await import('./coverage-source.mjs'):{};

export const root=path.resolve(import.meta.dirname,'..');
export const read=file=>fs.readFileSync(path.join(root,file),'utf8');
export function files(dir){
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]).sort();
}
export function readServerScript(dir='dist',coverage=false){
  const sources=coverage&&process.env.RADAR_COVERAGE?new Map(sourceFiles(path.join(root,'src/server')).map(file=>[path.basename(file),file])):null;
  if(sources)sources.set('RecordFilters.gs',path.join(root,'src/shared/record-filters.js'));
  return files(dir).filter(file=>file.endsWith('.gs')).map(file=>{const source=sources?.get(path.basename(file));return source?instrument(fs.readFileSync(source,'utf8'),source).replace(/\bexport /g,''):read(file);}).join('\n');
}
let coverageClient;
export function readClientScript(coverage=false){
  if(coverage&&process.env.RADAR_COVERAGE){
    if(coverageClient)return coverageClient;
    const directory=path.join(root,'output/coverage/instrumented',String(process.pid));
    fs.mkdirSync(directory,{recursive:true});fs.symlinkSync(path.join(root,'assets'),path.join(directory,'assets'),'dir');
    for(const file of sourceFiles(path.join(root,'src')).filter(file=>file.endsWith('.js'))){const target=path.join(directory,path.relative(root,file));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,instrument(fs.readFileSync(file,'utf8'),file));}
    coverageClient=buildSync({entryPoints:[path.join(directory,'src/client/app.js')],bundle:true,write:false,format:'iife',target:'es2022',legalComments:'none'}).outputFiles[0].text;
    return coverageClient;
  }
  return buildSync({entryPoints:[path.join(root,'src/client/app.js')],bundle:true,write:false,format:'iife',target:'es2022',minifySyntax:true,legalComments:'none'}).outputFiles[0].text;
}
export function renderIncludes(html){
  return html.replace(/<\?!= include_\('([\w]+)'\); \?>/g,(_,name)=>read('dist/'+name+'.html'));
}
