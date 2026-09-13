import {spawn} from 'node:child_process';
const children=[];
const start=(args,env=process.env)=>{const child=spawn(process.execPath,args,{stdio:'inherit',env});children.push(child);child.on('exit',code=>{for(const other of children)if(other!==child)other.kill();process.exitCode=code??0;});};
start(['scripts/start-traffic.mjs']);
const webEnv={...process.env};delete webEnv.AISSTREAM_API_KEY;
start(['node_modules/vinext/dist/cli.js','dev',...process.argv.slice(2)],webEnv);
for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>{for(const child of children)child.kill();});
