import {escape} from '../core/dom.js';
import {t} from '../core/language.js';
import {ADMIN_PAGE_SIZE} from '../../shared/record-filters.js';
export function enhanceAdminTables(content){
  const tables=new WeakMap();
  function update(){for(const table of content.querySelectorAll('table')){
    const rows=[...table.querySelectorAll('tbody tr')],previous=tables.get(table);
    if(previous?.rows.length===rows.length&&previous.rows.every((row,index)=>row===rows[index]))continue;
    const headings=[...table.querySelectorAll('thead th')].map(cell=>cell.textContent.trim());
    for(const row of rows)for(const [index,cell] of [...row.cells].entries()){
      if(cell.colSpan!==1)continue;cell.dataset.label=headings[index]||'';
      if(cell.textContent.trim().length>180&&!cell.querySelector('input,select,textarea,button,details')){
        const text=cell.textContent.trim(),details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
        details.className='record-detail';summary.textContent=text.slice(0,100)+'…';
        body.append(...cell.childNodes);details.append(summary,body);cell.append(details);
      }
    }
    previous?.pager?.remove();
    const state={rows,page:0,pager:null};tables.set(table,state);
    if(rows.length<=ADMIN_PAGE_SIZE)continue;
    const pager=document.createElement('div');pager.className='pagination';state.pager=pager;table.closest('.table-wrap')?.after(pager);
    function render(){rows.forEach((row,index)=>row.hidden=index<state.page*ADMIN_PAGE_SIZE||index>=(state.page+1)*ADMIN_PAGE_SIZE);const pages=Math.ceil(rows.length/ADMIN_PAGE_SIZE);pager.innerHTML='<button type="button" class="button" data-step="-1" '+(state.page===0?'disabled':'')+'>'+escape(t('Anterior'))+'</button><span role="status" class="small muted">'+escape(t('{total} resultados · página {page} de {pages}',{total:rows.length,page:state.page+1,pages}))+'</span><button type="button" class="button" data-step="1" '+(state.page===pages-1?'disabled':'')+'>'+escape(t('Siguiente'))+'</button>';}
    pager.addEventListener('click',event=>{const button=event.target.closest('[data-step]');if(!button||button.disabled)return;state.page+=Number(button.dataset.step);render();});render();
  }}
  new MutationObserver(update).observe(content,{childList:true,subtree:true});update();
}
