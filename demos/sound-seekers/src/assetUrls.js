// Vite emits content-hashed, same-origin media in both the app and chapter
// preview. Keeping authoring paths separate lets the content tests run in Node.
const files = import.meta.glob('../assets/**/*.{glb,mp3,png,webp}', {
  eager: true, query: '?url&no-inline', import: 'default',
});
const urls = Object.fromEntries(Object.entries(files).map(([path, url]) => [
  path.replace('../assets/', '/assets/'), url,
]));

export function woodlandAssetUrl(path) {
  const url = urls[path];
  if (!url) throw new Error(`Missing woodland asset: ${path}`);
  return url;
}
