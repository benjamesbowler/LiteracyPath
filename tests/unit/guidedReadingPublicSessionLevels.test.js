import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "@babel/parser";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";

// Execute the real JSX label expressions without mounting authenticated session
// dialogs or their catalogue-loading effects. Dependencies are the modules the
// production component imports; expected labels are hand-checked text bands.
async function sourceLabels(path) {
  const url = new URL(`../../src/components/${path}`, import.meta.url);
  const source = readFileSync(url, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  const elements = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXElement") elements.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    }
  }
  walk(ast);
  const dependencies = {};
  for (const declaration of ast.program.body) {
    if (declaration.type !== "ImportDeclaration"
      || !/\/(?:guidedReadingCatalogPolicy|bookLevelMetadata)\.js$/.test(declaration.source.value)) continue;
    const module = await import(new URL(declaration.source.value, url));
    for (const specifier of declaration.specifiers) {
      dependencies[specifier.local.name] = module[specifier.imported.name];
    }
  }
  function expression(node, book) {
    const context = { ...dependencies, book, selectedBook: book };
    return new Function(...Object.keys(context), `return (${source.slice(node.start, node.end)});`)(...Object.values(context));
  }
  function text(element, book) {
    return element.children.map(child => {
      if (child.type === "JSXText") return child.value;
      if (child.type === "JSXExpressionContainer") return expression(child.expression, book);
      return "";
    }).join("").replace(/\s+/g, " ").trim();
  }
  return { elements, expression, text };
}

function bookProperty(node, property) {
  return node?.type === "MemberExpression" && node.object?.name === "book" && node.property?.name === property;
}

function hasPageCount(element) {
  return element.children.some(child => child.expression?.type === "MemberExpression"
    && child.expression.property?.name === "length" && bookProperty(child.expression.object, "pages"));
}

const currentBook = getRuntimeGuidedReadingBooks().find(book => book.id === "gr-a-27");
const staleBook = {
  ...currentBook,
  pages: currentBook.pages.map((page, index) => index ? page : { ...page, text: `${page.text} Changed manuscript.` })
};

for (const [path, tag] of [
  ["guided-reading/ReadingSessionSetup.jsx", "span"],
  ["student-sessions/StudentSessionSetup.jsx", "option"],
  ["admin/GuidedReadingReviewPanel.jsx", "small"]
]) test(`${path} shows the current text band and withholds it after a manuscript change`, async () => {
  const labels = await sourceLabels(path);
  const element = labels.elements.find(node => node.openingElement.name.name === tag && hasPageCount(node));
  assert.ok(element, "the real book selector/card displays its page count");
  assert.equal(currentBook.level, "B", "this fixture exercises the conflicting legacy profile");
  assert.match(labels.text(element, currentBook), /App level D/);
  assert.match(labels.text(element, currentBook), /Predictable \/ Levelled/);
  assert.match(labels.text(element, staleBook), /App level pending/);
  assert.doesNotMatch(labels.text(element, staleBook), /App level D|Level B/);
});

test("the shared-reading selection summary uses the same current band and pending behavior", async () => {
  const labels = await sourceLabels("guided-reading/ReadingSessionSetup.jsx");
  const step = labels.elements.find(node => node.openingElement.name.name === "TeacherFunnelStep"
    && node.openingElement.attributes.some(attribute => attribute.name?.name === "title" && attribute.value?.value === "Choose the book"));
  const answer = step.openingElement.attributes.find(attribute => attribute.name?.name === "answer").value.expression;
  assert.equal(labels.expression(answer, currentBook), "The Sun · App level D · Predictable / Levelled");
  assert.equal(labels.expression(answer, staleBook), "The Sun · App level pending · Predictable / Levelled");
});

test("live reading controls show the reviewed band even when the internal profile differs", async () => {
  const labels = await sourceLabels("guided-reading/ReadingSessionBar.jsx");
  const heading = labels.elements.find(node => node.openingElement.attributes.some(attribute => attribute.name?.name === "className"
    && attribute.value?.value === "reading-session-bar-heading"));
  const span = heading.children.find(child => child.type === "JSXElement").children
    .find(child => child.type === "JSXElement" && child.openingElement.name.name === "span");
  assert.equal(labels.text(span, currentBook), "App level D · Predictable / Levelled");
  assert.equal(labels.text(span, staleBook), "App level pending · Predictable / Levelled");
});
