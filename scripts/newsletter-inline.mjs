export function newsletterInlineStyles(css){
 const styles={};let start=0,body=0,depth=0,selectors='',quote='';
 for(let i=0;i<css.length;i++){
  const character=css[i];
  if(quote){if(character==='\\')i++;else if(character===quote)quote='';continue;}
  if(character==='"'||character==="'"){quote=character;continue;}
  if(character==='/'&&css[i+1]==='*'){
   const end=css.indexOf('*/',i+2);if(end<0)break;
   if(!depth)start=end+2;i=end+1;continue;
  }
  if(character==='{'){
   if(!depth){selectors=css.slice(start,i).trim();body=i+1;}depth++;
  }else if(character==='}'&&depth){
   if(--depth===0){
    if(selectors&&!selectors.startsWith('@')){
     const rule=css.slice(body,i);
     for(const selector of selectors.split(',')){const key=selector.trim();styles[key]=(styles[key]||'')+rule+';';}
    }
    start=i+1;
   }
  }else if(character===';'&&!depth)start=i+1;
 }
 return styles;
}
