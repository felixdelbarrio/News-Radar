// A delivery date after the availability grace period, independent of the host calendar.
export class TestDate extends globalThis.Date{
 constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00Z']));}
 static now(){return new globalThis.Date('2026-10-15T12:00:00Z').getTime();}
}

// Simulate a view consuming the entire cooperative slice, preserving partial-publication coverage.
export function limitSnapshotBatch(c){
 const batch=c.dashboardSnapshotBatch_;
 c.dashboardSnapshotBatch_=function(...args){
  const Base=c.Date||Date,get=c.PropertiesService.getScriptProperties;let elapsed=0;
  c.Date=class extends Base{static now(){return Base.now()+elapsed;}};
  c.PropertiesService.getScriptProperties=()=>{const p=get();return {...p,setProperty(key,value){const result=p.setProperty(key,value);if(key==='DASHBOARD_SNAPSHOT_BUILD')elapsed+=20001;return result;}};};
  try{return batch(...args);}finally{c.Date=Base;c.PropertiesService.getScriptProperties=get;}
 };
}
