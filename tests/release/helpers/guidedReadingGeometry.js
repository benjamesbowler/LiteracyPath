import { expect } from "@playwright/test";

// Opening word help can reduce the reading area after the initial page fit.
// Check the actual printed words, including both ends of a scrolled text box.
export async function expectPrintedWordsVisible(reader) {
  await expect.poll(() => reader.evaluate(element => {
    const text = element.querySelector(".guided-page-text");
    const reader = element.getBoundingClientRect();
    const words = [...text.querySelectorAll(".guided-word")];
    return {
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      textOverflow: text.scrollHeight > text.clientHeight + 1,
      clippedWords: words.filter(word => {
        const rect = word.getBoundingClientRect();
        const clip = {
          top: Math.max(0, reader.top), bottom: Math.min(innerHeight, reader.bottom),
          left: Math.max(0, reader.left), right: Math.min(innerWidth, reader.right)
        };
        for (let parent = word.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.display !== "contents") {
            const bounds = parent.getBoundingClientRect();
            if (style.overflowX !== "visible") {
              clip.left = Math.max(clip.left, bounds.left);
              clip.right = Math.min(clip.right, bounds.right);
            }
            if (style.overflowY !== "visible") {
              clip.top = Math.max(clip.top, bounds.top);
              clip.bottom = Math.min(clip.bottom, bounds.bottom);
            }
          }
          if (parent === element) break;
        }
        return rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1
          || rect.left < clip.left - 1 || rect.right > clip.right + 1;
      }).length,
      undersizedWords: words.filter(word => parseFloat(getComputedStyle(word).fontSize) < 18).length,
      imageFit: getComputedStyle(element.querySelector(".guided-page-image")).objectFit
    };
  })).toEqual({
    horizontalOverflow: false,
    textOverflow: false,
    clippedWords: 0,
    undersizedWords: 0,
    imageFit: "contain"
  });
}
