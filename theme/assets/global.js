/* Klapklaar core: helpers, pub/sub, section rendering, dialogs, header, btw toggle. Vanilla, no dependencies. */
(() => {
  const KK = (window.KK = window.KK || {});
  KK.strings = KK.strings || {};

  /* ---------- pub/sub ---------- */
  const subs = {};
  KK.on = (evt, fn) => ((subs[evt] = subs[evt] || []).push(fn), () => (subs[evt] = subs[evt].filter((f) => f !== fn)));
  KK.emit = (evt, data) => (subs[evt] || []).forEach((fn) => fn(data));

  /* ---------- helpers ---------- */
  KK.debounce = (fn, wait = 250) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), wait);
    };
  };
  KK.parse = (html) => new DOMParser().parseFromString(html, 'text/html');
  KK.formatMoney = (cents, format = KK.moneyFormat || '€{{amount_with_comma_separator}}') => {
    const n = (Number(cents) || 0) / 100;
    const fix = (dec, th, ds) => {
      const [i, f] = n.toFixed(dec).split('.');
      return i.replace(/\B(?=(\d{3})+(?!\d))/g, th) + (dec ? ds + f : '');
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) =>
      ({
        amount: fix(2, ',', '.'),
        amount_no_decimals: fix(0, ',', '.'),
        amount_with_comma_separator: fix(2, '.', ','),
        amount_no_decimals_with_comma_separator: fix(0, '.', ','),
        amount_with_space_separator: fix(2, ' ', ','),
        amount_with_apostrophe_separator: fix(2, "'", '.'),
      })[k] ?? fix(2, '.', ',')
    );
  };
  /** Store cents -> cents in the shown btw mode (incl/excl), honouring the store's taxes_included setting. */
  KK.vatShown = (cents, excl = document.documentElement.dataset.vat === 'excl') => {
    const f = (100 + Number(KK.vatRate ?? 21)) / 100;
    const stored = KK.taxesIncluded === false ? 'excl' : 'incl';
    if (excl) return stored === 'incl' ? Math.round(cents / f) : cents;
    return stored === 'excl' ? Math.round(cents * f) : cents;
  };
  KK.escape = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  KK.t = (key, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.split(`__${k.toUpperCase()}__`).join(v), KK.strings[key] || '');

  /** Section Rendering API: returns {id: html}. */
  KK.fetchSections = async (ids, url = location.pathname + location.search) => {
    const u = new URL(url, location.origin);
    u.searchParams.set('sections', ids.join(','));
    const r = await fetch(u, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`sections ${r.status}`);
    return r.json();
  };
  KK.fetchSection = async (id, url) => {
    const u = new URL(url, location.origin);
    u.searchParams.set('section_id', id);
    const r = await fetch(u);
    if (!r.ok) throw new Error(`section ${r.status}`);
    return r.text();
  };
  /** Replace each [data-dynamic=key] (or #id) inside root with the fresh version from doc. */
  KK.swap = (root, doc, selectors) =>
    selectors.forEach((sel) => {
      const fresh = doc.querySelector(sel);
      root.querySelectorAll(sel).forEach((old) => fresh && old.replaceWith(fresh.cloneNode(true)));
    });

  /* ---------- toast ---------- */
  let toastTimer;
  KK.toast = (html, type = 'success', ms = 4500) => {
    const el = document.getElementById('Toast');
    if (!el) return;
    el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
    el.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${type === 'error' ? 'M12 7v6.5M12 16.5v.5' : 'M4.5 12.5l4.5 4.5L19.5 6.5'}" fill="none" stroke="currentColor" stroke-width="2.2"/></svg><div>${html}</div>`;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => (el.hidden = true), 250);
    }, ms);
  };

  /* ---------- cart count + favicon ---------- */
  /** shown count: a made-to-measure line (quantity = billed m², property _eenheid) counts as 1 item */
  KK.cartCount = (c) => (c && c.items ? c.items.reduce((n, i) => n + (i.properties && i.properties._eenheid ? 1 : i.quantity), 0) : 0);
  KK.updateCartCount = (cartOrCount) => {
    const count = typeof cartOrCount === 'number' ? cartOrCount : KK.cartCount(cartOrCount);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = !count;
    });
    const word = KK.strings.cartWord || '';
    const items = (count === 1 ? KK.strings.cartLabelOneRaw : KK.strings.cartLabelOther || '').replace('__COUNT__', count);
    document.querySelectorAll('[data-cart-toggle]').forEach((a) => a.setAttribute('aria-label', `${word}, ${items}`));
    // favicon cart state (brand §3.7/§12): swap the 16 and 32 px PNGs
    document.querySelectorAll('link[data-favicon]').forEach((l) => {
      const f = KK.favicons && KK.favicons[l.dataset.favicon];
      if (f) l.href = count > 0 ? f.cart : f.base;
    });
  };

  /* ---------- focus trap for non-<dialog> panels (filter drawer) ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  KK.trapFocus = (el) => {
    KK.releaseFocus();
    KK._trap = (e) => {
      if (e.key !== 'Tab') return;
      const list = [...el.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', KK._trap);
  };
  KK.releaseFocus = () => KK._trap && document.removeEventListener('keydown', KK._trap);
  /** Make everything outside el inert (a modal that is not a <dialog>); returns a function that undoes it. */
  KK.inertOutside = (el, keep = []) => {
    const touched = [];
    for (let node = el; node && node.parentElement && node !== document.body; node = node.parentElement) {
      [...node.parentElement.children].forEach((sib) => {
        if (sib === node || sib.inert || keep.includes(sib) || sib.id === 'Toast' || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sib.tagName)) return;
        sib.inert = true;
        touched.push(sib);
      });
    }
    return () => touched.forEach((sib) => (sib.inert = false));
  };

  /* ---------- dialogs (drawers / modals) ---------- */
  KK.openDialog = (dialog, opener) => {
    if (!dialog || dialog.open) return;
    dialog._opener = opener || document.activeElement;
    dialog.showModal();
    document.body.classList.add('is-locked');
    if (dialog._opener) dialog._opener.setAttribute('aria-expanded', 'true');
    const focusable = dialog.querySelector('[autofocus], [data-drawer-close]');
    if (focusable) focusable.focus({ preventScroll: true });
  };
  KK.closeDialog = (dialog) => {
    if (!dialog || !dialog.open) return;
    dialog.close();
  };
  document.addEventListener(
    'close',
    (e) => {
      const d = e.target;
      if (!(d instanceof HTMLDialogElement)) return;
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('is-locked');
      if (d._opener) {
        d._opener.setAttribute('aria-expanded', 'false');
        if (document.contains(d._opener)) d._opener.focus({ preventScroll: true });
      }
    },
    true
  );
  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-drawer-close]');
    if (closer) return KK.closeDialog(closer.closest('dialog'));
    // click on the backdrop of a modal dialog closes it
    if (e.target instanceof HTMLDialogElement && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) KK.closeDialog(e.target);
    }
    const opener = e.target.closest('[data-open-dialog]');
    if (opener) {
      e.preventDefault();
      KK.openDialog(document.getElementById(opener.dataset.openDialog), opener);
    }
  });

  /* ---------- custom elements ---------- */
  const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);

  define(
    'quantity-input',
    class extends HTMLElement {
      connectedCallback() {
        this.input = this.querySelector('input');
        this.addEventListener('click', (e) => {
          const b = e.target.closest('button[name]');
          if (!b) return;
          e.preventDefault();
          const step = Number(this.input.step) || 1;
          const min = Number(this.input.min || 0);
          const max = this.input.max ? Number(this.input.max) : Infinity;
          const cur = Number(this.input.value) || 0;
          const next = b.name === 'plus' ? Math.min(max, cur + step) : Math.max(min, cur - step);
          if (next === cur) return;
          this.input.value = next;
          this.input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        this.input.addEventListener('change', () => this.sync());
        this.sync();
      }
      sync() {
        const v = Number(this.input.value);
        const minus = this.querySelector('[name="minus"]');
        const plus = this.querySelector('[name="plus"]');
        if (minus) minus.disabled = v <= Number(this.input.min || 0) && this.input.name !== 'updates[]';
        if (plus && this.input.max) plus.disabled = v >= Number(this.input.max);
      }
    }
  );

  define(
    'usp-rotator',
    class extends HTMLElement {
      connectedCallback() {
        this.items = [...this.children];
        if (this.items.length < 2) return;
        this.i = 0;
        this.ms = Number(this.dataset.interval) || 6000;
        this.mq = matchMedia('(min-width: 990px)');
        this.paused = this.dataset.autoplay === 'false' || matchMedia('(prefers-reduced-motion: reduce)').matches;
        const bar = this.closest('.utility-bar');
        this.toggleBtn = bar?.querySelector('[data-rotator-toggle]');
        this.nextBtn = bar?.querySelector('[data-rotator-next]');
        this.toggleBtn?.addEventListener('click', () => this.setPaused(!this.paused));
        this.nextBtn?.addEventListener('click', () => this.show(this.i + 1));
        this.setPaused(this.paused);
      }
      disconnectedCallback() {
        clearInterval(this.timer);
      }
      show(n) {
        this.items[this.i].classList.remove('is-active');
        this.i = (n + this.items.length) % this.items.length;
        this.items[this.i].classList.add('is-active');
      }
      setPaused(p) {
        this.paused = p;
        clearInterval(this.timer);
        if (!p) {
          this.timer = setInterval(() => {
            if (this.mq.matches || this.matches(':hover, :focus-within')) return;
            this.show(this.i + 1);
          }, this.ms);
        }
        const b = this.toggleBtn;
        if (b) {
          b.setAttribute('aria-pressed', String(p));
          b.setAttribute('aria-label', p ? b.dataset.labelPlay : b.dataset.labelPause);
          b.querySelector('[data-icon-pause]')?.toggleAttribute('hidden', p);
          b.querySelector('[data-icon-play]')?.toggleAttribute('hidden', !p);
        }
      }
    }
  );

  /* predictive-search.js loads on first use of the search field (pointer, touch or focus), not with every page */
  document.querySelectorAll('predictive-search[data-src]').forEach((el) => {
    const load = () => {
      if (customElements.get('predictive-search') || document.querySelector(`script[src="${el.dataset.src}"]`)) return;
      const sc = document.createElement('script');
      sc.src = el.dataset.src;
      document.head.append(sc);
    };
    ['pointerenter', 'touchstart', 'focusin'].forEach((ev) => el.addEventListener(ev, load, { once: true, passive: true }));
  });

  /* long placeholder when it fits, else the short one ('Zoek op product of maat'): never a cut-off hint */
  const fitPlaceholder = (el) => {
    const long = el.dataset.placeholderLong || (el.dataset.placeholderLong = el.placeholder);
    const cs = getComputedStyle(el);
    const ctx = (fitPlaceholder.ctx ||= document.createElement('canvas').getContext('2d'));
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4;
    el.placeholder = room <= 0 || ctx.measureText(long).width <= room ? long : el.dataset.placeholderShort;
  };
  const fitAll = () => document.querySelectorAll('input[data-placeholder-short]').forEach(fitPlaceholder);
  const fitObserver = new ResizeObserver(fitAll);
  document.querySelectorAll('input[data-placeholder-short]').forEach((el) => fitObserver.observe(el));
  document.fonts?.ready.then(fitAll);

  define(
    'sticky-header',
    class extends HTMLElement {
      connectedCallback() {
        this.mode = this.dataset.sticky;
        this.section = this.closest('.section-header');
        this.last = 0;
        // --header-h = the part of the header that covers the page right now (sticky offsets, scroll-padding):
        // 0 when the header does not stick or has slid away (scroll-up mode)
        const setH = () =>
          document.documentElement.style.setProperty('--header-h', `${this.mode === 'none' || this.classList.contains('is-hidden') ? 0 : this.offsetHeight}px`);
        setH();
        new ResizeObserver(setH).observe(this);
        if (this.mode === 'none') return;
        this.onScroll = () => {
          const y = window.scrollY;
          this.classList.toggle('is-scrolled', y > 8);
          if (this.mode === 'scroll-up' && Math.abs(y - this.last) > 4) {
            const hide = y > this.last && y > this.offsetHeight * 2 && !this.querySelector('.is-open, [aria-expanded="true"]');
            if (hide !== this.classList.contains('is-hidden')) {
              this.classList.toggle('is-hidden', hide);
              setH();
            }
          }
          if (Math.abs(y - this.last) > 4 || y < 8) this.last = y;
        };
        addEventListener('scroll', this.onScroll, { passive: true });
        // keyboard focus inside a slid-away header brings it back
        this.addEventListener('focusin', () => this.classList.contains('is-hidden') && (this.classList.remove('is-hidden'), setH()));
        this.onScroll();
      }
      disconnectedCallback() {
        removeEventListener('scroll', this.onScroll);
      }
    }
  );

  /* Mega menu as a disclosure: the trigger is a <button aria-expanded>. Click / Enter / Space toggle, a fine
     pointer may open it on hover, focus alone never opens it. Esc closes (WCAG 1.4.13) and returns focus to the
     trigger without re-opening; hover stays suppressed until the pointer leaves the item. */
  const openMegas = () => [...document.querySelectorAll('mega-menu.is-open')];
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    openMegas().forEach((m) => {
      const hadFocus = m.contains(document.activeElement);
      m.close(0);
      m.suppressHover = true;
      if (hadFocus) m.trigger.focus();
    });
  });
  document.addEventListener('click', (e) => {
    openMegas().forEach((m) => !m.contains(e.target) && m.close(0));
  });
  define(
    'mega-menu',
    class extends HTMLElement {
      connectedCallback() {
        this.trigger = this.querySelector('[data-mega-trigger]');
        this.panel = this.querySelector('[data-mega-panel]');
        const fine = matchMedia('(hover: hover) and (pointer: fine)');
        this.addEventListener('mouseenter', () => fine.matches && !this.suppressHover && this.open(120, 'hover'));
        this.addEventListener('mouseleave', () => {
          this.suppressHover = false;
          if (fine.matches && this.openedBy === 'hover') this.close(180);
        });
        this.trigger.addEventListener('click', () => {
          if (this.isOpen && this.openedBy === 'hover') {
            this.openedBy = 'click';
            return;
          }
          this.isOpen ? this.close(0) : this.open(0, 'click');
        });
        this.addEventListener('focusout', (e) => e.relatedTarget && !this.contains(e.relatedTarget) && this.close(0));
      }
      get isOpen() {
        return this.classList.contains('is-open');
      }
      open(delay, by) {
        clearTimeout(this.t);
        this.t = setTimeout(() => {
          openMegas().forEach((m) => m !== this && m.close(0));
          this.openedBy = by;
          this.classList.add('is-open');
          this.trigger.setAttribute('aria-expanded', 'true');
        }, delay);
      }
      close(delay) {
        clearTimeout(this.t);
        this.t = setTimeout(() => {
          this.classList.remove('is-open');
          this.trigger.setAttribute('aria-expanded', 'false');
        }, delay);
      }
    }
  );

  define(
    'menu-drawer',
    class extends HTMLElement {
      connectedCallback() {
        this.dialog = this.querySelector('dialog');
        document.querySelectorAll('[data-menu-open]').forEach((b) => b.addEventListener('click', () => KK.openDialog(this.dialog, b)));
        matchMedia('(min-width: 990px)').addEventListener('change', (e) => e.matches && KK.closeDialog(this.dialog));
      }
    }
  );

  /* btw toggle: Particulier (incl) / Zakelijk (excl). Remembered per browser; the Zakelijk pages (default excl, brand §6)
     keep their own key so a consumer choice elsewhere does not override that default. */
  KK.setVat = (mode) => {
    const html = document.documentElement;
    html.dataset.vat = mode;
    try {
      localStorage.setItem('kk:vat', mode);
      if (html.dataset.vatScope === 'zakelijk') localStorage.setItem('kk:vat:zakelijk', mode);
    } catch (e) {}
    document.querySelectorAll('[data-vat-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vatSet === mode)));
    KK.emit('vat:change', mode);
  };
  define(
    'vat-toggle',
    class extends HTMLElement {
      connectedCallback() {
        const mode = document.documentElement.dataset.vat || 'incl';
        this.querySelectorAll('[data-vat-set]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.vatSet === mode));
          b.addEventListener('click', () => KK.setVat(b.dataset.vatSet));
        });
      }
    }
  );

  /* details accordions: one open at a time inside [data-accordion-group] */
  document.addEventListener(
    'toggle',
    (e) => {
      const d = e.target;
      if (!(d instanceof HTMLDetailsElement) || !d.open) return;
      const group = d.closest('[data-accordion-group]');
      if (group) group.querySelectorAll('details[open]').forEach((o) => o !== d && o.parentElement === d.parentElement && (o.open = false));
    },
    true
  );

})();
