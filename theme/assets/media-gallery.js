/* Product media gallery (main-product): scroll-snap slides, thumbnails, arrows, zoom dialog, variant media; slides out
   of view are inert (WCAG 2.4.3); the thumbnail strip scrolls by itself, never the page. */
(() => {
const KK = window.KK;
class MediaGallery extends HTMLElement {
	connectedCallback() {
		this.slides = this.querySelector('[data-gallery-slides]');
		if (!this.slides) return;
		this.items = [...this.slides.children];
		this.thumbs = [...this.querySelectorAll('[data-gallery-thumb]')];
		this.counter = this.querySelector('[data-gallery-current]');
		this.dialog = this.querySelector('[data-gallery-dialog]');
		this.index = +this.dataset.start || 0;
		this.index ? requestAnimationFrame(() => this.go(this.index, false)) : this.mark();
		this.slides.addEventListener('scroll', KK.debounce(() => this.sync(), 60), { passive: true });
		this.addEventListener('click', (e) => {
			const c = (s) => e.target.closest(s);
			if (c('[data-gallery-prev]')) return this.go(this.index - 1);
			if (c('[data-gallery-next]')) return this.go(this.index + 1);
			const t = c('[data-gallery-thumb]');
			if (t) return this.go(+t.dataset.galleryThumb);
			const z = c('[data-gallery-zoom]');
			if (z && this.dialog) {
				KK.openDialog(this.dialog, z);
				this.dialog.querySelector(`[data-zoom-index="${z.dataset.galleryZoom}"]`)?.scrollIntoView({ block: 'start' });
			}
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
		if (i !== this.index) (this.index = i), this.mark();
	}
	mark() {
		this.items.forEach((li, i) => (li.inert = i !== this.index));
		this.thumbs.forEach((t, i) => (i === this.index ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
		const t = this.thumbs[this.index];
		const strip = t?.parentElement.parentElement;
		if (t && strip.scrollWidth > strip.clientWidth) {
			const left = t.offsetLeft - strip.offsetLeft;
			if (left < strip.scrollLeft || left + t.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: Math.max(0, left - (strip.clientWidth - t.offsetWidth) / 2), behavior: 'instant' });
		}
		if (this.counter) this.counter.textContent = this.index + 1;
	}
	goToMedia(id) {
		const i = this.items.findIndex((li) => li.dataset.mediaId === String(id));
		if (i >= 0) this.go(i);
	}
}
customElements.get('media-gallery') || customElements.define('media-gallery', MediaGallery);
})();
