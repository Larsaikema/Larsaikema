/* Content pages: FAQ search + topic navigation (faq section, layout 'help'), article table of contents, share link,
   print page filter + form topic links (page-bedrukken). Loaded by sections/faq.liquid (help layout),
   sections/main-article.liquid and sections/page-bedrukken.liquid. Vanilla, no dependencies. */
(() => {
  const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = (s) => norm(s).replace(/[^a-z0-9ø]+/g, ' ').split(' ').filter(Boolean);
  const hashId = () => {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      return '';
    }
  };
  const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  /* Scrollspy: aria-current on the link of the last target whose top passed 30% of the viewport. A target that was just
     navigated to (#hash, top near the top of the viewport) wins over a short next section; at the end of the page the
     hash target, else the last visible target, is current. Before the first target is reached nothing is current,
     unless opts.first (then the first target counts as soon as it is in view). */
  const spy = (links, targets, opts = {}) => {
    if (!links.length || !targets.length) return;
    let raf = 0;
    let last = null;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const line = vh * 0.3;
      /* a target scrolled to by its link stops at its scroll-margin-top (below the sticky header): that counts as reached */
      const reach = (t) => Math.max(line, (parseFloat(getComputedStyle(t).scrollMarginTop) || 0) + 8);
      const shown = targets.filter((t) => t.getClientRects().length);
      let cur = null;
      for (const t of shown) {
        if (t.getBoundingClientRect().top <= reach(t)) cur = t;
        else break;
      }
      if (!cur && opts.first && shown[0] && shown[0].getBoundingClientRect().top < vh * 0.85) cur = shown[0];
      const doc = document.scrollingElement || document.documentElement;
      const atEnd = window.scrollY > 0 && Math.ceil(window.scrollY + vh) >= doc.scrollHeight - 2;
      const id = hashId();
      const h = id ? shown.find((t) => t.id === id) : null;
      const hTop = h ? h.getBoundingClientRect().top : 0;
      if (h && hTop > -8 && (hTop <= reach(h) || (atEnd && hTop < vh * 0.85))) cur = h;
      else if (atEnd) {
        for (const t of shown) if (t.getBoundingClientRect().top < vh * 0.85) cur = t;
      }
      const curId = cur ? cur.id : '';
      links.forEach((a) => a.setAttribute('aria-current', String(!!curId && hashOf(a) === curId)));
      if (curId !== last) {
        last = curId;
        if (opts.onChange) opts.onChange(curId);
      }
    };
    const hashOf = (a) => {
      try {
        return decodeURIComponent(a.hash.slice(1));
      } catch (e) {
        return '';
      }
    };
    const queue = () => raf || (raf = requestAnimationFrame(update));
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('hashchange', queue);
    update();
  };

  /* a #question link opens that question */
  const openTarget = (root) => {
    const id = hashId();
    const el = id && document.getElementById(id);
    if (!el || !root.contains(el) || el.tagName !== 'DETAILS') return;
    el.open = true;
    el.classList.add('is-target');
    setTimeout(() => el.classList.remove('is-target'), 1700);
  };

  /* query word matches when it, or its stem without a Dutch suffix (-en, -ing, -e, -s), is in the index */
  const stems = (w) => {
    const out = [w];
    for (const suf of ['en', 'ing', 'e', 's']) {
      if (w.endsWith(suf) && w.length - suf.length >= 4) out.push(w.slice(0, -suf.length));
    }
    return out;
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
        /* index: question, answer, the topic title and the hidden search words of each question */
        this.index = this.items.map((d) => {
          const g = d.closest('[data-faq-group]');
          const title = g && g.querySelector('.faq-help__group-title');
          return ' ' + words([d.textContent, title ? title.textContent : '', d.dataset.faqKeywords || ''].join(' ')).join(' ') + ' ';
        });
        this.initial = this.status ? this.status.textContent : '';
        if (this.input) {
          this.input.addEventListener('input', () => this.filter());
          this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.input.value) {
              this.input.value = '';
              this.filter();
            }
          });
        }
        this.addEventListener('click', (e) => {
          if (e.target.closest('[data-faq-nav]') && this.input && this.input.value) {
            this.input.value = '';
            this.filter();
          }
        });
        const chips = this.querySelector('.faq-help__chips');
        const navLinks = [...this.querySelectorAll('.faq-help__nav a, .faq-help__chips a')];
        spy(navLinks, this.groups.filter((g) => g.id), {
          first: true,
          onChange: (id) => {
            if (!chips || chips.scrollWidth <= chips.clientWidth) return;
            const chip = id && chips.querySelector('a[href="#' + CSS.escape(id) + '"]');
            if (!chip) return;
            const left = chip.offsetLeft - chips.offsetLeft;
            if (left < chips.scrollLeft || left + chip.offsetWidth > chips.scrollLeft + chips.clientWidth) {
              chips.scrollTo({ left: Math.max(0, left - 16), behavior: smooth() });
            }
          },
        });
        openTarget(this);
        window.addEventListener('hashchange', () => openTarget(this));
      }

      filter() {
        const q = words(this.input.value);
        let n = 0;
        this.items.forEach((d, i) => {
          const hit = !q.length || q.every((w) => stems(w).some((s) => this.index[i].includes(s)));
          d.toggleAttribute('data-faq-hidden', !hit);
          if (hit) n++;
        });
        this.groups.forEach((g) => g.toggleAttribute('data-faq-hidden', !g.querySelector('[data-faq-item]:not([data-faq-hidden])')));
        if (this.empty) this.empty.hidden = n > 0;
        if (!this.status) return;
        if (!q.length) this.status.textContent = this.initial;
        else this.status.textContent = n === 1 ? this.dataset.resultsOne : (this.dataset.resultsOther || '').replace('7777', String(n));
      }
    }
  );

  define(
    'article-toc',
    class extends HTMLElement {
      connectedCallback() {
        const links = [...this.querySelectorAll('a[href^="#"]')];
        const targets = links
          .map((a) => {
            try {
              return document.getElementById(decodeURIComponent(a.hash.slice(1)));
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
        spy(links, targets);
        this.addEventListener('click', (e) => {
          const d = e.target.closest('a') && this.querySelector('details[open]');
          if (d) d.open = false;
        });
      }
    }
  );

  /* print page: filter the printable products by group (chips appear only with JS) */
  define(
    'print-filter',
    class extends HTMLElement {
      connectedCallback() {
        const bar = this.querySelector('[data-print-filter-bar]');
        if (!bar) return;
        bar.hidden = false;
        this.buttons = [...bar.querySelectorAll('[data-print-filter]')];
        this.status = bar.querySelector('[data-print-filter-status]');
        this.items = [...this.querySelectorAll('[data-print-group]')];
        bar.addEventListener('click', (e) => {
          const b = e.target.closest('[data-print-filter]');
          if (b) this.apply(b);
        });
      }

      apply(btn) {
        const g = btn.dataset.printFilter;
        this.buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        let n = 0;
        this.items.forEach((li) => {
          const hit = !g || li.dataset.printGroup === g;
          li.hidden = !hit;
          if (hit) n++;
        });
        if (this.status) this.status.textContent = (n === 1 ? this.dataset.shownOne : this.dataset.shownOther || '').replace('7777', String(n));
      }
    }
  );

  document.addEventListener('click', async (e) => {
    /* print page: a link that asks for something (the full colour template) picks that topic in the form */
    const topic = e.target.closest('[data-print-topic]');
    if (topic) {
      const sel = document.querySelector('[data-print-topic-select]');
      const opt = sel && [...sel.options].find((o) => o.value === topic.dataset.printTopic);
      if (!opt) return;
      e.preventDefault();
      sel.value = opt.value;
      sel.scrollIntoView({ block: 'center', behavior: smooth() });
      sel.focus({ preventScroll: true });
      return;
    }

    /* share: native share sheet on touch devices, else copy the link */
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
