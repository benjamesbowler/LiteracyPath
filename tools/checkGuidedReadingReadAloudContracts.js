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
const bookWithFullAudio = {
  ...bookWithPageAudio,
  fullBookAudio: "/guided-reading/sample/full-book.mp3"
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
if (getGuidedReadingBookAudioPath(bookWithFullAudio) !== "/guided-reading/sample/full-book.mp3") {
  failures.push("Book audio path resolver failed.");
}

if (failures.length) {
  console.error("Guided Reading read-aloud contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Guided Reading read-aloud contracts passed.");
