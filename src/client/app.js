import {initializeSearchableSelects} from './features/searchable-selects.js';
import {createGeographyTabs} from './features/geography-tabs.js';
import {createReadingContext} from './features/reading-context.js';
import {createTaxonomyHeatmap} from './features/taxonomy-heatmap.js';
import {createTaxonomy} from './features/taxonomy.js';
import {defaultView,navigationCache} from './config.js';
import {createLanguageSettings} from './features/language-settings.js';
import {createRecoveryControls,renderCollectionJobs} from './features/runs.js';
import {createCollectionProgress} from './features/collection-progress.js';
import {createFilterPanel} from './features/filter-panel.js';
import {createSubscriptions} from './features/subscriptions.js';
import {createNewsletterDelivery} from './features/newsletter-delivery.js';
import {createConfiguration} from './features/configuration.js';
import {createBriefing} from './features/briefing.js';
import { createRadar } from "./features/radar.js";
import { createAdministration } from "./features/administration.js";
import { $, message, setTimezone } from "./core/dom.js";
import {setTaxonomyTranslations} from './core/language.js';
import { call,refreshLoading } from "./core/api.js";
import { createFilters } from "./features/filters.js";
import { renderNews } from "./features/news.js";
import { renderShell,renderFreshness } from "./features/shell.js";
import { createSources } from "./features/sources.js";
import { createUsage } from "./features/usage.js";
import { createNavigation } from "./features/navigation.js";
import {initializeLocalization,flushLocalization} from './core/localization.js';
initializeLocalization();
initializeSearchableSelects();
const state = { data: null, request: 0, busy: false,contentStale:false,attribution:'',view:null,ready:false };
const usage = createUsage({ getView: () => navigation.current === "administration" ? administration.current : navigation.current, isReady:()=>Boolean(state.data),getAttribution:()=>state.attribution&&state.data?.context?.id===state.attribution?state.attribution:'' }), { track, flush } = usage;
const dashboards=new Map();
const selectionKey=query=>JSON.stringify(Object.entries(query).filter(([,value])=>value!==''&&value!=null).sort(([a],[b])=>a.localeCompare(b)));
const noteNewsRevision=revision=>{if(revision&&state.data&&revision!==state.data.newsRevision){state.contentStale=true;dashboards.clear();}};
const configuration = createConfiguration({run:action,onRevision:noteNewsRevision,isActive:()=>navigation.current==='administration'&&administration.current==='configuration'});
const taxonomy=createTaxonomy({run:action,onRevision:noteNewsRevision,isActive:()=>navigation.current==='administration'&&administration.current==='taxonomy'});
const subscriptions = createSubscriptions({run:action,onApply:query=>{const view=query.view;filters.show(view);filters.apply(query);navigation.show(view);}});
const newsletterDelivery=createNewsletterDelivery({run:action});
const languageSettings=createLanguageSettings({run:action,onRevision:noteNewsRevision,isActive:()=>navigation.current==='administration'&&administration.current==='language'});
const administration = createAdministration({ isAdmin: () => Boolean(state.data?.admin), track, onConfiguration:()=>configuration.open(),onSubscribers:()=>Promise.all([subscriptions.open(true),newsletterDelivery.open()]),onLanguage:()=>languageSettings.open(),onLeaveLanguage:()=>languageSettings.close(),onLeaveConfiguration:()=>configuration.close(),onTaxonomy:()=>taxonomy.open(),onLeaveTaxonomy:()=>taxonomy.close() });
const panel=createFilterPanel();
const navigation = createNavigation({onPanel:view=>{++state.request;panel.show(view);refreshLoading();}, onSelection:view=>{configuration.close();taxonomy.close();const changed=filters.show(view);if(state.ready&&(changed||state.contentStale||state.view!==view))load(true);}, onSubscriptions:()=>{configuration.close();taxonomy.close();return subscriptions.open();}, onAdministration: () => administration.open(), isAdmin: () => Boolean(state.data?.admin), track });
const filters = createFilters({ onInvalidate: () => ++state.request, onChange: () => {
  track("filtro");
  load();
} });
const reading=createReadingContext({onCurrent:()=>filters.current(),run:action});
const heatmap=createTaxonomyHeatmap({onExplore:query=>{filters.show('news');filters.apply(query);navigation.show('news');}});
const briefing=createBriefing();
const newsTabs=createGeographyTabs('news-geographies','news-list',name=>filters.setGeography(name));
$('briefing-signals').addEventListener('click',event=>{const button=event.target.closest('[data-signal]');if(button&&!button.disabled)filters.apply({...filters.query(),country:filters.query().country||briefing.geography,signal:button.dataset.signal});});
const radar = createRadar({ onSource:source=>filters.set("source",source), onCountry: (country) => {filters.show("news");filters.apply({...state.data.selection,country});navigation.show("news");}, onEntity: (entity) => filters.set("entity", entity), onNews: () => {const selection=state.data.selection;filters.show("news");filters.apply(selection);navigation.show("news");} });
const sources = createSources({ getData: () => state.data, run: action });
const recoveryControls=createRecoveryControls({getData:()=>state.data,run:action});
const collectionProgress=createCollectionProgress({reload:data=>{noteNewsRevision(data.newsRevision);if(['news','briefing','radar'].includes(navigation.current))return load();},isBusy:()=>state.busy||!$('loading').hidden,onStatus:status=>{if(state.data)state.data.collection=status;if(state.data?.admin)renderCollectionJobs(status);}});
function renderSelection(data,view=navigation.current,appended=null){
  reading.render(data,view);if(view==='news'){renderNews(data,appended);newsTabs.render(data.newsGeographies||[],data.newsGeography||'');}
  if(view==='radar'){radar.render(data);heatmap.render(data);}
  if(view==='briefing')briefing.render(data);
}
async function load(reuse=false) {
  const request = ++state.request, started = performance.now();
  if (!filters.isValid()) {
    return;
  }
  try {
    const administrative=navigation.current==='administration',query=administrative?{view:administration.current,language:filters.query().language}:filters.query();
    if(!administrative){renderFreshness(query.initial?{}:query,state.data?.lastRun);if(query.initial)$("active-filters").hidden=true;}
    const key=selectionKey(query),cached=reuse&&!administrative&&!state.contentStale&&dashboards.get(key);
    const clientCacheHit=Boolean(cached&&performance.now()-cached.time<navigationCache.milliseconds);
    let data=clientCacheHit?{...cached.data,collection:state.data.collection,lastRun:state.data.lastRun,daily:state.data.daily}:await call("getDashboard",query),appended=null;
    if(request!==state.request)return;
    if(query.view==='news'&&query.page>0){
      if(state.data?.newsRevision===data.newsRevision&&data.page===query.page){appended=data.items;data={...data,items:[...state.data.items,...appended]};}
      else data=await call('getDashboard',{...query,page:0});
    }
    if (request === state.request) {
      const first = !state.data;
      if(state.data&&(data.newsRevision!==state.data.newsRevision||data.configurationRevision!==state.data.configurationRevision))dashboards.clear();
      if(administrative&&state.data){
        state.contentStale||=data.newsRevision!==state.data.newsRevision||data.configurationRevision!==state.data.configurationRevision;
        data={...state.data,...data,selection:state.data.selection,context:state.data.context};
      }else state.contentStale=false;
      state.data=data;state.view=query.view;
      if(data.taxonomyTranslations)setTaxonomyTranslations(data.taxonomyTranslations);
      setTimezone(data.preferences?.timezone);
      if(window.RADAR_PREVIEW&&data.admin)$("preview-banner").textContent="Administración local · cambios en memoria, sin acceso a Google. Al recargar se restauran los valores iniciales.";
      const renderStarted=performance.now();
      if(!administrative){
        filters.render(data);
        const key=selectionKey({...filters.query(),...(!query.newsGeography?{newsGeography:''}:{})});dashboards.delete(key);
        if(data.newsRevision&&data.configurationRevision)dashboards.set(key,{data,time:clientCacheHit?cached.time:performance.now()});
        if(dashboards.size>navigationCache.entries)dashboards.delete(dashboards.keys().next().value);
      }
      renderSelection(data,navigation.current,appended);
      if(data.preferences){document.querySelector(".app-footer").hidden=false;$("retention-days").textContent=data.preferences.retentionDays;$("event-limit").textContent=data.preferences.eventLimit;}
      renderShell(data);
      if (data.admin) sources.render(data);
      collectionProgress.update(data);
      flushLocalization();
      track("rendimiento", performance.now() - started,{...data.performance,...(clientCacheHit?{serverMs:0,newsMs:0,preparationMs:0,metadataMs:0,cacheHit:true}:{}),clientCacheHit,rpcMs:clientCacheHit?0:Math.round(renderStarted-started),renderMs:Math.round(performance.now()-renderStarted)});
      if (first) {
        track("acceso");
        track("vista");
        flush();
      }
    }
  } catch (error) {
    if (request === state.request) {
      track("error");
      message(error.message || String(error), true);
    }
  }
}
const actionControls="#language-section button,.actions button,.recovery-control button,#sources-form button,#retry-collection,.recovery-range input,#save-source-settings,#catalog-form button,#catalog-reload,#personal-editor button,#admin-subscription-editor button,#subscriptions-list button,.newsletter-delivery button";
async function action(fn, refresh = true) {
  if (state.busy) return;
  state.busy = true;
  sources.setBusy(true);recoveryControls.setBusy(true);
  document.querySelectorAll(actionControls).forEach((el) => el.disabled = true);
  try {
    await fn();
    if (refresh) await load();
  } catch (e) {
    message(e.message || String(e), true);
  } finally {
    state.busy = false;
    document.querySelectorAll(actionControls).forEach(el=>el.disabled=el.dataset.jobActive==='true');
    sources.setBusy(false);recoveryControls.setBusy(false);
    if (state.data) {
      $("next").disabled = (state.data.page + 1) * state.data.pageSize >= state.data.total;
    }
  }
}
$("next").addEventListener("click", () => {
  filters.setPage(state.data.page + 1);
  load();
});
$("export").addEventListener("click", () => action(async () => {
  const result = await call("exportNews", filters.query());
  const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" })), link = document.createElement("a");
  link.href = url;
  link.download = "news-radar.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
  track("exportacion");
  message(result.count + " publicaciones exportadas.");
}, false));
$("news-list").addEventListener("click", (event) => {
  if (event.target.closest("a")) track("lectura");
});
$('download-telemetry').addEventListener('click',()=>action(async()=>{
  const data=await call('exportTelemetry'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'})),link=document.createElement('a');
  link.href=url;link.download='news-radar-telemetria.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Telemetría descargada.');
},false));
if (window.RADAR_PREVIEW) $("preview-banner").hidden = false;
navigation.show(defaultView);
if(!window.RADAR_PREVIEW&&typeof google!=='undefined')google.script.url.getLocation(async location=>{
  if(location.parameter.edition){const params=location.parameter;state.attribution=params.edition;const view=['news','briefing','radar'].includes(params.view)?params.view:defaultView;filters.show(view);navigation.show(view);state.ready=true;filters.useEdition(params.edition,{country:params.country,entity:params.entity,palanca:params.palanca,subpalanca:params.subpalanca,benchmark:params.benchmark});return;}
  state.ready=true;load();
  if(location.parameter.view!=='subscriptions')return;
  await navigation.show('subscriptions');
  const id=location.parameter.unsubscribe;if(!id)return;
  const target=$('message');message('Confirma la baja de esta suscripción.');
  const button=document.createElement('button');button.type='button';button.className='button';button.textContent='Confirmar baja';
  button.addEventListener('click',()=>action(async()=>{message(await call('deleteSubscription',id));await subscriptions.open();},false));target.appendChild(button);
});else {state.ready=true;load();}

window.addEventListener('news-radar-language-change',async()=>{await load();if(navigation.current==='administration'&&administration.current==='language')await languageSettings.open();if(navigation.current==='administration'&&administration.current==='taxonomy')await taxonomy.open();});
