export const HEATMAP_PAGE=Object.freeze({rows:12,columns:8});
export function heatmapPage(data,axis,level,rowPage,columnPage){
  const columns=data.nodes.map((node,index)=>({...node,index})).filter(node=>node.level===level).sort((a,b)=>b.count-a.count||a.palanca.localeCompare(b.palanca)||a.subpalanca.localeCompare(b.subpalanca)),rows=data[axis]||[];
  const indices=new Set(columns.map(node=>node.index));let max=1;for(const row of rows)for(const [index,count] of row.counts)if(indices.has(index))max=Math.max(max,count);
  const pages={rows:Math.ceil(rows.length/HEATMAP_PAGE.rows),columns:Math.ceil(columns.length/HEATMAP_PAGE.columns)};
  rowPage=Math.min(Math.max(0,rowPage),Math.max(0,pages.rows-1));columnPage=Math.min(Math.max(0,columnPage),Math.max(0,pages.columns-1));
  return {rows:rows.slice(rowPage*HEATMAP_PAGE.rows,(rowPage+1)*HEATMAP_PAGE.rows).map(row=>({...row,counts:new Map(row.counts)})),columns:columns.slice(columnPage*HEATMAP_PAGE.columns,(columnPage+1)*HEATMAP_PAGE.columns),pages,rowPage,columnPage,max};
}
export function heatmapValue(count,total,mode,max){const share=total?Math.round(count/total*100):0;return {share,level:count?Math.min(4,Math.max(1,Math.ceil((mode==='share'?share/100:count/max)*4))):0};}
