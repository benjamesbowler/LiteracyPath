import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateLessonText} from '../../src/components/comprehension/lessonPaging.js';
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
