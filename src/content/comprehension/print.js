import { shuffleAnswerPositions } from '../../utils/answerPositionShuffle.js';
import { openHtmlDocument } from '../../utils/openHtmlDocument.js';
import { passageById } from './passages.js';
import { WORKSHEET_PRINT_FONT } from '../../utils/worksheets/worksheetPrintFont.js';
export const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const printQuestions=p=>p.questions.map(q=>({...q,options:shuffleAnswerPositions(q.options,`comprehension-print-v1:${q.id}`)}));
const name = p => p.character[0].toUpperCase()+p.character.slice(1);
const lines = (count=2) => `<div class="writing-lines" role="img" aria-label="${count} handwriting lines">${'<div></div>'.repeat(count)}</div>`;
const task = (p,kind,body,answer='',variant='') => `<div class="task" data-task-kind="${kind}" data-task-id="${p.id}-${variant?`${variant}-`:''}${kind}"${answer?` data-answer="${esc(answer)}"`:''}>${body}</div>`;
const story = (p,variant) => task(p,'passage',`<svg class="character" viewBox="0 0 1 1" role="img" aria-label="${name(p)}, the character in this story, drawn with colouring outlines"><use href="#comprehension-portrait-${p.character}"></use></svg><p class="passage">${esc(p.text)}</p>`,'',variant);
const portraitPool = (ps,types) => types.every(type=>type==='teacher')?'':`<svg class="portrait-pool" width="0" height="0" aria-hidden="true" focusable="false"><defs>${[...new Set(ps.map(p=>p.character))].map(character=>`<image id="comprehension-portrait-${character}" width="1" height="1" href="/images/worksheets/${character}-colouring.webp"></image>`).join('')}</defs></svg>`;
// Embed each approved raster once. SVG references preserve the same artwork on
// every page without a 100MB repeated data-URL document for a full class pack.
export async function embedComprehensionImages(html,options){
 const sources=[...new Set([...html.matchAll(/<image\b[^>]*\bhref="([^"]+)"/gi)].map(match=>match[1]))];
 if(!sources.length)return html;
 const {embedWorksheetImages}=await import('../../utils/worksheets/worksheetBuilder.js');
 const embedded=await embedWorksheetImages(sources.map(src=>`<img src="${src}">`).join(''),options);
 const data=[...embedded.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map(match=>match[1]);
 const replacements=new Map(sources.map((src,i)=>[src,data[i]]));
 return html.replace(/(<image\b[^>]*\bhref=")([^"]+)(")/gi,(whole,before,src,after)=>`${before}${replacements.get(src)||src}${after}`);
}

const wordHelp = p => `<p class="word-help"><strong>Word help:</strong> ${p.wordHelp.map(([word,meaning])=>`${esc(word)} = ${esc(meaning)}`).join('; ')}.</p>`;
const readChecks = '<p class="read-checks">Read again: <span>1 □</span> <span>2 □</span> <span>3 □</span></p>';
const header = (p,teacher) => `<header>${teacher?'<p>Teacher guide · Print separately</p>':'<p class="name">Name: _______________________ Date: __________</p>'}<div class="focus">Phonics focus: ${esc(p.focus)}</div><h1>${esc(p.title)}</h1></header>`;
function worksheet(p){return `${story(p,'worksheet')}${wordHelp(p)}${readChecks}${task(p,'comprehension',`<h2>Read. Find the answers in the story.</h2>${p.questions.map((q,i)=>`<div class="question" data-question-id="${q.id}"><p>${i+1}. ${esc(q.prompt)}</p>${lines()}</div>`).join('')}`,p.questions.map(q=>q.answer).join(' | '))}<p class="colour">Colour ${name(p)} when you have finished.</p>`;}
function choiceWorksheet(p){p={...p,questions:printQuestions(p)};return `${story(p,'choice')}${wordHelp(p)}${readChecks}${task(p,'comprehension',`<h2>Read. Tick one box for each question.</h2>${p.questions.map((q,i)=>`<div class="question choice-question" data-question-id="${q.id}"><p>${i+1}. ${esc(q.prompt)}</p><div class="printed-options">${q.options.map((option,j)=>`<div class="printed-option"><span class="answer-box" aria-hidden="true"></span><span><strong>${'ABCD'[j]}.</strong> ${esc(option)}</span></div>`).join('')}</div></div>`).join('')}`,p.questions.map(q=>q.answer).join(' | '),'choice')}<p class="colour">Colour ${name(p)} when you have finished.</p>`;}
function extension(p){return `${story(p,'extension')}${wordHelp(p)}${task(p,'word-study',`<h2>Circle these words in the story.</h2><p class="word-bank">${p.targetWords.map(esc).join(' · ')}</p>`,p.targetWords.join(' | '))}${task(p,'draw-retell',`<h2>${esc(p.draw)}</h2><div class="draw-box"></div><p>Tell what happened. Use first, next and last.</p>${lines(3)}`)}<p class="colour">Use the story to help you draw and write.</p>`;}
export function teachingPrompts(p){return {before:`Read the support words together: ${p.supportWords.join(', ')}. Explain the word help: ${p.wordHelp.map(([word,meaning])=>`${word}: ${meaning}`).join('; ')}. Check that ${p.focus} has been taught.`,during:'Read the story together. Read it again with a partner. Ask each reader to point to the words that help answer the question.',after:`Ask what happened first, next and last. ${p.draw} Accept answers in the reader’s own words when they match the story.`};}
function teacherGuide(p){p={...p,questions:printQuestions(p)};const t=teachingPrompts(p);return `<p><strong>${p.wordCount} words · ${esc(p.readingMode)}</strong></p><p>Prerequisites: ${p.prerequisites.map(esc).join('; ')}.</p><p>Target words: ${p.targetWords.map(esc).join(', ')}.</p><p><strong>Before:</strong> ${esc(t.before)}</p><p><strong>During:</strong> ${esc(t.during)}</p><p>Answer letters match the printed choice sheets. Check the answer words on screen.</p><section class="teacher-answers">${p.questions.map((q,i)=>`<div class="teacher-answer" data-question-id="${q.id}"><p><strong>${i+1}. ${esc(q.prompt)}</strong></p><p>Answer: ${'ABCD'[q.options.indexOf(q.answer)]}. ${esc(q.answer)}. Answers in the reader’s own words are welcome.</p><p>Evidence: ${q.evidence.map(esc).join(' ')}</p></div>`).join('')}</section><p><strong>After:</strong> ${esc(t.after)}</p><p>Drawing/retelling: varied responses. Look for the named objects and events in the story. Rereading ticks record practice, not measured fluency. Teacher-read or Leda narration is supported comprehension, not evidence of independent decoding.</p>`;}
export const COMPREHENSION_PRINT_CSS=`
@font-face{font-family:"Worksheet Andika";src:url(data:font/woff2;base64,${WORKSHEET_PRINT_FONT}) format('woff2');font-style:normal;font-weight:400;font-display:block}
@page{size:A4 portrait;margin:13mm}
*{box-sizing:border-box}html{background:#fff;color:#000}body{margin:0;font-family:"Worksheet Andika",Arial,sans-serif;font-size:16pt;line-height:1.4;background:#fff;color:#000}
.page{display:flow-root;width:184mm;min-height:270mm;position:relative;padding:0 0 9mm;break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}
.portrait-pool{position:absolute;width:0;height:0;overflow:hidden}header{margin-bottom:4mm}h1{font-size:24pt;line-height:1.2;margin:3mm 0}h2{font-size:16pt;font-weight:400;line-height:1.4;margin:3mm 0 2mm}p{margin:2mm 0}.name,.focus,.word-help{font-size:14pt}.focus{border-bottom:1.3pt solid #000;padding-bottom:2mm}.task{break-inside:avoid;page-break-inside:avoid;display:flow-root}.passage{font-size:16pt;line-height:1.55;margin:0}.character{width:52mm;height:52mm;object-fit:contain;float:right;margin:0 0 2mm 4mm}.read-checks{font-size:14pt;display:flex;gap:7mm;margin:4mm 0}.read-checks span{white-space:nowrap}.question{break-inside:avoid;margin:3mm 0}.question p{font-size:16pt;line-height:1.35}.writing-lines>div{height:8mm;border-bottom:1px solid #000}.colour{font-size:14pt;margin-top:3mm}.draw-box{height:52mm;border:1.4pt solid #000;margin:2mm 0}.word-bank{font-size:16pt}.footer{position:absolute;bottom:0;left:0;right:0;font-size:10pt;border-top:1px solid #000;padding-top:1.5mm}.teacher{font-size:13pt;line-height:1.4}.teacher h1{font-size:22pt}.teacher-answer{break-inside:avoid;margin:4mm 0}.teacher-answer p{margin:1.5mm 0}
.printed-options{display:grid;grid-template-columns:1fr 1fr;gap:2mm 4mm}.printed-option{display:flex;align-items:flex-start;gap:2mm;font-size:14pt;line-height:1.3;break-inside:avoid}.answer-box{display:inline-block;flex:none;width:4mm;height:4mm;border:1pt solid #000;margin-top:1mm}.choice-question{margin:3mm 0 4mm}.choice-question p{margin-bottom:2mm}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
`;
export function buildComprehensionDocument({passageIds=[],variant='worksheet'}={}){
 if(!['worksheet','choice','extension','pair','teacher'].includes(variant))throw new Error('Choose a valid print format.');
 const ids=[...new Set(passageIds)];
 if(!ids.length)throw new Error('Choose at least one passage to print.');
 const ps=ids.map(id=>{const p=passageById(id);if(!p)throw new Error('This passage could not be found. Choose it again.');return p;});
 const types=variant==='pair'?['choice','extension']:[variant];
 let page=0;
 const body=ps.flatMap(p=>types.map(type=>{
  page++;return `<section class="page${type==='teacher'?' teacher':''}" data-worksheet-page="${page}" data-passage-id="${p.id}" data-learner-band="${p.band}" data-construct="${esc(p.construct)}" data-print-variant="${type}">${header(p,type==='teacher')}${type==='teacher'?teacherGuide(p):type==='extension'?extension(p):type==='choice'?choiceWorksheet(p):worksheet(p)}<footer class="footer">Literacy Guide · ${esc(p.focus)} · ${type==='teacher'?'Teacher guide':type==='extension'?'Draw and retell':type==='choice'?'Read and choose':'Read and write'} · ${page}</footer></section>`;
 })).join('');
 const title=`Reading Comprehension - ${ps.length===1?ps[0].title:`${ps.length} passages`} - ${variant}`;
 return {title,pages:page,html:`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${COMPREHENSION_PRINT_CSS}</style></head><body>${portraitPool(ps,types)}${body}</body></html>`};
}
export function openComprehensionPrint(recipe){
 const {html}=buildComprehensionDocument(recipe);
 const result=openHtmlDocument({name:'lp-comprehension-print',autoPrint:true,prepareHtml:()=>embedComprehensionImages(html)});
 if(!result.ok)throw new Error('Allow pop-ups for this site, then try Print again.');
 return result.ready;
}
