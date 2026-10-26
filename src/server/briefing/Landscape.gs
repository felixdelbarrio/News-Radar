function newsletterCoverageOrder_(a,b){return b.count-a.count||a.name.localeCompare(b.name,'es');}
function newsletterComparisonRows_(items,editorial,scope){if(scope!=='international')throw Error('Ámbito no disponible.');return items.filter(row=>!editorial.context.country||row.pais!==editorial.context.country);}
function newsletterLandscape_(items){
 const entities=new Set(),countries=new Set(),themes=new Map();let bbvaCount=0,unknownCountryCount=0;
 for(const row of items){entities.add(row.entidad);if(row.entidad==='BBVA')bbvaCount++;if(row.pais&&row.pais!=='Sin determinar')countries.add(row.pais);else unknownCountryCount++;for(const name of new Set(row.taxonomia.map(tag=>tag.palanca)))themes.set(name,(themes.get(name)||0)+1);}
 return {total:items.length,entityCount:entities.size,countryCount:countries.size,unknownCountryCount,bbvaCount,themes:[...themes].map(([name,count])=>({name,count,share:items.length?Math.round(count/items.length*100):0})).sort(newsletterCoverageOrder_)};
}
function newsletterExecutiveReport_(editorial,query,language,t,escape){
 if(!editorial.landscapes)return {html:'',text:''};
 const values=Object.values(editorial.landscapes).filter(Boolean),total=values.reduce((sum,row)=>sum+row.total,0);if(!total)return {html:'',text:''};
 const themes=new Map();for(const data of values)for(const theme of data.themes)themes.set(theme.name,(themes.get(theme.name)||0)+theme.count);
 const findings=[...themes].map(([name,count])=>({name,count})).sort(newsletterCoverageOrder_).slice(0,NEWSLETTER_EDITORIAL.cards),heading=t('El trimestre en contexto'),note=formatText('{count} noticias elegibles analizadas. Los recuentos describen las fuentes y filtros de esta edición; no miden adopción, éxito ni cuota de mercado.',{count:total},language),rows=findings.map(row=>'<tr><td class="newsletter-finding-cell">'+escape(t(row.name))+'</td><td class="newsletter-finding-cell">'+row.count+' / '+total+'</td></tr>').join('');
 return {html:'<table role="presentation" class="newsletter-report"><tr><td class="newsletter-report-cell"><h2>'+escape(heading)+'</h2><p class="newsletter-meta">'+escape(note)+'</p><table role="presentation" class="newsletter-findings">'+rows+'</table></td></tr></table>',text:[heading,note,...findings.map(row=>t(row.name)+': '+row.count+' / '+total)].join('\n')};
}
