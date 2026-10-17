import fs from 'node:fs';
import {functionalCatalogRules} from '../src/shared/functional-catalogue.js';
export function configurationDefaults(){
 const config=JSON.parse(fs.readFileSync(new URL('../assets/configuration-defaults.json',import.meta.url))),catalogue=JSON.parse(fs.readFileSync(new URL('../assets/functional-catalogue.json',import.meta.url)));
 return {...config,taxonomy:functionalCatalogRules(catalogue,config.taxonomy)};
}
