/* Main product form: AJAX add to cart (/cart/add.js) incl. add-ons (items[]) and logo upload (FormData),
   live total on the button, staffel hint, print validation (only for variants with print) and the sticky
   mobile buy bar. Configurator products are validated by <product-configurator> first. */
(() => {
  const KK = window.KK;
  const MAX_MB = 20;

  customElements.get('product-form') ||
    customElements.define(
      'product-form',
      class extends HTMLElement {
        connectedCallback() {
          this.form = document.getElementById(this.dataset.formId);
          this.root = this.closest('product-info') || document;
          this.button = this.querySelector('[data-add-button]');
          this.error = this.querySelector('[data-form-error]');
          this.qty = this.querySelector('input[name="quantity"]');
          this.form.addEventListener('submit', (e) => this.onSubmit(e));
          this.root.addEventListener('change', (e) => {
            if (e.target === this.qty || e.target.matches('[data-addon]')) this.refresh();
            if (e.target.matches('.print__file')) this.onFile(e.target);
            if (e.target.matches('[data-print-later]')) this.onLater(e.target);
          });
          this.unsubs = [
            KK.on('variant:change', ({ variant, root }) => {
              if (root !== this.root) return;
              this.button.dataset.price = variant.price;
              this.setAvailable(variant);
              this.refresh();
            }),
            KK.on('variant:rendered', ({ root, button }) => {
              if (root !== this.root) return;
              if (button) this.button.dataset.preorder = button.dataset.preorder;
              this.refresh();
            }),
            KK.on('vat:change', () => this.refresh()),
          ];
          this.initSticky();
          this.refresh();
        }
        disconnectedCallback() {
          this.unsubs?.forEach((u) => u());
          removeEventListener('scroll', this.onScroll);
        }
        get quantity() {
          return Math.max(1, Number(this.qty?.value) || 1);
        }
        addons() {
          return [...this.root.querySelectorAll('[data-addon]:checked')];
        }
        setAvailable(v) {
          const label = this.button.querySelector('[data-add-label]');
          this.button.disabled = !v.available;
          this.button.dataset.state = v.available ? 'available' : 'soldout';
          if (label && !v.available) label.textContent = KK.strings.soldOut;
          const sticky = this.root.querySelector('[data-sticky-add]');
          if (sticky) sticky.disabled = !v.available;
          // no quantity stepper next to a sold-out button
          this.querySelector('[data-buy-qty]')?.toggleAttribute('hidden', !v.available);
        }
        /** live total on the button + staffel hint */
        refresh() {
          const label = this.button.querySelector('[data-add-label]');
          const unit = Number(this.button.dataset.price || 0);
          const q = this.quantity;
          const excl = document.documentElement.dataset.vat === 'excl';
          const addons = this.addons().reduce((n, a) => n + Number(a.dataset.price || 0), 0);
          const total = unit * q + addons;
          const shown = KK.vatShown(total, excl);
          if (label && !this.button.disabled && this.button.dataset.state !== 'busy') {
            label.innerHTML = `${this.button.dataset.preorder === 'true' ? KK.strings.preOrder : KK.strings.addToCart} <span class="btn__sep" aria-hidden="true">·</span> <span class="btn__total">${KK.formatMoney(shown)}${excl ? ` <small>${KK.strings.excl || 'excl. btw'}</small>` : ''}</span>`;
          }
          const staffel = this.root.querySelector('[data-staffel]');
          if (!staffel) return;
          let tiers = [];
          try {
            tiers = JSON.parse(staffel.dataset.staffel).sort((a, b) => a.vanaf - b.vanaf);
          } catch (e) {}
          const active = tiers.filter((t) => q >= t.vanaf).pop();
          const next = tiers.find((t) => q < t.vanaf);
          staffel.querySelectorAll('tr[data-tier-min]').forEach((tr) => tr.classList.remove('is-active'));
          const rows = [...staffel.querySelectorAll('tr[data-tier-min]')].filter((tr) => q >= Number(tr.dataset.tierMin));
          rows.pop()?.classList.add('is-active');
          const hint = staffel.querySelector('[data-staffel-hint]');
          if (!hint) return;
          const parts = [];
          if (active) {
            const per = Math.round(unit * (1 - active.korting / 100));
            parts.push(KK.t('staffelHint', { qty: q, price: KK.formatMoney(KK.vatShown(per, excl)) }));
          }
          if (next) parts.push(KK.t('staffelNext', { qty: next.vanaf - q, discount: next.korting }));
          hint.innerHTML = parts.join(' · ');
          hint.hidden = !parts.length;
        }
        onFile(input) {
          const f = input.files?.[0];
          const name = this.root.querySelector('[data-file-name]');
          this.clearPrintError();
          if (!f) return;
          if (f.size > MAX_MB * 1024 * 1024) {
            input.value = '';
            return this.printError(KK.strings.fileTooBig);
          }
          if (name) name.textContent = f.name;
          input.closest('.field')?.classList.add('has-file');
          const later = this.root.querySelector('[data-print-later]');
          if (later) later.checked = false;
        }
        /** 'Ik lever mijn logo later aan': the upload field steps aside, the line gets Logo: Lever ik later aan */
        onLater(box) {
          this.clearPrintError();
          const file = this.root.querySelector('.print__file');
          if (!file) return;
          file.disabled = box.checked;
          file.closest('.field')?.classList.toggle('is-disabled', box.checked);
          if (box.checked && file.value) {
            file.value = '';
            file.closest('.field')?.classList.remove('has-file');
            const name = this.root.querySelector('[data-file-name]');
            if (name) name.textContent = KK.strings.printChoose || '';
          }
        }
        printError(msg) {
          const box = this.root.querySelector('[data-print-error]');
          if (box) {
            box.textContent = msg;
            box.hidden = false;
            box.closest('.print')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        clearPrintError() {
          const box = this.root.querySelector('[data-print-error]');
          if (box) box.hidden = true;
        }
        async onSubmit(e) {
          e.preventDefault();
          if (this.button.disabled || this.button.dataset.state === 'busy') return;
          this.error.hidden = true;
          const cfg = this.root.querySelector('product-configurator');
          if (cfg && cfg.validateAll && !cfg.validateAll()) return;
          const fd = new FormData(this.form);
          // properties[Logo] is either the uploaded file or the 'later aanleveren' value (the print fieldset is
          // disabled for variants without print, so then neither is in the form data)
          const logo = fd.getAll('properties[Logo]');
          const file = logo.find((x) => x instanceof File && x.size > 0);
          const later = logo.find((x) => typeof x === 'string' && x !== '');
          fd.delete('properties[Logo]');
          if (file) fd.append('properties[Logo]', file);
          else if (later) fd.append('properties[Logo]', later);
          const hasFile = !!file;
          [...fd.keys()].forEach((k) => k.startsWith('properties[') && fd.get(k) === '' && fd.delete(k));
          const print = this.root.querySelector('[data-print]');
          if (print && !print.disabled && !print.hidden && !hasFile && !later) {
            return this.printError(print.dataset.required || KK.strings.printRequired);
          }
          const addonItems = this.addons().map((a) => ({ id: Number(a.value), quantity: 1 }));
          this.busy(true);
          try {
            if (hasFile) {
              await KK.cart.add(fd);
              if (addonItems.length) await KK.cart.add({ items: addonItems });
            } else {
              const properties = {};
              for (const [k, v] of fd) {
                const m = k.match(/^properties\[(.+)\]$/);
                if (m && v !== '') properties[m[1]] = v;
              }
              const main = { id: Number(fd.get('id')), quantity: Number(fd.get('quantity') || 1) };
              if (Object.keys(properties).length) main.properties = properties;
              await KK.cart.add({ items: [main, ...addonItems] });
            }
            this.done();
            KK.cart.afterAdd(this.root.querySelector('.product__title')?.textContent?.trim());
          } catch (err) {
            this.error.textContent = err.message || KK.strings.addError;
            this.error.hidden = false;
            this.busy(false);
          }
        }
        busy(on) {
          const label = this.button.querySelector('[data-add-label]');
          this.button.dataset.state = on ? 'busy' : 'available';
          // busy keeps the fill (tokens: button-primary.busy.fill = ongewijzigd); aria-busy, not aria-disabled
          this.button.setAttribute('aria-busy', String(on));
          if (on && label) label.textContent = KK.strings.adding;
          if (!on) this.refresh();
        }
        done() {
          const label = this.button.querySelector('[data-add-label]');
          this.button.classList.add('is-added');
          if (label) label.textContent = KK.strings.added;
          setTimeout(() => {
            this.button.classList.remove('is-added');
            this.busy(false);
          }, 1500);
        }
        initSticky() {
          const bar = this.root.querySelector('[data-sticky-buy]');
          if (!bar) return;
          const btn = bar.querySelector('[data-sticky-add]');
          let ticking = false;
          const update = () => {
            ticking = false;
            // visible whenever the main button is off screen (above after scrolling past it, or still below the
            // fold on a phone), so price + add to cart are always one tap away
            const r = this.button.getBoundingClientRect();
            const show = r.bottom < 0 || (r.top > innerHeight && innerWidth < 990);
            if (show === bar.classList.contains('is-visible')) return;
            bar.classList.toggle('is-visible', show);
            bar.setAttribute('aria-hidden', String(!show));
            btn?.setAttribute('tabindex', show ? '0' : '-1');
          };
          this.onScroll = () => {
            if (!ticking) {
              ticking = true;
              requestAnimationFrame(update);
            }
          };
          addEventListener('scroll', this.onScroll, { passive: true });
          update();
        }
      }
    );
})();
