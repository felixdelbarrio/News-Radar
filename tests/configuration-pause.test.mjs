import test from 'node:test';
import assert from 'node:assert/strict';
import {storage} from './helpers/server.mjs';

function fixture(){
 const s=storage();s.c.initializeConfiguration();s.c.configurationWake_();
 return s;
}
function lockProbe(s,{available=true,userAvailable=true}={}){
 const events=[];s.c.LockService={
  getUserLock:()=>({tryLock:()=>userAvailable,releaseLock:()=>events.push('user released')}),
  getScriptLock:()=>({tryLock:wait=>{events.push({wait,paused:s.c.configurationPaused_()});return available;},releaseLock:()=>events.push('script released')})
 };return events;
}
test('configuration announces pause before waiting and resumes after releasing the lock',()=>{
 const s=fixture(),events=lockProbe(s);s.c.deferConfigurationWork_('background');
 const result=s.c.withConfigurationPause_(()=>{assert.equal(s.c.configurationPaused_(),true);return 'saved';});
 assert.equal(result,'saved');assert.deepEqual(events,[{wait:60000,paused:true},'script released','user released']);
 assert.equal(s.c.configurationPaused_(true),false);
 assert.equal(s.c.configurationPaused_(),false);assert.equal(s.properties['CONFIGURATION_PENDING:background'],'true');
 const wake=s.c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='configurationWake_');assert.equal(wake.length,1);assert.equal(wake[0].delay,60000);
});
test('failed configuration releases both locks and retains queued work',()=>{
 const s=fixture(),events=lockProbe(s);s.c.deferConfigurationWork_('taxonomy');
 assert.throws(()=>s.c.withConfigurationPause_(()=>{throw Error('Write failed');}),/Write failed/);
 assert.equal(s.c.configurationPaused_(),false);assert.equal(s.properties['CONFIGURATION_PENDING:taxonomy'],'true');
 assert.deepEqual(events.slice(1),['script released','user released']);
});
test('lock timeout restores scheduling without executing configuration',()=>{
 const s=fixture(),events=lockProbe(s,{available:false});let called=false;s.c.deferConfigurationWork_('background');
 assert.throws(()=>s.c.withConfigurationPause_(()=>{called=true;}),/aún no ha liberado/);
 assert.equal(called,false);assert.equal(s.c.configurationPaused_(),false);assert.deepEqual(events,[{wait:60000,paused:true},'user released']);
 assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='configurationWake_'));
});
test('second configuration cannot clear the active configuration pause',()=>{
 const s=fixture();s.properties.CONFIGURATION_PAUSED_UNTIL=String(Date.now()+600000);lockProbe(s,{userAvailable:false});
 assert.throws(()=>s.c.withConfigurationPause_(()=>{}),/Ya hay una configuración/);assert.equal(s.c.configurationPaused_(),true);
});
test('scheduled work defers before reading configuration or acquiring locks',()=>{
 const s=storage();s.properties.CONFIGURATION_PAUSED_UNTIL=String(Date.now()+600000);
 s.c.settings_=()=>{throw Error('Configuration unavailable');};s.c.LockService.getScriptLock=()=>{throw Error('Must not lock');};
 assert.equal(s.c.processBackground_().paused,true);assert.equal(s.c.deliverNewsletters_().state,'configuration_pause');
 s.c.scheduledCollection_('daily');s.c.scheduledCollection_('projectFinance');s.c.dailyClassification_();s.c.dailyTaxonomy_();
 for(const name of ['background','newsletter','daily','projectFinance','classification','taxonomy'])assert.equal(s.properties['CONFIGURATION_PENDING:'+name],'true');
});
test('watchdog waits for active configuration and retries a busy lock',()=>{
 const s=fixture();s.c.deferConfigurationWork_('background');s.properties.CONFIGURATION_PAUSED_UNTIL=String(Date.now()+600000);
 s.c.configurationWake_();assert.equal(s.properties['CONFIGURATION_PENDING:background'],'true');
 s.properties.CONFIGURATION_PAUSED_UNTIL='1';lockProbe(s,{available:false});s.c.configurationWake_();assert.equal(s.properties['CONFIGURATION_PENDING:background'],'true');
 assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='configurationWake_'));
});
test('expired pause restores a consumed worker trigger and preserves quota pauses and cursor',()=>{
 const s=fixture();s.properties.CONFIGURATION_PAUSED_UNTIL='1';s.properties.FETCH_PAUSED_UNTIL=String(Date.now()+86400000);s.properties.TRANSLATION_CURSOR='retained';
 s.properties.BACKGROUND_NEXT='1';s.c.deferConfigurationWork_('background');
 s.c.ScriptApp.newTrigger('backgroundTick_').timeBased().after(60000).create();s.c.configurationWake_();
 assert.equal(s.properties.CONFIGURATION_PAUSED_UNTIL,undefined);assert.equal(s.properties['CONFIGURATION_PENDING:background'],undefined);
 assert.equal(s.properties.TRANSLATION_CURSOR,'retained');assert.ok(Number(s.properties.FETCH_PAUSED_UNTIL)>Date.now());
 const workers=s.c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='backgroundTick_');assert.equal(workers.length,1);assert.ok(Number(s.properties.BACKGROUND_NEXT)>Date.now());
 assert.equal(s.c.ScriptApp.getProjectTriggers().filter(t=>t.handler==='configurationWake_').length,0);
});
test('resume failure retains its request for retry',()=>{
 const s=fixture();s.c.deferConfigurationWork_('daily');s.c.queueScheduledCollection_=()=>{throw Error('Unavailable');};
 assert.throws(()=>s.c.configurationWake_(),/Unavailable/);assert.equal(s.properties['CONFIGURATION_PENDING:daily'],'true');
 assert.ok(s.c.ScriptApp.getProjectTriggers().some(t=>t.handler==='configurationWake_'));
});

test('row checkpoints poll properties once a second while entry points always refresh',()=>{
 const s=fixture(),service=s.c.PropertiesService.getScriptProperties();let reads=0;
 s.c.PropertiesService.getScriptProperties=()=>({...service,getProperty:key=>{reads++;return service.getProperty(key);}});
 s.c.configurationPaused_();for(let i=0;i<100;i++)s.c.configurationPaused_(true);assert.equal(reads,1);
 s.properties.CONFIGURATION_PAUSED_UNTIL=String(Date.now()+600000);assert.equal(s.c.configurationPaused_(),true);assert.equal(reads,2);
});

test('manual newsletter tests cannot start while configuration holds the pause',()=>{
 const s=fixture();s.properties.CONFIGURATION_PAUSED_UNTIL=String(Date.now()+600000);
 s.c.LockService.getScriptLock=()=>{throw Error('Must not acquire');};assert.throws(()=>s.c.sendNewsletterTest(),/configuración está en curso/);
});
