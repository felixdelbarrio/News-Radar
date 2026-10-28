function doGet(event={}) {
 authorize_();const template=HtmlService.createTemplateFromFile('Index'),params=event.parameter||{},view=readingViews.includes(params.view)?params.view:'briefing';let bootstrap=null;
 if(!params.edition&&view!=='news')try{const query={view,language:'es',initial:true};bootstrap={query,data:getDashboard(query)};}catch(error){console.warn('Carga inicial: '+error.message);}
 template.bootstrap=JSON.stringify(bootstrap).replace(/</g,'\\u003c');
 return template.evaluate().setTitle('News Radar · BBVA Empresas').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function include_(name) {
  if(!['Tokens','Styles','Client'].includes(name))throw new Error('Fragmento desconocido.');
  const content=HtmlService.createHtmlOutputFromFile(name).getContent();
  if(name!=='Styles')return content;
  const images=new Map(),styles=[];
  if(newsletterVisualAsset_('link-icon',images))styles.push(':root{--official-link-icon:url("data:image/png;base64,'+images.get('link-icon').data+'")}.link-icon{display:inline-block}');
  for(const value of ['positive','negative']){const asset='feedback-'+value;if(newsletterVisualAsset_(asset,images))styles.push('[data-rating-icon="'+value+'"]{background-image:url("data:image/png;base64,'+images.get(asset).data+'");font-size:0;width:var(--space-4);height:var(--space-4)}');}
  return content+(styles.length?'<style>'+styles.join('')+'</style>':'');
}
