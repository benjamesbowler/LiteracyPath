import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const write=process.argv.includes('--write');
if(process.argv.slice(2).some(a=>!['--write','--check'].includes(a)))throw Error('Use --check or --write');
const root=new URL('../',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
const file=new URL('../source-art/arcade/physical-worlds/tower-tumble/clean-cartoon-manifest.json',import.meta.url),manifest=JSON.parse(await fs.readFile(file,'utf8'));
for(const a of manifest.assets){
 const source=await fs.readFile(new URL(a.source,root));if(hash(source)!==a.sourceSHA256)throw Error('Changed Tower native '+a.id);
 const target=new URL('public'+a.runtime,root);
 if(a.unchangedMaterialInput){if(hash(await fs.readFile(target))!==a.runtimeSHA256)throw Error('Changed retained material '+a.id);continue;}
 if(hash(await fs.readFile(new URL(a.prompt,root)))!==a.promptSha256)throw Error('Changed Tower prompt '+a.id);
 const {resize,...encoding}=a.encoding,output=await sharp(source).resize(resize).webp(encoding).toBuffer();
 if(hash(output)!==a.runtimeSHA256)throw Error('Changed Tower recipe '+a.id);
 if(write)await fs.writeFile(target,output);
 if(hash(await fs.readFile(target))!==a.runtimeSHA256)throw Error('Changed Tower delivery '+a.id);
}
const publicManifest=new URL('public/game-assets/physical-arcade/tower-tumble/scene-kit-v1.json',root);
if(write)await fs.writeFile(publicManifest,JSON.stringify(manifest,null,2)+'\n');
if(JSON.stringify(JSON.parse(await fs.readFile(publicManifest,'utf8')))!==JSON.stringify(manifest))throw Error('Stale public Tower manifest');
console.log('Verified five clean cartoon Tower originals and measured props.');
