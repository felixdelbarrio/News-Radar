import {$,escape,date,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {t} from '../core/language.js';
import {progressDetailsHtml} from './process-progress.js';
let request=0,timer,panelActive=false,syncRecovery=()=>{};
const processActions={classification:['classification-start','Clasificar pendientes'],translation:['translation-start','Traducir pendientes'],taxonomy:['taxonomy-start','Actualizar catálogo'],snapshot:['snapshot-start','Generar snapshots'],maintenance:['maintenance-start','Iniciar mantenimiento']};
function processCard(job){
 const action=processActions[job.stage],active=!['Completada','Parcial','En pausa','Detenido por falta de cuota','Sin ejecuciones','Revisar'].includes(job.progress.state),status=job.valid===false?'error':job.status,progress=job.progress;
 return `<article class="process-card" data-process="${escape(job.id||job.stage)}"><div class="schedule-heading"><h4>${escape(t(job.label))}</h4><span class="process-state" data-status="${escape(status)}">${escape(t(job.enabled?'Activo':'Inactivo'))}${progress.state==='Activo'?'':' · '+escape(t(progress.state))}</span></div>${job.timezone?`<p class="small muted">${escape(job.timezone)}</p>`:''}${job.modified?`<p>${t('Última modificación')}: ${escape(date(job.modified))}</p>`:''}${job.total!==undefined?`<div id="${job.id|| (job.stage==='newsletter'?'newsletter-delivery':job.stage==='taxonomyTranslation'?'taxonomy-translation':job.stage)}-progress"><progress max="${Math.max(1,job.total)}" value="${job.done}" aria-label="${escape(t(job.label))}"></progress><p class="small muted">${job.done}/${job.total}</p></div>`:''}${progressDetailsHtml(progress)}${job.comment?`<p class="small muted">${escape(t(job.comment))}</p>`:''}${job.active?`<p>${t('En curso')}: ${escape(t(job.active))}</p>`:''}${job.dispatched?`<p class="small muted">${t('Último proceso autorizado')}: ${escape(t(job.dispatched.label))} · ${escape(date(job.dispatched.at))}</p>`:''}${job.waiting?.length?`<details><summary>${t('Trabajos en espera')} (${job.waiting.length})</summary><ul>${job.waiting.map(row=>`<li>${escape(t(row.label))}: ${escape(t(row.reason))}${row.restartAt?' · '+escape(date(row.restartAt)):''}</li>`).join('')}</ul></details>`:''}${job.stage==='daily'?`<button type="button" class="button" data-collection-slot="${escape(job.id)}" data-job-active="${active}" ${active?'disabled':''}>${t('Recopilar ahora')}</button>`:''}${action?`<button type="button" class="button" id="${action[0]}" data-process-action="${job.stage}" data-job-active="${active}" ${active?'disabled':''}>${t(action[1])}</button>`:''}</article>`;
}
export function closeRuns(){request++;clearTimeout(timer);}
export async function loadRuns(){
 closeRuns();const current=request;
 try{
  const data=await call('getControlPanel');if(current!==request)return;
  panelActive=Boolean(data.groups?.some(group=>group.jobs.some(job=>job.status==='pending')));if(data.groups)$('control-panel-groups').innerHTML=data.groups.map(group=>`<section class="process-group" data-process-group="${group.id}"><div class="panel-header"><h3>${escape(t(group.label))}</h3><span class="small muted">${t('Prioridad')} ${group.priority}</span></div><div class="process-grid">${group.jobs.map(processCard).join('')}</div></section>`).join('');
  renderCollectionJobs(data.collection);
  return data;
 }catch(error){if(current===request)message(error.message,true);}
 finally{if(current===request&&!$('runs-section').hidden&&!$('administration-section').hidden)timer=setTimeout(pollRuns,panelActive?30000:120000);}
}
export function renderCollectionJobs(status){syncRecovery(status);}
export function createRecoveryControls({run}){
 let busy=false,status={};
 function render(next=status){status=next||{};for(const button of document.querySelectorAll('[data-collection-slot]')){button.disabled=busy||Boolean(status.blocked?.today)||button.dataset.jobActive==='true';button.title=status.blocked?.today?t('Ya hay una recuperación diaria en curso.'):'';}}
 $('runs-section').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.collectionSlot){run(async()=>{message(await call('collectSlot',button.dataset.collectionSlot));await loadRuns();},false);return;}
  const method={classification:'startClassification',translation:'startTranslations',taxonomy:'startTaxonomy',snapshot:'rebuildDashboardSnapshots',maintenance:'startMaintenance'}[button.dataset.processAction];if(!method)return;
  run(async()=>{const result=await call(method);if(typeof result==='string')message(result);await loadRuns();},false);
 });
 syncRecovery=render;return {setBusy(value){busy=value;render();}};
}

function pollRuns(){if(document.hidden){timer=setTimeout(pollRuns,30000);return;}loadRuns();}
$('control-panel-refresh').addEventListener('click',loadRuns);

document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden&&!$('runs-section').hidden&&!$('administration-section').hidden)loadRuns();});
