import test from 'node:test';
import assert from 'node:assert/strict';
import {newsletterInlineStyles} from '../scripts/newsletter-inline.mjs';

test('conserva los estilos base y excluye reglas condicionales anidadas del correo inline',()=>{
 const css='@charset "UTF-8";/* base */h1,h2{color:blue}h1{margin:0}@media(max-width:480px){h1{color:red}@supports(display:grid){h2{display:grid}}}p{padding:16px}';
 assert.deepEqual(newsletterInlineStyles(css),{h1:'color:blue;margin:0;',h2:'color:blue;',p:'padding:16px;'});
});
test('las llaves en comentarios y cadenas no alteran los límites de las reglas',()=>{
 const css='p{content:"}\\\"{";/* } */color:blue}@media screen{p{content:"}"}}a{color:green}';
 assert.deepEqual(newsletterInlineStyles(css),{p:'content:"}\\\"{";/* } */color:blue;',a:'color:green;'});
});
test('procesa la entrada adversaria señalada por CodeQL sin retroceso de expresiones regulares',()=>{
 const css='@mediaz{{{{}}'+' {{}}'.repeat(100000)+'}}p{color:blue}';
 assert.deepEqual(newsletterInlineStyles(css),{p:'color:blue;'});
 assert.deepEqual(newsletterInlineStyles('@media screen{p{color:red}'),{});
});
