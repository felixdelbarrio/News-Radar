import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createPreviewServer} from '../scripts/preview.mjs';

test('servidor local entrega la WebApp autónoma y limita rutas y métodos',async t=>{
  const server=createPreviewServer();
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const url='http://127.0.0.1:'+server.address().port;
  const response=await fetch(url);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/News Radar/);
  assert.match(html,/window.RADAR_PREVIEW/);
  assert.match(html,/data:image\/svg\+xml;base64,/);
  assert.match(html,/data:font\/woff2;base64,/);
  assert.doesNotMatch(html,/\{\{\w+\}\}/);
  assert.equal((await fetch(url+'/src/server/config/Config.gs')).status,404);
  assert.equal((await fetch(url,{method:'POST'})).status,405);
  assert.equal(await (await fetch(url,{method:'HEAD'})).text(),'');
});

test('vista autónoma comparte filtros, normalización de entidades y CSV con Apps Script',async()=>{
  const {default:fs}=await import('node:fs');const {default:vm}=await import('node:vm');
  const html=fs.readFileSync('output/preview.html','utf8');const adapter=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(match=>match[1].includes('window.RADAR_PREVIEW='))[1];
  const c=vm.createContext({window:{}});vm.runInContext(adapter,c);const preview=c.window.RADAR_PREVIEW;
  const all=await preview.call('getDashboard'),filtered=await preview.call('getDashboard',{search:'BBVA',entity:'BBVA',source:all.sources[0]});
  assert.ok(filtered.total>0);assert.ok(filtered.total<all.total);assert.equal((await preview.call('exportNews',{search:'BBVA',entity:'BBVA',source:all.sources[0]})).count,filtered.total);
  const empty=await preview.call('getDashboard',{entity:'Santander',country:'México'});assert.equal(empty.total,0);assert.ok(empty.entities.includes('Santander'));assert.equal(empty.countries.length,0);
});

test('vista local registra actividad real de la sesión y bloquea el correo remoto',async()=>{
 const fs=await import('node:fs'),vm=await import('node:vm');const html=fs.readFileSync('output/preview.html','utf8'),adapter=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(match=>match[1].includes('window.RADAR_PREVIEW='))[1].replace('admin=false','admin=true');
 const c=vm.createContext({window:{}});vm.runInContext(adapter,c);const preview=c.window.RADAR_PREVIEW;assert.equal((await preview.call('getAdoption')).events,0);
 await preview.call('recordEvents',[{session:'local-session',event:'rendimiento',view:'radar',duration:120}]);const activity=await preview.call('getAdoption');assert.equal(activity.events,1);assert.equal(activity.dau,1);assert.equal((await preview.call('getTelemetry')).latencyP95,120);assert.equal((await preview.call('getAudit')).total,0);
 await assert.rejects(preview.call('sendNewsletterTest'),/no envía correos/);
});

test('make kill usa IPC local protegido y cierra solo el servidor registrado',async t=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path'),net=await import('node:net');
 const {registerServer,killServer}=await import('../scripts/local-server.mjs');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'radar-')),file=path.join(directory,'server.sock'),server=createPreviewServer();
 t.after(()=>{server.close();fs.rmSync(directory,{recursive:true,force:true});});
 server.listen(0,'127.0.0.1');await once(server,'listening');await registerServer(server,file);
 assert.equal(fs.statSync(file).mode&0o777,0o600);
 const client=net.createConnection({path:file});await once(client,'connect');client.end('invalid');await once(client,'close');
 assert.equal((await fetch('http://127.0.0.1:'+server.address().port)).status,200);
 const closed=once(server,'close');assert.equal(await killServer(file),true);await closed;
 assert.equal(fs.existsSync(file),false);assert.equal(await killServer(file),false);
});

test('la vista local configura períodos y asuntos traducidos y personaliza sin trasladar fechas entre vistas',async()=>{
 const fs=await import('node:fs'),vm=await import('node:vm'),html=fs.readFileSync('output/preview.html','utf8'),adapter=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(match=>match[1].includes('window.RADAR_PREVIEW='))[1];
 const c=vm.createContext({window:{}});vm.runInContext(adapter,c);const preview=c.window.RADAR_PREVIEW;
 await preview.call('saveSubscription',{name:'Nombre ignorado',language:'en',periodicity:'yearly',filters:{entity:'Santander'}});await preview.call('saveSubscription',{language:'tr',periodicity:'fortnightly',filters:{entity:'BBVA'}});
 const subscriptions=await preview.call('getSubscriptions');assert.match(subscriptions[0].nombre,/^\[bIA\] Entity: Santander/);assert.doesNotMatch(subscriptions[0].nombre,/ignorado/);assert.equal(subscriptions[1].periodicidad,'fortnightly');
 const {newsletterWindow,newsletterCadences}=await import('../src/shared/newsletter-cadences.js');
 for(const [cadence,{view}] of Object.entries(newsletterCadences)){const data=await preview.call('getDashboard',{view,initial:true}),period=newsletterWindow(cadence,new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Madrid'}));assert.equal(data.selection.from,period.from);assert.equal(data.selection.to,period.to);assert.equal(data.selection.entity,'Santander');assert.equal(data.personalization,undefined);assert.equal(data.context.mode,'current');}
 const options=await preview.call('getNewsletterOptions');assert.equal(options.defaults.name,undefined);assert.equal(options.defaults.filters.range,undefined);
});
