import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateLessonText,refineRenderedLessonPage} from '../../src/components/comprehension/lessonPaging.js';
import {COMPREHENSION_PASSAGES} from '../../src/content/comprehension/passages.js';
test('reading pages retain every word in order at small and large capacities',()=>{
 for(const p of COMPREHENSION_PASSAGES)for(const capacity of [1,15,30,75,200,1000]){
  const pages=paginateLessonText(p.text,text=>text.length<=capacity);
  assert.equal(pages.join(' '),p.text,p.id);
  assert.ok(pages.every(page=>page.length<=capacity||!page.includes(' ')),`${p.id}: bounded page`);
 }
});
test('empty content and exact fit keep a usable page',()=>{
 assert.deepEqual(paginateLessonText('',()=>true),['']);
 assert.deepEqual(paginateLessonText('one two three',t=>t.length<=7),['one two','three']);
 assert.deepEqual(paginateLessonText('one two three',()=>true),['one two three']);
});

test('rendered-page refinement retains every word and only moves overflow forward',()=>{
 const original=['one two three four','five six','seven eight'];
 const refined=refineRenderedLessonPage(original,0,text=>text.length<=7);
 assert.deepEqual(refined,['one two','three four five six','seven eight']);
 assert.equal(refined.join(' '),original.join(' '));
 assert.deepEqual(original,['one two three four','five six','seven eight']);
 assert.equal(refineRenderedLessonPage(original,1,()=>true),original);
 assert.deepEqual(refineRenderedLessonPage(['one two three'],0,text=>text.length<=7),['one two','three']);
});
test('refining every rendered page remains finite and preserves the complete passage',()=>{
 for(const p of COMPREHENSION_PASSAGES){
  let pages=paginateLessonText(p.text,()=>true);
  for(let index=0;index<pages.length;index++)pages=refineRenderedLessonPage(pages,index,text=>text.length<=32);
  assert.equal(pages.join(' '),p.text,p.id);
  assert.ok(pages.every(text=>text.length<=32||!text.includes(' ')),p.id);
 }
});
