import fs from 'node:fs';
import path from 'node:path';
import {createInstrumenter} from 'istanbul-lib-instrument';
const instrumenter=createInstrumenter({esModules:true,compact:true});
const cache=new Map();
export function instrument(source,filename){const previous=cache.get(filename);if(previous?.source===source)return previous.code;const code=instrumenter.instrumentSync(source,filename);cache.set(filename,{source,code});return code;}
export function sourceCoverage(source,filename){instrumenter.instrumentSync(source,filename);return instrumenter.lastFileCoverage();}
export function sourceFiles(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sourceFiles(path.join(root,entry.name)):/\.(js|gs)$/.test(entry.name)?[path.join(root,entry.name)]:[]);}
