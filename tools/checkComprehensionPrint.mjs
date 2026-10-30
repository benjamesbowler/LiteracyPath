import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { COMPREHENSION_PASSAGES } from '../src/content/comprehension/passages.js';
import { COMPREHENSION_EXPANSION_IDS } from '../src/content/comprehension/expansionPassages.js';
import { passagePicture } from '../src/content/comprehension/pictures.js';
import { buildComprehensionDocument, embedComprehensionImages } from '../src/content/comprehension/print.js';
const output=path.resolve('.artifacts/comprehension');await fs.mkdir(output,{recursive:true});
const failures=[];let count=0,physical=0;
const picturePages=[];
const missingPictures=[];
for(const passage of COMPREHENSION_PASSAGES){
 const picture=passagePicture(passage);
 if(!picture){missingPictures.push(`${passage.id}: missing or stale picture plan`);continue;}
 try{await fs.access(path.join('public',picture.src));}
 catch{missingPictures.push(`${passage.id}: ${picture.src}`);}
}
if(missingPictures.length){
 await fs.writeFile(path.join(output,'print-check.json'),JSON.stringify({documents:0,physicalPages:0,passages:COMPREHENSION_PASSAGES.length,checkedAt:new Date().toISOString(),failures:missingPictures.map(error=>({variant:'picture',error:`Missing illustration: ${error}`}))},null,2));
 throw new Error(`Picture-story print needs all ${COMPREHENSION_PASSAGES.length} current illustrations. Missing:\n${missingPictures.join('\n')}`);
}
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:794,height:1123}});
 await page.emulateMedia({media:'print'});
 async function render(recipe,filename){
  const doc=buildComprehensionDocument(recipe);
  const html=await embedComprehensionImages(doc.html,{fetchImpl:async source=>{
   let bytes;
   try{bytes=await fs.readFile(path.join('public',source));}
   catch{throw new Error(`Print picture could not be loaded: ${source}`);}
   return {ok:true,blob:async()=>new Blob([bytes],{type:'image/webp'})};
  }});
  await page.setContent(html,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  if(!await page.evaluate(()=>document.fonts.check('16pt "Worksheet Andika"')))failures.push({recipe,error:'Embedded Andika font did not load'});
  if(!html.includes('data:font/woff2;base64,')||/<script\b|(?:src|href)="(?:https?:|\/images\/)/i.test(html))failures.push({recipe,error:'Print document is not self-contained and script-free'});
  await page.locator('.portrait-pool image').evaluateAll(imgs=>Promise.all(imgs.map(source=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=source.getAttribute('href');}))));
  const taskIds=await page.locator('[data-task-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.taskId));
  if(new Set(taskIds).size!==taskIds.length)failures.push({recipe,error:'Duplicate task metadata'});
  const layout=await page.locator('section.page').evaluateAll(sections=>sections.map(s=>{
   const bounds=s.getBoundingClientRect(),footer=s.querySelector('footer').getBoundingClientRect();
   const body=[...s.children].filter(e=>e.tagName!=='FOOTER');
   const overflow=body.some(e=>e.getBoundingClientRect().bottom>footer.top-2);
   const clipped=[...s.querySelectorAll('*')].some(e=>{const r=e.getBoundingClientRect();return r.left<bounds.left-1||r.right>bounds.right+1;});
   const smallText=!s.classList.contains('teacher')&&[...s.querySelectorAll('p,h1,h2,.focus,.printed-option')].some(e=>parseFloat(getComputedStyle(e).fontSize)<14*96/72-.1);
   const references=[...s.querySelectorAll('.character use,.story-picture use')];
   const image=s.querySelector('.story-picture');
   return {passage:s.dataset.passageId,variant:s.dataset.printVariant,height:bounds.height,overflow,clipped,smallText,images:references.every(use=>{const source=document.querySelector(use.getAttribute('href'));return source?.getAttribute('href')?.startsWith('data:image/');}),picture:image?{alt:image.getAttribute('aria-label'),kind:image.dataset.pictureKind,width:image.getBoundingClientRect().width,height:image.getBoundingClientRect().height}:null};
  }));
  if(recipe.variant==='picture'){
   const storyTexts=await page.locator('.picture-page').evaluateAll(sections=>sections.map(section=>({id:section.dataset.passageId,text:section.querySelector('.passage')?.textContent})));
   for(const item of storyTexts)if(item.text!==COMPREHENSION_PASSAGES.find(p=>p.id===item.id)?.text)failures.push({recipe,error:`Incomplete or altered story: ${item.id}`});
   for(const item of layout){
    const picture=passagePicture(COMPREHENSION_PASSAGES.find(p=>p.id===item.passage));
    if(!item.picture||item.picture.alt!==picture.alt||item.picture.kind!==picture.kind||item.picture.height<400)failures.push({recipe,error:`Missing, small or mismatched picture: ${item.passage}`});
   }
   if(recipe.passageIds.length===1){
    const filename=`picture-${recipe.passageIds[0]}.png`;
    await page.screenshot({path:path.join(output,filename),fullPage:true});
    picturePages.push({...layout[0],screenshot:filename});
   }
  }
  const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:false});
  const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  if(pages!==doc.pages)failures.push({recipe,expected:doc.pages,physical:pages});
  for(const item of layout)if(item.overflow||item.clipped||item.smallText||!item.images||item.height>1025)failures.push(item);
  count++;physical+=pages;
  if(filename)await fs.writeFile(path.join(output,filename),pdf);
  return {doc,layout};
 }
 for(const p of COMPREHENSION_PASSAGES)for(const variant of ['worksheet','choice','extension','pair','teacher','picture'])await render({passageIds:[p.id],variant});
 await render({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'picture'},'reading-comprehension-picture-stories.pdf');
 await render({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'pair'},'reading-comprehension-student-pack.pdf');
 await render({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'teacher'},'reading-comprehension-teacher-guides.pdf');
 await render({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'worksheet'},'reading-comprehension-written-answers.pdf');
 for (const [variant,filename] of [['choice','100-new-comprehension-sheets.pdf'],['teacher','100-new-comprehension-answer-keys.pdf'],['picture','100-new-comprehension-picture-stories.pdf'],['extension','100-new-comprehension-drawing-pages.pdf']]) {
  await render({passageIds:COMPREHENSION_EXPANSION_IDS,variant},filename);
 }
 await render({passageIds:['muddy-rain'],variant:'pair'},'long-a-colouring-worksheets.pdf');
 const result={documents:count,physicalPages:physical,passages:COMPREHENSION_PASSAGES.length,checkedAt:new Date().toISOString(),picturePages,failures};
 await fs.writeFile(path.join(output,'print-check.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 if(failures.length)process.exitCode=1;
}finally{await browser.close();}
