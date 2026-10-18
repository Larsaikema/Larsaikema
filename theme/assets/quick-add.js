/* Quick add from a product card (loaded by facets.js on the first hover, focus or tap of a card action): a drawer with
   the product's options, price, stock and the buy button (sections/quick-add.liquid). */
(() => {
const KK = window.KK;
KK.quickAdd ||= {
  dialog: null,
  ensure() {
    if (this.dialog) return this.dialog;
    const d = document.createElement('dialog');
    d.className = 'drawer quick-add';
    d.setAttribute('aria-labelledby', 'QuickAddTitle');
    // 'Sluiten' (general.close) from the page that loaded this file; the header's menu close says 'Menu sluiten'
    const q = (s) => document.querySelector(s)?.getAttribute(s.match(/\[([\w-]+)\]$/)[1]);
    const closeLabel = q('[data-qa-close]') || q('[data-facets-close][aria-label]') || q('[data-drawer-close][aria-label]') || '×';
    d.innerHTML = `<div class="drawer__head"><p class="drawer__title quick-add__label" data-qa-label></p><button type="button" class="icon-btn" data-drawer-close aria-label="${KK.escape(closeLabel)}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" fill="none"/></svg></button></div><div class="drawer__body quick-add__body" data-qa-body></div>`;
    document.body.append(d);
    d.addEventListener('change', (e) => e.target.matches('.qa__input') && this.pick(e.target));
    d.addEventListener('click', (e) => {
      const a = e.target.closest('[data-qa-load]');
      if (!a) return;
      e.preventDefault();
      this.load(a.dataset.qaLoad, a.textContent.trim());
    });
    KK.on('cart:added', () => d.open && KK.closeDialog(d));
    return (this.dialog = d);
  },
  async open(url, opener) {
    const d = this.ensure();
    d.querySelector('[data-qa-body]').innerHTML = '<div class="quick-add__loading" role="status"><span class="visually-hidden">…</span></div>';
    KK.openDialog(d, opener);
    await this.load(url);
  },
  async load(url, focusText) {
    const d = this.dialog;
    const body = d.querySelector('[data-qa-body]');
    const u = new URL(url, location.origin);
    u.searchParams.set('section_id', 'quick-add');
    const focusId = document.activeElement && d.contains(document.activeElement) ? document.activeElement.id : '';
    body.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch(u.pathname + u.search);
      if (!r.ok) throw new Error(r.status);
      const doc = KK.parse(await r.text());
      const qa = doc.querySelector('[data-qa]');
      if (!qa) throw new Error('empty');
      await this.css(doc);
      body.replaceChildren(qa);
      d.querySelector('[data-qa-label]').textContent = qa.dataset.label || '';
      const again = (focusId && document.getElementById(focusId)) || (focusText && [...qa.querySelectorAll('.qa__pill')].find((p) => p.textContent.trim() === focusText));
      (again || qa.querySelector('.qa__input:checked, .qa__add'))?.focus({ preventScroll: true });
    } catch (e) {
      // the product page always works: go there instead of showing a dead end
      location.href = url;
    } finally {
      body.removeAttribute('aria-busy');
    }
  },
  // the drawer's stylesheet comes with the section; load it once, before the first panel is shown
  css(doc) {
    const link = doc.querySelector('link[rel="stylesheet"]');
    if (!link || this.cssReady) return this.cssReady;
    const el = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: link.getAttribute('href') });
    this.cssReady = new Promise((ok) => {
      el.onload = el.onerror = ok;
      setTimeout(ok, 2500);
    });
    document.head.append(el);
    return this.cssReady;
  },
  pick(input) {
    const qa = input.closest('[data-qa]');
    const variants = JSON.parse(qa.querySelector('[data-qa-variants]').textContent);
    const current = variants.find((v) => String(v.id) === qa.querySelector('[data-qa-id]').value) || variants[0];
    const idx = Number(input.closest('fieldset').dataset.optionIndex);
    const want = current.options.slice();
    qa.querySelectorAll('fieldset[data-option-index]').forEach((fs) => {
      const c = fs.querySelector('input:checked');
      if (c) want[Number(fs.dataset.optionIndex)] = c.value;
    });
    const v =
      variants.find((x) => x.options.every((o, i) => o === want[i])) ||
      variants.find((x) => x.available && x.options[idx] === want[idx]) ||
      variants.find((x) => x.options[idx] === want[idx]);
    if (!v) return;
    qa.querySelector('[data-qa-id]').value = v.id;
    const u = new URL(qa.dataset.url, location.origin);
    u.searchParams.set('variant', v.id);
    this.load(u.pathname + u.search);
  },
};
})();
