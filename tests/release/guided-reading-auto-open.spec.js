import { test, expect } from "@playwright/test";

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
    const next=reader.getByRole("button",{name:"Next page",exact:true});
    await next.click();await expect(reader.getByRole("status",{name:"Reading progress"})).toHaveText(/Page 2 of/);
    await reader.getByLabel("More reader controls").click();
    const line=reader.getByRole("button",{name:"Line focus",exact:true});await line.click();await expect(line).toHaveAttribute("aria-pressed","true");
    await page.keyboard.press("Escape");await expect(reader.getByLabel("More reader controls")).toBeFocused();
    await page.screenshot({path:info.outputPath("reader.png")});
    await reader.getByRole("button",{name:"Exit",exact:true}).click();
    await expect(reader).toHaveCount(0);await expect(page.locator("#root")).toHaveJSProperty("inert",false);
    const resume=page.getByRole("button",{name:"Keep reading",exact:true});
    await expect(resume).toBeVisible();await resume.click();await expect(reader).toHaveClass(/fullscreen/);
    await reader.getByRole("button",{name:"Exit",exact:true}).click();
    expect(errors).toEqual([]);
  });
}
