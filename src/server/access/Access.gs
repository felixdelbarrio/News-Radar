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
const corporateEmailDomains_=['bbva.com','garantibbva.com.tr'];
function corporateEmail_(value){
 const email=String(value??'').trim().toLowerCase(),at=email.indexOf('@');
 return at>0&&corporateEmailDomains_.includes(email.slice(at+1))&&/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(email.slice(0,at))?email:'';
}
function authorize_(admin) {
  const owner=properties_().getProperty('OWNER_EMAIL'),email=corporateEmail_(Session.getActiveUser().getEmail());
  if(!owner)throw new Error('Ejecuta setupRadar desde el editor de Apps Script.');
  if(!email)throw new Error('Accede con una cuenta corporativa autorizada. Google debe verificar tu identidad.');
  const session={email,admin:email===owner};
  if(admin && !session.admin)throw new Error('Acceso no autorizado: se requiere administrador.');
  return session;
}
