#!/usr/bin/env node
// Packshot render CLI.
//
//   node renders/render.mjs --spec <file.json | inline-json> --out <file.webp|.jpg|.png>
//        [--size 2000] [--bg #EFEDE8] [--angle hero|front|side|back|top|low|detail]
//        [--samples 40] [--ss 1] [--quality 88]
//   node renders/render.mjs --batch <jobs.jsonl | jobs.json> [--concurrency 1] [same overrides]
//
// A batch job is a spec object with an extra "out" key. Paths in a batch are
// resolved relative to the batch file. Starts its own static server and headless
// Chromium (SwiftShader WebGL2); output is deterministic.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function loadPlaywright() {
  try { return require('playwright'); } catch {}
  const root = execSync('npm root -g').toString().trim();
  return require(path.join(root, 'playwright'));
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) continue;
    const key = k.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) a[key] = true; else { a[key] = next; i++; }
  }
  return a;
}

function readSpec(s, base = process.cwd()) {
  if (typeof s !== 'string') return s;
  const t = s.trim();
  if (t.startsWith('{') || t.startsWith('[')) return JSON.parse(t);
  return JSON.parse(fs.readFileSync(path.resolve(base, t), 'utf8'));
}

function readBatch(file) {
  const txt = fs.readFileSync(file, 'utf8').trim();
  if (txt.startsWith('[')) return JSON.parse(txt);
  return txt.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('//')).map((l) => JSON.parse(l));
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
function startServer(root) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(root, path.normalize(u === '/' ? '/scene.html' : u));
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.spec && !args.batch)) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 11).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(args.help ? 0 : 1);
  }
  let jobs;
  if (args.batch) {
    const bf = path.resolve(args.batch);
    jobs = readBatch(bf).map((j) => ({ ...j, out: path.resolve(path.dirname(bf), j.out) }));
  } else {
    if (!args.out) throw new Error('--out is required');
    jobs = [{ ...readSpec(args.spec), out: path.resolve(args.out) }];
  }
  const override = {};
  if (args.size) override.size = Number(args.size);
  if (args.bg) override.bg = String(args.bg).startsWith('#') ? args.bg : `#${args.bg}`;
  if (args.angle) override.angle = args.angle;
  if (args.samples) override.samples = Number(args.samples);
  const ss = Number(args.ss || 1);
  const quality = args.quality ? Number(args.quality) : null;
  const conc = Math.max(1, Number(args.concurrency || 1));

  const { chromium } = loadPlaywright();
  const srv = await startServer(HERE);
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'] });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'packshot-'));
  const queue = jobs.map((j, i) => ({ ...j, ...override, __i: i }));
  let failed = 0;

  async function worker(wid) {
    const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
    page.on('console', (m) => { const t = m.text(); if (args.verbose || /error|warn/i.test(m.type())) console.log(`  [page ${wid}] ${t}`); });
    page.on('pageerror', (e) => console.error(`  [page ${wid}] ERROR ${e.message}`));
    await page.goto(`http://127.0.0.1:${port}/scene.html`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    while (queue.length) {
      const job = queue.shift();
      const { out, __i, ...spec } = job;
      const finalSize = spec.size || 2000;
      const renderSpec = { ...spec, size: Math.round(finalSize * ss) };
      if (spec.imageWidth) renderSpec.imageWidth = Math.round(spec.imageWidth * ss);
      if (spec.imageHeight) renderSpec.imageHeight = Math.round(spec.imageHeight * ss);
      const t0 = Date.now();
      try {
        const info = await page.evaluate((s) => window.renderSpec(s), renderSpec);
        const dataUrl = await page.evaluate(() => window.grabImage('image/png'));
        const png = path.join(tmp, `r${__i}.png`);
        fs.writeFileSync(png, Buffer.from(dataUrl.split(',')[1], 'base64'));
        fs.mkdirSync(path.dirname(out), { recursive: true });
        const encArgs = [path.join(HERE, 'encode.py'), png, out];
        if (ss !== 1) encArgs.push('--size', String(Math.max(spec.imageWidth || finalSize, spec.imageHeight || finalSize)));
        if (quality) encArgs.push('--quality', String(quality));
        execFileSync('python3', encArgs, { stdio: 'inherit' });
        fs.rmSync(png);
        const kb = (fs.statSync(out).size / 1024).toFixed(0);
        console.log(`✓ ${path.relative(process.cwd(), out)}  ${((Date.now() - t0) / 1000).toFixed(1)}s  ${kb} KB  (${spec.model || 'items'} ${spec.angle || 'hero'}, ${renderSpec.samples || 40} spp)`);
        if (args.json) console.log(JSON.stringify(info));
      } catch (e) {
        failed++;
        console.error(`✗ ${out}: ${e.message.split('\n')[0]}`);
      }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: Math.min(conc, queue.length) }, (_, i) => worker(i)));
  await browser.close();
  srv.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (failed) { console.error(`${failed} job(s) failed`); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
