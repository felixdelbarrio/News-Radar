import { $, message } from "../core/dom.js";
import config from "../config.js";
import { loadMetrics } from "./metrics.js";
import { loadAudit } from "./audit.js";
function createAdministration({ isAdmin, track, onConfiguration, onSubscribers,onLanguage,onLeaveLanguage,onRuns,onLeaveRuns,onLeaveSubscribers,onTaxonomy,onLeaveTaxonomy,onLlm,onLeaveLlm }) {
  const content=document.querySelector('#administration-section .admin-content');
  function labelTables(){for(const table of content.querySelectorAll('table')){
    const headings=[...table.querySelectorAll('thead th')].map(cell=>cell.textContent.trim());
    for(const row of table.querySelectorAll('tbody tr'))for(const [index,cell] of [...row.cells].entries())if(cell.colSpan===1)cell.dataset.label=headings[index]||'';
  }}
  new MutationObserver(labelTables).observe(content,{childList:true,subtree:true});labelTables();
  let current = Object.keys(config.adminViews)[0];
  async function open(view = Object.keys(config.adminViews)[0]) {
    if (!isAdmin() || !(view in config.adminViews)) return;
    if(current==="language"&&view!==current)onLeaveLanguage();
    if(current==='runs'&&view!==current)onLeaveRuns();
    if(current==='subscribers'&&view!==current)onLeaveSubscribers();
    if(current==="taxonomy"&&view!==current)onLeaveTaxonomy();
    if(current==='llm'&&view!==current)onLeaveLlm();
    current = view;
    track("vista");
    for (const name of Object.keys(config.adminViews)) $(name + "-section").hidden = name !== view;
    $("admin-tabs").querySelectorAll("[data-admin-view]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.adminView === view));
      button.tabIndex = button.dataset.adminView === view ? 0 : -1;
    });
    if(view === "subscribers")await onSubscribers();
    if(view === "configuration")try{await onConfiguration();}catch(error){message(error.message||String(error),true);}
    if(view === 'llm')await onLlm();
    if(view === "taxonomy")await onTaxonomy();
    if(view === "language")await onLanguage();
    if (view === "runs") await onRuns();
    if (view === "audit") await loadAudit();
    if (view === "telemetry" || view === "adoption" || view === "feedback") await loadMetrics(view, () => current === view && !$("administration-section").hidden);
  }
  $("admin-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-view]");
    if (button&&button.dataset.adminView!==current) open(button.dataset.adminView).catch(error=>message(error.message,true));
  });
  $("admin-tabs").addEventListener("keydown", (event) => {
    const views = Object.keys(config.adminViews), index = views.indexOf(current);
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : (index + (["ArrowRight","ArrowDown"].includes(event.key) ? 1 : -1) + views.length) % views.length;
    if(views[next]!==current)open(views[next]).catch(error=>message(error.message,true));
    $("admin-tabs").querySelector('[data-admin-view="' + views[next] + '"]').focus();
  });
  return { open, get current() {
    return current;
  } };
}
export {
  createAdministration
};
