import {execFileSync} from 'node:child_process';
export const defaultBenchmarkBase='5c43f28753cbfa239ac5535045a7b4bce90b755b';
export function benchmarkSource(args){
 const flag=args.find(arg=>arg==='--baseline'||arg.startsWith('--baseline='));
 if(!flag)return {baseline:false,revision:null,source:null};
 const ref=flag==='--baseline'?defaultBenchmarkBase:flag.slice('--baseline='.length);
 if(!ref)throw Error('Indica una revisión no vacía en --baseline=<revisión>.');
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20e6});
 const revision=git('rev-parse','--verify','--end-of-options',ref+'^{commit}').trim();
 const files=git('ls-tree','-r','--name-only',revision,'dist').trim().split('\n').filter(file=>file.endsWith('.gs'));
 if(!files.length)throw Error('La revisión base no contiene dist/*.gs: '+revision);
 return {baseline:true,revision,source:files.map(file=>git('show',revision+':'+file)).join('\n')};
}
