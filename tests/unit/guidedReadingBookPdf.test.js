import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { bookPrintOrder, createGuidedReadingBookPdf } from "../../src/utils/guidedReading/bookPdf.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";

test("A5 prints the two covers and every story page in reading order", () => {
  assert.deepEqual(bookPrintOrder(4, "a5"), [[1], [2], [3], [4], [5], [6]]);
});

test("booklets put the front and back on the outer sheet and pad inside the back cover", () => {
  assert.deepEqual(bookPrintOrder(5, "booklet"), [[7, 1], [2, null], [6, 3], [4, 5]]);
  assert.deepEqual(bookPrintOrder(6, "booklet"), [[8, 1], [2, 7], [6, 3], [4, 5]]);
  assert.deepEqual(bookPrintOrder(7, "booklet"), [[9, 1], [2, null], [null, 3], [4, null], [8, 5], [6, 7]]);
  assert.deepEqual(bookPrintOrder(8, "booklet"), [[10, 1], [2, null], [null, 3], [4, 9], [8, 5], [6, 7]]);
});

test("print export refuses an archived edition before reading media", async () => {
  const readers = {
    readFont: () => assert.fail("The exporter read a font for an archived edition."),
    readPicture: () => assert.fail("The exporter read a picture for an archived edition.")
  };
  for (const book of [
    { id: "old-edition", historicalEdition: true },
    { id: "world-discovery-d-21", title: "A Container's Journey" }
  ]) {
    await assert.rejects(createGuidedReadingBookPdf(book, readers), /unavailable to print/u);
  }
});

test("the shared science read-aloud keeps its paragraph breaks on one printed page per story page", async () => {
  const book = getRuntimeGuidedReadingBooks().find(row => row.id === "meadow-pals-science-01-missing-sandwich");
  const picture = await sharp({ create: { width: 120, height: 80, channels: 3, background: "white" } }).jpeg().toBuffer();
  const bytes = await createGuidedReadingBookPdf(book, {
    readFont: file => readFile(new URL(`../../public${file}`, import.meta.url)),
    readPicture: () => picture
  });
  const document = await PDFDocument.load(bytes);
  assert.equal(document.getTitle(), book.title);
  assert.equal(document.getPageCount(), book.pages.length + 2);
});

test("a replaced book prints its exact current full-resolution pictures through immutable delivery paths", async () => {
  const book = getRuntimeGuidedReadingBooks().find(row => row.id === "world-discovery-e-21");
  const requested = [];
  const bytes = await createGuidedReadingBookPdf(book, {
    readFont: file => readFile(new URL(`../../public${file}`, import.meta.url)),
    readPicture: async src => {
      const url = new URL(src, "https://literacy.guide");
      assert.match(url.pathname, /\.[a-f0-9]{12}\.webp$/);
      const source = await readFile(new URL(`../../public${url.pathname}`, import.meta.url));
      assert.equal(createHash("sha256").update(source).digest("hex").slice(0, 12), url.searchParams.get("v"));
      requested.push(src);
      return sharp(source).jpeg().toBuffer();
    }
  });
  assert.equal(requested.length, book.pages.length + 1, "one cover and every current story image are requested");
  const document = await PDFDocument.load(bytes);
  assert.equal(document.getTitle(), book.title);
  assert.equal(document.getPageCount(), book.pages.length + 2);
});
