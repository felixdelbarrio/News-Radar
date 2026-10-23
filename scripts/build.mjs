import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {root,read,files,readClientScript,serverModule,serverModuleName} from './source.mjs';
import {identityAssets} from './identity.mjs';
import {worldMap} from './world-map.mjs';
import {designOutputs} from './design.mjs';
import {checkAppsScriptSyntax} from './apps-script-syntax.mjs';
import {newsletterInlineStyles} from './newsletter-inline.mjs';

const dist=path.join(root,'dist');
const version=vm.runInNewContext(read('src/server/config/Config.gs')+';RADAR.version');
const asset=(file,type)=>'data:'+type+';base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
const navigation=JSON.parse(read('assets/app-config.json'));
const administrationTabs=Object.entries(navigation.adminViews).map(([view,label],index)=>`<button type="button" role="tab" id="admin-tab-${view}" aria-selected="${index===0}" aria-controls="${view}-section" tabindex="${index===0?0:-1}" data-admin-view="${view}">${label}</button>`).join('');
const parts={AdministrationTabs:administrationTabs,WorldMap:worldMap(),BbvaLogo:asset('bbva-logo.png','image/png'),BiaLogo:asset('bia.svg','image/svg+xml'),ReleaseVersion:version};
for(const file of files('assets/icons'))parts['Icon'+path.basename(file,'.svg').split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join('')]=read(file).replace('<svg ','<svg class="icon" aria-hidden="true" focusable="false" ');
const views=files('src/views').filter(file=>file.endsWith('.html'));
for(const file of views)parts[path.basename(file,'.html')]=read(file);
function template(html){return html.replace(/\{\{(\w+)\}\}/g,(_,name)=>{if(!(name in parts))throw Error('Bloque desconocido: '+name);return template(String(parts[name]));});}
const design=designOutputs(),tokens=JSON.parse(read('src/design/tokens.json')).css;
const newsletterStyle=(read('src/styles/identity.css')+'\n'+read('src/styles/newsletter.css')).replace(/var\(--([\w-]+)\)/g,(_,key)=>tokens[key]);
const newsletterInline=newsletterInlineStyles(newsletterStyle);
const output={
  'Defaults.gs':'const APPLICATION_NAVIGATION = Object.freeze('+JSON.stringify(navigation)+');\nconst FUNCTIONAL_CATALOG_SEED = Object.freeze('+read('assets/functional-catalogue.json').trim()+');\nconst CONFIGURATION_VOCABULARY_UPDATE = Object.freeze('+read('assets/vocabulary-update.json').trim()+');\nconst CONFIGURATION_DEFAULTS = '+read('assets/configuration-defaults.json').trim()+';\nCONFIGURATION_DEFAULTS.taxonomy=functionalCatalogRules(FUNCTIONAL_CATALOG_SEED,CONFIGURATION_DEFAULTS.taxonomy);Object.freeze(CONFIGURATION_DEFAULTS);\naddVocabularyTerms_(CONFIGURATION_DEFAULTS);\n',
  'Design.gs':design.sheet,
  'IdentityAssets.gs':'const IDENTITY_ASSETS = Object.freeze('+JSON.stringify(identityAssets())+');\n',
  'Newsletter.gs':'const NEWSLETTER_BIA_PNG = '+JSON.stringify(fs.readFileSync(path.join(root,'assets/bia.png')).toString('base64'))+';\nconst NEWSLETTER_STYLE = '+JSON.stringify(newsletterStyle)+';\nconst NEWSLETTER_INLINE = '+JSON.stringify(newsletterInline)+';\n',
  'Index.html':template(parts.Index),
  'Tokens.html':design.tokens,
  'Styles.html':'<style>\n'+['base','layout','components','identity','dashboard','briefing','intelligence','responsive','administration'].map(name=>read('src/styles/'+name+'.css')).join('\n')+'\n</style>',
  'Client.html':'<script id="radar-client">\n'+readClientScript()+'</script>',
  'appsscript.json':read('src/appsscript.json')
};
for(const file of files('src/shared'))output[serverModuleName(file)]=serverModule(read(file));
for(const file of files('src/server')){
  const name=path.basename(file);if(name in output)throw Error('Nombre de módulo duplicado: '+name);output[name]=read(file);
}
for(const [name,source] of Object.entries(output))if(name.endsWith('.gs'))checkAppsScriptSyntax(source,name);
new vm.Script(Object.entries(output).filter(([name])=>name.endsWith('.gs')).map(([,code])=>code).join('\n'));
if(process.argv.includes('--check')){
  const stored=fs.existsSync(dist)?files('dist').map(file=>path.relative('dist',file)):[],expected=Object.keys(output);
  const changed=[...new Set([...stored,...expected])].filter(name=>!(name in output)||!fs.existsSync(path.join(dist,name))||fs.readFileSync(path.join(dist,name),'utf8')!==output[name]);
  if(changed.length)throw Error('Distribución desactualizada: '+changed.join(', ')+'. Ejecuta make build e incluye dist/ en el commit.');
  console.log('Distribución reproducible y actualizada · release '+version+'.');
}else{
  fs.mkdirSync(dist,{recursive:true});
  for(const file of fs.readdirSync(dist))fs.unlinkSync(path.join(dist,file));
  for(const [name,content] of Object.entries(output))fs.writeFileSync(path.join(dist,name),content);
  console.log('Paquete modular generado: '+Object.keys(output).length+' archivos en dist/ · release '+version+'.');
}
