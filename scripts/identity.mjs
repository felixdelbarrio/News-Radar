import fs from 'node:fs';
import path from 'node:path';
const directory=path.resolve(import.meta.dirname,'../assets/identity');
export function identityAssets(){
 const tokens=JSON.parse(fs.readFileSync(path.resolve(directory,'../../src/design/tokens.json'),'utf8')).css;
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
 return Object.fromEntries(Object.entries(manifest).map(([kind,entries])=>[kind,Object.fromEntries(Object.entries(entries).map(([name,asset])=>{
  if(!/^(entity-\d+|country-[a-z]{2})\.png$/.test(asset.file)||asset.file!==asset.id+'.png')throw Error('Identidad visual no válida: '+name);
  const bytes=fs.readFileSync(path.join(directory,asset.file));if(bytes.length>16000||bytes.readUInt32BE(0)!==0x89504e47)throw Error('Imagen de identidad no válida: '+name);
  const scale=Math.min(parseInt(tokens[kind==='entities'?'identity-logo-width':'identity-flag-width'])/asset.width,parseInt(tokens[kind==='entities'?'identity-logo-height':'identity-flag-height'])/asset.height);
  return [name,{id:asset.id,width:Math.round(asset.width*scale),height:Math.round(asset.height*scale),data:bytes.toString('base64')}];
 }))]));
}
