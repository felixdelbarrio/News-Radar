import { $, message } from "../core/dom.js";
import config from "../config.js";
import { loadMetrics } from "./metrics.js";
import { loadAudit } from "./audit.js";
import {enhanceAdminTables} from "./admin-tables.js";
function createAdministration({ isAdmin, track, onConfiguration, onSubscribers,onRuns,onLeaveRuns,onLeaveSubscribers,onTaxonomy,onLeaveTaxonomy,onLlm,onLeaveLlm }) {
  const content=document.querySelector('#administration-section .admin-content');
  enhanceAdminTables(content);
  let current = Object.keys(config.adminViews)[0];
  async function open(view = Object.keys(config.adminViews)[0]) {
    if (!isAdmin() || !(view in config.adminViews)) return;
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
      if(button.dataset.adminView===view)button.scrollIntoView?.({block:"nearest",inline:"nearest"});
    });
    if(view === "subscribers")await onSubscribers();
    if(view === "configuration")try{await onConfiguration();}catch(error){message(error.message||String(error),true);}
    if(view === 'llm')await onLlm();
    if(view === "taxonomy")await onTaxonomy();

    if (view === "runs") await onRuns();
    if (view === "audit") await loadAudit();
    if (view === "adoption" || view === "feedback") await loadMetrics(view, () => current === view && !$("administration-section").hidden);
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
