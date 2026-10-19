import {llmBundleWriter} from '../../shared/llm-offline.js';
import {t} from '../core/language.js';
import {$,message} from '../core/dom.js';
import {call} from '../core/api.js';
export function createLlmCategorization({run,isActive,onRevision,refreshSelects}){
 let state,timer,closed=true,transferring=false;
 function render(data){
  state=data;$('llm-project-url').value=data.projectUrl;$('llm-open-project').href=data.projectUrl;
  $('llm-count').textContent=t('{valid} válidas / {pending} pendientes / {total} total · {percent} %',data);$('llm-progress').value=data.percent;
  $('llm-instructions').textContent=data.instructions;
  $('llm-job').textContent=data.job?`${t(data.job.state)}${data.job.state==='Publicando'?' · '+data.job.progress+' %':''}${data.job.error?' · '+data.job.error:''}${data.job.reviewRequired?' · '+t('Revisión editorial necesaria'):''}`:'';
  const pending=data.job?.state==='Publicando';for(const el of [$('llm-settings-form').querySelector('button[type=submit]'),$('llm-import')]){el.disabled=pending;el.dataset.jobActive=String(pending);}
  if(data.classified!==undefined)$('llm-count').textContent+=' · '+t('{classified} clasificadas · {abstained} sin evidencia · {outOfScope} fuera de alcance',data);
  refreshSelects();
  if(onRevision)onRevision(data.newsRevision);
  clearTimeout(timer);if(!closed&&pending&&!transferring)timer=setTimeout(()=>{if(isActive())open().catch(error=>{message(error.message,true);close();});},5000);
 }
 function progress(phase,percent){
  $('llm-transfer').hidden=false;$('llm-transfer-progress').value=percent;
  const label=t('{phase} · {percent} %',{phase,percent:Math.round(percent)});$('llm-transfer-label').textContent=label;$('llm-transfer-progress').setAttribute('aria-valuetext',label);
 }
 async function transfer(task){
  transferring=true;clearTimeout(timer);
  try{await task();}catch(error){progress(t('Proceso interrumpido'),$('llm-transfer-progress').value);throw error;}
  finally{transferring=false;if(state)render(state);}
 }
 async function open(){closed=false;render(await call('getLlmCategorization'));}
 function close(){closed=true;clearTimeout(timer);}
 $('llm-project-url').addEventListener('input',()=>{const value=$('llm-project-url').value; if(/^https:\/\/chatgpt\.com\/g\/g-p-[a-zA-Z0-9-]+\/?$/.test(value))$('llm-open-project').href=value;else $('llm-open-project').removeAttribute('href');});
 $('llm-settings-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{render(await call('saveLlmCategorization',{projectUrl:$('llm-project-url').value.trim(),revision:state.revision}));message('Configuración guardada.');},false);});
 $('llm-download').addEventListener('click',()=>run(()=>transfer(async()=>{
  progress(t('Preparando descarga'),0);
  let cursor=2,revision,count=0,done=false;const selection=$('llm-export-selection').value,encoder=new TextEncoder(),zip=llmBundleWriter(text=>encoder.encode(text));
  while(!done){
   const result=await call('exportLlmPending',{cursor,selection,...(revision?{revision}:{})});
   if(revision&&revision!==result.revision||result.cursor<=cursor&&!result.done)throw Error('La descarga no ha avanzado.');
   zip.add(result);
   cursor=result.cursor;revision=result.revision;done=result.done;count+=result.count;progress(t('Preparando descarga'),Math.min(99,result.progress));
  }
  const url=URL.createObjectURL(new Blob(zip.finish(),{type:'application/zip'})),a=document.createElement('a');a.href=url;a.download='news-radar-llm.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  progress(t('Descarga preparada'),100);
  message(t('{count} noticias exportadas. La descarga no modifica su estado.',{count}));
 }),false));
 $('llm-import').addEventListener('change',()=>run(()=>transfer(async()=>{
  const files=Array.from($('llm-import').files);$('llm-import').value='';
  // Each file is one atomic publication; wait for its generation before the next file.
  for(const [index,file] of files.entries()){
   const advance=(phase,fraction)=>progress(phase,(index+fraction)/files.length*100),phase=t('Importando archivo {current} de {total}',{current:index+1,total:files.length});advance(phase,0);
   if(!/\.(json|zip)$/i.test(file.name)||file.size>state.limits.importBytes)throw Error('Selecciona JSON o ZIP de hasta 2 MiB.');
   const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   advance(phase,.1);
   const result=await call('importLlmResults',{name:file.name,base64:btoa(binary)});render(result);message(t('{imported} resultados preparados · {duplicates} duplicados.',result));
   while(state.job?.state==='Publicando'){
    advance(t('Publicando Novedades, Noticias y Radar'),.25+.75*state.job.progress/100);
    if(state.job.error)throw Error(t('Publicación pendiente: {error}',{error:state.job.error}));
    await new Promise(resolve=>setTimeout(resolve,5000));render(await call('getLlmCategorization'));
   }
   advance(t('Importación completada'),1);
  }
 }),false));
 return {open,close};
}
