#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { parseWorldDiscoverySourceArgs, readWorldDiscoverySource } from "./worldDiscoverySourceLib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const style = "Bold clean clear 2D children's cartoon throughout, crisp continuous dark outlines, flat clean colors, restrained smooth cel shading, no painted or grainy texture, no gouache, no embossed relief, no 3D. Original friendly readable illustration. Ordinary neutral settings; no flags, religious/political symbols or costumes. No logos, text, letters, numbers, pseudo-writing, captions, watermarks or page borders. Natural anatomy and coherent hand/prop contact. Essential content at least 8 percent inside every edge.";
const cast = {
  "WD-KIT": "WD-KIT / Kit: six-year-old human boy, golden light-medium skin, short straight black side-parted hair, teal T-shirt, mustard shorts, navy sneakers.",
  "WD-ZOE": "WD-ZOE / Zoe: six-year-old human girl, deep brown skin, black hair in two puffs, yellow T-shirt, plum overalls, white sneakers."
};
function paths(book, slot) {
  const slug = book.id.replace("world-discovery-", "");
  return {
    sourceReference: path.join(root, "source-art/world-discovery", `${slug}-reference.webp`),
    target: path.join(root, slot === "reference" ? `source-art/world-discovery/${slug}-reference.webp` : `public/guided-reading/world-discovery/${slug}/${slot}.webp`),
    receipt: path.join(root, `source-art/world-discovery/receipts/${slug}-${slot}.json`)
  };
}
export function buildWorldDiscoveryImagePrompt(book, slot) {
  if (!/^(reference|cover|page-\d{2})$/.test(slot)) throw Error("Invalid image slot");
  const page = slot.startsWith("page-") ? book.pages.find(row => row.pageNumber === Number(slot.slice(5))) : null;
  if (slot.startsWith("page-") && !page) throw Error("Unknown page");
  const layout = page?.imageLayout ?? "scene";
  if (!["scene", "integrated-diagram", "comparison-diagram"].includes(layout)) throw Error("Invalid imageLayout");
  const labels = page?.embeddedImageText?.trim() ? page.embeddedImageText : null;
  const pageStyle = labels ? style.replace("No logos, text, letters, numbers, pseudo-writing, captions, watermarks or page borders.", `No logos, watermarks or page borders. The ONLY permitted written content is the exact authored embeddedImageText: ${JSON.stringify(labels)}. Preserve its spelling and case; place it only as the illustration brief specifies. No additional text, letters, numbers, captions, pseudo-writing, legends or written title. Printed prose below is context only, never extra lettering.`) : style;
  const identities = book.storyBibleReview.canonIds.map(id => cast[id]).join(" ");
  const exclusion = !book.storyBibleReview.canonIds.length ? "No named child cast: Kit and Zoe MUST NOT appear. Include unnamed human workers/adults ONLY when explicitly required by this particular scene; otherwise show only the natural subjects." : book.storyBibleReview.canonIds.length === 1 ? `The ONLY named human protagonist is ${book.storyBibleReview.canonIds[0] === "WD-ZOE" ? "Zoe. Kit MUST NOT appear" : "Kit. Zoe MUST NOT appear"}. Ignore every other child shown in reference sheets; unnamed adults may appear only when this scene explicitly requires them.` : "Kit and Zoe have equal standing height. Include only characters needed by this exact scene, not every reference pose.";
  const base = `${pageStyle}\n${identities} ${exclusion} Preserve exact reference identity and clothing.\nBook: ${book.title}; World Discovery; ${book.type}.\nSetting: ${book.setting}\nDesign locks for the book's recurring subjects/props (NOT a visibility list; never insert later objects/states prematurely): ${book.props.join("; ")}\n`;
  let prompt;
  if (slot === "reference") {
    prompt = `Use case: illustration-story. PRODUCTION REFERENCE SHEET, landscape, not a finished book page. ${base} Create a clean separated reference board on white: show the principal recurring props/animals in front, side and three-quarter views, their relative scale beside any named human cast, and a single simple location key showing the persistent setting and daylight/palette. The human character model sheet is a supporting identity reference, not content to copy wholesale. Show only the subjects this book requires. Use initial object states: ${book.pages[0].state}. For orientation, the opening location/action is: ${book.pages[0].imageBrief}. Do not show a completed craft or later scene merely because the finished object is listed in design locks. No future story events, no captions.`;
  } else {
    const composition = layout === "scene" ? "one coherent scene and moment, no panels or contact sheet." : layout === "integrated-diagram"
      ? "one integrated explanatory diagram. Allow only the cutaways, insets, schematic elements or arrows explicitly authored in this page's illustration brief; keep them spatially connected to the subject they explain. No unrequested panels, insets, annotations or contact sheet."
      : "one explanatory comparison diagram. Allow only the distinct views, stages or comparison panels explicitly authored in this page's illustration brief, with their exact relationships and counts. No unrequested panels, insets, annotations or contact sheet.";
    const stateRule = layout === "scene" ? "Show only the people, objects and development stage required below." : "Show only the people, objects and specific stages explicitly required below; the declared diagram permits no other scenes or story events.";
    const ending = layout === "scene" ? "Do not add later events, duplicate props or a separate inset." : "Do not add events or stages beyond the authored diagram. Repeat a subject only when the authored comparison or cutaway requires it.";
    prompt = `Use case: illustration-story. One finished landscape 3:2 full-bleed picture-book illustration, ${composition} ${base} Input references lock identity, prop design and location; compose a NEW image for the exact scene, never reproduce the reference-board layout. The reference and overall prop list may contain finished objects and later story events: these are DESIGN REFERENCES ONLY, not permission to show them now. ${stateRule}\n${page ? `Page ${page.pageNumber}. Printed prose (NOT text to put in art): ${page.text}\nRequired illustration: ${page.imageBrief}\nExact current state: ${page.state}` : `Dedicated cover art: ${book.coverBrief}`}\n${ending} No written title; the app renders live text.`;
  }
  return prompt;
}
export function imageJob(id, slot, sourceOptions = {}) {
  const source = readWorldDiscoverySource({ ...sourceOptions, bookId: id });
  const [book] = source.books;
  const prompt = buildWorldDiscoveryImagePrompt(book, slot);
  const p = paths(book, slot);
  const refs = book.storyBibleReview.canonIds.length ? [path.join(root, "source-art/world-discovery/cast-v1.png")] : [];
  if (slot !== "reference") {
    if (!fs.existsSync(p.sourceReference)) throw Error(`Missing inspected book reference ${p.sourceReference}`);
    refs.push(p.sourceReference);
  }
  return { bookId: id, slot, prompt, referenced_image_paths: refs, transparent_background: false, target: p.target, receipt: p.receipt,
    manuscriptSource: { directory: source.directory, sha256: source.manuscriptSha256, isolated: source.isolated, firstNumber: source.firstNumber, lastNumber: source.lastNumber } };
}
export async function install(id, slot, source, promptPath, replace = false, sourceOptions = {}) {
  const manuscript = readWorldDiscoverySource({ ...sourceOptions, bookId: id });
  const [book] = manuscript.books, p = paths(book, slot);
  if (!/^(reference|cover|page-\d{2})$/.test(slot) || (slot.startsWith("page-") && !book.pages.some(page => page.pageNumber === Number(slot.slice(5))))) throw Error("Invalid image slot");
  if (fs.existsSync(p.target) && !replace) throw Error(`Refusing to overwrite ${p.target}; pass --replace only for a reviewed replacement`);
  const jobFile = promptPath.replace(/\.txt$/, ".json");
  const job = fs.existsSync(jobFile) ? JSON.parse(fs.readFileSync(jobFile)) : null;
  if (manuscript.isolated && (job?.bookId !== id || job?.slot !== slot
    || job?.manuscriptSource?.sha256 !== manuscript.manuscriptSha256
    || job?.prompt !== fs.readFileSync(promptPath, "utf8"))) throw Error("Isolated image job does not match the current manuscript, slot and exact prompt");
  const bytes = fs.readFileSync(source), metadata = await sharp(bytes).metadata();
  if (metadata.width < 1000 || metadata.height < 650) throw Error("Source resolution below book illustration requirement");
  fs.mkdirSync(path.dirname(p.target), { recursive: true });
  fs.mkdirSync(path.dirname(p.receipt), { recursive: true });
  // Encoding preserves full composition and dimensions; no crop or painted edit.
  await sharp(bytes).webp({ quality: 92, effort: 6 }).toFile(p.target);
  const output = fs.readFileSync(p.target), sha = value => createHash("sha256").update(value).digest("hex");
  const references = job?.references || [];
  const receipt = { bookId: id, slot, tool: "built-in image_gen", generatedAt: new Date().toISOString(), source, sourceSha256: sha(bytes), output: path.relative(root, p.target), outputSha256: sha(output), width: metadata.width, height: metadata.height, prompt: fs.readFileSync(promptPath, "utf8"), references, manuscriptSource: job?.manuscriptSource, visualReview: "pending" };
  fs.writeFileSync(p.receipt, JSON.stringify(receipt, null, 2) + "\n");
  return { target: p.target, bytes: output.length, sourceSha256: receipt.sourceSha256, outputSha256: receipt.outputSha256 };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { options, remaining } = parseWorldDiscoverySourceArgs(process.argv.slice(2));
  const replace = remaining.includes("--replace");
  const positional = remaining.filter(value => value !== "--replace");
  if (positional.some(value => value.startsWith("--"))) throw Error("Unknown image job option");
  const [action, id, slot, source, promptPath] = positional;
  if (action === "job") {
    if (positional.length !== 3 || replace) throw Error("Image job expects ID and SLOT");
    const job = imageJob(id, slot, options);
    const promptFile = path.join(root, `.artifacts/world-discovery/jobs/${id}-${slot}.txt`);
    fs.mkdirSync(path.dirname(promptFile), { recursive: true });
    fs.writeFileSync(promptFile, job.prompt);
    fs.writeFileSync(promptFile.replace(/\.txt$/, ".json"), JSON.stringify({ ...job, references: job.referenced_image_paths.map(file => ({ path: file, sha256: createHash("sha256").update(fs.readFileSync(file)).digest("hex") })) }, null, 2));
    console.log(JSON.stringify({ ...job, promptFile }));
  }
  else if (action === "install" && positional.length === 5) console.log(JSON.stringify(await install(id, slot, source, promptPath, replace, options)));
  else throw Error("Usage: worldDiscoveryImageJobs.mjs job ID SLOT | install ID SLOT SOURCE PROMPT_FILE [--source-dir DIR --first-number 11 --last-number 20]");
}
