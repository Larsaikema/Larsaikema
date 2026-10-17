/* lazy product recommendations (Section Rendering API) */
customElements.get('product-recommendations') ||
  customElements.define(
    'product-recommendations',
    class extends HTMLElement {
      connectedCallback() {
        if (this.children.length || !this.dataset.url) return;
        const io = new IntersectionObserver(
          async ([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            try {
              const html = await (await fetch(this.dataset.url)).text();
              const fresh = window.KK.parse(html).querySelector('product-recommendations');
              if (fresh && fresh.children.length) this.innerHTML = fresh.innerHTML;
              else this.hidden = true;
            } catch (err) {
              this.hidden = true;
            }
          },
          { rootMargin: '0px 0px 400px 0px' }
        );
        io.observe(this);
      }
    }
  );
