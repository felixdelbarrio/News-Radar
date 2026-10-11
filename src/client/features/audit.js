import {$,escape,date,validUrl,message} from '../core/dom.js';
import {call} from '../core/api.js';
import {createRecordFilters} from './record-filters.js';
let filters,request=0;
export async function loadAudit(){
  filters||=createRecordFilters('audit',[['fuente','Fuente'],['resultado','Resultado'],['ejecucion','Ejecución']],loadAudit,{dates:true,placeholder:'Motivo, fuente o URL'});
  const current=++request;
  try{
    const data=await call('getAudit',filters.query());if(current!==request)return;
    filters.options(data.options);filters.page(data);
    $('audit-note').textContent=data.total+' coincidencias en las últimas '+data.limit+' entradas disponibles.'+(data.limited?' Histórico limitado; consulta Sheets para registros anteriores.':'');
    $('audit-body').innerHTML=data.items.map(row=>`<tr><td>${escape(date(row.fecha))}</td><td>${escape(row.fuente)}</td><td>${escape(row.resultado)}</td><td>${escape(row.motivo)} ${validUrl(row.url)?`<a href="${escape(row.url)}" target="_blank" rel="noopener noreferrer">Fuente ↗</a>`:''}</td></tr>`).join('')||'<tr><td colspan="4">Sin entradas con estos filtros.</td></tr>';
  }catch(error){if(current===request)message(error.message,true);}
}
