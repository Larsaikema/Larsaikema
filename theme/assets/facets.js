/* Collection & search pages: storefront filtering + sorting (live via the Section Rendering API, sidebar on desktop,
   drawer on mobile, history support), 'Meer laden', the sticky filter/sort bar on mobile, the clamped intro, and for
   every product card on the page: colour swatches preview their image on hover, and the card action opens the
   quick-add drawer (quick-add.js, loaded on first use) for products with options. */
(() => {
const KK = window.KK;
const mq = matchMedia('(max-width: 989px)');
const SRC = document.currentScript?.src || '';
const opts = { preventScroll: true };
const PRICE = '[data-price-min], [data-price-max]';
/* A typed amount as Shopify reads it: Dutch notation ('1.000', '1.250,50', '279,50') or plain ('279.50'). '' = no bound,
   null = not an amount. */
const amount = (raw) => {
  let v = String(raw || '').replace(/[\s€\u00a0]/g, '');
  if (!v) return '';
  if (/^\d{1,3}(\.\d{3})+(,\d*)?$/.test(v)) v = v.replace(/\./g, '');
  v = v.replace(',', '.');
  if (!/^\d*\.?\d*$/.test(v) || v === '.') return null;
  return String(Math.round(Number(v) * 100) / 100);
};

class FacetFilters extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.cache = new Map();
    this.seq = 0;
    // one polite live region outside the re-rendered results (and kept out of the drawer's inert): announces the count
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
      // leaving a price field (or Enter): Van above Tot is read as the range between them
      this.priceOk(true);
      this.onChange();
    });
    // price fields: the count follows while typing, not only on blur / Enter (not while Van is above Tot)
    this.addEventListener('input', (e) => e.target.matches(PRICE) && e.target.closest('[data-facets-form]') && this.onChange());
    /* Sort: a closed select changes its value on every arrow key (Chrome, Windows). Such a keyboard change waits for Enter
       or for leaving the field (WCAG 3.2.2); a choice made in the opened list, by mouse or by touch applies at once. */
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.classList.contains('is-drawer-open')) return this.close();
      // the drawer's close is a link (it works without JavaScript too); it answers Space like a button
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
      this.priceOk(true);
      this.submit();
    });
    this.addEventListener('click', (e) => {
      const t = e.target;
      const link = t.closest('[data-facet-link]');
      const more = t.closest('[data-load-more-btn]');
      const prev = t.closest('[data-load-prev-btn]');
      const toggle = t.closest('[data-facets-open], [data-facets-close]');
      // the drawer's close is a link for a page without JavaScript (:target); here it closes the drawer
      if (link || more || prev || toggle) e.preventDefault();
      if (link) return this.render(new URL(link.href, location.origin).searchParams.toString());
      if (more) return this.loadMore(more);
      if (prev) return this.loadPrev(prev);
      if (t.closest('[data-facets-open]')) return this.open();
      if (t.closest('[data-facets-close]')) return this.close();
      const all = t.closest('[data-facet-more]');
      if (all) {
        // 'Bekijk alles (41)' <-> 'Minder tonen'; opening moves focus to the first value that was hidden
        const body = all.closest('.facet__body');
        const on = !body.classList.contains('is-expanded');
        body.classList.toggle('is-expanded', on);
        all.setAttribute('aria-expanded', String(on));
        all.querySelector('[data-more-label]').textContent = on ? all.dataset.less : all.dataset.more;
        if (on) body.querySelector('.facet__item--more input')?.focus();
      }
    });
    addEventListener('popstate', () => this.render(location.search.slice(1), false).then(() => this.restore()));
    // the amounts are checked here (Dutch notation is accepted), not by the browser's pattern check for pages without JavaScript
    if (this.form) this.form.noValidate = true;
    this.watchBar();
    this.keepPlace();
    this.restore();
  }
  get form() {
    return this.querySelector('[data-facets-form]');
  }
  get drawerOpen() {
    return this.classList.contains('is-drawer-open');
  }
  // mobile: the filter/sort bar sticks under the header; a hairline shows once it is stuck
  watchBar() {
    let raf = 0;
    const check = () => {
      raf = 0;
      const bar = this.querySelector('[data-collection-bar]');
      if (!bar) return;
      const top = parseFloat(getComputedStyle(bar).top) || 0;
      bar.classList.toggle('is-stuck', mq.matches && bar.getBoundingClientRect().top <= top + 0.5 && scrollY > 0);
    };
    this.checkBar = check;
    addEventListener('scroll', () => raf || (raf = requestAnimationFrame(check)), { passive: true });
    check();
  }
  /* Price range: Van above Tot finds nothing. While typing such a range waits (a hint says why); on leaving the field, Enter
     or any other filter the two amounts swap places, so 'Van 1000 Tot 100' becomes € 100 – € 1.000. */
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
    // a field that holds no amount ('abc') is marked; it is left out of the filter until it is corrected
    a.toggleAttribute('aria-invalid', bad || x === null);
    b.toggleAttribute('aria-invalid', bad || y === null);
    const hint = this.querySelector('[data-price-hint]');
    if (hint) hint.hidden = !bad;
    return !bad;
  }
  params() {
    this.priceOk(true);
    let p;
    if (this.form) {
      p = new URLSearchParams();
      const prices = new Set([...this.form.querySelectorAll(PRICE)].map((i) => i.name));
      for (let [k, v] of new FormData(this.form)) {
        if (prices.has(k)) v = amount(v) ?? '';
        if (v !== '') p.append(k, v);
      }
    } else {
      // filtering switched off (or no filters here): sorting keeps what the address already carries (q on search)
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
    // the face of the collection bar follows the choice right away ('Sorteer op: Prijs laag-hoog'; on the phone the
    // button itself reads 'Prijs laag-hoog' until the default 'Aanbevolen' is chosen again)
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
  // after a change: the count, the active-filter chips and the first row in view, below the header that comes back
  // when the page scrolls up (a scroll-up header is hidden now, so --header-h reads 0 and cannot be used)
  scrollToResults() {
    const h = document.querySelector('sticky-header');
    const cover = h && h.dataset.sticky !== 'none' ? h.offsetHeight : 0;
    const res = this.querySelector('[data-results]') || this;
    const top = Math.max(0, Math.round(res.getBoundingClientRect().top + scrollY - cover - (mq.matches ? 0 : 16)));
    if (scrollY > top + 2) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  // focus that sat on a control the update removed (a chip, 'Wis alles') goes to the next chip, else to the count
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
  /* Every change starts a new request and cancels the one before it; only the newest answer is applied, so a slow
     earlier response can never overwrite a later choice. */
  async render(query, push = true) {
    const url = `${location.pathname}${query ? `?${query}` : ''}`;
    const seq = ++this.seq;
    this.ctrl?.abort();
    const ctrl = (this.ctrl = new AbortController());
    this.setAttribute('aria-busy', 'true');
    this.classList.add('is-loading');
    try {
      const doc = await this.fetchHtml(`${location.pathname}?${query}${query ? '&' : ''}section_id=${this.sectionId}`, ctrl.signal);
      if (seq !== this.seq) return;
      const fresh = doc.getElementById(this.id);
      if (!fresh) return;
      // keep open/closed state of filter groups, 'view all' lists and the focused control
      const params = (sel) => new Set([...this.querySelectorAll(sel)].map((d) => d.closest('.facet')?.dataset.param));
      const open = params('details.facet[open]');
      const closed = params('details.facet:not([open])');
      const expanded = params('.facet__body.is-expanded');
      const active = document.activeElement;
      const hadFocus = !!active && this.contains(active);
      const chipIndex = hadFocus && active.matches('.active-filters__pill') ? [...this.querySelectorAll('.active-filters__pill')].indexOf(active) : -1;
      // a price field being typed in stays the same node (value, caret and focus intact); the form around it is renewed
      const keep = hadFocus && active.matches(PRICE) ? active.closest('[data-facets-form] > .facet') : null;
      const scrollBody = this.querySelector('[data-facets-body]')?.scrollTop || 0;
      // read before the swap moves the nodes out of the fresh document
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
      swap('[data-facets-clear-top]');
      swap('[data-show-results]');
      swap('.collection__toolbar .collection__count'); // search page: its count sits in the toolbar, outside the results
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
        // the fresh results block is not inert yet: make the page behind the open drawer inert again
        this.makeInert();
      }
      this.announce(countText);
      const again = hadFocus && active.id && document.getElementById(active.id);
      if (again) again !== document.activeElement && again.focus(opts);
      else if (hadFocus && !this.contains(document.activeElement)) this.refocus(chipIndex);
      if (push) {
        history.pushState({ facets: true }, '', url);
        // a pushed entry copies the scroll mode of the one before it; a fresh filter result is one page again
        if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
      }
      // with the phone drawer open the page behind it waits: it scrolls once the drawer closes ('Toon 14 producten')
      if (this.drawerOpen) this.scrollPending = true;
      else this.scrollToResults();
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
  // the new number of products, read by screen readers from the persistent live region
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
  // progress line under the grid: '48 van 150 producten', or '25–48 van 150' when the page did not start at 1
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
  // fetch another page of the grid for 'Meer laden' / 'Vorige producten tonen'
  async page(btn, fn) {
    const u = new URL(btn.href, location.origin);
    u.searchParams.set('section_id', this.sectionId);
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    try {
      const doc = await this.fetchHtml(u.pathname + u.search);
      const items = [...doc.querySelectorAll('[data-product-grid] > li')];
      fn(doc, items, this.querySelector('[data-product-grid]'));
      items[0]?.querySelector('.card__title a')?.focus(opts);
    } catch (e) {
      location.href = btn.href;
    } finally {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
    }
  }
  /* Pages in the grid. The address carries the last page shown (?page=3, like Shopify's own pagination) and the history
     entry the first one ({kkFirst: 1}); replaceState, so Back still leaves the list instead of stepping through pages.
     When the grid holds more than the page in the address, the browser cannot restore the scroll spot on its own:
     scrollRestoration goes to manual for this entry and restore() rebuilds the grid and the spot (keepPlace). */
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
  // the card at the top of the view and where it sits, kept in the history entry (on scroll and when leaving the page)
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
    // a click on a card saves at once (the scroll save may still be waiting)
    this.addEventListener('click', (e) => e.target.closest('[data-product-grid] a') && save(), true);
  }
  // Back / reload on ?page=N after 'Meer laden': fetch pages kkFirst..N-1, put them above the grid, back to the same card
  async restore() {
    const st = history.state || {};
    const grid = this.querySelector('[data-product-grid]');
    const last = this.pageOf(location.href);
    if (!grid || !(st.kkFirst >= 1) || st.kkFirst >= last || grid.dataset.firstPage !== String(last)) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    this.setAttribute('aria-busy', 'true');
    this.classList.add('is-loading');
    try {
      const pages = Array.from({ length: last - st.kkFirst }, (_, k) => st.kkFirst + k);
      const docs = await Promise.all(
        pages.map((n) => {
          const u = new URL(location.href);
          u.searchParams.set('page', n);
          u.searchParams.set('section_id', this.sectionId);
          return this.fetchHtml(u.pathname + u.search);
        })
      );
      grid.prepend(...docs.flatMap((d) => [...d.querySelectorAll('[data-product-grid] > li')]));
      grid.dataset.firstPage = String(st.kkFirst);
      const prev = this.querySelector('[data-load-prev]');
      const freshPrev = docs[0].querySelector('[data-load-prev]');
      if (prev) freshPrev ? prev.replaceWith(freshPrev) : prev.remove();
      const firstMore = docs[0].querySelector('[data-load-more]');
      const cur = this.querySelector('[data-load-more]');
      if (firstMore && cur) this.progress(Number(firstMore.dataset.from) || 1, Number(cur.dataset.to) || 0);
    } catch (e) {
      // the earlier pages could not be fetched: this page stays as it is, with 'Vorige producten tonen'
      this.setPages(last, last);
      return;
    } finally {
      this.removeAttribute('aria-busy');
      this.classList.remove('is-loading');
    }
    const a = st.kkAnchor;
    const el = a && this.querySelectorAll('[data-product-grid] > li')[a.i];
    if (el) scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - a.top));
    else if (st.kkY != null) scrollTo(0, st.kkY);
  }
  // 'Meer laden': the next page's cards are appended and the address moves to that page (see setPages)
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
  // arrived on ?page=N: 'Vorige producten tonen' puts the page before it above the grid, keeping the view in place
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
    // the page behind the drawer is inert (not only Tab-trapped); the backdrop and the live region stay reachable
    this.makeInert();
    KK.trapFocus(panel);
    // the panel becomes visible in the same frame; retry once the style has settled (reduced motion included)
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

// collection intro (phone): two lines with 'Lees meer' when the text is cut off; the same button opens the kenmerken
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

// card swatches: hovering a colour shows that colour's render; leaving the swatches restores the card image
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

// quick add (card action of a product with options): quick-add.js loads on the first hover, focus or tap of such a button
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
