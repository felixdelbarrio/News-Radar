// Load jsdom's mixed ESM/CJS dependencies before installing the instrumentation hook.
import 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {registerHooks} from 'node:module';
import {fileURLToPath} from 'node:url';
import {instrument} from './coverage-source.mjs';
const root=path.resolve(import.meta.dirname,'..'),coverage=globalThis.__coverage__={};
const createContext=vm.createContext;
vm.createContext=(sandbox={},options)=>{const context=createContext(sandbox,options);context.__coverage__=coverage;return context;};
registerHooks({load(url,context,next){
 const result=next(url,context);
 if(url.startsWith('file:')){const file=fileURLToPath(url);if(file.startsWith(root+'/src/')&&file.endsWith('.js'))return {...result,source:instrument(String(result.source),file)};}
 return result;
}});
process.on('exit',()=>fs.writeFileSync(path.join(process.env.RADAR_COVERAGE_RAW,process.pid+'.json'),JSON.stringify(coverage)));
