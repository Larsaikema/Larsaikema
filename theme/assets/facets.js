/* Storefront filtering + sorting (collection & search): live updates via the Section Rendering API,
   sidebar on desktop, drawer on mobile, history support. */
(() => {
  const KK = window.KK;
  const mq = matchMedia('(max-width: 989px)');
  customElements.get('facet-filters') ||
    customElements.define(
      'facet-filters',
      class extends HTMLElement {
        connectedCallback() {
          this.sectionId = this.dataset.sectionId;
          this.cache = new Map();
          this.onChange = KK.debounce(() => this.submit(), 450);
          this.addEventListener('change', (e) => {
            if (e.target.closest('[data-facets-form]') || e.target.matches('[data-sort]')) {
              e.target.type === 'number' ? this.onChange() : this.submit();
            }
          });
          this.addEventListener('submit', (e) => {
            if (!e.target.matches('[data-facets-form]')) return;
            e.preventDefault();
            this.submit();
          });
          this.addEventListener('click', (e) => {
            const link = e.target.closest('[data-facet-link]');
            if (link) {
              e.preventDefault();
              return this.render(new URL(link.href, location.origin).searchParams.toString());
            }
            if (e.target.closest('[data-facets-open]')) return this.open();
            if (e.target.closest('[data-facets-close]')) return this.close();
            const more = e.target.closest('[data-facet-more]');
            if (more) {
              more.closest('.facet__body').classList.add('is-expanded');
              more.remove();
            }
          });
          this.addEventListener('keydown', (e) => e.key === 'Escape' && this.classList.contains('is-drawer-open') && this.close());
          addEventListener('popstate', (e) => this.render(location.search.slice(1), false));
        }
        get form() {
          return this.querySelector('[data-facets-form]');
        }
        params() {
          const fd = new FormData(this.form);
          const sort = this.querySelector('[data-sort]');
          if (sort) fd.set('sort_by', sort.value);
          const p = new URLSearchParams();
          for (const [k, v] of fd) if (v !== '') p.append(k, v);
          return p.toString();
        }
        submit() {
          this.render(this.params());
        }
        async render(query, push = true) {
          const url = `${location.pathname}?${query}`;
          const fetchUrl = `${location.pathname}?${query}${query ? '&' : ''}section_id=${this.sectionId}`;
          this.setAttribute('aria-busy', 'true');
          this.classList.add('is-loading');
          try {
            let html = this.cache.get(fetchUrl);
            if (!html) {
              const r = await fetch(fetchUrl);
              html = await r.text();
              this.cache.set(fetchUrl, html);
            }
            const doc = KK.parse(html);
            const fresh = doc.getElementById(this.id);
            if (!fresh) return;
            // keep open/closed state of filter groups and the focused control
            const open = new Set([...this.querySelectorAll('details.facet[open]')].map((d) => d.dataset.param));
            const closed = new Set([...this.querySelectorAll('details.facet:not([open])')].map((d) => d.dataset.param));
            const focusId = document.activeElement && this.contains(document.activeElement) ? document.activeElement.id : null;
            const swap = (sel) => {
              const a = this.querySelector(sel);
              const b = fresh.querySelector(sel);
              if (a && b) a.replaceWith(b);
            };
            swap('[data-results]');
            swap('[data-facets-body]');
            swap('.collection__count');
            swap('[data-show-results]');
            const btn = this.querySelector('[data-facets-open]');
            const freshBtn = fresh.querySelector('[data-facets-open]');
            if (btn && freshBtn) btn.innerHTML = freshBtn.innerHTML;
            this.querySelectorAll('details.facet').forEach((d) => {
              if (open.has(d.dataset.param)) d.open = true;
              else if (closed.has(d.dataset.param)) d.open = false;
            });
            if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
            if (push) history.pushState({ facets: true }, '', url);
            if (!mq.matches) {
              const top = this.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0) - 16;
              if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
            }
          } catch (e) {
            location.href = url;
          } finally {
            this.removeAttribute('aria-busy');
            this.classList.remove('is-loading');
          }
        }
        open() {
          this.classList.add('is-drawer-open');
          document.body.classList.add('is-locked');
          this.querySelector('[data-facets-open]')?.setAttribute('aria-expanded', 'true');
          this.querySelector('.facets-backdrop')?.removeAttribute('hidden');
          const panel = this.querySelector('[data-facets-panel]');
          panel?.setAttribute('role', 'dialog');
          panel?.setAttribute('aria-modal', 'true');
          panel?.focus();
          if (panel) KK.trapFocus(panel);
        }
        close() {
          if (!this.classList.contains('is-drawer-open')) return;
          this.classList.remove('is-drawer-open');
          document.body.classList.remove('is-locked');
          KK.releaseFocus();
          const panel = this.querySelector('[data-facets-panel]');
          panel?.removeAttribute('role');
          panel?.removeAttribute('aria-modal');
          this.querySelector('.facets-backdrop')?.setAttribute('hidden', '');
          const b = this.querySelector('[data-facets-open]');
          b?.setAttribute('aria-expanded', 'false');
          b?.focus();
        }
      }
    );
})();
