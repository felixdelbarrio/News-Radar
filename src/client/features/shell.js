import {formatCalendarDay} from '../../shared/locales.js';
import {language,t} from '../core/language.js';
import { $, date, validUrl } from "../core/dom.js";
function renderShell(data) {
  $("last-run").textContent = date(data.lastRun);
  const selection=data.selection||{};
  $("selection-freshness").textContent=[selection.from&&selection.to?t('Período')+': '+formatCalendarDay(selection.from,language)+' — '+formatCalendarDay(selection.to,language):'',t('Última recopilación')+': '+date(data.lastRun)].filter(Boolean).join(' · ');
  const daily = data.daily ? data.preferences.dailyLabel : "Recopilación diaria desactivada";
  $("daily-sidebar").textContent = daily;
  document.querySelectorAll("[data-admin]").forEach((el) => el.hidden = !data.admin);
  $("sheet-link").hidden = true;
  if (data.admin && validUrl(data.sheetUrl)) {
    $("sheet-link").href = data.sheetUrl;
    $("sheet-link").hidden = false;
  }
}
export {
  renderShell
};
