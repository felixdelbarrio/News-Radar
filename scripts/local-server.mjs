import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const controlSocket=path.resolve(import.meta.dirname,'../output/preview-server.sock');
export function registerServer(server,file=controlSocket){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const close=()=>{server.close();server.closeIdleConnections();};
 const control=net.createServer(connection=>{
  connection.setTimeout(1000,()=>connection.destroy());
  connection.once('data',command=>{if(command.toString()!=='stop'){connection.destroy();return;}connection.end('closed');close();});
 });
 const clean=()=>{control.close();process.removeListener('SIGINT',close);process.removeListener('SIGTERM',close);};
 return new Promise((resolve,reject)=>{
  control.once('error',reject);
  control.listen(file,()=>{fs.chmodSync(file,0o600);server.once('close',clean);process.once('SIGINT',close);process.once('SIGTERM',close);resolve();});
 });
}
export async function killServer(file=controlSocket){
 if(!fs.existsSync(file))return false;
 return new Promise((resolve,reject)=>{
  // Local IPC: no PID, credentials or destination are read from a file.
  const connection=net.createConnection({path:file});let response='';
  connection.setTimeout(5000,()=>connection.destroy(Error('El servidor local no responde.')));
  connection.once('connect',()=>connection.end('stop'));
  connection.on('data',data=>response+=data);
  connection.once('end',()=>response==='closed'?resolve(true):reject(Error('Respuesta de cierre no válida.')));
  connection.once('error',error=>{if(error.code==='ECONNREFUSED'||error.code==='ENOENT'){fs.rmSync(file,{force:true});resolve(false);}else reject(error);});
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(await killServer()?'Servidor local cerrado.':'No hay servidor local activo.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
