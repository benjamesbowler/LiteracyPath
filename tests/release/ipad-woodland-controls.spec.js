import {test,expect} from '@playwright/test';

for(const chapter of ['rounded','woodland'])for(const size of [{width:1024,height:668},{width:768,height:1024},{width:320,height:568},{width:568,height:320}]){
  test(`${chapter} movement uses two independent thumb zones at ${size.width}x${size.height}`,async({browser},info)=>{
    test.setTimeout(60_000);
    const context=await browser.newContext({baseURL:info.project.use.baseURL,viewport:size,hasTouch:true});
    const page=await context.newPage();
    try{
      await page.goto('/preview/child-surfaces.html?surface=sound-seekers');
      if(chapter==='woodland')await page.getByRole('button',{name:'Woodland Homecoming',exact:true}).click();
      await page.locator('[data-child-primary]').click();
      const root=page.locator(chapter==='rounded'?'.rc-game':'.sound-seekers-woodland');
      const controls=root.locator(chapter==='rounded'?'.rc-movement button':'.dpad .direction');await expect(controls).toHaveCount(4);
      const left=await root.getByRole('button',{name:'Move left',exact:true}).boundingBox();
      const right=await root.getByRole('button',{name:'Move right',exact:true}).boundingBox();
      const up=await root.getByRole('button',{name:'Move up',exact:true}).boundingBox();
      expect(right.x+right.width).toBeLessThan(size.width/2);expect(right.x-left.x-left.width).toBeGreaterThanOrEqual(8);
      expect(up.x).toBeGreaterThan(size.width/2);
      for(const button of await root.locator(chapter==='rounded'?'.rc-movement button,.rc-explore-footer>.rc-primary':'.dpad button,.world-action').all()){
        const box=await button.boundingBox(),floor=size.width>=768&&size.height>420?72:56;
        expect(box.width).toBeGreaterThanOrEqual(floor);expect(box.height).toBeGreaterThanOrEqual(floor);
        expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x+box.width).toBeLessThanOrEqual(size.width);expect(box.y+box.height).toBeLessThanOrEqual(size.height);
        expect(await button.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
      }
      if(size.width===1024){
        const world=root.locator(chapter==='rounded'?'.rc-landscape canvas':'.world');
        await expect(world).toHaveAttribute('data-player-x',/./);
        const start=await world.evaluate(n=>({x:Number(n.dataset.playerX),z:Number(n.dataset.playerZ)}));
        const client=await context.newCDPSession(page);
        await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:left.x+left.width/2,y:left.y+left.height/2},{id:2,x:up.x+up.width/2,y:up.y+up.height/2}]});
        await expect.poll(()=>world.evaluate((n,start)=>Math.hypot(Number(n.dataset.playerX)-start.x,Number(n.dataset.playerZ)-start.z),start)).toBeGreaterThan(.3);
        const both=await world.evaluate(n=>({x:Number(n.dataset.playerX),z:Number(n.dataset.playerZ)}));
        await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:2,x:up.x+up.width/2,y:up.y+up.height/2}]});
        await expect.poll(()=>world.evaluate((n,both)=>Math.hypot(Number(n.dataset.playerX)-both.x,Number(n.dataset.playerZ)-both.z),both)).toBeGreaterThan(.2);
        await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
        await page.waitForTimeout(400);
        const stopped=await world.evaluate(n=>[n.dataset.playerX,n.dataset.playerZ]);await page.waitForTimeout(400);
        expect(await world.evaluate(n=>[n.dataset.playerX,n.dataset.playerZ])).toEqual(stopped);
        if(chapter==='rounded'){
          const beforeTap=await world.evaluate(n=>({x:Number(n.dataset.playerX),z:Number(n.dataset.playerZ)}));
          await root.getByRole('button',{name:'Move left',exact:true}).click();
          await expect.poll(()=>world.evaluate((n,p)=>Math.hypot(Number(n.dataset.playerX)-p.x,Number(n.dataset.playerZ)-p.z),beforeTap)).toBeGreaterThan(.05);
          await root.getByRole('button',{name:'Move right',exact:true}).focus();
          const beforeKeyboardTap=await world.evaluate(n=>({x:Number(n.dataset.playerX),z:Number(n.dataset.playerZ)}));
          await page.keyboard.press('Enter');
          await expect.poll(()=>world.evaluate((n,p)=>Math.hypot(Number(n.dataset.playerX)-p.x,Number(n.dataset.playerZ)-p.z),beforeKeyboardTap)).toBeGreaterThan(.05);
          await page.waitForTimeout(400);
          const afterKeyboardTap=await world.evaluate(n=>[n.dataset.playerX,n.dataset.playerZ]);
          await page.waitForTimeout(400);
          expect(await world.evaluate(n=>[n.dataset.playerX,n.dataset.playerZ])).toEqual(afterKeyboardTap);
        }
      }
      await page.screenshot({path:info.outputPath('woodland-controls.png')});
    }finally{await context.close();}
  });
}
