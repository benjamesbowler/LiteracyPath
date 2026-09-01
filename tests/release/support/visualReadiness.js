import { expect } from "@playwright/test";

export async function expectVisibleImagesReady(page, state) {
  await expect.poll(async () => page.locator("img").evaluateAll(async images => {
    const visibleImages = images.filter(image => {
      const rect = image.getBoundingClientRect();
      let visibleLeft = Math.max(0, rect.left);
      let visibleTop = Math.max(0, rect.top);
      let visibleRight = Math.min(window.innerWidth, rect.right);
      let visibleBottom = Math.min(window.innerHeight, rect.bottom);
      let ancestor = image.parentElement;

      while (ancestor && visibleRight > visibleLeft && visibleBottom > visibleTop) {
        const style = getComputedStyle(ancestor);
        const clipsX = /(auto|hidden|scroll|clip)/.test(style.overflowX);
        const clipsY = /(auto|hidden|scroll|clip)/.test(style.overflowY);
        if (clipsX || clipsY) {
          const ancestorRect = ancestor.getBoundingClientRect();
          if (clipsX) {
            visibleLeft = Math.max(visibleLeft, ancestorRect.left);
            visibleRight = Math.min(visibleRight, ancestorRect.right);
          }
          if (clipsY) {
            visibleTop = Math.max(visibleTop, ancestorRect.top);
            visibleBottom = Math.min(visibleBottom, ancestorRect.bottom);
          }
        }
        ancestor = ancestor.parentElement;
      }

      return rect.width > 0
        && rect.height > 0
        && visibleRight > visibleLeft
        && visibleBottom > visibleTop;
    });

    const readiness = await Promise.all(visibleImages.map(async image => {
      const src = image.currentSrc || image.src;
      if (!image.complete || image.naturalWidth < 1 || image.naturalHeight < 1) {
        return {
          src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight
        };
      }
      try {
        await image.decode?.();
        return null;
      } catch (error) {
        return { src, decodeError: String(error) };
      }
    }));

    return readiness.filter(Boolean);
  }), {
    message: `${state} waits for every visible image to load and decode`
  }).toEqual([]);
}
