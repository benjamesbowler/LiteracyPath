#!/usr/bin/env node
import {
  getGuidedReadingBookAudioPath,
  getGuidedReadingPageAudioPath,
  getGuidedReadingReadAloudState,
  guidedReadingReadAloudPolicy
} from "../src/utils/guidedReading/readAloudPolicy.js";

const failures = [];

const bookWithoutAudio = {
  id: "sample-book",
  title: "Sample Book",
  pages: [{ pageNumber: 1, text: "A sample page.", image: "/sample.webp" }]
};
const bookWithPageAudio = {
  ...bookWithoutAudio,
  pages: [{ ...bookWithoutAudio.pages[0], pageAudio: "/guided-reading/sample/page-001.mp3" }]
};
const bookWithStalePageAudio = {
  ...bookWithoutAudio,
  pages: [{
    ...bookWithoutAudio.pages[0],
    pageAudio: "/guided-reading/sample/missing-page-001.mp3",
    narrationNeedsRebuild: true
  }]
};
const bookWithFullAudio = {
  ...bookWithPageAudio,
  fullBookAudio: "/guided-reading/sample/full-book.mp3"
};
const bookWithProductionFullAudio = {
  ...bookWithPageAudio,
  fullBookAudio: "/audio/production/en-US/guided_page/sample-full-book.mp3"
};

if (guidedReadingReadAloudPolicy.independent_reading_hidden !== false) {
  failures.push("Independent reading should not enable read-aloud by default.");
}
if (getGuidedReadingReadAloudState(bookWithoutAudio, bookWithoutAudio.pages[0], "guided_support").readAloudAvailable) {
  failures.push("Book without audio should not claim read-aloud availability.");
}
if (!getGuidedReadingReadAloudState(bookWithPageAudio, bookWithPageAudio.pages[0], "guided_support").readAloudAvailable) {
  failures.push("Book with page audio should allow guided-support read-aloud.");
}
if (getGuidedReadingReadAloudState(bookWithPageAudio, bookWithPageAudio.pages[0], "independent_reading_hidden").readAloudAvailable) {
  failures.push("Independent reading hidden mode should not expose read-aloud.");
}
if (getGuidedReadingPageAudioPath(bookWithPageAudio.pages[0]) !== "/guided-reading/sample/page-001.mp3") {
  failures.push("Page audio path resolver failed.");
}
if (getGuidedReadingPageAudioPath(bookWithStalePageAudio.pages[0]) !== "") {
  failures.push("A page awaiting exact narration must not expose a stale legacy audio path.");
}
if (getGuidedReadingBookAudioPath(bookWithFullAudio) !== "") {
  failures.push("Deleted legacy full-book audio should not override replacement page narration.");
}
if (
  getGuidedReadingBookAudioPath(bookWithProductionFullAudio)
  !== "/audio/production/en-US/guided_page/sample-full-book.mp3"
) {
  failures.push("Current production book audio path resolver failed.");
}

if (failures.length) {
  console.error("Guided Reading read-aloud contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Guided Reading read-aloud contracts passed.");
