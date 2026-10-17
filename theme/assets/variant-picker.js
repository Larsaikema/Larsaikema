/* Variant picker + product-info coordinator: picks the variant, updates URL / form id, and refreshes price,
   stock, delivery, staffel and sticky bar through the Section Rendering API. */
(() => {
  const KK = window.KK;
  customElements.get('variant-picker') ||
    customElements.define(
      'variant-picker',
      class extends HTMLElement {
        connectedCallback() {
          this.variants = JSON.parse(this.querySelector('script[data-variants]').textContent);
          this.addEventListener('change', (e) => e.target.matches('.vp__input') && this.onChange(e.target));
        }
        selected() {
          return [...this.querySelectorAll('fieldset[data-option-index]')].map((fs) => fs.querySelector('input:checked')?.value);
        }
        onChange(input) {
          const idx = Number(input.closest('fieldset').dataset.optionIndex);
          const opts = this.selected();
          let v = this.variants.find((x) => x.options.every((o, i) => o === opts[i]));
          if (!v) {
            v = this.variants.find((x) => x.available && x.options[idx] === opts[idx]) || this.variants.find((x) => x.options[idx] === opts[idx]);
            if (!v) return;
            v.options.forEach((o, i) => {
              const r = [...this.querySelectorAll(`fieldset[data-option-index="${i}"] input`)].find((el) => el.value === o);
              if (r) r.checked = true;
            });
          }
          this.querySelectorAll('fieldset[data-option-index]').forEach((fs) => {
            const out = fs.querySelector('[data-selected-value]');
            const checked = fs.querySelector('input:checked');
            if (out && checked) out.textContent = checked.value;
          });
          this.syncSiblings(v);
          this.closest('product-info')?.setVariant(v);
        }
        /* sibling sizes (custom.andere_maten): point each size link at the variant with the same colour/uitvoering */
        syncSiblings(v) {
          const links = this.querySelectorAll('[data-sibling]');
          if (!links.length) return;
          const names = JSON.parse(this.dataset.keyNames || '[]');
          const key = names.map((n, i) => (n === null ? '' : `${n}=${v.options[i]}|`)).join('');
          links.forEach((a) => {
            const hit = JSON.parse(a.dataset.siblingVariants || '{}')[key];
            a.href = hit ? `${a.dataset.url}?variant=${hit[0]}` : a.dataset.url;
            const off = !!hit && !hit[1];
            a.classList.toggle('is-unavailable', off);
            a.querySelector('[data-unavailable-text]')?.toggleAttribute('hidden', !off);
          });
        }
      }
    );

  customElements.get('product-info') ||
    customElements.define(
      'product-info',
      class extends HTMLElement {
        connectedCallback() {
          this.sectionId = this.dataset.sectionId;
          this.url = this.dataset.productUrl;
          this.cache = new Map();
          if (location.hash) {
            const d = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (d && d.tagName === 'DETAILS') d.open = true;
          }
          // in-page links to an accordion (Zakelijk nudge -> #ProductQuote) open it and move focus to its summary
          this.addEventListener('click', (e) => {
            const a = e.target.closest('a[data-open-details]');
            const d = a && document.getElementById(a.hash.slice(1));
            if (!d || d.tagName !== 'DETAILS') return;
            e.preventDefault();
            d.open = true;
            d.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            d.querySelector('summary')?.focus({ preventScroll: true });
          });
        }
        async setVariant(v) {
          this.variant = v;
          const form = document.getElementById(this.dataset.formId);
          const idInput = form?.querySelector('[name="id"]');
          if (idInput) idInput.value = v.id;
          const u = new URL(location.href);
          u.searchParams.set('variant', v.id);
          history.replaceState(history.state, '', u);
          if (v.media_id) this.querySelector('media-gallery')?.goToMedia(v.media_id);
          const label = v.options.join(' / ');
          this.querySelectorAll('[data-quote-variant]').forEach((i) => (i.value = label));
          this.querySelectorAll('[data-quote-variant-text]').forEach((t) => (t.textContent = label));
          // print fields only for variants with print (feature product.print-option-reveal)
          const print = this.querySelector('[data-print]');
          if (print) {
            const on = !!v.print;
            print.hidden = !on;
            print.disabled = !on;
          }
          KK.emit('variant:change', { variant: v, root: this });
          const fetchUrl = `${this.url}?variant=${v.id}&section_id=${this.sectionId}`;
          try {
            let html = this.cache.get(fetchUrl);
            if (!html) {
              html = await (await fetch(fetchUrl)).text();
              this.cache.set(fetchUrl, html);
            }
            if (this.variant !== v) return;
            const doc = KK.parse(html);
            ['price', 'badge-sale', 'staffel', 'delivery', 'bundle', 'sticky-price', 'sticky-variant', 'sku', 'notify'].forEach((key) => {
              const fresh = doc.querySelector(`[data-dynamic="${key}"]`);
              this.querySelectorAll(`[data-dynamic="${key}"]`).forEach((el) => fresh && el.replaceWith(fresh.cloneNode(true)));
            });
            // option availability (strike-through) relative to the new selection
            doc.querySelectorAll('.vp__input').forEach((fi) => {
              const input = document.getElementById(fi.id);
              if (!input) return;
              input.toggleAttribute('data-unavailable', fi.hasAttribute('data-unavailable'));
              const label = this.querySelector(`label[for="${CSS.escape(fi.id)}"]`);
              const freshLabel = doc.querySelector(`label[for="${CSS.escape(fi.id)}"]`);
              if (label && freshLabel) {
                label.className = freshLabel.className;
                label.innerHTML = freshLabel.innerHTML;
              }
            });
            const freshBtn = doc.querySelector('[data-add-button]');
            KK.emit('variant:rendered', { variant: v, root: this, button: freshBtn, doc });
          } catch (e) {
            /* keep the client-side state; a reload shows the server state */
          }
        }
      }
    );
})();
