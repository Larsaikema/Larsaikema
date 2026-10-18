/* Predictive search (Section Rendering API, ARIA combobox); data-params (header) adds the searched fields: sizes, SKU, tags. */
(() => {
const KK = window.KK;
class Search extends HTMLElement {
	connectedCallback() {
		if (this.input) return;
		const i = (this.input = this.querySelector('input[type="search"]'));
		const c = this.querySelector('[data-search-clear]');
		const showClear = () => c && (c.hidden = !i.value);
		this.results = this.querySelector('[data-predictive-results]');
		this.start = this.querySelector('[data-predictive-start]');
		this.status = this.querySelector('[data-predictive-status]');
		this.cache = {};
		const first = () => (this.term ? this.results?.innerHTML && this.open() : this.open(true, this.start));
		i.addEventListener('input', KK.debounce(() => this.onInput(), 220));
		i.addEventListener('input', () => (showClear(), this.term ? this.cur === this.start && this.close() : this.open(true, this.start)));
		i.addEventListener('focus', first);
		i.addEventListener('click', () => this.cur || first());
		i.addEventListener('keydown', (e) => this.onKey(e));
		c?.addEventListener('click', () => ((i.value = ''), showClear(), this.close(), i.focus()));
		document.addEventListener('click', (e) => this.contains(e.target) || this.close());
		this.addEventListener('focusout', (e) => this.contains(e.relatedTarget) || setTimeout(() => this.contains(document.activeElement) || this.close()));
		showClear();
		if (document.activeElement === i) this.term ? this.onInput() : first();
	}
	get term() {
		return this.input.value.trim();
	}
	async onInput() {
		const q = this.term;
		if (this.dataset.enabled === 'false' || !this.results || !q) return;
		const url = `${KK.routes.predictiveSearch}?q=${encodeURIComponent(q)}&section_id=predictive-search&${this.dataset.params}`;
		try {
			this.abort?.abort();
			this.abort = new AbortController();
			const html = (this.cache[url] ||= await fetch(url, { signal: this.abort.signal }).then((r) => (r.ok ? r.text() : Promise.reject(r))));
			if (q !== this.term) return;
			const inner = KK.parse(html).querySelector('[data-predictive-inner]');
			this.results.innerHTML = inner ? inner.outerHTML : '';
			if (this.status) this.status.textContent = inner?.dataset.status || '';
			this.open();
		} catch (e) {
			if (e.name !== 'AbortError') this.close();
		}
	}
	open(o = true, el = this.results) {
		const i = this.input;
		o &&= !!el;
		[this.results, this.start].forEach((p) => p && (p.hidden = !o || p !== el));
		this.cur = o ? el : null;
		const list = o && el.querySelector('[role="listbox"]');
		if (o) {
			this.style.setProperty('--predictive-top', `${this.getBoundingClientRect().bottom + 8}px`);
			document.querySelectorAll('mega-menu.is-open').forEach((m) => m.close(0));
		}
		list ? i.setAttribute('aria-controls', list.id) : i.removeAttribute('aria-controls');
		i.setAttribute('aria-expanded', !!list);
		i.removeAttribute('aria-activedescendant');
	}
	close() {
		this.open(false);
	}
	onKey(e) {
		const p = this.cur;
		if (e.key === 'Escape') return p && (e.preventDefault(), this.close());
		if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key) || !p) return;
		const items = [...p.querySelectorAll('[role="option"]')];
		let i = items.findIndex((el) => el.getAttribute('aria-selected') === 'true');
		if (e.key === 'Enter') return i >= 0 && (e.preventDefault(), items[i].click());
		if (!items.length) return;
		e.preventDefault();
		if (i >= 0) items[i].setAttribute('aria-selected', 'false');
		i = (i + (e.key === 'ArrowDown' ? 1 : items.length - 1 + (i < 0))) % items.length;
		items[i].setAttribute('aria-selected', 'true');
		items[i].scrollIntoView({ block: 'nearest' });
		this.input.setAttribute('aria-activedescendant', items[i].id);
	}
}
customElements.get('predictive-search') || customElements.define('predictive-search', Search);
})();
