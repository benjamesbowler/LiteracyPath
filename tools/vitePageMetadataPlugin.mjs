import fs from "node:fs";
import path from "node:path";
import {
  metadataForPath, PUBLIC_LEGAL_PATHS, PUBLIC_SITE_ORIGIN,
  SHARE_IMAGE_PATH, SITEMAP_PATHS
} from "../src/policy/pageMetadata.js";

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

export function metadataHtml(metadata) {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const url = escapeHtml(`${PUBLIC_SITE_ORIGIN}${metadata.path}`);
  const image = `${PUBLIC_SITE_ORIGIN}${SHARE_IMAGE_PATH}`;
  return `<!-- lp-metadata:start -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${metadata.robots}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Literacy Guide" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Literacy Guide lighthouse and open-book logo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="Literacy Guide lighthouse and open-book logo" />
    <!-- lp-metadata:end -->`;
}

export function withMetadata(html, metadata) {
  const withoutOldMetadata = html
    .replace(/<!-- lp-metadata:start -->[\s\S]*?<!-- lp-metadata:end -->/g, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+name=["'](?:description|robots)["'][^>]*>/gi, "");
  return withoutOldMetadata.replace("</head>", `${metadataHtml(metadata)}\n  </head>`);
}

export function pageMetadataPlugin() {
  let config;
  return {
    name: "literacy-guide-page-metadata",
    configResolved(resolved) { config = resolved; },
    transformIndexHtml(html, context) {
      if (context.path.startsWith("/preview/")) return html;
      return withMetadata(html, metadataForPath((context.originalUrl || context.path).split("?")[0]));
    },
    writeBundle() {
      const output = path.resolve(config.root, config.build.outDir);
      const shell = fs.readFileSync(path.join(output, "index.html"), "utf8");
      for (const route of ["/parent", "/soundkeys"]) {
        fs.writeFileSync(path.join(output, `${route.slice(1)}.html`), withMetadata(shell, metadataForPath(route)));
      }
      // Legal copy remains authoritative in each public HTML source.
      for (const route of [...PUBLIC_LEGAL_PATHS, "/404.html"]) {
        const file = path.join(output, route.slice(1));
        const html = fs.readFileSync(file, "utf8");
        const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
        const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1];
        if (!title || !description) throw new Error(`Missing public metadata: ${route}`);
        fs.writeFileSync(file, withMetadata(html, {
          title, description, path: route,
          robots: route === "/404.html" ? "noindex,nofollow" : "index,follow"
        }));
      }
      fs.writeFileSync(path.join(output, "robots.txt"),
        `User-agent: *\nAllow: /\nDisallow: /parent\nDisallow: /preview/\nDisallow: /demos/\nSitemap: ${PUBLIC_SITE_ORIGIN}/sitemap.xml\n`);
      fs.writeFileSync(path.join(output, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP_PATHS.map(route => `  <url><loc>${PUBLIC_SITE_ORIGIN}${route}</loc></url>`).join("\n")}\n</urlset>\n`);
    }
  };
}
