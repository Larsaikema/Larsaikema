/* Klapklaar cart: AJAX add (/cart/add.js), drawer + page line updates (/cart/change.js) via the Section Rendering API. */
(() => {
  const KK = window.KK;
  const json = { 'Content-Type': 'application/json', Accept: 'application/json' };

  const cart = (KK.cart = {
    /** ids of cart sections present on this page (drawer + cart page section + cart-dependent sections), max 5 */
    sectionIds() {
      // cart lines + sections whose content depends on the cart (e.g. 'Vergeet niet' that hides what is in it)
      return [...document.querySelectorAll('cart-items[data-section-id], [data-cart-dependent][data-section-id]')]
        .map((el) => el.dataset.sectionId)
        .concat(document.getElementById('CartDrawer') ? ['cart-drawer'] : [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 5);
    },

    render(sections) {
      if (!sections) return;
      Object.entries(sections).forEach(([id, html]) => {
        if (!html) return;
        const doc = KK.parse(html);
        if (id === 'cart-drawer') {
          const fresh = doc.getElementById('CartDrawer');
          const dialog = document.getElementById('CartDrawer');
          if (fresh && dialog) {
            dialog.innerHTML = fresh.innerHTML;
            dialog.dataset.itemCount = fresh.dataset.itemCount;
          }
        } else {
          const wrap = document.getElementById(`shopify-section-${id}`);
          const fresh = doc.getElementById(`shopify-section-${id}`) || doc.body;
          if (wrap && fresh) wrap.innerHTML = fresh.innerHTML;
        }
      });
    },

    async count() {
      const r = await fetch(`${KK.routes.cart}.js`, { headers: { Accept: 'application/json' } });
      const c = await r.json();
      KK.updateCartCount(c);
      return c;
    },

    /** body: FormData (file uploads) or {items:[...]}; quiet: no section re-render/count/event (a follow-up call does that) */
    async add(body, { quiet = false } = {}) {
      const ids = quiet ? [] : cart.sectionIds();
      let init;
      if (body instanceof FormData) {
        if (ids.length) {
          body.append('sections', ids.join(','));
          body.append('sections_url', location.pathname);
        }
        init = { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body };
      } else {
        init = { method: 'POST', headers: json, body: JSON.stringify(ids.length ? { ...body, sections: ids.join(','), sections_url: location.pathname } : body) };
      }
      const r = await fetch(`${KK.routes.cartAdd}.js`, init);
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data.status) {
        // 422 descriptions are Shopify's localized stock messages; anything else (404 'Cannot find variant', 5xx) gets ours
        const err = new Error((r.status === 422 && data.description) || KK.strings.addError);
        err.data = data;
        throw err;
      }
      if (quiet) return data;
      cart.render(data.sections);
      const c = await cart.count();
      KK.emit('cart:added', { data, cart: c });
      return data;
    },

    /** line: 1-based line number, or a line item key (string) */
    async change(line, quantity) {
      const ids = cart.sectionIds();
      const target = typeof line === 'string' ? { id: line } : { line };
      const r = await fetch(`${KK.routes.cartChange}.js`, {
        method: 'POST',
        headers: json,
        body: JSON.stringify({ ...target, quantity, sections: ids.join(','), sections_url: location.pathname }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data.status) {
        const err = new Error(data.description || data.message || KK.strings.cartError);
        err.data = data;
        throw err;
      }
      cart.render(data.sections);
      KK.updateCartCount(data);
      KK.emit('cart:changed', data);
      return data;
    },

    async note(note) {
      await fetch(`${KK.routes.cartUpdate}.js`, { method: 'POST', headers: json, body: JSON.stringify({ note }) });
    },

    open() {
      const d = document.getElementById('CartDrawer');
      if (d) KK.openDialog(d, document.querySelector('[data-cart-toggle]'));
      else location.href = KK.routes.cart;
    },

    /** 'Statafelrok stretch Ø 80 cm, Zwart · 1 ×' for the added line (brand v6 7.2); made to measure shows its units */
    lineLabel(item) {
      if (!item || !item.product_title) return '';
      const unit = item.properties && item.properties._eenheid;
      const variant = item.variant_title && item.variant_title !== 'Default Title' ? `, ${item.variant_title}` : '';
      return `${item.product_title}${variant} · ${unit ? `${item.quantity} ${unit}` : `${item.quantity} ×`}`;
    },

    /** called after a successful add from any product form; item = the added line (cart/add.js response) */
    afterAdd(title, item) {
      if (KK.cartType === 'page' || !document.getElementById('CartDrawer')) {
        location.href = KK.routes.cart;
        return;
      }
      const line = cart.lineLabel(item) || title || '';
      // on the cart page the lines are already re-rendered in place: confirm with a toast instead of the drawer
      if (document.querySelector('.cart-page cart-items')) {
        KK.toast(`<strong>${KK.escape(KK.strings.addedTitle)}</strong>${line ? `<br>${KK.escape(line)}` : ''}`);
        return;
      }
      cart.open();
      const box = document.querySelector('#CartDrawer [data-cart-added]');
      if (box) {
        box.querySelector('[data-cart-added-line]').textContent = line;
        box.hidden = false;
      }
    },
  });

  /* header cart icon opens the drawer */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cart-toggle]');
    if (!t || !document.getElementById('CartDrawer') || KK.cartType === 'page') return;
    e.preventDefault();
    cart.open();
  });

  /* quick-add forms (cards, upsell) — the main product form has its own handler (product-form.js) */
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-product-form]');
    if (!form || form.dataset.productForm === 'main') return;
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn?.classList.add('is-loading');
    btn?.setAttribute('aria-busy', 'true');
    try {
      const fd = new FormData(form);
      const res = await cart.add({ items: [{ id: Number(fd.get('id')), quantity: Number(fd.get('quantity') || 1) }] });
      cart.afterAdd(form.closest('.card, .upsell__item')?.querySelector('a[href*="/products/"]:not([tabindex])')?.textContent?.trim(), res.items ? res.items[0] : res);
    } catch (err) {
      KK.toast(err.message || KK.strings.addError, 'error');
    } finally {
      btn?.classList.remove('is-loading');
      btn?.removeAttribute('aria-busy');
    }
  });

  /* cart lines (drawer + page) */
  customElements.get('cart-items') ||
    customElements.define(
      'cart-items',
      class extends HTMLElement {
        connectedCallback() {
          this.onChange = KK.debounce((input) => this.update(input.dataset.line, Number(input.value), input), 350);
          this.addEventListener('change', (e) => {
            const input = e.target.closest('input[name="updates[]"]');
            if (input) this.onChange(input);
          });
          this.addEventListener('click', (e) => {
            const rm = e.target.closest('[data-cart-remove]');
            if (!rm) return;
            e.preventDefault();
            this.update(rm.dataset.line, 0, rm);
          });
        }
        async update(line, quantity, source) {
          const row = source.closest('.cart-line');
          const refocus = source.id ? `#${CSS.escape(source.id)}` : `.cart-line[data-line="${line}"] [name="${source.name}"]`;
          row?.classList.add('is-updating');
          this.setAttribute('aria-busy', 'true');
          try {
            await cart.change(Number(line), quantity);
            const again = document.querySelector(refocus) || document.getElementById('CartDrawerTitle');
            if (again && document.activeElement === document.body) again.focus({ preventScroll: true });
          } catch (err) {
            const box = row?.querySelector('[data-line-error]');
            if (box) {
              box.textContent = err.message;
              box.hidden = false;
            } else KK.toast(err.message, 'error');
            row?.classList.remove('is-updating');
          } finally {
            this.removeAttribute('aria-busy');
          }
        }
      }
    );

  customElements.get('cart-drawer') ||
    customElements.define(
      'cart-drawer',
      class extends HTMLElement {
        connectedCallback() {
          this.addEventListener('change', KK.debounce((e) => e.target.matches('[data-cart-note]') && cart.note(e.target.value), 400));
        }
      }
    );

  /* cart page note */
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-cart-note]') && !e.target.closest('cart-drawer')) cart.note(e.target.value);
  });
})();
