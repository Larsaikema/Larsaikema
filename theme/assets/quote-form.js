/* Offerte form: add/remove product lines, prefill from ?product=&variant= (PDP) or ?from=cart.
   From the cart every line keeps what makes it that line: its public line-item properties (Afmeting, Oppervlakte,
   Drukpositie, Logo file links …) go into the line's details field, a made-to-measure line (_eenheid) counts as one
   piece with its billed units in the details, and an uploaded logo also fills 'Link naar logo' and 'Bedrukking: ja'. */
(() => {
  const KK = window.KK;
  // uploaded files come back as CDN URLs (https://cdn.shopify.com/…; the local preview answers /cdn/uploads/…)
  const isUrl = (v) => /^(https?:)?\/\//.test(String(v)) || /^\/cdn\//.test(String(v));
  customElements.get('quote-form') ||
    customElements.define(
      'quote-form',
      class extends HTMLElement {
        connectedCallback() {
          this.lines = this.querySelector('[data-lines]');
          this.tpl = this.querySelector('[data-line-template]');
          this.max = Number(this.dataset.max || 12);
          this.n = this.lines.children.length;
          this.addEventListener('click', (e) => {
            if (e.target.closest('[data-add-line]')) this.add();
            const rm = e.target.closest('[data-remove-line]');
            if (rm) rm.closest('[data-line]').remove();
          });
          this.prefill();
        }
        add(values = {}) {
          if (this.lines.children.length >= this.max) return null;
          this.n += 1;
          const html = this.tpl.innerHTML.replaceAll('__N__', this.n);
          this.lines.insertAdjacentHTML('beforeend', html);
          const line = this.lines.lastElementChild;
          this.fill(line, values);
          if (!values.product) line.querySelector('[data-line-product]').focus();
          return line;
        }
        fill(line, { product, variant, qty, details }) {
          const set = (sel, v) => {
            const el = line.querySelector(sel);
            if (el && v !== undefined && v !== '') el.value = v;
          };
          set('[data-line-product]', product);
          set('[data-line-variant]', variant);
          set('[data-line-qty]', qty);
          set('[data-line-details]', details);
        }
        note(text) {
          const n = this.querySelector('[data-prefill-note]');
          if (!n) return;
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
        async prefill() {
          const p = new URLSearchParams(location.search);
          try {
            if (p.get('from') === 'cart') {
              const cart = await (await fetch(`${KK.routes.cart}.js`)).json();
              if (!cart.items.length) return;
              const files = [];
              let print = false;
              cart.items.forEach((it, i) => {
                const values = this.fromCartItem(it);
                files.push(...values.files);
                print = print || values.print;
                const line = this.lines.children[i];
                if (line) this.fill(line, values);
                else this.add(values);
              });
              const logo = this.closest('form')?.querySelector('[data-logo-link]');
              if (logo && !logo.value && files.length) logo.value = files[0];
              const yes = this.closest('form')?.querySelector('[data-print-yes]');
              if (yes && print) yes.checked = true;
              this.note(this.dataset.cartNote || '');
            } else if (p.get('product')) {
              const prod = await (await fetch(`${KK.routes.root.replace(/\/$/, '')}/products/${encodeURIComponent(p.get('product'))}.js`)).json();
              const v = prod.variants.find((x) => String(x.id) === p.get('variant'));
              this.fill(this.lines.children[0], { product: prod.title, variant: v && v.title !== 'Default Title' ? v.title : '', qty: p.get('qty') || 10 });
              this.note(this.dataset.productNote || '');
            }
          } catch (e) {}
        }
      }
    );
})();
