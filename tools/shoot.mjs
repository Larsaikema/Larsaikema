#!/usr/bin/env node
// Playwright screenshot + page-health tool for the local preview servers.
//
//   node tools/shoot.mjs --url http://127.0.0.1:4200/ --out /tmp/shots/home --device both --tiles 3
//   node tools/shoot.mjs --url http://127.0.0.1:4100/products/x --out shots/pdp --full \
//        --actions '[{"click":"button[name=add]"},{"wait":800}]'
//
// Writes <out>-<device>.png (--full / single viewport) or <out>-<device>-<n>.png (--tiles N)
// plus <out>.report.json with console errors, page errors, failed requests, X-Liquid-Errors,
// horizontal overflow, timings (DCL, load, LCP) and theme CSS/JS byte totals.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    const root = execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}

export const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
};

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

export async function launch() {
  const { chromium } = loadPlaywright();
  return chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

export async function runActions(page, actions) {
  for (const act of actions || []) {
    const [kind, arg] = Object.entries(act)[0];
    if (kind === 'click') {
      const sel = typeof arg === 'string' ? arg : arg.selector;
      await page.locator(sel).first().click({ timeout: 8000 });
    } else if (kind === 'hover') {
      await page.locator(typeof arg === 'string' ? arg : arg.selector).first().hover({ timeout: 8000 });
    } else if (kind === 'type') {
      const sel = Array.isArray(arg) ? arg[0] : arg.selector;
      const text = Array.isArray(arg) ? arg[1] : arg.text;
      await page.locator(sel).first().fill('');
      await page.locator(sel).first().type(String(text), { delay: 40 });
    } else if (kind === 'fill') {
      await page.locator(arg[0] ?? arg.selector).first().fill(String(arg[1] ?? arg.text));
    } else if (kind === 'press') {
      await page.keyboard.press(String(arg));
    } else if (kind === 'wait') {
      if (typeof arg === 'number') await page.waitForTimeout(arg);
      else await page.locator(String(arg)).first().waitFor({ state: 'visible', timeout: 10000 });
    } else if (kind === 'scroll') {
      if (typeof arg === 'number') await page.evaluate((y) => window.scrollTo(0, y), arg);
      else await page.locator(String(arg)).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    } else if (kind === 'goto') {
      await page.goto(new URL(String(arg), page.url()).toString(), { waitUntil: 'load' });
    } else if (kind === 'select') {
      await page.locator(arg[0] ?? arg.selector).first().selectOption(String(arg[1] ?? arg.value));
    } else if (kind === 'eval') {
      await page.evaluate(String(arg));
    } else {
      throw new Error(`unknown action ${kind}`);
    }
  }
}

/** Opens url on a fresh context for the device and collects health data. */
export async function openPage(browser, url, deviceName, opts = {}) {
  const ctx = await browser.newContext({ ...DEVICES[deviceName], ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const report = {
    url,
    device: deviceName,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    liquidErrors: null,
    translationMissing: null,
    status: null,
    themeBytes: { css: 0, js: 0 },
    timing: {},
  };
  const origin = new URL(url).origin;
  page.on('console', (msg) => {
    const t = msg.type();
    // the browser logs a console error for an intentionally non-200 document (e.g. the 404 template)
    if (t === 'error' && opts.allowErrorStatus && /Failed to load resource/.test(msg.text()) && msg.location()?.url === url) return;
    if (t === 'error') report.consoleErrors.push(msg.text().slice(0, 500));
    else if (t === 'warning') report.consoleWarnings.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => report.pageErrors.push(String(err && err.stack ? err.stack : err).slice(0, 800)));
  page.on('requestfailed', (req) => {
    const f = req.failure();
    if (f && /ERR_ABORTED/.test(f.errorText)) return; // navigation/abort noise (e.g. superseded fetches)
    report.failedRequests.push({ url: req.url(), error: f ? f.errorText : 'failed' });
  });
  page.on('response', async (res) => {
    const u = res.url();
    const st = res.status();
    if (st >= 400 && !(u === url && opts.allowErrorStatus)) report.failedRequests.push({ url: u, status: st });
    if (u.startsWith(origin)) {
      const p = new URL(u).pathname;
      const isTheme = p.startsWith('/assets/') || p.startsWith('/compiled_assets/');
      if (isTheme) {
        const len = Number(res.headers()['content-length'] || 0);
        if (p.endsWith('.css')) report.themeBytes.css += len;
        else if (p.endsWith('.js')) report.themeBytes.js += len;
      }
    }
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__lcp = Math.round(e.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
  });
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  report.status = resp ? resp.status() : null;
  if (resp) {
    const h = resp.headers();
    report.liquidErrors = h['x-liquid-errors'] !== undefined ? Number(h['x-liquid-errors']) : null;
    report.translationMissing = h['x-translation-missing'] !== undefined ? Number(h['x-translation-missing']) : null;
    report.template = h['x-preview-template'] || null;
  }
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch {}
  report.timing.wall = Date.now() - t0;
  // inline <style> bytes count toward the CSS budget too
  const inlineCss = await page.evaluate(() => [...document.querySelectorAll('style')].reduce((n, s) => n + s.textContent.length, 0));
  report.themeBytes.inlineCss = inlineCss;
  return { ctx, page, report };
}

export async function collectHealth(page, report) {
  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    const offenders = [];
    if (docW > winW + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > winW + 1 && r.width > 0 && getComputedStyle(el).position !== 'fixed') {
          offenders.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} right=${Math.round(r.right)}`);
          if (offenders.length >= 8) break;
        }
      }
    }
    const imgs = [...document.images];
    return {
      dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      load: nav ? Math.round(nav.loadEventEnd) : null,
      lcp: window.__lcp || null,
      overflowX: docW > winW + 1,
      scrollWidth: docW,
      innerWidth: winW,
      overflowOffenders: offenders,
      brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.currentSrc || i.src).slice(0, 20),
      rawTranslationKeys: (document.body.innerText.match(/translation missing: [\w.-]+/g) || []).slice(0, 20),
      liquidErrorText: (document.body.innerText.match(/Liquid (syntax )?error[^\n]{0,160}/g) || []).slice(0, 20),
    };
  });
  report.timing.domContentLoaded = data.dcl;
  report.timing.load = data.load;
  report.timing.lcp = data.lcp;
  report.overflowX = data.overflowX;
  report.scrollWidth = data.scrollWidth;
  report.innerWidth = data.innerWidth;
  report.overflowOffenders = data.overflowOffenders;
  report.brokenImages = data.brokenImages;
  report.rawTranslationKeys = data.rawTranslationKeys;
  report.liquidErrorText = data.liquidErrorText;
  return report;
}

/** Scrolls through the page so lazy images and scroll-reveal animations run before a full-page shot. */
export async function revealPage(page) {
  const vh = page.viewportSize().height;
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(vh * 0.8)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

export async function capture(page, file, { full = false, tiles = 0 } = {}) {
  const files = [];
  if (tiles > 0) {
    const vh = page.viewportSize().height;
    for (let i = 0; i < tiles; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * vh);
      await page.waitForTimeout(350);
      const f = file.replace(/\.png$/, `-${i + 1}.png`);
      await page.screenshot({ path: f });
      files.push(f);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  } else {
    if (full) await revealPage(page);
    await page.screenshot({ path: file, fullPage: !!full });
    files.push(file);
  }
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url || !args.out) {
    console.error('usage: node tools/shoot.mjs --url URL --out PREFIX [--device desktop|mobile|both] [--full | --tiles N] [--actions JSON] [--wait ms]');
    process.exit(2);
  }
  const devices = !args.device || args.device === 'both' ? ['desktop', 'mobile'] : [args.device];
  const actions = args.actions ? JSON.parse(args.actions) : [];
  const tiles = args.tiles ? Number(args.tiles) : 0;
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  const browser = await launch();
  const reports = [];
  try {
    for (const d of devices) {
      const { ctx, page, report } = await openPage(browser, args.url, d, { allowErrorStatus: true });
      if (args.wait) await page.waitForTimeout(Number(args.wait));
      try {
        await runActions(page, actions);
      } catch (e) {
        report.actionError = String(e.message || e).slice(0, 500);
      }
      if (args.wait && actions.length) await page.waitForTimeout(Number(args.wait));
      await collectHealth(page, report);
      report.files = await capture(page, `${args.out}-${d}.png`, { full: !!args.full, tiles });
      reports.push(report);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const out = { url: args.url, generatedAt: new Date().toISOString(), reports };
  fs.writeFileSync(`${args.out}.report.json`, JSON.stringify(out, null, 2));
  for (const r of reports) {
    const issues =
      r.consoleErrors.length + r.pageErrors.length + r.failedRequests.length + (r.liquidErrors || 0) + (r.overflowX ? 1 : 0);
    console.log(
      `${r.device}: status=${r.status} liquid=${r.liquidErrors} console=${r.consoleErrors.length} pageerr=${r.pageErrors.length} failed=${r.failedRequests.length} overflowX=${r.overflowX} lcp=${r.timing.lcp}ms css=${r.themeBytes.css}B js=${r.themeBytes.js}B ${issues ? 'ISSUES' : 'ok'} -> ${r.files.join(', ')}`
    );
    if (r.actionError) console.log(`  action error: ${r.actionError}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
