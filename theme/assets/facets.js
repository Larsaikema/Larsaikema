/* Collection & search: live filters + sort (Section Rendering API, history), 'Meer laden', the phone's Filteren/Sorteren
   pill, the lead date, the clamped intro; cards: swatch hover preview, quick add (quick-add.js on first use). */
(() => {
const KK = window.KK;
const mq = matchMedia('(max-width: 989px)');
const SRC = document.currentScript?.src || '';
const opts = { preventScroll: true };
const PRICE = '[data-price-min], [data-price-max]';
// typed amount, Dutch ('1.250,50') or plain ('279.50'): '' = no bound, null = not an amount
const amount = (raw) => {
  let v = String(raw || '').replace(/[\s€ ]/g, '');
  if (!v) return '';
  if (/^\d{1,3}(\.\d{3})+(,\d*)?$/.test(v)) v = v.replace(/\./g, '');
  v = v.replace(',', '.');
  if (!/^\d*\.?\d*$/.test(v) || v === '.') return null;
  return String(Math.round(Number(v) * 100) / 100);
};
// the price filter works on the stored prices (incl. btw in a Dutch shop); in the other btw mode (Zakelijk: excl.) the
// fields show and take amounts in that mode: k = shown amount x k = stored amount (data-k: the mode a field's text is in)
const vatK = () => {
  const f = (100 + Number(KK.vatRate ?? 21)) / 100;
  const stored = KK.taxesIncluded === false ? 'excl' : 'incl';
  const shown = document.documentElement.dataset.vat === 'excl' ? 'excl' : 'incl';
  return shown === stored ? 1 : shown === 'excl' ? f : 1 / f;
};
const priceView = (root) => {
  const k = vatK();
  root.querySelectorAll(PRICE).forEach((i) => {
    const was = Number(i.dataset.k || 1);
    if (Math.abs(k - was) < 1e-9) return;
    const v = amount(i.value);
    if (v) {
      const r = Math.round((Number(v) * was * 100) / k) / 100;
      i.value = Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',');
    }
    if (i.dataset.max) i.placeholder = Math.floor(i.dataset.max / 100 / k).toLocaleString('nl-NL');
    i.dataset.k = k;
  });
};
// lead line above the grid: the product page's window for the same wait (delivery-countdown.js; data-transit-max widens
// it for a pallet); a wait counted from something else ('na akkoord drukproef') or without a number keeps its text
const leadDates = (root) =>
  KK.delivery &&
  root.querySelectorAll('[data-lead-eta]').forEach((el) => {
    const out = el.querySelector('[data-lead-eta-out]');
    const m = !/\bna\b/i.test(el.dataset.lead) && el.dataset.lead.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(werkdag|dag|week|weken)/i);
    if (!out || !m) return;
    const u = m[3].toLowerCase();
    const f = u[0] === 'd' ? 5 / 7 : u.startsWith('werk') ? 1 : 5;
    const r = KK.delivery.compute(el);
    const fmt = (t) => r.etaAt(t).toLocaleDateString(document.documentElement.lang || 'nl', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '').split(' ');
    const a = fmt(Math.round(m[1] * f) + r.transit);
    const b = fmt(Math.round((m[2] || m[1]) * f) + Math.max(r.transit, +el.dataset.transitMax || 0));
    out.innerHTML = el.dataset.tpl.replace('__FROM__', a[1] === b[1] ? a[0] : a.join(' ')).replace('__TO__', b.join(' '));
    out.hidden = false;
    el.querySelector('[data-lead-text]')?.setAttribute('hidden', '');
  });

class FacetFilters extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.cache = new Map();
    this.seq = 0;
    // live region outside the re-rendered results and the drawer's inert: announces the count
    this.status = this.querySelector('[data-facets-status]');
    if (!this.status) {
      this.status = Object.assign(document.createElement('p'), { className: 'visually-hidden' });
      this.status.setAttribute('role', 'status');
      this.status.setAttribute('aria-live', 'polite');
      this.prepend(this.status);
    }
    this.onChange = KK.debounce(() => this.priceOk() && this.submit(), 600);
    this.addEventListener('change', (e) => {
      if (e.target.matches('[data-sort]')) return this.sortChanged(e.target);
      if (!e.target.closest('[data-facets-form]')) return;
      if (!e.target.matches(PRICE)) return this.submit();
      this.priceOk(true);
      this.onChange();
    });
    this.addEventListener('input', (e) => e.target.matches(PRICE) && e.target.closest('[data-facets-form]') && this.onChange());
    // sort: an arrow-key change of the closed select waits for Enter or blur (WCAG 3.2.2); mouse/touch apply at once
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawerOpen) return this.close();
      if (e.key === ' ' && e.target.matches('a[data-facets-close]')) {
        e.preventDefault();
        return e.target.click();
      }
      if (!e.target.matches('[data-sort]')) return;
      if (e.key === 'Enter' && this.sortPending) {
        e.preventDefault();
        this.submit();
      } else if ((/^(Arrow|Page|Home$|End$)/.test(e.key) && !e.altKey) || (e.key.length === 1 && e.key !== ' ')) this.sortKeyAt = performance.now();
    });
    this.addEventListener('focusout', (e) => e.target.matches('[data-sort]') && this.sortPending && this.submit());
    this.addEventListener('submit', (e) => {
      if (!e.target.matches('[data-facets-form]')) return;
      e.preventDefault();
      if (this.priceOk(true)) this.submit();
    });
    this.addEventListener('click', (e) => {
      const t = e.target;
      const link = t.closest('[data-facet-link]');
      const more = t.closest('[data-load-more-btn]');
      const prev = t.closest('[data-load-prev-btn]');
      const toggle = t.closest('[data-facets-open], [data-facets-close]');
      if (link || more || prev || toggle) e.preventDefault();
      if (link) return this.render(new URL(link.href, location.origin).searchParams.toString());
      if (more) return this.loadMore(more);
      if (prev) return this.loadPrev(prev);
      if (t.closest('[data-facets-open]')) return this.open();
      if (t.closest('[data-facets-close]')) return this.close();
      const all = t.closest('[data-facet-more]');
      if (all) {
        const body = all.closest('.facet__body');
        const on = !body.classList.contains('is-expanded');
        body.classList.toggle('is-expanded', on);
        all.setAttribute('aria-expanded', String(on));
        all.querySelector('[data-more-label]').textContent = on ? all.dataset.less : all.dataset.more;
        if (on) body.querySelector('.facet__item--more input')?.focus();
      }
    });
    addEventListener('popstate', () => this.render(location.search.slice(1), false).then(() => this.restore()));
    if (this.form) this.form.noValidate = true;
    leadDates(this);
    priceView(this);
    KK.on('vat:change', () => priceView(this));
    this.watchBar();
    this.fitPanel();
    this.keepPlace();
    this.restore();
  }
  get form() {
    return this.querySelector('[data-facets-form]');
  }
  get drawerOpen() {
    return this.classList.contains('is-drawer-open');
  }
  // phone: once the bar is under the header, Filteren/Sorteren dock right below it (or at the top while the header hides)
  // until the end of the results passes, so they never sit on top of a card's price or swatches
  watchBar() {
    let raf = 0;
    const check = () => {
      raf = 0;
      const tools = this.querySelector('[data-bar-tools]');
      const res = this.querySelector('[data-results]');
      if (!tools || !res) return;
      const h = document.querySelector('sticky-header');
      const top = h && h.dataset.sticky !== 'none' ? Math.max(0, h.getBoundingClientRect().bottom) : 0;
      tools.classList.toggle('is-floating', mq.matches && tools.parentNode.getBoundingClientRect().bottom < top && res.getBoundingClientRect().bottom > top + 120);
    };
    this.checkBar = check;
    addEventListener('scroll', () => raf || (raf = requestAnimationFrame(check)), { passive: true });
    mq.addEventListener('change', check);
    check();
  }
  // desktop: a filter column taller than the screen scrolls along with the page and sticks once its last group is in view,
  // so every group is reachable without a scrollbar inside the column
  fitPanel() {
    const panel = this.querySelector('[data-facets-panel]');
    if (!panel || !window.ResizeObserver) return;
    const fit = () => {
      const h = panel.scrollHeight;
      const tall = !mq.matches && h > innerHeight - (document.querySelector('sticky-header')?.offsetHeight || 0) - 32;
      panel.classList.toggle('is-tall', tall);
      panel.style.top = tall ? `${Math.round(innerHeight - h - 24)}px` : '';
    };
    new ResizeObserver(fit).observe(panel);
    addEventListener('resize', KK.debounce(fit, 100));
  }
  // Van above Tot: waits while typing (hint), swaps on blur / Enter / another filter
  priceOk(fix = false) {
    const a = this.querySelector('[data-price-min]');
    const b = this.querySelector('[data-price-max]');
    if (!a || !b) return true;
    const [x, y] = [amount(a.value), amount(b.value)];
    let bad = x !== '' && y !== '' && x !== null && y !== null && Number(x) > Number(y);
    if (bad && fix) {
      [a.value, b.value] = [b.value, a.value];
      bad = false;
    }
    // not an amount ('abc'): said under the fields and not sent, so the filter is not dropped without a word
    const nan = x === null || y === null;
    const hint = this.querySelector('[data-price-hint]');
    // aria-invalid="" reads as valid; the hint describes the field while it shows
    const inv = (el, on) => ['aria-invalid', 'aria-describedby'].forEach((k, i) => (on ? el.setAttribute(k, i ? hint?.id : 'true') : el.removeAttribute(k)));
    inv(a, bad || x === null);
    inv(b, bad || y === null);
    if (hint) {
      hint.hidden = !bad && !nan;
      if (!hint.hidden && hint.dataset.format) hint.textContent = nan ? hint.dataset.format : hint.dataset.swap;
    }
    return !bad && !nan;
  }
  params() {
    this.priceOk(true);
    let p;
    if (this.form) {
      p = new URLSearchParams();
      const prices = new Map([...this.form.querySelectorAll(PRICE)].map((i) => [i.name, Number(i.dataset.k || 1)]));
      for (let [k, v] of new FormData(this.form)) {
        if (prices.has(k)) {
          v = amount(v) ?? '';
          if (v !== '') v = String(Math.round(Number(v) * prices.get(k) * 100) / 100);
        }
        if (v !== '') p.append(k, v);
      }
    } else {
      p = new URLSearchParams(location.search);
      p.delete('page');
    }
    const sort = this.querySelector('[data-sort]');
    if (sort) p.set('sort_by', sort.value);
    return p.toString();
  }
  submit() {
    this.sortPending = false;
    this.render(this.params());
  }
  sortChanged(sel) {
    const name = sel.selectedOptions[0]?.textContent.trim() || '';
    const face = this.querySelector('.collection-bar__sort-long strong');
    if (face) face.textContent = name;
    const short = this.querySelector('.collection-bar__sort-short');
    const custom = sel.selectedIndex > 0;
    if (short) short.textContent = custom ? name : short.dataset.label;
    sel.closest('.collection-bar__sort')?.classList.toggle('is-active', custom);
    if (performance.now() - (this.sortKeyAt || 0) < 400) {
      this.sortKeyAt = 0;
      this.sortPending = true;
    } else this.submit();
  }
  scrollToResults() {
    const h = document.querySelector('sticky-header');
    const cover = h && h.dataset.sticky !== 'none' ? h.offsetHeight : 0;
    const res = this.querySelector('[data-results]') || this;
    const top = Math.max(0, Math.round(res.getBoundingClientRect().top + scrollY - cover - (mq.matches ? 0 : 16)));
    if (scrollY > top + 2) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  refocus(chipIndex) {
    if (this.drawerOpen) return this.querySelector('[data-facets-panel]')?.focus(opts);
    const chips = [...this.querySelectorAll('.active-filters__pill')];
    const target =
      (chipIndex >= 0 && chips[Math.min(chipIndex, chips.length - 1)]) ||
      [...this.querySelectorAll('[data-results-count], .collection-meta__count, .collection__count')].find((el) => el.getClientRects().length);
    if (!target) return;
    if (!target.matches('a, button, input, select, [tabindex]')) target.tabIndex = -1;
    target.focus(opts);
  }
  async fetchHtml(url, signal) {
    let html = this.cache.get(url);
    if (!html) {
      const r = await fetch(url, { signal });
      if (!r.ok) throw new Error(r.status);
      html = await r.text();
      this.cache.set(url, html);
    }
    return KK.parse(html);
  }
  // each request (filter, sort, page) cancels the one before; only the newest answer is applied
  begin() {
    this.ctrl?.abort();
    this.ctrl = new AbortController();
    return [++this.seq, this.ctrl.signal];
  }
  async render(query, push = true) {
    const url = `${location.pathname}${query ? `?${query}` : ''}`;
    const [seq, signal] = this.begin();
    this.setAttribute('aria-busy', 'true');
    this.classList.add('is-loading');
    try {
      const doc = await this.fetchHtml(`${location.pathname}?${query}${query ? '&' : ''}section_id=${this.sectionId}`, signal);
      if (seq !== this.seq) return;
      const fresh = doc.getElementById(this.id);
      if (!fresh) return;
      const params = (sel) => new Set([...this.querySelectorAll(sel)].map((d) => d.closest('.facet')?.dataset.param));
      const open = params('details.facet[open]');
      const closed = params('details.facet:not([open])');
      const expanded = params('.facet__body.is-expanded');
      const active = document.activeElement;
      const hadFocus = !!active && this.contains(active);
      const chipIndex = hadFocus && active.matches('.active-filters__pill') ? [...this.querySelectorAll('.active-filters__pill')].indexOf(active) : -1;
      // a price field being typed in stays the same node; the form around it is renewed
      const keep = hadFocus && active.matches(PRICE) ? active.closest('[data-facets-form] > .facet') : null;
      const scrollBody = this.querySelector('[data-facets-body]')?.scrollTop || 0;
      // desktop, filter column taller than the screen: the control just used stays put
      const panel = this.querySelector('[data-facets-panel]');
      const pin = !mq.matches && hadFocus && active.id && panel?.classList.contains('is-tall') && panel.contains(active) ? active.getBoundingClientRect().top : null;
      const countText = fresh.querySelector('[data-results-count], .collection__count')?.textContent.trim();
      const swap = (sel) => {
        const a = this.querySelector(sel);
        const b = fresh.querySelector(sel);
        if (a && b) a.replaceWith(b);
      };
      swap('[data-results]');
      const twin = keep && fresh.querySelector(`[data-facets-form] > .facet[data-param="${CSS.escape(keep.dataset.param || '')}"]`);
      if (twin) {
        const nodes = [...twin.parentNode.childNodes];
        const i = nodes.indexOf(twin);
        [...keep.parentNode.childNodes].forEach((n) => n !== keep && n.remove());
        keep.before(...nodes.slice(0, i));
        keep.after(...nodes.slice(i + 1));
      } else swap('[data-facets-body]');
      if (this.form) this.form.noValidate = true;
      priceView(this);
      swap('[data-facets-clear-top]');
      swap('[data-facets-clear]');
      swap('[data-show-results]');
      swap('.collection__toolbar .collection__count'); // search
      const btn = this.querySelector('.collection__toolbar [data-facets-open]');
      const freshBtn = fresh.querySelector('.collection__toolbar [data-facets-open]');
      if (btn && freshBtn) btn.innerHTML = freshBtn.innerHTML;
      this.querySelectorAll('details.facet').forEach((d) => {
        const p = d.dataset.param;
        if (open.has(p)) d.open = true;
        else if (closed.has(p)) d.open = false;
        const more = d.querySelector('[data-facet-more]');
        if (expanded.has(p) && more) {
          d.querySelector('.facet__body')?.classList.add('is-expanded');
          more.setAttribute('aria-expanded', 'true');
          more.querySelector('[data-more-label]').textContent = more.dataset.less;
        }
      });
      const body = this.querySelector('[data-facets-body]');
      if (body) body.scrollTop = scrollBody;
      if (this.drawerOpen) {
        this.querySelectorAll('[data-facets-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
        this.makeInert();
      }
      leadDates(this);
      this.announce(countText);
      const again = hadFocus && active.id && document.getElementById(active.id);
      if (again) again !== document.activeElement && again.focus(opts);
      else if (hadFocus && !this.contains(document.activeElement)) this.refocus(chipIndex);
      if (push) {
        history.pushState({ facets: true }, '', url);
        if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
      }
      if (this.drawerOpen) this.scrollPending = true;
      else if (pin == null) this.scrollToResults();
      else {
        const hold = () => {
          const el = document.getElementById(active.id);
          if (el) scrollBy(0, el.getBoundingClientRect().top - pin);
        };
        hold();
        requestAnimationFrame(() => requestAnimationFrame(hold));
      }
      this.checkBar?.();
    } catch (e) {
      if (e.name === 'AbortError' || seq !== this.seq) return;
      location.href = url;
    } finally {
      if (seq === this.seq) {
        this.removeAttribute('aria-busy');
        this.classList.remove('is-loading');
      }
    }
  }
  announce(text) {
    if (!text || !this.status) return;
    this.status.textContent = '';
    requestAnimationFrame(() => (this.status.textContent = text));
  }
  makeInert() {
    const panel = this.querySelector('[data-facets-panel]');
    if (!panel) return;
    this.restoreInert?.();
    this.restoreInert = KK.inertOutside(panel, [this.querySelector('.facets-backdrop'), this.status]);
  }
  progress(from, to) {
    const wrap = this.querySelector('[data-load-more]');
    if (!wrap) return;
    const total = Number(wrap.dataset.total) || 0;
    wrap.dataset.from = from;
    wrap.dataset.to = to;
    const tpl = from > 1 ? wrap.dataset.tplRange : wrap.dataset.tplAll;
    const p = wrap.querySelector('[data-progress]');
    if (p && tpl) p.textContent = tpl.replace('[from]', from).replace('[to]', to).replace('[total]', total);
    const bar = wrap.querySelector('[data-progress-bar]');
    if (bar && total) {
      bar.style.marginLeft = `${((from - 1) * 100) / total}%`;
      bar.style.width = `${((to - from + 1) * 100) / total}%`;
    }
  }
  // 'Meer laden' / 'Vorige producten tonen'; a filter or sort chosen meanwhile wins
  async page(btn, fn) {
    if (this.getAttribute('aria-busy')) return; // a filter result is on its way
    const u = new URL(btn.href, location.origin);
    u.searchParams.set('section_id', this.sectionId);
    const [seq, signal] = this.begin();
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    try {
      const doc = await this.fetchHtml(u.pathname + u.search, signal);
      if (seq !== this.seq || !btn.isConnected) return;
      const items = [...doc.querySelectorAll('[data-product-grid] > li')];
      fn(doc, items, this.querySelector('[data-product-grid]'));
      items[0]?.querySelector('.card__title a')?.focus(opts);
    } catch (e) {
      if (e.name === 'AbortError' || seq !== this.seq) return;
      location.href = btn.href;
    } finally {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
    }
  }
  /* The address carries the last page shown (?page=3), the history entry the first ({kkFirst}); with more than one page in
     the grid, scrollRestoration goes manual and restore() rebuilds grid and spot (keepPlace) */
  pageOf(href) {
    return Number(new URL(href, location.origin).searchParams.get('page')) || 1;
  }
  setPages(first, last) {
    const u = new URL(location.href);
    if (last > 1) u.searchParams.set('page', last);
    else u.searchParams.delete('page');
    history.replaceState({ ...(history.state || {}), kkFirst: first }, '', u);
    if ('scrollRestoration' in history) history.scrollRestoration = first < last ? 'manual' : 'auto';
  }
  keepPlace() {
    const save = () => {
      const st = history.state || {};
      if (!(st.kkFirst < this.pageOf(location.href))) return;
      const h = document.querySelector('sticky-header');
      const cover = h && h.dataset.sticky !== 'none' ? h.getBoundingClientRect().bottom : 0;
      const items = [...this.querySelectorAll('[data-product-grid] > li')];
      const i = items.findIndex((li) => li.getBoundingClientRect().bottom > Math.max(cover, 0) + 1);
      if (i < 0) return;
      history.replaceState({ ...st, kkAnchor: { i, top: Math.round(items[i].getBoundingClientRect().top) }, kkY: Math.round(scrollY) }, '');
    };
    addEventListener('scroll', KK.debounce(save, 200), { passive: true });
    addEventListener('pagehide', save);
    this.addEventListener('click', (e) => e.target.closest('[data-product-grid] a') && save(), true);
  }
  async restore() {
    const st = history.state || {};
    const grid = this.querySelector('[data-product-grid]');
    const last = this.pageOf(location.href);
    if (!grid || !(st.kkFirst >= 1) || st.kkFirst >= last || grid.dataset.firstPage !== String(last)) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const [seq, signal] = this.begin();
    this.setAttribute('aria-busy', 'true');
    this.classList.add('is-loading');
    try {
      const pages = Array.from({ length: last - st.kkFirst }, (_, k) => st.kkFirst + k);
      const docs = await Promise.all(
        pages.map((n) => {
          const u = new URL(location.href);
          u.searchParams.set('page', n);
          u.searchParams.set('section_id', this.sectionId);
          return this.fetchHtml(u.pathname + u.search, signal);
        })
      );
      if (seq !== this.seq) return;
      grid.prepend(...docs.flatMap((d) => [...d.querySelectorAll('[data-product-grid] > li')]));
      grid.dataset.firstPage = String(st.kkFirst);
      const prev = this.querySelector('[data-load-prev]');
      const freshPrev = docs[0].querySelector('[data-load-prev]');
      if (prev) freshPrev ? prev.replaceWith(freshPrev) : prev.remove();
      const firstMore = docs[0].querySelector('[data-load-more]');
      const cur = this.querySelector('[data-load-more]');
      if (firstMore && cur) this.progress(Number(firstMore.dataset.from) || 1, Number(cur.dataset.to) || 0);
    } catch (e) {
      if (seq === this.seq) this.setPages(last, last);
      return;
    } finally {
      if (seq === this.seq) {
        this.removeAttribute('aria-busy');
        this.classList.remove('is-loading');
      }
    }
    if (seq !== this.seq) return;
    const a = st.kkAnchor;
    const el = a && this.querySelectorAll('[data-product-grid] > li')[a.i];
    if (el) scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - a.top));
    else if (st.kkY != null) scrollTo(0, st.kkY);
  }
  loadMore(btn) {
    const wrap = btn.closest('[data-load-more]');
    const n = this.pageOf(btn.href);
    return this.page(btn, (doc, items, grid) => {
      grid.append(...items);
      const from = Number(wrap.dataset.from) || 1;
      const freshWrap = doc.querySelector('[data-load-more]');
      if (freshWrap) {
        wrap.replaceWith(freshWrap);
        this.progress(from, Number(freshWrap.dataset.to) || 0);
      } else wrap.remove();
      this.setPages(Number(grid.dataset.firstPage) || 1, n);
    });
  }
  loadPrev(btn) {
    const wrap = btn.closest('[data-load-prev]');
    const n = this.pageOf(btn.href);
    return this.page(btn, (doc, items, grid) => {
      const anchor = grid.firstElementChild;
      const y = anchor ? anchor.getBoundingClientRect().top : 0;
      grid.prepend(...items);
      grid.dataset.firstPage = String(n);
      const freshPrev = doc.querySelector('[data-load-prev]');
      if (freshPrev) wrap.replaceWith(freshPrev);
      else wrap.remove();
      if (anchor) scrollBy(0, anchor.getBoundingClientRect().top - y);
      const freshMore = doc.querySelector('[data-load-more]');
      const cur = this.querySelector('[data-load-more]');
      if (freshMore && cur) this.progress(Number(freshMore.dataset.from) || 1, Number(cur.dataset.to) || 0);
      this.setPages(n, this.pageOf(location.href));
    });
  }
  setOpen(on) {
    this.classList.toggle('is-drawer-open', on);
    document.body.classList.toggle('is-locked', on);
    this.querySelectorAll('[data-facets-open]').forEach((b) => b.setAttribute('aria-expanded', String(on)));
    this.querySelector('.facets-backdrop')?.toggleAttribute('hidden', !on);
    const panel = this.querySelector('[data-facets-panel]');
    ['role', 'aria-modal'].forEach((a, i) => (on ? panel?.setAttribute(a, i ? 'true' : 'dialog') : panel?.removeAttribute(a)));
    return panel;
  }
  open() {
    const panel = this.setOpen(true);
    if (!panel) return;
    this.makeInert();
    KK.trapFocus(panel);
    const focus = () => panel.focus(opts);
    focus();
    if (document.activeElement !== panel) requestAnimationFrame(() => (focus(), document.activeElement !== panel && setTimeout(focus, 80)));
  }
  close() {
    if (!this.drawerOpen) return;
    this.setOpen(false);
    KK.releaseFocus();
    this.restoreInert?.();
    this.restoreInert = null;
    [...this.querySelectorAll('[data-facets-open]')].find((x) => x.offsetParent !== null)?.focus(opts);
    if (this.scrollPending) {
      this.scrollPending = false;
      requestAnimationFrame(() => this.scrollToResults());
    }
  }
}
customElements.get('facet-filters') || customElements.define('facet-filters', FacetFilters);

// phone intro: two lines + 'Lees meer' when cut off
const clamp = () =>
  document.querySelectorAll('[data-clamp]').forEach((el) => {
    if (el.classList.contains('is-open')) return;
    const intro = el.querySelector('.collection-head__intro');
    el.classList.toggle('is-clamped', !!intro && intro.scrollHeight > intro.clientHeight + 1);
  });
clamp();
addEventListener('resize', KK.debounce(clamp, 150));
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-clamp-toggle]');
  if (!t) return;
  const head = t.closest('[data-collection-head]');
  const box = head?.querySelector('[data-clamp]') || document.getElementById(t.getAttribute('aria-controls'));
  const on = !box.classList.contains('is-open');
  box.classList.toggle('is-open', on);
  head?.classList.toggle('is-expanded', on);
  t.setAttribute('aria-expanded', String(on));
  t.textContent = on ? t.dataset.less : t.dataset.more;
});

// card swatches: hover shows that colour's render
const preview = (sw, on) => {
  const card = sw.closest('[data-card]');
  const img = card?.querySelector('.card__img');
  if (!img) return;
  if (!img.dataset.srcsetOrig) img.dataset.srcsetOrig = img.getAttribute('srcset') || '';
  card.querySelectorAll('.card__swatch.is-active').forEach((x) => x.classList.remove('is-active'));
  const show = on && sw.dataset.srcset;
  img.setAttribute('srcset', show ? sw.dataset.srcset : img.dataset.srcsetOrig);
  sw.classList.toggle('is-active', !!show);
  img.closest('.card__media').classList.toggle('is-previewing', !!show);
};
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const sw = e.target.closest?.('.card__swatch[data-srcset]');
  if (sw) preview(sw, true);
});
document.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse') return;
  const box = e.target.closest?.('.card__swatches');
  const sw = box && !box.contains(e.relatedTarget) && box.querySelector('.card__swatch');
  if (sw) preview(sw, false);
});

// quick add: quick-add.js loads on the first hover, focus or tap
let qa;
const loadQA = () =>
  (qa ||= new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = document.querySelector('[data-qa-src]')?.dataset.qaSrc || SRC.replace(/facets\.js/, 'quick-add.js');
    s.onload = () => (KK.quickAdd ? ok(KK.quickAdd) : fail());
    s.onerror = fail;
    document.head.append(s);
  }).catch((e) => {
    qa = null;
    throw e;
  }));
['pointerover', 'focusin', 'touchstart'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.target.closest?.('[data-quick-add]') && loadQA().catch(() => {}), { passive: true })
);
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-quick-add]');
  if (!t || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
  e.preventDefault();
  loadQA().then(
    (q) => q.open(t.dataset.quickAdd, t),
    () => (location.href = t.href)
  );
});
})();
