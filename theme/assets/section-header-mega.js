/* Desktop mega menu (disclosure with top-level links): the chevron toggles on click/Enter/Space, fine-pointer hover opens after 120 ms (160 to switch), Esc closes */
(() => {
const { load, ready, busy, $$ } = window.KK.hdr;
const fine = matchMedia('(hover:hover) and (pointer:fine)');
const opened = () => $$('mega-menu.is-open');
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape')
		$$('mega-menu').forEach((m) => {
			if (!m.isOpen && !m.want) return;
			const f = m.contains(document.activeElement);
			m.close(0);
			m.hold = m.matches(':hover');
			if (f) m.trigger.focus();
		});
});
document.addEventListener('click', (e) => opened().forEach((m) => m.contains(e.target) || m.close(0)));
addEventListener('resize', () => opened().forEach((m) => m.fit()), { passive: true });
class Mega extends HTMLElement {
	connectedCallback() {
		this.trigger = this.querySelector('[data-mega-trigger]');
		this.panel = this.querySelector('[data-mega-panel]');
		this.panel.inert = !this.isOpen;
		this.addEventListener('mouseenter', () => fine.matches && !this.hold && this.open(opened().some((m) => m !== this) ? 160 : 120, 'hover'));
		this.addEventListener('mouseleave', () => {
			this.hold = false;
			if (fine.matches && (this.isOpen ? this.by === 'hover' : this.want === 'hover')) this.close(180);
		});
		this.trigger.addEventListener('click', () => (this.isOpen && this.by === 'hover' ? (this.by = 'click') : this.isOpen ? this.close(0) : this.open(0, 'click')));
		this.addEventListener('focusout', (e) => e.relatedTarget && !this.contains(e.relatedTarget) && this.close(0));
		if (fine.matches && this.matches(':hover')) this.open(120, 'hover');
	}
	get isOpen() {
		return this.classList.contains('is-open');
	}
	open(ms, by) {
		clearTimeout(this.t);
		this.want = by;
		this.t = setTimeout(() => {
			const t = this.trigger;
			const css = this.closest('.header-wrap')?.dataset.megaCss;
			busy(t, !ready(css));
			load(css, 1).then(
				() => {
					busy(t, false);
					if (this.want !== by) return;
					opened().forEach((m) => m !== this && m.close(0));
					$$('predictive-search').forEach((s) => s.close?.());
					this.by = by;
					$$('img', this.panel).forEach((i) => (i.loading = 'eager'));
					this.set(true);
				},
				() => (busy(t, false), this.want === by && by !== 'hover' && (location.href = t.dataset.url))
			);
		}, ms);
	}
	close(ms) {
		clearTimeout(this.t);
		this.want = null;
		busy(this.trigger, false);
		this.t = setTimeout(() => this.set(false), ms);
	}
	set(o) {
		if (o) this.fit();
		this.classList.toggle('is-open', o);
		this.trigger.setAttribute('aria-expanded', o);
		this.panel.inert = !o;
	}
	fit() {
		const p = this.panel;
		if (!p.classList.contains('mega--compact')) return;
		p.style.translate = '';
		const r = p.getBoundingClientRect();
		const o = Math.max(0, r.right - document.documentElement.clientWidth + 24) || Math.min(0, r.left - 24);
		if (o) p.style.translate = `${-o}px 0`;
	}
}
customElements.get('mega-menu') || customElements.define('mega-menu', Mega);
})();
