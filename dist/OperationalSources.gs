/** Public press coverage referencing Downdetector; not the Enterprise API. */
function operationalFeeds_(range){
 const config=configuration_(),id='operational/downdetector';
 const query=collectionPeriod_(range)+' (downdetector OR "down detector") (banking OR bank OR banco OR banca) (outage OR unavailable OR "service disruption" OR caída OR fallos)';
 return [{id,name:'Incidencias · referencias a Downdetector',url:canonicalUrl_('https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl=en&gl=US&ceid=US:en'),domain:'news.google.com',entity:'Sector',country:config.settings.unknownCountry,language:'en',kind:'rss',incidentOnly:true,enabled:!config.settings.disabledSources.includes(id)}];
}
function operationalSourceEvidence_(title,text,index){
 if(!/\bdown\s?detector\b/.test(text))return null;
 const clean=value=>value.replace(/\bdown\s?detector\b/g,' '),headline=clean(title),body=clean(text);
 const incident=businessSignals_(headline,body,index).find(row=>row.group==='Problema');
 if(!incident)return null;
 const evidence=incident.pattern.exec(incident.scope==='headline'?headline:body)?.[0]?.trim()||'';
 return evidence?{nombre:INCIDENT_SIGNAL,texto:evidence}:null;
}
