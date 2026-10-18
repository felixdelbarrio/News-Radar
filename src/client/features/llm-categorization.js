import {t} from '../core/language.js';
import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
export function createLlmCategorization({run,isActive,onRevision}){
 let state,timer,closed=true;
 function render(data){
  state=data;$('llm-project-url').value=data.projectUrl;$('llm-open-project').href=data.projectUrl;$('llm-mode').value=data.mode;
  $('llm-count').textContent=t('{valid} válidas / {pending} pendientes / {total} total · {percent} %',data);$('llm-progress').value=data.percent;
  $('llm-instructions').textContent=data.instructions;
  $('llm-job').textContent=data.job?`${t(data.job.state)}${data.job.error?' · '+data.job.error:''}`:'';
  const pending=data.job?.state==='Publicando';for(const el of [$('llm-settings-form').querySelector('button'),$('llm-import')]){el.disabled=pending;el.dataset.jobActive=String(pending);}
  if(onRevision)onRevision(data.newsRevision);
  clearTimeout(timer);if(!closed&&pending)timer=setTimeout(()=>{if(isActive())open().catch(error=>{message(error.message,true);close();});},5000);
 }
 async function open(){closed=false;render(await call('getLlmCategorization'));}
 function close(){closed=true;clearTimeout(timer);}
 $('llm-project-url').addEventListener('input',()=>{const value=$('llm-project-url').value; if(/^https:\/\/chatgpt\.com\/g\/g-p-[a-zA-Z0-9-]+\/?$/.test(value))$('llm-open-project').href=value;else $('llm-open-project').removeAttribute('href');});
 $('llm-settings-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{render(await call('saveLlmCategorization',{projectUrl:$('llm-project-url').value.trim(),mode:$('llm-mode').value,revision:state.revision}));message('Configuración guardada.');},false);});
 $('llm-copy-instructions').addEventListener('click',()=>run(async()=>{await navigator.clipboard.writeText(state.instructions);message('Instrucciones copiadas.');},false));
 function download(base64,name){const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('llm-download').addEventListener('click',()=>run(async()=>{
  let cursor=2,revision,count=0,done=false;
  while(!done){const result=await call('exportLlmPending',{cursor,...(revision?{revision}:{})});if(result.base64)download(result.base64,result.name);if(result.cursor<=cursor&&!result.done)throw Error('La descarga no ha avanzado.');cursor=result.cursor;revision=result.revision;done=result.done;count+=result.count;}
  message(t('{count} pendientes exportadas. La descarga no modifica su estado.',{count}));
 },false));
 $('llm-import').addEventListener('change',()=>run(async()=>{
  const files=Array.from($('llm-import').files);$('llm-import').value='';
  // Each file is one atomic publication; wait for its generation before the next file.
  for(const file of files){
   if(!/\.(json|zip)$/i.test(file.name)||file.size>state.limits.importBytes)throw Error('Selecciona JSON o ZIP de hasta 2 MiB.');
   const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const result=await call('importLlmResults',{name:file.name,base64:btoa(binary)});render(result);message(t('{imported} resultados preparados · {duplicates} duplicados.',result));
   while(state.job?.state==='Publicando'){
    if(state.job.error)throw Error(t('Publicación pendiente: {error}',{error:state.job.error}));
    await new Promise(resolve=>setTimeout(resolve,5000));render(await call('getLlmCategorization'));
   }
  }
 },false));
 return {open,close};
}
