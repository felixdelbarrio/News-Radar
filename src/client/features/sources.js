import { $, escape, message } from "../core/dom.js";
import { call } from "../core/api.js";
import {createSourceCatalog} from "./source-catalog.js";
import {t} from '../core/language.js';
function createSources({ getData, run }) {
  const catalog=createSourceCatalog();
  let busy = false, signature = "";
  function sourceFields(feeds) {
    $("source-fields").innerHTML = feeds.map((f, i) => `<fieldset class="source"><legend>Fuente ${i + 1}</legend>${[["name", "Nombre"], ["url", "URL del feed RSS"], ["domain", "Dominio del editor"], ["entity", "Entidad"], ["country", "País / alcance"], ["language", "Idioma del feed (opcional)"]].map(([key, label]) => `<label class="${key === "url" ? "wide" : ""}">${label}<input data-key="${key}" value="${escape(f[key] || "")}" ${key === "url" ? 'type="url"' : ""} ${key==='language'?'':'required'}></label>`).join("")}<label>Activa<input type="checkbox" data-key="enabled" ${f.enabled!==false?"checked":""}></label><button class="button remove-source" type="button">Eliminar fuente</button></fieldset>`).join("");
    $("sources-form").querySelectorAll("input,button").forEach((el) => el.disabled = !getData()?.admin || busy);
  }
  function currentFeeds() {
    return [...$("source-fields").children].map((el) => Object.fromEntries([...el.querySelectorAll("[data-key]")].map((x) => [x.dataset.key, x.type==="checkbox"?x.checked:x.value])));
  }
  function collectionText(status) {
    return status.total ? t('{processed} de {total} consultas completadas; {pending} pendientes y {failed} con error. Las noticias se integran automáticamente.',status) : "Las fuentes están activas. La próxima recopilación las consultará por lotes.";
  }
  function recover(method,range){return run(async()=>{
    const result=await call(method,...(range?[range]:[]));
    message(result.notice||result.added+" noticias nuevas. "+(result.pending?result.pending+" consultas pendientes; la recuperación continúa automáticamente.":"Recuperación completada.")+(result.errors.length?" "+result.errors.join(" | "):""),result.errors.length>0);
  });}
  $("collect").addEventListener("click",()=>recover('collectNow',document.querySelector('input[name="recovery-range"]:checked').value));
  $('continue-collection').addEventListener('click',()=>recover('resumeCollection'));
  $("sources-form").addEventListener("submit", (e) => {
    e.preventDefault();
    run(async () => {
      await call("saveFeeds", currentFeeds());
      message("Fuentes guardadas.");
    });
  });
  $("add-source").addEventListener("click", () => {
    const feeds = currentFeeds();
    if (feeds.length >= Number($("source-fields").dataset.max)) return message("Máximo " + $("source-fields").dataset.max + " fuentes RSS.", true);
    sourceFields([...feeds, { country: getData().preferences.unknownCountry }]);
  });
  $("source-fields").addEventListener("click", (e) => {
    if (e.target.closest(".remove-source")) e.target.closest("fieldset").remove();
  });
  $("toggle-daily").addEventListener("click", () => run(async () => {
    const enabled = getData().daily;
    const result=await call(enabled ? "disableDaily" : "enableDaily");
    message(enabled ? "Recopilación diaria desactivada." : result);
  }));
  $("save-source-settings").addEventListener("click", () => run(async () => message(await call("saveSourceSettings", catalog.selected()))));
  $("retry-collection").addEventListener("click", () => run(async () => message(await call("retryCollectionErrors"))));
  return { render(data) {
    const next = JSON.stringify([data.feeds, data.configuredFeeds]);
    if (next !== signature) {
      signature = next;
      sourceFields(data.feeds);
      $("source-fields").dataset.max=data.maxFeeds;$("source-limit").textContent=data.maxFeeds;
      catalog.update(data.configuredFeeds,data.pageSize);
    }
    $("source-schedule").textContent=data.schedule||"";
    $("collection-status").textContent = collectionText(data.collection);
  }, renderProgress(status){$('collection-status').textContent=collectionText(status);$('continue-collection').hidden=!(status.pending||status.queued);}, setBusy(value) {
    busy = value;
    $("sources-form").querySelectorAll("input,button").forEach((el) => el.disabled = busy || !getData()?.admin);
  } };
}
export {
  createSources
};
