function validateTaxonomy_(blocks){
  if(!Array.isArray(blocks)||!blocks.length||blocks.length>60)throw Error('Define los bloques funcionales del catálogo.');
  const names=new Set(),ids=new Set();let count=0;
  for(const block of blocks){
    if(!block||!/^\d{2}\..{1,100}$/.test(block.name)||names.has(block.name)||!Array.isArray(block.functions)||!Array.isArray(block.terms)||!Array.isArray(block.emerging)||block.terms.length>80||block.emerging.length>20||block.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>100))throw Error('Bloque funcional no válido o duplicado.');
    names.add(block.name);
    const concepts=new Set();for(const concept of block.emerging){if(!concept||typeof concept.name!=='string'||!concept.name.trim()||concept.name.length>100||concepts.has(taxonomyText(concept.name))||!Array.isArray(concept.terms)||!concept.terms.length||concept.terms.length>24||concept.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>100)||('primary' in concept&&typeof concept.primary!=='boolean'))throw Error('Concepto emergente no válido.');concepts.add(taxonomyText(concept.name));}
    for(const row of [...block.functions,...block.emerging])for(const key of ['context','exclude','primaryTerms'])if(row[key]!==undefined&&(!Array.isArray(row[key])||row[key].length>24||row[key].some(term=>typeof term!=='string'||!term.trim()||term.length>200)))throw Error('Condición funcional no válida.');
    for(const row of block.functions){
      if(!row||!/^\d{2}\.\d{2}$/.test(row.id)||!row.id.startsWith(block.name.slice(0,3))||ids.has(row.id)||typeof row.name!=='string'||!row.name.trim()||row.name.length>200||!Array.isArray(row.terms)||row.terms.length>24||row.terms.some(term=>typeof term!=='string'||!term.trim()||term.length>200))throw Error('Funcionalidad no válida o duplicada: '+row?.id);
      if(row.description!==undefined&&(typeof row.description!=='string'||row.description.length>10000))throw Error('Descripción funcional no válida.');ids.add(row.id);count++;
    }
  }
  if(count>1000||JSON.stringify(functionalRuleSettings(blocks)).length>40000)throw Error('El catálogo funcional excede los límites de almacenamiento.');
}
function functionalCatalogRows_(sheets){
  const blocks=new Map();
  for(const rows of sheets){
    const header=rows.findIndex(row=>row.includes('Bloque funcional')&&row.includes('Funcionalidad/Sub Operativa'));
    if(header<0)throw Error('No se encuentran las columnas del catálogo funcional.');
    const columns=rows[header],idColumn=columns.indexOf('ID'),blockColumn=columns.indexOf('Bloque funcional'),functionColumn=columns.indexOf('Funcionalidad/Sub Operativa'),descriptionColumn=columns.indexOf('Descripción');
    for(const row of rows.slice(header+1)){
      const id=String(row[idColumn]||'').trim();if(!/^\d{2}\.\d{2}$/.test(id))continue;
      const name=String(row[blockColumn]||'').replace(/\s+/g,' ').trim(),label=id.slice(0,2)+'.'+name,key=[...blocks.keys()].find(key=>taxonomyText(key)===taxonomyText(label))||label;
      if(!blocks.has(key))blocks.set(key,{name:key,terms:[],emerging:[],functions:[]});
      blocks.get(key).functions.push({id,name:String(row[functionColumn]||'').replace(/\s+/g,' ').trim(),terms:[],description:descriptionColumn<0?'':String(row[descriptionColumn]||'').trim()});
    }
  }
  const result=[...blocks.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));validateTaxonomy_(result);
  if(!result.some(row=>row.name.startsWith('08.'))||!result.some(row=>row.name.startsWith('20.')))throw Error('Catálogo incompleto: faltan Financiación o Venta Digital.');
  return result;
}
let functionalCatalogMemory_;
function functionalCatalog_(){
 const revision=properties_().getProperty('FUNCTIONAL_CATALOG_REVISION')||'seed';if(functionalCatalogMemory_?.revision===revision)return functionalCatalogMemory_.items;
 const cache=CacheService.getScriptCache(),key='functional-catalog:'+revision,cached=readDashboardCache_(cache,key);let items=cached;
 if(!items){
  const sheet=book_().getSheetByName('CatalogoFuncional'),blocks=new Map();
  if(revision!=='seed'&&sheet?.getLastRow()>1)for(const [id,name,label,description] of sheet.getRange(2,1,sheet.getLastRow()-1,4).getDisplayValues()){if(!blocks.has(name))blocks.set(name,{name,functions:[]});blocks.get(name).functions.push({id,name:label,description});}
  items=blocks.size?[...blocks.values()]:FUNCTIONAL_CATALOG_SEED;writeDashboardCache_(cache,key,items);
 }functionalCatalogMemory_={revision,items};return items;
}
function functionalConfiguration_(config){return {...config,settings:{...CONFIGURATION_DEFAULTS.settings,...config.settings},taxonomy:functionalCatalogRules(functionalCatalog_(),config.taxonomy)};}
function functionalConfigurationSettings_(config){return {...config,taxonomy:functionalRuleSettings(config.taxonomy)};}
function writeFunctionalCatalog_(blocks){
 const descriptions=new Map(FUNCTIONAL_CATALOG_SEED.flatMap(block=>block.functions.map(row=>[row.id,row])));
 const catalogue=blocks.map(({name,functions})=>({name,functions:functions.map(({id,name,description})=>({id,name,description:description||(descriptions.get(id)?.name===name?descriptions.get(id).description:'')||''}))})),revision=sha256_(JSON.stringify(catalogue)),p=properties_();
 let sheet=book_().getSheetByName('CatalogoFuncional');if(revision===p.getProperty('FUNCTIONAL_CATALOG_REVISION')&&sheet?.getLastRow()>1)return false;
 if(!sheet){sheet=book_().insertSheet('CatalogoFuncional');sheet.getRange(1,1,1,4).setValues([RADAR.sheets.CatalogoFuncional]);sheet.setFrozenRows(1);}
 const rows=catalogue.flatMap(block=>block.functions.map(row=>[row.id,block.name,row.name,row.description])),count=sheet.getLastRow()-1;
 sheet.getRange(2,1,rows.length,4).setNumberFormat('@').setValues(rows);if(count>rows.length)sheet.getRange(rows.length+2,1,count-rows.length,4).clearContent();
 p.setProperty('FUNCTIONAL_CATALOG_REVISION',revision);p.setProperty('FUNCTIONAL_CATALOG_MODIFIED',new Date().toISOString());functionalCatalogMemory_={revision,items:catalogue};invalidateConfiguration_();return true;
}
function refreshFunctionalCatalog_(){
 const config=configuration_();if(!config.settings.taxonomyCatalogUrl)return {source:'espejo',detail:'Se utiliza el último espejo del catálogo.'};
 const started=Date.now();
 try{
  const id=config.settings.taxonomyCatalogUrl.match(/\/d\/([\w-]+)/)[1];if(id===properties_().getProperty('SPREADSHEET_ID'))throw Error('El maestro debe ser un documento distinto del libro de News Radar.');
  const book=SpreadsheetApp.openById(id),names=['Soluciones Funcionales','Capacidades canal (core y VD)'];
  const tables=names.map(name=>{const sheet=book.getSheetByName(name);if(!sheet||sheet.getLastRow()>1500)throw Error('Pestaña del catálogo ausente o fuera de límite: '+name);return sheet.getRange(1,1,sheet.getLastRow(),6).getDisplayValues();});
  const changed=writeFunctionalCatalog_(functionalCatalogRows_(tables));
  if(changed){requestNewsClassification_(true);requestDashboardSnapshots_(true);}
  properties_().setProperty('FUNCTIONAL_CATALOG_SYNCED',new Date().toISOString());properties_().deleteProperty('FUNCTIONAL_CATALOG_ERROR');telemetry_('catalogo_funcional',Date.now()-started,'OK',changed?'Espejo actualizado desde el maestro de Drive':'Sin cambios en el maestro de Drive');return {source:'drive',changed};
 }catch(error){const detail=String(error.message).slice(0,180);properties_().setProperty('FUNCTIONAL_CATALOG_ERROR',detail);telemetry_('catalogo_funcional',Date.now()-started,'Error',detail);return {source:'espejo',error:detail};}
}
function catalogSyncReadyAt_(){return properties_().getProperty('CATALOG_SYNC_REQUEST')?Math.max(Date.now(),Number(properties_().getProperty('CATALOG_SYNC_RETRY_AT')||0)):Infinity;}
function installFunctionalCatalogWatcher_(){
 const id=settings_().taxonomyCatalogUrl.match(/\/d\/([\w-]+)/)?.[1]||'',p=properties_(),triggers=scheduledTriggers_('functionalCatalogEdited_');
 if(id&&!p.getProperty('FUNCTIONAL_CATALOG_MODIFIED'))p.setProperty('FUNCTIONAL_CATALOG_MODIFIED',DriveApp.getFileById(id).getLastUpdated().toISOString());
 if(p.getProperty('FUNCTIONAL_CATALOG_TRIGGER_SOURCE')===id&&triggers.length===(id?1:0))return;
 triggers.forEach(trigger=>ScriptApp.deleteTrigger(trigger));
 if(id){ScriptApp.newTrigger('functionalCatalogEdited_').forSpreadsheet(id).onEdit().create();}
 p.setProperty('FUNCTIONAL_CATALOG_TRIGGER_SOURCE',id);
}
function functionalCatalogEdited_(event){
 const range=event?.range;if(!range||!['Soluciones Funcionales','Capacidades canal (core y VD)'].includes(range.getSheet().getName()))return;
 const sheet=range.getSheet(),headers=sheet.getRange(1,1,Math.min(20,sheet.getLastRow()),6).getDisplayValues(),header=headers.findIndex(row=>row.includes('Bloque funcional')&&row.includes('Funcionalidad/Sub Operativa')),columns=headers[header]||[],used=['ID','Bloque funcional','Funcionalidad/Sub Operativa','Descripción'].map(name=>columns.indexOf(name)+1).filter(Boolean);
 if(header>=0&&range.getRow()>header+1&&!used.some(column=>column>=range.getColumn()&&column<range.getColumn()+range.getNumColumns()))return;
 const modified=new Date().toISOString();properties_().setProperty('FUNCTIONAL_CATALOG_MODIFIED',modified);properties_().setProperty('CATALOG_SYNC_REQUEST',modified);properties_().deleteProperty('CATALOG_SYNC_RETRY_AT');ensureBackgroundWorker_();
}
function taxonomyRulesRevision_(){return sha256_(JSON.stringify([TAXONOMY_POLICY.version,'business',configuration_().taxonomy,classificationRulesRevision_()]));}
