#!/usr/bin/env node
// Blind A/B shooter for judges: screenshots the same storefront path on our theme (:4100) and the
// Horizon bar (:4200) and writes ONLY neutral file names into the judge directory.
//
//   node tools/ab.mjs --piece pdp --round 1 --path /products/easy-up-partytent-premium --device both --tiles 3
//   node tools/ab.mjs --piece cart-drawer --round 2 --path /products/x \
//        --actions-ours '[{"click":"button[name=add]"},{"wait":1500}]' \
//        --actions-bar  '[{"click":"button[name=add]"},{"wait":800},{"click":".header-actions__cart-icon"},{"wait":1200}]'
//
// Options: --path | --path-a/--path-b (alias --path-ours/--path-bar), --order AB|BA (A = ours when AB; default random),
//          --device desktop|mobile|both, --tiles N (default 1 = first viewport) | --full, --actions JSON (both sides),
//          Tiles scroll the page's REAL scroll container (Horizon desktop scrolls .page-wrapper, not the window),
//          continue below a stuck sticky header, and stop early at the end of the page. The shorter side is then
//          padded with neutral "end of page" tiles so A and B always have the same number of files per device.
//          --wait ms, --reduced-motion, --ours URL (default http://127.0.0.1:4100), --bar URL (default http://127.0.0.1:4200)
// Output:  $SCRATCH/shots/<piece>/r<round>/{A,B}-{desktop,mobile}-<n>.png      (judge directory — nothing else)
//          $SCRATCH/ab-mapping/<piece>-r<round>.json   (which letter is ours + health data; deliberately OUTSIDE
//                                                       shots/ so no judge directory has it as a sibling/ancestor)
import fs from 'node:fs';
import path from 'node:path';
import { launch, openPage, collectHealth, capture, runActions, parseArgs } from './shoot.mjs';

const SCRATCH = process.env.SCRATCH || '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad';
const args = parseArgs(process.argv.slice(2));
if (!args.piece || !(args.path || args['path-a'] || args['path-ours'])) {
  console.error('usage: node tools/ab.mjs --piece NAME --round N --path /url/path [--device both] [--tiles N|--full] [--order AB|BA] [--actions JSON]');
  process.exit(2);
}
const round = String(args.round || 1);
const piece = String(args.piece).replace(/[^\w.-]+/g, '-');
const order = args.order ? String(args.order).toUpperCase() : Math.random() < 0.5 ? 'AB' : 'BA';
if (!['AB', 'BA'].includes(order)) throw new Error('--order must be AB or BA');
const devices = !args.device || args.device === 'both' ? ['desktop', 'mobile'] : [String(args.device)];
const tiles = args.full ? 0 : Number(args.tiles || 1);
const oursBase = String(args.ours || 'http://127.0.0.1:4100').replace(/\/$/, '');
const barBase = String(args.bar || 'http://127.0.0.1:4200').replace(/\/$/, '');

// --path-a/--path-b refer to letters; --path-ours/--path-bar to sides.
const sides = {
  ours: { base: oursBase, path: args['path-ours'] || args.path, actions: args['actions-ours'] || args.actions },
  bar: { base: barBase, path: args['path-bar'] || args.path, actions: args['actions-bar'] || args.actions },
};
const letterOf = { ours: order === 'AB' ? 'A' : 'B', bar: order === 'AB' ? 'B' : 'A' };
if (args['path-a']) sides[letterOf.ours === 'A' ? 'ours' : 'bar'].path = args['path-a'];
if (args['path-b']) sides[letterOf.ours === 'B' ? 'ours' : 'bar'].path = args['path-b'];

const judgeDir = path.join(SCRATCH, 'shots', piece, `r${round}`);
const mapDir = process.env.AB_MAPPING_DIR || path.join(SCRATCH, 'ab-mapping');
fs.mkdirSync(judgeDir, { recursive: true });
fs.mkdirSync(mapDir, { recursive: true });
for (const f of fs.readdirSync(judgeDir)) if (/^[AB]-/.test(f)) fs.unlinkSync(path.join(judgeDir, f));

const browser = await launch();
const health = {};
const files = {};
const padded = {};
try {
  // shoot in letter order (A first) so nothing about timing or file order reveals which side is ours
  const sideOrder = letterOf.ours === 'A' ? ['ours', 'bar'] : ['bar', 'ours'];
  for (const side of sideOrder) {
    const s = sides[side];
    const letter = letterOf[side];
    for (const d of devices) {
      const { ctx, page, report } = await openPage(browser, s.base + s.path, d, { reducedMotion: !!args['reduced-motion'] });
      if (args.wait) await page.waitForTimeout(Number(args.wait));
      try {
        await runActions(page, s.actions ? JSON.parse(s.actions) : []);
      } catch (e) {
        report.actionError = String(e.message || e).split('\n')[0];
      }
      if (args.wait && s.actions) await page.waitForTimeout(Number(args.wait));
      await collectHealth(page, report);
      report.capture = {};
      const shot = await capture(page, path.join(judgeDir, `${letter}-${d}.png`), { full: !!args.full, tiles, meta: report.capture });
      // normalise single shots to the -1 suffix so every set looks identical
      const names = shot.map((f, i) => {
        if (/-\d+\.png$/.test(f)) return f;
        const nf = f.replace(/\.png$/, `-${i + 1}.png`);
        fs.renameSync(f, nf);
        return nf;
      });
      files[`${letter}-${d}`] = names.map((f) => path.basename(f));
      health[`${side}-${d}`] = report;
      await ctx.close();
    }
  }
  // equal tile counts per device: pad the shorter side with neutral end-of-page tiles of the same size
  if (tiles > 1) {
    for (const d of devices) {
      const a = files[`A-${d}`] || [];
      const b = files[`B-${d}`] || [];
      const n = Math.max(a.length, b.length);
      for (const [letter, list] of [['A', a], ['B', b]]) {
        if (!list.length || list.length >= n) continue;
        const buf = fs.readFileSync(path.join(judgeDir, list[0]));
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        await page.setContent(
          '<body style="margin:0;height:100vh;background:#ececec;display:grid;place-items:center;' +
            'font:500 16px/1.4 system-ui,sans-serif;color:#8a8a8a">— einde van de pagina —</body>'
        );
        const real = list.length;
        for (let i = real; i < n; i++) {
          const f = `${letter}-${d}-${i + 1}.png`;
          await page.screenshot({ path: path.join(judgeDir, f) });
          list.push(f);
        }
        await ctx.close();
        padded[`${letter}-${d}`] = { realTiles: real, paddedTo: n };
      }
    }
  }
} finally {
  await browser.close();
}

// identical mtimes on every judge file: modification times must not reveal the shooting order
const stamp = new Date();
for (const f of fs.readdirSync(judgeDir)) if (/^[AB]-/.test(f)) fs.utimesSync(path.join(judgeDir, f), stamp, stamp);

const mapping = {
  piece,
  round: Number(round),
  createdAt: new Date().toISOString(),
  order,
  A: letterOf.ours === 'A' ? 'ours' : 'bar',
  B: letterOf.ours === 'B' ? 'ours' : 'bar',
  ours: { letter: letterOf.ours, url: sides.ours.base + sides.ours.path, actions: sides.ours.actions || null },
  bar: { letter: letterOf.bar, url: sides.bar.base + sides.bar.path, actions: sides.bar.actions || null },
  judgeDir,
  files,
  padded,
  health,
};
const mapFile = path.join(mapDir, `${piece}-r${round}.json`);
fs.writeFileSync(mapFile, JSON.stringify(mapping, null, 2));
console.log(`judge dir: ${judgeDir}`);
console.log(`files: ${Object.values(files).flat().join(' ')}`);
console.log(`mapping (do NOT give to judges): ${mapFile}`);
for (const [k, r] of Object.entries(health)) {
  const bad = (r.liquidErrors || 0) + r.consoleErrors.length + r.pageErrors.length + r.failedRequests.length;
  const c = r.capture || {};
  if (c.tileOffsets) console.log(`  ${k}: scroller=${c.scroller} tiles=${c.tilesCaptured}/${c.tilesRequested} offsets=${c.tileOffsets.join(',')} pageHeight=${c.pageHeight}`);
  console.log(`  ${k}: liquid=${r.liquidErrors} console=${r.consoleErrors.length} pageerr=${r.pageErrors.length} failed=${r.failedRequests.length} overflowX=${r.overflowX}${r.actionError ? ` actionError=${r.actionError}` : ''}${bad ? ' ISSUES' : ''}`);
}
