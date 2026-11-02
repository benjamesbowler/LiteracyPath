#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectAppVisualReviewInventory} from './appVisualReviewInventory.mjs';
import {collectAppVisualHeldSourceProof} from './lib/appVisualHeldSources.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.some(a=>!a.startsWith('--registry=')&&!a.startsWith('--output=')))throw Error('Usage: node tools/auditAppVisualHeldSources.mjs [--registry=path] [--output=path]');
const registry=JSON.parse(fs.readFileSync(path.resolve(root,args.find(a=>a.startsWith('--registry='))?.slice(11)||'tools/manifests/app-visual-held-sources.json'),'utf8'));
if(registry.schemaVersion!==1||!Array.isArray(registry.assets))throw Error('Invalid held-source registry');
const proof=await collectAppVisualHeldSourceProof(root,registry.assets,collectAppVisualReviewInventory(root));
const output=args.find(a=>a.startsWith('--output='))?.slice(9);
if(output){fs.mkdirSync(path.dirname(path.resolve(root,output)),{recursive:true});fs.writeFileSync(path.resolve(root,output),JSON.stringify(proof,null,2)+'\n');}
console.log(JSON.stringify(proof));
if(proof.errors.length)process.exitCode=1;
