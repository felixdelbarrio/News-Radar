import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/delivery.mjs';
import {TestDate} from './helpers/clock.mjs';

for(const country of ['México','España'])for(const cadence of ['fortnightly','quarterly'])for(const local of [true,false])for(const minTier of [1,2,3,4])test(`delivery preserves international evidence: ${country}, ${cadence}, local=${local}, minTier=${minTier}`,()=>{
 const s=storage(),{c}=s;c.Date=TestDate;c.initializeConfiguration();
 for(const [name,keys] of Object.entries(vm.runInContext('RADAR.sheets',c)))if(!s.sheets.has(name))s.book.insertSheet(name).grid.push([...keys]);
 c.configuration_().settings.newsletterEnabled=true;
 c.saveAdminSubscription({email:'review@bbva.com',periodicity:cadence,country});
 for(const row of s.sheets.get('Suscripciones').grid.slice(1)){row[6]='2000-01-01';row[4]=cadence;}
 const countries=country==='México'?['México','Colombia','España','Estados Unidos','India']:['España','Turquía','México','Italia','India'];
 const period=c.newsletterPeriod_(cadence,new TestDate()),keys=vm.runInContext('RADAR.sheets.Noticias',c);
 const rows=countries.map((pais,i)=>({id:'geo-'+i,fecha:period.to,pais,entidad:'BBVA',medio:'Editor',titular:'BBVA lanza plataforma digital de pagos para empresas en '+pais,extracto:'Nueva plataforma de pagos digitales para clientes empresariales en '+pais,url:'https://example.com/geo-'+i,clasificacion:JSON.stringify({digital:true,capacidades:['Empresas: Pagos']})})).filter((_,i)=>i===0?local:i>=minTier);
 s.sheets.get('Noticias').grid.push(...rows.map(row=>keys.map(key=>row[key]||'')));
 let captured;c.newsletterSender_=()=>({});c.sendNewsletterMail_=(_sender,_email,content)=>{captured=content;return 'mock-accepted';};
 const result=c.deliverNewsletterBatch_();assert.equal(result.accepted,1);assert.ok(captured);
 const digest=captured.editorial;assert.ok(digest.globalCount===5-minTier);assert.equal(digest.localCount,local?1:0);
 const cards=Array.from(digest.cards);assert.ok(cards.some(card=>card.scope==='global'&&card.country===countries[minTier]&&card.tier===minTier));
 if(local)assert.ok(cards.some(card=>card.scope==='local'&&card.country===country));else assert.ok(cards.every(card=>card.scope==='global'));
 assert.equal(c.rows_('NewsletterEnvios').filter(row=>row.estado==='Enviada').length,1);
 assert.equal(c.deliverNewsletterBatch_().accepted,0);
});
