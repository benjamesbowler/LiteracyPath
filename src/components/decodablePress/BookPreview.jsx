import { getPressAsset } from "../../content/decodablePress/pressAssetRegistry.js";

export function BookPreview({ book, authorName = "" }) {
  return <article className="press-book-preview" aria-label={`Preview of ${book.title || "untitled book"}`}><header><span>Class Decodable Press</span><h2>{book.title || "My book"}</h2>{authorName && <p>By {authorName}</p>}</header><div>{book.pages.map((page,index) => { const asset=getPressAsset(page.assetId); return <section key={index}><span>Page {index+1}</span>{asset && <img src={asset.src} alt={asset.alt} />}<p>{page.text || "This page is waiting for words."}</p></section>; })}</div></article>;
}
