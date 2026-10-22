/* Offerte form (sections/page-offerte.liquid): product lines (add, remove, renumber, details toggle), catalogue match per line
   (a known product title turns 'uitvoering' into a list of its variants and shows image, link and shop price), a live summary
   in the side column, prefill from ?product=&variant=&qty= (PDP) or ?from=cart, and a 'take over my cart' button.
   From the cart every line keeps what makes it that line: its public line-item properties (Afmeting, Oppervlakte,
   Drukpositie, Logo file links …) go into the line's details field, a made-to-measure line (_eenheid) counts as one
   piece with its billed units in the details, and an uploaded logo also fills 'Link naar logo' and 'Bedrukking: ja'. */
(() => {
  const KK = window.KK || {};
  const root = () => ((KK.routes && KK.routes.root) || '/').replace(/\/$/, '');
  // uploaded files come back as CDN URLs (https://cdn.shopify.com/…; the local preview answers /cdn/uploads/…)
  const isUrl = (v) => /^(https?:)?\/\//.test(String(v)) || /^\/cdn\//.test(String(v));
  const esc = (s) => (KK.escape ? KK.escape(s) : String(s));
  const money = (c) => (KK.formatMoney ? KK.formatMoney(c) : `€ ${(c / 100).toFixed(2)}`);
  const cache = {};
  const getProduct = (handle) =>
    (cache[handle] = cache[handle] || fetch(`${root()}/products/${encodeURIComponent(handle)}.js`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  const sized = (src, w) => (src ? `${src}${src.includes('?') ? '&' : '?'}width=${w}` : '');

  customElements.get('quote-form') ||
    customElements.define(
      'quote-form',
      class extends HTMLElement {
        connectedCallback() {
          this.form = this.closest('form');
          this.lines = this.querySelector('[data-lines]');
          this.tpl = this.querySelector('[data-line-template]');
          this.max = Number(this.dataset.max || 12);
          this.n = this.lines.children.length;
          this.side = document.querySelector('[data-quote-summary]');
          this.list = this.querySelector('datalist');
          this.addEventListener('click', (e) => this.onClick(e));
          this.form.addEventListener('input', KK.debounce ? KK.debounce(() => this.update(), 150) : () => this.update());
          this.form.addEventListener('change', (e) => {
            if (e.target.matches('[data-line-product]')) this.match(e.target.closest('[data-line]'));
            if (e.target.matches('[data-line-variant-select]')) this.showMatch(e.target.closest('[data-line]'));
            this.update();
          });
          // fields of a part that does not apply stay out of the e-mail (print details without print, ground without ballast advice)
          this.form.addEventListener('submit', () => {
            const ballast = this.form.querySelector('[data-ballast]');
            this.form.querySelectorAll('.qt-reveal--ballast select').forEach((el) => (el.disabled = !!ballast && !ballast.checked));
            const none = this.form.querySelector('[name="contact[Bedrukking]"]:checked:not([data-print-yes]):not([data-print-unsure])');
            this.form.querySelectorAll('.qt-reveal--print input').forEach((el) => (el.disabled = !!none && !el.value));
          });
          const date = this.form.querySelector('[data-quote-date]');
          if (date) {
            const d = new Date(Date.now() + 864e5);
            date.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          this.prefill().then(() => this.offerCart());
          this.update();
        }
        onClick(e) {
          if (e.target.closest('[data-add-line]')) this.add();
          const rm = e.target.closest('[data-remove-line]');
          if (rm) {
            const line = rm.closest('[data-line]');
            const next = line.nextElementSibling || line.previousElementSibling;
            line.remove();
            this.renumber();
            this.update();
            (next && next.querySelector('[data-line-product]'))?.focus();
          }
          const more = e.target.closest('[data-details-toggle]');
          if (more) this.toggleDetails(more.closest('[data-line]'), true);
          if (e.target.closest('[data-import-cart]')) this.fromCart(true);
        }
        toggleDetails(line, focus) {
          const box = line.querySelector('.qt-line__details');
          const btn = line.querySelector('[data-details-toggle]');
          box.hidden = false;
          btn.hidden = true;
          btn.setAttribute('aria-expanded', 'true');
          if (focus) box.querySelector('input').focus();
        }
        renumber() {
          [...this.lines.children].forEach((line, i) => {
            const num = line.querySelector('[data-line-num]');
            if (num) num.textContent = (this.dataset.lineLabel || '__N__').replace('__N__', i + 1);
            const rm = line.querySelector('[data-remove-line]');
            if (rm) rm.hidden = this.lines.children.length === 1;
            // the e-mail lists the fields by name: keep 'Regel 1, 2, 3' in order after a line is removed
            line.querySelectorAll('[name^="contact[Regel "]').forEach((el) => (el.name = el.name.replace(/^contact\[Regel [^ ]+ -/, `contact[Regel ${i + 1} -`)));
          });
          const add = this.querySelector('[data-add-line]');
          if (add) add.hidden = this.lines.children.length >= this.max;
        }
        add(values = {}) {
          if (this.lines.children.length >= this.max) return null;
          this.n += 1;
          this.lines.insertAdjacentHTML('beforeend', this.tpl.innerHTML.replaceAll('__N__', this.n));
          const line = this.lines.lastElementChild;
          line._job = this.fill(line, values);
          this.renumber();
          if (!values.product) line.querySelector('[data-line-product]').focus();
          return line;
        }
        fill(line, { product, variant, qty, details }) {
          const set = (sel, v) => {
            const el = line.querySelector(sel);
            if (el && v !== undefined && v !== null && v !== '') el.value = v;
          };
          set('[data-line-product]', product);
          set('[data-line-variant]', variant);
          set('[data-line-qty]', qty);
          set('[data-line-details]', details);
          if (details) this.toggleDetails(line, false);
          line.querySelector('quantity-input')?.sync?.();
          if (product) return this.match(line, variant);
          return Promise.resolve();
        }
        handleFor(title) {
          // '3 × 3 m', '3x3 m' and '3 x 3 m' are the same product title
          const norm = (v) => String(v || '').toLowerCase().replace(/×/g, 'x').replace(/\s+/g, ' ').replace(/(\d)\s*x\s*(\d)/g, '$1x$2').trim();
          const t = norm(title);
          if (!t || !this.list) return null;
          const opt = [...this.list.options].find((o) => norm(o.value) === t);
          return opt ? opt.dataset.handle : null;
        }
        async match(line, wanted) {
          const input = line.querySelector('[data-line-variant]');
          const select = line.querySelector('[data-line-variant-select]');
          const label = line.querySelector('[data-variant-label]');
          const prod = line.querySelector('[data-line-product]');
          const handle = this.handleFor(prod.value);
          const p = handle ? await getProduct(handle) : null;
          if (p && p.title) prod.value = p.title;
          line._product = p;
          const multi = p && p.variants && p.variants.length > 1;
          if (multi) {
            const keep = wanted || (select.disabled ? input.value : select.value);
            select.length = 1;
            p.variants.forEach((v) => select.add(new Option(v.title, v.title)));
            const hit = [...select.options].find((o) => o.value && keep && o.value.toLowerCase() === String(keep).toLowerCase());
            if (hit) hit.selected = true;
            else if (keep && select.disabled) select.selectedIndex = 0;
          }
          select.hidden = select.disabled = !multi;
          input.hidden = input.disabled = !!multi;
          label.htmlFor = multi ? select.id : input.id;
          this.showMatch(line);
          this.update();
        }
        showMatch(line) {
          const box = line.querySelector('[data-line-match]');
          const p = line._product;
          if (!p) {
            box.hidden = true;
            box.innerHTML = '';
            return;
          }
          const select = line.querySelector('[data-line-variant-select]');
          const v = (!select.disabled && p.variants.find((x) => x.title === select.value)) || null;
          const img = (v && v.featured_image && v.featured_image.src) || p.featured_image;
          const cents = v ? v.price : p.price_min !== undefined ? p.price_min : p.price;
          const excl = document.documentElement.dataset.vat === 'excl';
          const shown = KK.vatShown ? KK.vatShown(cents, excl) : cents;
          const from = !v && p.price_varies ? `${esc(this.dataset.from || 'vanaf')} ` : '';
          box.innerHTML = `${img ? `<img src="${esc(sized(img, 160))}" alt="" width="56" height="56" loading="lazy">` : ''}<span><a href="${esc(
            `${root()}/products/${p.handle}${v ? `?variant=${v.id}` : ''}`
          )}" target="_blank" rel="noopener">${esc(p.title)}</a><small>${from}${esc(money(shown))} ${esc(excl ? this.dataset.excl : this.dataset.incl)} ${esc(
            this.dataset.perPiece || ''
          )}</small></span>`;
          box.hidden = false;
        }
        update() {
          const lines = [...this.lines.children]
            .map((line) => {
              const sel = line.querySelector('[data-line-variant-select]');
              return {
                product: line.querySelector('[data-line-product]').value.trim(),
                variant: (sel && !sel.disabled ? sel.value : line.querySelector('[data-line-variant]').value).trim(),
                qty: Math.max(0, parseInt(line.querySelector('[data-line-qty]').value, 10) || 0),
              };
            })
            .filter((l) => l.product);
          const pieces = lines.reduce((n, l) => n + l.qty, 0);
          const total = this.querySelector('[data-lines-total]');
          if (total) total.textContent = lines.length ? (this.dataset.linesLabel || '').replace('__LINES__', lines.length).replace('__COUNT__', pieces) : '';
          const s = this.side;
          if (!s) return;
          s.querySelector('[data-summary-empty]').hidden = lines.length > 0;
          s.querySelector('[data-summary-lines]').innerHTML = lines
            .map((l) => `<li><strong>${l.qty ? `${l.qty}×` : '–'}</strong><span>${esc(l.product)}${l.variant ? `<small>${esc(l.variant)}</small>` : ''}</span></li>`)
            .join('');
          s.querySelector('[data-summary-facts]').hidden = !lines.length;
          const put = (k, v) => {
            const dd = s.querySelector(`[data-sum="${k}"]`);
            if (dd) dd.textContent = v;
            const row = s.querySelector(`[data-sum-row="${k}"]`);
            if (row) row.hidden = !v;
          };
          put('pieces', (this.dataset.pieces || '__COUNT__').replace('__COUNT__', pieces));
          const pr = this.form.querySelector('[name="contact[Bedrukking]"]:checked');
          put('print', pr ? pr.value : '');
          const date = this.form.querySelector('[data-quote-date]');
          let dv = '';
          if (date && date.value) {
            const d = new Date(`${date.value}T12:00:00`);
            dv = isNaN(d) ? date.value : d.toLocaleDateString(document.documentElement.lang || 'nl', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
          }
          put('date', dv);
          const place = this.form.querySelector('[data-quote-place]');
          put('place', place ? place.value.trim() : '');
        }
        note(text) {
          const n = this.querySelector('[data-prefill-note]');
          if (!n || !text) return;
          n.querySelector('span').textContent = text;
          n.hidden = false;
        }
        fromCartItem(it) {
          const props = Object.entries(it.properties || {}).filter(([k, v]) => v !== null && v !== '' && !k.startsWith('_'));
          const unit = it.properties && it.properties._eenheid;
          const parts = props.map(([k, v]) => `${k}: ${isUrl(v) ? new URL(v, location.origin).href : v}`);
          // made to measure: quantity = billed m²/m; the quote asks for one piece of that size
          if (unit && !props.some(([, v]) => String(v).includes(unit))) parts.push(`${it.quantity} ${unit}`);
          return {
            product: it.product_title,
            variant: it.variant_title || '',
            qty: unit ? 1 : it.quantity,
            details: parts.join(' · '),
            files: props.filter(([, v]) => isUrl(v)).map(([, v]) => new URL(v, location.origin).href),
            print: props.some(([k]) => /^(logo|drukpositie|bedrukking)/i.test(k)),
          };
        }
        async cart() {
          if (!this._cart) this._cart = fetch(`${(KK.routes && KK.routes.cart) || '/cart'}.js`).then((r) => r.json()).catch(() => null);
          return this._cart;
        }
        async fromCart(focus) {
          const cart = await this.cart();
          if (!cart || !cart.items || !cart.items.length) return;
          // replace empty lines first, keep what the visitor already typed
          [...this.lines.children].forEach((l) => {
            if (!l.querySelector('[data-line-product]').value.trim() && this.lines.children.length > 1) l.remove();
          });
          const files = [];
          let print = false;
          const jobs = cart.items.map((it) => {
            const values = this.fromCartItem(it);
            files.push(...values.files);
            print = print || values.print;
            const empty = [...this.lines.children].find((l) => !l.querySelector('[data-line-product]').value.trim());
            if (empty) return this.fill(empty, values);
            const line = this.add(values);
            return line ? line._job : null;
          });
          const logo = this.form.querySelector('[data-logo-link]');
          if (logo && !logo.value && files.length) logo.value = files[0];
          const yes = this.form.querySelector('[data-print-yes]');
          if (yes && print) yes.checked = true;
          this.renumber();
          this.note(this.dataset.cartNote || '');
          const btn = this.querySelector('[data-import-cart]');
          if (btn) btn.hidden = true;
          await Promise.all(jobs.filter(Boolean));
          this.update();
          if (focus) this.querySelector('[data-prefill-note]')?.scrollIntoView({ block: 'nearest' });
        }
        async offerCart() {
          const btn = this.querySelector('[data-import-cart]');
          if (!btn || new URLSearchParams(location.search).get('from') === 'cart') return;
          const cart = await this.cart();
          const count = cart && cart.items ? cart.items.length : 0;
          if (!count) return;
          const label = btn.querySelector('[data-import-label]');
          label.textContent = (label.dataset.importLabel || '').replace('__COUNT__', count);
          btn.hidden = false;
        }
        async prefill() {
          const p = new URLSearchParams(location.search);
          try {
            if (p.get('from') === 'cart') {
              await this.fromCart(false);
            } else if (p.get('product')) {
              const prod = await getProduct(p.get('product'));
              if (!prod) return;
              const v = prod.variants.find((x) => String(x.id) === p.get('variant'));
              await this.fill(this.lines.children[0], { product: prod.title, variant: v && v.title !== 'Default Title' ? v.title : '', qty: p.get('qty') || 10 });
              this.note(this.dataset.productNote || '');
            }
          } catch (e) {}
          this.renumber();
        }
      }
    );
})();
