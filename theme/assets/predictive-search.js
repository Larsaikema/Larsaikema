/* Predictive search (ARIA combobox), see sections/predictive-search.liquid */
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
		i.addEventListener('input', () => (showClear(), this.term ? this.cur === this.start && this.close() : (this.say(''), this.open(true, this.start))));
		i.addEventListener('focus', first);
		i.addEventListener('click', () => this.cur || first());
		i.addEventListener('keydown', (e) => this.onKey(e));
		c?.addEventListener('click', () => ((i.value = ''), showClear(), this.say(''), this.close(), i.focus()));
		this.addEventListener('mousedown', (e) => e.target.closest('.predictive') && e.preventDefault());
		document.addEventListener('click', (e) => (e.target === this || !this.contains(e.target)) && this.close());
		this.addEventListener('focusout', (e) => this.contains(e.relatedTarget) || setTimeout(() => this.contains(document.activeElement) || this.close()));
		showClear();
		if (document.activeElement === i) this.term ? this.onInput() : first();
	}
	get term() {
		return this.input.value.trim();
	}
	say(t) {
		if (this.status) this.status.textContent = t;
	}
	async get(q, signal) {
		const url = `${KK.routes.predictiveSearch}?q=${encodeURIComponent(q)}&section_id=predictive-search&${this.dataset.params}`;
		const html = (this.cache[url] ||= await fetch(url, { signal }).then((r) => (r.ok ? r.text() : Promise.reject(r))));
		return KK.parse(html).querySelector('[data-predictive-inner]');
	}
	async onInput() {
		const q = this.term;
		if (this.dataset.enabled === 'false' || !this.results || !q) return;
		try {
			this.abort?.abort();
			const signal = (this.abort = new AbortController()).signal;
			let inner = await this.get(q, signal);
			if (q !== this.term) return;
			if (inner?.dataset.total < 1) {
				const i = q.lastIndexOf(' ') + 1;
				const c = [];
				for (let n = q.length - 1; n >= i + Math.max(3, (q.length - i) / 2); n--) c.push(q.slice(0, n));
				i && c.push(q.slice(0, i - 1));
				let alt;
				for (const p of c) {
					const a = await this.get(p, signal);
					if (q !== this.term) return;
					if (a.dataset.total < 1) continue;
					const j = p.lastIndexOf(' ') + 1;
					const w = p.slice(j).toLowerCase();
					const fix = p.slice(0, j) + (a.textContent.toLowerCase().split(/[^\p{L}\p{N}]+/u).find((t) => t.startsWith(w)) || w);
					const all = a.querySelector('[data-predictive-all]');
					all.href = `${KK.routes.search}?q=${encodeURIComponent(fix)}`;
					all.firstElementChild.textContent = all.textContent.replace(p, fix);
					a.insertAdjacentHTML('afterbegin', `<p class="predictive__fixed">${inner.dataset.fixTpl.replace('__FIX__', KK.escape(fix))}</p>`);
					alt = inner = a;
					break;
				}
				const list = !alt && this.start?.querySelector('[role="listbox"]')?.cloneNode(true);
				if (list) {
					list.id = 'PredictiveListbox';
					list.querySelectorAll('[id]').forEach((el) => (el.id = `nr-${el.id}`));
					inner.querySelector('.predictive__footer')?.before(list);
				}
			}
			this.results.replaceChildren(inner || '');
			this.say(inner?.dataset.status || '');
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
		this.classList.toggle('is-open', o);
		if (o) {
			const r = i.getBoundingClientRect();
			this.style.setProperty('--predictive-top', `${r.bottom + 8}px`);
			this.style.setProperty('--ps-room', `${innerWidth - r.left - 24}px`);
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
