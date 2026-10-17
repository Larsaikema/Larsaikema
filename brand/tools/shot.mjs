// Full-page screenshot that also works above Chromium's ~16k px capture limit: the page is captured in
// viewport-sized bands while scrolling, then stitched with Pillow.
// node shot.mjs <url> <out.png> [width=1440] [bandHeight=900] [full=1] [dpr=1]
import { createRequire } from 'module'; import { execSync, execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require(`${execSync('npm root -g').toString().trim()}/playwright`);
const [,, url, out, w = '1440', h = '900', full = '1', dpr = '1'] = process.argv;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: +w, height: 2000 }, deviceScaleFactor: +dpr });
const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); p.on('pageerror', e => errs.push(String(e)));
p.on('requestfailed', r => errs.push('FAILED ' + r.url()));
p.on('response', r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url()}`); });
await p.goto(url, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const sw = await p.evaluate(() => document.documentElement.scrollWidth);
if (full !== '1') { await p.setViewportSize({ width: +w, height: +h }); await p.screenshot({ path: out }); }
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
  const band = 2000; const parts = [];
  for (let y = 0, i = 0; y < H; y += band, i++) {
    const hh = Math.min(band, H - y);
    await p.setViewportSize({ width: +w, height: hh });
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(150);
    const f = path.join(tmp, `p${String(i).padStart(3, '0')}.png`);
    await p.screenshot({ path: f }); parts.push(f);
  }
  execFileSync('python3', ['-c', `import sys\nfrom PIL import Image\nims=[Image.open(f) for f in sys.argv[2:]]\nW=ims[0].width;H=sum(i.height for i in ims)\nc=Image.new('RGB',(W,H));y=0\nfor i in ims:\n  c.paste(i,(0,y));y+=i.height\nc.save(sys.argv[1],optimize=True)`, out, ...parts]);
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(JSON.stringify({ errs, height: H, sw }));
await b.close();
