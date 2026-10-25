let scriptPropertiesMemory_,scriptPropertiesDepth_=0;
function refreshScriptProperties_(){if(scriptPropertiesDepth_)scriptPropertiesMemory_=PropertiesService.getScriptProperties().getProperties();}
function withScriptProperties_(operation){
 const outer=scriptPropertiesDepth_++===0;if(outer)refreshScriptProperties_();
 try{return operation();}finally{if(--scriptPropertiesDepth_===0)scriptPropertiesMemory_=undefined;}
}
function properties_(){
 const store=PropertiesService.getScriptProperties();if(!scriptPropertiesDepth_)return store;
 return {getProperty:key=>scriptPropertiesMemory_[key]??null,getProperties:()=>({...scriptPropertiesMemory_}),
 setProperty(key,value){store.setProperty(key,String(value));scriptPropertiesMemory_[key]=String(value);return this;},
 setProperties(values,remove=false){store.setProperties(values,remove);if(remove)scriptPropertiesMemory_={};Object.assign(scriptPropertiesMemory_,Object.fromEntries(Object.entries(values).map(([key,value])=>[key,String(value)])));return this;},
 deleteProperty(key){store.deleteProperty(key);delete scriptPropertiesMemory_[key];return this;}};
}
function authorize_(admin) {
  const owner=properties_().getProperty('OWNER_EMAIL'),email=Session.getActiveUser().getEmail().trim().toLowerCase();
  if(!owner)throw new Error('Ejecuta setupRadar desde el editor de Apps Script.');
  if(!email || !email.endsWith('@bbva.com'))throw new Error('Accede con tu cuenta bbva.com. Google debe facilitar la identidad del usuario dentro del dominio.');
  const session={email,admin:email===owner};
  if(admin && !session.admin)throw new Error('Acceso no autorizado: se requiere administrador.');
  return session;
}
