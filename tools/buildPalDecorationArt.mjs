import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.length>1||(args[0]&&!['--check','--write'].includes(args[0])))throw Error('Usage: node tools/buildPalDecorationArt.mjs [--check|--write]');
const write=args[0]==='--write',hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await fs.readFile(path.join(root,'source-art/app-clean-cartoon/pal-decorations/manifest.json'),'utf8'));
const sources=new Map();
for(const bank of manifest.banks){
 const b=await fs.readFile(path.join(root,bank.nativeSaved));
 if(hash(b)!==bank.nativeSha256)throw Error('Changed Pal source '+bank.jobId);
 if(hash(await fs.readFile(path.join(root,bank.promptFile)))!==bank.promptSha256)throw Error('Changed Pal prompt '+bank.jobId);
 sources.set(bank.nativeSaved,b);
}
const seen=new Set();
for(const a of manifest.assets){
 if(seen.has(a.path))throw Error('Duplicate Pal delivery '+a.path);seen.add(a.path);
 const b=sources.get(a.nativeSaved);if(!b||hash(b)!==a.nativeSha256)throw Error('Unbound Pal crop '+a.path);
 const output=await sharp(b).extract(a.crop).resize(a.resize).webp(a.encoding).toBuffer();
 if(hash(output)!==a.outputSha256)throw Error('Non-reproducible Pal delivery '+a.path);
 const target=path.join(root,'public',a.path.replace(/^\//,''));if(write)await fs.writeFile(target,output);
 if(hash(await fs.readFile(target))!==a.outputSha256)throw Error('Changed Pal delivery '+a.path);
}
console.log(`${write?'Rebuilt':'Verified'} ${seen.size} clean Pal decorations from ${sources.size} original banks.`);
