import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1024, height: 768 }, { width: 1024, height: 700 }, { width: 768, height: 1024 }]) {
  test(`complete passages and answers fit without scrolling at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    test.setTimeout(240000);
    await page.setViewportSize(viewport);
    // This check measures real rendering, not audio delivery. Playback itself
    // has separate native-media coverage in literacy-reference-flow.spec.js.
    await page.addInitScript(() => {
      window.Audio = class extends EventTarget {
        constructor() { super(); this.readyState = 4; this.duration = .01; this.paused = true; }
        load() { this.dispatchEvent(new Event('canplay')); }
        play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 10); return Promise.resolve(); }
        pause() { clearTimeout(this.timer); this.paused = true; }
      };
    });
    await page.goto('/tests/fixtures/literacy-practice.html');
    await page.locator('[data-child-primary-action]').click();
    await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Take a break', exact: true }).click();
    const ids = await page.evaluate(async () => {
      const groups = new Map();
      for (const q of (await window.__literacy.bank()).filter(q => q.passage && ['reading', 'listening'].includes(q.literacyModality))) {
        const key = q.literacyModality + ':' + q.skillId + ':' + q.questionType;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(q);
      }
      const ids = new Set();
      for (const qs of groups.values()) {
        ids.add(qs.sort((a, b) => b.passage.length - a.passage.length)[0].id);
        ids.add(qs.sort((a, b) => JSON.stringify(b.choices).length - JSON.stringify(a.choices).length)[0].id);
      }
      ids.add('lp3.sequencing.l2.A.before_after_relation.v46');
      ids.add('lp3.key_details.l1.A.who.v43');
      return [...ids];
    });
    for (const id of ids) {
      const q = await page.evaluate(id => window.__literacy.seedQuestion(id), id);
      await page.reload();
      await page.getByRole('button', { name: 'Carry on', exact: true }).click();
      await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('[data-assessment-question-id]')).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('[data-assessment-question-id]')).toHaveCSS('opacity', '1');
      await expect(page.locator('[data-assessment-question-id]')).toHaveCSS('transform', 'none');
      const fit = await page.evaluate(() => {
        const passage = document.querySelector('.assessment-passage-card .passage');
        const required = [...document.querySelectorAll('.assessment-prompt, .assessment-passage-card, .assessment-answer-card, .map-multi-select-submit, .question-flag-controls')];
        const errors = [];
        for (const node of required) {
          const rect = node.getBoundingClientRect();
          if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) errors.push(`${node.className}: outside viewport (${rect.bottom})`);
          for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            if (/auto|scroll|hidden|clip/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight + 2) errors.push(`${ancestor.className}: overflowing ${ancestor.scrollHeight}/${ancestor.clientHeight}`);
          }
        }
        const range = document.createRange(); range.selectNodeContents(passage);
        const textRects = [...range.getClientRects()];
        const card = passage.closest('.assessment-passage-card').getBoundingClientRect();
        if (textRects.some(r => r.bottom > card.bottom || r.right > card.right || r.bottom > innerHeight)) errors.push('passage text clipped');
        return { errors: [...new Set(errors)], text: passage.textContent, font: parseFloat(getComputedStyle(passage).fontSize), count: document.querySelectorAll('.assessment-answer-card:not(.map-multi-select-submit)').length,
          geometry: [...document.querySelectorAll('.literacy-practice-play, .assessment-shell, .assessment-topbar, .assessment-question-layout, .assessment-stimulus, .comprehension-choice-list, .question-flag-controls')].map(n => ({ class: n.className, top: n.getBoundingClientRect().top, bottom: n.getBoundingClientRect().bottom, scroll: n.scrollHeight, client: n.clientHeight, flex: getComputedStyle(n).flex, height: getComputedStyle(n).height, minHeight: getComputedStyle(n).minHeight, overflow: getComputedStyle(n).overflowY })) };
      });
      if (fit.errors.length || id.includes('before_after_relation.v46')) await page.screenshot({ path: info.outputPath(id.replaceAll(':', '-') + '.png') });
      if (fit.errors.length) console.log(JSON.stringify(fit.geometry));
      expect(fit.errors, id).toEqual([]);
      expect(fit.text, id).toBe(q.passage);
      expect(fit.font, id).toBeGreaterThanOrEqual(19);
      expect(fit.count, id).toBe(q.choices.length);
      await page.getByRole('button', { name: 'Take a break', exact: true }).click();
    }
    console.log(JSON.stringify({ viewport, passagesChecked: ids.length }));
  });
}
