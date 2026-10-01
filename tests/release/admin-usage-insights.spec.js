import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test.describe("admin on-demand usage export",()=>{
  test.describe.configure({timeout:90000});
  test("captures all pages and downloads complete pseudonymous evidence with explicit missingness",async({page})=>{
    await page.goto('/preview/app-usage-insights.html');
    await expect(page.getByRole('heading',{name:'App usage & improvement report'})).toBeVisible();
    await page.getByRole('button',{name:'Generate report',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Report ready',exact:true})).toBeVisible({timeout:60000});
    const waiting=page.waitForEvent('download');
    await page.getByRole('button',{name:'Download JSON for Codex'}).click();
    const download=await waiting;
    const body=JSON.parse(readFileSync(await download.path(),'utf8'));
    expect(body.evidence).toHaveLength(1008);expect(body.metadata.complete).toBe(true);
    expect(body.metadata.sources.find(source=>!source.available).rows).toBe(null);
    expect(body.features.find(feature=>feature.id==='books').usageStatus).toBe('not_observed');
    expect(body.features.find(feature=>feature.id==='hollow').usageStatus).toBe('no_observed_use_when_available');
    expect(body.items.find(item=>item.id==='hard-q').reviewSignal).toBe('review_lower_accuracy');
    expect(body.manifests.items.length).toBeGreaterThan(3000);
    const book=body.items.find(item=>item.area==='guided_reading'&&item.id==='gr-a-26');
    expect(book.usageStatus).toBe('observed_use');expect(book.storedCumulativeCounters.reads).toBe(2);expect(book.independentResponses).toBe(0);
    expect(book.catalog.appReadingLevel).toBe('C');expect(book.catalog.instructionalLevel).toBe('B');expect(book.catalog.lexile.status).toBe('pending');
    expect(body.popularity.find(item=>item.id==='word-climb').storedCumulativeCounters.plays).toBe(8);
    await expect(page.getByRole('heading',{name:'Most used content',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Downloaded',exact:true})).toBeDisabled();
    const calls=await page.evaluate(()=>window.__usageFixtureCalls);
    expect(calls.filter(c=>c.name==='admin_read_usage_snapshot')).toHaveLength(3);
    expect(calls.find(c=>c.name==='admin_release_usage_snapshot'&&c.args.p_download_requested)).toBeTruthy();
    await page.screenshot({path:`.artifacts/usage-insights/admin-usage-report-${test.info().project.name}.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  });
  test("missing migration and incomplete page withhold all totals",async({page})=>{
    for(const fixture of ['missing','gap']){
      await page.goto(`/preview/app-usage-insights.html?fixture=${fixture}`);
      await page.getByRole('button',{name:'Generate report',exact:true}).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByRole('button',{name:'Download JSON for Codex'})).toHaveCount(0);
    }
  });
  test("empty and expired snapshot states are accurate and remain usable on small screens",async({page})=>{
    await page.goto('/preview/app-usage-insights.html?fixture=empty');
    await page.getByRole('button',{name:'Generate report',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Report ready',exact:true})).toBeVisible({timeout:60000});
    await expect(page.getByText('No question meets the review signal criteria')).toBeVisible();
    await page.goto('/preview/app-usage-insights.html?fixture=expired');
    await page.getByRole('button',{name:'Generate report',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Report ready',exact:true})).toBeVisible({timeout:60000});
    await page.getByRole('button',{name:'Download JSON for Codex'}).click();
    await expect(page.getByRole('alert')).toContainText('no longer valid');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  });
});
