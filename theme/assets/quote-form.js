/* Offerte form: add/remove product lines, prefill from ?product=&variant= (PDP) or ?from=cart. */
(() => {
  const KK = window.KK;
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
        fill(line, { product, variant, qty }) {
          if (product) line.querySelector('[data-line-product]').value = product;
          if (variant) line.querySelector('[data-line-variant]').value = variant;
          if (qty) line.querySelector('[data-line-qty]').value = qty;
        }
        note(text) {
          const n = this.querySelector('[data-prefill-note]');
          if (!n) return;
          n.querySelector('span').textContent = text;
          n.hidden = false;
        }
        async prefill() {
          const p = new URLSearchParams(location.search);
          try {
            if (p.get('from') === 'cart') {
              const cart = await (await fetch(`${KK.routes.cart}.js`)).json();
              if (!cart.items.length) return;
              cart.items.forEach((it, i) => {
                const values = { product: it.product_title, variant: it.variant_title || '', qty: it.quantity };
                const line = this.lines.children[i];
                if (line) this.fill(line, values);
                else this.add(values);
              });
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
