// Generates PWA icons (192, 512, maskable 512, apple-touch 180) from the Treblr wordmark + mark.
// Run: node scripts/make-icons.mjs  (needs Playwright; fonts embedded as data URLs if available)
import fs from 'fs';
import path from 'path';
const { chromium } = await import(process.env.PW_PATH || 'playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fontPath = process.env.ICON_FONT || '/tmp/sg.woff2';
const font = fs.existsSync(fontPath) ? `@font-face{font-family:SG;src:url(data:font/woff2;base64,${fs.readFileSync(fontPath).toString('base64')}) format('woff2');font-weight:700}` : '';
// Equaliser bars above the wordmark (the wordmark is the identity; bars read at small sizes).
const mark = (size, color = '#C6FF3D') => { const h = [0.45, 0.8, 1, 0.65, 0.35]; const w = size / 9; return `<svg width="${size}" height="${size * 0.55}" viewBox="0 0 ${size} ${size * 0.55}">${h.map((v, i) => `<rect x="${i * w * 1.9 + w * 0.3}" y="${size * 0.55 * (1 - v)}" width="${w}" height="${size * 0.55 * v}" rx="${w / 2}" fill="${i === 2 ? '#f5f5f7' : color}"/>`).join('')}</svg>`; };
const html = (size, { maskable = false, rounded = true } = {}) => {
  const pad = maskable ? size * 0.2 : size * 0.1;
  const inner = size - pad * 2;
  return `<!doctype html><html><head><style>${font}html,body{margin:0;background:transparent}
  .i{width:${size}px;height:${size}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${inner * 0.02}px;
  background:radial-gradient(circle at 30% 20%,#1d2410,#0B0B0F 62%);border-radius:${maskable || !rounded ? 0 : size * 0.22}px;overflow:hidden}
  .w{font-family:SG,'DejaVu Sans',sans-serif;font-weight:700;color:#f5f5f7;font-size:${inner * 0.215}px;letter-spacing:-.04em;line-height:1}
  .w b{color:#C6FF3D}</style></head><body><div class="i">${mark(inner * 0.5)}<div class="w">TREBL<b>R</b></div></div></body></html>`;
};
const b = await chromium.launch();
const page = await b.newPage({ deviceScaleFactor: 1 });
const out = path.join(root, 'public', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const [name, size, opts] of [['icon-192.png', 192, {}], ['icon-512.png', 512, {}], ['icon-maskable-512.png', 512, { maskable: true }], ['icon-maskable-192.png', 192, { maskable: true }], ['apple-touch-icon.png', 180, { rounded: false }]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, opts));
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await b.close();
console.log('icons written to', out);
