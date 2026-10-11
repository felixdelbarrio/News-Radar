import {parse} from 'acorn';
export function checkAppsScriptSyntax(source,filename){
 try{parse(source,{ecmaVersion:2020,sourceType:'script'});}
 catch(error){throw Error(filename+':'+error.loc.line+':'+(error.loc.column+1)+' · Sintaxis del servidor no válida: '+error.message,{cause:error});}
}
