import { PRESS_ASSETS } from "../../content/decodablePress/pressAssetRegistry.js";

export function PageIllustrator({ pageNumber, value, allowedAssetIds, onChange, disabled = false }) {
  const assets = PRESS_ASSETS.filter(asset => allowedAssetIds.includes(asset.id));
  return <fieldset disabled={disabled} className="press-assets"><legend>Picture for page {pageNumber}</legend><p>Choose one approved LiteracyPath scene. There is no camera or image upload.</p><div>{assets.map(asset => <label className={value===asset.id?"is-selected":""} key={asset.id}><input type="radio" name={`asset-${pageNumber}`} value={asset.id} checked={value===asset.id} onChange={() => onChange(asset.id)} /><img src={asset.src} alt={asset.alt} /><span>{asset.label}</span></label>)}</div></fieldset>;
}
