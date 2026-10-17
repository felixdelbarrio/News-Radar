function validateTaxonomy_(blocks){
  if(!Array.isArray(blocks)||!blocks.length||blocks.length>60)throw Error('Define los bloques funcionales del catálogo.');
  const names=new Set(),ids=new Set();let count=0;
  for(const block of blocks){
    if(!block||!/^\d{2}\..{1,100}$/.test(block.name)||names.has(block.name)||!Array.isArray(block.functions)||!Array.isArray(block.terms)||!Array.isArray(block.emerging)||block.terms.length>80||block.emerging.length>20||block.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>100))throw Error('Bloque funcional no válido o duplicado.');
    names.add(block.name);
    const concepts=new Set();for(const concept of block.emerging){if(!concept||typeof concept.name!=='string'||!concept.name.trim()||concept.name.length>100||concepts.has(taxonomyText(concept.name))||!Array.isArray(concept.terms)||!concept.terms.length||concept.terms.length>24||concept.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>100))throw Error('Concepto emergente no válido.');concepts.add(taxonomyText(concept.name));}
    for(const row of block.functions){
      if(!row||!/^\d{2}\.\d{2}$/.test(row.id)||!row.id.startsWith(block.name.slice(0,3))||ids.has(row.id)||typeof row.name!=='string'||!row.name.trim()||row.name.length>200||!Array.isArray(row.terms)||row.terms.length>24||row.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>200))throw Error('Funcionalidad no válida o duplicada: '+row?.id);
      ids.add(row.id);count++;
    }
  }
  if(count>1000||JSON.stringify(blocks).length>40000)throw Error('El catálogo funcional excede los límites de almacenamiento.');
}
function functionalCatalogRows_(sheets,previous){
  const existing=new Map(previous.flatMap(block=>block.functions.map(row=>[row.id,row]))),blocks=new Map();
  for(const rows of sheets){
    const header=rows.findIndex(row=>row.includes('Bloque funcional')&&row.includes('Funcionalidad/Sub Operativa'));
    if(header<0)throw Error('No se encuentran las columnas del catálogo funcional.');
    const columns=rows[header],idColumn=columns.indexOf('ID'),blockColumn=columns.indexOf('Bloque funcional'),functionColumn=columns.indexOf('Funcionalidad/Sub Operativa');
    for(const row of rows.slice(header+1)){
      const id=String(row[idColumn]||'').trim();if(!/^\d{2}\.\d{2}$/.test(id))continue;
      const name=String(row[blockColumn]||'').replace(/\s+/g,' ').trim().replace('Herramientas empleados','Herramientas Empleados'),key=id.slice(0,2)+'.'+name;
      if(!blocks.has(key)){const old=previous.find(block=>block.name===key)||previous.find(block=>block.functions.some(item=>item.id===id));blocks.set(key,{name:key,terms:old?.terms||[],emerging:old?.emerging||[],functions:[]});}
      blocks.get(key).functions.push({id,name:String(row[functionColumn]||'').replace(/\s+/g,' ').trim(),terms:existing.get(id)?.terms||[]});
    }
  }
  const result=[...blocks.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));validateTaxonomy_(result);
  if(!result.some(row=>row.name.startsWith('08.'))||!result.some(row=>row.name.startsWith('20.')))throw Error('Catálogo incompleto: faltan Financiación o Venta Digital.');
  // A review adds/updates catalog entries; missing rows require an explicit business edit.
  const ids=new Set(result.flatMap(block=>block.functions.map(row=>row.id)));
  for(const old of previous){const missing=old.functions.filter(row=>!ids.has(row.id));if(!missing.length)continue;let block=result.find(row=>row.name===old.name);if(!block){block={...old,functions:[]};result.push(block);}block.functions.push(...missing);}
  validateTaxonomy_(result);return result;
}
function refreshFunctionalCatalog_(){
  const config=configuration_();if(!config.settings.taxonomyCatalogRefresh)return {source:'excel',detail:'Catálogo de reglas de negocio; revisión de Drive desactivada.'};
  const started=Date.now();
  try{
    const id=config.settings.taxonomyCatalogUrl.match(/\/d\/([\w-]+)/)[1],book=SpreadsheetApp.openById(id),names=['Soluciones Funcionales','Capacidades canal (core y VD)'];
    const tables=names.map(name=>{const sheet=book.getSheetByName(name);if(!sheet||sheet.getLastRow()>1500)throw Error('Pestaña del catálogo ausente o fuera de límite: '+name);return sheet.getRange(1,1,sheet.getLastRow(),6).getDisplayValues();});
    const taxonomy=functionalCatalogRows_(tables,config.taxonomy),changed=JSON.stringify(taxonomy)!==JSON.stringify(config.taxonomy);
    if(changed){const sheet=book_().getSheetByName('Configuracion'),keys=sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat(),row=keys.indexOf('taxonomy');if(row<0)throw Error('Inicializa la configuración de taxonomía.');sheet.getRange(row+2,2,1,1).setValues([[JSON.stringify(taxonomy)]]);invalidateConfiguration_();}
    telemetry_('catalogo_funcional',Date.now()-started,'OK',changed?'Catálogo actualizado desde Drive':'Sin cambios en Drive');return {source:'drive',changed};
  }catch(error){const detail=String(error.message).slice(0,180);telemetry_('catalogo_funcional',Date.now()-started,'Error',detail);return {source:'reglas',error:detail};}
}
function taxonomyRulesRevision_(){return sha256_(JSON.stringify([TAXONOMY_POLICY.version,configuration_().taxonomy,classificationRulesRevision_()]));}
function saveTaxonomySource(payload){
  authorize_(true);const snapshot=JSON.parse(JSON.stringify(configuration_()));snapshot.settings.taxonomyCatalogUrl=payload.url;snapshot.settings.taxonomyCatalogRefresh=payload.refresh;return writeConfiguration_(snapshot,payload.revision);
}
