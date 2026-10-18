/* lazy product recommendations (Section Rendering API). A server-rendered list (complementary: the product's own
   cross-sells) is merged: API products first, no doubles. A section without one ('Bekijk ook') leaves out products
   another row on the page already shows. At most data-limit cards. */
customElements.get('product-recommendations') ||
  customElements.define(
    'product-recommendations',
    class extends HTMLElement {
      connectedCallback() {
        if (!this.dataset.url) return;
        const io = new IntersectionObserver(
          async ([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            let fresh;
            try {
              fresh = window.KK.parse(await (await fetch(this.dataset.url)).text()).querySelector('product-recommendations');
            } catch (err) {}
            const handles = (els) => new Set([...els].map((li) => li.dataset.handle));
            let list = this.querySelector('[data-rec-list]');
            let items = [...(fresh?.querySelectorAll('[data-rec-list] > li') || [])];
            if (list) {
              const have = handles(items);
              items.push(...[...list.children].filter((li) => !have.has(li.dataset.handle)));
            } else {
              const dup = handles(document.querySelectorAll('[data-rec-list] > li'));
              items = items.filter((li) => !dup.has(li.dataset.handle));
              if (!items.length) return (this.hidden = true);
              this.innerHTML = fresh.innerHTML;
              list = this.querySelector('[data-rec-list]');
            }
            list.replaceChildren(...items.slice(0, +this.dataset.limit || 4));
          },
          { rootMargin: '0px 0px 400px 0px' }
        );
        io.observe(this);
      }
    }
  );
