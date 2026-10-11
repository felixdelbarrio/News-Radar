import test from 'node:test';
import assert from 'node:assert/strict';
import {checkAppsScriptSyntax} from '../scripts/apps-script-syntax.mjs';
import {files,read} from '../scripts/source.mjs';
test('el servidor rechaza asignaciones lógicas con archivo y línea antes de generar dist',()=>{
 for(const operator of ['||=','&&=','??='])assert.throws(()=>checkAppsScriptSyntax('let cache;\ncache '+operator+' new WeakMap();','History.gs'),/History\.gs:2:\d+ · Sintaxis del servidor no válida/);
 assert.doesNotThrow(()=>checkAppsScriptSyntax('let cache; if(!cache)cache=new WeakMap(); const value=cache?.get({})??null;','History.gs'));
});
test('todos los módulos publicados cumplen la sintaxis del servidor',()=>{
 for(const file of files('dist').filter(file=>file.endsWith('.gs')))assert.doesNotThrow(()=>checkAppsScriptSyntax(read(file),file));
});
