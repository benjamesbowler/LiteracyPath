#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const auditPath = path.join(repoRoot, "docs/guided-reading/guided_reading_image_text_artifact_audit.md");
const auditJsonPath = path.join(repoRoot, "docs/guided-reading/guided_reading_image_text_artifact_audit.json");
const contactSheetPath = path.join(repoRoot, "docs/guided-reading/image_text_artifact_contact_sheet.md");
const replacementRequestPath = path.join(repoRoot, "docs/assets/kimi_guided_reading_image_replacement_request.md");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const REPLACEMENT_TERMS = /\b(random|nonsense|watermark|misspell|incorrect|unrelated|artifact|bad text|fake letters|replace|broken)\b/i;
const MANUAL_REVIEW_TERMS = /\b(sign|label|caption|poster|book cover|title text|text)\b/i;

function ensureDir(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function publicUrlToFile(publicUrl = "") {
  if (!publicUrl || /^https?:\/\//i.test(publicUrl)) return "";
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(publicRoot, clean);
}

function walkImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkImages(fullPath);
    if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return [fullPath];
    return [];
  });
}

function imageMetadata(filePath) {
  if (!filePath || !existsSync(filePath)) return {};
  const stats = statSync(filePath);
  return {
    bytes: stats.size,
    format: path.extname(filePath).replace(".", "").toUpperCase()
  };
}

function hasTesseract() {
  try {
    execFileSync("tesseract", ["--version"], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

function collectReferences() {
  return guidedReadingBooks.flatMap(book => {
    const references = [];
    if (book.coverImage || book.cover || book.coverUrl) {
      references.push({
        bookId: book.id,
        title: book.title,
        level: book.level,
        type: book.type,
        kind: "cover",
        pageNumber: "",
        imagePath: book.coverImage || book.cover || book.coverUrl,
        intendedText: book.title,
        qaStatus: book.qaStatus || "",
        qaNotes: book.qaNotes || "Cover should match the book title and avoid extra text."
      });
    }
    (book.pages || []).forEach((page, index) => {
      if (!page.image) return;
      references.push({
        bookId: book.id,
        title: book.title,
        level: book.level,
        type: book.type,
        kind: "page",
        pageNumber: page.pageNumber || index + 1,
        imagePath: page.image,
        intendedText: page.text || "",
        embeddedImageText: page.embeddedImageText || "",
        qaStatus: page.qaStatus || book.qaStatus || "",
        qaNotes: page.qaNotes || "",
        imageAlt: page.imageAlt || page.pageDescription || ""
      });
    });
    return references;
  });
}

function classify(reference, ocrAvailable) {
  const filePath = publicUrlToFile(reference.imagePath);
  const exists = Boolean(filePath && existsSync(filePath));
  const textEvidence = [
    reference.embeddedImageText,
    reference.qaStatus,
    reference.qaNotes,
    reference.imageAlt
  ].filter(Boolean).join(" ");

  const issues = [];
  let status = "LIKELY_CLEAN_METADATA";
  let action = "Keep, but spot-check visually during normal QA.";

  if (!exists) {
    issues.push("broken_reference");
    return { status: "BROKEN_REFERENCE", issues, action: "Replace or restore missing image file.", filePath, metadata: {} };
  }

  if (Number(statSync(filePath).size) === 0) {
    issues.push("zero_byte_file");
    return { status: "NEEDS_REPLACEMENT", issues, action: "Regenerate image; current file is empty.", filePath, metadata: imageMetadata(filePath) };
  }

  if (reference.embeddedImageText) {
    issues.push("embedded_text_declared");
    status = REPLACEMENT_TERMS.test(reference.embeddedImageText) ? "NEEDS_REPLACEMENT" : "NEEDS_HUMAN_REVIEW";
    action = "Review declared embedded text against the intended page text.";
  }

  if (REPLACEMENT_TERMS.test(textEvidence)) {
    issues.push("metadata_mentions_text_artifact");
    status = "NEEDS_REPLACEMENT";
    action = "Request a clean replacement image with no random embedded text.";
  } else if (status === "LIKELY_CLEAN_METADATA" && MANUAL_REVIEW_TERMS.test(textEvidence) && !/no embedded image text/i.test(textEvidence)) {
    issues.push("possible_intended_text_or_label");
    status = "NEEDS_HUMAN_REVIEW";
    action = "Human should verify that any visible text is intentional and correct.";
  }

  if (!ocrAvailable && status === "LIKELY_CLEAN_METADATA") {
    issues.push("ocr_not_available_spot_check");
  }

  return { status, issues, action, filePath, metadata: imageMetadata(filePath) };
}

function markdownTable(rows, columns) {
  if (!rows.length) return "_None._";
  const header = `| ${columns.map(column => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(row => `| ${columns.map(column => String(column.value(row) ?? "").replace(/\n/g, " ").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function main() {
  const ocrAvailable = hasTesseract();
  const references = collectReferences();
  const physicalImages = walkImages(path.join(publicRoot, "guided-reading"));
  const items = references.map(reference => ({
    ...reference,
    ...classify(reference, ocrAvailable)
  }));

  const replacementItems = items.filter(item => item.status === "NEEDS_REPLACEMENT" || item.status === "BROKEN_REFERENCE");
  const manualReviewItems = items.filter(item => item.status === "NEEDS_HUMAN_REVIEW");
  const likelyCleanItems = items.filter(item => item.status === "LIKELY_CLEAN_METADATA");
  const brokenItems = items.filter(item => item.status === "BROKEN_REFERENCE");
  const booksWithIssues = new Map();
  [...replacementItems, ...manualReviewItems, ...brokenItems].forEach(item => {
    const previous = booksWithIssues.get(item.bookId) || { bookId: item.bookId, title: item.title, replacement: 0, manualReview: 0, broken: 0 };
    if (item.status === "NEEDS_REPLACEMENT") previous.replacement += 1;
    if (item.status === "NEEDS_HUMAN_REVIEW") previous.manualReview += 1;
    if (item.status === "BROKEN_REFERENCE") previous.broken += 1;
    booksWithIssues.set(item.bookId, previous);
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    ocrAvailable,
    totalBooksScanned: guidedReadingBooks.length,
    totalReferencedImagesScanned: items.length,
    totalPhysicalGuidedReadingImages: physicalImages.length,
    likelyCleanCount: likelyCleanItems.length,
    needsManualReviewCount: manualReviewItems.length,
    needsReplacementCount: replacementItems.length,
    brokenReferenceCount: brokenItems.length
  };

  ensureDir(auditPath);
  const auditLines = [
    "# Guided Reading Image Text Artifact Audit",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "This audit checks Guided Reading cover/page image references for missing files and metadata that suggests embedded text artifacts. OCR is optional; this environment does not treat an image as visually clean unless either metadata explicitly says no embedded text or a human reviews it.",
    "",
    "## Summary",
    "",
    markdownTable([summary], [
      { label: "Books", value: row => row.totalBooksScanned },
      { label: "Referenced images", value: row => row.totalReferencedImagesScanned },
      { label: "Physical images", value: row => row.totalPhysicalGuidedReadingImages },
      { label: "Likely clean by metadata", value: row => row.likelyCleanCount },
      { label: "Needs manual review", value: row => row.needsManualReviewCount },
      { label: "Needs replacement", value: row => row.needsReplacementCount },
      { label: "Broken references", value: row => row.brokenReferenceCount },
      { label: "OCR available", value: row => row.ocrAvailable ? "yes" : "no" }
    ]),
    "",
    "## Books With Image QA Issues",
    "",
    markdownTable([...booksWithIssues.values()].slice(0, 200), [
      { label: "Book ID", value: row => row.bookId },
      { label: "Title", value: row => row.title },
      { label: "Replacement", value: row => row.replacement },
      { label: "Manual review", value: row => row.manualReview },
      { label: "Broken", value: row => row.broken }
    ]),
    "",
    "## Images Needing Replacement Or Broken Reference",
    "",
    markdownTable(replacementItems, [
      { label: "Book ID", value: row => row.bookId },
      { label: "Title", value: row => row.title },
      { label: "Page/Cover", value: row => row.kind === "cover" ? "cover" : `page ${row.pageNumber}` },
      { label: "Image", value: row => row.imagePath },
      { label: "Issue", value: row => row.issues.join(", ") },
      { label: "Action", value: row => row.action }
    ]),
    "",
    "## Manual Review Queue",
    "",
    manualReviewItems.length
      ? "These images are not automatically rejected, but the metadata suggests intended labels/text or another text-sensitive context. Review the contact sheet before requesting replacements."
      : "No manual-review-only image text risks were detected from metadata.",
    "",
    markdownTable(manualReviewItems.slice(0, 200), [
      { label: "Book ID", value: row => row.bookId },
      { label: "Title", value: row => row.title },
      { label: "Page/Cover", value: row => row.kind === "cover" ? "cover" : `page ${row.pageNumber}` },
      { label: "Image", value: row => row.imagePath },
      { label: "Issue", value: row => row.issues.join(", ") },
      { label: "Notes", value: row => row.qaNotes || row.imageAlt || "" }
    ]),
    "",
    "## Method Notes",
    "",
    "- Missing and zero-byte files are treated as replacement/blocking issues.",
    "- `embeddedImageText` metadata is treated as text evidence and requires review unless clearly clean.",
    "- Existing `qaNotes` that explicitly say `No embedded image text` are treated as likely clean by metadata.",
    "- Because OCR is not available here, this audit creates a contact sheet for visual spot-checking instead of pretending to hear/see text perfectly."
  ];
  writeFileSync(auditPath, `${auditLines.join("\n")}\n`);

  ensureDir(auditJsonPath);
  writeFileSync(auditJsonPath, `${JSON.stringify({ summary, items }, null, 2)}\n`);

  const contactRows = [...replacementItems, ...manualReviewItems].slice(0, 120);
  const contactLines = [
    "# Guided Reading Image Text Artifact Contact Sheet",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    contactRows.length
      ? "Review these images first. Markdown image previews use the current public asset path."
      : "No replacement/manual-review candidates were detected from metadata. Use the full audit for counts and method notes.",
    "",
    ...contactRows.flatMap(item => [
      `## ${item.title} · ${item.kind === "cover" ? "cover" : `page ${item.pageNumber}`}`,
      "",
      `![${item.title} ${item.kind}](${item.imagePath})`,
      "",
      `- Book ID: ${item.bookId}`,
      `- Status: ${item.status}`,
      `- Issues: ${item.issues.join(", ") || "none"}`,
      `- Intended text: ${item.intendedText || "none"}`,
      `- Notes: ${item.qaNotes || item.imageAlt || "none"}`,
      ""
    ])
  ];
  ensureDir(contactSheetPath);
  writeFileSync(contactSheetPath, `${contactLines.join("\n")}\n`);

  const replacementLines = [
    "# Kimi Guided Reading Image Replacement Request",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "Use this request only for images that are missing, broken, or confirmed/strongly suspected to contain random embedded text or incorrect text.",
    "",
    "## Style Requirements",
    "",
    "- Normal natural-colored kindergarten cartoon.",
    "- Clean educational illustration.",
    "- No random text, fake letters, watermarks, nonsense signs, AI artifact text, or unrelated labels.",
    "- No babyfied object faces.",
    "- Simple clear background.",
    "- Match the book page meaning and keep characters consistent within a series.",
    "- If page text is rendered by the app, the illustration should contain no written text.",
    "",
    "## Replacement Items",
    "",
    replacementItems.length
      ? replacementItems.flatMap(item => [
        `### ${item.title} · ${item.kind === "cover" ? "cover" : `page ${item.pageNumber}`}`,
        "",
        `- bookId: ${item.bookId}`,
        `- current image path: ${item.imagePath}`,
        `- target replacement path: ${item.imagePath}`,
        `- intended page text: ${item.intendedText || item.title}`,
        `- issue type: ${item.issues.join(", ")}`,
        `- notes: ${item.qaNotes || item.imageAlt || "Replace with clean image matching the page meaning."}`,
        ""
      ]).join("\n")
      : "No confirmed replacement items were detected by metadata/file audit. Use the contact sheet for human review and add confirmed bad images here before sending a replacement batch."
  ];
  ensureDir(replacementRequestPath);
  writeFileSync(replacementRequestPath, `${replacementLines.join("\n")}\n`);

  console.log("Guided Reading image text artifact audit complete.");
  console.log(`Referenced images: ${summary.totalReferencedImagesScanned}`);
  console.log(`Likely clean by metadata: ${summary.likelyCleanCount}`);
  console.log(`Needs manual review: ${summary.needsManualReviewCount}`);
  console.log(`Needs replacement/broken: ${summary.needsReplacementCount}`);
  console.log(`Audit: ${path.relative(repoRoot, auditPath)}`);
}

main();
