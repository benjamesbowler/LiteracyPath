import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import {
  getGuidedReadingBookAudioPath,
  getGuidedReadingPageAudioPath,
  getGuidedReadingWordProductionAudioPath
} from "../../src/utils/guidedReading/readAloudPolicy.js";

const repositoryRoot = process.cwd();

function publicFile(audioPath) {
  return path.join(repositoryRoot, "public", audioPath);
}

test("every live Guided Reading page has current Leda narration", async () => {
  const missing = [];
  for (const book of guidedReadingBooks) {
    for (const page of book.pages || []) {
      if (page.active === false) continue;
      const audioPath = getGuidedReadingPageAudioPath(page);
      if (!audioPath.startsWith("/audio/production/en-US/")) {
        missing.push(`${book.id}:page-${page.pageNumber || "?"}:mapping`);
        continue;
      }
      try {
        await access(publicFile(audioPath));
      } catch {
        missing.push(`${book.id}:page-${page.pageNumber || "?"}:file`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("every readable Guided Reading word token has current Leda audio", async () => {
  const missing = new Set();
  for (const book of guidedReadingBooks) {
    for (const page of book.pages || []) {
      if (page.active === false) continue;
      const pageText = Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
      const readableTokens = (pageText.match(/[A-Za-z0-9'’—–-]+/g) || [])
        .filter(token => /[A-Za-z0-9]/.test(token));
      for (const token of readableTokens) {
        const audioPath = getGuidedReadingWordProductionAudioPath({ text: token });
        if (!audioPath.startsWith("/audio/production/en-US/")) {
          missing.add(`${token}:mapping`);
          continue;
        }
        try {
          await access(publicFile(audioPath));
        } catch {
          missing.add(`${token}:file`);
        }
      }
    }
  }
  assert.deepEqual([...missing], []);
});

test("deleted legacy full-book files cannot override replacement page narration", () => {
  const legacyBook = guidedReadingBooks.find(book =>
    String(book.bookAudioPath || book.fullBookAudio || book.audio?.fullBook || "")
      .startsWith("/guided-reading/")
  );
  assert.ok(legacyBook, "expected at least one migrated legacy full-book reference");
  assert.equal(getGuidedReadingBookAudioPath(legacyBook), "");
  assert.ok(
    legacyBook.pages.every(page =>
      getGuidedReadingPageAudioPath(page).startsWith("/audio/production/en-US/")
    ),
    "replacement Leda page narration must provide the whole-book fallback"
  );
});

test("whole-book mode keeps child-paced narration and automatic page turns", async () => {
  const source = await readFile(
    new URL("../../src/components/guided-reading/GuidedReadingPage.jsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /GUIDED_READING_PAGE_LEAD_IN_MS/);
  assert.match(source, /GUIDED_READING_PAGE_LEAD_OUT_MS/);
  assert.match(source, /audio\.playbackRate = GUIDED_READING_NARRATION_RATE/);
  assert.match(source, /audio\.onended = async \(\) => \{[\s\S]*readWholeBookFrom\(startIndex \+ 1, controller\)/);
  assert.match(source, /wholeBookAbortRef\.current\?\.abort\(\)/);
  assert.match(source, /if \(currentPageIndex === nextPageIndex\) return currentPageIndex/);
  assert.match(source, /wholeBookSequenceAudioRef\.current \|\| new Audio\(audioPath\)/);
  assert.ok(
    source.indexOf("wholeBookFirstPlayPromiseRef.current = sequenceAudio.play()")
      < source.indexOf("await readWholeBookFrom(pageIndex, controller)"),
    "iPad playback must begin inside the original Read whole book tap"
  );
  assert.ok(
    source.indexOf("if (allPagesHaveAudio)") < source.indexOf("if (fullBookAudioPath)"),
    "verified page narration must be preferred so page pauses are preserved"
  );
});
