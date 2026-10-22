import fs from 'node:fs';
import {storage as original} from './server.mjs';
import {readServerScript} from '../../scripts/source.mjs';
export function storage(source){if(source)return original(source);let code=readServerScript('dist');for(const file of ['news/DashboardSnapshots.gs','news/News.gs','news/TranslationJobs.gs','news/Feeds.gs','collection/Collection.gs','news/Radar.gs','news/Selection.gs','news/Translations.gs'])code=code.replace(fs.readFileSync('dist/'+file.split('/').at(-1),'utf8'),()=>fs.readFileSync('src/server/'+file,'utf8'));return original(code);}
