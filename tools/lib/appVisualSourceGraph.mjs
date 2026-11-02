import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

// Follow the actual main entry, including literal lazy imports and Vite globs.
// An unresolved local import or dynamic import is a proof failure, never an
// excuse to regard the unvisited branch as inactive.
export function collectAppVisualSourceGraph(root){
  const espree=createRequire(import.meta.url)('espree');
  const pending=['src/main.jsx'],seen=new Set(),edges=[],issues=[],dynamic=[];
  function resolve(from,s){
    let p=s.startsWith('@/')?path.join(root,'src',s.slice(2)):s.startsWith('.')?path.resolve(root,path.dirname(from),s):s.startsWith('/src/')?path.join(root,s):null;
    if(!p)return null;p=p.split('?')[0].split('#')[0];
    for(const c of [p,...['.js','.jsx','.mjs','.ts','.tsx','.json','.css'].map(e=>p+e),...['index.js','index.jsx','index.mjs'].map(e=>path.join(p,e))])if(fs.existsSync(c)&&fs.statSync(c).isFile())return path.relative(root,c).split(path.sep).join('/');
    issues.push({from,s,type:'unresolved-local-import'});return null;
  }
  function follow(from,s){const to=resolve(from,s);if(to){edges.push({from,to});if(!seen.has(to))pending.push(to);}}
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;seen.add(file);
    if(!/\.(?:[cm]?js|jsx|tsx?|css)$/.test(file))continue;
    const text=fs.readFileSync(path.join(root,file),'utf8');
    if(file.endsWith('.css')){for(const m of text.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g))follow(file,m[1]);continue;}
    try{
      const ast=espree.parse(text,{ecmaVersion:'latest',sourceType:'module',ecmaFeatures:{jsx:true}}),stack=[ast];
      while(stack.length){
        const node=stack.pop();if(!node||typeof node!=='object')continue;
        if(['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(node.type)&&typeof node.source?.value==='string')follow(file,node.source.value);
        if(node.type==='ImportExpression'){if(typeof node.source?.value==='string')follow(file,node.source.value);else dynamic.push({file,type:'dynamic-import',expression:text.slice(node.start,node.end)});}
        if(node.type==='CallExpression'&&node.callee?.type==='MemberExpression'&&node.callee.object?.type==='MetaProperty'&&node.callee.property?.name==='glob'){
          const glob=node.arguments[0]?.value;
          if(typeof glob==='string'&&glob.startsWith('.')){
            const pattern=path.relative(root,path.resolve(root,path.dirname(file),glob));
            for(const p of fs.globSync(pattern,{cwd:root}))follow(file,'./'+path.relative(path.dirname(file),p));
          }else dynamic.push({file,type:'import-meta-glob',expression:text.slice(node.start,node.end)});
        }
        for(const v of Object.values(node)){if(Array.isArray(v))stack.push(...v);else if(v&&typeof v==='object')stack.push(v);}
      }
    }catch(e){issues.push({file,type:'parse-error',error:e.message});}
  }
  return {entry:'src/main.jsx',modules:[...seen].sort(),edges:edges.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),issues,dynamic};
}
