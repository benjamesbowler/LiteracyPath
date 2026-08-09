import { getPressAsset } from "../../content/decodablePress/pressAssetRegistry.js";
import { openHtmlDocument } from "../openHtmlDocument.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function buildPressBookletDocument({ book, authorName = "", revisionId }) {
  if (!revisionId || !book?.title || !Array.isArray(book.pages) || book.pages.length !== 4) throw new Error("A frozen four-page revision is required for printing.");
  const pages = book.pages.map((page,index) => {
    const asset=getPressAsset(page.assetId); if(!asset) throw new Error(`Page ${index+1} has no approved picture.`);
    return `<section class="booklet-page" data-revision-id="${escapeHtml(revisionId)}" aria-label="Page ${index+1}"><span>Page ${index+1}</span><img src="${escapeHtml(asset.src)}" alt="${escapeHtml(asset.alt)}"><p>${escapeHtml(page.text)}</p></section>`;
  }).join("");
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(book.title)}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172238;margin:0}.booklet{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}.booklet-page{height:88mm;border:1px solid #94a3b8;border-radius:4mm;padding:5mm;display:grid;grid-template-rows:auto 1fr auto;break-inside:avoid}.booklet-page>span{color:#52645e;font-size:10pt}.booklet-page img{width:100%;height:50mm;object-fit:contain}.booklet-page p{font-size:17pt;line-height:1.4;margin:2mm 0}.booklet-meta{text-align:center;margin-bottom:4mm}.booklet-meta h1{margin:0}.booklet-meta p{margin:1mm}@media print{.booklet-page{border-color:#64748b}}</style></head><body><header class="booklet-meta"><h1>${escapeHtml(book.title)}</h1>${authorName?`<p>By ${escapeHtml(authorName)}</p>`:""}<small>Class Decodable Press · Teacher-approved revision ${escapeHtml(revisionId.slice(0,8))}</small></header><main class="booklet">${pages}</main></body></html>`;
  return { title: book.title, html };
}

export function printPressBooklet(input) {
  const { html }=buildPressBookletDocument(input);
  return openHtmlDocument({ prepareHtml:()=>Promise.resolve(html), name:"lp-decodable-press-booklet", features:"width=1100,height=800", autoPrint:true });
}
