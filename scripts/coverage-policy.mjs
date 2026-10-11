export const coverageMetrics=['lines','statements','functions','branches'];
export function coverageFailures(summary){
 return coverageMetrics.filter(metric=>!summary[metric]?.total||summary[metric].covered/summary[metric].total<=.8);
}
