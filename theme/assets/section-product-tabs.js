/* Producten per categorie: WAI-ARIA tabs (click, Arrow keys, Home, End); panels are server-rendered. */
if (!customElements.get('product-tabs')) {
  customElements.define(
    'product-tabs',
    class extends HTMLElement {
      connectedCallback() {
        this.tabs = [...this.querySelectorAll('[role="tab"]')];
        this.tabs.forEach((tab, i) => {
          tab.addEventListener('click', () => this.select(i));
          tab.addEventListener('keydown', (e) => {
            const last = this.tabs.length - 1;
            const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
            if (next === undefined) return;
            e.preventDefault();
            this.select(next, true);
          });
        });
      }
      select(index, focus) {
        this.tabs.forEach((tab, i) => {
          const on = i === index;
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
          tab.classList.toggle('chip--active', on);
          if (on) tab.removeAttribute('tabindex');
          else tab.setAttribute('tabindex', '-1');
          const panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        const tab = this.tabs[index];
        if (focus) tab.focus();
        const bar = tab.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth) {
          bar.scrollTo({ left: tab.offsetLeft - bar.offsetLeft - 16, behavior: 'smooth' });
        }
      }
    }
  );
}
