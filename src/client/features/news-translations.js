import {call} from '../core/api.js';
import {language} from '../core/language.js';
export function createNewsTranslations({getView,getData,onUpdate}){
  let generation=0,timer;const key=row=>row.id+'|'+(row.original?.titular||row.titular)+'|'+(row.original?.extracto||row.extracto||'');const memory=new Map();
  function cancel(){generation++;clearTimeout(timer);}
  function start(){
    cancel();const view=getView(),data=getData();if(!['news','briefing'].includes(view)||!data)return;
    const rows=view==='briefing'?data.briefing?.items||[]:data.items,ids=[];let applied=false;
    for(const row of rows){const value=memory.get(key(row));if(value){Object.assign(row,value);applied=true;}else if(row.translation?.state!=='translated'&&row.translation?.state!=='native')ids.push(row.id);}
    if(applied)onUpdate();if(!ids.length)return;const current=generation;let retries=0;
    async function batch(pending){
      if(current!==generation||getView()!==view||document.hidden)return;
      try{
        const response=await call('translateNews',{ids:pending,language});if(current!==generation||getView()!==view)return;
        for(const value of response.items){const source=rows.find(row=>row.id===value.id);if(source)memory.set(key(source),value);for(const row of [...(data.items||[]),...(data.briefing?.items||[])])if(row.id===value.id)Object.assign(row,value);}
        if(!response.busy)for(const row of rows)if(pending.includes(row.id)&&!response.items.some(item=>item.id===row.id)&&!response.pending.includes(row.id))row.translation={language,state:'unavailable'};
        while(memory.size>200)memory.delete(memory.keys().next().value);onUpdate();
        if(response.pending.length){
          if(!response.busy||retries++<12)timer=setTimeout(()=>batch(response.pending),response.busy?10000:250);
          else{for(const row of rows)if(response.pending.includes(row.id))row.translation={language,state:'unavailable'};onUpdate();}
        }
      }catch{
        if(current!==generation)return;
        for(const row of rows)if(pending.includes(row.id))row.translation={language,state:'unavailable'};
        onUpdate();
      }
    }
    batch(ids);
  }
  return {start,cancel};
}
