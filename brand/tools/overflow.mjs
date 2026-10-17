import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(`${execSync('npm root -g').toString().trim()}/playwright`);
const [,, url, w='1440'] = process.argv;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
const errs=[]; p.on('pageerror', e => errs.push(String(e))); p.on('requestfailed', r => errs.push('FAILED ' + r.url()));
p.on('response', r => { if (r.status() >= 400) errs.push(r.status()+' '+r.url()); });
await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
const res = await p.evaluate(() => {
  const out = [];
  const boxes = [...document.querySelectorAll('.card,.tile,.construct,.repro,.store,.zakblok,.app,.legal,.say,.sw,.pc,.gs,.spec,.plan,.alert,.toast,.scheme,.icons div,.changes div')];
  for (const box of boxes) {
    const br = box.getBoundingClientRect();
    for (const el of box.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      let anc = el.parentElement, clipped = false;
      while (anc && anc !== box) { const cs = getComputedStyle(anc); if (cs.overflow !== 'visible' || cs.overflowX !== 'visible') { clipped = true; break; } anc = anc.parentElement; }
      if (clipped) continue;
      if (r.right > br.right + 1 || r.left < br.left - 1) out.push({ box: box.className, el: el.tagName + '.' + el.className, txt: (el.textContent||'').trim().slice(0, 40), over: Math.round(Math.max(r.right - br.right, br.left - r.left)) });
    }
  }
  // text wrapping check for nowrap-ish labels
  const wraps = [...document.querySelectorAll('.icons div,.statelbl,.b,.btn')].filter(e => e.getClientRects().length > 1 || e.getBoundingClientRect().height > 60).map(e => e.textContent.trim().slice(0, 30));
  return { out: out.slice(0, 40), n: out.length, wraps, sw: document.documentElement.scrollWidth };
});
console.log(JSON.stringify({ errs, ...res }, null, 1));
await b.close();
