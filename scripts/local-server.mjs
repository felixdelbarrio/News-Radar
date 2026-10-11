import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const stateFile=path.resolve(import.meta.dirname,'../output/preview-server.json');
export function registerServer(server,token,file=stateFile){
 const state={pid:process.pid,port:server.address().port,token};
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(state),{flag:'wx',mode:0o600});
 const clean=()=>{if(fs.existsSync(file)&&JSON.parse(fs.readFileSync(file,'utf8')).token===token)fs.unlinkSync(file);};
 server.once('close',clean);process.once('exit',clean);
 const close=()=>{server.close();server.closeIdleConnections();};
 process.once('SIGINT',close);process.once('SIGTERM',close);
}
export async function killServer(file=stateFile){
 if(!fs.existsSync(file))return false;
 const state=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!Number.isInteger(state.pid)||state.pid<1||!Number.isInteger(state.port)||state.port<1||state.port>65535||typeof state.token!=='string')throw Error('Registro del servidor local no válido.');
 try{process.kill(state.pid,0);}catch(error){if(error.code!=='ESRCH')throw error;fs.unlinkSync(file);return false;}
 const response=await fetch('http://127.0.0.1:'+state.port+'/__preview/stop',{method:'POST',headers:{Authorization:'Bearer '+state.token},signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('El servidor no acepta el cierre; no se ha detenido ningún otro proceso.');
 await response.text();return true;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(await killServer()?'Servidor local cerrado.':'No hay servidor local activo.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
