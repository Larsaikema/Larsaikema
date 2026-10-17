// Render the favicon/app-icon PNGs from the SVGs with headless Chromium (Playwright).
// node brand/tools/rasterize.mjs [brand-dir]
import { createRequire } from 'module'; import { execSync } from 'child_process';
import { fileURLToPath } from 'url'; import path from 'path'; import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(`${execSync('npm root -g').toString().trim()}/playwright`);
const B = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jobs = [
  ['favicon.svg', 32, 'favicon-32.png'],                 // 32-raster drawing (k under the tent)
  ['mark.svg', 192, 'favicon-192.png'],                  // PWA / Android: full vector mark
  ['svg/favicon-16.svg', 16, 'img/favicon-16.png'],      // 16-raster drawing (tent only)
  ['svg/favicon-cart.svg', 32, 'img/favicon-cart-32.png'],
  ['svg/favicon-cart-16.svg', 16, 'img/favicon-cart-16.png'],
  ['svg/apple-touch-icon.svg', 180, 'img/apple-touch-icon-180.png'],   // full-bleed square, iOS rounds it
  ['mark.svg', 512, 'img/mark-512.png'],
  ['logo.svg', 320, 'img/logo-email-320.png', 'w'],                // e-mail header: 160 px on 2x
  ['logo.svg', 1200, 'img/logo-1200.png', 'w'],                     // social, documents
];
const b = await chromium.launch();
for (const [src, s, out, mode] of jobs) {
  const svg = fs.readFileSync(path.join(B, src), 'utf8');
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const h = mode === 'w' ? Math.round(s * vb[3] / vb[2]) : s;
  const p = await b.newPage({ viewport: { width: s, height: h }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:transparent"><img style="display:block;width:${s}px;height:${h}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`);
  await p.waitForTimeout(80);
  fs.mkdirSync(path.dirname(path.join(B, out)), { recursive: true });
  await p.screenshot({ path: path.join(B, out), omitBackground: true });
  await p.close();
}
await b.close(); console.log('ok', jobs.length);
