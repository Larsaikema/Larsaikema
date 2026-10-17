/* Main product form: AJAX add to cart (/cart/add.js) incl. add-ons (items[]) and logo upload (FormData, several
   files), live total on the button, staffel hint, print validation (only for variants with print) and the sticky
   mobile buy bar. Configurator products are validated by <product-configurator> first.
   All or nothing: without files the product and its add-ons go in one items[] request; with files the multipart line is
   added first and removed again (by line key) when the add-ons cannot be added, so the cart never holds half an order. */
(() => {
  const KK = window.KK;
  const PRINT_EXT = /\.(pdf|ai|eps|svg|png|jpe?g)$/i;
  const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1024))} kB`);

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
          this.files = [];
          this.root.addEventListener('change', (e) => {
            if (e.target === this.qty || e.target.matches('[data-addon]')) this.refresh();
            if (e.target.matches('.print__file')) this.onFiles(e.target, [...(e.target.files || [])]);
            if (e.target.matches('[data-print-later]')) this.onLater(e.target);
          });
          this.root.addEventListener('click', (e) => {
            const rm = e.target.closest('[data-remove-file]');
            if (!rm) return;
            this.files.splice(Number(rm.dataset.removeFile), 1);
            this.renderFiles();
            this.root.querySelector('.print__file')?.focus();
          });
          const drop = this.root.querySelector('[data-print-drop]');
          if (drop) {
            ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => (e.preventDefault(), drop.classList.add('is-over'))));
            ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
            drop.addEventListener('drop', (e) => {
              e.preventDefault();
              const input = this.root.querySelector('.print__file');
              if (input && !input.disabled) this.onFiles(input, [...(e.dataTransfer?.files || [])]);
            });
          }
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
        /** adds chosen/dropped files to the list (type + size checked per file, max count from the block settings) */
        onFiles(input, list) {
          const box = input.closest('[data-print-upload]');
          const maxFiles = Number(box?.dataset.maxFiles || 5);
          const maxMb = Number(box?.dataset.maxMb || 20);
          this.clearPrintError();
          const errors = [];
          list.forEach((f) => {
            if (!PRINT_EXT.test(f.name)) return errors.push(KK.t('fileType', { name: f.name }));
            if (f.size > maxMb * 1048576) return errors.push(KK.t('fileTooBig', { name: f.name, size: maxMb }));
            if (this.files.some((x) => x.name === f.name && x.size === f.size)) return;
            if (this.files.length >= maxFiles) return errors.push(KK.t('fileTooMany', { max: maxFiles }));
            this.files.push(f);
          });
          input.value = '';
          this.renderFiles();
          if (errors.length) this.printError([...new Set(errors)].join(' '), false);
          if (this.files.length) {
            const later = this.root.querySelector('[data-print-later]');
            if (later) later.checked = false;
          }
        }
        renderFiles() {
          const ul = this.root.querySelector('[data-print-files]');
          if (!ul) return;
          ul.innerHTML = this.files
            .map(
              (f, i) =>
                `<li class="print__file-item"><svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h7l4 4v13h-11z M13.5 3.5v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span class="print__file-name">${KK.escape(f.name)}</span><span class="print__file-size">${fmtSize(f.size)}</span><button type="button" class="print__file-remove" data-remove-file="${i}" aria-label="${KK.escape(KK.t('fileRemove', { name: f.name }))}"><svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></li>`
            )
            .join('');
          ul.closest('.field')?.classList.toggle('has-file', !!this.files.length);
        }
        /** 'Ik lever mijn logo later aan': the upload field steps aside, the line gets Logo: Lever ik later aan */
        onLater(box) {
          this.clearPrintError();
          const file = this.root.querySelector('.print__file');
          if (!file) return;
          file.disabled = box.checked;
          file.closest('.field')?.classList.toggle('is-disabled', box.checked);
          if (box.checked && this.files.length) {
            this.files = [];
            this.renderFiles();
          }
        }
        printError(msg, scroll = true) {
          const box = this.root.querySelector('[data-print-error]');
          if (box) {
            box.textContent = msg;
            box.hidden = false;
            if (scroll) box.closest('.print')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
          // properties[Logo]: the chosen files (kept in this.files) or the 'later aanleveren' value. The print fieldset
          // is disabled for variants without print, so then neither is in the form data.
          const printBox = this.root.querySelector('[data-print]');
          const printOn = !!printBox && !printBox.disabled && !printBox.hidden;
          const later = fd.getAll('properties[Logo]').find((x) => typeof x === 'string' && x !== '');
          fd.delete('properties[Logo]');
          const files = printOn ? this.files : [];
          files.forEach((f, i) => fd.append(i ? `properties[Logo ${i + 1}]` : 'properties[Logo]', f, f.name));
          if (!files.length && later) fd.append('properties[Logo]', later);
          [...fd.keys()].forEach((k) => k.startsWith('properties[') && fd.get(k) === '' && fd.delete(k));
          if (printOn && !files.length && !later) {
            return this.printError(printBox.dataset.required || KK.strings.printRequired);
          }
          const addonItems = this.addons().map((a) => ({ id: Number(a.value), quantity: 1 }));
          this.busy(true);
          let added = null;
          try {
            if (files.length) {
              // multipart: Shopify stores each file and puts its URL in the property
              const line = await KK.cart.add(fd, { quiet: addonItems.length > 0 });
              added = line;
              if (addonItems.length) {
                try {
                  await KK.cart.add({ items: addonItems });
                } catch (err) {
                  // keep it all or nothing: take the uploaded line out again
                  await KK.cart.change(line.key, 0).catch(() => {});
                  throw err;
                }
              }
            } else {
              const properties = {};
              for (const [k, v] of fd) {
                const m = k.match(/^properties\[(.+)\]$/);
                if (m && v !== '') properties[m[1]] = v;
              }
              const main = { id: Number(fd.get('id')), quantity: Number(fd.get('quantity') || 1) };
              if (Object.keys(properties).length) main.properties = properties;
              const res = await KK.cart.add({ items: [main, ...addonItems] });
              added = res.items ? res.items[0] : res;
            }
            if (files.length) {
              this.files = [];
              this.renderFiles();
            }
            this.done();
            KK.cart.afterAdd(this.root.querySelector('.product__title')?.textContent?.trim(), added);
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
