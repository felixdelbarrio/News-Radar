import fs from 'node:fs';
import path from 'node:path';
import {buildSync} from 'esbuild';
import {parse} from 'acorn';
import {identityAssets} from './identity.mjs';
const {instrument,sourceFiles}=process.env.RADAR_COVERAGE?await import('./coverage-source.mjs'):{};

export const root=path.resolve(import.meta.dirname,'..');
export const read=file=>fs.readFileSync(path.join(root,file),'utf8');
export function files(dir){
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]).sort();
}
export function serverModule(source){
  const exports=parse(source,{ecmaVersion:'latest',sourceType:'module'}).body.filter(node=>node.type==='ExportNamedDeclaration'||node.type==='ImportDeclaration');
  for(const node of exports.reverse())source=source.slice(0,node.start)+source.slice(node.declaration?node.declaration.start:node.end);
  return source;
}
export const serverModuleName=file=>path.basename(file,'.js').split('-').map(part=>part[0].toUpperCase()+part.slice(1)).join('')+'.gs';
export function readServerScript(dir='dist',coverage=false){
  const shared=files('src/shared'),sources=coverage&&process.env.RADAR_COVERAGE?new Map(sourceFiles(path.join(root,'src/server')).map(file=>[path.basename(file),file])):null;
  if(sources)for(const file of shared)sources.set(serverModuleName(file),path.join(root,file));
  const scripts=files(dir).filter(file=>file.endsWith('.gs')).map(file=>{const source=sources?.get(path.basename(file));if(!source)return read(file);const code=instrument(fs.readFileSync(source,'utf8'),source);return source.endsWith('.js')?serverModule(code):code;});
  if(dir==='src/server')scripts.push(...shared.map(file=>serverModule(read(file))));
  return scripts.join('\n');
}
let coverageClient;
const identityDefine=()=>({IDENTITY_ASSETS:JSON.stringify(identityAssets())});
export function readClientScript(coverage=false){
  if(coverage&&process.env.RADAR_COVERAGE){
    if(coverageClient)return coverageClient;
    const directory=path.join(root,'output/coverage/instrumented',String(process.pid));
    fs.mkdirSync(directory,{recursive:true});fs.symlinkSync(path.join(root,'assets'),path.join(directory,'assets'),'dir');
    for(const file of sourceFiles(path.join(root,'src')).filter(file=>file.endsWith('.js'))){const target=path.join(directory,path.relative(root,file));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,instrument(fs.readFileSync(file,'utf8'),file));}
    coverageClient=buildSync({entryPoints:[path.join(directory,'src/client/app.js')],bundle:true,write:false,define:identityDefine(),format:'iife',target:'es2022',legalComments:'none'}).outputFiles[0].text;
    return coverageClient;
  }
  return buildSync({entryPoints:[path.join(root,'src/client/app.js')],bundle:true,write:false,define:identityDefine(),format:'iife',target:'es2022',minifySyntax:true,legalComments:'none'}).outputFiles[0].text;
}
export function renderIncludes(html){
  return html.replace('<?!= bootstrap; ?>','null').replace(/<\?!= include_\('([\w]+)'\); \?>/g,(_,name)=>read('dist/'+name+'.html'));
}
