// Theme-agnostic storefront interaction flows used by tools/check.mjs (on by default).
//
// Each flow drives the real UI the way a shopper would and asserts the Shopify-level outcome, so it
// works on Horizon, Dawn and our own theme without theme-specific code:
//   variant   pick another option value on a PDP  -> URL ?variant=<id>, cart form id, price text change
//   cart      add to cart -> /cart/add, header bubble count, line visible in drawer (or via cart icon /
//             cart page), + button -> /cart/change|update and quantity 2, remove -> cart empty
//   search    open the header search, type a term -> /search/suggest response, product link in results
//   facet     tick one storefront filter on a collection -> URL gets filter.*, products re-rendered
// A flow that cannot find a control reports it as an error: a storefront where a shopper cannot find
// the variant picker, cart button, search or filters fails QA.
import { openPage, collectHealth, revealPage } from './shoot.mjs';

const T = 8000;

const VISIBLE = (el) => {
  if (!el) return false;
  if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/** First visible element (in DOM order) matching any selector, optionally inside a scope element handle. */
async function firstVisible(page, selectors, scopeSel = null) {
  const handle = await page.evaluateHandle(
    ([sels, scope, visSrc]) => {
      const visible = new Function(`return (${visSrc})`)();
      const roots = scope ? [...document.querySelectorAll(scope)].filter(visible) : [document];
      for (const root of roots)
        for (const sel of sels) {
          let list;
          try {
            list = root.querySelectorAll(sel);
          } catch {
            continue;
          }
          for (const el of list) if (visible(el)) return el;
        }
      return null;
    },
    [selectors, scopeSel, VISIBLE.toString()]
  );
  const el = handle.asElement();
  if (!el) {
    await handle.dispose();
    return null;
  }
  return el;
}

async function cartJs(page, base) {
  const r = await page.request.get(`${base}/cart.js`, { headers: { accept: 'application/json' } });
  return r.json();
}

function waitForResponse(page, re, method = null, timeout = T) {
  return page
    .waitForResponse((r) => re.test(r.url()) && (!method || r.request().method() === method), { timeout })
    .catch(() => null);
}

async function pollUntil(fn, timeout = T, every = 150) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeout) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, every));
  }
  return last;
}

/** Text of the main product price (first visible price-like element in the product area). */
async function mainPriceText(page) {
  return page.evaluate((visSrc) => {
    const visible = new Function(`return (${visSrc})`)();
    const sels = ['product-price', '[id^="price-template"]', '[id^="price-"]', '.product__price', '.product-info .price', '.price', '[data-product-price]'];
    const form = document.querySelector('form[action*="/cart/add"]');
    for (const s of sels)
      for (const el of document.querySelectorAll(s)) {
        if (!visible(el)) continue;
        if (el.closest('product-card, .card-wrapper, .product-card, .card, [class*="recommendation"], header, footer')) continue;
        if (form && el.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_PRECEDING && el.getBoundingClientRect().top > 2000) continue;
        return el.innerText.replace(/\s+/g, ' ').trim();
      }
    return null;
  }, VISIBLE.toString());
}

async function mainVariantId(page) {
  return page.evaluate(() => {
    for (const f of document.querySelectorAll('form[action*="/cart/add"]')) {
      if (f.closest('product-card, .card-wrapper, .product-card, quick-add-modal, [class*="quick-add"]')) continue;
      const i = f.querySelector('[name="id"]');
      if (i && i.value) return String(i.value);
    }
    return null;
  });
}

/** Clicks the control that selects option value `value` (radio/swatch label, select option or button). */
async function chooseOptionValue(page, optionName, value) {
  const done = await page.evaluate(
    ([name, val, visSrc]) => {
      const visible = new Function(`return (${visSrc})`)();
      const skip = (el) => el.closest('product-card, .card-wrapper, .product-card, quick-add-modal, [class*="quick-add"], [class*="recommendation"], footer, header');
      // 1. radios (Dawn/Horizon pills + swatches)
      for (const input of document.querySelectorAll('input[type="radio"]')) {
        if (input.value !== val || skip(input)) continue;
        const label = input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : input.closest('label');
        const target = label && visible(label) ? label : visible(input) ? input : null;
        if (!target) continue;
        target.setAttribute('data-flow-target', '');
        return 'click';
      }
      // 2. selects (dropdown pickers)
      for (const sel of document.querySelectorAll('select')) {
        if (skip(sel) || sel.name === 'id') continue;
        const opt = [...sel.options].find((o) => o.value === val || o.textContent.trim() === val || o.dataset.value === val);
        if (!opt) continue;
        const shown = visible(sel) || (sel.parentElement && visible(sel.parentElement));
        if (!shown) continue;
        sel.setAttribute('data-flow-target', '');
        return `select:${opt.value}`;
      }
      // 3. buttons carrying the value
      for (const b of document.querySelectorAll('button[data-value], button[value], [role="radio"]')) {
        if (skip(b) || !visible(b)) continue;
        if ((b.dataset.value || b.value || b.textContent.trim()) === val) {
          b.setAttribute('data-flow-target', '');
          return 'click';
        }
      }
      return null;
    },
    [optionName, value, VISIBLE.toString()]
  );
  if (!done) return false;
  const loc = page.locator('[data-flow-target]').first();
  if (done === 'click') await loc.click({ timeout: T });
  else await loc.selectOption(done.slice(7), { timeout: T, force: true });
  await page.evaluate(() => document.querySelectorAll('[data-flow-target]').forEach((e) => e.removeAttribute('data-flow-target')));
  return true;
}

function pickTarget(product, currentId) {
  const cur = product.variants.find((v) => String(v.id) === String(currentId)) || product.variants[0];
  const cands = product.variants.filter((v) => v.available && String(v.id) !== String(cur.id));
  const diffCount = (v) => v.options.filter((o, i) => o !== cur.options[i]).length;
  cands.sort((a, b) => (b.price !== cur.price) - (a.price !== cur.price) || diffCount(a) - diffCount(b));
  return { cur, target: cands[0] || null };
}

async function flowVariant(page, base, product, log) {
  const startId = await mainVariantId(page);
  const { cur, target } = pickTarget(product, startId);
  if (!target) return 'no second available variant to switch to';
  const before = await mainPriceText(page);
  log.push(`from variant ${cur.id} (${cur.options.join(' / ')}, ${before}) to ${target.id} (${target.options.join(' / ')})`);
  for (let i = 0; i < target.options.length; i++) {
    if (target.options[i] === cur.options[i]) continue;
    const ok = await chooseOptionValue(page, product.options[i]?.name || product.options[i], target.options[i]);
    if (!ok) return `no visible control for option "${product.options[i]?.name || i}" value "${target.options[i]}"`;
    await page.waitForTimeout(400);
  }
  const reached = await pollUntil(async () => {
    const u = new URL(page.url());
    return u.searchParams.get('variant') === String(target.id) && (await mainVariantId(page)) === String(target.id);
  });
  if (!reached) return `after choosing the options the URL is ${page.url()} and the cart form id is ${await mainVariantId(page)}, expected variant ${target.id}`;
  if (target.price !== cur.price) {
    const whole = String(Math.floor(target.price / 100));
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const groupedC = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const after = await pollUntil(async () => {
      const t = await mainPriceText(page);
      return t && t !== before && (t.includes(grouped) || t.includes(groupedC) || t.includes(whole)) ? t : null;
    }, 5000);
    if (!after) return `price did not update: still "${await mainPriceText(page)}" (expected ${target.price / 100})`;
    log.push(`price ${before} -> ${after}`);
  }
  return null;
}

const CART_SCOPES = ['cart-drawer[open]', 'cart-drawer.active', 'cart-drawer-component', 'dialog[open]', '[id*="cart-drawer" i]', '[class*="cart-drawer"]', '.drawer.active', '[aria-modal="true"]'];

async function lineVisible(page, title) {
  return page.evaluate(
    ([t, scopes, visSrc]) => {
      const visible = new Function(`return (${visSrc})`)();
      const needle = t.toLowerCase();
      for (const s of scopes)
        for (const el of document.querySelectorAll(s)) if (visible(el) && el.innerText.toLowerCase().includes(needle)) return s;
      if (location.pathname.replace(/\/$/, '').endsWith('/cart')) {
        const main = document.querySelector('main') || document.body;
        if (main.innerText.toLowerCase().includes(needle)) return 'cart page';
      }
      return null;
    },
    [title, CART_SCOPES, VISIBLE.toString()]
  );
}

async function cartScope(page) {
  return page.evaluate(
    ([scopes, visSrc]) => {
      const visible = new Function(`return (${visSrc})`)();
      for (const s of scopes) for (const el of document.querySelectorAll(s)) if (visible(el) && el.querySelector('button[name="plus"], input[name="updates[]"], [name="updates[]"]')) return s;
      return location.pathname.replace(/\/$/, '').endsWith('/cart') ? 'main' : null;
    },
    [CART_SCOPES, VISIBLE.toString()]
  );
}

async function flowCart(page, base, product, log) {
  await page.request.post(`${base}/cart/clear.js`);
  const addBtn = await firstVisible(page, [
    'form[action*="/cart/add"] button[name="add"]',
    'form[action*="/cart/add"] button[type="submit"]',
    'form[action*="/cart/add"] [type="submit"]',
  ]);
  if (!addBtn) return 'no visible add-to-cart button';
  const added = waitForResponse(page, /\/cart\/add(\.js)?(\?|$)/, 'POST');
  await addBtn.click({ timeout: T });
  const res = await added;
  if (!res) return 'clicking add-to-cart sent no POST /cart/add';
  if (res.status() !== 200) return `POST /cart/add -> ${res.status()}`;
  const cart = await cartJs(page, base);
  if (!cart.item_count) return 'cart.js is empty after add-to-cart';
  const count = String(cart.item_count);
  const bubble = await pollUntil(
    () =>
      page.evaluate(
        ([n, visSrc]) => {
          const visible = new Function(`return (${visSrc})`)();
          const sels = ['.cart-count-bubble', 'cart-count', '.cart-bubble', '[class*="cart-count"]', '[class*="cart-bubble"]', '[data-cart-count]', '[class*="CartCount"]'];
          for (const s of sels)
            for (const el of document.querySelectorAll(s)) {
              if (!visible(el)) continue;
              const re = new RegExp(`(^|\\D)${n}(\\D|$)`);
              // check the element and each descendant on its own: "<span>1</span><span>1 artikel</span>" reads "11 artikel"
              if ([el, ...el.querySelectorAll('*')].some((x) => re.test((x.textContent || '').replace(/\s+/g, ' ').trim()) && x.children.length === 0) || re.test(el.textContent.trim()))
                return s;
            }
          return null;
        },
        [count, VISIBLE.toString()]
      ),
    5000
  );
  if (!bubble) return `header cart count does not show ${count}`;
  await page.waitForTimeout(900);
  const title = cart.items[0].product_title;
  let where = await lineVisible(page, title);
  log.push(where ? `drawer/notification opened automatically (${where})` : 'cart did not open automatically after add (theme setting)');
  let scope = await cartScope(page);
  if (!scope) {
    const icon = await firstVisible(page, ['#cart-icon-bubble', '.header-actions__cart-icon', 'header a[href$="/cart"]', 'a[href$="/cart"]', '[aria-controls*="cart" i]', 'button[aria-label*="cart" i]', 'button[aria-label*="winkelwagen" i]']);
    if (!icon) return 'no visible cart icon/link in the header';
    const nav = page.waitForNavigation({ timeout: 4000 }).catch(() => null);
    await icon.click({ timeout: T });
    await nav;
    await page.waitForTimeout(1200);
    where = await lineVisible(page, title);
    scope = await cartScope(page);
    log.push(`opened the cart via the header icon -> ${where || 'nothing'}`);
  }
  if (!where) return `the added line "${title}" is not visible in a cart drawer or on /cart`;
  if (!scope) return 'cart line has no quantity controls (button[name=plus] / updates[])';
  const scopeSel = scope === 'main' ? 'main' : scope;
  // + quantity
  const plus = await firstVisible(page, ['button[name="plus"]', 'button[aria-label*="increase" i]', 'button[aria-label*="verhoog" i]', '.quantity-plus'], scopeSel);
  if (!plus) return 'no visible + quantity button on the cart line';
  const changed = waitForResponse(page, /\/cart\/(change|update)(\.js)?(\?|$)/, 'POST');
  await plus.click({ timeout: T });
  const cres = await changed;
  if (!cres) return 'the + button sent no POST /cart/change or /cart/update';
  if (cres.status() !== 200) return `+ quantity -> ${cres.status()} ${cres.url()}`;
  const after = await pollUntil(async () => {
    const c = await cartJs(page, base);
    return c.item_count === cart.item_count + 1 ? c : null;
  }, 5000);
  if (!after) return `quantity did not go up: cart.js item_count ${(await cartJs(page, base)).item_count}`;
  const qtyShown = await pollUntil(
    () =>
      page.evaluate(
        ([sel, n]) => [...document.querySelectorAll(`${sel} input[name="updates[]"], ${sel} input[type="number"]`)].some((i) => i.value === n),
        [scopeSel, String(after.items[0].quantity)]
      ),
    5000
  );
  if (!qtyShown) return `the quantity field does not show ${after.items[0].quantity} after +`;
  log.push(`+ -> ${cres.url().replace(base, '')} quantity ${after.items[0].quantity}`);
  await page.waitForTimeout(500);
  // remove
  const rm = await firstVisible(
    page,
    ['cart-remove-button a', 'cart-remove-button button', '.cart-items__remove', 'button[name="remove"]', 'button[aria-label*="verwijder" i]', 'button[aria-label*="remove" i]', 'a[aria-label*="verwijder" i]', 'a[aria-label*="remove" i]', 'a[href*="/cart/change"][href*="quantity=0"]'],
    scopeSel
  );
  if (!rm) return 'no visible remove button on the cart line';
  const removed = waitForResponse(page, /\/cart\/(change|update)(\.js)?(\?|$)/, 'POST');
  const nav = page.waitForNavigation({ timeout: 3000 }).catch(() => null);
  await rm.click({ timeout: T });
  const rres = await removed;
  await nav;
  const empty = await pollUntil(async () => ((await cartJs(page, base)).item_count === 0 ? true : null), 5000);
  if (!empty) return `remove did not empty the cart (${rres ? rres.status() + ' ' + rres.url() : 'no change request'})`;
  const gone = await pollUntil(async () => ((await lineVisible(page, title)) ? null : true), 5000);
  if (!gone) return 'the removed line is still shown';
  log.push('remove -> cart empty');
  return null;
}

async function flowSearch(page, base, term, log) {
  const inputSel = ['input[type="search"]', 'input[name="q"]'];
  let input = await firstVisible(page, inputSel.map((s) => `header ${s}`).concat(inputSel.map((s) => `dialog[open] ${s}`)));
  if (!input) {
    const toggle = await firstVisible(page, [
      'header button[aria-label*="zoek" i]',
      'header button[aria-label*="search" i]',
      'header summary[aria-label*="zoek" i]',
      'header summary[aria-label*="search" i]',
      'details-modal.header__search summary',
      'search-button button',
      'header [class*="search"] button',
      'header [class*="search"] summary',
      'header a[href$="/search"]',
    ]);
    if (!toggle) return 'no visible search field or search toggle in the header';
    await toggle.click({ timeout: T });
    await page.waitForTimeout(700);
    input = await firstVisible(page, ['dialog[open] input[type="search"]', 'dialog[open] input[name="q"]', 'details[open] input[name="q"]', ...inputSel]);
    if (!input) {
      if (new URL(page.url()).pathname.endsWith('/search')) input = await firstVisible(page, inputSel);
      if (!input) return 'opening the search shows no input';
    }
  }
  const suggest = waitForResponse(page, /\/search\/suggest/, null, T);
  await input.click({ timeout: T });
  await input.type(term, { delay: 60 });
  const res = await suggest;
  if (!res) return `typing "${term}" sent no /search/suggest request`;
  if (res.status() !== 200) return `/search/suggest -> ${res.status()}`;
  const hit = await pollUntil(
    () =>
      page.evaluate((visSrc) => {
        const visible = new Function(`return (${visSrc})`)();
        const scopes = ['predictive-search', '[id*="predictive" i]', '[class*="predictive" i]', 'dialog[open]', 'details[open]'];
        for (const s of scopes) for (const el of document.querySelectorAll(s)) for (const a of el.querySelectorAll('a[href*="/products/"]')) if (visible(a)) return a.getAttribute('href');
        return null;
      }, VISIBLE.toString()),
    5000
  );
  if (!hit) return `predictive search for "${term}" shows no product link`;
  log.push(`"${term}" -> ${res.url().replace(base, '')} first result ${hit}`);
  return null;
}

async function flowFacet(page, base, log) {
  const findFacet = () =>
    page.evaluate((visSrc) => {
      const visible = new Function(`return (${visSrc})`)();
      for (const input of document.querySelectorAll('input[type="checkbox"][name^="filter."], input[type="radio"][name^="filter."]')) {
        if (input.disabled || input.checked) continue;
        const label = input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : input.closest('label');
        const target = label && visible(label) ? label : visible(input) ? input : null;
        if (target) {
          target.setAttribute('data-flow-target', '');
          return `${input.name}=${input.value}`;
        }
      }
      return null;
    }, VISIBLE.toString());
  // Make a filter value reachable the way a shopper would: open the closed <details> groups around it
  // (outermost first), or the filter drawer toggle on mobile, until one value is visible.
  const openClosedGroup = () =>
    page.evaluate((visSrc) => {
      const visible = new Function(`return (${visSrc})`)();
      for (const input of document.querySelectorAll('input[type="checkbox"][name^="filter."], input[type="radio"][name^="filter."]')) {
        if (input.disabled || input.checked) continue;
        const closed = [];
        for (let el = input.parentElement; el; el = el.parentElement) if (el.tagName === 'DETAILS' && !el.open) closed.unshift(el);
        for (const d of closed) {
          const sum = d.querySelector(':scope > summary');
          if (sum && visible(sum)) {
            sum.setAttribute('data-flow-open', '');
            return true;
          }
        }
      }
      return false;
    }, VISIBLE.toString());
  let facet = await findFacet();
  let usedDrawer = false;
  for (let attempt = 0; !facet && attempt < 5; attempt++) {
    if (await openClosedGroup()) {
      await page.locator('[data-flow-open]').first().click({ timeout: T });
      await page.evaluate(() => document.querySelectorAll('[data-flow-open]').forEach((e) => e.removeAttribute('data-flow-open')));
    } else if (!usedDrawer) {
      usedDrawer = true;
      const opener = await firstVisible(page, [
        'button[aria-controls*="filter" i]',
        'summary[aria-controls*="filter" i]',
        'details.mobile-facets__disclosure > summary',
        'button[class*="facets-toggle"]',
        '.facets-toggle button',
        '[class*="facets"] button[class*="toggle"]',
        '[class*="facets"] button[class*="open"]',
        'button[class*="filter" i]',
      ]);
      if (opener) await opener.click({ timeout: T });
      else {
        const byText = page.locator('button:visible, summary:visible').filter({ hasText: /filter/i }).first();
        if (!(await byText.count())) break;
        await byText.click({ timeout: T });
      }
    } else break;
    await page.waitForTimeout(700);
    facet = await findFacet();
  }
  if (!facet) return 'no visible, enabled storefront filter value (filter.* checkbox) on the collection page';
  const before = page.url();
  const req = waitForResponse(page, /filter\.(v|p)\./, null, T);
  await page.locator('[data-flow-target]').first().click({ timeout: T });
  const res = await req;
  const urlOk = await pollUntil(() => (new URL(page.url()).search.includes('filter.') ? true : null), 6000);
  if (!res) return `ticking ${facet} fetched nothing with a filter.* parameter`;
  if (res.status() !== 200) return `filter request -> ${res.status()} ${res.url()}`;
  if (!urlOk) return `URL did not get the filter parameter (still ${before})`;
  log.push(`${facet} -> ${decodeURIComponent(new URL(page.url()).search)}`);
  return null;
}

/** Runs every flow on every device; returns result rows in check.mjs's format. */
export async function runFlows(browser, base, info, devices, { searchTerm } = {}) {
  const rows = [];
  const products = info?.products || [];
  const multi = products.find((p) => p.available && p.variants.length > 2) || products.find((p) => p.available && p.variants.length > 1);
  const collection =
    (info?.collections || []).find((c) => c !== 'all' && c !== 'frontpage') || (info?.collections || [])[0] || 'all';
  const term = searchTerm || info?.search_terms?.[0] || 'a';
  const flows = [];
  if (multi) {
    flows.push({ name: 'variant picker', path: `/products/${multi.handle}`, run: (page, p, log) => flowVariant(page, base, p, log), needsProduct: multi.handle });
    flows.push({ name: 'cart add/+/remove', path: `/products/${multi.handle}`, run: (page, p, log) => flowCart(page, base, p, log), needsProduct: multi.handle });
  }
  flows.push({ name: 'predictive search', path: '/', run: (page, p, log) => flowSearch(page, base, term, log) });
  flows.push({ name: 'facet filter', path: `/collections/${collection}`, run: (page, p, log) => flowFacet(page, base, log) });
  for (const f of flows) {
    let product = null;
    if (f.needsProduct) {
      const r = await fetch(`${base}/products/${f.needsProduct}.js`);
      product = await r.json();
    }
    for (const d of devices) {
      const url = base + f.path;
      const { ctx, page, report } = await openPage(browser, url, d);
      const log = [];
      let err = null;
      try {
        err = await f.run(page, product, log);
      } catch (e) {
        err = `exception: ${String(e.message || e).split('\n')[0]}`;
      }
      try {
        await collectHealth(page, report);
      } catch {}
      rows.push({
        label: `flow ${f.name}`,
        path: f.path,
        device: d,
        url: page.url(),
        ...report,
        statusOk: true,
        flow: f.name,
        flowLog: log,
        fatal: err ? `flow "${f.name}": ${err}` : undefined,
      });
      await ctx.close();
    }
  }
  return rows;
}

export { revealPage };
