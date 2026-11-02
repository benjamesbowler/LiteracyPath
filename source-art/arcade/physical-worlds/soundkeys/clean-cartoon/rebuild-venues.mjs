import process from 'node:process';
// Exact accepted venue codec recipe. Default is read-only byte verification.
// Use --write only in an explicitly authorized delivery rebuild window.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import sharp from 'sharp';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../..'),manifest=JSON.parse(fs.readFileSync(repo+'/source-art/arcade/physical-worlds/soundkeys/scene-kit-clean-cartoon.json')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),write=process.argv.includes('--write'),results=[];
const selectionIndex=process.argv.indexOf('--asset-ids'),selected=selectionIndex<0?null:new Set(process.argv[selectionIndex+1].split(',')),known=new Set(['dino','meadow','moonwood'].flatMap(w=>[w+'-keyboard-venue-v1',w+'-keyboard-venue-fallback-v1']));
if(selected&&[...selected].some(id=>!known.has(id)))throw Error('Unknown venue selection');
for(const world of['dino','meadow','moonwood']){
 const id=world+'-keyboard-venue-v1',p=manifest.assets[id],f=manifest.assets[world+'-keyboard-venue-fallback-v1'],source=fs.readFileSync(repo+'/'+p.source);
 if(sha(source)!==p.sourceSha256)throw Error(id+' retained native SHA changed');if(sha(fs.readFileSync(repo+'/'+p.prompt))!==p.promptSha256)throw Error(id+' prompt SHA changed');
 const primary=await sharp(source).resize(p.width,p.height,{fit:'fill'}).webp({quality:92,alphaQuality:100,effort:6}).toBuffer();
 if(sha(primary)!==p.runtimeSha256)throw Error(id+' exact primary encoder mismatch');
 const fallback=await sharp(primary).resize(768,432,{fit:'inside'}).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
 if(sha(fallback)!==f.runtimeSha256||sha(primary)!==f.sourceSha256)throw Error(id+' exact fallback encoder/input mismatch');
 for(const[a,bytes]of[[p,primary],[f,fallback]]){const dst=repo+'/public'+a.runtime,id=path.basename(a.runtime,'.webp'),willWrite=write&&(!selected||selected.has(id));if(willWrite){fs.writeFileSync(dst+'.venue-rebuild-tmp',bytes);fs.renameSync(dst+'.venue-rebuild-tmp',dst);}else if(sha(fs.readFileSync(dst))!==sha(bytes))throw Error(a.runtime+' canonical bytes differ');results.push({path:a.runtime,sha256:sha(bytes),bytes:bytes.length,written:willWrite});}
}
console.log(JSON.stringify({mode:write?'explicit-write':'read-only-check',sharpVersion:sharp.versions.sharp,vipsVersion:sharp.versions.vips,verified:results,errors:[]}));
