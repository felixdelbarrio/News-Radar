import fs from 'node:fs';
import {storage} from '../tests/helpers/server.mjs';
import {benchmarkSource} from './benchmark-source.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/ingestion-golden.json',import.meta.url))),base=benchmarkSource([...process.argv.slice(2),'--baseline=HEAD']);
function quality(source){
 const {c}=storage(source);c.initializeConfiguration();const definitions=c.taxonomyDefinitions(c.configuration_().taxonomy),rows=fixture.cases.map(row=>{const result=c.classification_(c.searchText_(row.title),c.searchText_(row.title+' '+row.excerpt)),functional=c.taxonomyDecision(c.taxonomyText(row.title+' '+row.excerpt),definitions,row.title);return {...row,predicted:result.labels.digital,businessPredicted:result.assessment.business,functions:Array.from(functional.matches,match=>match.row.key),state:result.labels.estado||'no registrado'};});
 let tp=0,fp=0,fn=0,tn=0,segmentErrors=0,segmentTotal=0,functionTotal=0,functionCorrect=0;
 for(const row of rows){if(row.relevant!==null){if(row.predicted&&row.relevant)tp++;else if(row.predicted)fp++;else if(row.relevant)fn++;else tn++;}if(row.business!==null){segmentTotal++;if(row.business!==row.businessPredicted)segmentErrors++;}if(row.function){functionTotal++;if(row.functions.includes(row.function))functionCorrect++;}}
 return {evaluable:tp+fp+fn+tn,tp,fp,fn,tn,precision:tp/(tp+fp)||0,recall:tp/(tp+fn)||0,segmentErrors,segmentTotal,functionCorrect,functionTotal,abstentions:rows.filter(row=>row.state==='indeterminado').length,rows};
}
const report={baselineRevision:base.revision,scope:'Muestra semántica local de '+fixture.cases.length+' textos; sin revisión humana doble ni inferencia poblacional.',sourceSampleRows:fixture.sourceSampleRows,excludedSampleRowsWithoutOriginalText:fixture.excludedSampleRowsWithoutOriginalText,baseline:quality(base.source),current:quality()};
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9);if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2));
