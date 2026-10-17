import {identityMark} from '../../shared/visual-identity.js';
import {$,escape} from '../core/dom.js';
import {t,language} from '../core/language.js';
import {taxonomyPath} from '../../shared/taxonomy-path.js';
import {heatmapPage,heatmapValue} from './heatmap-model.js';
export function createTaxonomyHeatmap({onExplore}){
  let data,selection={},rowPage=0,columnPage=0,signature='';
  function render(){
    if(!data)return;
    const axis=$('heatmap-axis').value,level=$('heatmap-level').value,mode=$('heatmap-measure').value,page=heatmapPage(data,axis,level,rowPage,columnPage);rowPage=page.rowPage;columnPage=page.columnPage;
    const label=node=>node.level==='palanca'?t(node.palanca):t(node.subpalanca),number=new Intl.NumberFormat(language);
    $('heatmap-summary').textContent=t('{tagged}/{total} noticias con taxonomía; {missing} sin catalogar.',{tagged:data.tagged,total:data.total,missing:data.total-data.tagged});
    $('heatmap-table').innerHTML=page.columns.length?'<table><caption>'+t("Bloques funcionales y funcionalidades / sub operativas por entidad y geografía")+'</caption><thead><tr><th scope="col">'+t(axis==='entities'?'Entidad':'Geografía')+'</th>'+page.columns.map(node=>'<th scope="col" data-original>'+escape(label(node))+'</th>').join('')+'</tr></thead><tbody>'+page.rows.map((row,index)=>'<tr><th scope="row" data-original>'+identityMark(axis,row.name,escape)+escape(t(row.name))+'<small>'+escape(t('{count} noticias',{count:row.total}))+'</small></th>'+page.columns.map(node=>{
      const count=row.counts.get(node.index)||0,value=heatmapValue(count,row.total,mode,page.max),text=t('{group} · {topic}: {count} noticias ({share} %). Ver noticias.',{group:t(row.name),topic:label(node),count,share:value.share});
      return '<td><button type="button" class="heat-cell heat-'+value.level+'" data-row="'+index+'" data-node="'+node.index+'" aria-label="'+escape(text)+'" title="'+escape(text)+'"'+(!count?' disabled':'')+'><span class="heat-cell-topic" aria-hidden="true">'+escape(label(node))+'</span><span>'+escape(mode==='share'?value.share+' %':number.format(count))+'</span></button></td>';
    }).join('')+'</tr>').join('')+'</tbody></table>':'<p class="muted">'+t('No hay noticias catalogadas en esta selección.')+'</p>';
    $('heatmap-rows-label').textContent=t('{visible} de {total} grupos',{visible:page.rows.length,total:data[axis].length});$('heatmap-columns-label').textContent=t('Categorías {page}/{pages}',{page:page.pages.columns?columnPage+1:0,pages:page.pages.columns});
    $('heatmap-rows-next').disabled=rowPage+1>=page.pages.rows;
    for(const [id,value,max] of [['columns',columnPage,page.pages.columns]]){$('heatmap-'+id+'-previous').disabled=!value;$('heatmap-'+id+'-next').disabled=value+1>=max;}
    const top=data.nodes.filter(node=>node.level===level).sort((a,b)=>b.count-a.count)[0];$('heatmap-focus').textContent=top?t('La categoría más presente es {topic}, en {count} noticias.',{topic:label(top),count:top.count}):'';
  }
  for(const id of ['axis','level','measure'])$('heatmap-'+id).addEventListener('change',()=>{rowPage=0;columnPage=0;render();});
  $('heatmap-rows-next').addEventListener('click',()=>{rowPage++;render();});
  for(const id of ['columns'])for(const direction of ['previous','next'])$('heatmap-'+id+'-'+direction).addEventListener('click',()=>{const step=direction==='next'?1:-1;if(id==='rows')rowPage+=step;else columnPage+=step;render();});
  $('heatmap-table').addEventListener('click',event=>{
    const button=event.target.closest('[data-node]');if(!button)return;
    const axis=$('heatmap-axis').value,page=heatmapPage(data,axis,$('heatmap-level').value,rowPage,columnPage),row=page.rows[Number(button.dataset.row)],node=data.nodes[Number(button.dataset.node)];if(!row||!node)return;
    onExplore({...selection,[axis==='entities'?'entity':'country']:row.name,palanca:node.palanca,subpalanca:node.level==='subpalanca'?taxonomyPath(node):'',page:0});
  });
  return {render(value){
    const next=JSON.stringify([value.heatmap,value.selection,language]);if(next===signature)return;signature=next;data=value.heatmap;selection=value.selection||{};rowPage=0;columnPage=0;render();
  }};
}
