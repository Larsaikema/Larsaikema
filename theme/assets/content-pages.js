/* Content pages: FAQ search + topic navigation (faq section, layout 'help'), article table of contents, share link.
   Loaded by sections/faq.liquid (help layout) and sections/main-article.liquid. Vanilla, no dependencies. */
(() => {
  const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* mark the link of the last target that scrolled past 30% of the viewport (aria-current) */
  const spy = (links, targets) => {
    if (!links.length || !targets.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let cur = null;
      for (const t of targets) {
        if (t.offsetParent === null) continue;
        if (!cur || t.getBoundingClientRect().top - line <= 0) cur = t;
        else break;
      }
      links.forEach((a) => a.setAttribute('aria-current', String(!!cur && a.hash === '#' + cur.id)));
    };
    window.addEventListener('scroll', () => raf || (raf = requestAnimationFrame(update)), { passive: true });
    window.addEventListener('resize', () => raf || (raf = requestAnimationFrame(update)), { passive: true });
    update();
  };

  /* a #question link opens that question */
  const openTarget = (root) => {
    let id = '';
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (e) {}
    const el = id && document.getElementById(id);
    if (!el || !root.contains(el) || el.tagName !== 'DETAILS') return;
    el.open = true;
    el.classList.add('is-target');
    setTimeout(() => el.classList.remove('is-target'), 1700);
  };

  define(
    'faq-help',
    class extends HTMLElement {
      connectedCallback() {
        this.input = this.querySelector('[data-faq-search]');
        this.status = this.querySelector('[data-faq-status]');
        this.empty = this.querySelector('[data-faq-empty]');
        this.items = [...this.querySelectorAll('[data-faq-item]')];
        this.groups = [...this.querySelectorAll('[data-faq-group]')];
        this.index = this.items.map((d) => norm(d.textContent));
        this.initial = this.status ? this.status.textContent : '';
        if (this.input) this.input.addEventListener('input', () => this.filter());
        this.addEventListener('click', (e) => {
          if (e.target.closest('[data-faq-nav]') && this.input && this.input.value) {
            this.input.value = '';
            this.filter();
          }
        });
        spy([...this.querySelectorAll('.faq-help__nav a')], this.groups.filter((g) => g.id));
        openTarget(this);
        window.addEventListener('hashchange', () => openTarget(this));
      }

      filter() {
        const words = norm(this.input.value.trim()).split(/\s+/).filter(Boolean);
        let n = 0;
        this.items.forEach((d, i) => {
          const hit = !words.length || words.every((w) => this.index[i].includes(w));
          d.toggleAttribute('data-faq-hidden', !hit);
          if (hit) n++;
        });
        this.groups.forEach((g) => g.toggleAttribute('data-faq-hidden', !g.querySelector('[data-faq-item]:not([data-faq-hidden])')));
        if (this.empty) this.empty.hidden = n > 0;
        if (!this.status) return;
        if (!words.length) this.status.textContent = this.initial;
        else this.status.textContent = n === 1 ? this.dataset.resultsOne : (this.dataset.resultsOther || '').replace('7777', String(n));
      }
    }
  );

  define(
    'article-toc',
    class extends HTMLElement {
      connectedCallback() {
        const links = [...this.querySelectorAll('a[href^="#"]')];
        const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
        spy(links, targets);
        this.addEventListener('click', (e) => {
          const d = e.target.closest('a') && this.querySelector('details[open]');
          if (d) d.open = false;
        });
      }
    }
  );

  /* share: native share sheet on touch devices, else copy the link */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-share-copy]');
    if (!b) return;
    e.preventDefault();
    const url = b.dataset.shareCopy || location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      const label = b.querySelector('[data-label]') || b;
      const old = label.textContent;
      label.textContent = b.dataset.copied || old;
      setTimeout(() => (label.textContent = old), 1800);
    } catch (err) {}
  });
})();
