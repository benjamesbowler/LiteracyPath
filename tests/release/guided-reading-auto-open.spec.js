import { test, expect } from "@playwright/test";

test("a short fullscreen book uses desktop height for its uncropped illustration", async ({ page }, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("Fullscreen declined")); });
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  await page.locator('[data-book-id="dino-pals-16-chompy-and-grumpys-day-out"]').click();
  const reader = page.locator(".guided-reader-shell");
  const spread = reader.locator(".guided-page-layout");
  await expect(reader).toHaveClass(/fullscreen/);
  await expect(spread).toHaveAttribute("data-text-layout", "short");
  await expect(reader.locator(".guided-page-text")).toHaveClass(/is-ready/);
  await expect.poll(() => reader.locator(".guided-page-image").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const geometry = await spread.evaluate(element => {
    const image = element.querySelector(".guided-page-image"), imageBox = image.getBoundingClientRect();
    const scale = Math.min(imageBox.width / image.naturalWidth, imageBox.height / image.naturalHeight);
    const text = element.querySelector(".guided-page-text"), textBox = text.getBoundingClientRect();
    return {
      paintedHeight: image.naturalHeight * scale,
      widthBoundedHeight: imageBox.width * image.naturalHeight / image.naturalWidth,
      imageBottom: imageBox.bottom, textTop: textBox.top, textBottom: textBox.bottom,
      fontSize: parseFloat(getComputedStyle(text).fontSize), fontFamily: getComputedStyle(text).fontFamily,
      wordFontFamily: getComputedStyle(text.querySelector(".guided-word")).fontFamily,
      imageFit: getComputedStyle(image).objectFit,
      textOverflow: text.scrollHeight > text.clientHeight + 1,
      pageOverflowX: document.documentElement.scrollWidth > innerWidth
    };
  });
  expect(geometry.paintedHeight).toBeGreaterThan(Math.min(1080 * .72, geometry.widthBoundedHeight * .95));
  expect(geometry.imageFit).toBe("contain");
  expect(geometry.textTop).toBeGreaterThanOrEqual(geometry.imageBottom);
  expect(geometry.textBottom).toBeLessThanOrEqual(1080);
  expect(geometry.fontSize).toBeGreaterThanOrEqual(28);
  expect(geometry.fontFamily).toContain("Andika");
  expect(geometry.wordFontFamily).toContain("Andika");
  expect(geometry.textOverflow).toBe(false);
  expect(geometry.pageOverflowX).toBe(false);
  await info.attach("short-page-geometry", { body: JSON.stringify(geometry, null, 2), contentType: "application/json" });
  await expect(reader.getByRole("button", { name: "Next page", exact: true })).toBeInViewport();
  await expect(reader.getByRole("button", { name: "Hear this page", exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath("short-page-desktop.png") });
  await reader.getByRole("button", { name: "Get reading help for Grumpy", exact: true }).click();
  await expect(reader.locator(".guided-decoding-support")).toBeVisible();
  await expect(reader.locator(".guided-decoding-support")).toBeInViewport();
  await reader.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(reader.getByRole("status", { name: "Reading progress" })).toHaveText(/Page 2 of/);
  await expect(reader.locator(".guided-decoding-support")).toHaveCount(0);
  await reader.getByRole("button", { name: "Back to Books", exact: true }).click();
  await expect(page.locator("#root")).toHaveJSProperty("inert", false);
});

for(const size of [{width:1024,height:668},{width:768,height:1024}]) {
  test(`reading from the real Books shelf fills the iPad viewport at ${size.width}x${size.height}`,async({page},info)=>{
    await page.setViewportSize(size);
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    // Exercise the Safari fallback through the same shelf/router/reader path.
    await page.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(new Error("Fullscreen declined"));});
    await page.goto("/preview/child-surfaces.html?surface=reading-library");
    const start=page.getByRole("button",{name:"Start reading",exact:true});
    await start.click();
    const reader=page.locator(".guided-reader-shell");
    await expect(reader).toHaveClass(/fullscreen/);await expect(reader).toHaveClass(/picture-book/);
    expect(await reader.boundingBox()).toEqual({x:0,y:0,...size});
    await expect(page.locator("#root")).toHaveJSProperty("inert",true);
    await expect(reader.locator(".guided-page-layout")).toHaveAttribute("data-text-layout", "short");
    await expect(reader.locator(".guided-page-text")).toHaveClass(/is-ready/);
    await expect.poll(() => reader.locator(".guided-page-image").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const fit = await reader.evaluate(element => {
      const image = element.querySelector(".guided-page-image").getBoundingClientRect();
      const text = element.querySelector(".guided-page-text");
      return { imageBottom: image.bottom, textTop: text.getBoundingClientRect().top,
        fontSize: parseFloat(getComputedStyle(text).fontSize), overflow: text.scrollHeight > text.clientHeight + 1 };
    });
    expect(fit.textTop).toBeGreaterThanOrEqual(fit.imageBottom);
    expect(fit.fontSize).toBeGreaterThanOrEqual(28);
    expect(fit.overflow).toBe(false);
    await page.screenshot({path:info.outputPath("short-page-ipad.png")});
    const next=reader.getByRole("button",{name:"Next page",exact:true});
    await next.click();await expect(reader.getByRole("status",{name:"Reading progress"})).toHaveText(/Page 2 of/);
    await reader.getByLabel("More reader controls").click();
    const line=reader.getByRole("button",{name:"Line focus",exact:true});await line.click();await expect(line).toHaveAttribute("aria-pressed","true");
    await page.keyboard.press("Escape");await expect(reader.getByLabel("More reader controls")).toBeFocused();
    await page.screenshot({path:info.outputPath("reader.png")});
    await reader.getByRole("button",{name:"Back to Books",exact:true}).click();
    await expect(reader).toHaveCount(0);await expect(page.locator("#root")).toHaveJSProperty("inert",false);
    const resume=page.getByRole("button",{name:"Keep reading",exact:true});
    await expect(resume).toBeVisible();await resume.click();await expect(reader).toHaveClass(/fullscreen/);
    await reader.getByRole("button",{name:"Back to Books",exact:true}).click();
    expect(errors).toEqual([]);
  });
}

test("long fullscreen pages retain their separate reading column", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/preview/guided-reading-preview.html?book=meadow-pals-science-01-missing-sandwich");
  const reader = page.locator(".guided-reader-shell"), spread = reader.locator(".guided-page-layout");
  await expect(reader).toHaveClass(/fullscreen/);
  await expect(spread).toHaveAttribute("data-text-layout", "long");
  const image = await spread.locator(".guided-page-image-card").boundingBox();
  const text = await spread.locator(".guided-page-reading").boundingBox();
  expect(text.x).toBeGreaterThanOrEqual(image.x + image.width);
  await expect(reader.getByRole("button", { name: "Next page", exact: true })).toBeInViewport();
});
