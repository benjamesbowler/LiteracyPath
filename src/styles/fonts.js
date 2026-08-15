/**
 * Self-hosted typefaces.
 *
 * WHY. index.html used to pull seven families from fonts.googleapis.com, with
 * the files themselves coming from fonts.gstatic.com. That is a request to
 * Google from every visitor's browser before they have touched anything —
 * including, now, an anonymous child in the try-out, whose whole basis is that
 * nothing about them goes anywhere. docs/legal/SUBPROCESSORS.md had already
 * flagged it as "must be removed or approved before launch".
 *
 * Self-hosting is also simply faster: no DNS lookup, no TLS handshake and no
 * round trip to a second origin before text can render.
 *
 * These are the Fontsource packages — the same open-licensed files Google
 * serves, published to npm and bundled by Vite with hashed filenames. Each
 * family's licence travels with it in node_modules.
 *
 * ONLY THE WEIGHTS THE APP ACTUALLY USED. The old Google URL asked for exactly
 * these. Importing a family wholesale would pull nine weights where three are
 * wanted and quietly add megabytes to a product used on school wifi.
 */

/* Anton and Press Start 2P ship a single weight each. */
import "@fontsource/anton/400.css";
import "@fontsource/press-start-2p/400.css";

/* Baloo 2 — 500, 600, 700 */
import "@fontsource/baloo-2/500.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";

/* Fredoka — 400, 500, 600, 700 */
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";

/* Inter — 400 through 800 */
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

/* Lexend — 400 through 700 */
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/lexend/700.css";

/* Nunito — 400 through 800 */
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/500.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
