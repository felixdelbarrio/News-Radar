import {escape,date} from '../core/dom.js';
import {t} from '../core/language.js';
export function progressDetailsHtml(status){
  return `<div class="small muted"><p>${escape(t('Última ejecución'))}: ${escape(t(date(status.lastExecutedAt)))}</p>${status.pauseReason?`<p>${escape(t('Motivo de la pausa'))}: ${escape(t(status.pauseReason))}</p>`:''}${status.restartAt?`<p>${escape(t('Previsión de reinicio'))}: ${escape(date(status.restartAt))}</p>`:''}${status.waitingFor?`<p>${escape(t('Esperando a'))}: ${escape(t(status.waitingFor))}</p>`:''}</div>`;
}
