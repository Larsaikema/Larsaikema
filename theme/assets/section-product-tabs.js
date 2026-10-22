/* Producten per categorie: WAI-ARIA tabs (click, Arrow keys, Home, End); panels are server-rendered and stack without JS.
   Also the card behaviours collection pages get from facets.js (not loaded here): swatch hover preview, quick add
   (quick-add.js on first use), and the expected window on the shared lead line ('verwacht in huis 3 – 10 nov'). */
(() => {
const KK = window.KK || {};
const SRC = document.currentScript?.src || '';

// the lead line: the window the product page shows for the same wait, counted by delivery-countdown.js (same rule as
// facets.js). A wait that counts from something else ('na akkoord drukproef') or has no number keeps its text.
const leadDates = (root) => {
  if (!KK.delivery) return;
  root.querySelectorAll('[data-lead-eta]').forEach((el) => {
    const out = el.querySelector('[data-lead-eta-out]');
    const m = !/\bna\b/i.test(el.dataset.lead) && el.dataset.lead.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(werkdag|dag|week|weken)/i);
    if (!out || !m || !out.hidden) return;
    const u = m[3].toLowerCase();
    const f = u[0] === 'd' ? 5 / 7 : u.startsWith('werk') ? 1 : 5;
    const r = KK.delivery.compute(el);
    const fmt = (t) => r.etaAt(t).toLocaleDateString(document.documentElement.lang || 'nl', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '').split(' ');
    const a = fmt(Math.round(m[1] * f) + r.transit);
    const b = fmt(Math.round((m[2] || m[1]) * f) + Math.max(r.transit, +el.dataset.transitMax || 0));
    out.innerHTML = el.dataset.tpl.replace('__FROM__', a[1] === b[1] ? a[0] : a.join(' ')).replace('__TO__', b.join(' '));
    out.hidden = false;
  });
};

if (!customElements.get('product-tabs')) {
  customElements.define(
    'product-tabs',
    class extends HTMLElement {
      connectedCallback() {
        this.tabs = [...this.querySelectorAll('[role="tab"]')];
        // server-side every panel is visible (no-JS); from here the tabs decide
        this.tabs.forEach((tab) => {
          const panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) {
            panel.hidden = tab.getAttribute('aria-selected') !== 'true';
            panel.classList.remove('ptabs__panel--rest');
          }
        });
        this.tabs.forEach((tab, i) => {
          tab.addEventListener('click', () => this.select(i));
          tab.addEventListener('keydown', (e) => {
            const last = this.tabs.length - 1;
            const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
            if (next === undefined) return;
            e.preventDefault();
            this.select(next, true);
          });
        });
        // theme editor: picking a tab block in the sidebar shows that tab
        if (window.Shopify?.designMode) {
          document.addEventListener('shopify:block:select', (e) => {
            const i = this.tabs.findIndex((t) => t.id === `Tab-${e.detail.sectionId}-${e.detail.blockId}`);
            if (i >= 0) this.select(i);
          });
        }
        const dates = () => leadDates(this);
        if (KK.delivery) dates();
        else window.addEventListener('DOMContentLoaded', dates, { once: true });
      }
      select(index, focus) {
        this.tabs.forEach((tab, i) => {
          const on = i === index;
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
          tab.classList.toggle('chip--active', on);
          if (on) tab.removeAttribute('tabindex');
          else tab.setAttribute('tabindex', '-1');
          const panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        const tab = this.tabs[index];
        if (focus) tab.focus();
        const bar = tab.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth) {
          bar.scrollTo({ left: tab.offsetLeft - bar.offsetLeft - 16, behavior: 'smooth' });
        }
      }
    }
  );
}

// card behaviours, only where facets.js (which has the same ones) is not on the page
if (KK.cardActions || document.querySelector('script[src*="/facets"]')) return;
KK.cardActions = true;

// swatch hover shows that colour's render
const preview = (sw, on) => {
  const card = sw.closest('[data-card]');
  const img = card?.querySelector('.card__img');
  if (!img) return;
  if (!img.dataset.srcsetOrig) img.dataset.srcsetOrig = img.getAttribute('srcset') || '';
  card.querySelectorAll('.card__swatch.is-active').forEach((x) => x.classList.remove('is-active'));
  const show = on && sw.dataset.srcset;
  img.setAttribute('srcset', show ? sw.dataset.srcset : img.dataset.srcsetOrig);
  sw.classList.toggle('is-active', !!show);
  img.closest('.card__media')?.classList.toggle('is-previewing', !!show);
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

// quick add: quick-add.js loads on the first hover, focus or tap of a card action
let qa;
const loadQA = () =>
  (qa ||= new Promise((ok, fail) => {
    if (KK.quickAdd) return ok(KK.quickAdd);
    const s = document.createElement('script');
    s.src = document.querySelector('[data-qa-src]')?.dataset.qaSrc || SRC.replace(/section-product-tabs\.js/, 'quick-add.js');
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
