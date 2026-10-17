/* Made-to-measure configurator (product metafield custom.configurator; features product.configurator-maatwerk and
   product.configurator-stretch). Numeric fields -> area (or length), billed as whole units with a minimum. The
   variant price is the price per unit (e.g. per m²); the billed units become the line quantity, the measured size
   goes along as line-item properties (Afmeting, Oppervlakte) so the order shows exactly what to make. */
(() => {
  const KK = window.KK;
  const nf = (n, max = 2) => Number(n).toLocaleString(document.documentElement.lang || 'nl', { minimumFractionDigits: 0, maximumFractionDigits: max });
  const num = (el) => parseFloat(String(el.value).replace(',', '.'));

  customElements.get('product-configurator') ||
    customElements.define(
      'product-configurator',
      class extends HTMLElement {
        connectedCallback() {
          this.root = this.closest('product-info') || document;
          this.form = document.getElementById(this.dataset.formId);
          this.fields = [...this.querySelectorAll('[data-config-field]')];
          this.unit = this.dataset.unit || 'm²';
          this.min = Number(this.dataset.min) || 0;
          this.mode = this.dataset.mode || 'oppervlakte';
          this.addEventListener('input', (e) => e.target.matches('[data-config-field]') && this.update());
          this.addEventListener('change', (e) => {
            if (e.target.matches('[data-config-field]')) this.validate(e.target, true);
            this.update();
          });
          this.unsubs = [
            KK.on('variant:change', ({ root }) => root === this.root && requestAnimationFrame(() => this.update())),
            KK.on('vat:change', () => this.update()),
          ];
          this.update();
        }
        disconnectedCallback() {
          this.unsubs?.forEach((u) => u());
        }
        validate(field, show) {
          const v = num(field);
          const ok = Number.isFinite(v) && v >= Number(field.min) && v <= Number(field.max);
          const err = this.querySelector(`#${CSS.escape(field.getAttribute('aria-describedby') || '')}`);
          if (show || ok) {
            field.setAttribute('aria-invalid', String(!ok));
            if (err) err.hidden = ok;
          }
          return ok;
        }
        validateAll() {
          const bad = this.fields.filter((f) => !this.validate(f, true));
          if (bad.length) bad[0].focus();
          return !bad.length;
        }
        unitPrice() {
          const btn = this.root.querySelector('[data-add-button]');
          return Number(btn?.dataset.price || 0);
        }
        update() {
          const values = this.fields.map(num);
          const valid = values.every((v, i) => Number.isFinite(v) && v >= Number(this.fields[i].min) && v <= Number(this.fields[i].max));
          const excl = document.documentElement.dataset.vat === 'excl';
          const money = (c) => KK.formatMoney(KK.vatShown(c, excl));
          const unitEl = this.querySelector('[data-config-unit-price]');
          if (unitEl) unitEl.textContent = money(this.unitPrice());
          const areaEl = this.querySelector('[data-config-area]');
          const totalEl = this.querySelector('[data-config-total]');
          if (!valid) {
            if (areaEl) areaEl.textContent = '–';
            if (totalEl) totalEl.textContent = '–';
            return;
          }
          const area = this.mode === 'lengte' ? values[0] : values.reduce((a, b) => a * b, 1);
          const billed = Math.max(this.min, Math.ceil(area - 1e-9));
          const units = this.fields.map((f) => f.dataset.unit || '');
          const same = units.every((u) => u === units[0]);
          const size = same
            ? `${values.map((v) => nf(v)).join(' × ')} ${units[0]}`.trim()
            : values.map((v, i) => `${nf(v)} ${units[i]}`.trim()).join(' × ');
          const setProp = (sel, val) => {
            const el = this.querySelector(sel);
            if (el) el.value = val;
          };
          setProp('[data-config-size-prop]', size);
          setProp('[data-config-area-prop]', `${nf(area)} ${this.unit}`);
          if (areaEl) {
            areaEl.textContent = `${nf(area)} ${this.unit}`;
            if (billed !== area) areaEl.textContent += ` · ${KK.t('configBilled', { qty: nf(billed, 0), unit: this.unit })}`;
          }
          if (totalEl) totalEl.textContent = money(this.unitPrice() * billed);
          const qty = this.form?.querySelector('[data-config-qty]');
          if (qty && Number(qty.value) !== billed) {
            qty.value = billed;
            qty.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    );
})();
