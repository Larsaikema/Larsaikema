/* Predictive search: /search/suggest?section_id=predictive-search (Section Rendering API), keyboard navigable combobox. */
(() => {
  const KK = window.KK;
  customElements.get('predictive-search') ||
    customElements.define(
      'predictive-search',
      class extends HTMLElement {
        connectedCallback() {
          this.input = this.querySelector('input[type="search"]');
          this.results = this.querySelector('[data-predictive-results]');
          this.status = this.querySelector('[data-predictive-status]');
          this.clear = this.querySelector('[data-search-clear]');
          this.cache = new Map();
          this.enabled = this.dataset.enabled !== 'false' && this.results;
          this.input.addEventListener('input', KK.debounce(() => this.onInput(), 220));
          this.input.addEventListener('input', () => this.clear && (this.clear.hidden = !this.input.value));
          this.input.addEventListener('focus', () => this.input.value.trim() && this.results?.innerHTML && this.open());
          this.input.addEventListener('keydown', (e) => this.onKey(e));
          this.clear?.addEventListener('click', () => {
            this.input.value = '';
            this.clear.hidden = true;
            this.close();
            this.input.focus();
          });
          document.addEventListener('click', (e) => !this.contains(e.target) && this.close());
          this.addEventListener('focusout', (e) => !this.contains(e.relatedTarget) && setTimeout(() => !this.contains(document.activeElement) && this.close(), 0));
        }
        get term() {
          return this.input.value.trim();
        }
        async onInput() {
          if (!this.enabled) return;
          const q = this.term;
          if (!q) return this.close();
          const url = `${KK.routes.predictiveSearch}?q=${encodeURIComponent(q)}&section_id=predictive-search&resources[type]=product,collection,page,article,query&resources[limit]=${this.dataset.limit || 6}&resources[limit_scope]=each&resources[options][unavailable_products]=last`;
          try {
            this.abort?.abort();
            this.abort = new AbortController();
            let html = this.cache.get(url);
            if (!html) {
              const r = await fetch(url, { signal: this.abort.signal });
              if (!r.ok) throw new Error(r.status);
              html = await r.text();
              this.cache.set(url, html);
            }
            if (q !== this.term) return;
            const doc = KK.parse(html);
            const inner = doc.querySelector('[data-predictive-inner]');
            this.results.innerHTML = inner ? inner.outerHTML : '';
            if (this.status) this.status.textContent = inner?.dataset.status || '';
            this.open();
          } catch (e) {
            if (e.name !== 'AbortError') this.close();
          }
        }
        open() {
          const top = this.getBoundingClientRect().bottom + 8;
          this.style.setProperty('--predictive-top', `${top}px`);
          this.results.hidden = false;
          this.input.setAttribute('aria-expanded', 'true');
        }
        close() {
          if (!this.results) return;
          this.results.hidden = true;
          this.input.setAttribute('aria-expanded', 'false');
          this.input.removeAttribute('aria-activedescendant');
        }
        onKey(e) {
          if (e.key === 'Escape') {
            this.close();
            return;
          }
          if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key) || this.results.hidden) return;
          const items = [...this.results.querySelectorAll('[role="option"]')];
          if (!items.length) return;
          let i = items.findIndex((el) => el.getAttribute('aria-selected') === 'true');
          if (e.key === 'Enter') {
            if (i >= 0) {
              e.preventDefault();
              items[i].click();
            }
            return;
          }
          e.preventDefault();
          if (i >= 0) items[i].setAttribute('aria-selected', 'false');
          i = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
          items[i].setAttribute('aria-selected', 'true');
          items[i].scrollIntoView({ block: 'nearest' });
          this.input.setAttribute('aria-activedescendant', items[i].id);
        }
      }
    );
})();
