import fontkit from "@pdf-lib/fontkit";
import { Duplex, PDFDocument, PrintScaling, rgb } from "pdf-lib";
import { isGuidedReadingAssetDeleted, isGuidedReadingBookDeleted } from "../../data/deletedMediaManifest.js";
import { bookPrintMetadata } from "./bookPrintMetadata.js";
import { GUIDED_READING_TOPIC_EDITIONS } from "./editions.js";
import { withRepairedGuidedReadingImageVersion } from "./mediaVersion.js";
import { getAnalysisPages } from "./textMetrics.js";

const mm = value => value * 72 / 25.4;
const A5 = [mm(148), mm(210)];
const A4_LANDSCAPE = [mm(297), mm(210)];
const MARGIN = 28;
const CONTENT_WIDTH = A5[0] - MARGIN * 2;
const PAPER_HEIGHT = A5[1];
const INK = rgb(0.09, 0.16, 0.23);
const MUTED = rgb(0.28, 0.34, 0.40);
const LINE = rgb(0.78, 0.81, 0.83);
const PALE = rgb(0.96, 0.97, 0.97);
const COPYRIGHT = "Copyright © 2026 Literacy Guide";
const FONTS = [400, 700].map(weight => `/fonts/present/andika-latin-${weight}-normal.ttf`);

function accentFor(book) {
  if (book.readingMode === "decodable") return rgb(0.12, 0.38, 0.36);
  if (book.readingMode === "supported-read-together") return rgb(0.39, 0.25, 0.50);
  return book.type === "nonfiction" ? rgb(0.15, 0.34, 0.55) : rgb(0.58, 0.28, 0.17);
}

// Logical page numbers include both covers. Booklet padding goes inside the
// back cover so the outside of the folded last leaf is always the back cover.
export function bookPrintOrder(storyPageCount, format) {
  if (!Number.isInteger(storyPageCount) || storyPageCount < 1) throw new Error("This book has no printable pages.");
  if (format !== "a5" && format !== "booklet") throw new Error("Choose a PDF paper format.");
  const last = storyPageCount + 2;
  const pages = Array.from({ length: last }, (_, index) => index + 1);
  if (format === "a5") return pages.map(number => [number]);
  const padding = (4 - last % 4) % 4;
  pages.splice(last - 1, 0, ...Array(padding).fill(null));
  const sides = [];
  for (let outer = 0; outer < pages.length / 2; outer += 2) {
    const inner = pages.length - 1 - outer;
    sides.push([pages[inner], pages[outer]], [pages[outer + 1], pages[inner - 1]]);
  }
  return sides;
}

function wrapText(text, font, size, width) {
  return String(text).split(/\r?\n/u).flatMap(paragraph => {
    const lines = [];
    let line = "";
    for (const word of paragraph.trim().split(/\s+/u)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, size) > width) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    return [...lines, line];
  });
}

function fitText(text, font, { width = CONTENT_WIDTH, height, largest, smallest = largest, leading = 1.28 }) {
  for (let size = largest; size >= smallest; size -= 0.5) {
    const lines = wrapText(text, font, size, width);
    const lineHeight = size * leading;
    const advances = lines.map(line => line ? lineHeight : size * 0.42);
    const totalHeight = advances.reduce((total, advance) => total + advance, 0);
    if (totalHeight <= height && lines.every(line => font.widthOfTextAtSize(line, size) <= width)) {
      return { lines, size, advances, height: totalHeight };
    }
  }
  throw new Error("A page could not fit at a readable print size.");
}

function panel(page, offset) {
  return {
    text(text, x, top, { font, size, color = INK, center = false }) {
      const start = center ? x - font.widthOfTextAtSize(text, size) / 2 : x;
      page.drawText(text, { x: offset + start, y: PAPER_HEIGHT - top - size, size, font, color });
    },
    rule(top, color = LINE, thickness = 0.65) {
      const y = PAPER_HEIGHT - top;
      page.drawLine({ start: { x: offset + MARGIN, y }, end: { x: offset + A5[0] - MARGIN, y }, color, thickness });
    },
    rect(x, top, width, height, color) {
      page.drawRectangle({ x: offset + x, y: PAPER_HEIGHT - top - height, width, height, color });
    },
    picture(image, x, top, width, height) {
      const scale = Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      page.drawImage(image, {
        x: offset + x + (width - drawWidth) / 2,
        y: PAPER_HEIGHT - top - (height + drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
      });
    }
  };
}

function putLines(surface, layout, top, { x = MARGIN, ...style }) {
  let lineTop = top;
  layout.lines.forEach((line, index) => {
    if (line) surface.text(line, x, lineTop, { ...style, size: layout.size });
    lineTop += layout.advances[index];
  });
}

function drawFront(surface, book, guide, cover, fonts, accent) {
  const { regular, bold } = fonts;
  surface.text("LITERACY GUIDE", MARGIN, 32, { font: bold, size: 10, color: accent });
  surface.rule(54, accent, 1.7);
  const series = book.seriesTitle || book.collection;
  const showSeries = series && !book.title.toLowerCase().startsWith(series.toLowerCase());
  if (showSeries) surface.text(series, MARGIN, 67, { font: regular, size: 12, color: MUTED });
  const titleTop = showSeries ? 91 : 72;
  const title = fitText(book.title, bold, { height: 136, largest: 40, smallest: 22, leading: 1.16 });
  putLines(surface, title, titleTop, { font: bold });
  const pictureTop = titleTop + title.height + 19;
  surface.rect(MARGIN, pictureTop, CONTENT_WIDTH, 516 - pictureTop, PALE);
  surface.picture(cover, MARGIN + 5, pictureTop + 5, CONTENT_WIDTH - 10, 506 - pictureTop);
  surface.rule(532);
  surface.text(`${guide.levelLabel} · ${guide.modeLabel}`, MARGIN, 542, { font: bold, size: 13, color: accent });
}

function drawStory(surface, story, image, index, count, guide, fonts) {
  const { regular, bold } = fonts;
  const level = /App level ([A-H])$/u.exec(guide.levelLabel)?.[1];
  const size = { A: 30, B: 28, C: 26, D: 24, E: 22, F: 21, G: 20, H: 20 }[level] || 21;
  const height = story.text.includes("\n") ? 270 : 221;
  const layout = fitText(story.text, regular, { height, largest: size, smallest: 17, leading: 1.29 });
  const artWidth = CONTENT_WIDTH;
  const artHeight = Math.min(363, 477 - layout.height, artWidth * image.height / image.width);
  const contentHeight = artHeight + 22 + layout.height;
  const top = 38 + Math.min(52, (502 - contentHeight) / 3);
  surface.picture(image, MARGIN, top, artWidth, artHeight);
  putLines(surface, layout, top + artHeight + 22, { font: regular });
  surface.rule(547);
  surface.text(`${index}/${count}`, A5[0] / 2, 555, { font: bold, size: 9.5, color: MUTED, center: true });
}

function drawBack(surface, guide, fonts, accent) {
  const { regular, bold } = fonts;
  surface.text("LITERACY GUIDE", MARGIN, 32, { font: bold, size: 10, color: accent });
  surface.rule(54, accent, 1.7);
  surface.text("Before you read", MARGIN, 68, { font: bold, size: 30 });
  surface.text(`${guide.levelLabel} · ${guide.modeLabel}`, MARGIN, 111, { font: regular, size: 12, color: MUTED });

  let top = 152;
  function section(title, paragraphs) {
    if (!paragraphs.length) return;
    surface.text(title, MARGIN, top, { font: bold, size: 14, color: accent });
    top += 23;
    for (const text of paragraphs) {
      const layout = fitText(text, regular, { height: 80, largest: 13, smallest: 11.5 });
      putLines(surface, layout, top, { font: regular });
      top += layout.height + 3;
    }
    top += 15;
  }
  section("High-frequency words", [guide.highFrequencyWords.join(", ")].filter(Boolean));
  section("Phonics to practise", guide.phonics.map(({ label, words }) =>
    words.length ? `${label} — ${words.join(", ")}` : label));
  section("Teach first", [guide.teachFirstWords.join(", ")].filter(Boolean));
  section("Reading preparation", guide.prerequisites);

  if (top > 526) throw new Error("The reading guidance could not fit on the back cover.");
  surface.rule(532);
  surface.text(COPYRIGHT, MARGIN, 545, { font: bold, size: 11, color: MUTED });
  surface.text("literacy.guide", MARGIN, 562, { font: regular, size: 10, color: MUTED });
}

async function loadFont(path, signal) {
  const response = await fetch(path, { signal, credentials: "omit" });
  if (!response.ok) throw new Error("The print font could not download.");
  return response.arrayBuffer();
}

async function loadPicture(path, signal) {
  const response = await fetch(path, { signal, credentials: "omit" });
  if (!response.ok) throw new Error("A book illustration could not download.");
  const source = await response.blob();
  if (!source.type.startsWith("image/")) throw new Error("A book illustration is unavailable.");
  const url = URL.createObjectURL(source);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    signal?.throwIfAborted();
    const scale = Math.min(1, 1440 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const jpg = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("A book illustration could not be prepared.")), "image/jpeg", 0.92);
    });
    return jpg.arrayBuffer();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function printAsset(path, bookId, pageNumber) {
  if (typeof path !== "string" || !path.startsWith("/guided-reading/")
    || isGuidedReadingAssetDeleted({ bookId, path, pageNumber })) return "";
  return withRepairedGuidedReadingImageVersion(path);
}

export async function createGuidedReadingBookPdf(book, {
  format = "a5", signal, onProgress = () => {}, readFont = loadFont, readPicture = loadPicture
} = {}) {
  signal?.throwIfAborted();
  if (!book?.id || book.historicalEdition || isGuidedReadingBookDeleted(book.id)
    || book.title === GUIDED_READING_TOPIC_EDITIONS[book.id]?.retiredTitle) {
    throw new Error("This edition is unavailable to print.");
  }
  const pages = getAnalysisPages(book).filter(page =>
    !isGuidedReadingAssetDeleted({ bookId: book.id, path: page.image, pageNumber: page.pageNumber }));
  const order = bookPrintOrder(pages.length, format);
  const guide = bookPrintMetadata({ ...book, pages });
  const pagePictures = pages.map(page => printAsset(page.image, book.id, page.pageNumber));
  if (pagePictures.some(path => !path)) throw new Error("A current book illustration is unavailable.");
  const cover = printAsset(book.coverImage, book.id, 0) || pagePictures[0];
  const sources = [...new Set([cover, ...pagePictures])];

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await Promise.all(FONTS.map(path => readFont(path, signal)));
  // Keep the printed letter forms separate and the selectable text literal.
  const [regular, bold] = await Promise.all(fontBytes.map(bytes =>
    pdf.embedFont(bytes, { features: { liga: false, clig: false, dlig: false } })));
  const fonts = { regular, bold };
  pdf.setTitle(book.title, { showInWindowTitleBar: true });
  pdf.setAuthor("Literacy Guide");
  pdf.setCreator("Literacy Guide");
  pdf.setSubject(`${guide.levelLabel} · ${format === "booklet" ? "A4 folding booklet" : "A5 reading pages"}`);
  const preferences = pdf.catalog.getOrCreateViewerPreferences();
  preferences.setPrintScaling(PrintScaling.None);
  if (format === "booklet") preferences.setDuplex(Duplex.DuplexFlipShortEdge);
  const pictures = new Map();
  let completed = 0;
  onProgress({ completed, total: sources.length });
  for (let index = 0; index < sources.length; index += 3) {
    await Promise.all(sources.slice(index, index + 3).map(async path => {
      signal?.throwIfAborted();
      pictures.set(path, await pdf.embedJpg(await readPicture(path, signal)));
      signal?.throwIfAborted();
      onProgress({ completed: ++completed, total: sources.length });
    }));
  }

  const accent = accentFor(book);
  for (const side of order) {
    signal?.throwIfAborted();
    const sheet = pdf.addPage(format === "booklet" ? A4_LANDSCAPE : A5);
    const panelWidth = sheet.getWidth() / side.length;
    if (side.length === 2) {
      for (const y of [9, PAPER_HEIGHT - 15]) {
        sheet.drawLine({ start: { x: panelWidth, y }, end: { x: panelWidth, y: y + 6 }, color: LINE, thickness: 0.65 });
      }
    }
    side.forEach((number, index) => {
      if (number === null) return;
      const surface = panel(sheet, index * panelWidth + (panelWidth - A5[0]) / 2);
      if (number === 1) drawFront(surface, book, guide, pictures.get(cover), fonts, accent);
      else if (number === pages.length + 2) drawBack(surface, guide, fonts, accent);
      else drawStory(surface, pages[number - 2], pictures.get(pagePictures[number - 2]), number - 1, pages.length, guide, fonts);
    });
  }
  return pdf.save();
}

export async function downloadGuidedReadingBookPdf(book, options = {}) {
  const bytes = await createGuidedReadingBookPdf(book, options);
  options.signal?.throwIfAborted();
  const title = book.title.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/gu, "");
  const format = options.format === "booklet" ? "A4-booklet" : "A5-pages";
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `Literacy-Guide-${title}-${format}.pdf`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  }
}
