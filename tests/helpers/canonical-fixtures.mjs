// Materialize test fixtures at creation time. Production readers never infer saved classifications.
export function canonicalFixtures(c,rows){return rows.map(row=>{
 let labels;try{labels=JSON.parse(row.clasificacion||'{}');}catch{return row;}
 if(!labels||labels.schema)return row;
 const classification=c.classification_(c.searchText_(row.titular),c.searchText_((row.titular||'')+' '+(row.extracto||'')),false);
 return {...row,clasificacion:JSON.stringify({digital:classification.assessment.relevant,capacidades:classification.assessment.capabilities.map(row=>row.segment+': '+row.name),...labels,schema:1,segmentos:classification.segments,senales:classification.assessment.excluded?[]:classification.signals,score:classification.assessment.score})};
});}
export function annotateFixtures(c,rows){return c.annotateNews_(canonicalFixtures(c,rows));}
export function newsletterFixture(c,rows,...args){return c.newsletter_(canonicalFixtures(c,rows),...args);}
export function drainSnapshots(c){for(let i=0;i<3;i++)c.dashboardSnapshotBatch_();}
