/* Product media gallery: scroll-snap slides (swipe on mobile), thumbnails, arrows, zoom dialog, jump to variant media. */
(() => {
  const KK = window.KK;
  customElements.get('media-gallery') ||
    customElements.define(
      'media-gallery',
      class extends HTMLElement {
        connectedCallback() {
          this.slides = this.querySelector('[data-gallery-slides]');
          if (!this.slides) return;
          this.items = [...this.slides.children];
          this.thumbs = [...this.querySelectorAll('[data-gallery-thumb]')];
          this.counter = this.querySelector('[data-gallery-current]');
          this.dialog = this.querySelector('[data-gallery-dialog]');
          this.index = Number(this.dataset.start || 0);
          if (this.index) requestAnimationFrame(() => this.go(this.index, false));
          this.slides.addEventListener('scroll', KK.debounce(() => this.sync(), 60), { passive: true });
          this.addEventListener('click', (e) => {
            if (e.target.closest('[data-gallery-prev]')) return this.go(this.index - 1);
            if (e.target.closest('[data-gallery-next]')) return this.go(this.index + 1);
            const t = e.target.closest('[data-gallery-thumb]');
            if (t) return this.go(Number(t.dataset.galleryThumb));
            const z = e.target.closest('[data-gallery-zoom]');
            if (z && this.dialog) this.zoom(Number(z.dataset.galleryZoom), z);
          });
          this.slides.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.go(this.index + 1);
            if (e.key === 'ArrowLeft') this.go(this.index - 1);
          });
        }
        go(i, smooth = true) {
          const n = this.items.length;
          if (!n) return;
          this.index = (i + n) % n;
          this.slides.scrollTo({ left: this.index * this.slides.clientWidth, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
          this.mark();
        }
        sync() {
          const i = Math.round(this.slides.scrollLeft / Math.max(1, this.slides.clientWidth));
          if (i !== this.index) {
            this.index = i;
            this.mark();
          }
        }
        mark() {
          this.thumbs.forEach((t, i) => (i === this.index ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
          this.thumbs[this.index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          if (this.counter) this.counter.textContent = this.index + 1;
        }
        goToMedia(id) {
          const i = this.items.findIndex((li) => li.dataset.mediaId === String(id));
          if (i >= 0) this.go(i);
        }
        zoom(i, opener) {
          KK.openDialog(this.dialog, opener);
          const target = this.dialog.querySelector(`[data-zoom-index="${i}"]`);
          target?.scrollIntoView({ block: 'start' });
        }
      }
    );
})();
