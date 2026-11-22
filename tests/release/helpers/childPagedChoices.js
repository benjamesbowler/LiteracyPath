import { expect } from "@playwright/test";
import { STUDENT_MINIMUM_TARGET_PX } from "../../../src/policy/studentDeviceMatrix.js";

export async function expectInChildPane(controls, { touch = true } = {}) {
  await expect(controls.first()).toBeVisible();
  const result = await controls.evaluateAll((nodes, { touch, minimum }) => nodes.map(node => {
    const box = node.getBoundingClientRect();
    const pane = node.closest(".kg-main")?.getBoundingClientRect();
    const label = node.getAttribute("aria-label") || node.textContent.trim();
    const fits = bounds => box.left >= bounds.left - 1 && box.right <= bounds.right + 1
      && box.top >= bounds.top - 1 && box.bottom <= bounds.bottom + 1;
    const clipping = [];
    if (!fits({ left: 0, top: 0, right: innerWidth, bottom: innerHeight })) clipping.push("viewport");
    if (pane && !fits(pane)) clipping.push("learner pane");
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      const { overflowY } = getComputedStyle(parent);
      if (/^(auto|scroll|clip|hidden)$/.test(overflowY) && !fits(parent.getBoundingClientRect())) clipping.push(parent.className || parent.tagName);
    }
    const disabled = node.matches(":disabled, [aria-disabled=true]");
    const point = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    const usable = touch ? box.width >= minimum - 1 && box.height >= minimum - 1 && (disabled || node.contains(point)) : box.width > 0 && box.height > 0;
    return { label, clipping, usable, box: [box.x, box.y, box.width, box.height], point: point?.className };
  }), { touch, minimum: STUDENT_MINIMUM_TARGET_PX });
  expect(result.length, "there are items to check").toBeGreaterThan(0);
  expect(result.filter(item => item.clipping.length || !item.usable)).toEqual([]);
}

export async function expectPagedChoices(surface, cards, { pagerLabel, expectedCount, key = "aria-label", returnToFirst = true, titleSelector }) {
  await expect(cards.first()).toBeVisible();
  const pager = surface.getByRole("navigation", { name: pagerLabel, exact: true });
  const previous = pager.getByRole("button", { name: "Previous", exact: true });
  const next = pager.getByRole("button", { name: "Next", exact: true });
  const choices = [];
  const pageCount = await pager.count()
    ? Number((await pager.getByRole("status").textContent()).match(/ of (\d+)$/)[1])
    : 1;
  for (let index = 0; index < pageCount; index++) {
    await expectInChildPane(cards);
    if (titleSelector) expect(await cards.evaluateAll((nodes, selector) => nodes.filter(node => {
      const label = node.querySelector(selector);
      const box = node.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(label);
      return [...range.getClientRects()].some(rect => rect.top < box.top - 1 || rect.bottom > box.bottom + 1
        || rect.left < box.left - 1 || rect.right > box.right + 1);
    }).map(node => node.textContent.trim()), titleSelector)).toEqual([]);
    for (const card of await cards.all()) await expect(card).toBeEnabled();
    choices.push(...await cards.evaluateAll((nodes, attribute) => nodes.map(node => node.getAttribute(attribute) || node.textContent.trim()), key));
    if (pageCount > 1) {
      await expectInChildPane(pager.getByRole("button"));
      await expect(pager.getByRole("status")).toHaveText(`Page ${index + 1} of ${pageCount}`);
      if (index < pageCount - 1) await next.click();
    }
  }
  expect(choices.length).toBe(expectedCount);
  expect(new Set(choices).size, "each choice occurs on just one page").toBe(expectedCount);
  if (returnToFirst && pageCount > 1) {
    while (await previous.isEnabled()) await previous.click();
    await expect(pager.getByRole("status")).toHaveText(`Page 1 of ${pageCount}`);
    await previous.blur();
  }
  expect(await surface.evaluate(node => window.scrollY === 0 && node.closest(".kg-main")?.scrollTop === 0)).toBe(true);
  return choices;
}
