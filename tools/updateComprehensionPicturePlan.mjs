import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');return [arg.slice(0,i),arg.slice(i+1)];}));
const lock=new URL('../.artifacts/comprehension/fullscreen-pictures/authoring.lock',import.meta.url);
let handle;
for(let attempt=0;attempt<100&&!handle;attempt++)try{handle=await fs.open(lock,'wx');}catch(error){if(error.code!=='EEXIST')throw error;await new Promise(resolve=>setTimeout(resolve,50));}
assert.ok(handle,'Picture authoring is busy; try again.');
try{
 const file=new URL('./authoring/comprehensionPictures.mjs',import.meta.url);
 const {COMPREHENSION_PICTURES:records}=await import(file.href+'?update='+Date.now());
 const record=records[args['--id']];assert.ok(record,'Choose a current picture ID.');
 if(args['--append'])record.prompt+='\n\n'+(await fs.readFile(args['--append'],'utf8')).trim();
 if(args['--patch']){
  const patch=JSON.parse(await fs.readFile(args['--patch'],'utf8'));
  assert.ok(Object.keys(patch).every(key=>['prompt','panels','alt'].includes(key)),'Only prompt/panels/alt may be patched.');Object.assign(record,patch);
 }
 const source=await fs.readFile(file,'utf8');
 const temporary=new URL(file.href+'.tmp');
 await fs.writeFile(temporary,'// Authoritative exact-story image authoring plans and real generation prompts.\nexport const COMPREHENSION_PICTURES = '+JSON.stringify(records,null,2)+';\n'+source.slice(source.indexOf('\nexport function passagePicture')));
 await fs.rename(temporary,file);
 const result=spawnSync(process.execPath,['tools/generateComprehensionPictures.mjs'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);console.log(result.stdout.trim());
}finally{await handle.close();await fs.unlink(lock);}
