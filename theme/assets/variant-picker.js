/* Variant picker + product-info coordinator: picks the variant, updates URL / form id, and refreshes price,
   stock, delivery, staffel and sticky bar through the Section Rendering API. */
(() => {
  const KK = window.KK;
  customElements.get('variant-picker') ||
    customElements.define(
      'variant-picker',
      class extends HTMLElement {
        connectedCallback() {
          this.variants = JSON.parse(this.querySelector('[data-variants]').textContent);
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
          this.closest('product-info')?.setVariant(v);
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
            ['price', 'badge-sale', 'staffel', 'delivery', 'sticky-price', 'sticky-variant', 'sku'].forEach((key) => {
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
