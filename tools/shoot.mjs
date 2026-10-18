#!/usr/bin/env node
// Playwright screenshot + page-health tool for the local preview servers.
//
//   node tools/shoot.mjs --url http://127.0.0.1:4200/ --out /tmp/shots/home --device both --tiles 3
//   (--reduced-motion emulates prefers-reduced-motion so scroll-reveal animations never leave faded content)
//   node tools/shoot.mjs --url http://127.0.0.1:4100/products/x --out shots/pdp --full \
//        --actions '[{"click":"button[name=add]"},{"wait":800}]'
//
// Scrolling always targets the page's real scroll container (Horizon >=990px scrolls .page-wrapper with
// html/body overflow:hidden, so window.scrollTo and Playwright fullPage alone do nothing there).
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
      const force = !!(act.force || (typeof arg === 'object' && arg.force));
      await page.locator(sel).first().click({ timeout: 8000, force });
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
      if (typeof arg === 'number') await scrollToY(page, arg);
      else {
        await page.locator(String(arg)).first().scrollIntoViewIfNeeded();
        await installHelpers(page);
        await page.evaluate(() => window.__shoot.settle());
      }
      await page.waitForTimeout(150);
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
  const ctx = await browser.newContext({
    ...DEVICES[deviceName],
    ignoreHTTPSErrors: true,
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const report = {
    url,
    device: deviceName,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    subrequestLiquidErrors: [],
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
      const le = Number(res.headers()['x-liquid-errors'] || 0);
      if (le > 0 && u !== url) report.subrequestLiquidErrors.push({ url: u, errors: le });
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
  await installHelpers(page);
  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const sc = window.__shoot.scroller();
    // horizontal overflow of the document OR of an inner page scroller (Horizon desktop .page-wrapper)
    const innerOverflow = sc !== (document.scrollingElement || document.documentElement) && sc.scrollWidth > sc.clientWidth + 1;
    const docW = Math.max(document.documentElement.scrollWidth, innerOverflow ? sc.scrollWidth + (window.innerWidth - sc.clientWidth) : 0);
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

// ---------------------------------------------------------------------------------------------
// Scroll-container awareness.
//
// Not every theme scrolls the window: Horizon 4.x at >=990px sets html/body to height:100dvh +
// overflow:hidden and scrolls `.page-wrapper` instead. window.scrollTo() and Playwright's
// fullPage then do nothing. Everything below finds the element that really scrolls, scrolls it
// instantly (themes set scroll-behavior:smooth), waits until the position, transitions and
// in-view images have settled, and only then shoots.
// ---------------------------------------------------------------------------------------------

/** Installs window.__shoot helpers in the page (idempotent; re-run after every navigation). */
async function installHelpers(page) {
  await page.evaluate(() => {
    if (window.__shoot) return;
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const doc = () => document.scrollingElement || document.documentElement;
    const scrollableY = (el) => {
      const cs = getComputedStyle(el);
      return /(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
    };
    const inDialog = (el) => !!el.closest('dialog, [role=dialog], [aria-modal=true], [popover]');
    const describe = (el) => {
      if (el === doc()) return 'document';
      let d = el.tagName.toLowerCase();
      if (el.id) d += '#' + el.id;
      if (typeof el.className === 'string' && el.className.trim()) d += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
      return d;
    };
    const api = {
      /** The page's main scroll container: the document when it can scroll, otherwise the largest
       *  scrollable element that covers most of the viewport (not inside a dialog/drawer). */
      scroller() {
        const cached = document.querySelector('[data-shoot-scroller]');
        if (cached && cached.isConnected && scrollableY(cached)) return cached;
        if (cached) cached.removeAttribute('data-shoot-scroller');
        const d = doc();
        const htmlCs = getComputedStyle(document.documentElement);
        const bodyCs = getComputedStyle(document.body);
        const docLocked = htmlCs.overflowY === 'hidden' || (bodyCs.overflowY === 'hidden' && htmlCs.overflowY === 'visible');
        if (!docLocked && d.scrollHeight > d.clientHeight + 1) return d;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let best = null;
        let bestScore = 0;
        for (const el of document.querySelectorAll('body, body *')) {
          if (!scrollableY(el) || inDialog(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < vw * 0.5 || r.height < vh * 0.5) continue;
          const score = r.width * r.height + (el.scrollHeight - el.clientHeight) / 1000;
          if (score > bestScore) {
            best = el;
            bestScore = score;
          }
        }
        if (!best) return d;
        best.setAttribute('data-shoot-scroller', '');
        return best;
      },
      info() {
        const el = api.scroller();
        const isDoc = el === doc();
        return {
          scroller: describe(el),
          isDocument: isDoc,
          scrollTop: Math.round(el.scrollTop),
          scrollHeight: el.scrollHeight,
          clientHeight: isDoc ? window.innerHeight : el.clientHeight,
          scrollWidth: el.scrollWidth,
          clientWidth: isDoc ? window.innerWidth : el.clientWidth,
          maxScroll: Math.max(0, el.scrollHeight - (isDoc ? window.innerHeight : el.clientHeight)),
        };
      },
      noSmooth(el) {
        for (const n of new Set([document.documentElement, document.body, el])) n.style.setProperty('scroll-behavior', 'auto', 'important');
      },
      /** Instantly scrolls the main scroller to y and waits until everything has settled. */
      async scrollTo(y, settleMs = 1500) {
        const el = api.scroller();
        api.noSmooth(el);
        if (el === doc()) window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        else el.scrollTo({ top: y, left: 0, behavior: 'instant' });
        await api.settle(el, settleMs);
        return Math.round(el.scrollTop);
      },
      async settle(el = api.scroller(), maxMs = 1500) {
        const t0 = performance.now();
        // 1. scroll position stable for 3 consecutive frames
        let last = -1;
        let stable = 0;
        for (let k = 0; k < 120 && stable < 3; k++) {
          await raf();
          const t = el.scrollTop;
          stable = Math.abs(t - last) < 0.5 ? stable + 1 : 0;
          last = t;
        }
        // 2. finite CSS transitions/animations triggered by the scroll (sticky header show/hide, reveals)
        await sleep(60);
        while (performance.now() - t0 < maxMs) {
          const running = document.getAnimations().filter((a) => {
            if (a.playState !== 'running') return false;
            const end = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().endTime : Infinity;
            return typeof end === 'number' && Number.isFinite(end);
          });
          if (!running.length) break;
          await sleep(50);
        }
        // 3. images intersecting the viewport have loaded (lazy images start once they intersect)
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        while (performance.now() - t0 < maxMs + 3000) {
          const pending = [...document.images].filter((img) => {
            if (img.complete) return false;
            const r = img.getBoundingClientRect();
            if (!(r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && r.width > 0 && r.height > 0)) return false;
            return img.checkVisibility ? img.checkVisibility({ visibilityProperty: true }) : true;
          });
          if (!pending.length) break;
          await sleep(80);
        }
        await raf();
        await raf();
      },
      /** Height of sticky/fixed bars glued to the top of the viewport (e.g. a sticky header). */
      topOverlay() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let bottom = 0;
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (cs.position !== 'sticky' && cs.position !== 'fixed') continue;
          if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
          if (inDialog(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.top > 2 || r.bottom <= 0 || r.width < vw * 0.6 || r.height < 8) continue;
          if (r.bottom > vh * 0.35) continue;
          bottom = Math.max(bottom, r.bottom);
        }
        return Math.round(bottom);
      },
      /** Lets the document grow to its full height so a fullPage screenshot captures everything. */
      unlock() {
        const el = api.scroller();
        if (el === doc()) return false;
        el.scrollTo({ top: 0, behavior: 'instant' });
        el.setAttribute('data-shoot-unlocked', '');
        const st = document.createElement('style');
        st.id = '__shoot-unlock';
        st.textContent =
          'html,body{height:auto!important;max-height:none!important;overflow:visible!important}' +
          '[data-shoot-unlocked]{height:auto!important;max-height:none!important;overflow:visible!important}';
        document.head.appendChild(st);
        return true;
      },
      relock() {
        document.getElementById('__shoot-unlock')?.remove();
        document.querySelector('[data-shoot-unlocked]')?.removeAttribute('data-shoot-unlocked');
      },
    };
    window.__shoot = api;
  });
}

/** Describes the page's real scroll container ({scroller, isDocument, scrollTop, scrollHeight, clientHeight, maxScroll}). */
export async function scrollInfo(page) {
  await installHelpers(page);
  return page.evaluate(() => window.__shoot.info());
}

/** Instantly scrolls the real scroll container to y, waits for it to settle; returns the reached scrollTop. */
export async function scrollToY(page, y, settleMs = 1500) {
  await installHelpers(page);
  return page.evaluate(([yy, ms]) => window.__shoot.scrollTo(yy, ms), [y, settleMs]);
}

/** Scrolls through the whole page (via the real scroller) so lazy images, lazy sections and
 *  scroll-reveal animations run; ends back at the top. Returns the final scrollInfo. */
export async function revealPage(page, { step = 0.6, pause = 200 } = {}) {
  await installHelpers(page);
  let info = await scrollInfo(page);
  let y = 0;
  for (let guard = 0; guard < 200; guard++) {
    y += Math.round(info.clientHeight * step);
    await page.evaluate(([yy, ms]) => window.__shoot.scrollTo(yy, ms), [y, 400]);
    await page.waitForTimeout(pause);
    info = await scrollInfo(page); // lazy content can make the page grow
    if (y >= info.maxScroll) break;
  }
  await scrollToY(page, info.maxScroll, 800);
  await page.waitForTimeout(400);
  try {
    await page.waitForLoadState('networkidle', { timeout: 4000 });
  } catch {}
  await scrollToY(page, 0, 1200);
  await page.waitForTimeout(300);
  return scrollInfo(page);
}

/**
 * Screenshots the page.
 *   tiles N: consecutive viewport tiles taken by scrolling the real scroller. Each next tile starts
 *            where the previous one ended minus the sticky top bar, so nothing hides under a sticky
 *            header. Stops early at the end of the page (no duplicate tiles).
 *   full:    one full-page PNG; an inner scroll container is temporarily unlocked so the document
 *            has the real page height.
 *   default: the current viewport.
 * Returns the written file paths; details go into meta (if given).
 */
export async function capture(page, file, { full = false, tiles = 0, meta = null } = {}) {
  const files = [];
  await installHelpers(page);
  const m = meta || {};
  if (tiles > 0) {
    if (tiles > 1) await revealPage(page);
    let info = await scrollInfo(page);
    m.scroller = info.scroller;
    m.tilesRequested = tiles;
    m.tileOffsets = [];
    let y = await scrollToY(page, 0);
    for (let i = 0; i < tiles; i++) {
      if (i > 0) {
        info = await scrollInfo(page);
        const target = Math.min(y + info.clientHeight, info.maxScroll);
        if (target <= y + 2) break; // end of page reached
        const prev = y;
        y = await scrollToY(page, target);
        // a sticky header that is stuck at this position hides the first pixels of the tile: step back by its height
        const overlay = await page.evaluate(() => window.__shoot.topOverlay());
        if (overlay > 0) {
          const t2 = Math.min(prev + info.clientHeight - overlay, info.maxScroll);
          if (t2 < y - 1) y = await scrollToY(page, t2);
        }
      }
      await page.waitForTimeout(120);
      const f = file.replace(/\.png$/, `-${i + 1}.png`);
      await page.screenshot({ path: f });
      files.push(f);
      m.tileOffsets.push(y);
    }
    m.tilesCaptured = files.length;
    m.pageHeight = info.scrollHeight;
    await scrollToY(page, 0, 600);
  } else if (full) {
    const info = await revealPage(page);
    m.scroller = info.scroller;
    m.pageHeight = info.scrollHeight;
    const unlocked = await page.evaluate(() => window.__shoot.unlock());
    if (unlocked) await page.evaluate(() => window.__shoot.settle(document.scrollingElement, 800));
    // content-visibility:auto (Horizon's footer) skips painting far from the viewport; a shopper who scrolls
    // there sees it, so paint everything for the one-shot full-page PNG.
    await page.evaluate(() => {
      const st = document.createElement('style');
      st.id = '__shoot-cv';
      st.textContent = '*{content-visibility:visible!important}';
      document.head.appendChild(st);
    });
    await page.waitForTimeout(150);
    try {
      await page.screenshot({ path: file, fullPage: true });
    } finally {
      await page.evaluate(() => document.getElementById('__shoot-cv')?.remove());
      if (unlocked) await page.evaluate(() => window.__shoot.relock());
    }
    m.unlocked = unlocked;
    files.push(file);
  } else {
    await page.screenshot({ path: file });
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
      const { ctx, page, report } = await openPage(browser, args.url, d, { allowErrorStatus: true, reducedMotion: !!args['reduced-motion'] });
      if (args.wait) await page.waitForTimeout(Number(args.wait));
      try {
        await runActions(page, actions);
      } catch (e) {
        report.actionError = String(e.message || e).slice(0, 500);
      }
      if (args.wait && actions.length) await page.waitForTimeout(Number(args.wait));
      await collectHealth(page, report);
      report.capture = {};
      report.files = await capture(page, `${args.out}-${d}.png`, { full: !!args.full, tiles, meta: report.capture });
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
    if (r.capture && (r.capture.scroller || r.capture.tilesCaptured !== undefined))
      console.log(`  scroller=${r.capture.scroller} pageHeight=${r.capture.pageHeight}${r.capture.tileOffsets ? ` tiles=${r.capture.tilesCaptured}/${r.capture.tilesRequested} offsets=${r.capture.tileOffsets.join(',')}` : ''}${r.capture.unlocked ? ' (inner scroller unlocked for full page)' : ''}`);
    if (r.actionError) console.log(`  action error: ${r.actionError}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
