#!/usr/bin/env node
// Storefront QA crawler for the local preview servers.
//
//   node tools/check.mjs --base http://127.0.0.1:4200 [--out report.json] [--devices desktop,mobile]
//        [--max-products 6] [--max-articles 3] [--concurrency 3] [--no-flows | --flows-only] [--no-scroll] [--search-term t] [--strict] [--only /cart,/search,/collections/*]
//
// Visits every route type (home, collections list, every collection + a filtered/sorted one, sample products
// incl. ?variant= and /collections/x/products/y URLs, cart empty + with items (added via /cart/add.js), search
// with results / without results, every page, blogs, articles, policies, 404, password, gift card) at desktop and
// mobile, and reports per URL: Liquid error count (X-Liquid-Errors), console errors, page errors, failed requests,
// horizontal overflow, broken images, raw translation keys, images without alt, images without width/height.
// Every page is scrolled top to bottom through its REAL scroll container first (Horizon desktop scrolls
// .page-wrapper, not the window), so lazy images/sections below the fold are requested and checked too.
// Then interaction flows run by default (tools/flows.mjs): variant picker -> ?variant= + price, add to cart ->
// bubble + drawer/cart line, + quantity -> /cart/change, remove -> empty, predictive search -> /search/suggest,
// facet filter -> filter.* URL. --no-flows skips them, --no-scroll skips the scroll pass.
// Exits 1 when any error-class issue is found (warnings only fail with --strict).
import fs from 'node:fs';
import path from 'node:path';
import { launch, openPage, collectHealth, parseArgs, revealPage } from './shoot.mjs';
import { runFlows } from './flows.mjs';

const args = parseArgs(process.argv.slice(2));
const base = String(args.base || args.url || 'http://127.0.0.1:4100').replace(/\/$/, '');
const devices = String(args.devices || 'desktop,mobile').split(',').map((d) => d.trim()).filter(Boolean);
const maxProducts = Number(args['max-products'] || 6);
const maxArticles = Number(args['max-articles'] || 3);
const concurrency = Number(args.concurrency || 3);
const strict = !!args.strict;
const SCRATCH = '/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad';
const outFile = args.out || path.join(SCRATCH, 'check', `${new URL(base).port || 'default'}.json`);

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function discoverRoutes() {
  let info = null;
  try {
    info = await getJSON(`${base}/__preview/routes.json`);
  } catch {
    info = null;
  }
  const routes = [];
  const add = (label, p, extra = {}) => routes.push({ label, path: p, ...extra });
  add('home', '/');
  add('list-collections', '/collections');
  if (info) {
    for (const c of info.collections) add(`collection ${c}`, `/collections/${c}`);
    const first = info.collections[0] || 'all';
    add('collection filtered+sorted', `/collections/${first}?filter.v.availability=1&sort_by=price-ascending`);
    add('collection all page 2', '/collections/all?page=2');
    // product sample: multi-variant, single variant, sold out (when present), then fill up
    const prods = info.products;
    const picks = [];
    const pick = (p) => p && !picks.includes(p) && picks.push(p);
    pick(prods.find((p) => p.variants.length > 1));
    pick(prods.find((p) => p.variants.length === 1));
    pick(prods.find((p) => !p.available));
    for (const p of prods) if (picks.length < maxProducts) pick(p);
    for (const p of picks) add(`product ${p.handle}`, `/products/${p.handle}`);
    const mv = picks.find((p) => p.variants.length > 1);
    if (mv) add('product ?variant=', `/products/${mv.handle}?variant=${mv.variants[mv.variants.length - 1]}`);
    if (picks[0]) add('product within collection', `/collections/all/products/${picks[0].handle}`);
    const avail = prods.find((p) => p.first_available_variant);
    add('cart (empty)', '/cart');
    if (avail) add('cart (with items)', '/cart', { addVariant: avail.first_available_variant });
    const term = info.search_terms[0] || 'a';
    add('search results', `/search?q=${encodeURIComponent(term)}`);
    add('search no results', '/search?q=zzqxvnotfound');
    add('search empty', '/search');
    for (const pg of info.pages) add(`page ${pg}`, `/pages/${pg}`);
    for (const b of info.blogs) {
      add(`blog ${b.handle}`, `/blogs/${b.handle}`);
      for (const a of b.articles.slice(0, maxArticles)) add(`article ${a}`, `/blogs/${b.handle}/${a}`);
    }
    for (const pol of info.policies) add(`policy ${pol}`, `/policies/${pol}`);
  } else {
    add('collection all', '/collections/all');
    add('cart (empty)', '/cart');
    add('search empty', '/search');
  }
  add('404', '/this-page-does-not-exist', { expectStatus: 404 });
  add('password', '/password');
  add('gift card', '/gift_cards/preview1234');
  return { routes, info };
}

async function checkRoute(browser, route, device) {
  const url = base + route.path;
  let result;
  let opened;
  try {
    opened = await openPage(browser, url, device, { allowErrorStatus: !!route.expectStatus });
  } catch (e) {
    return { ...route, device, url, fatal: `open failed: ${String(e.message || e).split('\n')[0]}` };
  }
  const { ctx, page, report } = opened;
  try {
    if (route.addVariant) {
      const r = await page.request.post(`${base}/cart/add.js`, {
        data: { items: [{ id: route.addVariant, quantity: 2 }] },
        headers: { 'content-type': 'application/json', accept: 'application/json' },
      });
      report.prepare = `cart/add.js -> ${r.status()}`;
      await page.reload({ waitUntil: 'load' });
      try {
        await page.waitForLoadState('networkidle', { timeout: 6000 });
      } catch {}
    }
    if (!args['no-scroll']) {
      const si = await revealPage(page);
      report.scroller = si.scroller;
      report.pageHeight = si.scrollHeight;
    }
    await collectHealth(page, report);
    const a11y = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      };
      return {
        missingAlt: imgs.filter((i) => !i.hasAttribute('alt')).map((i) => i.getAttribute('src')).slice(0, 15),
        missingDims: imgs
          .filter((i) => !(i.hasAttribute('width') && i.hasAttribute('height')))
          .filter((i) => !(i.getAttribute('src') || '').startsWith('data:'))
          .map((i) => i.getAttribute('src'))
          .slice(0, 15),
        imgCount: imgs.length,
        visibleImgCount: imgs.filter(visible).length,
        title: document.title,
        h1: document.querySelector('h1')?.innerText?.trim()?.slice(0, 80) || null,
      };
    });
    result = { ...route, device, url, ...report, ...a11y };
  } catch (e) {
    result = { ...route, device, url, ...report, fatal: String(e.message || e) };
  } finally {
    await ctx.close();
  }
  result.statusOk = result.status === (route.expectStatus || 200);
  return result;
}

function classify(r) {
  const errors = [];
  const warnings = [];
  if (r.fatal) errors.push(`fatal: ${r.fatal}`);
  if (!r.statusOk) errors.push(`status ${r.status}`);
  if (r.liquidErrors) errors.push(`${r.liquidErrors} Liquid error(s)`);
  if (r.subrequestLiquidErrors?.length)
    errors.push(`Liquid errors in section/AJAX responses: ${r.subrequestLiquidErrors.slice(0, 3).map((x) => `${x.errors} @ ${x.url}`).join(' | ')}`);
  if (r.liquidErrorText?.length) errors.push(`Liquid error text on page: ${r.liquidErrorText[0]}`);
  if (r.consoleErrors?.length) errors.push(`${r.consoleErrors.length} console error(s): ${r.consoleErrors[0]}`);
  if (r.pageErrors?.length) errors.push(`${r.pageErrors.length} page error(s): ${r.pageErrors[0].split('\n')[0]}`);
  if (r.failedRequests?.length)
    errors.push(`${r.failedRequests.length} failed request(s): ${r.failedRequests.slice(0, 3).map((f) => `${f.status || f.error} ${f.url}`).join(' | ')}`);
  if (r.overflowX) errors.push(`horizontal overflow (${r.scrollWidth}px > ${r.innerWidth}px): ${(r.overflowOffenders || []).slice(0, 2).join(', ')}`);
  if (r.brokenImages?.length) errors.push(`${r.brokenImages.length} broken image(s): ${r.brokenImages[0]}`);
  if (r.rawTranslationKeys?.length) errors.push(`raw translation keys: ${r.rawTranslationKeys.slice(0, 3).join(', ')}`);
  if (r.translationMissing) warnings.push(`${r.translationMissing} missing translation(s)`);
  if (r.consoleWarnings?.length) warnings.push(`${r.consoleWarnings.length} console warning(s): ${r.consoleWarnings[0]}`);
  if (r.missingAlt?.length) warnings.push(`${r.missingAlt.length} img without alt`);
  if (r.missingDims?.length) warnings.push(`${r.missingDims.length} img without width/height`);
  return { errors, warnings };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const probe = await fetch(`${base}/`).catch(() => null);
  if (!probe) {
    console.error(`${base} is not reachable — start it with tools/dev.sh start`);
    process.exit(2);
  }
  if (probe.headers.get('x-preview-placeholder')) {
    console.log(`${base}: the preview server runs but the theme has no layout/theme.liquid yet (placeholder page).`);
    console.log('RESULT: FAIL (no theme)');
    process.exit(1);
  }
  const { routes: allRoutes, info } = await discoverRoutes();
  let routes = allRoutes;
  if (args.only) {
    // exact path (with or without its query string) or exact label; a trailing * makes it a prefix match
    const only = String(args.only).split(',').map((o) => o.trim()).filter(Boolean);
    const hit = (r, o) => {
      if (o.endsWith('*')) return r.path.startsWith(o.slice(0, -1)) || r.label.startsWith(o.slice(0, -1));
      return r.path === o || r.path.split('?')[0] === o || r.label === o;
    };
    routes = routes.filter((r) => only.some((o) => hit(r, o)));
  }
  if (args['flows-only']) routes = [];
  const jobs = [];
  for (const r of routes) for (const d of devices) jobs.push({ route: r, device: d });
  const browser = await launch();
  const t0 = Date.now();
  let results;
  try {
    results = await pool(jobs, concurrency, ({ route, device }) => checkRoute(browser, route, device));
  } finally {
    await browser.close();
  }

  if (!args['no-flows'] && !args.only) {
    const b2 = await launch();
    try {
      const rows = await runFlows(b2, base, info, devices, { searchTerm: args['search-term'] });
      results.push(...rows);
    } finally {
      await b2.close();
    }
  }

  let errorCount = 0;
  let warningCount = 0;
  const lines = [];
  for (const r of results) {
    const { errors, warnings } = classify(r);
    r.errors = errors;
    r.warnings = warnings;
    errorCount += errors.length;
    warningCount += warnings.length;
    const flag = errors.length ? 'FAIL' : warnings.length ? 'warn' : ' ok ';
    lines.push(
      `${flag} ${r.device.padEnd(7)} ${String(r.status).padEnd(3)} liquid=${r.liquidErrors ?? '-'} console=${r.consoleErrors?.length ?? '-'} pageerr=${r.pageErrors?.length ?? '-'} failed=${r.failedRequests?.length ?? '-'} overflow=${r.overflowX ? 'Y' : 'n'} noalt=${r.missingAlt?.length ?? '-'} nodims=${r.missingDims?.length ?? '-'}  ${r.label} (${r.path})`
    );
    for (const e of errors) lines.push(`       ERROR ${e}`);
    if (r.flowLog?.length) for (const l of r.flowLog) lines.push(`       ${errors.length ? '     ' : 'ok   '} ${l}`);
    if (strict) for (const w of warnings) lines.push(`       WARN  ${w}`);
  }
  const totals = {
    base,
    pages: results.length,
    errors: errorCount,
    warnings: warningCount,
    liquidErrors: results.reduce((n, r) => n + (r.liquidErrors || 0), 0),
    consoleErrors: results.reduce((n, r) => n + (r.consoleErrors?.length || 0), 0),
    pageErrors: results.reduce((n, r) => n + (r.pageErrors?.length || 0), 0),
    failedRequests: results.reduce((n, r) => n + (r.failedRequests?.length || 0), 0),
    overflowPages: results.filter((r) => r.overflowX).length,
    flows: results.filter((r) => r.flow).length,
    flowFailures: results.filter((r) => r.flow && r.fatal).length,
    imgsWithoutAlt: results.reduce((n, r) => n + (r.missingAlt?.length || 0), 0),
    imgsWithoutDims: results.reduce((n, r) => n + (r.missingDims?.length || 0), 0),
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), totals, results }, null, 2));
  console.log(lines.join('\n'));
  console.log(
    `\n${base}: ${totals.pages} page-visits, liquid=${totals.liquidErrors} console=${totals.consoleErrors} pageerr=${totals.pageErrors} failed=${totals.failedRequests} overflow=${totals.overflowPages} flows=${totals.flows - totals.flowFailures}/${totals.flows} ok | warnings: noalt=${totals.imgsWithoutAlt} nodims=${totals.imgsWithoutDims} | ${totals.seconds}s\nJSON: ${outFile}`
  );
  const fail = errorCount > 0 || (strict && warningCount > 0);
  console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
