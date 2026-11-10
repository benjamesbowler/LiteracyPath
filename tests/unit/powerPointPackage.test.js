import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {deduplicatePowerPointMedia} from '../../src/utils/present/powerPointPackage.js';

test('offline PowerPoint shares repeated media and has unique audio targets with native playback timing', async () => {
  const source = new JSZip();
  source.file('ppt/media/one.png', 'same image');source.file('ppt/media/two.png', 'same image');
  source.file('ppt/media/spoken.mp3', 'different audio');
  source.file('ppt/slides/_rels/slide1.xml.rels', '<Relationships><Relationship Id="r1" Target="../media/one.png"/><Relationship Id="r2" Target="../media/two.png"/><Relationship Id="r3" Target="../media/spoken.mp3"/></Relationships>');
  source.file('ppt/slides/slide1.xml', '<p:sld><p:cSld><p:spTree><p:cNvPr id="1"/><p:pic><p:nvPicPr><p:cNvPr id="1"><a:hlinkClick action="ppaction://media"/></p:cNvPr><p:nvPr><a:videoFile r:link="r3"/></p:nvPr></p:nvPicPr></p:pic><p:cNvPr id="1"/></p:spTree></p:cSld></p:sld>');
  const result = await deduplicatePowerPointMedia(new Blob([await source.generateAsync({type:'uint8array'})]));
  const zip = await JSZip.loadAsync(await result.arrayBuffer());
  assert.ok(zip.file('ppt/media/one.png'));assert.equal(zip.file('ppt/media/two.png'), null);
  assert.match(await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string'), /Id="r2" Target="\.\.\/media\/one.png"/);
  const xml = await zip.file('ppt/slides/slide1.xml').async('string');
  assert.deepEqual([...xml.matchAll(/<p:cNvPr id="(\d+)"/g)].map(match => match[1]), ['1','2','3']);
  assert.match(xml, /<a:audioFile r:link="r3"/);assert.doesNotMatch(xml, /a:videoFile/);
  assert.match(xml, /presetClass="mediacall"/);assert.match(xml, /cmd="playFrom\(0.0\)"/);
  assert.match(xml, /<p:audio>[\s\S]*?<p:spTgt spid="2"/);
  const again = await deduplicatePowerPointMedia(result);
  const second = await JSZip.loadAsync(await again.arrayBuffer());
  assert.equal((await second.file('ppt/slides/slide1.xml').async('string')).match(/<p:timing>/g).length, 1);
});
