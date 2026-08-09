#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SCHEMA_VERSION = "guided-reading-text-review/v1";
const DECISIONS_SCHEMA_VERSION = "guided-reading-text-review-decisions/v1";

const HELP = `Usage:
  node tools/buildGuidedReadingTextReview.mjs --level A|B|C --baseline <json|html> --audit <json[,json...]> --output <html> [--series <series-id>]

Build a self-contained, text-only manuscript approval page for one Guided Reading level.

Required options:
  --level <A|B|C>   Guided Reading level to review
  --baseline <file> Baseline JSON, or an earlier approval HTML containing manuscript data
  --audit <json,...> One or more comma-separated audit JSON files with top-level books arrays
  --output <html>   Destination HTML file
  --series <id>     Optional series scope, for example moonwood-tales
  --help            Show this help
`;

function parseArguments(argv) {
  const options = {};
  const required = new Set(["--level", "--baseline", "--audit", "--output"]);
  const recognised = new Set([...required, "--series"]);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") return { help: true };
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);

    const equalsIndex = token.indexOf("=");
    const flag = equalsIndex === -1 ? token : token.slice(0, equalsIndex);
    if (!recognised.has(flag)) throw new Error(`Unknown option: ${flag}`);
    if (Object.hasOwn(options, flag)) throw new Error(`Option supplied more than once: ${flag}`);

    const inlineValue = equalsIndex === -1 ? "" : token.slice(equalsIndex + 1);
    const value = inlineValue || argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    if (!inlineValue) index += 1;
    options[flag] = value;
  }

  for (const flag of required) {
    if (!options[flag]) throw new Error(`Missing required option: ${flag}`);
  }

  const level = String(options["--level"]).toUpperCase();
  if (!new Set(["A", "B", "C"]).has(level)) {
    throw new Error(`--level must be A, B or C; received ${options["--level"]}`);
  }

  const outputPath = path.resolve(options["--output"]);
  if (!/\.html?$/i.test(outputPath)) throw new Error("--output must end in .html or .htm");

  return {
    help: false,
    level,
    baselinePath: path.resolve(options["--baseline"]),
    auditPaths: String(options["--audit"])
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => path.resolve(value)),
    seriesId: String(options["--series"] || "").trim() || null,
    outputPath
  };
}

async function readJson(filePath, label) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${label} JSON at ${filePath}: ${error.message}`, { cause: error });
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    const embedded = source.match(
      /<script\s+id=["']manuscript-data["']\s+type=["']application\/json["']>([\s\S]*?)<\/script>/i
    );
    if (embedded) {
      try {
        return JSON.parse(embedded[1]);
      } catch (embeddedError) {
        throw new Error(
          `Could not parse embedded ${label} manuscript data at ${filePath}: ${embeddedError.message}`,
          { cause: embeddedError }
        );
      }
    }
    throw new Error(`Could not parse ${label} data at ${filePath}: ${error.message}`, { cause: error });
  }
}

function bookId(book) {
  return String(book?.id || book?.bookId || book?.book_id || "").trim();
}

function indexBooks(books, label) {
  if (!Array.isArray(books)) throw new Error(`${label} JSON must contain a top-level books array.`);
  const indexed = new Map();
  for (const book of books) {
    const id = bookId(book);
    if (!id) throw new Error(`${label} contains a book without an id.`);
    if (indexed.has(id)) throw new Error(`${label} contains duplicate book id: ${id}`);
    indexed.set(id, book);
  }
  return indexed;
}

function pageNumber(page, index) {
  if (typeof page === "string") return index + 1;
  const candidate = Number(
    page?.pageNumber
    ?? page?.page_number
    ?? page?.number
    ?? page?.page
    ?? index + 1
  );
  return Number.isInteger(candidate) && candidate > 0 ? candidate : index + 1;
}

function pageText(page) {
  if (typeof page === "string") return page;
  return String(
    page?.text
    ?? page?.current
    ?? page?.proposed
    ?? page?.current_text
    ?? page?.currentText
    ?? page?.page_text
    ?? page?.pageText
    ?? page?.content
    ?? ""
  );
}

function normalisePages(book, label) {
  const rawPages = book?.pages
    ?? book?.current_pages
    ?? book?.currentPages
    ?? book?.page_texts
    ?? book?.pageTexts;
  if (!Array.isArray(rawPages) || rawPages.length === 0) {
    throw new Error(`${label} has no readable pages array.`);
  }

  const seen = new Set();
  const pages = rawPages
    .filter(page => typeof page === "string" || page?.active !== false)
    .map((page, index) => {
      const number = pageNumber(page, index);
      if (seen.has(number)) throw new Error(`${label} repeats page ${number}.`);
      seen.add(number);
      return { pageNumber: number, text: pageText(page) };
    })
    .sort((left, right) => left.pageNumber - right.pageNumber);

  if (!pages.length) throw new Error(`${label} has no active pages.`);
  return pages;
}

function stringsFrom(value) {
  if (Array.isArray(value)) return value.flatMap(stringsFrom);
  if (value === null || value === undefined) return [];
  const text = String(value).trim();
  return text ? [text] : [];
}

function issueSummary(auditBook) {
  const issues = [];
  const append = (value, prefix = "") => {
    for (const text of stringsFrom(value)) issues.push(prefix ? `${prefix}${text}` : text);
  };

  append(auditBook?.editorialSummary ?? auditBook?.editorial_summary);
  append(auditBook?.auditSummary ?? auditBook?.audit_summary);
  append(auditBook?.issue_summary ?? auditBook?.issueSummary);
  append(auditBook?.issues);
  append(auditBook?.alignment_issues ?? auditBook?.alignmentIssues, "Picture match: ");
  append(auditBook?.voice_issues ?? auditBook?.voiceIssues, "Voice: ");
  append(auditBook?.arc_issues ?? auditBook?.arcIssues, "Structure: ");
  append(auditBook?.ending_issue ?? auditBook?.endingIssue, "Ending: ");
  append(auditBook?.outcome, "Result: ");

  const unique = [...new Set(issues)];
  return unique.length
    ? unique
    : ["No specific issue was recorded. Review the wording, flow and ending in full."];
}

function alignPages(currentPages, proposedPages) {
  const currentByNumber = new Map(currentPages.map(page => [page.pageNumber, page.text]));
  const proposedByNumber = new Map(proposedPages.map(page => [page.pageNumber, page.text]));
  const numbers = [...new Set([...currentByNumber.keys(), ...proposedByNumber.keys()])]
    .sort((left, right) => left - right);

  return numbers.map(number => {
    const hasCurrent = currentByNumber.has(number);
    const hasProposed = proposedByNumber.has(number);
    const current = hasCurrent ? currentByNumber.get(number) : "";
    const proposed = hasProposed ? proposedByNumber.get(number) : "";
    return {
      pageNumber: number,
      current,
      proposed,
      hasCurrent,
      hasProposed,
      changed: !hasCurrent || !hasProposed || current !== proposed
    };
  });
}

function makeManuscript({ runtimeBooks, baseline, audit, level, seriesId = null }) {
  const baselineById = indexBooks(baseline?.books, "Baseline");
  const auditById = indexBooks(audit?.books, "Audit");
  const selected = runtimeBooks.filter(book =>
    book?.active !== false
    && String(book?.level) === level
    && (!seriesId || String(book?.seriesId || "") === seriesId)
  );

  if (!selected.length) {
    throw new Error(
      `No active runtime books found at Level ${level}${seriesId ? ` in series ${seriesId}` : ""}.`
    );
  }

  const missingBaseline = selected.map(bookId).filter(id => !baselineById.has(id));
  if (missingBaseline.length) {
    throw new Error(`Baseline is missing ${missingBaseline.length} Level ${level} book(s): ${missingBaseline.slice(0, 10).join(", ")}`);
  }
  const missingAudit = selected.map(bookId).filter(id => !auditById.has(id));
  if (missingAudit.length) {
    throw new Error(`Audit is missing ${missingAudit.length} Level ${level} book(s): ${missingAudit.slice(0, 10).join(", ")}`);
  }

  const books = selected.map(runtimeBook => {
    const id = bookId(runtimeBook);
    const baselineBook = baselineById.get(id);
    const auditBook = auditById.get(id);
    const currentPages = normalisePages(baselineBook, `Baseline book ${id}`);
    const proposedPages = normalisePages(runtimeBook, `Runtime book ${id}`);

    return {
      id,
      title: String(runtimeBook.title || baselineBook.title || id),
      currentTitle: String(baselineBook.title || runtimeBook.title || id),
      proposedTitle: String(runtimeBook.title || baselineBook.title || id),
      titleChanged: String(baselineBook.title || runtimeBook.title || id)
        !== String(runtimeBook.title || baselineBook.title || id),
      level,
      type: String(runtimeBook.type || baselineBook.type || "unspecified"),
      editClass: String(
        auditBook.edit_class
        ?? auditBook.editClass
        ?? auditBook.triage
        ?? baselineBook.edit_class
        ?? baselineBook.editClass
        ?? "unclassified"
      ),
      issues: issueSummary(auditBook),
      pages: alignPages(currentPages, proposedPages)
    };
  });

  const fingerprintPayload = {
    schemaVersion: SCHEMA_VERSION,
    level,
    seriesId,
    books: books.map(book => ({
      id: book.id,
      title: book.title,
      currentTitle: book.currentTitle,
      proposedTitle: book.proposedTitle,
      titleChanged: book.titleChanged,
      level: book.level,
      type: book.type,
      editClass: book.editClass,
      issues: book.issues,
      pages: book.pages.map(page => ({
        pageNumber: page.pageNumber,
        current: page.current,
        proposed: page.proposed,
        hasCurrent: page.hasCurrent,
        hasProposed: page.hasProposed
      }))
    }))
  };
  const fingerprint = `sha256:${createHash("sha256")
    .update(JSON.stringify(fingerprintPayload))
    .digest("hex")}`;

  return {
    schemaVersion: SCHEMA_VERSION,
    decisionsSchemaVersion: DECISIONS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    level,
    seriesId,
    fingerprint,
    bookCount: books.length,
    books
  };
}

function serialiseJsonForHtml(value) {
  // JSON is data, not markup. Escaping HTML-significant characters also
  // prevents a manuscript line containing </script> from closing this block.
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function buildHtml(manuscript) {
  const embeddedData = serialiseJsonForHtml(manuscript);
  const seriesName = manuscript.seriesId === "moonwood-tales"
    ? "Moonwood Tales"
    : manuscript.seriesId
      ? String(manuscript.seriesId)
        .split("-")
        .map(word => word ? word[0].toUpperCase() + word.slice(1) : "")
        .join(" ")
      : "";
  const scopeTitle = escapeHtml(seriesName ? `${seriesName} — Level ${manuscript.level}` : `Level ${manuscript.level}`);
  const subtitle = manuscript.seriesId === "moonwood-tales"
    ? "Review the expanded Moonwood paragraphs only. The other 20 Level C books are already approved. Images and audio are deliberately excluded."
    : "Read the words only. Images and audio are deliberately excluded.";
  const shortFingerprint = escapeHtml(manuscript.fingerprint.slice(7, 19));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${scopeTitle} Guided Reading text approval</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #20231f;
      background: #f4f1e9;
      --ink: #20231f;
      --muted: #646960;
      --paper: #fffdf8;
      --line: #d8d2c5;
      --accent: #34584a;
      --accent-soft: #e5eee8;
      --yes: #23734f;
      --yes-soft: #e7f5ed;
      --no: #a33b35;
      --no-soft: #faece9;
      --focus: #195eb6;
      --changed: #fff8dc;
    }
    * { box-sizing: border-box; }
    html { scroll-padding-top: 15rem; }
    body { margin: 0; min-width: 320px; background: #f4f1e9; line-height: 1.5; }
    button, textarea { font: inherit; }
    button { min-height: 44px; cursor: pointer; }
    button:focus-visible, textarea:focus-visible, article:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 3px;
    }
    .skip-link {
      position: fixed;
      left: 1rem;
      top: -5rem;
      z-index: 20;
      padding: .75rem 1rem;
      border-radius: .5rem;
      color: white;
      background: var(--focus);
    }
    .skip-link:focus { top: 1rem; }
    .masthead {
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 253, 248, .98);
      box-shadow: 0 8px 24px rgba(45, 42, 34, .08);
    }
    .masthead-inner { max-width: 1280px; margin: 0 auto; padding: 1rem 1.25rem; }
    .topline { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; }
    h1 { margin: 0; font-size: clamp(1.35rem, 3vw, 2rem); letter-spacing: -.02em; }
    .subtitle { margin: .25rem 0 0; color: var(--muted); }
    .fingerprint { margin: .25rem 0 0; color: var(--muted); font-size: .8rem; }
    .progress-panel { min-width: min(100%, 28rem); }
    .progress-text { display: flex; flex-wrap: wrap; gap: .4rem 1rem; font-weight: 700; }
    progress { width: 100%; height: .8rem; margin-top: .5rem; accent-color: var(--accent); }
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; margin-top: .9rem; }
    .filters, .navigation, .exports { display: flex; flex-wrap: wrap; gap: .45rem; }
    .toolbar button {
      border: 1px solid #aaa496;
      border-radius: .65rem;
      padding: .55rem .8rem;
      color: var(--ink);
      background: white;
      font-weight: 700;
    }
    .toolbar button[aria-pressed="true"] { border-color: var(--accent); color: white; background: var(--accent); }
    .toolbar button:disabled { cursor: not-allowed; opacity: .45; }
    .navigation { margin-left: auto; align-items: center; }
    .position { min-width: 8rem; color: var(--muted); text-align: center; }
    .exports { width: 100%; }
    .exports button { background: #f7f5ef; }
    main { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1.25rem 5rem; }
    .instructions {
      margin: 0 0 1rem;
      padding: .9rem 1rem;
      border-left: 4px solid var(--accent);
      border-radius: .4rem;
      color: #39423b;
      background: var(--accent-soft);
    }
    .book-list { display: grid; gap: 1.25rem; }
    .book-card {
      overflow: hidden;
      border: 2px solid var(--line);
      border-radius: 1rem;
      background: var(--paper);
      box-shadow: 0 8px 22px rgba(45, 42, 34, .06);
    }
    .book-card.is-active { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(52, 88, 74, .13); }
    .book-card[data-decision="yes"] { border-left: 8px solid var(--yes); }
    .book-card[data-decision="no"] { border-left: 8px solid var(--no); }
    .book-head { padding: 1.2rem 1.25rem 1rem; border-bottom: 1px solid var(--line); }
    .book-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .book-title { margin: 0; font-size: clamp(1.25rem, 2.4vw, 1.65rem); }
    .book-id { margin: .2rem 0 0; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .86rem; }
    .title-change { margin: .55rem 0 0; padding: .45rem .6rem; border-radius: .45rem; background: var(--changed); font-size: .88rem; font-weight: 750; }
    .status-pill, .meta-pill, .change-pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: .25rem .58rem;
      background: #f5f2eb;
      font-size: .78rem;
      font-weight: 800;
    }
    .status-pill[data-status="yes"] { border-color: #78af92; color: #175a3d; background: var(--yes-soft); }
    .status-pill[data-status="no"] { border-color: #d39792; color: #852d28; background: var(--no-soft); }
    .meta { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .75rem; }
    .issues { margin-top: .9rem; }
    .issues h3 { margin: 0; font-size: .92rem; }
    .issues ul { margin: .35rem 0 0; padding-left: 1.25rem; color: #474c46; }
    .issues li + li { margin-top: .25rem; }
    .comparison-wrap { overflow-x: auto; }
    .comparison { width: 100%; min-width: 720px; border-collapse: collapse; table-layout: fixed; }
    .comparison th, .comparison td { padding: .85rem 1rem; border-bottom: 1px solid #e4ded2; vertical-align: top; text-align: left; }
    .comparison th { color: #4f554e; background: #f4f1ea; font-size: .82rem; letter-spacing: .03em; text-transform: uppercase; }
    .comparison th:first-child, .comparison td:first-child { width: 6.5rem; }
    .comparison tr.changed { background: var(--changed); }
    .page-number { font-weight: 900; }
    .change-pill { display: flex; width: max-content; margin-top: .35rem; font-size: .7rem; }
    .manuscript-line { margin: 0; white-space: pre-wrap; font-size: 1.05rem; }
    .missing-line { color: var(--no); font-style: italic; }
    .decision-area { display: grid; grid-template-columns: minmax(18rem, .8fr) minmax(18rem, 1.2fr); gap: 1rem; padding: 1.2rem 1.25rem 1.35rem; }
    .decision-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
    .decision-buttons button { min-height: 58px; border: 2px solid; border-radius: .75rem; padding: .75rem; font-size: 1.02rem; font-weight: 900; }
    .yes-button { border-color: var(--yes); color: var(--yes); background: white; }
    .no-button { border-color: var(--no); color: var(--no); background: white; }
    .yes-button[aria-pressed="true"] { color: white; background: var(--yes); }
    .no-button[aria-pressed="true"] { color: white; background: var(--no); }
    .note-label { display: block; margin-bottom: .35rem; font-weight: 800; }
    .note-help { display: block; margin-bottom: .45rem; color: var(--muted); font-size: .82rem; }
    .rewrite-box { border: 1px solid #d39792; border-radius: .75rem; padding: .85rem; background: var(--no-soft); }
    textarea { width: 100%; min-height: 5.2rem; resize: vertical; border: 1px solid #aaa496; border-radius: .6rem; padding: .7rem; color: var(--ink); background: white; }
    .empty-state { padding: 3rem 1rem; color: var(--muted); text-align: center; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    [hidden] { display: none !important; }
    @media (max-width: 900px) {
      .topline { display: block; }
      .progress-panel { margin-top: .75rem; }
      .navigation { margin-left: 0; }
      html { scroll-padding-top: 20rem; }
    }
    @media (max-width: 680px) {
      .masthead { position: static; }
      html { scroll-padding-top: 1rem; }
      .decision-area { grid-template-columns: 1fr; }
      .book-title-row { display: block; }
      .status-pill { margin-top: .65rem; }
      .exports button { flex: 1; }
    }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
    @media print {
      .masthead { position: static; box-shadow: none; }
      .toolbar, .instructions, .decision-area { display: none; }
      .book-card { break-inside: avoid; box-shadow: none; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#review-list">Skip to manuscript reviews</a>
  <header class="masthead">
    <div class="masthead-inner">
      <div class="topline">
        <div>
          <h1>${scopeTitle} text approval</h1>
          <p class="subtitle">${escapeHtml(subtitle)}</p>
          <p class="fingerprint">Manuscript fingerprint ${shortFingerprint}</p>
        </div>
        <section class="progress-panel" aria-labelledby="progress-heading">
          <h2 id="progress-heading" class="sr-only">Review progress</h2>
          <div class="progress-text" id="progress-text" aria-live="polite"></div>
          <progress id="review-progress" value="0" max="${manuscript.bookCount}">0 of ${manuscript.bookCount}</progress>
        </section>
      </div>
      <div class="toolbar" aria-label="Review controls">
        <div class="filters" role="group" aria-label="Filter books">
          <button type="button" data-filter="all" aria-pressed="true">All</button>
          <button type="button" data-filter="unreviewed" aria-pressed="false">Unreviewed</button>
          <button type="button" data-filter="yes" aria-pressed="false">Yes</button>
          <button type="button" data-filter="no" aria-pressed="false">Fail</button>
        </div>
        <div class="navigation" aria-label="Move between visible books">
          <button type="button" id="previous-book">Previous</button>
          <span class="position" id="position-text" aria-live="polite"></span>
          <button type="button" id="next-book">Next</button>
        </div>
        <div class="exports">
          <button type="button" id="export-json">Export decisions JSON</button>
          <button type="button" id="copy-summary">Copy summary</button>
        </div>
      </div>
    </div>
  </header>

  <main>
    <p class="instructions" id="keyboard-help">Choose <strong>Yes</strong> to approve the proposed wording. Choose <strong>No — Fail</strong> to open a box where you can type your own rewrite. With focus outside a form field, press <strong>Y</strong> or <strong>N</strong>.</p>
    <section id="review-list" class="book-list" aria-label="Guided Reading manuscript reviews" aria-describedby="keyboard-help"></section>
    <p id="empty-state" class="empty-state" hidden>No books match this filter.</p>
    <p id="action-status" class="sr-only" aria-live="polite"></p>
  </main>

  <script id="manuscript-data" type="application/json">${embeddedData}</script>
  <script>
    (function () {
      "use strict";

      var manuscript = JSON.parse(document.getElementById("manuscript-data").textContent);
      var storageKey = "literacypath:guided-reading-text-review:" + manuscript.level + ":" + manuscript.fingerprint;
      var state = {
        filter: "all",
        activeId: manuscript.books.length ? manuscript.books[0].id : "",
        records: loadRecords()
      };
      var nodes = new Map();
      var list = document.getElementById("review-list");
      var emptyState = document.getElementById("empty-state");
      var progressText = document.getElementById("progress-text");
      var progress = document.getElementById("review-progress");
      var positionText = document.getElementById("position-text");
      var previousButton = document.getElementById("previous-book");
      var nextButton = document.getElementById("next-book");
      var actionStatus = document.getElementById("action-status");
      var filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

      function loadRecords() {
        var parsed = {};
        try {
          parsed = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
        } catch (error) {
          parsed = {};
        }
        var safe = {};
        manuscript.books.forEach(function (book) {
          var candidate = parsed[book.id] || {};
          safe[book.id] = {
            decision: candidate.decision === "yes" || candidate.decision === "no" ? candidate.decision : "",
            suggestedRewrite: typeof candidate.suggestedRewrite === "string"
              ? candidate.suggestedRewrite.slice(0, 12000)
              : typeof candidate.note === "string"
                ? candidate.note.slice(0, 12000)
                : ""
          };
        });
        return safe;
      }

      function saveRecords() {
        try {
          localStorage.setItem(storageKey, JSON.stringify(state.records));
        } catch (error) {
          announce("This browser could not save the decisions locally. Export the JSON before closing.");
        }
      }

      function makeElement(tagName, className, text) {
        var element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
      }

      function makeMetaPill(text) {
        return makeElement("span", "meta-pill", text);
      }

      function makeManuscriptCell(text, exists) {
        var cell = document.createElement("td");
        var paragraph = makeElement("p", "manuscript-line" + (exists ? "" : " missing-line"));
        paragraph.textContent = exists ? text : "— No page in this version —";
        cell.appendChild(paragraph);
        return cell;
      }

      function createBookCard(book) {
        var article = makeElement("article", "book-card");
        article.dataset.bookId = book.id;
        article.dataset.decision = "";
        article.tabIndex = -1;
        article.setAttribute("aria-labelledby", "title-" + book.id);

        var header = makeElement("header", "book-head");
        var titleRow = makeElement("div", "book-title-row");
        var titleBlock = document.createElement("div");
        var title = makeElement("h2", "book-title", book.title);
        title.id = "title-" + book.id;
        titleBlock.appendChild(title);
        titleBlock.appendChild(makeElement("p", "book-id", book.id));
        if (book.titleChanged) {
          titleBlock.appendChild(makeElement("p", "title-change", "Title change: “" + book.currentTitle + "” → “" + book.proposedTitle + "”"));
        }
        var status = makeElement("span", "status-pill", "Unreviewed");
        status.dataset.status = "unreviewed";
        titleRow.appendChild(titleBlock);
        titleRow.appendChild(status);
        header.appendChild(titleRow);

        var meta = makeElement("div", "meta");
        meta.appendChild(makeMetaPill("Level " + book.level));
        meta.appendChild(makeMetaPill(book.type));
        meta.appendChild(makeMetaPill(book.editClass + " edit"));
        header.appendChild(meta);

        var issues = makeElement("section", "issues");
        issues.appendChild(makeElement("h3", "", "Issue summary"));
        var issueList = document.createElement("ul");
        book.issues.forEach(function (issue) {
          issueList.appendChild(makeElement("li", "", issue));
        });
        issues.appendChild(issueList);
        header.appendChild(issues);
        article.appendChild(header);

        var comparisonWrap = makeElement("div", "comparison-wrap");
        var table = makeElement("table", "comparison");
        var caption = makeElement("caption", "sr-only", "Page-by-page current and proposed text for " + book.title);
        table.appendChild(caption);
        var tableHead = document.createElement("thead");
        var headingRow = document.createElement("tr");
        ["Page", "Current", "Proposed"].forEach(function (heading) {
          var th = makeElement("th", "", heading);
          th.scope = "col";
          headingRow.appendChild(th);
        });
        tableHead.appendChild(headingRow);
        table.appendChild(tableHead);
        var tableBody = document.createElement("tbody");
        book.pages.forEach(function (page) {
          var row = document.createElement("tr");
          if (page.changed) row.className = "changed";
          var numberCell = document.createElement("td");
          numberCell.appendChild(makeElement("div", "page-number", "Page " + page.pageNumber));
          numberCell.appendChild(makeElement("span", "change-pill", page.changed ? "Changed" : "Unchanged"));
          row.appendChild(numberCell);
          row.appendChild(makeManuscriptCell(page.current, page.hasCurrent));
          row.appendChild(makeManuscriptCell(page.proposed, page.hasProposed));
          tableBody.appendChild(row);
        });
        table.appendChild(tableBody);
        comparisonWrap.appendChild(table);
        article.appendChild(comparisonWrap);

        var decisionArea = makeElement("footer", "decision-area");
        var decisionBlock = document.createElement("div");
        var decisionLabel = makeElement("h3", "", "Approve this manuscript?");
        decisionLabel.id = "decision-" + book.id;
        decisionBlock.appendChild(decisionLabel);
        var decisionButtons = makeElement("div", "decision-buttons");
        decisionButtons.setAttribute("role", "group");
        decisionButtons.setAttribute("aria-labelledby", decisionLabel.id);
        var yesButton = makeElement("button", "yes-button", "Yes — approve text");
        yesButton.type = "button";
        yesButton.dataset.decision = "yes";
        yesButton.setAttribute("aria-pressed", "false");
        yesButton.setAttribute("aria-keyshortcuts", "Y");
        var noButton = makeElement("button", "no-button", "No — fail and suggest");
        noButton.type = "button";
        noButton.dataset.decision = "no";
        noButton.setAttribute("aria-pressed", "false");
        noButton.setAttribute("aria-keyshortcuts", "N");
        yesButton.addEventListener("click", function () { setDecision(book.id, "yes", true); });
        noButton.addEventListener("click", function () { setDecision(book.id, "no", false); });
        decisionButtons.appendChild(yesButton);
        decisionButtons.appendChild(noButton);
        decisionBlock.appendChild(decisionButtons);
        decisionArea.appendChild(decisionBlock);

        var rewriteBlock = makeElement("div", "rewrite-box");
        var rewriteId = "rewrite-" + book.id;
        var rewriteHelpId = rewriteId + "-help";
        rewriteBlock.id = rewriteId + "-box";
        rewriteBlock.hidden = state.records[book.id].decision !== "no";
        noButton.setAttribute("aria-controls", rewriteBlock.id);
        noButton.setAttribute("aria-expanded", String(state.records[book.id].decision === "no"));
        var rewriteLabel = makeElement("label", "note-label", "Suggest your rewrite");
        rewriteLabel.htmlFor = rewriteId;
        rewriteBlock.appendChild(rewriteLabel);
        var rewriteHelp = makeElement("span", "note-help", "Type replacement wording here. Include page numbers when you want to change only certain pages.");
        rewriteHelp.id = rewriteHelpId;
        rewriteBlock.appendChild(rewriteHelp);
        var suggestedRewrite = document.createElement("textarea");
        suggestedRewrite.id = rewriteId;
        suggestedRewrite.setAttribute("aria-describedby", rewriteHelpId);
        suggestedRewrite.placeholder = "For example: Page 7 — ...";
        suggestedRewrite.maxLength = 12000;
        suggestedRewrite.rows = 5;
        suggestedRewrite.value = state.records[book.id].suggestedRewrite;
        suggestedRewrite.addEventListener("input", function (event) {
          state.records[book.id].suggestedRewrite = String(event.target.value).slice(0, 12000);
          saveRecords();
        });
        rewriteBlock.appendChild(suggestedRewrite);
        decisionArea.appendChild(rewriteBlock);
        article.appendChild(decisionArea);

        article.addEventListener("focusin", function () { setActive(book.id, false); });
        article.addEventListener("click", function () { setActive(book.id, false); });
        nodes.set(book.id, {
          article: article,
          status: status,
          yesButton: yesButton,
          noButton: noButton,
          rewriteBlock: rewriteBlock,
          suggestedRewrite: suggestedRewrite
        });
        return article;
      }

      function decisionCounts() {
        return manuscript.books.reduce(function (counts, book) {
          var decision = state.records[book.id].decision;
          if (decision === "yes") counts.yes += 1;
          else if (decision === "no") counts.no += 1;
          else counts.unreviewed += 1;
          return counts;
        }, { yes: 0, no: 0, unreviewed: 0 });
      }

      function matchesFilter(book) {
        var decision = state.records[book.id].decision;
        if (state.filter === "all") return true;
        if (state.filter === "unreviewed") return !decision;
        return decision === state.filter;
      }

      function visibleBooks() {
        return manuscript.books.filter(matchesFilter);
      }

      function applyBookDecision(bookId) {
        var record = state.records[bookId];
        var node = nodes.get(bookId);
        node.article.dataset.decision = record.decision;
        node.yesButton.setAttribute("aria-pressed", String(record.decision === "yes"));
        node.noButton.setAttribute("aria-pressed", String(record.decision === "no"));
        node.noButton.setAttribute("aria-expanded", String(record.decision === "no"));
        node.rewriteBlock.hidden = record.decision !== "no";
        node.status.dataset.status = record.decision || "unreviewed";
        node.status.textContent = record.decision === "yes"
          ? "Yes — approved"
          : record.decision === "no"
            ? "No — failed"
            : "Unreviewed";
      }

      function updateProgress() {
        var counts = decisionCounts();
        var reviewed = counts.yes + counts.no;
        progress.max = manuscript.books.length;
        progress.value = reviewed;
        progress.textContent = reviewed + " of " + manuscript.books.length;
        progressText.textContent = "Reviewed " + reviewed + "/" + manuscript.books.length
          + " · Yes " + counts.yes
          + " · Fail " + counts.no
          + " · Unreviewed " + counts.unreviewed;

        filterButtons.forEach(function (button) {
          var filter = button.dataset.filter;
          var count = filter === "all" ? manuscript.books.length : counts[filter];
          var label = filter === "all" ? "All" : filter === "no" ? "Fail" : filter.charAt(0).toUpperCase() + filter.slice(1);
          button.textContent = label + " (" + count + ")";
          button.setAttribute("aria-pressed", String(state.filter === filter));
        });
      }

      function updateVisibility() {
        manuscript.books.forEach(function (book) {
          nodes.get(book.id).article.hidden = !matchesFilter(book);
        });
        var visible = visibleBooks();
        emptyState.hidden = visible.length !== 0;
        if (visible.length && !visible.some(function (book) { return book.id === state.activeId; })) {
          state.activeId = visible[0].id;
        }
        if (!visible.length) state.activeId = "";
        updateActiveStyle();
        updateNavigation();
      }

      function updateActiveStyle() {
        manuscript.books.forEach(function (book) {
          nodes.get(book.id).article.classList.toggle("is-active", book.id === state.activeId);
        });
      }

      function updateNavigation() {
        var visible = visibleBooks();
        var index = visible.findIndex(function (book) { return book.id === state.activeId; });
        var hasActive = index !== -1;
        previousButton.disabled = !hasActive || index === 0;
        nextButton.disabled = !hasActive || index === visible.length - 1;
        positionText.textContent = hasActive ? "Book " + (index + 1) + " of " + visible.length : "No visible books";
      }

      function setActive(bookId, shouldScroll) {
        if (!bookId || !nodes.has(bookId) || nodes.get(bookId).article.hidden) return;
        state.activeId = bookId;
        updateActiveStyle();
        updateNavigation();
        if (shouldScroll) {
          nodes.get(bookId).article.scrollIntoView({ block: "start", behavior: "smooth" });
          nodes.get(bookId).article.focus({ preventScroll: true });
        }
      }

      function moveActive(offset) {
        var visible = visibleBooks();
        if (!visible.length) return;
        var index = visible.findIndex(function (book) { return book.id === state.activeId; });
        if (index === -1) index = 0;
        var target = Math.max(0, Math.min(visible.length - 1, index + offset));
        setActive(visible[target].id, true);
      }

      function setDecision(bookId, decision, moveAfter) {
        var before = visibleBooks();
        var beforeIndex = before.findIndex(function (book) { return book.id === bookId; });
        var nextId = before.length > 1 && beforeIndex !== -1
          ? before[Math.min(beforeIndex + 1, before.length - 1)].id
          : "";
        state.records[bookId].decision = decision;
        if (decision === "no" && state.filter !== "all" && state.filter !== "no") {
          state.filter = "all";
        }
        saveRecords();
        applyBookDecision(bookId);
        updateProgress();
        updateVisibility();
        announce((decision === "yes" ? "Approved " : "Marked for revision: ") + nodes.get(bookId).article.querySelector("h2").textContent);

        if (decision === "no") {
          nodes.get(bookId).suggestedRewrite.focus({ preventScroll: false });
        }

        if (moveAfter && decision === "yes") {
          var visibleAfter = visibleBooks();
          if (nextId && visibleAfter.some(function (book) { return book.id === nextId; })) {
            setActive(nextId, true);
          } else if (visibleAfter.length) {
            var fallbackIndex = Math.min(Math.max(beforeIndex, 0), visibleAfter.length - 1);
            setActive(visibleAfter[fallbackIndex].id, true);
          }
        }
      }

      function exportPayload() {
        return {
          schemaVersion: manuscript.decisionsSchemaVersion,
          generatedAt: new Date().toISOString(),
          manuscriptFingerprint: manuscript.fingerprint,
          level: manuscript.level,
          seriesId: manuscript.seriesId || null,
          books: manuscript.books.map(function (book) {
            var record = state.records[book.id];
            return {
              id: book.id,
              title: book.title,
              currentTitle: book.currentTitle,
              proposedTitle: book.proposedTitle,
              titleChanged: book.titleChanged,
              type: book.type,
              editClass: book.editClass,
              decision: record.decision || "unreviewed",
              suggestedRewrite: record.suggestedRewrite,
              currentPages: book.pages.map(function (page) {
                return { pageNumber: page.pageNumber, text: page.current, exists: page.hasCurrent };
              }),
              proposedPages: book.pages.map(function (page) {
                return { pageNumber: page.pageNumber, text: page.proposed, exists: page.hasProposed };
              })
            };
          })
        };
      }

      function downloadDecisions() {
        var payload = JSON.stringify(exportPayload(), null, 2) + "\\n";
        var blob = new Blob([payload], { type: "application/json" });
        var objectUrl = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = objectUrl;
        link.download = "guided-reading-level-" + manuscript.level.toLowerCase()
          + (manuscript.seriesId ? "-" + manuscript.seriesId : "")
          + "-text-decisions.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        announce("Decisions JSON exported.");
      }

      function summaryText() {
        var counts = decisionCounts();
        var reviewed = counts.yes + counts.no;
        var lines = [
          "Guided Reading Level " + manuscript.level
            + (manuscript.seriesId === "moonwood-tales" ? " Moonwood Tales" : "")
            + " text review",
          "Manuscript: " + manuscript.fingerprint,
          "Reviewed " + reviewed + "/" + manuscript.books.length + " | Yes " + counts.yes + " | Fail " + counts.no + " | Unreviewed " + counts.unreviewed,
          ""
        ];
        manuscript.books.forEach(function (book) {
          var record = state.records[book.id];
          var decision = record.decision ? record.decision.toUpperCase() : "UNREVIEWED";
          lines.push("[" + decision + "] " + book.title + " (" + book.id + ")");
          if (record.suggestedRewrite.trim()) lines.push("  Suggested rewrite: " + record.suggestedRewrite.trim());
        });
        return lines.join("\\n");
      }

      async function copySummary() {
        var text = summaryText();
        try {
          await navigator.clipboard.writeText(text);
        } catch (error) {
          var fallback = document.createElement("textarea");
          fallback.value = text;
          fallback.setAttribute("readonly", "");
          fallback.style.position = "fixed";
          fallback.style.opacity = "0";
          document.body.appendChild(fallback);
          fallback.select();
          document.execCommand("copy");
          fallback.remove();
        }
        announce("Review summary copied.");
        var button = document.getElementById("copy-summary");
        var oldLabel = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(function () { button.textContent = oldLabel; }, 1600);
      }

      function announce(message) {
        actionStatus.textContent = "";
        window.setTimeout(function () { actionStatus.textContent = message; }, 10);
      }

      manuscript.books.forEach(function (book) {
        list.appendChild(createBookCard(book));
      });
      manuscript.books.forEach(function (book) { applyBookDecision(book.id); });
      updateProgress();
      updateVisibility();

      filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          state.filter = button.dataset.filter;
          updateProgress();
          updateVisibility();
          var visible = visibleBooks();
          if (visible.length) setActive(visible[0].id, true);
        });
      });
      previousButton.addEventListener("click", function () { moveActive(-1); });
      nextButton.addEventListener("click", function () { moveActive(1); });
      document.getElementById("export-json").addEventListener("click", downloadDecisions);
      document.getElementById("copy-summary").addEventListener("click", copySummary);

      document.addEventListener("keydown", function (event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
        var target = event.target;
        var tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
        if (target && (target.isContentEditable || ["input", "textarea", "select", "button"].includes(tagName))) return;
        var key = String(event.key || "").toLowerCase();
        if ((key === "y" || key === "n") && state.activeId) {
          event.preventDefault();
          setDecision(state.activeId, key === "y" ? "yes" : "no", key === "y");
        }
      });
    })();
  </script>
</body>
</html>
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  const [baseline, runtimeModule, ...audits] = await Promise.all([
    readJson(options.baselinePath, "baseline"),
    import("../src/data/guidedReadingBooks.js"),
    ...options.auditPaths.map((auditPath, index) => readJson(auditPath, `audit ${index + 1}`))
  ]);
  if (!Array.isArray(runtimeModule.guidedReadingBooks)) {
    throw new Error("Current Guided Reading runtime did not export guidedReadingBooks.");
  }
  const audit = {
    books: audits.flatMap((candidate, index) => {
      if (!Array.isArray(candidate?.books)) {
        throw new Error(`Audit ${index + 1} JSON must contain a top-level books array.`);
      }
      return candidate.books;
    })
  };

  const manuscript = makeManuscript({
    runtimeBooks: runtimeModule.guidedReadingBooks,
    baseline,
    audit,
    level: options.level,
    seriesId: options.seriesId
  });
  const html = buildHtml(manuscript);
  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, html, "utf8");
  process.stdout.write(`${JSON.stringify({
    output: options.outputPath,
    level: manuscript.level,
    seriesId: manuscript.seriesId,
    books: manuscript.bookCount,
    fingerprint: manuscript.fingerprint
  }, null, 2)}\n`);
}

main().catch(error => {
  process.stderr.write(`Guided Reading text review build failed: ${error.message}\n`);
  process.stderr.write("Run with --help for usage.\n");
  process.exitCode = 1;
});
