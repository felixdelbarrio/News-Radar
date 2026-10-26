import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {storage} from './helpers/server.mjs';
function server(){const s=storage();s.c.initializeConfiguration();return s;}
test('country priority is headline, article domain, queried RSS country, headquarters',()=>{
 const {c}=server(),base={titular:'Nueva plataforma bancaria',entidad:'BBVA',fuente:'BBVA · México',url:'https://news.google.com/articles/a'};
 assert.equal(c.newsCountry_({...base,titular:'BBVA presenta pagos en Colombia',sourceUrl:'https://editor.es/story'}),'Colombia');
 assert.equal(c.newsCountry_({...base,sourceUrl:'https://editor.co/story'}),'Colombia');
 assert.equal(c.newsCountry_(base),'México');
 assert.equal(c.newsCountry_({...base,fuente:'',entidad:'Revolut'}),'Reino Unido');
 assert.equal(c.domainCountry_('https://bank.co.uk/a'),'Reino Unido');
 assert.equal(c.domainCountry_('https://t.co/a'),'');
});
test('Santander rejects municipal and ambiguous context but accepts bank identity',()=>{const {c}=server();for(const text of ['ayuntamiento de santander permite pagos','gobernador de santander denuncia extorsion','pagos digitales en santander','santander presenta pagos empresariales'])assert.equal(c.santanderExcluded_(text),true);for(const text of ['banco santander lanza pagos','santander empresas lanza una app','banco de santander presenta plataforma'])assert.equal(c.santanderExcluded_(text),false);});
test('semantic duplicates ignore country publisher and aliases but preserve numbers',()=>{const {c}=server();const item={entity:'Santander Empresas',publisher:'Portafolio',title:'Santander lanza nueva plataforma digital pagos internacionales empresas clientes',date:'2026-10-01'},known={titles:new Map()};c.rememberTitle_(known,item);assert.equal(c.duplicateTitle_(known,{...item,entity:'Santander',publisher:'El Tiempo',country:'México',title:'Santander presenta nueva plataforma digital pagos internacionales empresas clientes',date:'2026-10-14'}),true);assert.equal(c.duplicateTitle_(known,{...item,date:'2026-10-16'}),false);assert.equal(c.equivalentEditorialTitle_(['pagos','digitales','empresas','nuevos','clientes','100'],['pagos','digitales','empresas','nuevos','clientes','200']),false);});
test('log append conserva filas hasta tener archivo verificado',()=>{const s=server(),keys=vm.runInContext('RADAR.sheets.Telemetria',s.c),sheet=s.sheets.get('Telemetria');sheet.grid.length=1;for(let i=0;i<3001;i++)Array.prototype.push.call(sheet.grid,keys.map(()=>String(i)));s.c.append_('Telemetria',[keys.map(()=> 'new')]);assert.equal(sheet.getLastRow()-1,3002);assert.equal(sheet.grid[1][0],'0');assert.equal(s.properties.LOG_ARCHIVE_PENDING,'true');});
