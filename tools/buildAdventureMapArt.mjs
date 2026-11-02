import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const write=process.argv.includes('--write');
if(process.argv.slice(2).some(a=>!['--write','--check'].includes(a)))throw Error('Use --check or --write');
const manifest=JSON.parse(await fs.readFile(new URL('../source-art/maps/clean-cartoon/manifest.json',import.meta.url),'utf8'));
const root=new URL('../',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
for(const a of manifest.assets){
 const source=await fs.readFile(new URL(a.source,root));if(hash(source)!==a.sourceSha256)throw Error('Changed map native '+a.jobId);
 if(hash(await fs.readFile(new URL(a.prompt,root)))!==a.promptSha256)throw Error('Changed map prompt '+a.jobId);
 const {resize,...encoding}=a.encoding,output=await sharp(source).resize(resize).webp(encoding).toBuffer();
 if(hash(output)!==a.runtimeSHA256)throw Error('Changed map recipe '+a.jobId);
 const target=new URL('public'+a.runtime,root);if(write)await fs.writeFile(target,output);
 if(hash(await fs.readFile(target))!==a.runtimeSHA256)throw Error('Changed map delivery '+a.jobId);
}
console.log(`Verified ${manifest.assets.length} complete clean cartoon map deliveries.`);
