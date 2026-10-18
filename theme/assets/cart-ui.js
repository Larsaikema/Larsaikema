/* cart UI (drawer + page). Notes: snippets/cart-line */
(() => {
const KK = window.KK, cart = KK?.cart;
if (!cart || KK.cartUi) return;
KK.cartUi = 1;
const d = document, $ = (s, r = d) => r.querySelector(s);
const say = (row, text) => {
	const b = row && $('[data-line-error]', row);
	if (b) (b.textContent = text), (b.hidden = !text), $('.cart-line__stock', row)?.toggleAttribute('hidden', !!text);
	return b;
};
const msg = $('cart-drawer')?.dataset || {}, wait = new Map(), last = new WeakMap();
const sync = (i) => i.closest('quantity-input')?.sync?.(), reset = (i) => (last.delete(i), (i.value = i.defaultValue), sync(i));
Object.assign(cart, {
	show(x) {
		cart.render(x.sections);
		KK.updateCartCount(x);
		KK.emit('cart:changed', x);
		// the subtotal as shown
		const r = $('#CartDrawer[open] .cart-summary__row dd,.cart-page .cart-summary__row dd'), ex = d.documentElement.dataset.vat == 'excl' ? ` ${KK.strings.excl}` : '';
		cart.say((x.item_count ? msg.msgUpdated?.replace('__TOTAL__', r ? r.innerText.trim() + ex : KK.formatMoney(KK.vatShown(x.total_price))) : msg.msgEmpty) || '');
		return x;
	},
	post: (u, p, quiet) => cart.req(u, p, quiet).then((x) => (quiet ? x : cart.show(x))),
	change: (key, quantity) => cart.post(`${KK.routes.cartChange}.js`, { [typeof key == 'string' ? 'id' : 'line']: key, quantity }),
	flush() {
		const w = [...wait.values()];
		wait.clear();
		w.forEach((go) => (clearTimeout(go.t), go()));
	},
	keep(root) {
		const a = d.activeElement;
		if (a == root || !root.contains(a)) return;
		const g = a.closest('[data-refocus]'), k = g?.dataset.refocus, grp = (r) => [...r.querySelectorAll(`[data-refocus="${k}"]`)], gi = k && grp(root).indexOf(g), v = last.get(a) != a.value && a.value != a.defaultValue && a.value;
		return (r) => {
			const l = k && grp(r);
			let t = a.id && d.getElementById(a.id);
			if (t && v) t.value = v;
			t ||= (l && $('[data-refocus-target]', l[Math.min(gi, l.length - 1)] || r)) || $('[data-refocus-fallback]', r);
			t?.focus({ preventScroll: true });
			t?.scrollIntoView({ block: 'nearest' });
		};
	},
});

customElements.get('cart-items') || customElements.define('cart-items', class extends HTMLElement {
	connectedCallback() {
		const adj = (n) => this.dataset.msgAdjusted.replace('__COUNT__', n);
		this.addEventListener('change', (e) => {
			const i = e.target, row = i.closest('.cart-line'), key = row?.dataset.key;
			if (!this.isConnected || !key || !i.matches('[name="updates[]"]') || last.get(i) == i.value) return;
			const m = this.check(i);
			clearTimeout(wait.get(key)?.t);
			wait.delete(key);
			say(row, m);
			m ? i.setAttribute('aria-invalid', 'true') : i.removeAttribute('aria-invalid');
			if (m) return reset(i), i.select();
			const want = +i.value, st = +i.dataset.stock, v = st && want > st ? st : want;
			if (v != want) (i.value = v), sync(i);
			last.set(i, i.value);
			if (v == i.defaultValue) return v != want && say(row, adj(v));
			const go = () => (wait.delete(key), this.update(key, v, i, want));
			go.t = setTimeout(go, 350);
			wait.set(key, go);
		});
		this.addEventListener('keydown', (e) => {
			if (e.key != 'Enter' || !e.target.matches('[name="updates[]"]')) return;
			e.preventDefault();
			e.target.dispatchEvent(new Event('change', { bubbles: true }));
		});
		this.addEventListener('click', (e) => {
			const rm = e.target.closest('[data-cart-remove]');
			if (rm) e.preventDefault(), this.update(rm.closest('.cart-line').dataset.key, 0, rm);
		});
	}
	check(i) {
		const s = i.value.trim(), v = +s, min = +i.dataset.min || 1, step = +i.step || 1, m = (k, n) => this.dataset[k].replace('__COUNT__', n);
		if (!/^\d+$/.test(s)) return m('msgWhole');
		if (!v) return '';
		if (v < min) return m('msgMin', min);
		if (i.max && v > +i.max && !i.dataset.stock) return m('msgMax', i.max);
		return v % step ? m('msgStep', step) : '';
	}
	async update(key, q, src, want = q) {
		const row = src.closest('.cart-line'), fresh = () => $(`cart-items[data-section-id="${this.dataset.sectionId}"] .cart-line[data-key="${CSS.escape(key)}"]`) || row;
		row?.classList.add('is-updating');
		this.setAttribute('aria-busy', 'true');
		try {
			const got = (await cart.change(key, q)).items?.find((x) => x.key == key);
			if (q && got && got.quantity < want) say(fresh(), this.dataset.msgAdjusted.replace('__COUNT__', got.quantity));
		} catch (err) {
			if (src.matches('input')) reset(src);
			say(fresh(), err.message) || KK.toast(KK.escape(err.message), 'error');
			fresh()?.classList.remove('is-updating');
		}
		this.removeAttribute('aria-busy');
	}
});
})();
