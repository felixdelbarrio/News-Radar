function doGet(event={}) {
 authorize_();const template=HtmlService.createTemplateFromFile('Index'),params=event.parameter||{},view=readingViews.includes(params.view)?params.view:'briefing';let bootstrap=null;
 if(!params.edition&&view!=='news')try{const query={view,language:'es',initial:true};bootstrap={query,data:getDashboard(query)};}catch(error){console.warn('Carga inicial: '+error.message);}
 template.bootstrap=JSON.stringify(bootstrap).replace(/</g,'\\u003c');
 return template.evaluate().setTitle('News Radar · BBVA Empresas').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function include_(name) {
  if(!['Tokens','Styles','Client'].includes(name))throw new Error('Fragmento desconocido.');
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
