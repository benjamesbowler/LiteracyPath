import { HOP_AND_STOP_PAGES } from "../../data/hopAndStop.js";
import { useState } from "react";
import "../../styles/hop-and-stop.css";

export function HopAndStopLibraryCard({ onOpen }) {
  const [pictureUnavailable, setPictureUnavailable] = useState(false);
  return <section className="hop-stop-library-card" aria-label="Hop and Stop song and story">
    {pictureUnavailable ? <span className="hop-stop-library-picture-missing">Song and story</span>
      : <img src={HOP_AND_STOP_PAGES[0].image} alt="Bouncy and Speedy ready to play." loading="lazy" onError={() => setPictureUnavailable(true)} />}
    <div><h2>Hop and Stop</h2><p>Sing, read together, and play with Bouncy and Speedy.</p></div>
    <button type="button" className="hop-stop-button" onClick={onOpen}>Open song and story</button>
  </section>;
}
