import {identityMark} from '../../shared/visual-identity.js';
import { $, escape, metricCards } from "../core/dom.js";
import {language,t} from '../core/language.js';
import { trendChart } from "./trend-chart.js";
function createRadar({ onCountry, onEntity, onSource }) {
  let signature = "", geographySignature="", trend, chartWidth=0;
  function renderTrend(width){
    if(!trend||!width)return;
    chartWidth=width;$('trend-chart').innerHTML=trendChart(trend,width);
  }
  const chartObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width&&Math.abs(width-chartWidth)>1)renderTrend(width);});
  chartObserver.observe($('trend-chart'));
  $("map-panel").addEventListener("click", (event) => {
    const target = event.target.closest("[data-country]");
    if (target&&target.dataset.count!=='0') onCountry(target.dataset.country);
  });
  $("world-map").addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      const target = event.target.closest("[data-country]");
      if (target&&target.dataset.count!=='0') {
        event.preventDefault();
        onCountry(target.dataset.country);
      }
    }
  });
  $("entity-ranking").addEventListener("click", (event) => {
    const target = event.target.closest("[data-entity]");
    if (target) onEntity(target.dataset.entity);
  });
  $('publisher-chart').addEventListener('click',event=>{const button=event.target.closest('[data-source]');if(button)onSource(button.dataset.source);});
  function highlightCountry(event){
    const target=event.target.closest('[data-country]'),country=target?.dataset.count!=='0'?target?.dataset.country:null;
    $('map-panel').querySelectorAll('[data-country]').forEach(node=>node.classList.toggle('is-highlighted',Boolean(country&&node.dataset.country===country)));
  }
  for(const name of ['pointerover','focusin'])$('map-panel').addEventListener(name,highlightCountry);
  for(const name of ['pointerout','focusout'])$('map-panel').addEventListener(name,event=>{if(!event.relatedTarget||!$('map-panel').contains(event.relatedTarget))highlightCountry({target:$('map-panel')});else highlightCountry({target:event.relatedTarget});});
  const tooltip=$('trend-tooltip');
  function highlightPoint(event){
    const point=event.target.closest('[data-point],[data-bucket]'),index=point?.dataset.point??point?.dataset.bucket;
    const band=index!=null?$('trend-chart').querySelector('[data-bucket="'+index+'"]'):null;
    $('trend-chart').querySelectorAll('.chart-band.is-highlighted').forEach(node=>node.classList.remove('is-highlighted'));
    if(band)band.classList.add('is-highlighted');
    tooltip.hidden=!band;if(band){tooltip.textContent=band.getAttribute('aria-label');const panel=tooltip.parentElement.getBoundingClientRect(),anchor=point.getBoundingClientRect(),x=event.clientX||anchor.x+anchor.width/2,y=event.clientY||anchor.y;tooltip.style.left=Math.max(0,Math.min(x-panel.x+12,panel.width-tooltip.offsetWidth))+'px';tooltip.style.top=Math.max(0,Math.min(y-panel.y+16,panel.height-tooltip.offsetHeight))+'px';}
  }
  for(const name of ['pointerover','pointermove','focusin'])$('trend-chart').addEventListener(name,highlightPoint);
  for(const name of ['pointerout','focusout'])$('trend-chart').addEventListener(name,event=>highlightPoint({target:event.relatedTarget&&$('trend-chart').contains(event.relatedTarget)?event.relatedTarget:$('trend-chart')}));
  const mapObserver=new ResizeObserver(entries=>{const height=entries[0].contentRect.height;if(height)$('map-panel').style.setProperty('--map-height',height+'px');});
  mapObserver.observe(document.querySelector('.map-canvas'));
  return { render(data) {
    const geography=JSON.stringify(data.geographies||[]);
    if(geography!==geographySignature){
      geographySignature=geography;
      const scopes=new Map((data.geographies||[]).map(row=>[Number(row.mapId),row.name]));
      $("world-map").querySelectorAll("[data-code]").forEach(node=>{
        const country=scopes.get(Number(node.dataset.code)),marker=node.classList.contains('map-marker');
        if(country){node.dataset.country=country;node.removeAttribute('aria-hidden');node.setAttribute('role','button');node.setAttribute('tabindex',marker?'0':'-1');if(marker)node.style.display='';}
        else{delete node.dataset.country;node.setAttribute('aria-hidden','true');node.removeAttribute('role');node.removeAttribute('tabindex');if(marker)node.style.display='none';}
        node.removeAttribute('hidden');
      });
    }
    const radar = data.radar, next = JSON.stringify([radar,data.countries,geography,language]);
    if (next === signature) return;
    signature = next;
    $("metrics").innerHTML = metricCards([["Publicaciones", data.stats.news, "En la selección"], ["Entidades", data.stats.entities, "Con presencia en medios"], ["Medios", data.stats.sources, "Editores distintos"], ["Geografías", data.stats.countries, "Con publicaciones en la selección"]]);
    $("radar-focus").textContent = radar.ranking.length === 1 ? radar.ranking[0].entity : "Panorama de entidades";
    $("radar-context").textContent = radar.summary.news ? "Distribución geográfica, entidades mencionadas y evolución de las publicaciones recopiladas." : "Amplía los filtros para descubrir nuevas publicaciones y su distribución.";
    $('radar-count').textContent=t('{count} publicaciones',{count:radar.summary.news});
    $("map-selection").textContent = radar.ranking.length === 1 ? radar.ranking[0].entity : "Todas las entidades de la selección";
    const max = Math.max(1, ...radar.geographies.map((area) => area.total)), areas = new Map(radar.geographies.map((area) => [area.country, area]));
    $("world-map").querySelectorAll("[data-country]").forEach((node) => {
      const area = areas.get(node.dataset.country), count = area?.total || 0, level = count ? Math.ceil(count / max * 4) : 0;
      node.dataset.count=String(count);
      node.setAttribute('aria-disabled',String(!count));if(!count)node.classList.remove('is-highlighted');node.setAttribute('tabindex',count&&node.classList.contains('map-marker')?'0':'-1');
      if(node.classList.contains('map-marker'))node.style.display=count?'':'none';
      node.style.setProperty("--map-fill", "var(--heat-" + level + ")");
      node.setAttribute("aria-label", node.dataset.country + ": " + count + " publicaciones. Filtrar por esta geografía.");
      const title = node.querySelector("title");
      if (title) title.textContent = node.dataset.country + " · " + count + " publicaciones" + (area ? " · " + area.entities.map((row) => row.entity + ": " + row.count).join(", ") : "");
    });
    const countries = radar.geographies.filter(row=>row.total>0).map(row=>row.country);
    $("map-countries").innerHTML = countries.map((country) => {
      const count = areas.get(country)?.total || 0;
      return `<button type="button" class="geo-row" data-country="${escape(country)}"><span class="identity-label">${identityMark('countries',country,escape)}${escape(country)}</span><span class="geo-count">${count}</span><span class="geo-track"><span style="width:${count / max * 100}%"></span></span></button>`;
    }).join("");
    $("map-note").textContent = radar.unlocated ? t('{count} publicaciones sin geografía conocida, excluidas del mapa.',{count:radar.unlocated}) : "Todas las publicaciones de la selección tienen una geografía conocida.";
    trend=radar.trend;renderTrend($("trend-chart").clientWidth||900);
    $("trend-period").textContent = radar.trend.buckets.length ? radar.trend.from + " — " + radar.trend.to : "Sin publicaciones";
    $("trend-note").textContent = radar.trend.intervalDays > 1 ? t('Volumen agrupado en intervalos de {days} días.',{days:radar.trend.intervalDays}) : "Número de publicaciones por día, incluidos los días sin noticias.";
    $("entity-ranking").innerHTML = radar.ranking.length ? radar.ranking.slice(0, 6).map((row, i) => `<button type="button" class="ranking-row" data-entity="${escape(row.entity)}"><span class="ranking-index">${String(i + 1).padStart(2, "0")}</span>${identityMark('entities',row.entity,escape)}<span class="ranking-name">${escape(row.entity)}<span class="ranking-track"><span style="width:${row.total / Math.max(1, radar.summary.news) * 100}%"></span></span></span><strong>${row.total}</strong></button>`).join("") : '<p class="muted">Las entidades aparecerán al ampliar tu selección.</p>';
    $("ranking-note").textContent = radar.ranking.length > 6 ? "Se muestran las seis entidades con más publicaciones." : "Selecciona una entidad para explorar su actualidad.";
    const publishers=radar.publishers||[],publisherMax=Math.max(1,...publishers.map(row=>row.total));
    const available=radar.available;$('publisher-evidence').textContent=t('Se muestran los seis medios con más publicaciones.')+' '+(available?t('Período')+': '+radar.trend.from+' — '+radar.trend.to+'. '+t('Noticias recuperadas')+': '+available.total+'; '+t('Noticias de la selección')+': '+radar.summary.news+'. '+t('Los recuentos reflejan la recuperación disponible y los filtros, no toda la producción del medio.'):'');
    $('publisher-chart').innerHTML=publishers.length?publishers.map(row=>`<button type="button" class="ranking-row" data-source="${escape(row.publisher)}"><span class="ranking-name" data-original>${identityMark('publishers',row.publisher,escape)}${escape(row.publisher)}<span class="ranking-track"><span style="width:${row.total/publisherMax*100}%"></span></span></span><strong>${row.total}</strong></button>`).join(''):'<p class="muted">Sin publicaciones</p>';
    $("radar-publisher").textContent = radar.topPublisher || "Sin publicaciones";
  } };
}
export {
  createRadar
};
