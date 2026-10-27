import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { COMPREHENSION_PASSAGES } from '../src/content/comprehension/passages.js';
import { buildComprehensionDocument } from '../src/content/comprehension/print.js';
import { embedWorksheetImages } from '../src/utils/worksheets/worksheetBuilder.js';
const output=path.resolve('.artifacts/comprehension');await fs.mkdir(output,{recursive:true});
const failures=[];let count=0,physical=0;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:794,height:1123}});
 await page.emulateMedia({media:'print'});
 async function render(recipe,filename){
  const doc=buildComprehensionDocument(recipe);
  const html=await embedWorksheetImages(doc.html,{fetchImpl:async source=>{
   const bytes=await fs.readFile(path.join('public',source));
   return {ok:true,blob:async()=>new Blob([bytes],{type:'image/webp'})};
  }});
  await page.setContent(html,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  const taskIds=await page.locator('[data-task-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.taskId));
  if(new Set(taskIds).size!==taskIds.length)failures.push({recipe,error:'Duplicate task metadata'});
  const layout=await page.locator('section.page').evaluateAll(sections=>sections.map(s=>{
   const bounds=s.getBoundingClientRect(),footer=s.querySelector('footer').getBoundingClientRect();
   const body=[...s.children].filter(e=>e.tagName!=='FOOTER');
   const overflow=body.some(e=>e.getBoundingClientRect().bottom>footer.top-2);
   const clipped=[...s.querySelectorAll('*')].some(e=>{const r=e.getBoundingClientRect();return r.left<bounds.left-1||r.right>bounds.right+1;});
   const smallText=!s.classList.contains('teacher')&&[...s.querySelectorAll('p,h1,h2,.focus')].some(e=>parseFloat(getComputedStyle(e).fontSize)<14*96/72-.1);
   return {passage:s.dataset.passageId,variant:s.dataset.printVariant,height:bounds.height,overflow,clipped,smallText,images:[...s.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)};
  }));
  const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:false});
  const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  if(pages!==doc.pages)failures.push({recipe,expected:doc.pages,physical:pages});
  for(const item of layout)if(item.overflow||item.clipped||item.smallText||!item.images||item.height>1025)failures.push(item);
  count++;physical+=pages;
  if(filename)await fs.writeFile(path.join(output,filename),pdf);
  return {doc,layout};
 }
 for(const p of COMPREHENSION_PASSAGES)for(const variant of ['worksheet','extension','pair','teacher'])await render({passageIds:[p.id],variant});
 await render({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'pair'},'reading-comprehension-student-pack.pdf');
 await render({passageIds:COMPREHENSION_PASSAGES.map(p=>p.id),variant:'teacher'},'reading-comprehension-teacher-guides.pdf');
 await render({passageIds:['muddy-rain'],variant:'pair'},'long-a-colouring-worksheets.pdf');
 const result={documents:count,physicalPages:physical,passages:COMPREHENSION_PASSAGES.length,failures};
 await fs.writeFile(path.join(output,'print-check.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 if(failures.length)process.exitCode=1;
}finally{await browser.close();}
