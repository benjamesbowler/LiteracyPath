import StarGalleryArcadeGame from "./StarGalleryArcadeGame.jsx";
import { STAR_GALLERY_ATLASES } from "./starGalleryArt.generated.js";

export default function StarGalleryGame(props) {
  return <StarGalleryArcadeGame kind="star-gallery" groveAtlases={STAR_GALLERY_ATLASES} {...props} />;
}
