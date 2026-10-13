function newsletterWords_(text,limit){const words=plainText_(text).split(/\s+/).filter(Boolean);return words.slice(0,limit).join(' ')+(words.length>limit?'…':'');}
function newsletterDigest_(items,query,language,t){
  const cadence=Object.entries(newsletterCadences).find(([,value])=>value.view===(query.view||'briefing'))[0],format=(value,params)=>formatText(value,params,language),annual=cadence==='yearly',weekly=cadence==='weekly';
  const categories=new Map();
  for(const item of items)for(const name of new Set(item.taxonomia.map(row=>row.palanca))){if(!categories.has(name))categories.set(name,[]);categories.get(name).push(item);}
  const ordered=items.slice().sort((a,b)=>Number(b.pais===query.country)-Number(a.pais===query.country)||Number(Boolean(b.senales.length))-Number(Boolean(a.senales.length))||b.fecha.localeCompare(a.fecha)||String(a.id).localeCompare(String(b.id))),cards=[],representatives=new Map(),limit=Math.min(NEWSLETTER_EDITORIAL.cards,settings_().briefingLimit);
  for(const row of ordered){const key=row.taxonomia[0]?.palanca||row.id;if(!representatives.has(key))representatives.set(key,row);}
  const chosen=[...representatives.values()].slice(0,limit),ids=new Set(chosen.map(row=>row.id));
  for(const row of ordered){if(chosen.length===limit)break;if(!ids.has(row.id)){chosen.push(row);ids.add(row.id);}}
  for(const row of chosen){
    const category=row.taxonomia[0]?.palanca||'',related=category?categories.get(category):[row];
    const quarters=new Set(related.map(item=>Math.floor((Number(item.fecha.slice(5,7))-1)/3))),entities=new Set(related.map(item=>item.entidad));
    const relevance=weekly?format('Señal inmediata: {signal}.',{signal:t(row.senales[0]||'Noticia') }):annual?quarters.size>1?format('Evidencia en {count} trimestres; permite contrastar la continuidad del tema.',{count:quarters.size}):t('Evidencia puntual; no permite afirmar un cambio estructural.'):format('Tema observado en {count} entidades; comparar sus propuestas y fuentes.',{count:entities.size});
    const support=new Map();for(const item of related)support.set(weekly?row.id:annual?Math.floor((Number(item.fecha.slice(5,7))-1)/3):item.entidad,item.id);
    cards.push({id:row.id,title:newsletterWords_(row.titular,NEWSLETTER_EDITORIAL.titleWords),fact:newsletterWords_(row.extracto,NEWSLETTER_EDITORIAL.factWords),relevance:newsletterWords_(relevance,NEWSLETTER_EDITORIAL.relevanceWords),evidenceIds:[...new Set([row.id,...[...support.values()].slice(0,NEWSLETTER_EDITORIAL.supportItems)])],relatedCount:related.length,category,entity:row.entidad,country:row.pais,publisher:row.medio,date:row.fecha,url:canonicalUrl_(row.url)});
  }
  return {cadence,heading:newsletterWords_(t(weekly?'Movimientos de la semana':annual?'Perspectiva del año':'Señales del mes'),NEWSLETTER_EDITORIAL.headingWords),intro:cards.length?newsletterWords_(t(weekly?'Novedades concretas para revisar esta semana.':annual?'Evidencias del período para evaluar continuidades y cambios estructurales.':'Temas del mes para contrastar propuestas y evolución del sector.'),NEWSLETTER_EDITORIAL.introWords):'',cards,context:query,scope:configuration_().applicationScope,geographies:configuration_().geographies};
}
