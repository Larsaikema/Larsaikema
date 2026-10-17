// Render the favicon/app-icon PNGs from the SVGs with headless Chromium (Playwright).
// node brand/tools/rasterize.mjs   (run from anywhere)
import { createRequire } from 'module'; import { execSync } from 'child_process';
import { fileURLToPath } from 'url'; import path from 'path'; import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(`${execSync('npm root -g').toString().trim()}/playwright`);
const B = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jobs = [
  ['favicon.svg', 32, 'favicon-32.png', 'transparent'],
  ['favicon.svg', 192, 'favicon-192.png', 'transparent'],
  ['svg/favicon-16.svg', 16, 'img/favicon-16.png', 'transparent'],
  ['mark.svg', 180, 'img/apple-touch-icon-180.png', '#BE3A1D'],
  ['mark.svg', 512, 'img/mark-512.png', 'transparent'],
];
const b = await chromium.launch();
for (const [src, s, out, bg] of jobs) {
  const p = await b.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
  const svg = fs.readFileSync(path.join(B, src), 'utf8');
  await p.setContent(`<html><body style="margin:0;background:${bg}"><img style="display:block;width:${s}px;height:${s}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`);
  await p.waitForTimeout(80);
  fs.mkdirSync(path.dirname(path.join(B, out)), { recursive: true });
  await p.screenshot({ path: path.join(B, out), omitBackground: bg === 'transparent' });
  await p.close();
}
await b.close(); console.log('ok');
