import { expect } from "@playwright/test";

export async function readBookShelf(page, inspectPage) {
  const surface = page.locator(".kg-books");
  const pages = Number(await surface.getAttribute("data-book-pages"));
  const cards = surface.locator("[data-book-id]");
  const next = surface.getByRole("navigation", { name: "Books pages" }).getByRole("button", { name: "Next", exact: true });
  const books = [];
  for (let index = 1; index <= pages; index++) {
    await expect(surface).toHaveAttribute("data-book-page", String(index));
    books.push(...await cards.evaluateAll(nodes => nodes.map(node => ({
      id: node.dataset.bookId, level: node.querySelector("[data-book-level]").dataset.bookLevel
    }))));
    if (inspectPage) await inspectPage(cards);
    if (index < pages) {
      await expect(next).toBeInViewport({ ratio: 1 });
      await next.click();
    }
  }
  return books;
}
