import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {collectAppVisualReviewInventory} from '../../tools/appVisualReviewInventory.mjs';
import {getRuntimeGuidedReadingBooks} from '../../src/utils/guidedReading/runtimeBooks.js';
import {withRepairedGuidedReadingImageVersion} from '../../src/utils/guidedReading/mediaVersion.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const clean=value=>String(value||'').split(/[?#]/,1)[0];

test('visual inventory covers all current immutable reader deliveries and preserves their canonical QA paths',()=>{
  const expected=new Map();
  for(const book of getRuntimeGuidedReadingBooks()){
    const paths=[book.coverImage||book.cover||book.coverUrl,...book.pages.map(page=>page.image||page.imageUrl||page.pageImage)].filter(Boolean);
    for(const source of paths){const canonical=clean(source),delivery=clean(withRepairedGuidedReadingImageVersion(source));if(delivery!==canonical)expected.set(canonical,delivery);}
  }
  assert.equal(expected.size,66,'The five replacements and15 accepted sibling repairs retain their bounded current delivery set.');
  // Disabling source literals proves these are discovered from actual runtime
  // delivery selection, rather than accidentally from a review registry string.
  const inventory=new Map(collectAppVisualReviewInventory(root,{includeSourceLiterals:false}).map(row=>[row.path,row]));
  for(const[canonical,delivery]of expected){
    assert.ok(inventory.has(canonical),`${canonical}: canonical QA identity disappeared`);
    assert.ok(inventory.has(delivery),`${delivery}: actual served image is outside visual review`);
    assert.ok(inventory.get(delivery).sources.includes('runtime-guided-reading-delivery'),`${delivery}: missing actual delivery consumer binding`);
    assert.ok(fs.readFileSync(path.join(root,'public',canonical)).equals(fs.readFileSync(path.join(root,'public',delivery))),`${delivery}: delivered pixels differ from canonical reviewed art`);
  }
});
