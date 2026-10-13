import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';

function fixture(){
 const s=storage();s.c.initializeConfiguration();s.c.workWake_();
 return s;
}
function lockProbe(s,{available=true}={}){
 const events=[];s.c.LockService={
  getScriptLock:()=>({tryLock:wait=>{events.push({wait,paused:s.c.backgroundPaused_()});return available;},releaseLock:()=>events.push('script released')})
 };return events;
}
test('configuration announces pause before waiting and resumes after releasing the lock',()=>{
 const s=fixture(),events=lockProbe(s);s.c.deferBackgroundWork_('background');
 const result=s.c.withForegroundWrite_(()=>{assert.equal(s.c.backgroundPaused_(),true);return 'saved';});
 assert.equal(result,'saved');assert.deepEqual(events,[{wait:60000,paused:true},'script released']);
 assert.equal(s.c.backgroundPaused_(true),false);
 assert.equal(s.c.backgroundPaused_(),false);assert.equal(s.properties['WORK_PENDING:background'],'true');
 const wake=s.c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='workWake_');assert.equal(wake.length,1);assert.equal(wake[0].delay,60000);
});
test('failed configuration releases the lock and retains queued work',()=>{
 const s=fixture(),events=lockProbe(s);s.c.deferBackgroundWork_('taxonomy');
 assert.throws(()=>s.c.withForegroundWrite_(()=>{throw Error('Write failed');}),/Write failed/);
 assert.equal(s.c.backgroundPaused_(),false);assert.equal(s.properties['WORK_PENDING:taxonomy'],'true');
 assert.deepEqual(events.slice(1),['script released']);
});
test('lock timeout restores scheduling without executing configuration',()=>{
 const s=fixture(),events=lockProbe(s,{available:false});let called=false;s.c.deferBackgroundWork_('background');
 assert.throws(()=>s.c.withForegroundWrite_(()=>{called=true;}),/aún no ha liberado/);
 assert.equal(called,false);assert.equal(s.c.backgroundPaused_(),false);assert.deepEqual(events,[{wait:60000,paused:true}]);
 assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='workWake_'));
});
test('second configuration cannot clear the active configuration pause',()=>{
 const s=fixture();s.properties['WORK_INTENT:test']=String(Date.now()+600000);lockProbe(s);
 s.c.withForegroundWrite_(()=>{assert.equal(s.c.backgroundPaused_(),true);});assert.equal(s.c.backgroundPaused_(),true);
});
test('scheduled work defers before reading configuration or acquiring locks',()=>{
 const s=storage();s.properties['WORK_INTENT:test']=String(Date.now()+600000);
 s.c.settings_=()=>{throw Error('Configuration unavailable');};s.c.LockService.getScriptLock=()=>{throw Error('Must not lock');};
 assert.equal(s.c.processBackground_().paused,true);assert.equal(s.c.deliverNewsletters_().state,'configuration_pause');
 s.c.scheduledCollection_('daily');s.c.scheduledCollection_('projectFinance');s.c.dailyClassification_();s.c.dailyTaxonomy_();
 for(const name of ['background','newsletter','daily','projectFinance','classification','taxonomy'])assert.equal(s.properties['WORK_PENDING:'+name],'true');
});
test('watchdog waits for active configuration and retries a busy lock',()=>{
 const s=fixture();s.c.deferBackgroundWork_('background');s.properties['WORK_INTENT:test']=String(Date.now()+600000);
 s.c.workWake_();assert.equal(s.properties['WORK_PENDING:background'],'true');
 s.properties['WORK_INTENT:test']='1';lockProbe(s,{available:false});s.c.workWake_();assert.equal(s.properties['WORK_PENDING:background'],'true');
 assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='workWake_'));
});
test('expired pause restores a consumed worker trigger and preserves quota pauses and cursor',()=>{
 const s=fixture();s.properties['WORK_INTENT:test']='1';s.properties.FETCH_PAUSED_UNTIL=String(Date.now()+86400000);s.properties.TRANSLATION_CURSOR='retained';
 s.properties.BACKGROUND_NEXT='1';s.c.deferBackgroundWork_('background');
 s.c.ScriptApp.newTrigger('backgroundTick_').timeBased().after(60000).create();s.c.workWake_();
 assert.equal(s.properties['WORK_INTENT:test'],undefined);assert.equal(s.properties['WORK_PENDING:background'],undefined);
 assert.equal(s.properties.TRANSLATION_CURSOR,'retained');assert.ok(Number(s.properties.FETCH_PAUSED_UNTIL)>Date.now());
 const workers=s.c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='backgroundTick_');assert.equal(workers.length,1);assert.ok(Number(s.properties.BACKGROUND_NEXT)>Date.now());
 assert.equal(s.c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='workWake_').length,0);
});
test('resume failure retains its request for retry',()=>{
 const s=fixture();s.c.deferBackgroundWork_('daily');s.c.queueScheduledCollection_=()=>{throw Error('Unavailable');};
 assert.throws(()=>s.c.workWake_(),/Unavailable/);assert.equal(s.properties['WORK_PENDING:daily'],'true');
 assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='workWake_'));
});

test('row checkpoints poll properties once a second while entry points always refresh',()=>{
 const s=fixture(),service=s.c.PropertiesService.getScriptProperties();let reads=0;
 s.c.PropertiesService.getScriptProperties=()=>({...service,getProperties:()=>{reads++;return service.getProperties();}});
 s.c.backgroundPaused_();for(let i=0;i<100;i++)s.c.backgroundPaused_(true);assert.equal(reads,1);
 s.properties['WORK_INTENT:test']=String(Date.now()+600000);assert.equal(s.c.backgroundPaused_(),true);assert.equal(reads,2);
});

test('manual newsletter tests cannot start while configuration holds the pause',()=>{
 const s=fixture();s.properties['WORK_INTENT:test']=String(Date.now()+600000);
 s.c.LockService.getScriptLock=()=>{throw Error('Must not acquire');};assert.throws(()=>s.c.sendNewsletterTest(),/configuración está en curso/);
});
